import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
const { PNG } = require(process.env.PNG_MODULE || 'pngjs');
const fixture = new PNG({ width: 256, height: 256 });
for (let pixel = 0; pixel < fixture.data.length; pixel += 4)
  fixture.data.set([240, 240, 240, 255], pixel);
const png = PNG.sync.write(fixture);

test('muted official basemap loads, and unavailable basemap is explained', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    let pale = false;
    await page.route('**/xyz/**', (route) => {
      pale ||= route.request().url().includes('/pale/');
      return route.fulfill({ contentType: 'image/png', body: png });
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.locator('canvas').waitFor();
    await page.waitForTimeout(1500);
    assert.equal(pale, true);
    await page.unroute('**/xyz/**');
    await page.route('**/xyz/**', (route) => route.abort());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page
      .getByText(
        'Could not load the basemap. Hazard data may still be available.',
        { exact: true },
      )
      .waitFor();
  } finally {
    await browser.close();
  }
});

test('tsunami switch exposes official legend, reports delayed and failed tiles, and hides immediately', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route('**/xyz/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.route('**/raster/**', async (route) => {
      await gate;
      await route.abort();
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('switch', { name: 'Tsunami', exact: true }).check();
    const legend = page.locator('[data-hazard-legend="tsunami"]');
    await legend.getByText('Loading tiles…', { exact: false }).waitFor();
    await page.getByRole('switch', { name: 'Tsunami', exact: true }).uncheck();
    await legend.waitFor({ state: 'detached' });
    release();
    await page.getByRole('switch', { name: 'Tsunami', exact: true }).check();
    await legend.getByText(/Tile request failed/).waitFor();
    assert.match(
      await page.locator('.hazard-warning').textContent(),
      /No colour does not mean safe/,
    );
    await page.locator('.grip-toggle').click();
    assert.equal(await legend.isVisible(), true);
    assert.equal(
      await page
        .getByRole('link', { name: 'Source: MLIT / GSI Hazard Map Portal' })
        .isVisible(),
      true,
    );
  } finally {
    await browser.close();
  }
});

test('landslide legend separates three types and explains partial failure without losing other tiles', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    await page.route('**/xyz/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.route('**/raster/**', (route) =>
      route.request().url().includes('05_jisuberi')
        ? route.abort()
        : route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('switch', { name: 'Landslide', exact: true }).check();
    const legend = page.locator('[data-hazard-legend="landslide"]');
    await legend.getByText('Debris flow', { exact: true }).waitFor();
    await legend.getByText('Steep-slope collapse', { exact: true }).waitFor();
    await legend
      .getByText('Landslide warning zones', { exact: true })
      .waitFor();
    await legend
      .locator('[data-hazard-source="landslide"]')
      .filter({ hasText: 'Tile request failed' })
      .waitFor();
    for (const id of ['debris', 'steep-slope'])
      await legend
        .locator(`[data-hazard-source="${id}"]`)
        .filter({ hasText: 'Viewport tiles loaded' })
        .waitFor();
    await page
      .getByRole('switch', { name: 'Landslide', exact: true })
      .uncheck();
    await legend.waitFor({ state: 'detached' });
  } finally {
    await browser.close();
  }
});

