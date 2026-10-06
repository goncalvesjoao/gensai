import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true]) {
  test(`hazard switches are independent and keep their state (${japanese ? 'Japanese' : 'English'})`, async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
      const switches = (
        japanese
          ? ['津波', '洪水', '土砂災害']
          : ['Tsunami', 'Flooding', 'Landslide']
      ).map((name) => page.getByRole('switch', { name, exact: true }));
      for (let index = 0; index < switches.length; index++) {
        assert.equal(await switches[index].isChecked(), index === 0);
      }
      // Cycle all combinations using the keyboard through the public controls.
      for (const combination of [0, 1, 3, 2, 6, 7, 5, 4]) {
        for (let index = 0; index < switches.length; index++) {
          const checked = Boolean(combination & (1 << index));
          if ((await switches[index].isChecked()) !== checked) {
            await switches[index].focus();
            await page.keyboard.press('Space');
          }
        }
        for (let index = 0; index < switches.length; index++) {
          assert.equal(
            await switches[index].isChecked(),
            Boolean(combination & (1 << index)),
          );
        }
        assert.equal(
          await page.locator('.page-shell').getAttribute('data-sidebar-open'),
          'true',
        );
      }
      await switches[1].focus();
      await page.keyboard.press('Tab');
      const focus = await switches[2].evaluate((input) => ({
        focused: input.matches(':focus-visible'),
        outline: getComputedStyle(input).outlineStyle,
        width: getComputedStyle(input).outlineWidth,
      }));
      assert.equal(focus.focused, true);
      assert.notEqual(focus.outline, 'none');
      assert.notEqual(focus.width, '0px');
      await page.locator('.grip-toggle').click();
      await page.locator('.grip-toggle').click();
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('.grip-toggle').click();
      for (let index = 0; index < switches.length; index++) {
        assert.equal(await switches[index].isChecked(), index === 2);
      }
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.locator('canvas').waitFor();
      await page
        .getByText(
          japanese ? '座標で場所を選択・修正' : 'Choose or correct coordinates',
          { exact: true },
        )
        .click();
      await page
        .getByLabel(japanese ? '緯度' : 'Latitude', { exact: true })
        .fill('35.6895');
      await page
        .getByLabel(japanese ? '経度' : 'Longitude', { exact: true })
        .fill('139.6917');
      await page
        .getByRole('button', {
          name: japanese ? '座標を選択' : 'Select coordinates',
          exact: true,
        })
        .click();
      await page
        .getByRole('status')
        .filter({ hasText: '35.68950, 139.69170' })
        .waitFor();
      for (let index = 0; index < switches.length; index++) {
        assert.equal(await switches[index].isChecked(), index === 2);
      }
      await page.reload();
      for (let index = 0; index < switches.length; index++) {
        assert.equal(await switches[index].isChecked(), index === 0);
      }
    } finally {
      await browser.close();
    }
  });
}
