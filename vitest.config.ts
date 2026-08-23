import { defineConfig } from 'vitest/config';
import path from 'path';

const GAME_LOGIC_COVERAGE_GLOBS = [
  'src/engine/**/*.ts',
  'src/store/**/*.ts',
  'src/data/**/*.ts',
  'src/hooks/**/*.ts',
  'src/shared/**/*.ts',
  'src/utils/**/*.ts',
  'src/config/**/*.ts',
] as const;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    testTimeout: 15_000,
    hookTimeout: 15_000,
    teardownTimeout: 10_000,
    cache: {
      dir: 'node_modules/.vitest',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: [...GAME_LOGIC_COVERAGE_GLOBS],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.integration.test.ts'],
      // Baseline floor — ratchet up as coverage improves (was 80% aspirational).
      thresholds: {
        lines: 73,
        functions: 57,
        branches: 75,
        statements: 73,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          // api/lib/*.test.ts — юнит-тесты чистой логики edge-функций
          // (сами edge-функции с `export const config` под Node не импортируются).
          include: ['src/**/*.test.ts', 'vite/**/*.test.ts', 'api/**/*.test.ts'],
          exclude: ['src/**/*.integration.test.ts'],
          setupFiles: ['./vitest/setupUnitTests.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.integration.test.ts'],
          testTimeout: 30_000,
          hookTimeout: 30_000,
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
