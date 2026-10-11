import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'vitest';

test('primary-strong utilities retain the runtime theme variable', () => {
  const directory = new URL('../dist/_astro/', import.meta.url);
  const css = readdirSync(directory)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(new URL(file, directory), 'utf8'))
    .join('\n');
  assert.match(css, /\.text-primary-strong\{color:var\(--primary-strong\)\}/);
  assert.match(css, /:root\{[^}]*--primary-strong:#0b5f5b/);
  assert.match(css, /:root\[data-theme=dark\]\{[^}]*--primary-strong:#72d4cb/);
});
