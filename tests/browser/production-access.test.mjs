import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { chromium } from 'playwright';
const home = process.env.HOME_TEST_URL || 'https://gensai.help';
const map = process.env.MAP_TEST_URL || 'https://map.gensai.help';

// Public HTTPS hosts are the seam: local preview cannot prove DNS or hosting rules.
test(
  'production entry points welcome visitors without redirects or location requests',
  { skip: process.env.PRODUCTION_ACCESS !== '1' },
  async () => {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      for (const javaScriptEnabled of [false, true]) {
        for (const [path, heading, statement, label, locale] of [
          [
            '/',
            'Welcome to Gensai',
            'Gensai is a work-in-progress project.',
            'Open the Gensai map',
            'en',
          ],
          [
            '/ja',
            'Gensaiへようこそ',
            'Gensaiは現在開発中のプロジェクトです。',
            'Gensaiの地図を開く',
            'ja',
          ],
        ]) {
          const page = await browser.newPage({ javaScriptEnabled });
          await page.addInitScript(() => {
            window.locationRequests = 0;
            navigator.geolocation.getCurrentPosition = () =>
              window.locationRequests++;
          });
          const response = await page.goto(`${home}${path}`);
          assert.equal(response.status(), 200);
          assert.equal(response.request().redirectedFrom(), null);
          await page
            .getByRole('heading', { name: heading })
            .waitFor({ timeout: 5000 });
          assert.equal(
            await page.getByText(statement, { exact: true }).count(),
            1,
          );
          assert.equal(await page.locator('html').getAttribute('lang'), locale);
          assert.equal(
            await page.getByRole('link', { name: label }).getAttribute('href'),
            `${map}${path}`,
          );
          assert.equal(page.url(), `${home}${path}`);
          if (javaScriptEnabled)
            assert.equal(await page.evaluate(() => window.locationRequests), 0);
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }
  },
);

test(
  'production navigation retains the language across home and map hosts',
  { skip: process.env.PRODUCTION_ACCESS !== '1' },
  async () => {
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH,
    });
    try {
      for (const [path, locale, label, homeLabel] of [
        ['/', 'en', 'Open the Gensai map', 'Home'],
        ['/ja', 'ja', 'Gensaiの地図を開く', 'ホーム'],
      ]) {
        const page = await browser.newPage();
        const response = await page.goto(`${map}${path}`);
        assert.equal(response.status(), 200);
        assert.equal(response.request().redirectedFrom(), null);
        assert.equal(page.url(), `${map}${path}`);
        assert.equal(await page.locator('html').getAttribute('lang'), locale);
        await page.getByRole('link', { name: homeLabel, exact: true }).click();
        await page.getByRole('link', { name: label }).waitFor();
        assert.equal(page.url(), `${home}${path}`);
        await page.getByRole('link', { name: label }).click();
        assert.equal(page.url(), `${map}${path}`);
        await page.locator('#locale-toggle').click();
        await page
          .getByRole('menuitemradio', {
            name: locale === 'en' ? '日本語' : 'English',
            exact: true,
          })
          .click();
        await page.waitForURL(`${map}${locale === 'en' ? '/ja' : '/'}`);
        assert.equal(
          await page.locator('html').getAttribute('lang'),
          locale === 'en' ? 'ja' : 'en',
        );
        await page.close();
      }
    } finally {
      await browser.close();
    }
  },
);