test('flooding shows maximum-scale river depths and independent combined and national availability', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    await page.route('**/xyz/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.route('**/raster/**', (route) =>
      route.request().url().includes('01_flood_l2_shinsuishin_kuni')
        ? route.fulfill({ status: 404 })
        : route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('switch', { name: 'Flooding', exact: true }).check();
    const legend = page.locator('[data-hazard-legend="flooding"]');
    await legend.getByText('20 m or more', { exact: true }).waitFor();
    await legend
      .locator('[data-hazard-source="flood-national"]')
      .filter({ hasText: 'Some requested tiles were not supplied' })
      .waitFor();
    await legend
      .locator('[data-hazard-source="flood-combined"]')
      .filter({ hasText: 'Viewport tiles loaded' })
      .waitFor();
    await page.getByRole('switch', { name: 'Flooding', exact: true }).uncheck();
    await legend.waitFor({ state: 'detached' });
  } finally {
    await browser.close();
  }
});

test(
  'live official rasters render around river, coastal and slope locations',
  { skip: process.env.REAL_HAZARDS !== '1' },
  async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      const responses = [];
      page.on('response', (response) => {
        if (response.url().includes('disaportaldata.gsi.go.jp/raster/'))
          responses.push({
            url: response.url(),
            status: response.status(),
            type: response.headers()['content-type'],
          });
      });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      for (const name of ['Flooding', 'Landslide'])
        await page.getByRole('switch', { name, exact: true }).check();
      await page
        .getByText('Choose or correct coordinates', { exact: true })
        .click();
      for (const [lat, lng] of [
        [35.6895, 139.6917],
        [35.319, 139.551],
        [35.331, 139.545],
      ]) {
        await page.getByLabel('Latitude', { exact: true }).fill(String(lat));
        await page.getByLabel('Longitude', { exact: true }).fill(String(lng));
        await page
          .getByRole('button', { name: 'Select coordinates', exact: true })
          .click();
        await page
          .locator('.map-selection [role="status"]')
          .filter({ hasText: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
          .waitFor();
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll('[data-hazard-source]')].length ===
              6 &&
            [...document.querySelectorAll('[data-hazard-source]')].every(
              (status) => !status.textContent.includes('Loading tiles'),
            ),
        );
      }
      for (const path of [
        '04_tsunami_newlegend_data',
        '01_flood_l2_shinsuishin_data',
        '01_flood_l2_shinsuishin_kuni_data',
        '05_dosekiryukeikaikuiki',
        '05_kyukeishakeikaikuiki',
        '05_jisuberikeikaikuiki',
      ])
        assert.equal(
          responses.some((response) => response.url.includes(`/${path}/`)),
          true,
          `Missing live source response: ${path}`,
        );
      assert.ok(
        responses.filter(
          (response) =>
            response.status === 200 && response.type?.includes('image/png'),
        ).length > 0,
      );
      assert.equal(await page.locator('.maplibregl-marker').isVisible(), true);
      if (process.env.SCREENSHOT_DIR)
        await page.screenshot({
          path: `${process.env.SCREENSHOT_DIR}/hazards-live-kamakura.png`,
        });
    } finally {
      await browser.close();
    }
  },
);

test('turning all categories off explicitly avoids a safety verdict', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    await page.route('**/xyz/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.route('**/raster/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByRole('switch', { name: 'Tsunami', exact: true }).uncheck();
    await page
      .getByText(
        'No hazard categories enabled. This is not a safety assessment.',
        { exact: true },
      )
      .waitFor();
    assert.equal(await page.locator('[data-hazard-legend]').count(), 0);
    await page.goto(`${base}/ja/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('switch', { name: '津波', exact: true }).uncheck();
    await page
      .getByText(
        'ハザードの種類が選択されていません。安全性の評価ではありません。',
        { exact: true },
      )
      .waitFor();
  } finally {
    await browser.close();
  }
});

for (const status of [404, 500])
  test(`cached pan preserves ${status} hazard failures, and successful new tiles recover`, async () => {
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage();
      let requests = 0;
      let fail = true;
      let hold = false;
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      await page.route('**/xyz/**', (route) =>
        route.fulfill({ contentType: 'image/png', body: png }),
      );
      await page.route('**/raster/**', async (route) => {
        requests++;
        if (hold) await gate;
        return fail
          ? route.fulfill({ status })
          : route.fulfill({ contentType: 'image/png', body: png });
      });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const explanation =
        status === 404
          ? 'Some requested tiles were not supplied'
          : 'Tile request failed';
      const source = page.locator('[data-hazard-source="tsunami"]');
      await source.filter({ hasText: explanation }).waitFor();
      await page.waitForTimeout(800);
      const before = requests;
      hold = true;
      const canvas = await page.locator('canvas').boundingBox();
      await page.mouse.move(
        canvas.x + canvas.width / 2,
        canvas.y + canvas.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        canvas.x + canvas.width / 2 + 8,
        canvas.y + canvas.height / 2,
        { steps: 4 },
      );
      await page.waitForTimeout(400);
      await page.mouse.up();
      await page.waitForTimeout(600);
      // A 500 can trigger a new parent-tile retry on pan. Hold that response
      // so it cannot hide loss of the existing failed viewport tile.
      if (status === 404)
        assert.equal(requests, before, 'small pan should use cached tiles');
      assert.match(await source.textContent(), new RegExp(explanation));
      fail = false;
      hold = false;
      release();
      await page
        .getByText('Choose or correct coordinates', { exact: true })
        .click();
      await page.getByLabel('Latitude', { exact: true }).fill('35.6895');
      await page.getByLabel('Longitude', { exact: true }).fill('139.6917');
      await page
        .getByRole('button', { name: 'Select coordinates', exact: true })
        .click();
      await source.filter({ hasText: 'Viewport tiles loaded' }).waitFor();
      assert.ok(requests > before);
    } finally {
      await browser.close();
    }
  });

test('missing basemap tiles explain failure while hazard tiles remain usable', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    await page.route('**/xyz/**', (route) => route.fulfill({ status: 404 }));
    await page.route('**/raster/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page
      .getByText(
        'Could not load the basemap. Hazard data may still be available.',
        { exact: true },
      )
      .waitFor();
    await page
      .locator('[data-hazard-source="tsunami"]')
      .filter({ hasText: 'Viewport tiles loaded' })
      .waitFor();
    assert.equal(
      await page.getByText('Loading map…', { exact: true }).count(),
      0,
    );
  } finally {
    await browser.close();
  }
});
