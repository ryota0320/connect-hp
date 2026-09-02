import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const baseUrl = process.env.TEST_URL || 'http://127.0.0.1:5174/';
const expectedLines = ['つなぐことで、', '企業の未来を、', 'もっと良くする。'];
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`${baseUrl}?motion=off`, { waitUntil: 'networkidle' });

  const state = await page.locator('.about__lead').evaluate((element) => {
    const body = document.querySelector('.about__body');
    const heading = document.querySelector('.about .section-heading');
    const leadRect = element.getBoundingClientRect();
    const bodyRect = body.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    const lines = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      .map((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return { text: node.textContent.trim(), top: Math.round(rect.top), right: Math.round(rect.right) };
      });

    return {
      lines,
      whiteSpace: getComputedStyle(element).whiteSpace,
      viewportWidth: window.innerWidth,
      topNewsStripRemoved: document.querySelector('.news-strip') === null,
      heroDividerVisible: document.querySelector('.hero-divider')?.getBoundingClientRect().height > 0,
      heroScrollTarget: document.querySelector('.hero__scroll')?.getAttribute('href'),
      layout: {
        headingWidth: Math.round(headingRect.width),
        leadWidth: Math.round(leadRect.width),
        bodyWidth: Math.round(bodyRect.width),
        headingToLead: Math.round(leadRect.left - headingRect.right),
        leadToBody: Math.round(bodyRect.left - leadRect.right),
      },
    };
  });

  await page.locator('#about').screenshot({ path: `artifacts/about-balanced-${viewport.name}.png` });
  if (viewport.name === 'desktop') {
    await page.evaluate(() => window.scrollTo({ top: document.getElementById('about').offsetTop - 220, behavior: 'instant' }));
    await page.screenshot({ path: 'artifacts/hero-about-transition-desktop.png' });
  }

  const distinctRows = new Set(state.lines.map(({ top }) => top)).size;
  const passed = state.whiteSpace === 'nowrap'
    && distinctRows === 3
    && state.lines.every(({ text, right }, index) => text === expectedLines[index] && right <= state.viewportWidth)
    && state.topNewsStripRemoved
    && state.heroDividerVisible
    && state.heroScrollTarget === '#about'
    && (viewport.name !== 'desktop' || (state.layout.bodyWidth >= 300 && state.layout.leadToBody >= 40));
  results.push({ viewport: viewport.name, passed, ...state });
  await context.close();
}

await browser.close();

if (results.some(({ passed }) => !passed)) {
  console.error(JSON.stringify(results, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(results, null, 2));
}
