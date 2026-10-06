import { defineConfig } from 'astro/config';
import { readFile } from 'node:fs/promises';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'entry-point-welcome',
        configureServer(server) {
          server.middlewares.use((req, _res, next) => {
            const url = new URL(req.url, 'http://localhost');
            if (
              req.headers.host?.split(':')[0] === 'localhost' &&
              /^\/(ja\/?)?$/.test(url.pathname)
            ) {
              url.pathname = url.pathname.startsWith('/ja')
                ? '/ja/welcome'
                : '/welcome';
              req.url = url.pathname + url.search;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = new URL(req.url, 'http://localhost');
            const host = req.headers.host?.split(':')[0];
            const homeRoot =
              host === 'localhost' && /^\/(ja\/?)?$/.test(url.pathname);
            const directWelcome =
              ['localhost', 'map.localhost', '127.0.0.1'].includes(host) &&
              /^\/(ja\/)?welcome\/?$/.test(url.pathname);
            if (!homeRoot && !directWelcome) return next();
            const path = url.pathname.startsWith('/ja')
              ? 'ja/welcome'
              : 'welcome';
            const mapOrigin =
              host === '127.0.0.1'
                ? `http://${req.headers.host}`
                : `http://map.localhost${new URL(`http://${req.headers.host}`).port ? `:${new URL(`http://${req.headers.host}`).port}` : ''}`;
            try {
              const html = await readFile(
                new URL(`./dist/${path}/index.html`, import.meta.url),
                'utf8',
              );
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html.replaceAll('https://map.gensai.help', mapOrigin));
            } catch (error) {
              next(error);
            }
          });
        },
      },
    ],
    server: {
      host: '0.0.0.0',
      port: 4321,
    },
    preview: {
      host: '0.0.0.0',
      port: 4321,
    },
  },
});
