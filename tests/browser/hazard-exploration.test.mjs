import process from 'node:process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
import { browserSession } from '../support/browser.mjs';
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
// Test rendered pixels against fixed official palette colours, independent of map internals.
test('all eight category combinations preserve source colours and drawing order', async () => {
  const { PNG } = require(process.env.PNG_MODULE || 'pngjs');
  const colours = {
    '01_flood_l2_shinsuishin_data': [255, 216, 192],
    '01_flood_l2_shinsuishin_kuni_data': [255, 183, 183],
    '04_tsunami_newlegend_data': [242, 133, 201],
    '05_jisuberikeikaikuiki': [255, 153, 0],
    '05_dosekiryukeikaikuiki': [230, 200, 50],
    '05_kyukeishakeikaikuiki': [250, 230, 0],
  };
  function tile(colour) {
    const image = new PNG({ width: 256, height: 256 });
    for (let i = 0; i < image.data.length; i += 4)
      image.data.set([...colour, 255], i);
    return PNG.sync.write(image);
  }
  const browser = await browserSession();
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    await page.route('**/xyz/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: tile([240, 240, 240]) }),
    );
    await page.route('**/raster/**', (route) => {
      const name = new URL(route.request().url()).pathname.split('/')[2];
      assert.ok(
        colours[name],
        'Only the verified official datasets are requested',
      );
      return route.fulfill({
        contentType: 'image/png',
        body: tile(colours[name]),
      });
    });
    await page.goto(base);
    await page.locator('canvas').waitFor();
    await page.locator('[data-sidebar-opener]').click();
    const switches = ['Tsunami', 'Flooding', 'Landslide'].map((name) =>
      page.getByRole('switch', { name, exact: true }),
    );
    for (let bits = 0; bits < 8; bits++) {
      const enabled = [Boolean(bits & 1), Boolean(bits & 2), Boolean(bits & 4)];
      for (let i = 0; i < switches.length; i++)
        await switches[i].setChecked(enabled[i]);
      await page.waitForFunction(
        (count) =>
          document.querySelectorAll('[data-hazard-legend]').length === count,
        enabled.filter(Boolean).length,
      );
      assert.equal(
        await page.locator('[data-hazard-legend]').count(),
        enabled.filter(Boolean).length,
      );
      if (!bits)
        await page
          .getByText(
            'No hazard categories enabled. This is not a safety assessment.',
            { exact: true },
          )
          .waitFor();
      const expected = enabled[2]
        ? [250, 230, 0]
        : enabled[0]
          ? [242, 133, 201]
          : enabled[1]
            ? [255, 183, 183]
            : [240, 240, 240];
      let actual;
      for (let attempt = 0; attempt < 30; attempt++) {
        const screenshot = PNG.sync.read(
          await page.locator('canvas').screenshot(),
        );
        const offset =
          (Math.floor(screenshot.height * 0.3) * screenshot.width +
            Math.floor(screenshot.width * 0.8)) *
          4;
        actual = [...screenshot.data.subarray(offset, offset + 3)];
        if (actual.every((channel, i) => channel === expected[i])) break;
        await page.waitForTimeout(100);
      }
      assert.deepEqual(
        actual,
        expected,
        `Source colours and order for combination ${bits}`,
      );
    }
  } finally {
    await browser.close();
  }
});
