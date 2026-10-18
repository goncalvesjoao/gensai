import assert from 'node:assert/strict';
import process from 'node:process';
import test from 'node:test';
import { browserSession } from '../support/browser.mjs';

const origins = [process.env.HOME_TEST_URL, process.env.MAP_TEST_URL];
const labels = {
  en: [
    'Theme: Light. Switch to dark theme',
    'Theme: Dark. Switch to system theme',
    'Theme: System. Switch to light theme',
  ],
  ja: [
    'テーマ：ライト。ダークテーマに切り替える',
    'テーマ：ダーク。システム設定に切り替える',
    'テーマ：システム。ライトテーマに切り替える',
  ],
};

async function appearance(page, expected) {
  await page.waitForFunction(
    (theme) => document.documentElement.dataset.theme === theme,
    expected,
  );
}

// Real media-query events, keyboard focus and hydration across both hosts need a browser.
test('theme modes work on entry point and map in both languages and viewport sizes', async () => {
  const browser = await browserSession();
  try {
    for (const origin of origins) {
      for (const locale of ['en', 'ja']) {
        for (const width of [390, 1440]) {
          const page = await browser.newPage({
            viewport: { width, height: 900 },
            colorScheme: 'dark',
          });
          await page.goto(`${origin}${locale === 'ja' ? '/ja' : '/'}`);
          const button = page.locator('#theme-toggle');
          await page.getByRole('button', { name: labels[locale][2] }).waitFor();
          await page.waitForFunction(
            () => !document.querySelector('#theme-toggle').disabled,
          );
          await button.focus();
          for (const [index, mode, expected] of [
            [0, 'light', 'light'],
            [1, 'dark', 'dark'],
            [2, 'system', 'dark'],
          ]) {
            await button.press(index === 1 ? 'Space' : 'Enter');
            await appearance(page, expected);
            assert.equal(
              await button.getAttribute('aria-label'),
              labels[locale][index],
            );
            assert.equal(
              await button
                .locator(`.lucide-${['sun', 'moon', 'sun-moon'][index]}`)
                .count(),
              1,
            );
            assert.ok(
              await button.evaluate(
                (element) => element === document.activeElement,
              ),
            );
            assert.equal(
              await page.evaluate(() => localStorage.getItem('gensai-theme')),
              mode,
            );
            await page.emulateMedia({ colorScheme: 'light' });
            await appearance(page, mode === 'system' ? 'light' : expected);
            await page.emulateMedia({ colorScheme: 'dark' });
            await appearance(page, expected);
          }
          await page.emulateMedia({ colorScheme: 'light' });
          await appearance(page, 'light');
          assert.equal(await button.locator('.lucide-sun-moon').count(), 1);
          await page.reload();
          await page.getByRole('button', { name: labels[locale][2] }).waitFor();
          await appearance(page, 'light');
          await page.waitForFunction(
            () => !document.querySelector('#theme-toggle').disabled,
          );
          await button.hover();
          await page
            .locator('[data-slot="tooltip-content"]', {
              hasText: labels[locale][2],
            })
            .waitFor();
          await page.locator('#locale-toggle').click();
          await page
            .getByRole('menuitemradio', {
              name: locale === 'en' ? '日本語' : 'English',
              exact: true,
            })
            .click();
          await page
            .getByRole('button', {
              name: labels[locale === 'en' ? 'ja' : 'en'][2],
            })
            .waitFor();
          await appearance(page, 'light');
          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
  }
});

// Sampling actual animation frames tests startup appearance through browser painting and hydration.
test('saved, default and blocked preferences resolve before first paint and survive hydration', async () => {
  const browser = await browserSession();
  try {
    for (const [stored, system, expected, mode, blocked] of [
      ['light', 'dark', 'light', 'light', false],
      ['dark', 'light', 'dark', 'dark', false],
      ['system', 'dark', 'dark', 'system', false],
      [null, 'light', 'light', 'system', false],
      ['invalid', 'dark', 'dark', 'system', false],
      [null, 'dark', 'dark', 'system', true],
    ]) {
      const page = await browser.newPage({ colorScheme: system });
      await page.addInitScript(
        ({ stored, blocked }) => {
          if (stored !== null) localStorage.setItem('gensai-theme', stored);
          if (blocked) {
            for (const method of ['getItem', 'setItem'])
              Storage.prototype[method] = () => {
                throw new Error('Storage unavailable');
              };
          }
          window.themeFrames = [];
          function sample() {
            if (document.body)
              window.themeFrames.push(document.documentElement.dataset.theme);
            if (!document.querySelector('#theme-toggle:not(:disabled)'))
              requestAnimationFrame(sample);
          }
          requestAnimationFrame(sample);
        },
        { stored, blocked },
      );
      await page.goto(`${origins[1]}/`);
      const button = page.getByRole('button', {
        name: labels.en[['light', 'dark', 'system'].indexOf(mode)],
      });
      await button.waitFor();
      await page.waitForFunction(
        () =>
          window.themeFrames.length > 0 &&
          !document.querySelector('#theme-toggle').disabled,
      );
      const frames = await page.evaluate(() => window.themeFrames);
      assert.ok(
        frames.every((theme) => theme === expected),
        JSON.stringify(frames),
      );
      await appearance(page, expected);
      if (blocked) {
        await button.click();
        await appearance(page, 'light');
        await page.getByRole('button', { name: labels.en[0] }).click();
        await appearance(page, 'dark');
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
});
