import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('address input waits for map selection readiness', async () => {
  const browser = await browserSession();
  try {
    const page = await browser.newPage();
    let release;
    const pending = new Promise((resolve) => (release = resolve));
    await page.route(/\/MapView\.[^/]+\.js$/, async (route) => {
      await pending;
      await route.continue();
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    try {
      assert.equal(await page.getByRole('searchbox').isDisabled(), true);
    } finally {
      release();
    }
    await page.getByRole('searchbox').fill('Tokyo');
    assert.equal(await page.getByRole('searchbox').isEnabled(), true);
  } finally {
    await browser.close();
  }
});
const match = (name, lng = 139.6917, lat = 35.6895, countrycode = 'JP') => ({
  type: 'Feature',
  properties: { name, countrycode },
  geometry: { type: 'Point', coordinates: [lng, lat] },
});

test('Enter selects a Japan address, while typing and device activation do not submit', async () => {
  const browser = await browserSession();
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

test('ambiguous Japan matches require an explicit keyboard choice', async () => {
  const browser = await browserSession();
  try {
    const page = await browser.newPage();
    await page.route('https://photon.komoot.io/api/**', (route) =>
      route.fulfill({
        json: {
          type: 'FeatureCollection',
          features: [
            match('Tokyo home'),
            match('Yonaguni home', 122.998, 24.467),
            match('Outside', 126.978, 37.5665),
          ],
        },
      }),
    );
    await page.goto(base);
    await page.locator('canvas').waitFor();
    const search = page.getByRole('searchbox');
    const selection = page.locator('.map-selection [role=status]');
    await search.fill('home');
    await search.press('Enter');
    const choice = page.getByRole('button', {
      name: 'Select Yonaguni home',
      exact: true,
    });
    await choice.waitFor({ timeout: 2000 });
    assert.equal(await page.locator('.maplibregl-marker').count(), 0);
    assert.equal(
      await page
        .getByRole('button', { name: 'Select Outside', exact: true })
        .count(),
      0,
    );
    await search.press('Tab');
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .getByRole('button', { name: 'Select Tokyo home', exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await choice.evaluate((el) => el === document.activeElement),
      true,
    );
    assert.equal(
      await choice.evaluate((el) => getComputedStyle(el).outlineStyle),
      'solid',
    );
    await page.keyboard.press('Enter');
    await selection.filter({ hasText: 'Yonaguni home' }).waitFor();
    assert.match(await selection.textContent(), /24\.46700, 122\.99800/);
    assert.equal(await page.locator('.maplibregl-marker').count(), 1);
    assert.equal(await choice.count(), 0);
    assert.equal(
      await search.evaluate((el) => el === document.activeElement),
      true,
    );
  } finally {
    await browser.close();
  }
});

test('capped suggestions remain explicit choices from an overseas device and location attempts clear them', async () => {
  const browser = await browserSession();
  try {
    const page = await browser.newPage();
    let features = [
      match('Tokyo home'),
      ...Array.from({ length: 9 }, (_, i) =>
        match(`Outside ${i}`, 126.978, 37.5665),
      ),
    ];
    await page.route('https://photon.komoot.io/api/**', (route) =>
      route.fulfill({ json: { type: 'FeatureCollection', features } }),
    );
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success) =>
        success({ coords: { latitude: 37.5665, longitude: 126.978 } });
    });
    await page.goto(base);
    await page.locator('canvas').waitFor();
    const device = page.getByRole('button', {
      name: 'Use my location',
      exact: true,
    });
    const selection = page.locator('.map-selection [role=status]');
    const search = page.getByRole('searchbox');
    await device.click();
    await selection.filter({ hasText: 'Tokyo fallback' }).waitFor();
    await search.fill('Home in Japan');
    await search.press('Enter');
    await selection
      .filter({ hasText: 'Selected location: Tokyo home' })
      .waitFor();
    features = Array.from({ length: 10 }, (_, i) =>
      match(
        `Home candidate ${i} with a long readable address`,
        i === 9 ? 122.998 : 139.6917,
        i === 9 ? 24.467 : 35.6895,
      ),
    );
    await search.press('Enter');
    const last = page.getByRole('button', {
      name: 'Select Home candidate 9 with a long readable address',
      exact: true,
    });
    await last.waitFor();
    assert.match(
      await page.locator('#address-search-feedback').textContent(),
      /Showing some matches. More places may match/,
    );
    await last.focus();
    await page.keyboard.press('Enter');
    await selection.filter({ hasText: '24.46700, 122.99800' }).waitFor();
    await page.locator('canvas').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => !window.__gensaiMapInstance.isMoving());
    await page.keyboard.press('Enter');
    await selection.filter({ hasNotText: 'Checking' }).waitFor();
    assert.doesNotMatch(await selection.textContent(), /Home candidate 9/);
    await search.press('Enter');
    await last.waitFor();
    await device.click();
    await last.waitFor({ state: 'detached' });
    await selection.filter({ hasText: 'Tokyo fallback' }).waitFor();
    await search.press('Enter');
    await last.waitFor();
    await page.locator('canvas').focus();
    await page.keyboard.press('Enter');
    await last.waitFor({ state: 'detached' });
    await selection.filter({ hasNotText: 'Checking' }).waitFor();
    await search.press('Enter');
    await last.waitFor();
    // A newer submission removes old choices even while its response is pending.
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route('https://photon.komoot.io/api/**', async (route) => {
      await gate;
      await route.fulfill({
        json: { type: 'FeatureCollection', features: [] },
      });
    });
    await search.press('Enter');
    await last.waitFor({ state: 'detached' });
    release();
    await page
      .locator('#address-search-feedback')
      .filter({ hasText: 'No supported Japan results' })
      .waitFor();
  } finally {
    await browser.close();
  }
});

// Real map events and a delayed emitted module cannot be verified in jsdom.
test('map selections cancel pending searches and searches cancel pending boundary selections', async () => {
  const browser = await browserSession();
  let release = () => {};
  try {
    const page = await browser.newPage();
    let receive;
    let requested = new Promise((resolve) => {
      receive = resolve;
    });
    await page.route('https://photon.komoot.io/api/**', (route) =>
      receive(route),
    );
    await page.goto(base);
    const search = page.getByRole('searchbox');
    const selection = page.locator('.map-selection [role=status]');
    const feedback = page.locator('#address-search-feedback');
    await search.fill('superseded by map');
    await search.press('Enter');
    const obsolete = await requested;
    await page.locator('canvas').focus();
    await page.keyboard.press('Enter');
    await obsolete
      .fulfill({
        json: { type: 'FeatureCollection', features: [match('Obsolete')] },
      })
      .catch(() => {});
    await selection.filter({ hasNotText: 'Checking' }).waitFor();
    assert.doesNotMatch(await selection.textContent(), /Obsolete/);
    assert.equal(await feedback.textContent(), '');

    await page.reload();
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    let boundaryRequested;
    const download = new Promise((resolve) => {
      boundaryRequested = resolve;
    });
    await page.route('**/japan-boundary*.js', async (route) => {
      boundaryRequested();
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
    await download;
    await selection.filter({ hasText: 'Checking' }).waitFor();
    requested = new Promise((resolve) => {
      receive = resolve;
    });
    await search.fill('new intent while boundary pending');
    await search.press('Enter');
    const latest = await requested;
    const loaded = page.waitForResponse((response) =>
      /\/japan-boundary[^/]*\.js/.test(response.url()),
    );
    release();
    await (await loaded).finished();
    await latest.fulfill({ json: { type: 'FeatureCollection', features: [] } });
    await feedback.filter({ hasText: 'No supported Japan results' }).waitFor();
    assert.equal(await selection.textContent(), '');
    assert.equal(await page.locator('.maplibregl-marker').count(), 0);
  } finally {
    release();
    await browser.close();
  }
});

test(
  'real Photon accepts Japanese and Latin address components from the public map',
  { skip: !process.env.REAL_PROVIDER },
  async () => {
    const browser = await browserSession();
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
          .filter({
            hasText: path
              ? /複数の場所|検索結果の一部/
              : /Multiple places found|Showing some matches/,
          })
          .waitFor();
        assert.equal(await page.locator('.maplibregl-marker').count(), 0);
        await page
          .getByRole('button')
          .filter({ hasText: expected })
          .first()
          .click();
        await page
          .locator('.map-selection [role=status]')
          .filter({ hasText: expected })
          .waitFor();
        assert.equal(await page.locator('.maplibregl-marker').count(), 1);
        console.log(
          `${query}: ${data.features.length} Japan matches, expected place present, ambiguity retained`,
        );
      }
    } finally {
      await browser.close();
    }
  },
);
