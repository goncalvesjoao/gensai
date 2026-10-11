import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'node',
    include: ['tests/*.test.mjs', 'tests/react/*.test.jsx'],
    restoreMocks: true,
  },
});
