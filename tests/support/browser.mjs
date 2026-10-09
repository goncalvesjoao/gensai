import { after } from 'node:test';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { PNG } = require(process.env.PNG_MODULE || 'pngjs');
const tile = new PNG({ width: 256, height: 256 });
for (let pixel = 0; pixel < tile.data.length; pixel += 4)
  tile.data.set([240, 240, 240, 255], pixel);
const body = PNG.sync.write(tile);
let launched;

after(async () => {
  if (launched) await (await launched).close();
});

// Each test owns its contexts; only the Chromium process is shared within a file.
export async function browserSession() {
  launched ??= chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  const browser = await launched;
  const contexts = [];
  return {
    async newPage(options = {}) {
      const context = await browser.newContext(options);
      contexts.push(context);
      await context.route('https://cyberjapandata.gsi.go.jp/xyz/**', (route) =>
        route.fulfill({ contentType: 'image/png', body }),
      );
      if (process.env.REAL_HAZARDS !== '1')
        await context.route(
          'https://disaportaldata.gsi.go.jp/raster/**',
          (route) => route.fulfill({ contentType: 'image/png', body }),
        );
      if (!process.env.REAL_PROVIDER)
        await context.route('https://photon.komoot.io/api/**', (route) =>
          route.fulfill({ json: { type: 'FeatureCollection', features: [] } }),
        );
      return context.newPage();
    },
    async close() {
      await Promise.all(contexts.map((context) => context.close()));
    },
  };
}
