# Changelog

## [Unreleased]

### Fixed

- Исправлена функция `getGameStore`: возвращает `getState()` доменного и монолитного Zustand-стора (`src/client/store/index.ts`, `src/store/gameStore.ts`).
- Добавлена защита от отрицательных очков навыков в `addSkillPoints` (`src/client/store/playerStore.ts`, `src/store/gameStore.ts`).
- Добавлены пояснения к `setCurrentNode` / `visitNode` и JSDoc у `visitNode`, чтобы избежать лишних двойных обновлений при смене узла.
- Добавлено предупреждение в консоль при неизвестном ID предмета в `addItem` (`src/client/store/inventoryStore.ts`, `src/store/gameStore.ts`).
- Удалён дублирующий компонент `AnimeCutsceneOverlay`; заставки рендерятся через `AnimeCutscene` в `GameOrchestrator`.
- Удалена некорректная папка `src/app/undefined` (артефакт маршрутизации).
