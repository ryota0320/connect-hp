import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const baseUrl = process.env.TEST_URL || 'http://127.0.0.1:4173/';
const viewports = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'tablet-1024', width: 1024, height: 900 },
  { name: 'tablet-768', width: 768, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-320', width: 320, height: 720 },
];
const routes = [
  '/',
  '/about/',
  '/service/',
  '/service/facility/',
  '/service/energy/',
  '/service/solar/',
  '/service/support/',
  '/service/human-resources/',
  '/service/lifestyle/',
  '/company/',
  '/news/',
  '/contact/',
  '/privacy/',
];

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(`${baseUrl}?motion=off`, { waitUntil: 'networkidle' });
  const state = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.textContent?.trim(),
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    priorityImagesLoaded: [...document.querySelectorAll('img:not([loading="lazy"])')]
      .every((image) => image.complete && image.naturalWidth > 0),
  }));

  if (viewport.name === 'desktop-1440') {
    await page.screenshot({ path: 'artifacts/top-desktop.png' });
    await page.locator('.service-list > .service-item:first-child').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'artifacts/service-desktop.png' });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'artifacts/top-fullpage.png', fullPage: true });
  }

  if (viewport.name === 'mobile-390') {
    await page.screenshot({ path: 'artifacts/top-mobile.png' });
    const menuButton = page.locator('[data-menu-button]');
    await menuButton.click();
    await page.waitForTimeout(100);
    const open = await menuButton.getAttribute('aria-expanded');
    const menuVisible = await page.locator('[data-mobile-menu]').isVisible();
    await page.screenshot({ path: 'artifacts/menu-mobile.png' });
    await page.keyboard.press('Escape');
    const closed = await menuButton.getAttribute('aria-expanded');
    state.menu = { open, menuVisible, closed };
  }

  results.push({ viewport: viewport.name, ...state, errors });
  await context.close();
}

const reducedContext = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' });
results.push({
  viewport: 'mobile-375-reduced-motion',
  visibleAnimatedElements: await reducedPage.locator('[data-animation="fade-up"]').count(),
  hiddenAnimatedElements: await reducedPage.locator('[data-animation="fade-up"]:not(:visible)').count(),
});
await reducedContext.close();

const motionContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const motionPage = await motionContext.newPage();
await motionPage.goto(baseUrl, { waitUntil: 'networkidle' });
await motionPage.waitForTimeout(1900);
results.push({
  viewport: 'desktop-1440-animation-finished',
  heroLineOpacity: await motionPage.locator('[data-hero-line]').first().evaluate((element) => getComputedStyle(element).opacity),
  heroImageClipPath: await motionPage.locator('[data-hero-image]').evaluate((element) => getComputedStyle(element).clipPath),
});
await motionContext.close();

for (const viewport of [{ name: 'pages-desktop', width: 1440, height: 1000 }, { name: 'pages-mobile', width: 390, height: 844 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  for (const route of routes) {
    const errors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${new URL(route, baseUrl)}?motion=off`, { waitUntil: 'networkidle' });
    const state = await page.evaluate(() => ({
      title: document.title,
      heading: document.querySelector('h1')?.textContent?.trim(),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      unresolvedInclude: document.documentElement.innerHTML.includes('@include:'),
    }));
    results.push({ viewport: viewport.name, route, status: response?.status(), ...state, errors });

    if (viewport.name === 'pages-desktop' && ['/about/', '/service/', '/contact/'].includes(route)) {
      await page.screenshot({ path: `artifacts/${route.split('/').filter(Boolean)[0]}-desktop.png` });
    }
    if (viewport.name === 'pages-mobile' && ['/service/', '/service/human-resources/', '/contact/'].includes(route)) {
      const name = route.split('/').filter(Boolean).join('-');
      await page.screenshot({ path: `artifacts/${name}-mobile.png` });
    }
  }

  await context.close();
}

const contactContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const contactPage = await contactContext.newPage();
await contactPage.goto(`${new URL('/contact/', baseUrl)}?subject=energy&motion=off`, { waitUntil: 'networkidle' });
const preselectedSubject = await contactPage.locator('#subject').inputValue();
await contactPage.locator('.form-submit').click();
results.push({
  viewport: 'contact-validation',
  preselectedSubject,
  statusMessage: await contactPage.locator('[data-form-status]').innerText(),
  nameInvalid: await contactPage.locator('#name').getAttribute('aria-invalid'),
});
await contactContext.close();

const ogContext = await browser.newContext({ viewport: { width: 1200, height: 630 } });
const ogPage = await ogContext.newPage();
await ogPage.goto(`${baseUrl}?motion=off`, { waitUntil: 'networkidle' });
await ogPage.screenshot({ path: 'assets/images/hero.jpg', type: 'jpeg', quality: 86 });
results.push({ viewport: 'og-image-1200x630', generated: true });
await ogContext.close();

await browser.close();
console.log(JSON.stringify(results, null, 2));
