# Архитектура — ВОЛОДЬКА RPG

> Карта систем проекта для инженеров. Актуально для v4.2.42 (content-truth unification).

## Content Truth — единая линия данных

**Манифест:** `src/shared/contentTruthManifest.ts` — документирует канонический источник для каждого домена и экспортирует resolvers. Новый UI/engine-код **не читает параллельные реестры напрямую**, если есть resolver.

| Домен | Источник правды | Resolver / вход |
|-------|-----------------|-----------------|
| Story nodes (runtime) | `narrativePackRegistry` → `gameDataLoader.getStoryNodes()` | `ensureStoryNode` |
| Dialogue nodes | `narrativePackRegistry` → `getDialogueNodes()` | `ensureDialogueNode` |
| CI parity | `story/index.ts` `STORY_NODES` (eager merge) | `narrativeRegistryParity.test.ts` |
| Narrative UI open | **`presentNarrativeBeat`** | hub / diegetic / VN overlay |
| Explore-hub topology | `sceneExploreHubRegistry.ts` | `hubId`, `sceneId`, `entryNodeIds` |
| Explore-hub **проза** | `act*.json` / story pack (`hubIntroText`, `hubRevisitText`, `text`) | `resolveExploreHubIntroText` |
| Auto-generated hubs | `SCENE_EXPLORE_HUB_DEFS.hubText` → `sceneExploreHubs.ts` | только хабы без act-pack node |
| Literary poem text | `src/data/poems.ts` (**не редактировать**) | — |
| Poem display names | `unifiedPoemRegistry.ts` | `getUnifiedPoem`, `enrichPoemMechanicsDisplay` |
| Poem world/combat mechanics | `PoemPowerSystem.ts` / `combat/actions.ts` | effect impl; display из registry |
| Achievements defs | `achievements.ts` | `AchievementEngine` |
| Achievement unlock state | `worldSlice` (persisted) | — |
| Story history (journal) | `visitedNodes` → `buildJournalNotes` | — |
| Dialogue transcript | `uiSlice.conversationLog` | runtime only |
| Lore codex | `loreEntries.ts` | — |
| Golden path | `deriveGoldenPath.ts` (+ `goldenPath.ts` fallback) | `buildGuidedStoryPath` |
| HUD panels | `orchestrator/types.ts` `PANEL_IDS` | panel stack reducer |

**Правило explore-hub prose:** для `STORY_DEFINED_EXPLORE_HUB_IDS` (act1 trio, pier, factory, basement, solnysh) текст toast **не дублируется** в `sceneExploreHubRegistry` — только в story JSON / inline pack. Валидатор (`validateContentTruth` в `contentPipelineValidator`) падает, если `hubText` в registry дублирует story node.

**Правило narrative open:** любой story/dialogue beat открывается через `presentNarrativeBeat(nodeId, kind)`, не через прямой `openNarrativeOverlay` из interaction path (кроме internal cleanup).

```
Данные (structures + texts/*.json, poems.ts, achievements.ts)
        ↓
narrativePackRegistry / contentTruthManifest resolvers
        ↓
Engine (presentNarrativeBeat, PoemPowerSystem, AchievementEngine, …)
        ↓
Store (uiSlice, playerState, worldSlice)
        ↓
UI (Orchestrator overlays, panel stack, journal)
```


```
┌─────────────────────────────────────────────────────────────┐
│ UI (React + Radix/Tailwind)                                 │
│   GamePage → GameOrchestrator → панели/HUD (React.lazy)     │
├─────────────────────────────────────────────────────────────┤
│ 3D (React Three Fiber)                                      │
│   RPGGameCanvas → PhysicsSceneInner (Rapier) →              │
│   SceneColliderSelector / PhysicsPlayer / FollowCamera /    │
│   NPCSystem / PatrollingCreeps / DynamicProps / PostFX      │
├─────────────────────────────────────────────────────────────┤
│ Engine (без React)                                          │
│   EventBus · StateDispatcher · CombatSystem ·               │
│   GuidedStoryManager · QuestTracker · PoemPowerSystem ·     │
│   MusicEngine/AudioEngine · camera strategies ·             │
│   visualSettings/AudioSettings                              │
├─────────────────────────────────────────────────────────────┤
│ Data (декларативный контент)                                │
│   story/act1–7 · quests · dialogue · poems · npcDefinitions │
│   triggerZones · creepPatrols · dynamicProps ·              │
│   sceneDefinitions · goldenPath                             │
├─────────────────────────────────────────────────────────────┤
│ Store (Zustand slices) + save (Zod-схема, two-phase write,  │
│   автовосстановление из backup)                             │
└─────────────────────────────────────────────────────────────┘
```

