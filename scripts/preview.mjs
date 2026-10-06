import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { preview } from 'vite';
import config from '../astro.config.mjs';

export function startPreview(options = {}) {
  return preview({
    ...config.vite,
    configFile: false,
    build: { outDir: 'dist' },
    preview: { ...config.vite.preview, ...options },
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { values } = parseArgs({
    options: { port: { type: 'string' }, host: { type: 'string' } },
  });
  const server = await startPreview({
    ...(values.port ? { port: Number(values.port) } : {}),
    ...(values.host ? { host: values.host } : {}),
  });
  server.printUrls();
}
