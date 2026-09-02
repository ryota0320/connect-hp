import { chromium } from 'playwright-core';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const baseUrl = process.env.TEST_URL || 'http://127.0.0.1:5174/';
const targets = ['about', 'service', 'company', 'news', 'contact'];

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  for (const target of targets) {
    await page.goto(`${baseUrl}?motion=off`, { waitUntil: 'networkidle' });

    if (viewport.name === 'mobile') {
      await page.locator('[data-menu-button]').click();
      await page.locator(`[data-mobile-menu] a[href="#${target}"]`).click();
    } else {
      await page.locator(`.global-nav a[href="#${target}"]`).click();
    }

    await page.waitForFunction(
      (id) => Math.abs(document.getElementById(id)?.getBoundingClientRect().top ?? -9999) <= 100,
      target,
      { timeout: 5000 },
    );
    await page.waitForTimeout(350);
    const state = await page.evaluate((id) => {
      const section = document.getElementById(id);
      return {
        hash: window.location.hash,
        targetTop: Math.round(section?.getBoundingClientRect().top ?? -9999),
        menuClosed: document.querySelector('[data-mobile-menu]')?.getAttribute('aria-hidden'),
      };
    }, target);

    const passed = state.hash === `#${target}` && Math.abs(state.targetTop) <= 5
      && (viewport.name !== 'mobile' || state.menuClosed === 'true');
    results.push({ viewport: viewport.name, target, passed, ...state });
  }

  await context.close();
}

await browser.close();

if (results.some(({ passed }) => !passed)) {
  console.error(JSON.stringify(results, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(results, null, 2));
}