## Ключевые контракты

### EventBus (`src/engine/EventBus.ts`)
Типизированный pub/sub. Правило: **только на границах слоёв** (3D→DOM, engine→UI).
- Дедупликация: FNV-хэш (event + примитивные поля), 64 слота, окно `DEDUP_WINDOW_MS`;
  боевые/сценовые события в `DEDUP_EXEMPT` всегда проходят.
- Приоритеты: Engine → Orchestrator → UI → FX → Debug (FIFO внутри уровня); O(1) unsubscribe по listener id.
- Снапшоты слушателей на время dispatch; `createScope()` для пакетной отписки
  в оркестраторах; `dispose()` обрывает in-flight dispatch через generation.

### Слои и мосты (Store ↔ Engine)

```
Store ──emitAppEvent──► AppEventBus ──bind──► EventBus ──► Engine / UI
Engine ──dispatchStateAction──► StateDispatcher ──register──► Store (applyGameAction)
Store ──storeEngineHost──► Engine (scene transition, guided story, runtime reset)
Engine ──storeLifecycleHost──► Store (XP batch reset on dispose)
Shared ──sceneTransitionBridge──► Engine (applyEffects, без импорта engine)
```

**Правило ESLint:** `src/store/**` и `src/engine/**` (prod) не импортируют друг друга;
`src/shared/**` не импортирует ни store, ни engine (кроме validation tools).

### StateDispatcher (`src/shared/gameBridge/stateDispatcher.ts`)
Канонический Engine→Store контракт. Алиасы `dispatchStateAction`, `registerStateDispatcher`.
Re-export: `@/engine/StateDispatcher.ts`, `@/engine/GameActionDispatcher.ts` (legacy).

### AppEventBus (`src/shared/events/appEventBus.ts`)
Store→Engine/UI без `@/engine/EventBus` в slice-ах. `emitAppEvent` / `onAppEvent`;
привязка в `bindApplicationLayers()`.

