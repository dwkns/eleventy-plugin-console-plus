import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      exclude: [
        '_site/**',
        'dist/**',
        'node_modules/**',
        'test/**',
        '*.config.js',
        'rollup.config.js'
      ]
    }
  },
});

