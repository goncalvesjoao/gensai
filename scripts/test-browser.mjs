import process from 'node:process';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createServer } from 'node:net';

const args = process.argv.slice(2);
const generic = args[0] === '--command';
if (generic) args.shift();
const artifactRoot = resolve(
  process.env.GENSAI_TEST_ARTIFACTS || join(tmpdir(), 'gensai-verification'),
);
await mkdir(artifactRoot, { recursive: true });
const artifacts = await mkdtemp(join(artifactRoot, 'run-'));
const log = createWriteStream(join(artifacts, 'runner.log'));
const git = (...argv) => execFileSync('git', argv, { encoding: 'utf8' }).trim();
const children = new Set();
let interrupted = null;
const metadata = {
  command: process.argv,
  checkout: process.cwd(),
  revision: git('rev-parse', 'HEAD'),
  dirty: Boolean(git('status', '--porcelain')),
  kind: process.env.GENSAI_BASELINE_REF ? 'baseline' : 'implementation',
  baselineRef: process.env.GENSAI_BASELINE_REF || null,
  baselineToolingRevision: process.env.GENSAI_BASELINE_TOOLING_REVISION || null,
  baselineToolingFingerprint:
    process.env.GENSAI_BASELINE_TOOLING_FINGERPRINT || null,
  startedAt: new Date().toISOString(),
  checks: { build: 'skipped', previews: 'skipped', tests: 'skipped' },
  artifacts,
};
function output(message) {
  process.stdout.write(message);
  log.write(message);
}
output(
  `Verification started: ${JSON.stringify(process.argv)}\nArtifacts: ${artifacts}\n`,
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    interrupted = signal;
    for (const child of children) kill(child, 'SIGTERM');
  });
