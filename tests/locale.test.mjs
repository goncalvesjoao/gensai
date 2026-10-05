import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { localeUrl, localeFromPath } from '../src/lib/locale.mjs';

test('locale matches a complete path prefix', () => {
  for (const path of ['/ja', '/ja/', '/ja/map'])
    assert.equal(localeFromPath(path), 'ja');
  for (const path of ['/', '/map', '/japan', '/map/ja'])
    assert.equal(localeFromPath(path), 'en');
});
test('locale navigation preserves origin and URL details', () => {
  const href = 'http://map.localhost:4321/?hazard=flood#contacts';
  assert.equal(
    localeUrl(href, 'ja'),
    'http://map.localhost:4321/ja?hazard=flood#contacts',
  );
  assert.equal(localeUrl(localeUrl(href, 'ja'), 'en'), href);
  assert.equal(
    localeUrl('https://map.gensai.help/', 'ja'),
    'https://map.gensai.help/ja',
  );
});
test('built pages render only their selected language', () => {
  const english = readFileSync(
    new URL('../dist/index.html', import.meta.url),
    'utf8',
  );
  const japanese = readFileSync(
    new URL('../dist/ja/index.html', import.meta.url),
    'utf8',
  );
  assert.match(english, /<html lang="en"/);
  assert.match(japanese, /<html lang="ja"/);
  assert.ok(english.includes('Preparedness map'));
  assert.ok(japanese.includes('防災マップ'));
  assert.ok(!english.includes('防災マップ'));
  assert.ok(!japanese.includes('Preparedness map'));
});
