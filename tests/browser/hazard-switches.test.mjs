import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true]) {
  test(`independent hazard switches preserve choices (${japanese ? 'JA' : 'EN'})`, async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(5000);
      await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
      await page.locator('canvas').waitFor();
      const names = japanese
        ? ['津波', '洪水', '土砂災害']
        : ['Tsunami', 'Flooding', 'Landslide'];
      const switches = names.map((name) =>
        page.getByRole('switch', { name, exact: true }),
      );
      async function check(expected) {
        for (const [index, control] of switches.entries())
          assert.equal(await control.isChecked(), expected[index]);
      }
      async function tabTo(control) {
        // Exercise real keyboard reachability, not programmatic focus.
        for (let attempt = 0; attempt < 30; attempt++) {
          await page.keyboard.press('Tab');
          if (await control.evaluate((el) => el === document.activeElement))
            return;
        }
        assert.fail('Switch was not reachable through keyboard navigation');
      }
      await switches[0].waitFor({ timeout: 3000 });
      await check([true, false, false]);
      // Gray-code walk reaches all eight combinations, changing only one switch.
      for (const [index, expected] of [
        [0, [false, false, false]],
        [1, [false, true, false]],
        [0, [true, true, false]],
        [2, [true, true, true]],
        [0, [false, true, true]],
        [1, [false, false, true]],
        [0, [true, false, true]],
      ]) {
        await switches[index].focus();
        await page.keyboard.press('Space');
        await check(expected);
        assert.equal(
          await page.locator('.page-shell').getAttribute('data-sidebar-open'),
          'true',
        );
        assert.equal(
          await switches[index].evaluate(
            (el) => getComputedStyle(el).outlineStyle,
          ),
          'solid',
        );
      }
      // A pending selected-location validation cannot overwrite resident intent.
      let releaseBoundary;
      const gate = new Promise((resolve) => {
        releaseBoundary = resolve;
      });
      await page.route('**/japan-boundary.*.js', async (route) => {
        await gate;
        await route.continue();
      });
      await page
        .getByText(
          japanese ? '座標で場所を選択・修正' : 'Choose or correct coordinates',
          {
            exact: true,
          },
        )
        .click();
      async function select(lat, lng) {
        await page
          .getByLabel(japanese ? '緯度' : 'Latitude', { exact: true })
          .fill(lat);
        await page
          .getByLabel(japanese ? '経度' : 'Longitude', { exact: true })
          .fill(lng);
        await page
          .getByRole('button', {
            name: japanese ? '座標を選択' : 'Select coordinates',
            exact: true,
          })
          .click();
      }
      await select('35.6895', '139.6917');
      await switches[0].click();
      releaseBoundary();
      await page
        .getByRole('status')
        .filter({ hasText: '35.68950, 139.69170' })
        .waitFor();
      await check([false, false, true]);
      await select('26.2124', '127.6809');
      await page
        .getByRole('status')
        .filter({ hasText: '26.21240, 127.68090' })
        .waitFor();
      await check([false, false, true]);
      const markerLabel = await page
        .locator('.maplibregl-marker')
        .getAttribute('aria-label');
      await page.locator('.grip-toggle').click();
      await page.locator('.grip-toggle').click();
      await check([false, false, true]);
      for (const theme of ['light', 'dark']) {
        if (theme === 'dark') await page.locator('#theme-toggle').click();
        for (const width of [390, 1280]) {
          await page.setViewportSize({ width, height: 844 });
          // Resize returns before the matchMedia callback updates the sidebar.
          // Wait for its public state before reopening or navigating controls.
          const grip = page.locator('.grip-toggle');
          await page
            .locator(
              `.grip-toggle[aria-expanded="${width > 600 ? 'true' : 'false'}"]`,
            )
            .waitFor();
          await grip.focus();
          if (width <= 600) await page.keyboard.press('Enter');
          await page.locator('.grip-toggle[aria-expanded="true"]').waitFor();
          await check([false, false, true]);
          await tabTo(switches[0]);
          await page.keyboard.press('Tab');
          assert.equal(
            await switches[1].evaluate((el) => el === document.activeElement),
            true,
          );
          await page.keyboard.press('Tab');
          assert.equal(
            await switches[2].evaluate((el) => el === document.activeElement),
            true,
          );
          assert.equal(
            await switches[2].evaluate(
              (el) => getComputedStyle(el).outlineStyle,
            ),
            'solid',
          );
          await page.keyboard.press('Space');
          await check([false, false, false]);
          await page.keyboard.press('Space');
          await check([false, false, true]);
          for (const control of switches) {
            const box = await control.boundingBox();
            assert.ok(box.x >= 0 && box.x + box.width <= width);
          }
          assert.equal(
            await page.locator('.maplibregl-marker').getAttribute('aria-label'),
            markerLabel,
          );
          assert.ok((await page.locator('canvas').boundingBox()).height > 400);
        }
      }
    } finally {
      await browser.close();
    }
  });
}
