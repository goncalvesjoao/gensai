import process from 'node:process';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
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

test('verification command flushes successful output before returning', () => {
  const artifacts = mkdtempSync(join(tmpdir(), 'gensai-success-'));
  const result = spawnSync(
    process.execPath,
    [
      'scripts/test-browser.mjs',
      '--command',
      process.execPath,
      '-e',
      'process.stdout.write("x".repeat(100000)); console.log("final output")',
    ],
    {
      env: { ...process.env, GENSAI_TEST_ARTIFACTS: artifacts },
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0);
  const run = join(artifacts, readdirSync(artifacts)[0]);
  assert.match(
    readFileSync(join(run, 'tests.log'), 'utf8'),
    /x{100000}final output/,
  );
  assert.equal(
    JSON.parse(readFileSync(join(run, 'metadata.json'))).checks.tests,
    'passed',
  );
});

test('verification interruption records cancellation and stops the owned command', async () => {
  const artifacts = mkdtempSync(join(tmpdir(), 'gensai-interrupt-'));
  const runner = spawn(
    process.execPath,
    [
      'scripts/test-browser.mjs',
      '--command',
      process.execPath,
      '-e',
      'console.log("ready pid="+process.pid);setInterval(()=>{},1000)',
    ],
    {
      env: { ...process.env, GENSAI_TEST_ARTIFACTS: artifacts },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  const closed = new Promise((resolve, reject) => {
    runner.once('error', reject);
    runner.once('close', resolve);
  });
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('command did not start')),
      10000,
    );
    runner.stdout.on('data', (data) => {
      output += data;
      if (/ready pid=\d+/.test(output)) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
  try {
    await ready;
    const pid = Number(output.match(/ready pid=(\d+)/)[1]);
    runner.kill('SIGTERM');
    assert.equal(await closed, 130);
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
    const run = join(artifacts, readdirSync(artifacts)[0]);
    const metadata = JSON.parse(readFileSync(join(run, 'metadata.json')));
    assert.equal(metadata.interrupted, 'SIGTERM');
    assert.equal(metadata.checks.tests, 'canceled');
    assert.equal(metadata.completedEvidence, false);
    assert.equal(metadata.testSummary, null);
    assert.match(readFileSync(join(run, 'tests.log'), 'utf8'), /ready pid=/);
  } finally {
    runner.kill('SIGKILL');
  }
});
