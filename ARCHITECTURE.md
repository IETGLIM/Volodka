# Архитектура — ВОЛОДЬКА RPG

> Карта систем проекта для инженеров. Актуально для v3.4.0.

## Слои

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
│   EventBus · GameActionDispatcher · CombatSystem ·          │
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
- Приоритеты: Engine → Orchestrator → UI → FX → Debug (FIFO внутри уровня).
- Снапшоты слушателей на время dispatch; `createScope()` для пакетной отписки
  в оркестраторах; `dispose()` обрывает in-flight dispatch через generation.

### GameActionDispatcher (`src/engine/GameActionDispatcher.ts`)
Engine-модули не импортируют store. Мутации — типизированные `GameAction`
(quest/*, player/*, poem/*, story/*, exploration/*, …), чтение —
`GameStoreSnapshot`, мост регистрируется store-ом на старте
(`registerGameActionBridge`). Engine → store только через dispatcher.

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
- в бою — `POEM_COMBAT_ABILITIES` (кулдауны, баффы/дебаффы);
- в исследовании — TTL-флаги в store (`activeTTLFlags`), напр.
  `guiding_star_active` (poem_3) сжимает конусы зрения крипов до 45%.
Новые мировые эффекты стихов = чтение одного TTL-флага в кадровом цикле.

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
  scene-toast (`enterSceneFreeExplorationHub`), действия через trigger zones;
  `ui:exploration_message` → `EventNotificationPopup`. Реестр:
  `CLOSED_OVERLAY_EXPLORE_HUB_IDS` в `sceneExploreHubRegistry.ts`.
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
Zod-схема (SAVE_VERSION=1), two-phase write + rollback, backup-ключ.
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

### Числовая устойчивость
- `cameraShake.ts` — `Number.isFinite` на intensity/decay/dt (NaN не залипает).
- `seededRand.ts` — non-finite seed → 0 (SSR/partículas без NaN в CSS).

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
```

## Правила для контрибьюторов (и агентов)

1. Тексты стихов в `src/data/poems.ts` не редактируются.
2. EventBus — только между слоями; внутри слоя — прямые вызовы/props.
3. Engine не импортирует store — только GameActionDispatcher
   (`getGameSnapshot`, `dispatchGameAction`).
4. Новый контент — данные, не код: квест = запись в `quests/actN.ts`,
   враг на сцене = запись в `creepPatrols.ts`, предмет = `dynamicProps.ts`.
5. Любая правка проходит `npm run check` перед коммитом.
6. Deploy-архив исходников: `node scripts/create-deploy-archive.mjs`
   → `deploy-archive/volodka-vercel-*.zip`.
