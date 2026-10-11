import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true])
  for (const mobile of [false, true]) {
    test(`selected location on the public map URL (${japanese ? 'Japanese' : 'English'}, ${mobile ? 'phone' : 'computer'})`, async () => {
      const browser = await browserSession();
      try {
        const page = await browser.newPage({
          viewport: mobile
            ? { width: 390, height: 844 }
            : { width: 1280, height: 800 },
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript(() => {
          window.locationRequests = 0;
          navigator.geolocation.getCurrentPosition = () =>
            window.locationRequests++;
        });
        await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
        const status = page.getByRole('status');
        const selectedLabel = japanese ? '選択した場所' : 'Selected location';
        const checking = japanese
          ? '選択した場所を確認中'
          : 'Checking selected location';
        const canvas = page.locator('canvas');
        await canvas.waitFor();
        assert.equal(await status.textContent(), '');
        assert.equal(await page.evaluate(() => window.locationRequests), 0);
        await page
          .getByText(
            japanese
              ? '座標で場所を選択・修正'
              : 'Choose or correct coordinates',
            { exact: true },
          )
          .click();
        async function choose(lat, lng) {
          await page
            .getByLabel(japanese ? '緯度' : 'Latitude', { exact: true })
            .fill(String(lat));
          await page
            .getByLabel(japanese ? '経度' : 'Longitude', { exact: true })
            .fill(String(lng));
          await page
            .getByRole('button', {
              name: japanese ? '座標を選択' : 'Select coordinates',
              exact: true,
            })
            .click();
          await status.filter({ hasNotText: checking }).waitFor();
        }
        // Integration and geography cases live in the default suite.
        await choose(35.6895, 139.6917);
        await status
          .filter({ hasText: `${selectedLabel}: 35.68950, 139.69170` })
          .waitFor();
        await page
          .getByText(
            japanese
              ? '座標で場所を選択・修正'
              : 'Choose or correct coordinates',
            { exact: true },
          )
          .click();
        const retained = await status.textContent();
        await page.locator('#theme-toggle').click();
        assert.equal(await status.textContent(), retained);
        await page.locator('[data-sidebar-opener]').click();
        await page.locator('[data-sidebar-close]').click();
        assert.equal(await status.textContent(), retained);
        await page.setViewportSize(
          mobile ? { width: 430, height: 900 } : { width: 1100, height: 760 },
        );
        assert.equal(await status.textContent(), retained);
        assert.equal(await page.locator('.maplibregl-marker').count(), 1);
        if (process.env.SCREENSHOT_DIR)
          await page.screenshot({
            path: `${process.env.SCREENSHOT_DIR}/${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-dark.png`,
          });
        const markerBox = await page
          .locator('.maplibregl-marker')
          .boundingBox();
        const canvasBox = await canvas.boundingBox();
        assert.ok(
          Math.abs(
            markerBox.x +
              markerBox.width / 2 -
              (canvasBox.x + canvasBox.width / 2),
          ) < 2,
        );
        assert.ok(
          Math.abs(
            markerBox.y +
              markerBox.height -
              (canvasBox.y + canvasBox.height / 2),
          ) < 12,
        );
        const statusBox = await status.boundingBox();
        assert.ok(statusBox.width > 0 && statusBox.height > 0);
        assert.ok(
          statusBox.x >= 0 &&
            statusBox.x + statusBox.width <= (mobile ? 430 : 1100),
        );
        assert.equal(
          await status.evaluate(
            (el, box) =>
              el.contains(document.elementFromPoint(box.x + 10, box.y + 10)),
            statusBox,
          ),
          true,
        );
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }
