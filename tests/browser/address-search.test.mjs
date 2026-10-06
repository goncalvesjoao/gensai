import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
const match = (name, lng = 139.6917, lat = 35.6895, countrycode = 'JP') => ({
  type: 'Feature',
  properties: { name, countrycode },
  geometry: { type: 'Point', coordinates: [lng, lat] },
});

test('Enter selects a Japan address, while typing and device activation do not submit', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    let queries = [];
    await page.route('https://photon.komoot.io/api/**', async (route) => {
      const url = new URL(route.request().url());
      queries.push(url.searchParams.get('q'));
      assert.equal(url.searchParams.get('countrycode'), 'JP');
      await route.fulfill({
        json: {
          type: 'FeatureCollection',
          features: [match('東京都新宿区西新宿')],
        },
      });
    });
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = () => {};
    });
    await page.goto(base);
    await page.locator('canvas').waitFor();
    const search = page.getByRole('searchbox');
    const selection = page.locator('.map-selection [role=status]');
    await search.fill('東京都新宿区西新宿');
    assert.equal(queries.length, 0);
    assert.equal(await selection.textContent(), '');
    await search.press('Enter');
    await selection
      .filter({ hasText: '東京都新宿区西新宿' })
      .waitFor({ timeout: 3000 });
    assert.equal(await page.locator('.maplibregl-marker').count(), 1);
    const markerBox = await page.locator('.maplibregl-marker').boundingBox();
    const canvasBox = await page.locator('canvas').boundingBox();
    assert.ok(
      Math.abs(
        markerBox.x + markerBox.width / 2 - (canvasBox.x + canvasBox.width / 2),
      ) < 2,
    );
    assert.ok(
      Math.abs(
        markerBox.y + markerBox.height - (canvasBox.y + canvasBox.height / 2),
      ) < 12,
    );
    assert.match(await selection.textContent(), /35\.68950, 139\.69170/);
    await search.fill('New input');
    await page
      .getByRole('button', { name: 'Use my location', exact: true })
      .click();
    assert.equal(queries.length, 1);
    assert.match(await selection.textContent(), /東京都新宿区西新宿/);
  } finally {
    await browser.close();
  }
});

