import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// HTTP flow specs only (`pnpm test:e2e`). `pnpm test` already runs them too.
const sharedSource = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@buffetya/shared': sharedSource },
  },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
  },
});
