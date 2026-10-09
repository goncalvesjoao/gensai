import process from 'node:process';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('browser command retains early output and attributes invalid selections as skipped', () => {
  const artifacts = mkdtempSync(join(tmpdir(), 'gensai-command-'));
  const result = spawnSync(
    process.execPath,
    ['scripts/test-browser.mjs', 'missing.test.mjs'],
    {
      env: { ...process.env, GENSAI_TEST_ARTIFACTS: artifacts },
      encoding: 'utf8',
    },
  );
  assert.notEqual(result.status, 0);
  const run = join(artifacts, readdirSync(artifacts)[0]);
  const metadata = JSON.parse(readFileSync(join(run, 'metadata.json')));
  assert.equal(metadata.checks.tests, 'skipped');
  assert.equal(metadata.exitStatus, 1);
  assert.match(
    readFileSync(join(run, 'runner.log'), 'utf8'),
    /missing.test.mjs/,
  );
});

test('verification command retains output produced before an intentional failure', () => {
  const artifacts = mkdtempSync(join(tmpdir(), 'gensai-failure-'));
  const result = spawnSync(
    process.execPath,
    [
      'scripts/test-browser.mjs',
      '--command',
      process.execPath,
      '-e',
      'console.log("before failure"); process.exit(7)',
    ],
    {
      env: { ...process.env, GENSAI_TEST_ARTIFACTS: artifacts },
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 7);
  const run = join(artifacts, readdirSync(artifacts)[0]);
  assert.match(readFileSync(join(run, 'tests.log'), 'utf8'), /before failure/);
  assert.equal(
    JSON.parse(readFileSync(join(run, 'metadata.json'))).checks.tests,
    'failed',
  );
});
