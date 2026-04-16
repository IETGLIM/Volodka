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

## 2026-04-16 — Оркестратор, Zustand-слайсы, терминал UI, motion и a11y

### Done
- **`GameOrchestrator`:** вынесены подхуки и подкомпоненты — `useActionHandler`, `useDialogProcessor`, `useGameScene`, `GameOrchestratorSubcomponents` (оверлеи, список NPC на сцене, энергия и т.п.), проще сопровождать и тестировать поток игры.
- **Zustand / ререндеры:** добавлен `useStoryConditionSlice` (`useShallow`) для условий сюжета; в `StoryRenderer`, `DialogueRenderer`, `useGameRuntime`, `SceneRenderer`, `AchievementsPanel` сужены зависимости `useMemo` / `useEffect` вместо подписки на весь `playerState`; контекст диалога при необходимости читает актуальное состояние через `getState()`.
- **Терминальная стилистика меню:** блок кнопок в `MenuScreen` (рамка `BOOT_MENU`), верхняя панель в `GameUI` как `SYS.INTERFACE` — моноширинный хром и рамки в духе остального UI.
- **`globals.css`:** утилиты `game-fm-layer` (`contain: layout paint`) и `game-fm-layer-promote` — `will-change: transform, opacity` только на десктопе с тонким указателем; на мобильных / таче / `prefers-reduced-motion` — `will-change: auto`, чтобы снизить нагрузку на композитор.
- **Доступность:** осмысленные `aria-label` на кнопках действий в `HUD`, `GameUI`, главном меню (`CyberButton`), вариантах сюжета и диалога, закрытии диалога, квест-трекере, паник-кнопке и кнопках «поговорить с NPC».
- **AI-диалог (контур):** доработки `api/ai-dialogue`, клиент `ai-client`, модуль `ai-dialogue-json` + тест; вынос `ai-service` в `src/services/`.
- **Прочее:** настройки энергии (`energyConfig`), синхронизация `gameStore` / клиентских сторов и сценариев (`useDialogueFlow`, `useGameSessionFlow`, `useGameUiLayout`), правки теста `useGameRuntime`.

### Files touched (high level)
- Оркестратор: `GameOrchestrator.tsx`, `GameOrchestratorSubcomponents.tsx`, `useActionHandler.ts`, `useDialogProcessor.ts`, `useGameScene.ts`
- Store / сюжет: `gameStore.ts`, `useStoryConditionSlice.ts`, `StoryRenderer.tsx`, `DialogueRenderer.tsx`, `useGameRuntime.ts`, `SceneRenderer.tsx`, `AchievementsPanel.tsx`
- UI / стили: `MenuScreen.tsx`, `GameUI.tsx`, `HUD.tsx`, `globals.css`
- AI: `route.ts` (ai-dialogue), `ai-client.ts`, `ai-dialogue-json.ts`, `ai-dialogue-json.test.ts`, `src/services/ai-service.ts`
- Клиентские сторы: `src/client/store/index.ts`, `worldStore.ts`
- Прочие хуки: `useDialogueFlow.ts`, `useGameSessionFlow.ts`, `useGameUiLayout.ts`, `energyConfig.ts`, `package.json` / `package-lock.json`

### Tests
- `npm run test` — 8 files, 24 tests, passing.
