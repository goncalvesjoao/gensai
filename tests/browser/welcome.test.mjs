import { createFixturePage } from './fixtures.mjs';
import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { chromium } from 'playwright';
const base = process.env.HOME_TEST_URL || 'http://localhost:4337';
const mapBase =
  process.env.MAP_TEST_URL ||
  process.env.TEST_URL ||
  base.replace('localhost', 'map.localhost');

test('entry point welcomes visitors without scripting and opens the corresponding map', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const [path, heading, statement, label] of [
      [
        '/',
        'Welcome to Gensai',
        'Gensai is a work-in-progress project.',
        'Open the Gensai map',
      ],
      [
        '/ja',
        'Gensaiへようこそ',
        'Gensaiは現在開発中のプロジェクトです。',
        'Gensaiの地図を開く',
      ],
    ]) {
      const page = await createFixturePage(browser, {
        javaScriptEnabled: false,
      });
      await page.goto(`${base}${path}`);
      await page
        .getByRole('heading', { name: heading })
        .waitFor({ timeout: 2000 });
      assert.equal(await page.getByText(statement, { exact: true }).count(), 1);
      assert.equal(page.url(), `${base}${path}`);
      const link = page.getByRole('link', { name: label });
      await link.focus();
      assert.ok(
        await link.evaluate((element) => element === document.activeElement),
      );
      await link.press('Enter');
      assert.equal(new URL(page.url()).origin, new URL(mapBase).origin);
      assert.equal(
        await page.locator('html').getAttribute('lang'),
        path === '/ja' ? 'ja' : 'en',
      );
      assert.equal(
        new URL(page.url()).pathname.replace(/\/$/, '') || '/',
        path,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});

test('welcome remains readable in both languages, themes and viewport sizes without requesting location', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const [path, label] of [
      ['/', 'Open the Gensai map'],
      ['/ja', 'Gensaiの地図を開く'],
    ]) {
      for (const theme of ['light', 'dark']) {
        for (const width of [390, 1280]) {
          const page = await createFixturePage(browser, {
            viewport: { width, height: 844 },
            colorScheme: theme,
          });
          await page.addInitScript(() => {
            window.locationRequests = 0;
            navigator.geolocation.getCurrentPosition = () =>
              window.locationRequests++;
          });
          await page.goto(`${base}${path}`);
          const link = page.getByRole('link', { name: label });
          await link.waitFor();
          await link.focus();
          assert.equal(await page.evaluate(() => window.locationRequests), 0);
          assert.equal(
            await page.locator('html').getAttribute('data-theme'),
            theme,
          );
          assert.ok(
            await link.evaluate(
              (element) => element === document.activeElement,
            ),
          );
          const bounds = await link.boundingBox();
          assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth),
            width,
          );
          if (process.env.WELCOME_SCREENSHOT_DIR)
            await page.screenshot({
              path: `${process.env.WELCOME_SCREENSHOT_DIR}/welcome-${path === '/' ? 'en' : 'ja'}-${theme}-${width}.png`,
            });
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});

test('visitors can return from the map and reopen it in the same language', async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH,
  });
  try {
    for (const [path, label, home] of [
      ['/', 'Open the Gensai map', 'Home'],
      ['/ja', 'Gensaiの地図を開く', 'ホーム'],
    ]) {
      const page = await createFixturePage(browser);
      await page.goto(`${base}${path}`);
      await page.getByRole('link', { name: label }).click();
      await page
        .getByRole('link', { name: home, exact: true })
        .click({ timeout: 2000 });
      await page.getByRole('link', { name: label }).waitFor();
      assert.equal(page.url(), `${base}${path}`);
      await page.waitForTimeout(150);
      assert.equal(page.url(), `${base}${path}`);
      await page.getByRole('link', { name: label }).click();
      assert.equal(new URL(page.url()).origin, new URL(mapBase).origin);
      assert.equal(
        new URL(page.url()).pathname.replace(/\/$/, '') || '/',
        path,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