for (const japanese of [false, true])
  for (const mobile of [false, true]) {
    test(`address outcomes remain usable (${japanese ? 'Japanese' : 'English'}, ${mobile ? 'phone' : 'computer'}, both themes)`, async () => {
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
        let features = [];
        let failed = false;
        let malformed = false;
        let calls = 0;
        await page.route('https://photon.komoot.io/api/**', async (route) => {
          calls++;
          const url = new URL(route.request().url());
          assert.equal(
            url.searchParams.get('lang'),
            japanese ? 'default' : 'en',
          );
          if (failed) return route.abort();
          await route.fulfill({
            json: malformed
              ? { unexpected: true }
              : { type: 'FeatureCollection', features },
          });
        });
        await page.addInitScript(() => {
          window.locationRequests = [];
          navigator.geolocation.getCurrentPosition = (success, failure) =>
            window.locationRequests.push({ success, failure });
        });
        await page.goto(`${base}/${japanese ? 'ja/' : ''}`);
        await page.locator('canvas').waitFor();
        const search = page.getByRole('searchbox');
        const selection = page.locator('.map-selection [role=status]');
        const feedback = page.locator('#address-search-feedback');
        const device = page.getByRole('button', {
          name: japanese ? '現在地を取得' : 'Use my location',
          exact: true,
        });
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
              await page.locator('.grip-toggle').click();
            features = [
              match(
                japanese ? '与那国の住所' : 'Yonaguni address',
                122.998,
                24.467,
              ),
            ];
            await search.fill(japanese ? '与那国町' : 'Yonaguni');
            await search.focus();
            assert.equal(
              await page
                .locator('.map-search')
                .evaluate((el) => getComputedStyle(el).outlineStyle),
              'solid',
            );
            await search.press('Enter');
            await selection
              .filter({ hasText: '24.46700, 122.99800' })
              .waitFor();
            assert.match(
              await selection.textContent(),
              japanese ? /与那国の住所/ : /Yonaguni address/,
            );
            assert.equal(await page.locator('.maplibregl-marker').count(), 1);
            features = [];
            await search.press('Enter');
            await feedback
              .filter({
                hasText: japanese
                  ? '検索結果がありません'
                  : 'No supported Japan results',
              })
              .waitFor();
            features = [match('Tokyo'), match('Yonaguni', 122.998, 24.467)];
            await search.press('Enter');
            await feedback
              .filter({
                hasText: japanese ? '複数の場所' : 'Multiple places found',
              })
              .waitFor();
            assert.match(
              await selection.textContent(),
              /24\.46700, 122\.99800/,
            );
            features = [
              match('Seoul', 126.978, 37.5665, 'KR'),
              match('Claimed Japan', 126.978, 37.5665),
            ];
            await search.press('Enter');
            await feedback
              .filter({
                hasText: japanese
                  ? '検索結果がありません'
                  : 'No supported Japan results',
              })
              .waitFor();
            for (const outcome of ['network', 'malformed', 'coordinates']) {
              failed = outcome === 'network';
              malformed = outcome === 'malformed';
              features = [match('Broken', null, 35.6895)];
              await search.press('Enter');
              await feedback
                .filter({
                  hasText: japanese
                    ? '検索できませんでした'
                    : 'Address search failed',
                })
                .waitFor();
            }
            failed = false;
            malformed = false;
            const before = calls;
            await device.click();
            await page.evaluate(() =>
              window.locationRequests.at(-1).success({
                coords: { longitude: 139.6917, latitude: 35.6895 },
              }),
            );
            await selection
              .filter({ hasText: '35.68950, 139.69170' })
              .waitFor();
            assert.equal(calls, before);
            // Correct the address through the map's public keyboard controls.
            await page.locator('canvas').focus();
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(400);
            await page.keyboard.press('Enter');
            await selection
              .filter({ hasNotText: japanese ? '確認中' : 'Checking' })
              .waitFor();
            assert.doesNotMatch(
              await selection.textContent(),
              /35\.68950, 139\.69170/,
            );
            assert.equal(await page.locator('.maplibregl-marker').count(), 1);
            const box = await search.boundingBox();
            assert.ok(
              box.width > 40 && box.x + box.width < (mobile ? 390 : 1280),
            );
            if (process.env.SCREENSHOT_DIR)
              await page.screenshot({
                path: `${process.env.SCREENSHOT_DIR}/address-${japanese ? 'ja' : 'en'}-${mobile ? 'phone' : 'computer'}-${theme}-${open ? 'open' : 'closed'}.png`,
              });
          }
        }
      } finally {
        await browser.close();
      }
    });
  }

