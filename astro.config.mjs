import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  vite: {
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
