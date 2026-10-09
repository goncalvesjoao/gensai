import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { selectThemeMode } from './helpers.mjs';
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
    await page.locator('canvas').waitFor();
    await page
      .getByText('Loading map…', { exact: true })
      .waitFor({ state: 'hidden' });
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
          for (const mode of ['light', 'dark', 'system']) {
            await selectThemeMode(page, mode);
            assert.equal(
              await page.locator('html').getAttribute('data-theme-mode'),
              mode,
            );
            assert.equal(
              await page.locator('html').getAttribute('data-theme'),
              mode === 'system' ? theme : mode,
            );
          }
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
          const scaleBox = await scale.boundingBox();
          const layersBox = await page
            .getByRole('button', {
              name: locale === 'ja' ? '災害メニューを開く' : 'Open hazard menu',
              exact: true,
            })
            .boundingBox();
          assert.ok(
            scaleBox.x >= layersBox.x + layersBox.width ||
              scaleBox.y >= layersBox.y + layersBox.height,
          );
          const originalScale = await scale.textContent();
          await page
            .getByRole('button', {
              name: locale === 'ja' ? '拡大' : 'Zoom in',
              exact: true,
            })
            .click();
          await page.waitForFunction(
            (previous) =>
              document.querySelector('.maplibregl-ctrl-scale')?.textContent !==
              previous,
            originalScale,
            { timeout: 10_000 },
          );
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
            (url) =>
              (url.pathname.replace(/\/$/, '') || '/') ===
                (locale === 'ja' ? '/' : '/ja') &&
              url.search === '?view=hazards' &&
              url.hash === '#map',
          );
          assert.equal(
            new URL(page.url()).pathname.replace(/\/$/, '') || '/',
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

test('theme remains usable with unavailable storage and respects saved explicit choice', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const saved = await browser.newPage({ colorScheme: 'dark' });
    await saved.addInitScript(() =>
      localStorage.setItem('gensai-theme', 'light'),
    );
    await saved.goto(base);
    assert.equal(
      await saved.locator('html').getAttribute('data-theme'),
      'light',
    );
    await saved.locator('#theme-toggle').click();
    assert.equal(
      await saved.locator('html').getAttribute('data-theme'),
      'dark',
    );
    const unavailable = await browser.newPage({ colorScheme: 'dark' });
    await unavailable.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('Storage unavailable');
        },
      });
    });
    await unavailable.goto(base);
    assert.equal(
      await unavailable.locator('html').getAttribute('data-theme'),
      'dark',
    );
    await unavailable.locator('#theme-toggle').click();
    assert.equal(
      await unavailable.locator('html').getAttribute('data-theme'),
      'light',
    );
  } finally {
    await browser.close();
  }
});

test('home destination follows active language and preserves a separate search group', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const locale of ['en', 'ja']) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      await page.goto(`${base}${locale === 'ja' ? '/ja' : '/'}`);
      const home = page.getByRole('link', {
        name: locale === 'ja' ? 'ホーム' : 'Home',
        exact: true,
      });
      await home.waitFor({ timeout: 3000 });
      const destination = new URL(await home.getAttribute('href'), base);
      const expected = new URL(
        process.env.HOME_TEST_URL
          ? locale === 'ja'
            ? '/ja'
            : '/'
          : locale === 'ja'
            ? '/ja/welcome'
            : '/welcome',
        process.env.HOME_TEST_URL || base,
      );
      assert.equal(destination.href, expected.href);
      const box = await home.boundingBox();
      const search = await page.getByRole('searchbox').boundingBox();
      assert.ok(box.x + box.width <= search.x);
      assert.ok(
        search.y >= box.y && search.y + search.height <= box.y + box.height,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
