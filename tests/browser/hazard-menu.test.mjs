import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true]) {
  for (const width of [1280, 390]) {
    test(`hazard menu preserves explicit visibility and choices (${japanese ? 'Japanese' : 'English'}, ${width})`, async () => {
      const browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROMIUM_PATH,
      });
      try {
        const page = await browser.newPage({
          viewport: { width, height: 844 },
        });
        await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
        const opener = page.getByRole('button', {
          name: japanese ? '災害メニューを開く' : 'Open hazard menu',
          exact: true,
        });
        const close = page.getByRole('button', {
          name: japanese ? '災害メニューを閉じる' : 'Close hazard menu',
          exact: true,
        });
        const panel = page.locator('#map-sidebar');
        await opener.waitFor();
        assert.equal(await opener.getAttribute('aria-expanded'), 'false');
        assert.equal(await panel.isVisible(), false);
        assert.equal(await panel.evaluate((el) => el.inert), true);
        await opener.click();
        await opener.click();
        await page.locator('#theme-toggle').click();
        await page
          .getByRole('button', {
            name: japanese ? '言語を選択' : 'Choose language',
            exact: true,
          })
          .click();
        await page.getByRole('menu').waitFor();
        await page.keyboard.press('Escape');
        await page.getByRole('menu').waitFor({ state: 'hidden' });
        assert.equal(await close.isVisible(), true);
        const hazard = page.getByRole('switch', {
          name: japanese ? '洪水' : 'Flooding',
          exact: true,
        });
        await hazard.check();
        await hazard.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        assert.equal(
          await hazard.evaluate(
            (el) =>
              el.matches(':focus-visible') &&
              getComputedStyle(el).outlineStyle !== 'none',
          ),
          true,
        );
        await page.locator('canvas').waitFor();
        await page.locator('canvas').click({ position: { x: 300, y: 180 } });
        const selectedUrl = page.url();
        await page.setViewportSize({
          width: width === 390 ? 1280 : 390,
          height: 844,
        });
        assert.equal(await close.isVisible(), true);
        assert.equal(await hazard.isChecked(), true);
        await page.locator('canvas').focus();
        await page.keyboard.press('Escape');
        assert.equal(await panel.isVisible(), false);
        assert.equal(
          await opener.evaluate((el) => el === document.activeElement),
          true,
        );
        assert.equal(await panel.evaluate((el) => el.inert), true);
        assert.equal(await page.locator('.hazard-warning').isVisible(), true);
        await opener.click();
        assert.equal(await hazard.isChecked(), true);
        assert.equal(page.url(), selectedUrl);
        await close.click();
        assert.equal(
          await opener.evaluate((el) => el === document.activeElement),
          true,
        );
        await page.reload();
        assert.equal(await panel.isVisible(), false);
      } finally {
        await browser.close();
      }
    });
  }
}
