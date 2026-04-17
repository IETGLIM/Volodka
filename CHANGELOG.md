# Changelog

## [Unreleased]

### Added

### Changed

### Removed

### Fixed

---

## [0.2.4] - 2026-04-17

### Added

- **`npcExplorationIntegrity.test.ts`**: проверка `explore_mode`, наличия GLB для всех `modelPath` NPC в `public/models-external`, соответствия `storyNodeId` / `cutsceneId` в триггерах данным сюжета и катсцен.

### Changed

- **`storyNodes.ts`**: добавлены узлы **`kitchen_table`**, **`kitchen_fridge`**, **`kitchen_window`**, **`cafe_*`**, **`office_*`**, **`street_bench`**, **`street_bench_view`**, **`memorial_main`**, **`park_gazebo`**, **`rooftop_edge`**, **`room_table`**, **`room_bookshelf`** — id совпадают с **`triggerZones.ts`**, выход обратно в **`explore_mode`** после короткого бита (раньше при E на триггере в 3D граф не находил узел и откатывался к **`start`**).

### Fixed

- **ESLint (react-hooks)**: синхронизация **`activeCutsceneIdRef`** в **`useGameRuntime`** через **`useEffect`**; обновление **`configRef`** / колбэков-рефов в **`useAmbientMusic`**; **`usePoemLineTypewriter`** — рефы и сброс строк через эффекты / **`queueMicrotask`**; **`InteractiveTrigger`** — раздельный расчёт зон и маркеров без мутации ref-объекта; **`WorldItem`** — близость через **`useMemo`**; сброс маркеров триггеров и текстур комнаты через **`queueMicrotask`** где нужно; **`GameOrchestratorSubcomponents`** — строка с `//` в JSX; игнор **`_volodka_upstream_check/**`** в **`eslint.config.mjs`**.

---

## [0.2.3] - 2026-04-16

### Added

- **3D «панельный» двор**: на `street_night` / `street_winter` в `RPGGameCanvas` — тёмный неоновый пол, силуэты панелек (коллайдеры), расширенный туман.

### Changed

- **Старт игры**: после сброса / новой игры режим по умолчанию **`exploration`**, узел **`explore_mode`**, первая локация **`street_night`** (VN по кнопке HUD или через сюжетные триггеры).
- **`explore_mode`** в `storyNodes`: сцена узла выровнена с хабом обхода — **`street_night`**.
- **`useGameScene`**: события квестов по локации (`location_visited`) в режиме обхода считаются по **`exploration.currentSceneId`**, а не по сцене узла сюжета.
- **`GameOrchestrator`**: визуал обхода на улице — чуть сильнее glitch / неоновый оттенок.

### Fixed

- **`useGameRuntime`**: при **`explore_mode`** вызывается **`sceneManager.transitionTo`** по фактической 3D-сцене (`explorationCurrentSceneId`), без **`travelToScene`**, чтобы не откатывать локацию после перемещения игрока.
- **`GameOrchestrator`**: удалён дублирующий `useEffect` с тем же нарративным `travelToScene` — достаточно эффекта в `useGameRuntime`.

---

## [0.2.2] - 2026-04-16

### Added

- **`ExplorationMobileHud.tsx`** — тач-оверлей для режима 3D-обхода на узких экранах: направления, прыжок, кнопка действия (аналог E); подсказка по орбите камеры.
- **`usePlayerControls`** (`useGamePhysics.ts`): опция **`virtualControlsRef`** — виртуальный ввод объединяется с клавиатурой по OR.
- **`PhysicsPlayer`**: проп **`virtualControlsRef`** для связи с тач-панелью.

### Changed

- **`GameOrchestrator`**: при фазе `game` и режиме **`visual-novel`**, если текущий узел не **`explore_mode`**, вызывается **`travelToScene(currentSceneId, { narrativeDriven: true })`** — локация **`exploration.currentSceneId`** синхронизируется со сценой сюжета без траты энергии и без проверки «локация закрыта».
- Кнопка HUD **«3D»**: переход в обход через **`travelToScene(..., { narrativeDriven: true })`**, затем **`explore_mode`** и **`exploration`**.
- **`RPGGameCanvas`**: оборачивает Canvas и мобильный HUD; на мобиле передаёт **`virtualControlsRef`** в **`PhysicsPlayer`**.

---

## [0.2.1] - 2026-04-16

Сводный релиз для деплоя на Vercel: накопленные правки UI/данных/физики и рефакторинг сцены, плюс выравнивание сюжетного оверлея с диалогами.

### Added

