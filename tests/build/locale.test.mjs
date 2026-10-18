import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

test('built pages render only their selected language', () => {
  const english = readFileSync(
    new URL('../../dist/index.html', import.meta.url),
    'utf8',
  );
  const japanese = readFileSync(
    new URL('../../dist/ja/index.html', import.meta.url),
    'utf8',
  );
  assert.match(english, /<html lang="en"/);
  assert.match(japanese, /<html lang="ja"/);
  assert.ok(english.includes('Preparedness map'));
  assert.ok(japanese.includes('防災マップ'));
  assert.ok(!english.includes('防災マップ'));
  assert.ok(!japanese.includes('Preparedness map'));
});
