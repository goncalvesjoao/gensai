import process from 'node:process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { browserSession } from '../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

// Built chunk requests verify lazy loading that jsdom cannot exercise.
test('boundary geometry loads only after the first device selection', async () => {
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
  } finally {
    await browser.close();
  }
});
