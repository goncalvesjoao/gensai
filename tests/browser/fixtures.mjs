import { PNG } from 'pngjs';

function solidTile(colour) {
  const image = new PNG({ width: 256, height: 256 });
  for (let pixel = 0; pixel < image.data.length; pixel += 4)
    image.data.set(colour, pixel);
  return PNG.sync.write(image);
}

const paleTile = solidTile([240, 240, 240, 255]);
const emptyHazardTile = solidTile([0, 0, 0, 0]);

// Install before case-specific routes: Playwright gives later page routes priority.
// These fixtures establish interaction/rendering only, never official coverage.
export async function createFixturePage(browser, options = {}) {
  const page = await browser.newPage({ ...options, serviceWorkers: 'block' });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (
      ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.hostname.endsWith('.localhost')
    )
      return route.continue();
    if (
      url.hostname === 'cyberjapandata.gsi.go.jp' &&
      url.pathname.startsWith('/xyz/pale/')
    )
      return route.fulfill({ contentType: 'image/png', body: paleTile });
    if (
      url.hostname === 'disaportaldata.gsi.go.jp' &&
      url.pathname.startsWith('/raster/')
    )
      return route.fulfill({ contentType: 'image/png', body: emptyHazardTile });
    if (url.hostname === 'photon.komoot.io' && url.pathname === '/api/')
      return route.fulfill({ json: { features: [] } });
    await route.abort('blockedbyclient');
    throw new Error(
      `Unexpected external request in routine acceptance: ${url}`,
    );
  });
  return page;
}
