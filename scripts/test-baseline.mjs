import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import {
  mkdtemp,
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

const [ref, ...selection] = process.argv.slice(2);
const directory = await mkdtemp(join(tmpdir(), 'gensai-baseline-'));
const checkout = join(directory, 'checkout');
const artifactRoot = resolve(
  process.env.GENSAI_TEST_ARTIFACTS || join(directory, 'artifacts'),
);
await mkdir(artifactRoot, { recursive: true });
const setupArtifacts = await mkdtemp(join(artifactRoot, 'baseline-setup-'));
const metadata = {
  command: process.argv,
  checkout,
  kind: 'baseline-setup',
  startedAt: new Date().toISOString(),
  checks: {
    toolingInstall: 'skipped',
    baselineInstall: 'skipped',
    browser: 'skipped',
  },
};
const log = createWriteStream(join(setupArtifacts, 'setup.log'));
log.write(`Baseline setup started: ${JSON.stringify(process.argv)}\n`);
let active;
let signal;
let added = false;
function kill(child, value) {
  try {
    process.kill(-child.pid, value);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}
for (const value of ['SIGINT', 'SIGTERM'])
  process.on(value, () => {
    signal = value;
    if (active) kill(active, value);
  });
async function run(command, argv, cwd, env = {}) {
  active = spawn(command, argv, {
    cwd,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
  for (const pipe of [active.stdout, active.stderr])
    pipe.on('data', (data) => {
      log.write(data);
      process.stdout.write(data);
    });
  const child = active;
  const code = await new Promise((resolveDone) => {
    child.on('error', (error) => {
      log.write(`${error.stack}\n`);
      resolveDone(1);
    });
    child.on('close', (code) => resolveDone(code ?? 130));
  });
  kill(child, 'SIGKILL');
  active = null;
  return code;
}
let code = 1;
try {
  if (!ref)
    throw new Error(
      'Usage: npm run test:baseline -- <git-ref> [browser selection]',
    );
  const revision = execFileSync(
    'git',
    ['rev-parse', '--verify', `${ref}^{commit}`],
    { encoding: 'utf8' },
  ).trim();
  metadata.revision = revision;
  execFileSync('git', ['worktree', 'add', '--detach', checkout, revision], {
    stdio: 'pipe',
  });
  added = true;
  // Orchestration and current locked tooling stay outside historical tracked source.
  const runner = join(directory, 'test-browser.mjs');
  await copyFile(new URL('./test-browser.mjs', import.meta.url), runner);
  const tooling = join(directory, 'tooling');
  await mkdir(tooling);
  for (const file of ['package.json', 'package-lock.json'])
    await copyFile(new URL(`../${file}`, import.meta.url), join(tooling, file));
  metadata.toolingRevision = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  metadata.toolingLockFingerprint = createHash('sha256')
    .update(await readFile(join(tooling, 'package-lock.json')))
    .digest('hex');
  for (const [name, cwd] of [
    ['toolingInstall', tooling],
    ['baselineInstall', checkout],
  ]) {
    if (signal) break;
    metadata.checks[name] = 'running';
    code = await run('npm', ['ci'], cwd);
    metadata.checks[name] = signal ? 'canceled' : code ? 'failed' : 'passed';
    if (code) break;
  }
  if (!code && !signal) {
    metadata.checks.browser = 'running';
    code = await run(process.execPath, [runner, ...selection], checkout, {
      GENSAI_TEST_ARTIFACTS: artifactRoot,
      GENSAI_BASELINE_REF: revision,
      PLAYWRIGHT_MODULE: join(tooling, 'node_modules/playwright'),
      PNG_MODULE: join(tooling, 'node_modules/pngjs'),
      GENSAI_BASELINE_TOOLING_REVISION: metadata.toolingRevision,
      GENSAI_BASELINE_TOOLING_FINGERPRINT: metadata.toolingLockFingerprint,
    });
    metadata.checks.browser = signal ? 'canceled' : code ? 'failed' : 'passed';
  }
} catch (error) {
  log.write(`${error.stack}\n`);
  console.error(error);
  code = 1;
} finally {
  if (added)
    execFileSync('git', ['worktree', 'remove', '--force', checkout], {
      stdio: 'pipe',
    });
  metadata.exitStatus = signal ? 130 : code;
  metadata.interrupted = signal || null;
  metadata.finishedAt = new Date().toISOString();
  await writeFile(
    join(setupArtifacts, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  await new Promise((r) => log.end(r));
  process.exitCode = metadata.exitStatus;
  console.log(`Baseline artifacts: ${artifactRoot}`);
}
