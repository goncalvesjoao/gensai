import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('floating controls offer independent search, device and horizontal zoom', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    let searches = 0;
    await page.route('https://photon.komoot.io/api/**', (route) => {
      searches++;
      return route.fulfill({
        json: { type: 'FeatureCollection', features: [] },
      });
    });
    await page.addInitScript(() => {
      window.locationRequests = 0;
      navigator.geolocation.getCurrentPosition = () =>
        window.locationRequests++;
    });
    await page.goto(base);
    const location = page.getByRole('button', {
      name: 'Use my location',
      exact: true,
    });
    await location.waitFor();
    assert.equal(await page.evaluate(() => window.locationRequests), 0);
    await page.getByRole('searchbox').fill('Tokyo');
    await page.getByRole('searchbox').press('Enter');
    await page
      .getByText('No supported Japan results.', { exact: false })
      .waitFor();
    assert.equal(searches, 1);
    await location.click();
    assert.equal(await page.evaluate(() => window.locationRequests), 1);
    assert.equal(searches, 1);
    const minus = await page
      .getByRole('button', { name: 'Zoom out', exact: true })
      .boundingBox();
    const plus = await page
      .getByRole('button', { name: 'Zoom in', exact: true })
      .boundingBox();
    assert.equal(minus.y, plus.y);
    assert.ok(minus.x < plus.x);
  } finally {
    await browser.close();
  }
});

test('preferences retain localized public URLs and visible controls at phone and computer widths', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const width of [390, 1440]) {
      for (const locale of ['en', 'ja']) {
        for (const theme of ['light', 'dark']) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            colorScheme: theme,
          });
          await page.goto(
            `${base}${locale === 'ja' ? '/ja' : '/'}?view=hazards#map`,
          );
          const themeButton = page.locator('#theme-toggle');
          await themeButton.click();
          assert.equal(
            await page.locator('html').getAttribute('data-theme'),
            theme === 'dark' ? 'light' : 'dark',
          );
          await themeButton.click();
          assert.equal(
            await page.locator('html').getAttribute('data-theme'),
            theme,
          );
          const search = await page.getByRole('searchbox').boundingBox();
          const preferences = await page
            .locator('#locale-toggle')
            .boundingBox();
          assert.ok(search.x >= 0 && search.x + search.width <= width);
          assert.ok(
            search.y > preferences.y + preferences.height ||
              search.x + search.width < preferences.x,
          );
          const scale = page.locator('.maplibregl-ctrl-scale');
          const originalScale = await scale.textContent();
          await page
            .getByRole('button', {
              name: locale === 'ja' ? '拡大' : 'Zoom in',
              exact: true,
            })
            .click();
          await page.waitForTimeout(500);
          assert.notEqual(await scale.textContent(), originalScale);
          await page
            .getByRole('button', {
              name: locale === 'ja' ? '縮小' : 'Zoom out',
              exact: true,
            })
            .click();
          if (process.env.SCREENSHOT_DIR) {
            await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
            await page.screenshot({
              path: `${process.env.SCREENSHOT_DIR}/controls-${width}-${locale}-${theme}.png`,
            });
          }
          await page.locator('#locale-toggle').click();
          await page
            .getByRole('menuitemradio', {
              name: locale === 'ja' ? 'English' : '日本語',
              exact: true,
            })
            .click();
          await page.waitForURL(
            locale === 'ja' ? '**/?view=hazards#map' : '**/ja?view=hazards#map',
          );
          assert.equal(
            new URL(page.url()).pathname,
            locale === 'ja' ? '/' : '/ja',
          );
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});
