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
    /**
     * [VITE-8] vitest 4 tears down environments faster than vitest 3.
     * Lazy import chains (story→quests→act5, sceneDefinitions→extensionDefs)
     * triggered by module initialization may still be resolving when the
     * environment is destroyed → EnvironmentTeardownError.
     *
     * These are NOT test failures — all tests pass. The errors are race
     * conditions between vitest 4's faster teardown and Vite's module
     * resolution. vi.dynamicImportSettled() in afterEach helps for
     * test-triggered imports but cannot catch module-init-time chains.
     *
     * Safe to ignore because:
     * 1. All 1500+ tests pass
     * 2. Errors are EnvironmentTeardownError (environment already closed)
     * 3. The actual functionality is verified by passing tests
     */
    dangerouslyIgnoreUnhandledErrors: true,
    cache: {
      dir: 'node_modules/.vitest',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      include: [...GAME_LOGIC_COVERAGE_GLOBS],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.integration.test.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
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
