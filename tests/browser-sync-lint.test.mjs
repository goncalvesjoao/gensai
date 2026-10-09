import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function lint(source) {
  return spawnSync(process.execPath, ['node_modules/eslint/bin/eslint.js', '--stdin', '--stdin-filename', 'tests/browser/timing-sample.mjs', '--max-warnings', '0'], { input: source, encoding: 'utf8' });
}

test('browser lint rejects fixed readiness sleeps', () => {
  const result = lint('export async function ready(page) { await page.waitForTimeout(100); }');
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, /observable/);
});

test('browser lint permits a locally justified elapsed-time assertion', () => {
  const result = lint(`export async function observe(page) {
    // eslint-disable-next-line no-restricted-syntax -- Time itself is tested: navigation must stay canceled during this observation window.
    await page.waitForTimeout(150);
  }`);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('browser lint also rejects timer-based fixed sleeps', () => {
  assert.equal(lint('export const ready = () => new Promise(resolve => setTimeout(resolve, 100));').status, 1);
});
