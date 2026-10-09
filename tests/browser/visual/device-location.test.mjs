import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

for (const japanese of [false, true]) {
  for (const mobile of [false, true]) {
    test(`device outcomes stay correctable (${japanese ? 'Japanese' : 'English'}, ${mobile ? 'phone' : 'computer'}, both themes)`, async () => {
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
          window.locationRequests = [];
          window.deviceLocation = navigator.geolocation;
          navigator.geolocation.getCurrentPosition = (
            success,
            failure,
            options,
          ) => window.locationRequests.push({ success, failure, options });
        });
        await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
        await page.locator('canvas').waitFor();
        const button = page.getByRole('button', {
          name: japanese ? '現在地を取得' : 'Use my location',
          exact: true,
        });
        await button.waitFor();
        const status = page.getByRole('status');
        const search = page.getByRole('searchbox');
        await search.fill('Address remains editable');
        await page
          .getByText(
            japanese
              ? '座標で場所を選択・修正'
              : 'Choose or correct coordinates',
            { exact: true },
          )
          .click();
        async function correct() {
          if (
            mobile &&
            (await page
              .locator('.page-shell')
              .getAttribute('data-sidebar-open')) === 'true'
          )
            await page.locator('[data-sidebar-close]').click();
          await page
            .getByLabel(japanese ? '緯度' : 'Latitude', { exact: true })
            .fill('26.2124');
          await page
            .getByLabel(japanese ? '経度' : 'Longitude', { exact: true })
            .fill('127.6809');
          await page
            .getByRole('button', {
              name: japanese ? '座標を選択' : 'Select coordinates',
              exact: true,
            })
            .click();
          await status.filter({ hasText: '26.21240, 127.68090' }).waitFor();
        }
        const outcomes = [
          { position: [35.6895, 139.6917], expected: /35\.68950, 139\.69170/ },
          {
            code: 1,
            expected: japanese
              ? /許可されませんでした/
              : /permission was denied/,
          },
        ];
        for (const theme of ['light', 'dark']) {
          if (theme === 'dark') await page.locator('#theme-toggle').click();
          for (const [index, outcome] of outcomes.entries()) {
            const open =
              (await page
                .locator('.page-shell')
                .getAttribute('data-sidebar-open')) === 'true';
            if (open !== (index % 2 === 0))
              await page
                .locator(
                  index % 2 === 0
                    ? '[data-sidebar-opener]'
                    : '[data-sidebar-close]',
                )
                .click();
            if (outcome.unavailable)
              await page.evaluate(() =>
                Object.defineProperty(navigator, 'geolocation', {
                  configurable: true,
                  value: undefined,
                }),
              );
            await search.focus();
            await page.keyboard.press('Tab');
            assert.equal(
              await button.evaluate((el) => getComputedStyle(el).outlineStyle),
              'solid',
            );
            await page.keyboard.press('Enter');
            if (!outcome.unavailable) {
              await page.evaluate(({ position, code }) => {
                const request = window.locationRequests.at(-1);
                if (position)
                  request.success({
                    coords: { latitude: position[0], longitude: position[1] },
                  });
                else request.failure({ code });
              }, outcome);
            }
            await status.filter({ hasText: outcome.expected }).waitFor();
            if (
              outcome.code ||
              outcome.unavailable ||
              outcome.position?.[0] === 37.5665
            ) {
              assert.match(await status.textContent(), /35\.68950, 139\.69170/);
              assert.match(
                await page
                  .locator('.maplibregl-marker')
                  .getAttribute('aria-label'),
                japanese ? /東京への代替表示/ : /Tokyo fallback/,
              );
              assert.match(
                await status.textContent(),
                japanese
                  ? /検出された現在地ではありません/
                  : /not your detected current location/,
              );
            } else {
              assert.match(
                await page
                  .locator('.maplibregl-marker')
                  .getAttribute('aria-label'),
                japanese ? /端末の現在地/ : /device position/,
              );
            }
            assert.equal(await page.locator('.maplibregl-marker').count(), 1);
            assert.equal(await search.inputValue(), 'Address remains editable');
            if (outcome.unavailable)
              await page.evaluate(() =>
                Object.defineProperty(navigator, 'geolocation', {
                  configurable: true,
                  value: window.deviceLocation,
                }),
              );
            await correct();
          }
          // A deliberately newer manual selection wins over a delayed device response.
          await button.click();
          await correct();
          await page.evaluate(() =>
            window.locationRequests
              .at(-1)
              .success({ coords: { latitude: 35.6895, longitude: 139.6917 } }),
          );
          assert.match(await status.textContent(), /26\.21240, 127\.68090/);
          assert.doesNotMatch(await status.textContent(), /fallback|代替表示/);
          await page.setViewportSize(
            mobile ? { width: 430, height: 900 } : { width: 1100, height: 760 },
          );
          assert.match(await status.textContent(), /26\.21240, 127\.68090/);
          const buttonBox = await button.boundingBox();
          const searchBox = await search.boundingBox();
          assert.ok(
            buttonBox.x > searchBox.x &&
              buttonBox.x + buttonBox.width < (mobile ? 430 : 1100),
          );
          assert.ok((await page.locator('canvas').boundingBox()).height > 400);
          if (process.env.SCREENSHOT_DIR) {
            await page
              .getByText(
                japanese
                  ? '座標で場所を選択・修正'
                  : 'Choose or correct coordinates',
                { exact: true },
              )
              .click();
            if (
              (await page
                .locator('.page-shell')
                .getAttribute('data-sidebar-open')) === 'true'
            )
              await page.locator('[data-sidebar-close]').click();
            await search.focus();
            await page.keyboard.press('Tab');
            await page.screenshot({
              path: `${process.env.SCREENSHOT_DIR}/device-${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-${theme}.png`,
            });
            await page
              .getByText(
                japanese
                  ? '座標で場所を選択・修正'
                  : 'Choose or correct coordinates',
                { exact: true },
              )
              .click();
          }
        }
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    });
  }
}
