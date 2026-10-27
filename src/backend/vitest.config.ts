import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests read the shared contract from source, so `pnpm test` does not depend on
// a stale `shared/dist`. The production build consumes the compiled package.
const sharedSource = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: { '@buffetya/shared': sharedSource },
  },
  test: {
    globals: true,
    root: './',
    // Unit specs live next to the code; the HTTP flow specs live in test/.
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
