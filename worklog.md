# Worklog

## 2026-04-15 — Architecture Refactor + Test Foundation

### Done
- Refactored `GameOrchestrator` into smaller hook-based flows while preserving behavior.
- Added runtime stability fix in `CoreLoop` to avoid duplicate event subscriptions.
- Unified save/load normalization in `gameStore` to reduce duplicated deserialization paths.
- Updated build script for Vercel compatibility (`next build`).

### New hooks
- `src/hooks/useGamePanels.ts`
- `src/hooks/useTimedMessage.ts`
- `src/hooks/useEffectNotifications.ts`
- `src/hooks/useGameRuntime.ts`
- `src/hooks/useStoryChoiceHandler.ts`
- `src/hooks/useDialogueFlow.ts`
- `src/hooks/useGameSessionFlow.ts`
- `src/hooks/usePanicFlow.ts`
- `src/hooks/useGameUiLayout.ts`

### Testing setup
- Added `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- Added `vitest.config.ts` (jsdom + `@` alias support).
- Added npm scripts:
  - `test`
  - `test:watch`

### Tests added
- `src/hooks/useGameSessionFlow.test.tsx`
- `src/hooks/useStoryChoiceHandler.test.tsx`
- `src/hooks/useGameRuntime.test.tsx`

### Current test status
- Test files: 3
- Tests: 8
- Status: passing (`npm run test`)

### Notes
- Poetry/memory files were not modified.

## 2026-04-16 — Cyberpunk game shell + scene environment

### Done
- Wrapped the active game phase in `CyberGameShell` (`GameOrchestrator`): matrix rain, synth grid, CRT sweep, scanlines, corner brackets, animated horizon glow (aligned with menu / loading aesthetic).
- `SceneRenderer`: added `GlobalNeoNoirLayer` (horizon line, procedural skyline silhouette, twinkling “windows”) and restyled the scene title chip as `LOC //` terminal chrome.
- `SceneManager` `SCENE_VISUALS`: deeper neo-noir gradients and overlays for `kitchen_night`, `office_morning`, `server_room`, `rooftop_night`, `street_night`, `underground_club`, `blue_pit`.
- Tuned `FilmVignette` strength in `CyberGameShell` so HUD/story text stays readable under the glass layer.

### Tests
- `npm run test` — 4 files, 9 tests, passing.
- `npm run validate:content` — passing.

## 2026-04-16 — Store hydration, client quest validation, player selectors

### Done
- **gameStore:** убрана синхронная подгрузка сейва при импорте модуля; добавлены `hydrateFromLocalStorage()` и клиентский `GameStoreHydration` в `useEffect` в корневом `layout.tsx`, чтобы не расходиться с SSR/первым кадром.
- **playerStore (client):** `playerStoreSelectors.ts` — чистые селекторы для производных значений (доля энергии); хук `useEnergyPercentage`; реэкспорт из `src/client/store/index.ts`.
- **questStore (client):** Zod-схема `src/validation/aiQuestSchema.ts` и `parseAIQuestPayload`; `generateQuestFromAI(unknown)` валидирует JSON от LLM, пишет только в `aiQuestDefinitions`, `completeQuest` подхватывает награду из статики или AI-определения; тесты `aiQuestSchema.test.ts`.

### Files touched (high level)
- `src/store/gameStore.ts`, `src/app/layout.tsx`, `src/app/GameStoreHydration.tsx`
- `src/client/store/playerStore.ts`, `playerStoreSelectors.ts`, `index.ts`, `questStore.ts`
- `src/validation/aiQuestSchema.ts`, `aiQuestSchema.test.ts`

### Tests
- `npm run test` — 7 files, 22 tests, passing.