test('new searches and selection attempts supersede older provider and boundary responses', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    const requests = [];
    await page.route('https://photon.komoot.io/api/**', (route) =>
      requests.push(route),
    );
    await page.addInitScript(() => {
      window.locationRequests = [];
      navigator.geolocation.getCurrentPosition = (success) =>
        window.locationRequests.push(success);
    });
    await page.goto(base);
    await page.locator('canvas').waitFor();
    const search = page.getByRole('searchbox');
    const selection = page.locator('.map-selection [role=status]');
    const feedback = page.locator('#address-search-feedback');
    async function submit(q) {
      const count = requests.length;
      await search.fill(q);
      await search.press('Enter');
      await page.waitForFunction(() =>
        document
          .querySelector('#address-search-feedback')
          .textContent.includes('Searching'),
      );
      while (requests.length === count) await page.waitForTimeout(10);
    }
    async function respond(route, name, lng = 139.6917, lat = 35.6895) {
      await route
        .fulfill({
          json: {
            type: 'FeatureCollection',
            features: [match(name, lng, lat)],
          },
        })
        .catch(() => {});
    }
    await submit('old');
    await submit('new');
    await respond(requests[1], 'Latest', 122.998, 24.467);
    await selection.filter({ hasText: 'Latest' }).waitFor();
    await respond(requests[0], 'Obsolete');
    assert.match(await selection.textContent(), /Latest/);
    await submit('superseded by device start');
    await page
      .getByRole('button', { name: 'Use my location', exact: true })
      .click();
    await respond(requests[2], 'Obsolete');
    await page.evaluate(() =>
      window.locationRequests.at(-1)({
        coords: { latitude: 26.2124, longitude: 127.6809 },
      }),
    );
    await selection.filter({ hasText: '26.21240, 127.68090' }).waitFor();
    await submit('superseded by map');
    await page.locator('canvas').focus();
    await page.keyboard.press('Enter');
    await respond(requests[3], 'Obsolete');
    await selection.filter({ hasNotText: 'Checking' }).waitFor();
    assert.doesNotMatch(await selection.textContent(), /Obsolete/);
    assert.equal(await feedback.textContent(), '');
    // A search start also invalidates a still-pending device callback.
    await page
      .getByRole('button', { name: 'Use my location', exact: true })
      .click();
    await submit('search beats device');
    await page.evaluate(() =>
      window.locationRequests.at(-1)({
        coords: { latitude: 35.6895, longitude: 139.6917 },
      }),
    );
    await respond(requests[4], 'Search wins', 122.998, 24.467);
    await selection.filter({ hasText: 'Search wins' }).waitFor();
    await page.reload();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route('**/japan-boundary*.js', async (route) => {
      await gate;
      await route.continue();
    });
    await page
      .getByText('Choose or correct coordinates', { exact: true })
      .click();
    await page.getByLabel('Latitude', { exact: true }).fill('35.6895');
    await page.getByLabel('Longitude', { exact: true }).fill('139.6917');
    await page
      .getByRole('button', { name: 'Select coordinates', exact: true })
      .click();
    await selection.filter({ hasText: 'Checking' }).waitFor();
    await submit('new intent while boundary pending');
    release();
    await requests
      .at(-1)
      .fulfill({ json: { type: 'FeatureCollection', features: [] } });
    await feedback.filter({ hasText: 'No supported Japan results' }).waitFor();
    assert.equal(await selection.textContent(), '');
    assert.equal(await page.locator('.maplibregl-marker').count(), 0);
  } finally {
    await browser.close();
  }
});

test(
  'real Photon accepts Japanese and Latin address components from the public map',
  { skip: !process.env.REAL_PROVIDER },
  async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage();
      const cases = [
        ['ja/', '東京都 新宿区 西新宿 2 8 1', '東京都庁'],
        [
          '',
          '2 8 1 Nishishinjuku Tokyo',
          'Tokyo Metropolitan Government Office',
        ],
        ['ja/', '与那国町', '与那国町'],
        ['', 'Chichijima', 'Chichijima'],
      ];
      for (const [path, query, expected] of cases) {
        await page.goto(`${base}/${path}`);
        await page.locator('canvas').waitFor();
        await page
          .getByRole('button', {
            name: path ? '現在地を取得' : 'Use my location',
            exact: true,
          })
          .waitFor();
        await page.waitForFunction(
          () => !document.querySelector('.device-location').disabled,
        );
        const responsePromise = page.waitForResponse((response) =>
          response.url().startsWith('https://photon.komoot.io/api/'),
        );
        await page.getByRole('searchbox').fill(query);
        await page.getByRole('searchbox').press('Enter');
        const response = await responsePromise;
        assert.equal(response.status(), 200);
        const data = await response.json();
        assert.ok(
          data.features.some((feature) => feature.properties.name === expected),
        );
        assert.ok(
          data.features.every(
            (feature) => feature.properties.countrycode === 'JP',
          ),
        );
        await page
          .locator('#address-search-feedback')
          .filter({ hasText: path ? '複数の場所' : 'Multiple places found' })
          .waitFor();
        assert.equal(await page.locator('.maplibregl-marker').count(), 0);
        console.log(
          `${query}: ${data.features.length} Japan matches, expected place present, ambiguity retained`,
        );
      }
    } finally {
      await browser.close();
    }
  },
);
