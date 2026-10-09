import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true])
  for (const width of [390, 1280])
    test(`address choices and selected location remain visible ${japanese ? 'JA' : 'EN'} ${width}`, async () => {
      const browser = await browserSession();
      try {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
        });
        const label = japanese
          ? '東京都新宿区の自宅の住所'
          : 'Tokyo home address with a long building name';
        await page.route('https://photon.komoot.io/api/**', (route) =>
          route.fulfill({
            json: {
              type: 'FeatureCollection',
              features: [label, 'Another place'].map((name) => ({
                type: 'Feature',
                properties: { name, countrycode: 'JP' },
                geometry: { type: 'Point', coordinates: [139.6917, 35.6895] },
              })),
            },
          }),
        );
        await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
        const search = page.getByRole('searchbox');
        for (const theme of ['light', 'dark']) {
          if (theme === 'dark') await page.locator('#theme-toggle').click();
          for (const open of [true, false]) {
            if (
              ((await page
                .locator('.page-shell')
                .getAttribute('data-sidebar-open')) ===
                'true') !==
              open
            )
              await page
                .locator(
                  open ? '[data-sidebar-opener]' : '[data-sidebar-close]',
                )
                .click();
            await search.fill(label);
            await search.focus();
            assert.equal(
              await page
                .locator('.map-search')
                .evaluate((el) => getComputedStyle(el).outlineStyle),
              'solid',
            );
            await search.press('Enter');
            const choice = page.getByRole('button', {
              name: japanese ? `${label}を選択` : `Select ${label}`,
              exact: true,
            });
            await choice.focus();
            assert.equal(
              await choice.evaluate((el) => getComputedStyle(el).outlineStyle),
              'solid',
            );
            const box = await choice.boundingBox();
            const panel = await page
              .locator('.address-search-panel')
              .boundingBox();
            assert.ok(box.width > 40);
            assert.ok(panel.x >= 0 && panel.x + panel.width <= width);
            assert.ok(panel.height < 844 / 2);
            await page.keyboard.press('Enter');
            const status = page.locator('.map-selection [role=status]');
            await status.filter({ hasText: label }).waitFor();
            assert.equal(
              await page.locator('.address-search-choices button').count(),
              0,
            );
            assert.equal(
              await search.evaluate((el) => document.activeElement === el),
              true,
            );
            for (const nextWidth of width === 390
              ? [390, 430, 1280, 390]
              : [1280, 1100]) {
              await page.setViewportSize({ width: nextWidth, height: 844 });
              await page.waitForFunction(() => {
                const marker = document
                  .querySelector('.maplibregl-marker')
                  .getBoundingClientRect();
                const canvas = document
                  .querySelector('canvas')
                  .getBoundingClientRect();
                return (
                  !window.__gensaiMapInstance.isMoving() &&
                  Math.abs(
                    marker.x + marker.width / 2 - (canvas.x + canvas.width / 2),
                  ) < 2
                );
              });
              const marker = await page
                .locator('.maplibregl-marker')
                .boundingBox();
              const canvas = await page.locator('canvas').boundingBox();
              assert.ok(
                Math.abs(
                  marker.x + marker.width / 2 - (canvas.x + canvas.width / 2),
                ) < 2,
              );
              assert.equal(
                await page
                  .locator('.page-shell')
                  .getAttribute('data-sidebar-open'),
                String(open),
              );
              assert.equal(await status.isVisible(), true);
              const statusBox = await status.boundingBox();
              assert.equal(
                await status.evaluate(
                  (el, rect) =>
                    el.contains(
                      document.elementFromPoint(rect.x + 10, rect.y + 10),
                    ),
                  statusBox,
                ),
                true,
              );
            }
            await page.setViewportSize({ width, height: 844 });
          }
        }
      } finally {
        await browser.close();
      }
    });
