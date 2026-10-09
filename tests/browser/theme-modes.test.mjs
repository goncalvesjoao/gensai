import assert from 'node:assert/strict';
import process from 'node:process';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
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
          const page = await browser.newPage({
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
            await page.waitForFunction(
              () => !document.querySelector('#theme-toggle').disabled,
            );
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
        const page = await browser.newPage({ colorScheme: 'dark' });
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
        await page.waitForFunction(
          () => !document.querySelector('#theme-toggle').disabled,
        );
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
