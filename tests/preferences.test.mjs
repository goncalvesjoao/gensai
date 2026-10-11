import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

const html = readFileSync(
  new URL('../dist/index.html', import.meta.url),
  'utf8',
);
const head = html.slice(0, html.indexOf('</head>'));
const scripts = [...head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(([, attributes]) => !/\bsrc=|\btype=/.test(attributes))
  .map(([, , script]) => script);

for (const scenario of [
  { name: 'system dark', systemDark: true, stored: {}, expected: 'dark' },
  {
    name: 'saved light overrides system dark',
    systemDark: true,
    stored: { 'gensai-theme': 'light' },
    expected: 'light',
  },
  {
    name: 'saved dark overrides system light',
    systemDark: false,
    stored: { 'gensai-theme': 'dark', 'gensai-locale': 'ja' },
    expected: 'dark',
    locale: 'en',
  },
  {
    name: 'Japanese route retains its language',
    hostname: 'ja.gensai.example',
    stored: { 'gensai-locale': 'en' },
    expected: 'light',
    locale: 'ja',
  },
  {
    name: 'English route retains its language',
    hostname: 'en.gensai.example',
    stored: { 'gensai-locale': 'ja' },
    expected: 'light',
    locale: 'en',
  },
  {
    name: 'blocked storage retains system dark',
    systemDark: true,
    blocked: true,
    expected: 'dark',
  },
  {
    name: 'invalid preference falls back to system',
    systemDark: true,
    stored: { 'gensai-theme': 'invalid' },
    expected: 'dark',
  },
]) {
  test(`preferences applied before body renders: ${scenario.name}`, () => {
    const root = { dataset: {}, lang: scenario.locale || 'en' };
    const context = {
      URL,
      document: { documentElement: root },
      window: {
        matchMedia: () => ({ matches: scenario.systemDark }),
        location: {
          href: `https://${scenario.hostname || 'map.gensai.help'}/`,
          replace() {},
        },
      },
      localStorage: {
        getItem(key) {
          if (scenario.blocked) throw new Error('Storage blocked');
          return scenario.stored?.[key] ?? null;
        },
      },
    };
    for (const script of scripts) runInNewContext(script, context);
    assert.equal(root.dataset.theme, scenario.expected);
    assert.equal(root.lang, scenario.locale || 'en');
  });
}
