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
  /* Layer guard: shared must not become a god-hub on store/engine again. */
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: [
      'src/shared/scheduleContext.ts',
      'src/shared/validation/contentPipelineValidator.ts',
      'src/shared/validation/saveMigrations.test.ts',
      'src/shared/validation/saveSchema.test.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/store', '@/store/*'],
              message: 'shared/ must not import @/store (move to engine/ or store/).',
            },
            {
              group: ['@/engine', '@/engine/*'],
              message: 'shared/ must not import @/engine (move to engine/).',
            },
          ],
        },
      ],
    },
  },
  /* Layer guard: engine reads/writes go through GameActionDispatcher, not gameStore. */
  {
    files: ['src/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/store/gameStore',
              message:
                'engine/ must not import @/store/gameStore — use getGameSnapshot / dispatchGameAction from GameActionDispatcher.',
            },
            {
              name: '@/store/gameStore.ts',
              message:
                'engine/ must not import @/store/gameStore — use getGameSnapshot / dispatchGameAction from GameActionDispatcher.',
            },
          ],
          patterns: [
            {
              group: ['**/store/gameStore', '**/store/gameStore.*'],
              message:
                'engine/ must not import gameStore (incl. useGameStore/getGameStore) — use GameActionDispatcher.',
            },
          ],
        },
      ],
    },
  },
  /* Layer guard: store must not pull engine singletons — emit EventBus / dispatch actions instead.
   * Allowlist (keep minimal) — regex negative lookahead (gitignore ! cannot re-include under *@/engine/**):
   *   - EventBus / events     — typed emit/subscribe boundary
   *   - GameActionDispatcher  — store registers the action bridge
   *   - disposeSteps          — store timers register into engine teardown
   */
  {
    files: ['src/store/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex:
                '^@/engine(?!/(?:EventBus|GameActionDispatcher|disposeSteps|events(?:/.*)?)$).*$',
              message:
                'store/ must not import @/engine except EventBus/events, GameActionDispatcher, disposeSteps — emit events or dispatch actions.',
            },
          ],
        },
      ],
    },
  },
  /* Layer guard: UI/hooks command travel via scene:request_transition (or store actions),
   * not requestSceneTransition. ScheduleEngine reads for display/3D remain allowed. */
  {
    files: [
      'src/components/game/**/*.{ts,tsx}',
      'src/hooks/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/engine/scene/sceneTransition',
              message:
                'UI/hooks must not import sceneTransition — emit scene:request_transition or use store travel actions.',
            },
          ],
        },
      ],
    },
  },
);
