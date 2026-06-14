import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'scripts/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'prefer-const': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['src/store/**/*.{ts,tsx}'],
    ignores: ['src/store/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/engine', '@/engine/**'],
              message:
                'Store must not import Engine. Use @/shared/events/appEventBus, storeEngineHost, or @/shared/gameBridge.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    ignores: ['src/engine/**/*.test.{ts,tsx}', 'src/engine/e2e/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/store', '@/store/**'],
              message:
                'Engine must not import Store. Use StateDispatcher / @/shared/gameBridge storeLifecycleHost.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: [
      'src/shared/**/*.test.{ts,tsx}',
      'src/shared/validation/contentPipelineValidator.ts',
      'src/shared/validation/saveSchema.test.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/engine', '@/engine/**'],
              message:
                'Shared must not import Engine. Use @/shared/gameBridge or appEventBus.',
            },
            {
              group: ['@/store', '@/store/**'],
              message:
                'Shared must not import Store. Use StateDispatcher / shared bridges.',
            },
          ],
        },
      ],
    },
  },
);
