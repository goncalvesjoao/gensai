import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('public map uses native pale tiles with GSI attribution and hazard-compatible zoom', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    const requests = [];
    page.on('request', (request) => {
      if (request.url().includes('cyberjapandata.gsi.go.jp'))
        requests.push(request.url());
    });
    await page.goto(base);
    await page.waitForFunction(() =>
      window.__gensaiMapInstance?.isStyleLoaded(),
    );
    const settings = await page.evaluate(() => {
      const map = window.__gensaiMapInstance;
      return {
        basemap: map.getStyle().sources.basemap,
        maxZoom: map.getMaxZoom(),
      };
    });
    assert.deepEqual(settings.basemap.tiles, [
      'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    ]);
    assert.equal(settings.basemap.minzoom, 2);
    assert.equal(settings.basemap.maxzoom, 18);
    assert.equal(settings.maxZoom, 17);
    assert.ok(requests.some((url) => /\/xyz\/pale\//.test(url)));
    assert.ok(requests.every((url) => !/\/xyz\/std\//.test(url)));
    const attribution = page.getByRole('link', {
      name: '地理院タイル（国土地理院）',
      exact: true,
    });
    await attribution.waitFor({ state: 'visible' });
    assert.equal(
      await attribution.getAttribute('href'),
      'https://maps.gsi.go.jp/development/ichiran.html',
    );
    const initialZoom = await page.evaluate(() =>
      window.__gensaiMapInstance.getZoom(),
    );
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
    await page.waitForFunction(
      (zoom) => window.__gensaiMapInstance.getZoom() > zoom,
      initialZoom,
    );
  } finally {
    await browser.close();
  }
});