### GameActionDispatcher (legacy name)
Тот же мост, что StateDispatcher. Типизированные `StateAction` / `GameAction`
(quest/*, player/*, poem/*, story/*, exploration/*, inventory/*, lore/*, …),
чтение — `GameStoreSnapshot`, регистрация — `registerGameActionBridge` в `gameStore.ts`.

### storeEngineHost (`src/store/storeEngineHost.ts`)
Store→Engine imperative callbacks: `requestSceneTransition`, `resetGuidedStoryManager`,
`resetEngineModuleRuntimeState`, `canStartQuest`. Bind в `bindApplicationLayers()`.

### Переходы сцен (`SceneTransitionManager.ts`)
Единый синхронный пайплайн: `scene:unload` → store
(`exploration/applySceneTransition`) → `scene:enter` → `scene:loaded`.
Re-entrance guard блокирует вложенные вызовы из обработчиков unload/enter.
`combatStartGate` откладывает `startCombat` до конца transition (без гонки
аудио/GPU с unload). Запросы с UI/3D — только `requestSceneTransition`
(`sceneTransition.ts`).

### Сцены (`src/config/sceneDefinitions.ts` → генератор)
`SceneDefinition` — единственный источник правды: размеры, спавн, doorways/exits,
коллайдеры (floors/walls/obstacles/ceilings), свет, туман.
`sceneDefinitionGenerator.ts` производит SCENE_CONFIG и физику:
- **Периметр**: `generateBoundaryWallSegments` режет стены проёмами по doorways
  и ставит утопленный backstop (дверная ниша; выйти из карты нельзя).
- Definition-стены, лежащие на периметре, отфильтровываются (нет двойных стен).
- `CameraCollisionProxies` зеркалит ту же геометрию на layer 5 для рейкастов камеры.

### Физика игрока (`PhysicsPlayer.tsx`)
Kinematic Character Controller (Rapier): capsule r=0.3, autostep 30 см,
snap-to-ground 15 см, `applyImpulsesToDynamicBodies` (масса 75) — поэтому
`DynamicProps` (банки/ящики) толкаются без доп. кода. Fallback-цепочка:
Rapier WASM упал → SimplePlayer (clamp по границам, без коллизий).
Cinematic beats (wake-up, story cutscenes, scene-transition hold) показывают
`CesiumPlayerModel` от 3-го лица; exploration — FP-камера + GLB-руки
(`cinematicPresentation.ts`, `FollowCamera.tsx`).

### Бой и крипы
Бой пошаговый (`CombatSystem.startCombat(enemyType)`), 11 типов врагов.
`PatrollingCreeps.tsx` + `src/data/creepPatrols.ts`: видимые враги, FSM
patrol→chase→engaged→cooldown, конус зрения проецируется на землю.
Поэтические TTL-флаги модифицируют восприятие (см. ниже).

### Поэтическая магия (`PoemPowerSystem.ts`)
Стихи Владимира Лебедева (**тексты неприкосновенны**, `src/data/poems.ts`):
- **Display SoT:** `unifiedPoemRegistry.ts` — имена и blurbs для world/combat;
  `getPoemPower()` / `POEM_COMBAT_ABILITIES` берут display через `enrichPoemMechanicsDisplay`.
- в бою — `POEM_COMBAT_ABILITIES` (кулдауны, баффы/дебаффы); pity в `combatRng.ts` / `buffSystem.ts`;
- в исследовании — TTL-флаги в store (`activeTTLFlags`), монотонные часы `ttlClock.ts` (performance.now).
  Напр. `guiding_star_active` (poem_3) сжимает конусы зрения крипов до 45%;
  `child_gaze_active` (poem_7) раскрывает зоны с `hiddenUntilPoemFlag`;
  `stone_skin_active` (poem_10) снижает входящий стресс на 50%.
  **Consumers:** `config/poemEffectRegistry.ts` + `engine/poemEffects/poemTTLRuntime.ts`
  (stress scale, combat opening bridge, HUD `PoemActiveEffectsHud`).
Новые мировые эффекты стихов = чтение одного TTL-флага в кадровом цикле.
`processExpiredTTLFlags()` — из game loop (`useGameLifecycleManager`).

### Сюжет и golden path
- Узлы: `src/data/story/act1–7.ts`, грузятся лениво narrative-паками
  (`narrativePackRegistry`, bootstrap = act1).
- **Implicit fast travel (контент-правило):** если у story/dialogue-узла задан
  `sceneId`, отличный от `exploration.currentSceneId`, при открытии overlay
  (`StoryRenderer` / `DialogueRenderer`, effect на visit) вызывается
  `requestSceneTransitionForStoryNode` — игрок телепортируется на default
  spawn сцены **без** дверного exit и без `SceneTransitionOverlay`-анимации.
  Для doorway spawn и звука двери используй physical exit (`sceneDefinitions`
  doorways) или `applyEffects` с `{ type: 'transitionScene', sceneId }`.
  Explore-hub узлы (`*_explore_mode`) держат `currentNodeId` для квестов/сейвов.
  **Closed-overlay hubs** (все walkable explore-хабы в `SCENE_EXPLORE_HUB_DEFS`):
  после cutscene/entry overlay закрывается — игрок ходит свободно, локация через
  scene-toast (`enterSceneFreeExplorationHub` + `resolveExploreHubIntroText`),
  действия через trigger zones;
  `ui:exploration_message` → `EventNotificationPopup`. Реестр:
  `CLOSED_OVERLAY_EXPLORE_HUB_IDS` в `sceneExploreHubRegistry.ts` (topology only).
  **Trigger zones vs golden path (Acts 3–7, Phase 7 complete):** hub-продолжения
  из `GOLDEN_PATH_HUB_CONTINUE` (`sceneExploreHubs.ts`) и act-pack хабов
  проведены в 3D для всех walkable explore-хабов Acts 3–7:
  `park_inscription_stone` → `act3_zarema_warning`,
  `street_winter_march_banner` → `act4_peaceful_march`,
  `rooftop_broadcast_antenna` → `act4_rooftop_broadcast`,
  `factory_basement_stairs` → `factory_basement`,
  `basement_zarya_confession` → `machine_confession_scene`,
  `pier_factory_route`, `solnysh_golden_talk`, `chk_explore_dawn`,
  `library_archive_console` → `act7_library_archive`,
  `sleep_dream_poem_core` → `sleep_dream_entrance`,
  `zarema_bank_account` → `zarema_bank_discovery`.
  **Act II Phase 4 (dmitry_defection / cafe_safehouse):**
  `office_dmitry_meeting` → `act2_dmitry_office_meeting` (флаг `dmitry_meeting_agreed`),
  `cafe_safehouse_barista` → `act2_safehouse_agreed`,
  `cafe_safehouse_backroom` → `act2_safehouse_terminal`,
  `cafe_safehouse_channel` → `act2_safehouse_message`;
  `reconcileSpineQuestActivation` догоняет `dmitry_defection` и `cafe_safehouse`.
  e2e: `act2-smoke` (office/cafe physical beats).
  **Act II Phase 5 (vault_key_fragments / poetry_smuggling / pier-basement):**
  `office_vault_guild_fragment`, `factory_maria_vault_fragment`, `factory_vault_neutral_fragment`,
  `cafe_vault_key_assemble` → `act2_vault_revealed`;
  `library_poetry_stash` → `park_poetry_patrol` → `rooftop_poetry_route` → `cafe_poetry_delivery`;
  `pier_trofim_portwine`, `basement_hum_listen`;
  `reconcileSpineQuestActivation` догоняет `vault_key_fragments` и `poetry_smuggling`.
  e2e: `act2-smoke` (+ guild fragment, poetry stash, pier portwine).
  Auto-generated хабы Acts 6–7: `chk_explore_mode`, `library_explore_mode`,
  `dream_explore_mode`, `zarema_room_explore_mode` (GOLDEN_PATH_HUB_CONTINUE);
  act-pack: `factory_*`, `basement_*`, `pier_*`, `solnysh_*`.
  **Миграция free exploration для walkable hubs завершена** (Phase 7);
  e2e: `act3-smoke` … `act7-smoke`.
- Канонический путь: `GOLDEN_PATH_STORY_SPINE` (116 узлов, до `act7_true_end`) +
  derivation из меток `choice.goldenPath` (`deriveGoldenPath.ts`); валидатор контента
  (`npm run validate:content`) сверяет длину и порядок обоих источника (терминальный
  узел без исходящего goldenPath — ожидаемо).
- Прогресс: `GuidedStoryManager` (visitedNodes, флаги, npc:talked,
  `scene:enter`) + `QuestTracker` (objectives: location/npc/flag/item/poem/minigame).
  Spine advance: только текущий шаг (`resolveStorySpineAdvance`), debounce 32 ms
  на пачку сигналов; догон после load — `syncSpineStateFromSnapshot`.

### Настройки
- `engine/visualSettings.ts` — postFX, яркость, тряска, сенса, invertY,
  сканлайны, частицы; кэшированный снапшот + window-событие; React-биндинг
  `useVisualSettings` (useSyncExternalStore).
- `engine/audio/AudioSettings.ts` — громкости и глобальный mute.
- `engine/graphics/qualityPresets.ts` — low/medium/high/ultra (+auto):
  DPR, тени, postFX, LOD bias, Draco/Meshopt, `npcRenderMode`
  (procedural-NPC на low), visualLite.

### Сейвы (`store/slices/saveStorage.ts`)
Zod-схема (SAVE_VERSION с миграциями в `saveMigrations.ts`), two-phase write + rollback, backup-ключ.
`gameSnapshotCache.ts` — дедуп подписок store для hot paths.
`resolveSaveFromStorage` → `empty | ok | recovered-from-backup | corrupt`;
битый основной сейв → автозагрузка backup + уведомление; ключи не затираются.
`pickSavePayload` валидирует snapshot через `SavePayloadSchema` перед записью.

### Store: cross-slice и валидация
- Запись в чужие слайсы — через owner actions / `crossSliceReads.ts`
  (`applyPlayerRewardBatch`, `pushNotification`, world cross-actions).
- Trainable skills: `store/skillHelpers.ts` (`applySkillDelta`,
  `parseTrainablePlayerSkill`) — без silent cast на невалидные ключи.
- UI: `OrchestratorGameplayLayer` — `memo` + field-wise compare (canvas-only
  rerender не трогает gameplay HUD).

### Типы (`src/shared/types/`)
Монолит `game.ts` разбит на barrel + модули (v4.1):
- `definitions/*` — декларативные контракты (quest, dialogue, combat, items, …).
- `state/*` — runtime-состояние (player, exploration, combat, relations, …).
- `common/*` — условия и эффекты сюжета (`conditions`, `effects`).
- `brands.ts` — брендированные id там, где нужна типобезопасность.
- `game.ts` — только re-export; **EventMap не реэкспортируется** (цикл с engine).

### UI-оркестратор: стек, панели и приоритеты (v4.2)

`GamePage` → `GameOrchestrator` (client gate) → `OrchestratorContent`:

```
OrchestratorCanvasLayer      — R3F / RPGGameCanvas (z: UI_LAYERS.CANVAS)
OrchestratorGameplayLayer    — HUD, toasts, dialogue, combat chrome
OrchestratorPanelLayer       — stack-driven panels (inventory, quests, …)
OrchestratorPauseMenu        — меню паузы (z: UI_LAYERS.MENU)
OrchestratorQuestOverlays    — quest complete / board overlays
```

**Panel stack** (`panelStackReducer` + `usePanelCoordinator`):
- Единый список `PANEL_IDS` в `orchestrator/types.ts` — новые панели только там.
- `toggle` / `ensureOpen` / `pop` / `remove` / `clear`; z-index = `UI_LAYERS.PANEL` или `MENU` + `idx * 2`.
- Приоритеты обработчиков EventBus разнесены по файлам (`eventBusPriority.ts`):
  Engine (0) → Orchestrator (100) → UI (200) → FX (300) → Debug (1000).
- **Известный разрыв:** логика «combat vs panels» и Escape-роутинг частично в `usePanelCoordinator`, частично в `useOrchestratorRuntime` — при добавлении панелей сверять оба места.

**UI_LAYERS** (`src/shared/constants/uiLayers.ts`) — единственный источник z-index для DOM UI:

| Слой | z | Назначение |
|------|---|------------|
| CANVAS | 0 | R3F canvas |
| HUD | 10 | health, minimap, quick-use |
| DIALOGUE | 30 | story / NPC overlay |
| TOASTS | 35 | loot, lore, system alerts |
| MINIGAME | 40 | terminal, codebreaker |
| MENU | 45 | pause, fast-travel backdrop |
| COMBAT | 50 | пошаговый бой |
| PANEL | 55 | inventory, journal, quests |
| LOADING | 100 | boot / scene load |
| DEV_PANEL | 200 | F3 debug |

**Известные UI-дыры (P0):** конфликт Escape между pause и панелями; inventory иногда перекрывается examine-toast — сверять `PanelStackSlot` z-index.

### Камера: FSM (`cameraStateMachine.ts`)

Режимы `CameraState`:

| mode | Когда |
|------|-------|
| `exploration` | свободный обход, FP/TP по сцене |
| `dialogue` | shot на спикера |
| `cutscene` | story / NPC cinematic |
| `transition` | doorway / scene hold |
| `cinematic_freeze` | beat после cutscene (timeout `CINEMATIC_FREEZE_TIMEOUT`) |
| `intro_wake` | первый запуск |
| `poem_reading` | ритуал чтения стиха |

`fallbackSceneId` в `FollowCamera` предотвращает NaN при гонке unload/enter.
Combat camera — отдельный `CombatCameraState` внутри cinematic stack.

### QuestTracker: типы целей

Подписка на store через reference-equality selector (`selectQuestTrackerSlice`).
События: `scene:enter`, `npc:talked`, `quest:complete_objective`, `minigame:completed`, poem bypass.

| type | Условие выполнения |
|------|-------------------|
| `location_visited` | `currentSceneId === target` |
| `flag_set` | `playerState.flags[target]` |
| `item_collected` | предмет в инвентаре |
| `poem_collected` | стих в `collectedPoems` |
| `minigame_completed` | флаг из `MINIGAME_COMPLETION_FLAGS` |
| `npc_talked` | NPC id в истории диалогов |
| `custom` | ручной `quest:complete_objective` |

**Timed quests:** wall-clock `startedAtWallMs` + `questTimeLimits.ts` (`REAL_MS_PER_GAME_HOUR`); таймаут через `isQuestTimedOut`.

### NPC: что есть и что WIP

| Компонент | Статус |
|-----------|--------|
| `npcDefinitions` + расписания + диалоги | ✅ production |
| `npcRegistry` (THREE.Group + behavior state map) | ✅ runtime |
| `npcStateMachine.ts` (idle/walk/talk/combat FSM) | ✅ unit-tested |
| `useNpcVisualBehavior` + `syncNpcBehaviorState` | ✅ единый мост GLB + procedural |
| `useNpcAnimationController` (GLB crossfade) | ✅ patrolActivity, anti-T-pose gate |
| `resolveNpcVisualAnimationState` (interaction listen/sit) | ✅ unit-tested |
| `proceduralNpcAvatarCatalog` (20 story silhouettes, no RPM) | ✅ primary visual SoT |
| `npcComposer` (29 slot recipes → `NpcComposerModel`, CC0 parts + palette) | ✅ replaces rig cloning |
| `ComposerRigDriver` + `quaterniusRigRetarget` (Mixamo on ghost Quaternius rig) | ✅ procedural path |
| `npcProceduralLayers` (breathing, blink, sway, head/eye track, talk gesture) | ✅ overlay after Mixamo/limbs |
| `NPC_ID_ALIASES` / registry baseline | ⚠️ устаревшие id в части тестов |

Патрули: `PatrollingCreeps` FSM patrol→chase→engaged; процедурные силуэты (`proceduralEnemy/enemyArchetypes.tsx`); конус зрения — stealth-overlay; поэтические TTL сужают конус (`guiding_star_active`).

### Аудио (`engine/audio/`)

- `AudioEngine` + `AudioEngineCore` — capability probe, graceful suspend.
- `SfxEngine` — процедурные SFX; footstep map cleanup on dispose.
- `SceneAudioController` + `AmbientEngine` — три слоя музыки на сцену.
- **Reverb cache** — impulse responses кэшируются; таймеры отменяются в `dispose()`.
- `SharedAudioContext` — singleton revive после StrictMode.

### Качество и PostFX

Цепочка: `useGraphicsQuality` → `qualityPresets` → `resolveSceneRenderingPipeline` → `ExplorationPostFX`.

- **GPU probe** (`gpuQualityProbe.ts`): renderer string, `maxTextureSize`, weak-mobile heuristic.
- **Battery cap** (`initBatteryQualityCapListener`): ≤15% → low, ≤30% → medium.
- **Session tier** (`autoQualitySession.ts`): resolved auto tier в `sessionStorage`.
- **Gfx pressure** (`applyGfxPressureToPreset`): memory/critical снимает N8AO/LUT/bloom intensity.
- **Runtime degrade** (`adaptiveQualityBridge`): sustained FPS fail → −1 tier.

`ExplorationPostFX` заменил legacy `PostFXComposer` в exploration canvas.
**Gap:** hero-сцены (`street_night`, `rooftop_edge`) могут всё ещё монтировать полный PostFX на low — сверять `resolveSceneRenderingPipeline`.

Пресеты: low = postFX off + Draco + procedural NPC; ultra = meshopt + full GLB.

### Нарратив: packs, тексты и presentation router

```
src/data/story/
  act1.ts … act7.ts          — runtime nodes (lazy packs)
  structures/actN.structure.ts — декларативный spine (JSON-like)
  texts/actN.json            — prose + hubIntroText / hubRevisitText / guidanceHint
src/data/narrative/
  narrativePackRegistry.ts   — bootstrap act1, load-on-demand
  applyStoryTexts.ts         — overlay текстов из JSON на structure nodes
src/engine/narrative/
  presentNarrativeBeat.ts    — единая точка открытия story/dialogue (hub | hud | VN)
  narrativePresentationPolicy.ts — Act 1 diegetic scope
```

~7700 строк TS-нарратива; JSON-тексты подключены для act1–7. Explore-hub toast и VN overlay могут иметь **разную** прозу (`text` vs `hubIntroText`) на одном node id — это намеренно.
XSS: `sanitizePlainText` на основном пути рендера (`narrativePresentation.ts`).

### Физика / KCC degraded mode

- Rapier KCC в `PhysicsPlayer`; `movementEpoch` инвалидирует stale callbacks после recreate.
- **Degraded:** WASM fail или лимит recreate → `SimplePlayer` + event `player:physics_degraded`.
- Метрики: `kccDegradedMetrics.ts`, recovery `kccRecoveryState.ts`.
- `combatStartGate`: откладывает `startCombat` до `scene:loaded` (timeout 15s).

### Сцены: 27 локаций

`CORE_SCENE_IDS` (18) + `EXTENSION_SCENE_IDS` (9) = `SCENE_IDS` в `sceneIds.ts`.
Единый источник геометрии — `sceneDefinitions.ts` → `sceneDefinitionGenerator.ts`.

### UI-оркестратор: производительность и утечки (v4.1)
- **Lazy tiers**: `CombatUI` и мини-игры грузятся через `retryLazyDefault`
  (`lazyPanels.tsx`, `lazyMinigames.tsx`) — retry при ChunkLoadError + stale deploy.
- **ControllerSession** (`useCutsceneController`, interaction/combat hooks):
  generation-guarded timers; cleanup на unmount (`cancel()` / `dispose()`).
- **Стабильный контекст**: `CyberpunkThemeProvider` — `useMemo` для context value.
- **MiniMap rAF**: позиция/rotation в refs; effect только на `[sceneConfig]`.
- **CombatUI / HUD**: `scheduleTimeout` + `timersRef`; buffs/powers — `useMemo`
  с узкими deps (`combatState.buffs`, `powerCooldowns`, `turn`).
- **Panel stack**: `onPanelOpened` только при росте `panelStack.length`
  (закрытие панели не сбрасывает examine).
- **DialogueRenderer**: NPC lookup/emotion/relation — `useMemo` по speaker/text
  (не пересчитывается на каждый тик typewriter 30 ms).

### GPU и Three.js lifecycle (v4.1)
- `sceneGpuLifecycle.ts`, `graphicsGpuCleanup.ts` — централизованный teardown
  текстур/геометрий при смене сцены и quality preset.
- `moduleGeometryRegistry.ts` — учёт shared BufferGeometry между сценами.
- `bufferGeometrySanitize.ts` — guard NaN/Inf в атрибутах (god-rays, процедурка).
- `textureReuseMap` / `cachedCanvasTexture` / `objectPool` — ref-count + dispose
  при последнем unmount; тесты в `gpuLifecycle.test.ts`.

### Аудио (v4.1)
- `AudioEngine` — capability probe (`audioCapabilities.ts`), graceful mute при
  suspended context; scene handoff через `SceneAudioController` + `AmbientEngine`.
- Singleton revive после StrictMode dispose синхронизирован с EventBus.

### Бой: баффы (v4.1)
- `buffSystem.ts`: refresh по stack key; mutual exclusion defense_reduction ↔
  damage_multiplier; **лимит 2 buff + 2 debuff на target** (считаются отдельно).
- `combatTransientPool` — пул transient UI state; тесты buff/pool/gamepad.

### Числовая устойчивость
- `cameraShake.ts` — `Number.isFinite` на intensity/decay/dt (NaN не залипает).
- `seededRand.ts` — non-finite seed → 0 (SSR/partículas без NaN в CSS).

## Известные разрывы и roadmap

| Область | Статус |
|---------|--------|
| Content truth dual registry (CI eager vs runtime lazy) | parity test есть; validator ещё на eager STORY_NODES |
| Golden path triple source | derive + manual fallback + per-node guidanceHint |
| NPC behavioral FSM → 3D | ✅ `useNpcVisualBehavior` (GLB + procedural parity) |
| JSON narrative migration | тексты act1–7 есть; hubIntroText — постепенно для act 2–7 |
| Pause Escape vs panels | ✅ `escapeDismissAction` + capture-phase `useKeyboardShortcutManager` |
| Inventory z-index vs examine | ✅ PANEL 60; toasts скрываются при открытых панелях |
| NPC cutscene vs explore mode | ✅ toast «свободное исследование» после interaction Exit |
| Combat Escape | ✅ noop в combat/cutscene; pause toggle только в exploration |
| PostFX on low hero scenes | частично |
| GameOrchestrator priorities | разнесены по файлам |
| npcRegistry baseline | устаревшие id в тестах |
| act7 mirror flags | только в structure JSON — сканер обновлён |
| Cinematic registries | cutscenes / npcCutscenes / interactionSplashes — три схемы |

Спринт-гейты и CI-команды — `ROADMAP.md`, skill `.cursor/skills/volodka-roadmap-automations/`.

## Сборка и бюджеты

- `vite/chunks.ts` — ручная стратегия чанков. **Инвариант: entry-граф меню не
  должен достигать three/актов.** Для этого выделены `boot-shared`
  (engine/performance, visualSettings), `data-loader` (gameDataLoader +
  narrativePackRegistry), `data-golden-path` (zero-deps таблицы) и
  `content-validator` (статически импортирует barrel всех актов — никогда не
  колоцировать с boot-модулями).
- `config/performanceBudgets.json` + `scripts/check-bundle-budgets.mjs` —
  gzip-бюджеты по tier'ам (boot/game-start/lazy), hard-fail в CI.
- `scripts/validate-gltf-assets.ts` — наличие и glTF-магия всех рантайм-GLB
  (props/NPC/FPS-руки/external) + shipped-ассеты манифеста.

## Команды

```bash
npm run dev              # дев-сервер :3000
npm run check            # lint + typecheck + validate + build + budgets
npm run test:unit        # vitest (node env)
npm run test:e2e         # Playwright smoke
npm run validate:content # квесты/история/стихи/golden path
npm run assets:validate  # GLB на диске и валидны
npm run assets:bootstrap # CC0 production placeholders (первый деплой / CI)
```

## 3D-ассеты (production)

- **Пути:** все runtime GLB под `public/models/` (`/models/khronos/`, `/models/npcs/`, …).
- **Bootstrap:** `npm run assets:bootstrap` — скачивает CC0 Khronos/three.js и раскладывает
  по каталогу; interim до замены на AI3DGen Pro (`assets:ai3dgen-import` + `assets:process`).
- **Shipped-флаги:** `assetManifest.shipped`, `ai3dgenPropRegistry.shipped`, `npcModelRegistry`
  — только `true` когда файлы на диске (иначе 404 в production).
- **NPC-анимация:** AI3DGen mesh статичны; ключевые NPC — GLB в диалоге + procedural в патруле.
- **Герой:** `player_volodka` — interim CC0 CesiumMan LOD; финал = AI3DGen block-out + Blender rig.
- **Валидация:** `assets:validate` в `npm run build` и CI — обязательный гейт перед Vercel.
- **Атрибуция:** `public/models/ATTRIBUTION.md`.

## Правила для контрибьюторов (и агентов)

1. Тексты стихов в `src/data/poems.ts` не редактируются.
2. Display metadata стихов — только `unifiedPoemRegistry.ts`; mechanics-файлы — effect impl.
3. Explore-hub prose для story-defined hubs — `act*.json` / story pack, не `sceneExploreHubRegistry.hubText`.
4. Narrative open — через `presentNarrativeBeat`, не размазывать overlay dispatch.
5. EventBus — только между слоями; внутри слоя — прямые вызовы/props.
6. Engine не импортирует store — только GameActionDispatcher
   (`getGameSnapshot`, `dispatchGameAction`).
7. Новый контент — данные, не код: квест = запись в `quests/actN.ts`,
   враг на сцене = запись в `creepPatrols.ts`, предмет = `dynamicProps.ts`.
8. Любая правка проходит `npm run check` перед коммитом.
9. Deploy-архив исходников: `node scripts/create-deploy-archive.mjs`
   → `deploy-archive/volodka-vercel-*.zip` (или `DEPLOY_ARCHIVE_DIR`).
