# Changelog

## [Unreleased]

### Added

- `PanelErrorBoundary` в `GameOrchestratorSubcomponents.tsx`: изоляция ошибок lazy-панелей (`next/dynamic`) и экрана наследия; обёртки в `GameOrchestrator.tsx`.
- Вертикальный слайс главы 1: узлы сюжета в `src/data/verticalSliceStoryNodes.ts`, слияние в общий граф через `VERTICAL_SLICE_STORY_NODES` в `src/data/storyNodes.ts`, экспорт `VERTICAL_SLICE_ENTRY_NODE_ID` из `src/data/index.ts`.
- NPC слайса (Альберт, Александр) в `src/data/npcDefinitions.ts`; стартовые отношения в `INITIAL_NPC_RELATIONS` (`src/data/constants.ts`).
- Скрипт архивации экспертного обзора: `npm run expert:archive` (`package.json`, `scripts/export-expert-review-archive.ps1`); в `.gitignore` добавлены шаблоны для локальных zip и временной папки в `archives/`.
- Процедурная атмосферная музыка по сценам (Web Audio, без семплов): `src/lib/atmosphereMusicGenres.ts` — жанры `ambient`, `chiptune_8bit`, `brutal_heavy` и `getAtmosphereGenreForScene`; в `useAmbientMusic.ts` — ветвление синтеза (chiptune: square и арпеджио; brutal_heavy: короткие saw + WaveShaper и шумовые акценты; ambient: пады как раньше), `playBackgroundLayer` вынесен в `useCallback`, в цикле `setInterval` используются `configRef` и refs колбэков, чтобы после смены сцены подтягивались актуальные `sceneId` и обработчики; `AmbientMusicPlayer` в `GameOrchestrator.tsx` (включение в фазе `game`, без активной катсцены); тест `src/lib/atmosphereMusicGenres.test.ts`.
- `MiniMap` в `GameOrchestrator.tsx` для `gameMode === 'exploration'`: позиция из стора, размер сцены, подпись из `SCENE_VISUALS`, NPC через `getNPCsForScene` и позиции из `exploration.npcStates`.
- `src/config/modelUrls.ts`: `isValidPlayerGlbPath`, `getDefaultPlayerModelPath()` (fallback игрока, переопределение через `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL`); тест `src/config/modelUrls.test.ts`.
- `PhysicsExplorationRoomVisual` в `RoomEnvironment.tsx` — визуал комнаты для Rapier-канваса по `sceneId` (пока `zarema_albert_room`); сцена `zarema_albert_room` добавлена в `SceneId` (`src/data/types.ts`, `src/shared/types/game.ts`).

### Removed

- `Player.tsx`: дублировал `PhysicsPlayer` (своя клавиатура, кламп позиции, без GLB); основной 3D-режим — `PhysicsPlayer` + `FollowCamera`.
- Устаревший альтернативный интерфейс `GameUI.tsx`: не использовался в коде; актуальная композиция — `HUD` и `EnergyBar` из `GameOrchestratorSubcomponents` в `GameOrchestrator`.
- Устаревшее диалоговое окно `DialogueWindow.tsx` (включая неиспользуемый `DialogueManager`): в проекте нигде не импортировалось; единый UI — `DialogueRenderer.tsx` + `DialogueEngine`.

### Changed

