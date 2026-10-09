import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true]) {
  for (const width of [1280, 390]) {
    test(`hazard menu preserves explicit visibility and choices (${japanese ? 'Japanese' : 'English'}, ${width})`, async () => {
      const browser = await browserSession();
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
        const mapBox = await page.locator('canvas').boundingBox();
        await page.locator('canvas').click({
          position: { x: mapBox.width * 0.9, y: mapBox.height * 0.4 },
        });
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

for (const japanese of [false, true]) {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 360, height: 640 },
  ]) {
    test(`phone search choices do not cover hazard controls (${japanese ? 'Japanese' : 'English'}, ${viewport.height})`, async () => {
      const browser = await browserSession();
      try {
        const page = await browser.newPage({
          viewport,
        });
        await page.route('https://photon.komoot.io/api/**', (route) =>
          route.fulfill({
            json: {
              type: 'FeatureCollection',
              features: Array.from({ length: 4 }, (_, index) => ({
                type: 'Feature',
                properties: { name: `Place ${index}`, countrycode: 'JP' },
                geometry: {
                  type: 'Point',
                  coordinates: [139.6917 + index / 100, 35.6895],
                },
              })),
            },
          }),
        );
        await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
        await page.locator('[data-sidebar-opener]').click();
        await page.getByRole('searchbox').fill('Tokyo');
        await page.getByRole('searchbox').press('Enter');
        await page.locator('.address-search-choices button').first().waitFor();
        for (const selector of [
          '[data-sidebar-close]',
          '[data-hazard-category="flooding"]',
          '.maplibregl-ctrl-scale',
          '.maplibregl-ctrl-attrib',
        ]) {
          const control = page.locator(selector);
          await control.scrollIntoViewIfNeeded();
          assert.equal(
            await control.evaluate((el) => {
              const box = el.getBoundingClientRect();
              return el.contains(
                document.elementFromPoint(
                  box.x + box.width / 2,
                  box.y + box.height / 2,
                ),
              );
            }),
            true,
            `${selector} remains exposed with search choices`,
          );
        }
        await page
          .locator('.address-search-choices button')
          .last()
          .scrollIntoViewIfNeeded();
        await page.locator('.address-search-choices button').last().click();
        assert.equal(
          await page
            .locator('[data-sidebar-opener]')
            .getAttribute('aria-expanded'),
          'true',
        );
        if (process.env.SCREENSHOT_DIR)
          await page.screenshot({
            path: `${process.env.SCREENSHOT_DIR}/gensai-controls-search-${japanese ? 'ja' : 'en'}-phone.png`,
          });
      } finally {
        await browser.close();
      }
    });
  }
}
