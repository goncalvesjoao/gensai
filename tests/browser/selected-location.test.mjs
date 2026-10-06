import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true])
  for (const mobile of [false, true]) {
    test(`selected location on the public map URL (${japanese ? 'Japanese' : 'English'}, ${mobile ? 'phone' : 'computer'})`, async () => {
      const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH,
      });
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
        }
        for (const [lat, lng] of [
          [35.6895, 139.6917],
          [26.2124, 127.6809],
          [24.467, 122.998],
          [27.094, 142.191],
          [24.288, 153.979],
          [20.425278, 136.069722],
        ]) {
          await choose(lat, lng);
          await status
            .filter({
              hasText: `${selectedLabel}: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            })
            .waitFor();
          assert.equal(await page.locator('.maplibregl-marker').count(), 1);
        }
        await choose(37.5665, 126.978);
        assert.match(await status.textContent(), /20\.42528, 136\.06972/);
        assert.match(
          await status.textContent(),
          japanese ? /日本の陸地/ : /land in Japan/,
        );
        await choose(35.6895, 139.6917);
        await page
          .getByText(
            japanese
              ? '座標で場所を選択・修正'
              : 'Choose or correct coordinates',
            { exact: true },
          )
          .click();
        // Actual pointer selection and keyboard correction on the rendered map.
        const box = await canvas.boundingBox();
        await page.mouse.click(
          box.x + box.width / 2 + 45,
          box.y + box.height / 2 + 45,
        );
        assert.doesNotMatch(
          await status.textContent(),
          /35\.68950, 139\.69170/,
        );
        const pointerSelection = await status.textContent();
        await canvas.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(400);
        await page.keyboard.press('Enter');
        const retained = await status.textContent();
        assert.notEqual(retained, pointerSelection);
        if (process.env.SCREENSHOT_DIR)
          await page.screenshot({
            path: `${process.env.SCREENSHOT_DIR}/${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-light.png`,
          });
        await page.locator('#theme-toggle').click();
        assert.equal(await status.textContent(), retained);
        for (let i = 0; i < 2; i++) await page.locator('.grip-toggle').click();
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
        assert.equal(
          await page.evaluate(() => location.search + location.hash),
          '',
        );
        assert.deepEqual(errors, []);
        await page.locator('#locale-toggle').click();
        await page
          .getByRole('menuitemradio', {
            name: japanese ? 'English' : '日本語',
            exact: true,
          })
          .click();
        await page.waitForURL((url) =>
          japanese ? url.pathname === '/' : /^\/ja\/?$/.test(url.pathname),
        );
        await page.reload();
        await canvas.waitFor();
        assert.equal(await status.textContent(), '');
        assert.equal(await page.locator('.maplibregl-marker').count(), 0);
        assert.equal(await page.evaluate(() => window.locationRequests), 0);
      } finally {
        await browser.close();
      }
    });
  }
