import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/engine/**/*.ts', 'src/store/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 45,
        statements: 50,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./vitest/setupComponentTests.ts'],
        },
      },
    ],
    passWithNoTests: false,
  },
});
