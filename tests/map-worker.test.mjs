import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';
import { startPreview } from '../scripts/preview.mjs';

test('production map worker and its static imports are served as JavaScript', async () => {
  // Exercise the emitted URL, not the source import: plain ?url works in dev.
  const assets = new URL('../dist/_astro/', import.meta.url);
  const files = await readdir(assets);
  const mapChunk = files.find((file) => /^MapView\..*\.js$/.test(file));
  assert.ok(mapChunk, 'Build the site before running this test');
  const source = await readFile(new URL(mapChunk, assets), 'utf8');
  const workerPath = source.match(
    /["'`]([^"'`]*\/maplibre-gl-worker[.-][^"'`]+)["'`]/,
  )?.[1];
  assert.ok(workerPath, 'MapView must reference the emitted MapLibre worker');

  const server = await startPreview({ host: '127.0.0.1', port: 0 });
  const port = server.httpServer.address().port;
  try {
    const visited = new Set();
    async function checkModule(url) {
      if (visited.has(url.href)) return;
      visited.add(url.href);
      const response = await fetch(url);
      assert.equal(response.status, 200, `Missing worker module: ${url}`);
      assert.match(
        response.headers.get('content-type') ?? '',
        /(?:java|ecma)script/,
        `Worker module must not return HTML: ${url}`,
      );
      const body = await response.text();
      // Dist modules use static import/export-from statements. Follow their
      // relative dependencies as the browser does, including unbundled siblings.
      for (const match of body.matchAll(
        /(?:\bfrom\s*|\bimport\s*)["'](\.[^"']+)["']/g,
      )) {
        await checkModule(new URL(match[1], url));
      }
    }
    await checkModule(new URL(workerPath, `http://127.0.0.1:${port}`));
  } finally {
    await server.close();
  }
});
