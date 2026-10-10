import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('floating controls offer independent search, device and horizontal zoom', async () => {
  const browser = await browserSession();
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    let searches = 0;
    await page.route('https://photon.komoot.io/api/**', (route) => {
      searches++;
      return route.fulfill({
        json: { type: 'FeatureCollection', features: [] },
      });
    });
    await page.addInitScript(() => {
      window.locationRequests = 0;
      navigator.geolocation.getCurrentPosition = () =>
        window.locationRequests++;
    });
    await page.goto(base);
    const location = page.getByRole('button', {
      name: 'Use my location',
      exact: true,
    });
    await location.waitFor();
    await page.locator('canvas').waitFor();
    await page
      .getByText('Loading map…', { exact: true })
      .waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => window.locationRequests), 0);
    await page.getByRole('searchbox').fill('Tokyo');
    await page.getByRole('searchbox').press('Enter');
    await page
      .getByText('No supported Japan results.', { exact: false })
      .waitFor();
    assert.equal(searches, 1);
    await location.click();
    assert.equal(await page.evaluate(() => window.locationRequests), 1);
    assert.equal(searches, 1);
    const minus = await page
      .getByRole('button', { name: 'Zoom out', exact: true })
      .boundingBox();
    const plus = await page
      .getByRole('button', { name: 'Zoom in', exact: true })
      .boundingBox();
    assert.equal(minus.y, plus.y);
    assert.ok(minus.x < plus.x);
  } finally {
    await browser.close();
  }
});

test('home destination follows active language and preserves a separate search group', async () => {
  const browser = await browserSession();
  try {
    for (const locale of ['en', 'ja']) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      await page.goto(`${base}${locale === 'ja' ? '/ja' : '/'}`);
      const home = page.getByRole('link', {
        name: locale === 'ja' ? 'ホーム' : 'Home',
        exact: true,
      });
      await home.waitFor({ timeout: 3000 });
      const destination = new URL(await home.getAttribute('href'), base);
      const expected = new URL(
        process.env.HOME_TEST_URL
          ? locale === 'ja'
            ? '/ja'
            : '/'
          : locale === 'ja'
            ? '/ja/welcome'
            : '/welcome',
        process.env.HOME_TEST_URL || base,
      );
      assert.equal(destination.href, expected.href);
      const box = await home.boundingBox();
      const search = await page.getByRole('searchbox').boundingBox();
      assert.ok(box.x + box.width <= search.x);
      assert.ok(
        search.y >= box.y && search.y + search.height <= box.y + box.height,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
