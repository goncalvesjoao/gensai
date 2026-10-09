import { waitForThemeReady } from './helpers.mjs';
import { createFixturePage } from './fixtures.mjs';
import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
const tile = new PNG({ width: 256, height: 256 });
for (let pixel = 0; pixel < tile.data.length; pixel += 4)
  tile.data.set([240, 240, 240, 255], pixel);
const tilePng = PNG.sync.write(tile);
const hazardTile = new PNG({ width: 256, height: 256 });
for (let y = 0; y < 256; y++)
  for (let x = 0; x < 128; x++)
    hazardTile.data.set([255, 183, 183, 255], (y * 256 + x) * 4);
const hazardPng = PNG.sync.write(hazardTile);
const base = process.env.TEST_URL || 'http://127.0.0.1:4321';

test('theme modes cycle, identify their selection and restore across reloads', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const route of ['/', '/ja', '/welcome', '/ja/welcome']) {
      for (const width of [390, 1440]) {
        for (const scheme of ['light', 'dark']) {
          const page = await createFixturePage(browser, {
            viewport: { width, height: 900 },
            colorScheme: scheme,
          });
          await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
          const button = page.locator('#theme-toggle');
          const japanese = route.startsWith('/ja');
          for (const [mode, next, icon, appearance] of [
            ['System', 'Light', 'sun-moon', scheme],
            ['Light', 'Dark', 'sun', 'light'],
            ['Dark', 'System', 'moon', 'dark'],
            ['System', 'Light', 'sun-moon', scheme],
          ]) {
            const names = {
              System: 'システム',
              Light: 'ライト',
              Dark: 'ダーク',
            };
            const label = japanese
              ? `現在のテーマ：${names[mode]}。${names[next]}テーマに切り替える`
              : `Current theme: ${mode}. Switch to ${next} theme`;
            await page
              .getByRole('button', { name: label, exact: true })
              .waitFor();
            assert.equal(await button.locator(`svg.lucide-${icon}`).count(), 1);
            assert.equal(
              await page.locator('html').getAttribute('data-theme'),
              appearance,
            );
            const box = await button.boundingBox();
            assert.ok(
              box.width >= 36 && box.x >= 0 && box.x + box.width <= width,
            );
            await waitForThemeReady(page);
            await button.focus();
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            assert.ok(
              await button.evaluate(
                (el) =>
                  el === document.activeElement &&
                  getComputedStyle(el).boxShadow !== 'none',
              ),
              `${route} ${width} ${scheme} ${mode} has keyboard focus`,
            );
            await page.mouse.move(0, 0);
            await button.hover();
            await page.getByText(label, { exact: true }).waitFor();
            assert.equal(
              await page.getByText(label, { exact: true }).textContent(),
              label,
            );
            await page.reload({ waitUntil: 'domcontentloaded' });
            await page
              .getByRole('button', { name: label, exact: true })
              .waitFor();
            assert.equal(
              await page.locator('html').getAttribute('data-theme'),
              appearance,
            );
            await waitForThemeReady(page);
            await button.focus();
            await button.press('Enter');
          }
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test('saved explicit and invalid modes hydrate correctly and blocked storage permits the whole cycle', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const route of ['/', '/ja', '/welcome', '/ja/welcome']) {
      for (const saved of ['light', 'dark', 'system', 'invalid', 'blocked']) {
        const page = await createFixturePage(browser, { colorScheme: 'dark' });
        await page.addInitScript((saved) => {
          if (saved === 'blocked') {
            Object.defineProperty(window, 'localStorage', {
              get() {
                throw new Error('Storage blocked');
              },
            });
          } else {
            localStorage.setItem('gensai-theme', saved);
          }
        }, saved);
        await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
        const button = page.locator('#theme-toggle');
        await button.waitFor();
        await waitForThemeReady(page);
        const initial = ['light', 'dark'].includes(saved) ? saved : 'system';
        assert.equal(
          await page.locator('html').getAttribute('data-theme-mode'),
          initial,
        );
        assert.equal(
          await page.locator('html').getAttribute('data-theme'),
          initial === 'light' ? 'light' : 'dark',
        );
        if (saved === 'blocked') {
          for (const [mode, appearance] of [
            ['light', 'light'],
            ['dark', 'dark'],
            ['system', 'dark'],
          ]) {
            await button.click();
            assert.equal(
              await page.locator('html').getAttribute('data-theme-mode'),
              mode,
            );
            assert.equal(
              await page.locator('html').getAttribute('data-theme'),
              appearance,
            );
          }
        }
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test('System follows live appearance changes while explicit modes stay fixed', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const route of ['/', '/ja', '/welcome', '/ja/welcome']) {
      for (const width of [390, 1440]) {
        for (const storage of ['available', 'blocked']) {
          const page = await createFixturePage(browser, {
            viewport: { width, height: 900 },
            colorScheme: 'light',
          });
          await page.route('**/xyz/**', (route) =>
            route.fulfill({ contentType: 'image/png', body: tilePng }),
          );
          await page.route('**/raster/**', (route) =>
            route.fulfill({ contentType: 'image/png', body: hazardPng }),
          );
          await page.addInitScript((storage) => {
            if (storage === 'blocked')
              Object.defineProperty(window, 'localStorage', {
                get() {
                  throw new Error('Storage blocked');
                },
              });
            else localStorage.setItem('gensai-theme', 'system');
          }, storage);
          await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
          const button = page.locator('#theme-toggle');
          await waitForThemeReady(page);
          const systemLabel = route.startsWith('/ja')
            ? '現在のテーマ：システム。ライトテーマに切り替える'
            : 'Current theme: System. Switch to Light theme';
          const mapRoute = !route.endsWith('welcome');
          const japanese = route.startsWith('/ja');
          const flood = page.getByRole('switch', {
            name: japanese ? '洪水' : 'Flooding',
            exact: true,
          });
          const tsunami = page.getByRole('switch', {
            name: japanese ? '津波' : 'Tsunami',
            exact: true,
          });
          if (mapRoute) {
            await page.locator('[data-sidebar-opener]').click();
            await tsunami.uncheck();
            await flood.check();
            await page
              .getByText(
                japanese
                  ? '座標で場所を選択・修正'
                  : 'Choose or correct coordinates',
                { exact: true },
              )
              .click();
            await page
              .getByLabel(japanese ? '緯度' : 'Latitude', { exact: true })
              .fill('35.6895');
            await page
              .getByLabel(japanese ? '経度' : 'Longitude', { exact: true })
              .fill('139.6917');
            await page
              .getByRole('button', {
                name: japanese ? '座標を選択' : 'Select coordinates',
                exact: true,
              })
              .click();
            await page
              .getByRole('status')
              .filter({ hasText: '35.68950, 139.69170' })
              .waitFor();
            await page
              .locator('[data-hazard-source="flood-combined"]')
              .filter({
                hasText: japanese ? '表示範囲' : 'Viewport tiles loaded',
              })
              .waitFor();
          }
          async function appearance(scheme, mode = 'system') {
            await page.waitForFunction(
              ({ scheme, mode }) =>
                document.documentElement.dataset.theme === scheme &&
                document.documentElement.dataset.themeMode === mode,
              { scheme, mode },
              { timeout: 3000 },
            );
            if (mapRoute) {
              assert.equal(await flood.isChecked(), true);
              assert.equal(await tsunami.isChecked(), false);
              assert.equal(
                await page
                  .locator('.page-shell')
                  .getAttribute('data-sidebar-open'),
                'true',
              );
              assert.equal(await page.locator('.maplibregl-marker').count(), 1);
              assert.ok(
                await page
                  .getByRole('status')
                  .filter({ hasText: '35.68950, 139.69170' })
                  .isVisible(),
              );
              const image = PNG.sync.read(
                await page.locator('canvas').screenshot(),
              );
              for (const colour of [
                [255, 183, 183],
                [240, 240, 240],
              ]) {
                let found = false;
                for (let pixel = 0; pixel < image.data.length; pixel += 4) {
                  if (
                    colour.every(
                      (channel, index) => image.data[pixel + index] === channel,
                    )
                  ) {
                    found = true;
                    break;
                  }
                }
                assert.ok(
                  found,
                  `rendered map contains unchanged source colour ${colour}`,
                );
              }
            }
            if (mode === 'system') {
              assert.equal(
                await button.getAttribute('aria-label'),
                systemLabel,
              );
              assert.equal(
                await button.locator('svg.lucide-sun-moon').count(),
                1,
              );
              if (storage === 'available')
                assert.equal(
                  await page.evaluate(() =>
                    localStorage.getItem('gensai-theme'),
                  ),
                  'system',
                );
            }
          }
          await page.emulateMedia({ colorScheme: 'dark' });
          await appearance('dark');
          await page.emulateMedia({ colorScheme: 'light' });
          await appearance('light');
          await button.click();
          await page.emulateMedia({ colorScheme: 'dark' });
          await appearance('light', 'light');
          await button.click();
          await page.emulateMedia({ colorScheme: 'light' });
          await appearance('dark', 'dark');
          await button.click();
          await appearance('light');
          await page.emulateMedia({ colorScheme: 'dark' });
          await appearance('dark');
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});
