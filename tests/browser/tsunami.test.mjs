import process from 'node:process';
import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';
async function tile(page) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    return canvas.toDataURL().split(',')[1];
  });
  return Buffer.from(base64, 'base64');
}

test('tsunami legend, warning and official attribution remain visible with menu closed; switching off removes pending layer', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    const png = await tile(page);
    await page.route('**/xyz/pale/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    const pending = [];
    await page.route('**/04_tsunami_newlegend_data/**', (route) =>
      pending.push(route),
    );
    await page.goto(base);
    await page
      .getByRole('heading', { name: 'Tsunami inundation depth' })
      .waitFor();
    await page.getByText('Loading hazard tiles…', { exact: true }).waitFor();
    await page
      .getByText('No colour does not mean safe. Data may be missing.', {
        exact: true,
      })
      .waitFor();
    assert.equal(await page.locator('[data-hazard-legend] li').count(), 8);
    await page
      .getByRole('button', { name: 'Close sidebar', exact: true })
      .first()
      .click();
    assert.ok(
      await page
        .getByRole('link', {
          name: '出典：ハザードマップポータルサイト（津波浸水想定／都道府県データ）',
          exact: true,
        })
        .isVisible(),
    );
    await page
      .getByRole('button', { name: 'Open sidebar', exact: true })
      .first()
      .click();
    await page.getByRole('switch', { name: 'Tsunami', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Tsunami inundation depth' })
      .waitFor({ state: 'hidden' });
    for (const route of pending)
      await route
        .fulfill({ contentType: 'image/png', body: png })
        .catch(() => {});
    assert.equal(
      await page
        .getByRole('heading', { name: 'Tsunami inundation depth' })
        .count(),
      0,
    );
  } finally {
    await browser.close();
  }
});

for (const [path, failure, heading, warning] of [
  [
    '/',
    'Hazard tile request failed. This does not mean no mapped hazard. Reload to retry.',
    'Tsunami inundation depth',
    'No colour does not mean safe. Data may be missing.',
  ],
  [
    '/ja',
    'ハザードタイルの取得に失敗しました。災害がないことを意味しません。再読み込みしてお試しください。',
    '津波浸水想定',
    '色なし＝安全ではありません。データが存在しない場合があります',
  ],
]) {
  test(`failed official hazard requests are not coverage or safety claims in ${path}`, async () => {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
      });
      const png = await tile(page);
      await page.route('**/xyz/pale/**', (route) =>
        route.fulfill({ contentType: 'image/png', body: png }),
      );
      await page.route('**/04_tsunami_newlegend_data/**', (route) =>
        route.fulfill({ status: 404 }),
      );
      await page.goto(`${base}${path}`);
      await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      await page.getByText(failure, { exact: true }).waitFor();
      assert.ok(await page.getByText(warning, { exact: true }).isVisible());
      assert.equal(await page.locator('[data-hazard-legend] li').count(), 8);
      // Basemap stays usable despite hazard failure.
      await page
        .getByRole('button', {
          name: path === '/ja' ? '拡大' : 'Zoom in',
          exact: true,
        })
        .click();
    } finally {
      await browser.close();
    }
  });
}

test('transparent successful tiles are loaded with unknown coverage, never a safety verdict', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    const png = await tile(page);
    await page.route('**/xyz/pale/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.route('**/04_tsunami_newlegend_data/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.goto(base);
    await page
      .getByText('Tiles loaded. Geographic coverage is unknown.', {
        exact: true,
      })
      .waitFor();
    const colors = await page
      .locator('[data-hazard-legend] li span')
      .evaluateAll((nodes) => nodes.map((node) => node.style.backgroundColor));
    assert.deepEqual(colors, [
      'rgb(255, 255, 179)',
      'rgb(247, 245, 169)',
      'rgb(248, 225, 166)',
      'rgb(255, 216, 192)',
      'rgb(255, 183, 183)',
      'rgb(255, 145, 145)',
      'rgb(242, 133, 201)',
      'rgb(220, 122, 220)',
    ]);
  } finally {
    await browser.close();
  }
});

test(
  'real official Sendai tsunami sample remains an accessible 256px PNG',
  { skip: !process.env.LIVE_OFFICIAL },
  async () => {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      const page = await browser.newPage();
      await page.goto(base);
      const sample = await page.evaluate(async () => {
        const response = await fetch(
          'https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/12/3651/1577.png',
        );
        if (!response.ok)
          throw new Error(`Official sample returned ${response.status}`);
        const image = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(
          0,
          0,
          image.width,
          image.height,
        ).data;
        let mappedPixels = 0;
        for (let i = 3; i < pixels.length; i += 4)
          if (pixels[i]) mappedPixels++;
        const result = {
          width: image.width,
          height: image.height,
          mappedPixels,
        };
        image.close();
        return result;
      });
      assert.equal(sample.width, 256);
      assert.equal(sample.height, 256);
      assert.ok(
        sample.mappedPixels > 0,
        'official sample contains mapped hazard pixels',
      );
    } finally {
      await browser.close();
    }
  },
);

test('basemap failures do not prevent independent hazard delivery', async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    const page = await browser.newPage();
    const png = await tile(page);
    await page.route('**/xyz/pale/**', (route) =>
      route.fulfill({ status: 500 }),
    );
    await page.route('**/04_tsunami_newlegend_data/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: png }),
    );
    await page.goto(base);
    await page
      .getByText(
        'Basemap request failed. Hazard requests are separate. Reload to retry.',
        { exact: true },
      )
      .waitFor();
    await page
      .getByText('Tiles loaded. Geographic coverage is unknown.', {
        exact: true,
      })
      .waitFor();
  } finally {
    await browser.close();
  }
});
