import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

test('entry-point welcome is static and never redirects automatically', () => {
  for (const route of ['welcome/', 'ja/welcome/']) {
    const html = readFileSync(
      new URL(`../dist/${route}index.html`, import.meta.url),
      'utf8',
    );
    assert.doesNotMatch(html, /window.location.replace|http-equiv="refresh"/i);
    assert.match(html, /<a[^>]+href="https:\/\/map.gensai.help\/(?:ja)?"/);
  }
});