function kill(child, signal) {
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}
function launch(command, argv, name, env = {}) {
  const stream = createWriteStream(join(artifacts, `${name}.log`));
  const child = spawn(command, argv, {
    detached: true,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  child.stdout.on('data', (data) => {
    stream.write(data);
    process.stdout.write(data);
  });
  child.stderr.on('data', (data) => {
    stream.write(data);
    process.stderr.write(data);
  });
  child.done = new Promise((resolveDone) => {
    child.on('error', (error) => {
      stream.write(`${error.stack}\n`);
      resolveDone(1);
    });
    child.on('close', (code, signal) => {
      child.result = code ?? (signal ? 130 : 1);
      stream.end(() => resolveDone(child.result));
    });
  });
  return child;
}
async function fingerprint(paths) {
  const hash = createHash('sha256');
  async function visit(path) {
    for (const entry of (await readdir(path, { withFileTypes: true })).sort(
      (a, b) => a.name.localeCompare(b.name),
    )) {
      const full = join(path, entry.name);
      if (entry.isDirectory()) await visit(full);
      else {
        hash.update(full);
        hash.update(await readFile(full));
      }
    }
  }
  for (const path of paths) await visit(path);
  return hash.digest('hex');
}
async function sourceIdentity() {
  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean)
    .sort();
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    try {
      hash.update(await readFile(file));
    } catch (error) {
      if (error.code === 'ENOENT') hash.update('<deleted>');
      else throw error;
    }
  }
  return hash.digest('hex');
}
async function port() {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const number = server.address().port;
  await new Promise((r) => server.close(r));
  return number;
}
async function ready(child, number) {
  const deadline =
    Date.now() + Number(process.env.GENSAI_PREVIEW_TIMEOUT_MS || 15000);
  while (Date.now() < deadline) {
    if (interrupted) throw new Error(`Canceled by ${interrupted}`);
    if (child.result !== undefined)
      throw new Error(`Preview exited with ${child.result}`);
    try {
      const response = await fetch(`http://127.0.0.1:${number}/`, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {
      /* Retry until deadline. */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `Preview readiness timed out after ${process.env.GENSAI_PREVIEW_TIMEOUT_MS || 15000}ms`,
  );
}
let status = 1;
try {
  metadata.sourceFingerprint = await sourceIdentity();
  if (generic) {
    if (!args.length) throw new Error('Supply a command after --command');
    metadata.checks.tests = 'running';
    status = await launch(args[0], args.slice(1), 'tests').done;
    metadata.checks.tests = status ? 'failed' : 'passed';
  } else {
    const files = args.filter((arg) => !arg.startsWith('--'));
    // Node test options use --option=value, so every positional argument is a test file.
    for (const file of files) {
      if (file.endsWith('/production-access.test.mjs'))
        throw new Error(
          'Production probes require deployed hosts; use npm run verify -- node --test tests/browser/production-access.test.mjs',
        );
      await readFile(file);
    }
    metadata.excludedLiveProbes = files.length
      ? []
      : ['tests/browser/production-access.test.mjs'];
    metadata.checks.build = 'running';
    status = await launch('npm', ['run', 'build'], 'build').done;
    metadata.checks.build = status ? 'failed' : 'passed';
    if (status || interrupted) throw new Error('Build failed or canceled');
    metadata.buildFingerprint = await fingerprint(['dist']);
    metadata.buildSourceFingerprint = await sourceIdentity();
    metadata.checks.previews = 'running';
    const homePort = await port();
    const mapPort = await port();
    function previewArgs(number) {
      return [
        '--input-type=module',
        '-e',
        `import { startPreview } from './scripts/preview.mjs'; const server = await startPreview({host:'127.0.0.1',port:${number},strictPort:true}); server.printUrls();`,
      ];
    }
    const home = launch(
      process.execPath,
      previewArgs(homePort),
      'preview-home',
    );
    const map = launch(process.execPath, previewArgs(mapPort), 'preview-map');
    metadata.previewPids = [home.pid, map.pid];
    await Promise.all([ready(home, homePort), ready(map, mapPort)]);
    metadata.checks.previews = 'passed';
    metadata.addresses = {
      HOME_TEST_URL: `http://localhost:${homePort}`,
      MAP_TEST_URL: `http://map.localhost:${homePort}`,
      TEST_URL:
        metadata.kind === 'baseline'
          ? `http://map.localhost:${homePort}`
          : `http://127.0.0.1:${mapPort}`,
      TEST_ARTIFACT_DIR: artifacts,
    };
    metadata.checks.tests = 'running';
    const selected = files.length
      ? args
      : [
          ...args,
          ...(await readdir('tests/browser'))
            .filter(
              (f) =>
                f.endsWith('.test.mjs') && f !== 'production-access.test.mjs',
            )
            .sort()
            .map((f) => `tests/browser/${f}`),
        ];
    status = await launch(
      process.execPath,
      ['--test', '--test-reporter=tap', '--test-concurrency=1', ...selected],
      'tests',
      metadata.addresses,
    ).done;
    metadata.checks.tests = status ? 'failed' : 'passed';
  }
} catch (error) {
  output(`${error.stack}\n`);
  status = 1;
} finally {
  for (const child of children) kill(child, 'SIGTERM');
  await Promise.race([
    Promise.all([...children].map((c) => c.done)),
    new Promise((r) => setTimeout(r, 1000)),
  ]);
  for (const child of children) kill(child, 'SIGKILL');
  try {
    const testOutput = await readFile(join(artifacts, 'tests.log'), 'utf8');
    metadata.skippedTests = [
      ...testOutput.matchAll(/^ok .*? - (.*?) # SKIP.*$/gm),
    ].map((match) => match[1]);
    const liveProbes = [
      'real Photon accepts Japanese and Latin address components from the public map',
      'live official rasters render around river, coastal and slope locations',
    ];
    metadata.intentionalLiveSkips = metadata.skippedTests.filter((name) =>
      liveProbes.includes(name),
    ).length;
    metadata.testSummary = Object.fromEntries(
      ['tests', 'pass', 'fail', 'cancelled', 'skipped'].map((name) => [
        name,
        Number(
          testOutput.match(new RegExp(`(?:#|ℹ) ${name} (\\d+)`))?.[1] || 0,
        ),
      ]),
    );
  } catch {
    metadata.testSummary = null;
  }
  metadata.finishedAt = new Date().toISOString();
  metadata.durationMs =
    Date.parse(metadata.finishedAt) - Date.parse(metadata.startedAt);
  metadata.interrupted = interrupted;
  metadata.changed = metadata.sourceFingerprint !== (await sourceIdentity());
  metadata.sourceBuildMismatch =
    !generic &&
    Boolean(
      metadata.buildSourceFingerprint &&
      metadata.sourceFingerprint !== metadata.buildSourceFingerprint,
    );
  metadata.buildChanged = Boolean(
    metadata.buildFingerprint &&
    metadata.buildFingerprint !== (await fingerprint(['dist'])),
  );
  if (
    !generic &&
    !status &&
    (metadata.changed ||
      metadata.sourceBuildMismatch ||
      metadata.buildChanged ||
      !metadata.testSummary?.pass ||
      (!args.some((arg) => arg.startsWith('--test-name-pattern')) &&
        metadata.testSummary?.skipped > metadata.intentionalLiveSkips))
  )
    status = 1;
  metadata.exitStatus = interrupted ? 130 : status;
  for (const key of Object.keys(metadata.checks))
    if (
      metadata.checks[key] === 'running' ||
      (interrupted && metadata.checks[key] === 'failed')
    )
      metadata.checks[key] = interrupted ? 'canceled' : 'failed';
  metadata.completedEvidence =
    metadata.exitStatus === 0 &&
    !metadata.dirty &&
    !metadata.changed &&
    !metadata.sourceBuildMismatch &&
    !metadata.buildChanged &&
    !metadata.testSummary?.cancelled &&
    (!metadata.testSummary?.skipped ||
      metadata.testSummary.skipped === metadata.intentionalLiveSkips);
  await writeFile(
    join(artifacts, 'metadata.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  log.end();
  process.exitCode = metadata.exitStatus;
}
