import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
import { browserSession } from '../../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
const { PNG } = require(process.env.PNG_MODULE || 'pngjs');
const fixture = new PNG({ width: 256, height: 256 });
for (let pixel = 0; pixel < fixture.data.length; pixel += 4)
  fixture.data.set([240, 240, 240, 255], pixel);
const fixtureTile = PNG.sync.write(fixture);

for (const japanese of [false, true]) {
  for (const mobile of [false, true]) {
    for (const theme of ['light', 'dark']) {
      test(`hazard legends, selection and controls remain usable ${japanese ? 'JA' : 'EN'} ${mobile ? 'phone' : 'computer'} ${theme}`, async () => {
        const browser = await browserSession();
        try {
          const page = await browser.newPage({
            viewport: {
              width: mobile ? 390 : 1280,
              height: mobile ? 844 : 900,
            },
          });
          await page.route('**/xyz/**', (route) =>
            route.fulfill({ contentType: 'image/png', body: fixtureTile }),
          );
          await page.route('**/raster/**', (route) =>
            route.fulfill({ contentType: 'image/png', body: fixtureTile }),
          );
          await page.addInitScript(
            (theme) => localStorage.setItem('gensai-theme', theme),
            theme,
          );
          await page.route('https://photon.komoot.io/api/**', (route) =>
            route.fulfill({
              json: {
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: { name: 'Test place', countrycode: 'JP' },
                    geometry: {
                      type: 'Point',
                      coordinates: [127.6809, 26.2124],
                    },
                  },
                ],
              },
            }),
          );
          await page.addInitScript(() => {
            window.deviceRequests = 0;
            navigator.geolocation.getCurrentPosition = (success) => {
              window.deviceRequests++;
              success({ coords: { latitude: 35.6895, longitude: 139.6917 } });
            };
          });
          await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
          await page.locator('canvas').waitFor();
          assert.equal(await page.evaluate(() => window.deviceRequests), 0);
          const warning = page.getByText(
            japanese
              ? '色なし＝安全ではありません。データが存在しない場合があります'
              : 'No colour does not mean safe. Data may be missing',
            { exact: true },
          );
          await warning.waitFor();
          const opener = page.locator('[data-sidebar-opener]');
          assert.equal(await opener.getAttribute('aria-expanded'), 'false');
          if (process.env.SCREENSHOT_DIR)
            await page.screenshot({
              path: `${process.env.SCREENSHOT_DIR}/gensai-controls-initial-${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-${theme}.png`,
            });
          if ((await opener.getAttribute('aria-expanded')) !== 'true')
            await opener.click();
          await opener.click();
          assert.equal(await opener.getAttribute('aria-expanded'), 'true');
          const names = japanese
            ? ['津波', '洪水', '土砂災害']
            : ['Tsunami', 'Flooding', 'Landslide'];
          for (const name of names)
            await page.getByRole('switch', { name, exact: true }).check();
          if (process.env.SCREENSHOT_DIR)
            await page.screenshot({
              path: `${process.env.SCREENSHOT_DIR}/gensai-controls-open-${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-${theme}.png`,
            });
          const scale = page.locator('.maplibregl-ctrl-scale');
          const beforeZoom = await scale.textContent();
          await page
            .getByRole('button', {
              name: japanese ? '拡大' : 'Zoom in',
              exact: true,
            })
            .click();
          await page.waitForFunction(
            (before) =>
              document.querySelector('.maplibregl-ctrl-scale').textContent !==
              before,
            beforeZoom,
          );
          assert.notEqual(await scale.textContent(), beforeZoom);
          await page
            .getByRole('button', {
              name: japanese ? '縮小' : 'Zoom out',
              exact: true,
            })
            .click();
          await page.locator('#theme-toggle').click();
          assert.equal(await opener.getAttribute('aria-expanded'), 'true');
          await page.locator('#theme-toggle').click();
          await page
            .getByText(
              japanese
                ? '座標で場所を選択・修正'
                : 'Choose or correct coordinates',
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
            .locator('.map-selection [role=status]')
            .filter({ hasText: '35.68950, 139.69170' })
            .waitFor();
          const search = page.getByRole('searchbox');
          if (!mobile && theme === 'light') {
            await search.fill(japanese ? '那覇市' : 'Naha');
            await search.press('Enter');
            await page
              .locator('.map-selection [role=status]')
              .filter({ hasText: 'Test place' })
              .waitFor();
            await page
              .getByRole('button', {
                name: japanese ? '現在地を取得' : 'Use my location',
                exact: true,
              })
              .click();
            await page
              .locator('.map-selection [role=status]')
              .filter({ hasText: '35.68950, 139.69170' })
              .waitFor();
            await page.locator('canvas').focus();
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(400);
            await page.keyboard.press('Enter');
            await page
              .locator('.map-selection [role=status]')
              .filter({ hasNotText: japanese ? '確認中' : 'Checking' })
              .waitFor();
          }
          assert.equal(await page.locator('.maplibregl-marker').count(), 1);
          for (const name of names)
            assert.equal(
              await page.getByRole('switch', { name, exact: true }).isChecked(),
              true,
            );
          assert.equal(await opener.getAttribute('aria-expanded'), 'true');
          const warningBox = await warning.boundingBox();
          assert.equal(
            await warning.evaluate(
              (element, box) =>
                element.contains(
                  document.elementFromPoint(
                    box.x + box.width / 2,
                    box.y + box.height / 2,
                  ),
                ),
              warningBox,
            ),
            true,
            'The open menu must not obscure the warning',
          );
          for (const selector of [
            '.maplibregl-ctrl-scale',
            '.maplibregl-ctrl-zoom-in',
          ]) {
            const control = page.locator(selector);
            const box = await control.boundingBox();
            assert.equal(
              await control.evaluate(
                (element, box) =>
                  element.contains(
                    document.elementFromPoint(
                      box.x + box.width / 2,
                      box.y + box.height / 2,
                    ),
                  ),
                box,
              ),
              true,
              'The open menu must not obscure map controls or scale',
            );
          }
          if (process.env.SCREENSHOT_DIR)
            await page.screenshot({
              path: `${process.env.SCREENSHOT_DIR}/gensai-hazards-open-${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-${theme}.png`,
            });
          const selectedBeforeClose = await page
            .locator('.map-selection [role=status]')
            .textContent();
          await page.setViewportSize({
            width: mobile ? 430 : 1100,
            height: mobile ? 844 : 900,
          });
          assert.equal(await opener.getAttribute('aria-expanded'), 'true');
          await page.setViewportSize({
            width: mobile ? 390 : 1280,
            height: mobile ? 844 : 900,
          });
          await page.locator('[data-sidebar-close]').click();
          await opener.click();
          assert.equal(
            await page.locator('.map-selection [role=status]').textContent(),
            selectedBeforeClose,
          );
          for (const name of names)
            assert.equal(
              await page.getByRole('switch', { name, exact: true }).isChecked(),
              true,
            );
          await page.locator('[data-sidebar-close]').click();
          await warning.waitFor();
          const legend = page.locator('.hazard-legend');
          assert.equal(await legend.isVisible(), true);
          assert.equal(await legend.locator('[data-hazard-legend]').count(), 3);
          assert.ok((await legend.getByRole('link').count()) >= 1);
          const canvas = await page.locator('canvas').boundingBox();
          const legendBox = await legend.boundingBox();
          assert.ok(canvas.height >= 250, 'Enough map remains visible');
          assert.ok(
            canvas.y + canvas.height <= legendBox.y + 1,
            'Legend does not overlay the map',
          );
          for (const selector of [
            '.maplibregl-ctrl-scale',
            '.maplibregl-ctrl-zoom-in',
          ]) {
            const box = await page.locator(selector).boundingBox();
            assert.ok(
              box.y + box.height <= legendBox.y,
              'Map control remains outside legend',
            );
          }
          if (process.env.SCREENSHOT_DIR)
            await page.screenshot({
              path: `${process.env.SCREENSHOT_DIR}/gensai-hazards-${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-${theme}.png`,
            });
        } finally {
          await browser.close();
        }
      });
    }
  }
}
