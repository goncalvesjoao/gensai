import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import process from 'node:process';
import { startPreview } from './preview.mjs';

const live = process.argv.includes('--live');
const files = (await readdir(new URL('../tests/browser/', import.meta.url)))
  .filter(
    (file) =>
      file.endsWith('.test.mjs') && file !== 'production-access.test.mjs',
  )
  .sort()
  .map((file) => `tests/browser/${file}`);
const server = await startPreview({ host: '0.0.0.0', port: 0 });
const port = server.httpServer.address().port;
try {
  const child = spawn(
    process.execPath,
    [
      '--test',
      '--test-concurrency=1',
      ...(live
        ? ['--test-name-pattern=^(live official rasters|real Photon)']
        : []),
      ...files,
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_URL: `http://map.localhost:${port}`,
        HOME_TEST_URL: `http://localhost:${port}`,
        MAP_TEST_URL: `http://map.localhost:${port}`,
        REAL_HAZARDS: live ? '1' : '',
        REAL_PROVIDER: live ? '1' : '',
      },
    },
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => child.kill(signal));
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
} finally {
  await server.close();
}
