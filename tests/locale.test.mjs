import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { localeUrl, localeFromPath } from '../src/lib/locale.mjs';

test('locale matches a complete path prefix', () => {
  for (const path of ['/ja', '/ja/', '/ja/help'])
    assert.equal(localeFromPath(path), 'ja');
  for (const path of ['/', '/help', '/japan', '/help/ja'])
    assert.equal(localeFromPath(path), 'en');
});
test('locale navigation preserves origin and URL details', () => {
  const href = 'http://localhost:4321/help?hazard=flood#contacts';
  assert.equal(
    localeUrl(href, 'ja'),
    'http://localhost:4321/ja/help?hazard=flood#contacts',
  );
  assert.equal(localeUrl(localeUrl(href, 'ja'), 'en'), href);
  assert.equal(
    localeUrl('https://example.com/', 'ja'),
    'https://example.com/ja',
  );
});
test('built pages render only their selected language', () => {
  for (const route of ['help', 'getting-ready']) {
    const english = readFileSync(
      new URL(`../dist/${route}/index.html`, import.meta.url),
      'utf8',
    );
    const japanese = readFileSync(
      new URL(`../dist/ja/${route}/index.html`, import.meta.url),
      'utf8',
    );
    assert.match(english, /<html lang="en"/);
    assert.match(japanese, /<html lang="ja"/);
    assert.ok(!english.includes('ようこそ'));
    assert.ok(!japanese.includes('Welcome!'));
    assert.ok(!japanese.includes('aria-label="Getting ready"'));
  }
});