- `NPC.tsx` (`GLTFModel` / `GLTFLoader`): для GLB/GLTF включены скелетные анимации через `useAnimations` и состояние `idle` / `walk` / `talk`; выбор клипа по `NPCDefinition.animations`, по умолчанию `Idle`/`Walk`/`Talk` и по подстрокам в имени клипа; плавное переключение `fadeOut`/`fadeIn`; перед загрузкой проверяется путь (`/models/…`, расширение `.glb`/`.gltf`); fallback-модель обёрнута в `useMemo`; при размонтировании вызывается `useGLTF.clear`; убрано синусоидальное покачивание корня для загруженной сцены (остаётся у стилизованных fallback-моделей).
- `Inventory.tsx`: тултип предмета учитывает `resize` / `visualViewport`; сетка слотов расширяется по рядам, если в инвентаре больше 24 стеков; заглушки «Использовать» / «Выбросить» для выбранного слота (disabled до реализации логики).
- `TriggerSystem` (`InteractiveTrigger.tsx`): проверка AABB в `useFrame` с throttling только для маркеров «нажми E»; `wasInside` в ref; без `setTimeout`; сброс состояния при смене сцены; клавиша E сначала активирует триггер `requiresInteraction` в зоне (`RPGGameCanvas`), затем NPC; `WorldItem` — индикатор близости без отложенного `setState`, комментарий про instancedMesh при росте числа предметов.
- `useActionHandler` / `useStoryChoiceHandler`: поле `playerSkills` типизировано как `PlayerSkills` (в `GameOrchestrator` убрано двойное `as unknown as Record<string, number>`); JSDoc для `energySystem` (прокидывается в сюжетный обработчик для стоимости выбора и skill check).
- Новая игра после сброса стора стартует с узла `VERTICAL_SLICE_ENTRY_NODE_ID`, а не `start` (`src/hooks/useGameSessionFlow.ts`); тесты обновлены (`src/hooks/useGameSessionFlow.test.tsx`).
- `CinematicEffects.tsx`: `SceneTransition` — фазы перехода на `async`/`await` с единым флагом отмены вместо трёх `setTimeout` (меньше рассинхрона при быстрой смене пропсов); `SplitScreen` — пружинная анимация при смене `ratio`, контейнер с `overflow-hidden`, панели без `flex-1` для предсказуемой доли; комментарий к сочетанию `export default` и именованного `CinematicOverlay`.
- `RPGGameCanvas.tsx` / `PhysicsRPGCanvas.tsx`: вместо `Player` — `PhysicsPlayer` с `getDefaultPlayerModelPath()`; камера — `FollowCamera` (орбита мышью, зум); в `PhysicsPlayer` — прыжок по Space через `PHYSICS_CONSTANTS.JUMP_FORCE`.
- `useGamePhysics.ts` (`usePlayerControls`): опциональный `onInteractPress` при первом нажатии взаимодействия вместо опроса `setInterval` в `PhysicsPlayer`.
- `PhysicsRPGCanvas.tsx` (`PhysicsGameModeSwitcher`): гравитация от стресса и `panicMode` через проп `gravity` у `<Physics>`; постобработка учитывает `panicMode`; отладочные `gridHelper`/`axesHelper` только при `NEXT_PUBLIC_PHYSICS_DEBUG_HELPERS=1`; вместо постоянного `ZaremaAlbertRoom` — `PhysicsExplorationRoomVisual` по сцене; заглушка `EmotionalGravityController` удалена.
- `docs/MODEL_INTEGRATION.md`: пример игрока переведён на `PhysicsPlayer`.

### Fixed

- `DialogueRenderer`: очистка интервала печати через `useRef` + сброс при новом `startTyping` и при размонтировании; `dialogueContext` строится из пропа `playerState` (без `getState()`); `startDialogue` вызывается из `useEffect` без неиспользуемого `filteredChoices`; удалён неиспользуемый `history`; текст реплики при печати берётся из `displayedText`; `CyberDialogueChoice` обёрнут в `memo`.
- Навыки из эффектов диалога/сюжета/стихов: вместо приведения к `'writing'` используется `asTrainablePlayerSkill` (`src/lib/trainablePlayerSkill.ts`) в `DialogueRenderer`, `useDialogProcessor`, `useGameRuntime`, `useStoryChoiceHandler`; типы `addSkill` в `useActionHandler` / `useDialogProcessor` / `useGameRuntime` приведены к `keyof PlayerSkills`.
- Исправлена функция `getGameStore`: возвращает `getState()` доменного и монолитного Zustand-стора (`src/client/store/index.ts`, `src/store/gameStore.ts`).
- Добавлена защита от отрицательных очков навыков в `addSkillPoints` (`src/client/store/playerStore.ts`, `src/store/gameStore.ts`).
- Добавлены пояснения к `setCurrentNode` / `visitNode` и JSDoc у `visitNode`, чтобы избежать лишних двойных обновлений при смене узла.
- Добавлено предупреждение в консоль при неизвестном ID предмета в `addItem` (`src/client/store/inventoryStore.ts`, `src/store/gameStore.ts`).
- Удалён дублирующий компонент `AnimeCutsceneOverlay`; заставки рендерятся через `AnimeCutscene` в `GameOrchestrator`.
- Удалена некорректная папка `src/app/undefined` (артефакт маршрутизации).
- `AsciiCyberBackdrop`: сброс массива капель при старте эффекта, обрезка `drops` при уменьшении `rainCount` (смена `staticMode`/плотности), явный порядок зависимостей `useEffect` с `npcsHere` (`src/components/game/AsciiCyberBackdrop.tsx`).
- `ChromaticAberration` (DOM в `CinematicEffects.tsx`): ограничение пикового смещения в px при высокой `intensity`, обёртка с `overflow-hidden` и `clip-path: inset(0)` против артефактов у краёв экрана.