- `PanelErrorBoundary` в `GameOrchestratorSubcomponents.tsx`: изоляция ошибок lazy-панелей (`next/dynamic`) и экрана наследия; обёртки в `GameOrchestrator.tsx`.
- Вертикальный слайс главы 1: узлы сюжета в `src/data/verticalSliceStoryNodes.ts`, слияние в общий граф через `VERTICAL_SLICE_STORY_NODES` в `src/data/storyNodes.ts`, экспорт `VERTICAL_SLICE_ENTRY_NODE_ID` из `src/data/index.ts`.
- NPC слайса (Альберт, Александр) в `src/data/npcDefinitions.ts`; стартовые отношения в `INITIAL_NPC_RELATIONS` (`src/data/constants.ts`).
- Скрипт архивации экспертного обзора: `npm run expert:archive` (`package.json`, `scripts/export-expert-review-archive.ps1`); в `.gitignore` добавлены шаблоны для локальных zip и временной папки в `archives/`.
- Процедурная атмосферная музыка по сценам (Web Audio, без семплов): `src/lib/atmosphereMusicGenres.ts` — жанры `ambient`, `chiptune_8bit`, `brutal_heavy` и `getAtmosphereGenreForScene`; в `useAmbientMusic.ts` — ветвление синтеза (chiptune: square и арпеджио; brutal_heavy: короткие saw + WaveShaper и шумовые акценты; ambient: пады как раньше), `playBackgroundLayer` вынесен в `useCallback`, в цикле `setInterval` используются `configRef` и refs колбэков, чтобы после смены сцены подтягивались актуальные `sceneId` и обработчики; `AmbientMusicPlayer` в `GameOrchestrator.tsx` (включение в фазе `game`, без активной катсцены); тест `src/lib/atmosphereMusicGenres.test.ts`.
- `MiniMap` в `GameOrchestrator.tsx` для `gameMode === 'exploration'`: позиция из стора, размер сцены, подпись из `SCENE_VISUALS`, NPC через `getNPCsForScene` и позиции из `exploration.npcStates`.
- `src/config/modelUrls.ts`: `isValidPlayerGlbPath`, `getDefaultPlayerModelPath()` (fallback игрока, переопределение через `NEXT_PUBLIC_DEFAULT_PLAYER_MODEL`); тест `src/config/modelUrls.test.ts`.
- `PhysicsExplorationRoomVisual` в `RoomEnvironment.tsx` — визуал комнаты для Rapier-канваса по `sceneId` (пока `zarema_albert_room`); сцена `zarema_albert_room` добавлена в `SceneId` (`src/data/types.ts`, `src/shared/types/game.ts`).
- **`src/components/game/scene-atmospheres/`** — вынесенные атмосферные слои и пресеты сцен (`SceneAtmosphere`, `GlobalNeoNoirLayer`, улица/зима/кафе/кухня/офис/клуб/парк/крыша/серверная/дом/сон/бой и др.), `hashSceneId`, реэкспорт из `index.ts`.
- **`CyberSkillCheckResult.tsx`** — общий баннер результата проверки навыка (клип-путь, неон); используется в `DialogueRenderer` и `StoryRenderer`.
- **`usePoemLineTypewriter.ts`** — хук посимвольной печати массива строк для стихов/прозы (паузы между строками, `onFinished`).
- Поле **`faction?: string`** у квестов (`Quest` / `ExtendedQuest` в `types.ts`) — группировка в журнале; для IT-цепочек в `quests.ts` заданы подписи вида «Работа · IT».
- У стихов **`bonus?: boolean`**, хелперы **`isBonusPoem`**, константа **`MAIN_ARCHIVE_POEM_COUNT`**, экспорт из `data/index.ts`; основная коллекция в книге — без бонусных, скрытые — по `isBonusPoem`.

### Removed

- `Player.tsx`: дублировал `PhysicsPlayer` (своя клавиатура, кламп позиции, без GLB); основной 3D-режим — `PhysicsPlayer` + `FollowCamera`.
- Устаревший альтернативный интерфейс `GameUI.tsx`: не использовался в коде; актуальная композиция — `HUD` и `EnergyBar` из `GameOrchestratorSubcomponents` в `GameOrchestrator`.
- Устаревшее диалоговое окно `DialogueWindow.tsx` (включая неиспользуемый `DialogueManager`): в проекте нигде не импортировалось; единый UI — `DialogueRenderer.tsx` + `DialogueEngine`.
- **`SSHTerminal.tsx`** — дубликат IT-терминала без связи с квестами; каноничный терминал — **`ITTerminal.tsx`** (комментарий в шапке модуля).
- **`StoryPanel.tsx`** — не использовался; сюжет рендерится **`StoryRenderer`**.
- **`PoemReveal.tsx`** — логика объединена с потоком в **`PoemComponents.tsx`** / общий хук печати.

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
- **`SceneRenderer.tsx`**: компактный корень, докблок про разделение слоёв (`AsciiCyberBackdrop` vs дождь в 3D-атмосферах), подключение **`scene-atmospheres`**.
- **`QuestsPanel.tsx`**: группировка квестов по **`faction`**, бейджи наград (статы, навыки, предметы, флаги), доработки кибер-UI.
- **`createReward`** в `quests.ts`: spread исходных полей награды, `??` для массивов — не затираются кастомные поля награды.
- **`RPGGameCanvas.tsx`**: пресеты размера пола по типу локации, опциональный проп **`groundGeometryArgs`**, тип **`RpgGroundGeometryArgs`**; модульный комментарий; убран неиспользуемый импорт `NPC_DEFINITIONS`.
- **`RoomEnvironment.tsx`**: процедурные **`CanvasTexture`** для пола/обоев (без HTTP к отсутствующим `/textures/*`), комментарии про переход на файлы из `public/`; доработки жизненного цикла текстур.
- **`RainCanvasLayer.tsx`**, **`SceneComponents.tsx`**: согласованность с новой структурой сцен / комментарии.
- **`PoetryBook.tsx`**: учёт **`MAIN_ARCHIVE_POEM_COUNT`** / разделения основной коллекции и бонусных стихов.
- **`PoemComponents.tsx`**: рефакторинг потока мини-игр/интро стихов с **`usePoemLineTypewriter`**.
- **`StoryRenderer.tsx`**: баннер skill check по событию **`eventBus` `skill:check`** (согласовано с `useStoryChoiceHandler`); **`SpeakerTag`** для обычных спикеров — циан/slate вместо фиолета.
- **`DialogueRenderer.tsx`**: импорт **`CyberSkillCheckResult`** из общего модуля.
- **`GameOrchestrator.tsx`**: флаг видимости сюжета переименован в **`showStoryOverlay`** (не путать с удалённым `StoryPanel`).
- **`useGameUiLayout.ts`** / **`useActionHandler.ts`**: возврат и прокид **`showStoryOverlay`**.

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
