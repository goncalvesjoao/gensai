import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('device location is explicitly acquired and fresh on later activation', async () => {
  const browser = await browserSession();
  try {
    const page = await browser.newPage();
    const boundaryRequests = [];
    page.on('request', (request) => {
      if (/\/japan-boundary\.[^/]+\.js/.test(request.url()))
        boundaryRequests.push(request.url());
    });
    await page.addInitScript(() => {
      window.locationRequests = [];
      navigator.geolocation.getCurrentPosition = (success, failure, options) =>
        window.locationRequests.push({ success, failure, options });
    });
    await page.goto(base);
    await page.locator('canvas').waitFor();
    assert.equal(await page.evaluate(() => window.locationRequests.length), 0);
    const button = page.getByRole('button', {
      name: 'Use my location',
      exact: true,
    });
    await button.click({ timeout: 2000 });
    assert.equal(
      boundaryRequests.length,
      0,
      'Overview must not load boundary geometry',
    );
    await page.getByText('Finding your location…', { exact: true }).waitFor();
    await page.evaluate(() =>
      window.locationRequests[0].success({
        coords: { latitude: 35.6895, longitude: 139.6917 },
      }),
    );
    await page
      .getByRole('status')
      .filter({ hasText: '35.68950, 139.69170' })
      .waitFor();
    assert.equal(
      boundaryRequests.length,
      1,
      'First selection loads boundary geometry',
    );
    await button.click();
    assert.equal(await page.evaluate(() => window.locationRequests.length), 2);
    assert.equal(
      await page.evaluate(() => window.locationRequests[1].options.maximumAge),
      0,
    );
    await button.click();
    await page.evaluate(() =>
      window.locationRequests[1].success({
        coords: { latitude: 26.2124, longitude: 127.6809 },
      }),
    );
    assert.match(
      await page.getByRole('status').textContent(),
      /35\.68950, 139\.69170/,
    );
    await page.evaluate(() =>
      window.locationRequests[2].success({
        coords: { latitude: 24.467, longitude: 122.998 },
      }),
    );
    await page
      .getByRole('status')
      .filter({ hasText: '24.46700, 122.99800' })
      .waitFor();
    assert.equal(await button.getAttribute('aria-busy'), 'false');
  } finally {
    await browser.close();
  }
});
