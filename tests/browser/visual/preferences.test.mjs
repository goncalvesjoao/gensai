import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir } from 'node:fs/promises';
import { browserSession } from '../../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('preferences retain localized public URLs and visible controls at phone and computer widths', async () => {
  const browser = await browserSession();
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
            (before) =>
              document.querySelector('.maplibregl-ctrl-scale').textContent !==
              before,
            originalScale,
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
