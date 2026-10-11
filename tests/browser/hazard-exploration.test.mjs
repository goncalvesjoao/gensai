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
  const sources = Object.keys(colours);
  function tile(colour, layer = 0) {
    const image = new PNG({ width: 256, height: 256 });
    for (let i = 0; i < image.data.length; i += 4)
      image.data.set(
        [...colour, (i / 4) % 256 >= (layer * 256) / 6 ? 255 : 0],
        i,
      );
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
        body: tile(colours[name], sources.indexOf(name)),
      });
    });
    await page.goto(base);
    await page.locator('canvas').waitFor();
    // Six tile stripes expose every layer, including otherwise hidden sources.
    const samples = await page.evaluate(() => {
      const map = window.__gensaiMapInstance;
      const lat =
        (Math.atan(Math.sinh(Math.PI * (1 - (2 * 101.5) / 256))) * 180) /
        Math.PI;
      map.jumpTo({ center: [(455.5 / 512) * 360 - 180, lat], zoom: 8 });
      return Array.from({ length: 6 }, (_, stripe) => {
        const point = map.project([
          ((455 + (stripe + 0.5) / 6) / 512) * 360 - 180,
          lat,
        ]);
        return { x: Math.floor(point.x), y: Math.floor(point.y) };
      });
    });
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
      const expected = sources.map((_, stripe) => {
        const visible = sources
          .slice(0, stripe + 1)
          .filter(
            (name, layer) => enabled[layer < 2 ? 1 : layer === 2 ? 0 : 2],
          );
        return visible.length ? colours[visible.at(-1)] : [240, 240, 240];
      });
      let actual;
      for (let attempt = 0; attempt < 30; attempt++) {
        const screenshot = PNG.sync.read(
          await page.locator('canvas').screenshot(),
        );
        actual = samples.map(({ x, y }) => {
          const offset = (y * screenshot.width + x) * 4;
          return [...screenshot.data.subarray(offset, offset + 3)];
        });
        if (
          actual.every((colour, stripe) =>
            colour.every((channel, i) => channel === expected[stripe][i]),
          )
        )
          break;
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
