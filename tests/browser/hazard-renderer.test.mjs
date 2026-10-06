import process from 'node:process';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { build } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('public renderer uses ordered source pixels, transparent fallback, partial failures and stale-response cancellation', async () => {
  const bundle = await build({
    configFile: false,
    logLevel: 'error',
    build: {
      write: false,
      lib: {
        entry: 'tests/browser/fixtures/hazard-renderer.mjs',
        formats: ['es'],
        fileName: 'renderer',
      },
    },
  });
  const javascript = (Array.isArray(bundle) ? bundle[0] : bundle).output.find(
    (file) => file.type === 'chunk' && file.isEntry,
  ).code;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    await page.route('**/renderer.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: javascript }),
    );
    await page.goto(base);
    const pngs = await page.evaluate(() => {
      return [
        [0, 0, 255, 255],
        [255, 0, 0, 128],
      ].map((color) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const context = canvas.getContext('2d');
        const pixels = new Uint8ClampedArray(256 * 256 * 4);
        for (let offset = 0; offset < pixels.length; offset += 4)
          pixels.set(color, offset);
        context.putImageData(new ImageData(pixels, 256, 256), 0, 0);
        return canvas.toDataURL().split(',')[1];
      });
    });
    let mode = 'success';
    const pending = [];
    await page.route('https://fixture.test/**', async (route) => {
      const upper = route.request().url().includes('/upper/');
      if (upper && mode === 'pending') {
        pending.push(route);
        return;
      }
      if (upper && mode === 'failed') {
        await route.fulfill({ status: 404 });
        return;
      }
      const body =
        mode === 'transparent' && upper
          ? await page.evaluate(() => {
              const c = document.createElement('canvas');
              c.width = c.height = 256;
              return c.toDataURL().split(',')[1];
            })
          : pngs[upper ? 1 : 0];
      await route.fulfill({
        contentType: 'image/png',
        body: Buffer.from(body, 'base64'),
      });
    });
    await page.setContent(
      '<div id="map" style="width:512px;height:512px"></div><button id="enable">Enable</button><button id="disable">Disable</button><p id="status" role="status"></p><script type="module" src="/renderer.js"></script>',
    );
    async function pixel() {
      return page.evaluate(() => {
        const source = document.querySelector('#map canvas');
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const context = canvas.getContext('2d');
        context.drawImage(source, 0, 0);
        return [...context.getImageData(200, 200, 1, 1).data];
      });
    }
    async function waitPixel(expected) {
      for (let i = 0; i < 100; i++) {
        if (JSON.stringify(await pixel()) === JSON.stringify(expected)) return;
        await page.waitForTimeout(50);
      }
      assert.deepEqual(await pixel(), expected);
    }
    await page.getByRole('button', { name: 'Enable', exact: true }).click();
    await waitPixel([255, 127, 127, 255]); // Red over white, never red over blue.
    await page.getByRole('button', { name: 'Disable', exact: true }).click();
    mode = 'transparent';
    await page.getByRole('button', { name: 'Enable', exact: true }).click();
    await waitPixel([0, 0, 255, 255]);
    await page.getByRole('button', { name: 'Disable', exact: true }).click();
    mode = 'failed';
    await page.getByRole('button', { name: 'Enable', exact: true }).click();
    await page
      .getByRole('status')
      .filter({ hasText: '"upper":"failed"' })
      .waitFor();
    await waitPixel([0, 0, 255, 255]);
    await page.getByRole('button', { name: 'Disable', exact: true }).click();
    mode = 'pending';
    await page.getByRole('button', { name: 'Enable', exact: true }).click();
    await page
      .getByRole('status')
      .filter({ hasText: '"upper":"loading"' })
      .waitFor();
    await page.getByRole('button', { name: 'Disable', exact: true }).click();
    for (const route of pending)
      await route
        .fulfill({
          contentType: 'image/png',
          body: Buffer.from(pngs[1], 'base64'),
        })
        .catch(() => {});
    await waitPixel([255, 255, 255, 255]);
  } finally {
    await browser.close();
  }
});
