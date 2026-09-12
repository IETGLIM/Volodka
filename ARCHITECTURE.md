# Архитектура — ВОЛОДЬКА RPG

> Карта систем для инженеров. Актуально для **v4.17.0** (`package.json` / `APP_VERSION`).
> AA visual/content density plan: [`docs/AA_QUALITY_ROADMAP.md`](./docs/AA_QUALITY_ROADMAP.md).
> Sequential uniformity backlog: [`docs/ARCHITECTURE_UNIFICATION.md`](./docs/ARCHITECTURE_UNIFICATION.md).
>
> **Стек:** React 19 · Vite 6 · Three.js 0.172 · R3F 9 · Rapier Wasm (`@react-three/rapier` 2.2) ·
> Zustand 5 · Zod 4 · Tailwind 4 · Vercel SPA.
>
> **Честный объём:** ~10–40 h плотного AA-прохождения сейчас; «120 h» — целевая фабрика контента,
> не текущий shipped playtime.

## Target Uniform Architecture (north star)

**Goal:** one pattern per concern across the whole codebase — not feature-local inventiveness.
Poem reveal FIFO is the **reference** for exclusive UI; other systems migrate toward it.

### Layers (strict)

```
data/          — declarative content only (story, quests, poems, zones, defs)
shared/        — types, bridges, contentTruth resolvers, zero store/engine imports
engine/        — business logic, orchestrators, EventBus producers (no React, no store imports)
store/         — Zustand slices + save (no engine imports; cross-slice via owners / bridges)
components/    — React UI + R3F views; call engine entry points / store actions — no growing business rules
hooks/         — thin React adapters over engine/store
config/        — scene/metric/shell policy tables
```

| Direction | Allowed | Forbidden |
|-----------|---------|-----------|
| UI → engine / store | entry APIs, selectors | inventing parallel registries in components |
| Engine → store | `dispatchStateAction` / snapshot only | `@/store/**` imports |
| Store → engine | `emitAppEvent`, `storeEngineHost` callbacks | `@/engine/**` imports |
| shared → | pure helpers | store or engine |

### One pattern per concern

| Concern | Canonical path | Do not |
|---------|----------------|--------|
| Narrative open | `presentNarrativeBeat` | raw `openNarrativeOverlay` from interaction |
| Poem discovery / ritual / read | `poemRevealOrchestrator` + `PoemRevealHost` (FIFO) | parallel discovery cutscene mounts |
| Exclusive interstitial busy | `cinematicInterstitialPresentation` (`matrix_quote` \| `first_reading_celebration` \| `poem_reveal` \| `quest_complete` \| `quest_chain_unlock`) | second poem-discovery busy flag; parallel quest busy modules |
| Dialogue / VN busy | store `showStoryOverlay` / `diegeticNarrative` (OR'd by presentation profile; store-owned forever) | duplicate dialogue busy modules |
| Explore hub topology | `sceneExploreHubRegistry` (+ `STORY_DEFINED_EXPLORE_HUB_IDS` / `ACT_PACK_STRUCTURE_EXPLORE_HUB_IDS`) | prose in registry for story-defined hubs |
| Explore hub prose | act JSON / story pack via `resolveExploreHubIntroText` | dual auto-hub vs act-pack toast copy |
| Leave + mid-resume | leave choice → hub + hub mid-split + zones + `entryNodeIds` | next-only mid-beat soft-locks |
| Heavy GPU features | `qualityFeatureGates.allowsHeavyGfxFeature` | ad-hoc `preset.id === 'ultra'` checks |
| Quality knobs | live fields on `QualityPreset` only (DPR, shadows, postFX, LOD, render modes, …) | dead preset flags with no consumers |
| Locomotion input | touch/gamepad/mouse → `sharedVirtualControlsRef` behind write gate; keyboard → `keyboardInputState`; merge in `resolveMovementIntent` (keyboard wins) | writing axes from panel shortcut managers; mouse re-assert after overlay clear |
| Poem collect UX | `PoemRevealHost` (verse); store `poem` notif = history only | floating text + toast mirrors of the same beat |
| Stat / FX floats | `floatingTextService` (xp/karma/damage/…) | discovery copy on `poem:collected` |
| Notification channels | `notificationChannelRegistry` + `useNotificationSlot` | unregistered popup components |
| Scene GPU | `releaseSceneGpuOnUnload` + `sceneGpuOwnership` + ephemeral dispose helper | ad-hoc dispose of module shared caches outside unload |
| Content truth | `contentTruthManifest` resolvers | reading parallel registries when a resolver exists |
| Cinematic runtime descriptor | `CinematicTimelineDef` via `splashPresetToTimeline` / `cutsceneDefToTimeline` + timeline orchestrator playback | parallel NPC cutscene registry; ad-hoc waypoint players without converter |

### Exclusive UI sequencing (reference = poem reveal)

1. Request enters a **single orchestrator** (FIFO or explicit busy reject).
2. Orchestrator sets **one interstitial flag** in `cinematicInterstitialPresentation`.
3. Host UI mounts once; completion clears flag + drains queue.
4. Sibling exclusive UIs wait on `isCinematicInterstitialActive()` / `isPoemRevealBusy()` — they do not stack.

### Deprecation rule

Prefer **delete or re-export shim** over leaving zombie parallel components.
`setPoemDiscoveryRevealInterstitialActive` deleted (Wave 7) — use `setPoemRevealInterstitialActive` only. `poemDiscovery/*` shim deleted.

### Migration status (honest)

| Cluster | Status |
|---------|--------|
| Poem reveal FIFO + excerpt SoT | ✅ shipped |
| Interstitial kinds (no parallel discovery flag) | ✅ Wave 1 |
| Dead quality preset knobs removed; heavy features via gates | ✅ Wave 1 |
| Poem discovery language (reveal owns UI; toast/float suppressed) | ✅ Wave 1 |
| Input write-path documented + enforced in code comments | ✅ Wave 1 |
| Mouse-both-buttons / gamepad / touch share write gate + clear API | ✅ Wave 6 |
| Locomotion merge-order unit test (keyboard > virtual) | ✅ Wave 6 |
| Quest-complete / chain-unlock folded into interstitial kinds | ✅ Wave 2 |
| Dialogue busy documented store-owned forever | ✅ Wave 2 |
| Dead `npcCutscenes` deleted; splash + cutscene → `CinematicTimelineDef` | ✅ Wave 2 |
| `poemDiscovery/*` shim deleted (imports → poemReveal) | ✅ Wave 2 |
| Explore leave / hub mid-resume | ✅ pattern; Acts 5–7 expanded + expansion leave shipped (quiet-hour intentional) |
| Scene GPU ownership | ✅ Wave 4 (`releaseSceneGpuOnUnload` + ephemeral dispose helper) |
| `STORY_DEFINED_EXPLORE_HUB_IDS` + structure split | ✅ Wave 3 (cafe/office/home prose in act1.json) |
| Golden path: markers cover spine; table = parity fallback | ✅ Wave 3 |
| Expand story-defined hubs (cafe/office/home prose → act JSON) | ✅ Wave 3 |
| Story cutscene playback on timeline orchestrator | ✅ Wave 3 (`useCutsceneController` → `cutsceneDefToTimeline`) |
| Full goldenPath.ts table retirement when markers complete | ✅ spine parity-only; BRANCH_HINTS emptied (hints on nodes) |
| Hero PostFX lite on low (forceFullPostFx ignored at low) | ✅ Wave 4 |
| Settings preset detail strings ↔ qualityFeatureGates; drop English `label` | ✅ Wave 4 |
| MeshPhysical / wet / CRT via `allowsHeavyGfxFeature` (+ home_evening / hero facades) | ✅ Wave 4 |
| showPoemToast / showQuestToast removed; float hygiene | ✅ Wave 5 |
| `setPoemDiscoveryRevealInterstitialActive` deleted | ✅ Wave 7 |
| Eager `STORY_NODES` CI + runtime lazy packs parity | ✅ Wave 7 (`getCiParityStoryNodes` + parity test; validator via manifest) |

Full ordered backlog: [`docs/ARCHITECTURE_UNIFICATION.md`](./docs/ARCHITECTURE_UNIFICATION.md).

## Content Truth — единая линия данных

**Манифест:** `src/shared/contentTruthManifest.ts` — документирует канонический источник для каждого домена и экспортирует resolvers. Новый UI/engine-код **не читает параллельные реестры напрямую**, если есть resolver.

| Домен | Источник правды | Resolver / вход |
|-------|-----------------|-----------------|
| Story nodes (runtime) | `narrativePackRegistry` → `gameDataLoader.getStoryNodes()` | `ensureStoryNode` |
| Dialogue nodes | `narrativePackRegistry` → `getDialogueNodes()` | `ensureDialogueNode` |
| CI parity | `getCiParityStoryNodes()` → `story/index` eager merge | `narrativeRegistryParity.test.ts` |
| Narrative UI open | **`presentNarrativeBeat`** | hub / diegetic / VN overlay |
| Explore-hub topology | `sceneExploreHubRegistry.ts` | `hubId`, `sceneId`, `entryNodeIds` |
| Explore-hub **проза** | `act*.json` / story pack (`hubIntroText`, `hubRevisitText`, `text`) | `resolveExploreHubIntroText` |
| Auto-generated hubs | `sceneExploreHubs.ts` (choices/topology); prose overlay from act JSON when in `STORY_DEFINED` | только хабы вне `ACT_PACK_STRUCTURE_EXPLORE_HUB_IDS` |
| Literary poem text | `src/data/poems.ts` (**не редактировать**) | — |
| Poem display names | `unifiedPoemRegistry.ts` | `getUnifiedPoem`, `enrichPoemMechanicsDisplay` |
| Poem world/combat mechanics | `PoemPowerSystem.ts` / `combat/actions.ts` | effect impl; display из registry |
| Achievements defs | `achievements.ts` | `AchievementEngine` |
| Achievement unlock state | `worldSlice` (persisted) | — |
| Story history (journal) | `visitedNodes` → `buildJournalNotes` | — |
| Dialogue transcript | `uiSlice.conversationLog` | runtime only |
| Lore codex | `loreEntries.ts` | — |
| Golden path | `deriveGoldenPath.ts` (+ `goldenPath.ts` parity spine / guidance fallbacks) | `buildGuidedStoryPath`; `guidanceHint` = display annotation only |
| HUD panels | `orchestrator/types.ts` `PANEL_IDS` | panel stack reducer |
| Thought Cabinet definitions | `thoughtCabinet.ts` | `THOUGHT_CABINET_ITEMS` / `THOUGHT_CABINET_MAP` |
| Thought Cabinet state | `playerSlice.thoughtCabinet` | selectors |

**Правило explore-hub prose:** для `STORY_DEFINED_EXPLORE_HUB_IDS` (act1 trio + cafe/office/kitchen, pier, factory, basement, solnysh) текст toast **не дублируется** в `sceneExploreHubRegistry` — только в story JSON / inline pack. Structure auto-gen skips only `ACT_PACK_STRUCTURE_EXPLORE_HUB_IDS`. Валидатор (`validateContentTruth` в `contentPipelineValidator`) падает, если `hubText` в registry дублирует story node.

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
│   DiceRollSkillCheck · MusicEngine/AudioEngine ·            │
│   camera strategies · visualSettings/AudioSettings          │
├─────────────────────────────────────────────────────────────┤
│ Data (декларативный контент)                                │
│   story/act1–7 · quests · dialogue · poems · npcDefinitions │
│   triggerZones · creepPatrols · dynamicProps ·              │
│   sceneDefinitions · goldenPath · thoughtCabinet ·          │
│   narrativeExpansionTriggerZones                            │
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
- **Reveal SoT (единый пайплайн):** `src/engine/poemReveal/` + `PoemRevealHost` / `PoemRevealShell`
  — один shell, режимы `discovery | power_ritual | explicit_read`, FIFO-очередь (без стека UI).
  Excerpt: `src/shared/poem/poemExcerpt.ts` (`getPoemExcerpt` / combat preview / terminal frame).
  Entry points: `poem:collected` → discovery; `requestPoemPowerActivation` (exploration) → power_ritual;
  celebration `first_reading` ждёт `isPoemRevealBusy()` и берёт тот же excerpt (не параллельная типографика).
  Legacy: `PoemDiscoveryReveal` / `PoemReadingCutscene` — re-export `PoemRevealHost`.
  **Не** invent second poem timeline в `CinematicTimelineRunner` (camera dolly — optional hook из shell).
- в бою — `POEM_COMBAT_ABILITIES` (кулдауны, баффы/дебаффы); pity в `combatRng.ts` / `buffSystem.ts`;
  на кнопках способностей — 1–2 строки из `getPoemCombatExcerptLines` (тот же excerpt-path);
- в исследовании — TTL-флаги в store (`activeTTLFlags`), монотонные часы `ttlClock.ts` (performance.now).
  Напр. `guiding_star_active` (poem_3) сжимает конусы зрения крипов до 45%;
  `child_gaze_active` (poem_7) раскрывает зоны с `hiddenUntilPoemFlag`;
  `stone_skin_active` (poem_10) снижает входящий стресс на 50%.
  **Consumers:** `config/poemEffectRegistry.ts` + `engine/poemEffects/poemTTLRuntime.ts`
  (stress scale, combat opening bridge, HUD `PoemActiveEffectsHud`).
Новые мировые эффекты стихов = чтение одного TTL-флага в кадровом цикле.
`processExpiredTTLFlags()` — из game loop (`useGameLifecycleManager`).

**Исключения (намеренно вне shell):** меню `MatrixPoemAssembly`; полный текст в poetry book typewriter
(«открыть сборник» — destination после fragment beat).

### Thought Cabinet (Кабинет Мыслей)

Система внутренних мыслей персонажа — пассивные модификаторы навыков, привязанные к одной из 7 trainable skills.

**Файлы:**

| Роль | Путь |
|------|------|
| Данные (определения) | `src/data/thoughtCabinet.ts` |
| Типы | `src/shared/types/definitions/thoughtCabinet.ts` |
| Store (sub-slice) | `src/store/slices/thoughtCabinetSlice.ts` (компонуется в `playerSlice.ts`) |
| Selectors | `src/store/selectors/thoughtCabinetSelectors.ts` |
| UI (вкладка журнала) | `src/components/game/journal/ThoughtCabinetTab.tsx` |

**Контент:** 30 мыслей. Каждая содержит:

| Поле | Описание |
|------|----------|
| `id` | уникальный идентификатор |
| `name` | отображаемое название |
| `voice` | одна из 7 trainable skills |
| `description` | описание эффекта |
| `flavorText` | литературный текст |
| `acquisitionCondition` | условие получения (флаг) |
| `mutuallyExclusive[]` | id конфликтующих мыслей |
| `effects[]` | массив эффектов-модификаторов |

**Взаимоисключающие пары (6):**

| Мысль A | Мысль B |
|---------|---------|
| Post-Soviet Nostalgia | Cyberpunk Future |
| Resist the System | Adapt to System |
| Loneliness as Shield | Bonds That Save |
| Resonator Awakening | Silent Observer |
| Virus of Freedom | Quarantine Protocol |
| Hive Mind | Lone Wolf Protocol |

**Ограничения:** максимум 3 экипированных мысли одновременно. При экипировке конфликтующей мысли автоматическое снятие предыдущей.

**Store actions:**

| Action | Описание |
|--------|----------|
| `thoughtCabinet/acquire` | получить мысль (проверка условия) |
| `thoughtCabinet/equip` | экипировать (с авто-снятием конфликта) |
| `thoughtCabinet/unequip` | снять мысль |

**Selectors:**

| Selector | Возвращает |
|----------|-----------|
| `useAcquiredThoughts()` | все полученные мысли |
| `useEquippedThoughts()` | текущие экипированные мысли |
| `useAvailableThoughts()` | мысли, доступные для получения |
| `useThoughtSkillModifiers()` | `Record<TrainablePlayerSkill, number>` — суммарные модификаторы от экипированных мыслей |
| `useThoughtCabinetFull()` | полное состояние cabinet |

**Интеграция с dice-roll:** `useThoughtSkillModifiers()` используется системой проверок навыков для расчёта итогового модификатора броска кубика.

**UI:** вкладка «Кабинет Мыслей» в журнале, двухпанельная раскладка — сетка карточек слева, детальная панель справа.

### Dice-Roll Skill Checks

Система бросков кубиков для проверок навыков в диалогах (вдохновлена PbtA / 2d6-системой).

**Файлы:**

| Роль | Путь |
|------|------|
| Движок | `src/engine/skillCheck/diceRollSkillCheck.ts` |
| UI (анимация) | `src/components/game/dialogue/DiceRollDisplay.tsx` |

**Механика:** 2d6 + модификатор vs DC (класс сложности).

| Исход | Условие |
|-------|---------|
| Критический успех | натуральный 12 (всегда успех, независимо от DC) |
| Критический провал | натуральный 2 (всегда провал, независимо от модификатора) |
| Обычный успех / провал | 2d6 + modifier ≥ DC |

**DC диапазон:** 10 (лёгкая) → 14+ (сложная).

**API:**

```typescript
performDiceRoll(params: DiceRollParams): DiceRollResult
// Использует SeededCombatRng, если передан seed

getSuccessProbability(modifier: number, dc: number): number
// Перечисляет все 36 исходов 2d6

formatDiceRollResult(result: DiceRollResult): string
// Форматированная строка на русском
```

**Интеграция в диалоги:** при нажатии на выбор с `minSkillCheck` в `DialogueRenderer` выполняется бросок кубика с анимацией. Модификаторы Кабинета Мыслей автоматически включаются в расчёт.

**Проверки, поддерживаемые стихами (poem auto-pass):** poem-powered проверки сохраняют старое поведение flat-check — бросок кубика не выполняется.

**UI-анимация (`DiceRollDisplay`):** 5-фазная анимация:

1. `rolling` — кубики крутятся
2. `reveal-dice` — показ значений на гранях
3. `reveal-modifier` — отображение модификатора навыка
4. `reveal-total` — итоговая сумма
5. `result` → `dismiss` — результат и скрытие

Визуал: 3D CSS-кубики, терминальный стиль breakdown, звуковые события (emit через EventBus).

### Expanded Content Architecture

Расширенный контент Act 1 — дополнительные диалоги, story-узлы и триггерные зоны.

**Новые файлы:**

| Файл | Описание |
|------|----------|
| `src/data/dialogue/part1-albert-expanded.ts` | 30-узловое расширенное дерево диалога с Альбертом |
| `src/data/story/act1-room-expanded.ts` | 28 интерактивных узлов осмотра для `volodka_room` |
| `src/data/narrativeExpansionTriggerZones.ts` | 10 новых триггерных зон |

**Регистрация в narrative-системе:**

| Контент | Механизм регистрации | Идентификатор |
|---------|---------------------|---------------|
| Albert dialogue | `narrativePackRegistry` → `DIALOGUE_PACK_ORDER` + `BOOTSTRAP_DIALOGUE_PACKS` | `part1AlbertExpanded` |
| Room story nodes | `buildStoryNodes.ts` (source array) + `narrativePackRegistry` → `ACT_STORY_SATELLITES[act1]` | `act1RoomExpanded` |
| Trigger zones | `narrativeExpansionTriggerZones.ts`, гейт по флагу `room_free_explore_1` | — |

**Паттерн добавления контента:** новые файлы — standalone-экспорты, которые мержатся в существующие реестры. **Существующие контентные файлы не модифицируются.**

**Интеграция с Кабинетом Мыслей:** диалоговые и story-узлы расширенного контента устанавливают флаги `thought_available_*`, которые разблокируют получение мыслей в Кабинете.

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
  DPR, shadows, postFX, LOD bias, Draco/Meshopt, `npcRenderMode`,
  `environmentRenderMode`, visualLite. **Live knobs only** — no unused
  impostor/instancing/bakedLighting fields. Heavy GPU features
  (`n8ao`, `reflector`, `godRays`, `galaxySky`, `meshPhysicalWet`) gate
  exclusively through `qualityFeatureGates.allowsHeavyGfxFeature` (auto never
  enables them).

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
| EXAMINE | 38 | examine panel |
| MINIGAME | 40 | terminal, codebreaker |
| COMBAT | 50 | пошаговый бой |
| MENU | 58 | pause, settings |
| PANEL | 60 | inventory, journal, quests |
| LOADING | 100 | boot / scene load |
| DEV_PANEL | 200 | F3 debug |

Escape / panel routing: `escapeDismissAction` + capture-phase `useKeyboardShortcutManager` (см. known gaps).

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
**Policy:** low tier всегда lite PostFX — `forceFullPostFx` на hero-сценах игнорируется
(`resolveSceneRenderingPipeline`).

Пресеты: low = postFX off + Draco + procedural NPC; ultra = meshopt + full GLB.

**Draco-декодер — единая точка истины (v4.12.1):** путь декодера задаётся
ТОЛЬКО через `useGLTF.setDecoderPath('/draco/gltf/')` на модульном уровне
`engine/assets/gltfPipeline.ts`. Причина: drei `useGLTF.extensions()`
перезатирает `loader.setDRACOLoader(...)` своим синглтоном с gstatic-дефолтом
ПОСЛЕ вызова extendLoader — в проде с CSP (`connect-src 'self'`) это резало
каждый fetch декодера. `setDecoderPath` читается внутри extensions()-колбэка,
поэтому модульная инициализация gltfPipeline гарантированно отрабатывает
раньше (ESM-порядок: call-site импортирует gltfPipeline до своих preload-ов).

### Metric scale + interior shell mount policy

**Placement audit — модели vs геометрия сцены (v4.13.0):** инвариант «каждое
размещение (NPC-расписание, спавн, GLB-проп) лежит на полу, в габаритах и вне
стен/мебели (капсула 0.32 м)» проверяется статически:
`engine/scene/placementAudit.ts` → CLI `scripts/analyze-model-placement.ts`
(exit 1 при HIGH) → vitest-гейт `placementAudit.test.ts` → включено в
`npm run validate`. Оверрайды позиций для вариантов сцен
(`SCENE_SCHEDULE_PARENT`) живут в `config/npcVariantPlacementOverrides.ts` и
применяются тем же `resolveNpcPlacementForScene` в рантайме (NPCSystem,
InteractiveTriggers, миникарта, NPCProximityIndicator) — статический аудит и
рендер видят одни и те же координаты. Сон/отдых на низкой мебели (≤1.35 м)
считается нормой; коллайдеры обязаны совпадать с визуальными моделями
(stale-коллайдеры без визуала удаляются, как и визуалы без коллайдера).

**Конвенция:** 1 Three.js unit = 1 metre. Канонические human/prop targets —
`src/config/metricScaleCoherence.ts` (`PLAYER_METRIC`, street shutter/facade scales, `METRIC_SCALE_AUDIT`).
Cascade anchor: wake cutscene в `volodka_room` (≈1.75 m humanoid).

**Shell mount kinds** (`src/config/interiorShellScale.ts`):

| Kind | Meaning | Examples |
|------|---------|----------|
| `walkable_envelope` | GLB may replace procedural walls | `corridor` |
| `exterior_building` | Kenney facade impostor — **never** walkable room | bedroom, café, office, library |
| `backdrop_dressing` | Outdoor/industrial impostor via `SceneBackdropShell` only | factory, basement, pier, forest |

`AuthoredInteriorShell` отказывает `exterior_building` shells (`isExteriorBuildingShell` → `null`),
даже если ownership/scene allow-list иначе разрешает mount. High/Ultra **не** должны опустошать
procedural clutter ради Kenney facade, который не монтируется: clutter gated on
`isWalkableInteriorShellAllowed` / actual shell mount, not bare quality tier.

### Selective MeshPhysical (wet / CRT accents)

Не blanket `MeshPhysicalMaterial`. Quality-gated accents:

- Gate: `allowsHeavyGfxFeature(..., 'meshPhysicalWet')` + scene allow-list in
  `src/engine/graphics/wetStreetScenes.ts`.
- Knobs: `getWetPuddlePhysicalParams`, `getWetGlassPhysicalParams` (`crtTerminalGlass`,
  shop/pier/rooftop/office glass kinds, etc.).
- Consumers: plaza/café/street/pier/rooftop/CHK/park/winter + industrial CRT/oil accents
  (basement, guild, bunker, factory yard, albert backroom, …).

Mid/low + coarse-pointer stay on Standard paths.

### Leave + hub/zone mid-resume (soft-lock pattern)

Closed-overlay explore hubs (`CLOSED_OVERLAY_EXPLORE_HUB_IDS` in `sceneExploreHubRegistry.ts`)
закрывают VN overlay и отпускают игрока в 3D. Multi-beat side/spine chains **обязаны**:

1. **Leave choice** на mid-beats → `*_explore_mode` hub (`next` + `missingFlag` на done-флаге).
2. **Hub mid-split** — gated choices resume правильный beat (не coarse «start until done»).
3. **Trigger zones** в `narrativeExpansionTriggerZones.ts` (+ scene interactables) с
   `requiredFlag` / `hiddenWhenFlag` / entry node ids.
4. **Registry `entryNodeIds`** — physical scene enter / closed-overlay re-entry maps beat → hub.
5. **Dialogue greeting/return** — NPC mid-resume parity с hub.

Regression guard: `src/data/quests/act1ThinStubs.test.ts` (+ leave-scan tooling).
Live cues: `src/engine/guidedStory/aaaSideQuestHints.ts`.
Narrative pack parity: runtime lazy packs ↔ CI eager `STORY_NODES`
(`narrativeRegistryParity.test.ts`); satellites в `ACT_STORY_SATELLITES` / `narrativePackRegistry`.

### Cinematic timeline

- Runner UI: `src/components/3d/CinematicTimelineRunner.tsx`
- Controller/orchestrator: `src/engine/cinematic/cinematicTimelineController.ts`,
  `cinematicTimelineOrchestrator.ts`
- Cleanup must reset `sequenceStartedRef` / one-shot camera-acquire retry — иначе
  non-intro timelines silently skip after abort/transition.
- Wake + dialogue DOF autofocus (world-space) завязаны на cinematic / FollowCamera stack.

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

### GPU и Three.js lifecycle (v4.1+)
- `src/engine/scene/sceneGpuLifecycle.ts` — `releaseSceneGpuOnUnload` (ownership + GLTF
  eviction, derived-scene guarded); `SceneGpuLifecycleBridge` = enter warm only;
  unload bound via `bindSceneChunkGpuLifecycle`.
- `graphicsGpuCleanup.ts`, `unloadSceneGpuResources.ts`, `sceneGpuOwnership.ts` —
  централизованный teardown текстур/геометрий при смене сцены и quality preset.
- `disposeEphemeralGpuResources` — component-owned clones (не module registries).
- `moduleGeometryRegistry.ts` — учёт shared BufferGeometry между сценами.
- `bufferGeometrySanitize.ts` — guard NaN/Inf в атрибутах (god-rays, процедурка).
- `textureReuseMap` / `cachedCanvasTexture` / `objectPool` — ref-count + dispose
  при последнем unmount; тесты в `gpuLifecycle.test.ts` / `sceneGpuUnload.test.ts`.

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

## v4.15.1 — аудит 2026-09: критические фиксы наград/утечек/60FPS

### Camera Collision Proxy Registry (perf, 60 FPS)

`engine/camera/cameraCollisionLayers.ts` теперь владеет **плоским реестром**
прокси-мешей камеры (единственный источник — `CameraCollisionProxies.tsx`,
регистрация при mount / отписка при unmount). `resolveCameraCollision`
(cinematicCamera.ts) raycast'ит реестр БЕЗ рекурсии вместо двух рекурсивных
обходов всего графа сцены за кадр; пустой реестр (тесты/непрогретый кадр)
прозратно откатывается к прежнему рекурсивному пути. Слой 5 и
`isCameraCollisionHit`-фильтр сохранены как двойная защита.

### Frame Game Snapshot reuse (GC)

`engine/frame/frameGameSnapshot.ts`: снапшот создаётся ОДИН раз в pre_physics
(`FrameBudgetRunner` → `setLatestFrameGameSnapshot`) и переиспользуется
пост-фазой (`PostFrameBudgetRunner` → `getLatestFrameGameSnapshot`) — вместо
пересоздания объекта и пересчёта locomotion-lock дважды за кадр.

### Audio public-asset URL normalization

`engine/audio/SceneAudioController.ts` → `resolvePublicAssetUrl(file)`:
данные story-нод хранят относительные пути (`sounds/ambient/*.ogg`), которые
резолвились от текущего URL страницы — на суб-путях деплоя Vercel отдавал
index.html вместо .ogg (тихий отказ файлового эмбиента). Теперь путь
абсолютизируется от `import.meta.env.BASE_URL`. Громкость файлового лупа
обновляется живьём по window-событию `AUDIO_SETTINGS_CHANGED`.

### Quest rewardItems grant

`store/slices/playerQuestRewardsSlice.completeQuestAndApplyRewards` выдаёт
`questDef.rewardItems` через `batchAddItem` — раньше поле рисовалось в
карточке наград (questObjectiveCardAdapter), но не выдавалось (12 квестов).

### NPC-stub reachability (dying_poet_last_letter)

`poem_recipient_elena` получил `dialogueNodeId` + расписание в
`npcSchedules.ts` (scene `street_night`, «Болотная улица, дом 14» из лора) —
квест стал выполним; ранее написанные диалоги Елены перестали быть мёртвыми
данными.

### Teardown-гигиена

`engineRuntimeReset.ts` дополнен: `stopVoiceLinePlayback()` (глушит
HTMLAudio+speechSynthesis VO после dispose) и
`resetNpcPortraitCacheLifecycle()` (перепривязка scene:enter-листенера
портретного LRU-кэша после disposeEventBus+revive).

### UI-гигиена

- DevPanel гейтнут `import.meta.env.DEV` (английский дев-инструмент был
  доступен в проде по F3).
- QuickAccessToolbar: слоты «Карта»/«Кодекс» через
  `firePanelShortcut('KeyM'/'KeyK')`; контексты combat/dialogue/menu (все
  слоты были заглушками) скрыты — там свои органы управления.
- М: единственное действие — карта мира (сворачивание миникарты — тапом).
- Zoom-кнопки миникарты 44px touch-target; `EXPLORATION_HUD_LAYOUT.MINIMAP_HEIGHT` 196→222.
- `hud-mobile-responsive.css`: `@media (max-height: 560px)` скрывает
  декоративную правую колонку (weather/day-night/POI) вместо клиппинга.
- Русификация остаточных строк: ВРАГ / АТК / ЗАЩ / СКР / ПРОВЕРКА НАВЫКА /
  СИСТЕМА ГОТОВА / Персонаж / Жители.
- Удалены 14 мёртвых компонентов (никогда не импортировались) — см. CHANGELOG.

### Frame-budget интеграция эффектов

`components/3d/AmbientParticles.tsx` переведён с сырого `useFrame` на
`useFrameTick('misc')`: мягкий пропуск при исчерпании бюджета кадра,
авто-пауза при неактивной симуляции (demand-режим) и вне видимости.

### FreeRouter status

Сервис закрыт (DNS не резолвится). Edge-функции `/api/city-news` и
`/api/matrix-quote` возвращают честные `fallback:true` — игра работает на
статичных строках. Код-путь сохранён для будущего провайдера.

## Известные разрывы и roadmap

| Область | Статус |
|---------|--------|
| NPC behavioral FSM → 3D | ✅ `useNpcVisualBehavior` (GLB + procedural parity) |
| JSON narrative migration | тексты act1–7; hubIntroText for story-defined hubs incl. cafe/office/kitchen |
| Pause Escape vs panels | ✅ `escapeDismissAction` + capture-phase `useKeyboardShortcutManager` |
| Inventory z-index vs examine | ✅ PANEL 60; toasts скрываются при открытых панелях |
| NPC cutscene vs explore mode | ✅ toast «свободное исследование» после interaction Exit |
| Combat Escape | ✅ noop в combat/cutscene; pause toggle только в exploration |
| Leave / mid-resume soft-locks | ✅ Acts 5–7 expanded + expansion leave; quiet-hour intentional; mid-resume polish optional |
| Interior Kenney exteriors as rooms | ✅ blocked (`exterior_building`); procedural envelopes own walkables |
| Selective MeshPhysical wet/CRT | ✅ quality-gated accents; not blanket Physical |
| Exclusive interstitial kinds | ✅ Wave 2: + quest_complete / quest_chain_unlock; dialogue store-owned |
| Poem discovery notification language | ✅ PoemRevealHost owns UI; toast/float mirrors suppressed |
| Dead quality preset flags | ✅ removed (useInstancing / impostors / bakedLighting) |
| Input locomotion write path | ✅ virtual ref + keyboard singleton; Wave 6 write-gate on overlay lock |
| PostFX on low hero scenes | ✅ low always lite (`resolveSceneRenderingPipeline`) |
| GameOrchestrator priorities | разнесены по файлам |
| npcRegistry baseline | устаревшие id в тестах |
| Mixamo ↔ Quaternius bone remap | ⚠️ alias remap + Body/Hips root strip shipped; finger/slot fidelity still interim |
| act7 mirror flags | только в structure JSON — сканер обновлён |
| Cinematic registries | ✅ converters + story cutscene playback via timeline orchestrator |
| Dialogue/quest busy → interstitial fold | ✅ quest UI in interstitial; dialogue stays store-owned |
| Explore hub ID set | ✅ `STORY_DEFINED` prose + `ACT_PACK_STRUCTURE` auto-gen skip |
| Golden path sources | ✅ derive + parity fallback; guidanceHint owns copy; BRANCH_HINTS empty |
| Content truth dual registry (CI eager vs runtime lazy) | ✅ parity + `getCiParityStoryNodes`; validators on manifest resolver |

AA visual/content waves и tick log — [`docs/AA_QUALITY_ROADMAP.md`](./docs/AA_QUALITY_ROADMAP.md).
Агентный контекст сессий — [`AI_SESSION_CONTEXT.md`](./AI_SESSION_CONTEXT.md).

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
10. AA density / soft-lock / visual parity work — follow `docs/AA_QUALITY_ROADMAP.md`;
    do not claim 120 h playtime in player-facing copy.

---

## Состояние активации (декабрь 2025)

### Что произошло

В коммите `92528db` «Mega AI Update» (август 2026) `src/main.tsx` был переписан на
импорт `./App` (короткая vanilla Three.js сказка, ~7k LOC), оставив orchestrator-архитектуру
(~340k LOC, 7-актная RPG на R3F/Rapier/Zustand) неисполняемой. Последующие 11 коммитов
(Round 2–11) продолжали развивать orchestrator, но он не подключался.

### Что исправлено

1. **`src/main.tsx`** восстановлен на импорт `@/app/AppBootRoot` (как до `92528db`) —
   orchestrator снова активен. `vite build` собирает 4432 модуля в один `index.html`
   (12 MB, gzip 3.4 MB).
2. **`assetManifestShipped.generated.ts`** — `shipped` флаги оставлены `true` (модели
   есть в репозитории на GitHub и подтянутся при деплое на Vercel).
3. **Guard'ы ассетов** — `CesiumPlayerModel`, `VolodkaRoomVisual`, `AuthoredInteriorShell`
   теперь проверяют `isAssetEffectiveShipped()` перед вызовом `useGLTF`, чтобы отсутствие
   GLB-файлов на диске не роняло сцену в `RecoveryScreen`. Добавлены `ErrorBoundary`
   с procedural-fallback для модельки игрока.

### Критические баги, исправленные в этой итерации

| # | Баг | Файл | Исправление |
|---|-----|------|-------------|
| 1 | 27/34 NPC ломались при повторном разговоре (`returnDialogueNodeId` → несуществующие узлы) | `src/data/dialogue/returnDialogues.ts` (новый) | Создано 34 return-узла с русскими приветствиями |
| 2 | Poem powers обходили affinity-систему | `src/engine/CombatSystem.ts:627-648` | Пост-процессинг: пересчёт урона через `POEM_DAMAGE_CHANNEL` |
| 3 | `physical: 0.0` (иммунитет) делал базовые атаки бесполезными против 6 типов врагов | `src/engine/combat/combatAffinities.ts` | Заменено на `0.3` («Почти иммунитет»), добавлен лейбл |
| 5 | `playerAttack` игнорировал thought-bonuses к crit | `src/engine/CombatSystem.ts:462` | `getPlayerCritChance()` вместо `computeCritChance(writing)` |
| 6 | `network_spy` special attack id содержал пробел | `src/engine/combat/enemies.ts:981` | `'spy misinformation'` → `'spy_misinformation'` |
| 7 | Описание «Дезинформация» не соответствовало эффекту | `src/engine/combat/enemies.ts:983` | «снижая интуицию» → «снижая карму» |
| 8 | 23 из 46 стихов не имели affinity-канала | `src/engine/combat/combatAffinities.ts:252-302` | `POEM_DAMAGE_CHANNEL` расширен до 46 стихов |
| 14 | 10 сюжетных NPC не получали hero-tier визуал | `src/engine/npc/npcRenderTier.ts:8-46` | Добавлены viktor, kira, boris, tamara, grisha и др. |

### HUD / a11y исправления

- **BuffDebuffTracker / SkillRechargeHUD**: `useActiveEffects` / `useSkillSlots` зависели
  от стабильного `poemPowers` ref → `useMemo` замораживал обратный отсчёт кулдаунов.
  Добавлен 500 ms interval для принудительного re-render (`hudMountSelectors.ts`).
- **MobileActionButtons**: «Бег» → «Бег вкл» / «Бег выкл» (copy-paste bug).
- **CompassHUD**: добавлен `role="img"` + `aria-label` с текущим направлением (С/В/Ю/З).
- **DayNightCycleIndicator**: добавлен `role="img"` + `aria-label` с фазой и временем суток.

### Очистка зависимостей

Удалены 11 неиспользуемых npm-пакетов (recharts, uuid, @hookform/resolvers,
tailwindcss-animate, react-day-picker, embla-carousel-react, vaul, cmdk,
react-hook-form, react-resizable-panels, input-otp) и 8 неиспользуемых shadcn/ui
обёрток (chart, calendar, carousel, resizable, form, command, drawer, input-otp).
Tree-shaking уже исключал их из бандла, но очистка уменьшает `node_modules` и
ускоряет установку.

### Известные ограничения

- **Bundle 12 MB (gzip 3.4 MB)**: `viteSingleFile` инлайнит весь JS в `index.html`,
  что сводит на нет code-splitting (219 dynamic import'ов становятся синхронными).
  `import * as THREE` в 253 файлах мешает tree-shaking Three.js. Это главная точка
  роста для будущей оптимизации (замена на named imports + отказ от viteSingleFile
  или dual-mode build).
- **3D-модели (~105 МБ в `dist/` после prune; `public/models/` оптимизирован в v4.4.2
  с ~493 МБ до ~135 МБ)** не входят в sparse-checkout разработчика; procedural-fallback
  покрывает отсутствие GLB. На Vercel модели подтянутся из репозитория.
- **PAT для git push**: предоставленный токен оказался невалидным (401 Bad credentials).
  Коммиты готовы локально; push требует обновлённого PAT.

## Новые модули v4.5.0

### Система фракций (`shared/types/definitions/faction.ts` + `engine/factionReputation.ts`)

5 фракций с репутацией −100…+100. Модульный движок: `addReputation()`,
`getFactionTitle()`, `isQuestAvailableForFaction()`, `getPriceModifier()`.
Слушатели через `onFactionReputationChange(fn)`. Интеграция с квестовой
системой через поле `faction` в QuestDefinition.

### Система фаз боссов (`engine/combat/bossPhases.ts`)

Определяет пороги HP (100→60→30%), меняет множители урона/скорости,
управляет неуязвимостью при переходе между фазами. Экспортирует
`getBossPhase(hpPercent, maxHp)` и `createBossPhaseTransition(hpPercent)`.

### Экологические опасности (`engine/combat/environmentalHazards.ts`)

Опасные зоны: огонь (красный), яд (зелёный), электричество (голубой).
Каждая зона: position, radius, damagePerSecond, damageType, statusEffect.
Функция `checkPlayerInHazards(playerPos, hazards)` — чистая, вызывается
в игровом цикле.

### ИИ врагов (`engine/combat/enemyAiBehaviors.ts`)

Конфигурация ИИ по типам: aggroRange (12), leashRange (20), kitingDistance,
attackCooldown. Состояния: idle → patrol → chase → attack → return.
Функция `updateEnemyAi(enemy, playerPos, dt)` — возвращает действие.

### FreeRouter AI чат (`engine/npc/freeRouterAiChat.ts`)

Клиентский вызов FreeRouter API (OpenAI-compatible) для генерации
динамических ответов NPC. Кэш 60с. Fallback на русском при ошибке.
Модель: qwen3.8-max. API key хранится в коде (для browser-only игры).

### Визуальные эффекты (`components/3d/environmental/`)

- `ParticleEffects.tsx` — 4 типа частиц (пыль, светлячки, угольки, снег), max 200
- `PuddleReflections.tsx` — отражающие лужи с пульсацией
- `InstancedClutter.tsx` — батчинг до 500 объектов в 1 draw call

### Процедурные анимации (`engine/player/proceduralAnimations.ts`)

Чистые функции: `breathingOffset(t)`, `headLookAt(head, target, maxAngle)`,
`idleShift(t)`. Без побочных эффектов, используются в render-цикле.

### Кинематографика (`components/game/cinematic/LetterboxBars.tsx`)

Чёрные полосы top/bottom (10dvh) с анимацией через framer-motion.
Используется при кат-сценах и важных диалогах.

### Производительность

- `engine/three/webglContextLoss.ts` — обработка потери WebGL контекста
- `engine/combat/lazyCombatSystem.ts` — ленивая загрузка боевой системы
- `shared/persistence/quotaCheck.ts` — проверка квоты localStorage

---

## v4.6.0 — Новые модули

### Каскадные тени (`components/3d/CascadedShadowMaps.tsx`)

2 дополнительных DirectionalLight (intensity=0, shadow-only) для средних (15-35м)
и дальних (35-60м) дистанций. Gated на quality >= high, desktop only, outdoor only.
Per-frame слежение за игроком через useFrameTick('misc').

### Motion Blur (`components/3d/MotionBlurEffect.tsx`)

Кастомный postprocessing Effect с GLSL шейдером радиального блюра.
8 сэмплов, distance-weighted через smoothstep. Активируется через
`setMotionBlurStrength()` из `engine/camera/motionBlurState.ts`.
Gated на ultra (always) или high+ (during cutscene/dialogue).
Плавный переход 0.4s easeInOutCubic.

### Визуальная одежда (`components/3d/ClothingVisualOverlay.tsx`)

Читает visualTag экипированной одежды из store, маппит на цвет/эмиссию.
Рендерит полупрозрачные box-оверлеи на 6 зонах тела (head, body, legs,
feet, hands, accessory). 20 палитр в постсоветском киберпанк стиле.

### NPC переходы (`engine/npc/npcSceneTransition.ts`, `components/3d/NpcTransitionAnimator.tsx`)

Система анимированного входа/выхода NPC. 4 новых EventBus события:
`npc:exit_start`, `npc:entry_start`, `npc:despawn`, `npc:entry_complete`.
NPC идёт к краю сцены перед исчезновением, появляется с края при входе.

### UI крафта (`components/game/crafting/CraftingPanel.tsx`)

Полноценная панель крафта: категории, поиск, детали рецепта,
кнопка крафта с проверкой ингредиентов. Все тексты на русском.

## v4.7.0 — Новые модули

### Фазы боссов (интеграция `engine/combat/bossPhases.ts` в `CombatSystem.ts`)

Мёртвая система активирована: переходы 100/60/30% HP → множители урона
(×1.0→×1.6) и скорости, i-frames (`damage_reduction 1.0` на 1 удар),
«Призыв Теней» (attack_boost, strictly-1v1 substitute), вспышка фазового
цвета + `combat:boss_phase`. `getBossPhaseThresholds()` синхронизирует
phase pips BossHealthBar с механическими порогами. Скорость не
компаундится: `bossBaseSpeed` хранит донефазную базу.

### Телеграфирование спец-атак (`CombatState.enemy.chargingSpecial`)

Вместо мгновенного спешела враг тратит ход на зарядку (turnsToHit),
индикатор «Готовит: …!» в CombatEnemyPanel (TelegraphIndicator), событие
`combat:telegraph` + тревожный стингер. Защита в контр-окно применяет
доп. ×0.4 к заряженной атаке (computeSpecialIncomingDamage). Заряженный
спешел исполняется гарантированно, cooldown+1 с компенсацией декремента
gotoEnemyTurnEnd.

### Единый пайплайн защиты (`enemyTurn.ts applyPlayerDefenseLayers`)

Слои 3–8 (defend → defense_boost → damage_reduction → vulnerability →
spiritual → perks) вынесены в общую функцию — спешелы боссов больше не
байпасят защиту игрока.

### WoW-ИИ крипов (`engine/npc/creepTactics.ts` + `PatrollingCreeps.tsx`)

- LOS: сегмент×AABB (slab method) по vision-блокерам сцены, чек раз в
  ~200мс на крипа с кэшем — конус зрения не видит сквозь стены
- Leash: выход за leashRange → состояние return к точке патруля
- Кайтинг: ranged_strelkov/censor_drone держат 5–7м, отступают при сближении
- Погоня по nav mesh (A*) + stuck-детект (1.5с без движения → отказ)

### Директор погоды (`engine/world/weatherDirector.ts` + `useWeatherDirector.ts`)

Чистый детерминированный модуль: погода = f(сцена, игровое время,
настройки), хеши вместо Math.random — воспроизводимость после сейв/лоад.
Синусоида дождя 0.20–0.74 (ниже порога «storm» 0.75 — геймплейный тип не
дёргается), грозовые окна с пиком 1.0 и рампом 60–90с (HUD-вспышки через
существующий storm-тип), окна дождя в сухих уличных сценах, дыхание
снегопада, indoor-сцены всегда 0. Запись только через setRainIntensity
(стор), пересчёт раз в 2–5с. Базовая карта сцена→тип перенесена в
SCENE_BASE_WEATHER (единый источник истины для контроллера и директора).

### Стамина (`engine/player/playerStamina.ts` + `hud/parts/StaminaBar.tsx`)

Module-level engine-состояние (не zustand — без ре-рендеров): дрейн 18/с
на спринте, реген 12/с (задержка 1с), порог 10 с гистерезисом, плавное
падение скорости спринта до шага. UI: тонкая полоска только при неполной
шкале, обновление через DOM-refs (паттерн StaminaBar ≈ SessionPlayTimer).

### Хазард-зоны (`components/3d/HazardZoneMarker.tsx` + `engine/hazard/hazardStatusChannel.ts`)

Data-driven тики: stress = cap(damagePerTick, 12), интервал из данных.
Диегетические 3D-маркеры: мерцающие искры (электро), зелёная лужа-декаль
(токсин), красные шевроны (край), «дышащая» вода (утопление), огненное
кольцо (костёр) — дешёвые примитивы, visualLite → статичные. HUD-канал
pub/sub (3D→HUD без EventMap): иконка + «−N стресс · X.X с» + полоска тика.

### Миникарта: квест-маркеры + сворачивание (`MinimapComponent.tsx`)

Живой `getQuestMarker()` вместо мёртвого `markerWorldPos`; edge-clamping
в стиле Cyberpunk/GTA (маркер на ободе + стрелка); цель в другой сцене →
маркер на выходе, ведущем к сцене цели. Сворачивание в «таблетку» 44px
(стрелка севера + ромб цели с дистанцией), framer-motion mode="wait".

### FreeRouter: городской тикер и шёпот (`api/city-news.ts`, `api/lib/*`)

`/api/city-news?act=&scene=&hour=` — AI-новости ночного радио для
TopBarDataTicker (бейдж «ЭФИР», graceful degradation на статику).
`/api/matrix-quote?mode=whisper` — тревожные шёпоты от первого лица под
будущую интеграцию стресса. Чистая логика в `api/lib/` (санитизация,
denylist насилия, eviction, фолбэки) — 38 юнит-тестов; tsconfig/vitest
подключают api/. Ключ FREEROUTER_KEY только в env.

### PWA (`public/sw.js` + регистрация в `main.tsx`)

Регистрация в production после load; кэш-стратегии: shell+WASM прекэш,
/assets|basis|draco|rapier/ cache-first, /models|textures|hdri|menu/
ограниченный runtime-кэш (~120 записей, LRU-аппроксимация) — офлайн-запуск.

### Narrative registry: satellite-пак `aaaExpansion` (+ `streetLegends`)

38 нод aaaExpansionStory.ts не имели ленивого загрузчика (ensureStoryNode
кидал not found) — добавлены в STANDALONE_STORY_SATELLITE_ORDER. Новый пак
streetLegends (5 квестов, 30 нод) подключён по тому же паттерну.

## v4.8.3 — экспертный аудит (132 этапа) и стабилизация

Полный отчёт изучения кодовой базы (132 обязательных этапа, статический анализ
~430k строк `src/`) — [`docs/EXPERT_ANALYSIS_STAGES.md`](./docs/EXPERT_ANALYSIS_STAGES.md).

### Критические фиксы геймплея

| Баг | Файл | Суть |
|-----|------|------|
| Камера за стеной в тесных коридорах | `engine/camera/cinematicCamera.ts` | `Math.max(minDistance, hit−margin)` выталкивал камеру ЗА препятствие, если стена ближе minDistance+margin (1.35м). Теперь `safe ≤ hit−margin`, пол `CAMERA_COLLISION_MIN_CLEARANCE=0.2`. Исправлен и reverse-проход |
| Залипание блока ПКМ | `hooks/useGamePhysics.ts` | RMB-блок включался по любому ПКМ в окне (в т.ч. по DOM-панелям) и не снимался при alt-tab. Добавлен гейт `isCanvasAreaTarget` + cleanup по `blur`/`visibilitychange` |
| Потеря подписки sprint-launch | `engine/camera/strategies/explorationStrategy.ts` | module-level `eventBus.on` без unsubscribe умирал после dispose/revive. Переведён на `registerModuleGlobalCleanupBinder`; порядок revive: `reviveEventBus()` → `reviveModuleGlobalCleanupBindings()` |
| Потеря Z-шейка | `engine/camera/cameraShake.ts` + `applyCameraFrame.ts` | shake-офсет был `{x,y}` — Z-компонента отбрасывалась. Добавлена ось Z (60% от X/Y — «удар в спину») |
| Ложный hard-brake после телепорта | `engine/player/playerFinalizeFrame.ts` | `__lastSprintSpeed` не сбрасывался при смене сцены → шейк+SFX без торможения. Запись валидна только в сцене-владельце |
| Shift+R мутировал камеру в кат-сценах | `engine/camera/useCameraOrbitInput.ts` | добавлен гейт `shouldBlockOrbit()` |
| Клобберинг геймпада | `engine/player/virtualJoystickBridge.ts` | `stop()` безусловно занулял все оси; теперь только если джойстик был активен |
| Ложные битые ссылки диалогов | `story/aaaExpansionStory.ts`, `story/pierStory.ts` | проверено рантайм-скриптом: хаб-узлы `*_explore_mode` генерируются из `SCENE_EXPLORE_HUB_DEFS` — граф цел (727 узлов). Правка не потребовалась |

### Дедупликация уведомлений (правая/левая колонки HUD)

- **Discovery-попап ×2 → 1**: убран устаревший `SceneDiscoveryToast`, остался `SceneDiscoveryCelebration`.
- **XP ×7 → 2 канала**: одно событие `fx:xp_gain` рендерилось в 5 компонентах + дубль `combat:victory` в `DamageNumberFloat` + store-диф в `useHUDController`. Осталось: плавающее число у прицела (`DamageNumberFloat`) + запись в ленте (`HUDNotificationFeed`). Пульс XP-бара сохранён.
- **Достижения ×3 → 1**: убраны текстовый тост и `AchievementPopup`-карточка; трофеи показывают только полноэкранную `AchievementUnlockCelebration`, обычные — `AchievementNotification`.
- **QuickInventoryBar удалён из монтирования**: дублировал QuickUseBar и перекрывал [E]-промпт (низ 234 vs бар 190–258) и crafting-тосты (188–244).

### Единая сетка правой колонки HUD (устранение наложений)

```
топ-бар кластер (top-2, h≈40) → DifficultyIndicator (top-12=48) →
BuffDebuffTracker (top=84) → миникарта (146..342) →
QuestObjectiveCard (explorationQuestCardTopPx()=348) →
achievement-тосты (explorationAchievementCardSafeTopPx()=570) → стат-пипсы
```
Новые слоты — в `shared/constants/hudLayout.ts`; QuestObjectiveCard больше не
налегает на миникарту; DifficultyIndicator открывает меню (кнопка больше не мёртвая).

### WoW-стиль фрейм героя

Новый `components/game/hud/parts/PlayerStatusFrame.tsx` — портрет (монограмма
«В» + бейдж уровня) и три анимированных бара: **Энергия** (зелёный), **Стресс**
(розовый), **Карма** (синий, −100…+100 → 0…100%) с числами, тиром и
flash-эффектом при падении кармы. Смонтирован в топ-бар слева (desktop-only).
Существовавший, но нигде не смонтированный `KarmaHudMeter` оставлен как утилита.

### FreeRouter (LLM-фичи) — починен эндпоинт и модель

- **Эндпоинт**: `https://freerouter.eu.cc/v1/...` отдаёт HTML документации (HTTP 405) —
  matrix-quote и city-news молча уходили в фолбэк. Реальный API —
  `https://api.freerouter.eu.cc/v1/chat/completions` (сверено с docs и curl-пробой).
- **Модель**: `glm-5.2` отсутствует в каталоге провайдера (GET /v1/models:
  `auto`, `claude-opus-5`, `grok-4.6`). Дефолт → `auto` (бесплатный роутер, $0/$0).
- Ключ по-прежнему только в `FREEROUTER_KEY` env; фолбэки без ключа сохранены.
- Требование к балансу ключа: провайдер требует ежедневного claim на дашборде
  (`no_credits` при пустом балансе) — на клиент и деплой не влияет.

### Перф-полировка

- `FrameBudgetRunner`: убраны 2 спред-аллокации/кадр (≈120/сек мусора GC).
- `playerMainMovement`: один `getGameSnapshot()` вместо двух в горячем пути.
- `AmbientEngine`: кэш noise-буфера по sampleRate вместо синтеза ~192k сэмплов на каждый кроссфейд.
- `useDeviceTier`: синхронная детекция тира в `useState` — мобильные больше не
  начинают грузить 2k-HDRI (6.66 МБ) до первого useEffect (риск 'medium'-флэша).

### Сознательно не тронуто

- Первые 18 стихов (`poem_1…poem_18`) — прямое требование правообладателя.
- Inline-base64 Rapier в physics-wasm чанке (829КБ gzip) — осознанный fallback
  resilience; стрип ломает инициализацию физики при недоступности внешнего WASM.
- Пошаговый комбат остаётся ядром встречи: реал-тайм слой (v4.8.7 удар
  первым + v4.8.8 память HP крипов и добивание до боя) отвечает за СТАРТ и
  ИСХОД встречи до/вместо пошаговой фазы. Полный перевод боя в реал-тайм
  3D по-прежнему требует hitbox-систем, реал-тайм HP ВО ВРЕМЯ боя и
  ребаланса всех врагов — архитектура (realtime/, события, presentation
  beat, hazards) готова к следующим инкрементам.

## v4.12.0 — «Честный промах»: RNG скоупа в реал-тайм слое

### Чистый модуль `meleeMiss.ts`
- `computeMeleeMissChance({ distanceMeters, angleDeg, isBackstab,
  isFinishable, rng })` — решает попытку замаха ПОСЛЕ гейтов замаха/LOS
  и расхода выносливости (промах «стоит сил»). Возвращает эффективный
  шанс промаха: 0 — попадание, >0 — промах (значение уходит в событие
  `combat:melee_miss`).
- Формула: база 0.06 + 0.14 × distFactor (0 на point-blank 1.4 м → 1 на
  reach 2.7 м, константы meleeSweep) + 0.14 × angleFactor (0 в центре
  взгляда → 1 на краю конуса ~58.4°); point-blank — база без надбавок;
  зажим [0, 0.35] (`clampMeleeMissChance`, `MELEE_MISS_HARD_CAP`).
- Бросок честный: промах, если `rng() ≥ 1 − шанс` — P(промах) = шанс
  при rng() ~ U[0,1]. RNG инжектится параметром (в рантайме
  Math.random): rng() = 0 — всегда попадание.

### Инвариант детерминизма
- `isBackstab` (стелс, задняя дуга неосведомлённого крипа) и
  `isFinishable` (остаток ≤ 35% HP с провайдером applyFinisher) → шанс
  ВСЕГДА 0: они уже гейтятся геометрией/состоянием — честный RNG их не
  оспаривает, кубик даже не бросается.
- При промахе `applyStrike` НЕ вызывается и `combat:melee_strike` НЕ
  эмитится — крип не знает о сорванном замахе; эмитится
  `combat:melee_miss` (поля сессии + missChance) и «💨 Промах!» через
  существующий `ui:exploration_message`.

### Кулдаун и презентация
- Кулдаун после промаха — 0.45 с (`MELEE_MISS_COOLDOWN_SEC`, вдвое
  короче попадания 0.9 с — честный second-chance); после попадания —
  прежние 0.9 с. Новый исход `'miss'` в `MeleeStrikeOutcome` — клик
  consumed, взаимодействие не запускается.
- Хаптика: `hapticMiss()` — тик [8], троттлинг общий с боевыми
  (hapticEventFeedback). FX: серо-белая (#d1d5db) маленькая искра 0.4 в
  MeleeStrikeFx — цвет/размер на каждом acquire из пула; анимация растёт
  от baseScale (обычная 0.6 — прежняя траектория). Зеркало подсказки
  `getMeleeStrikeHint` не менялось (промах — мгновенное событие).

## v4.11.0 — «Удар в спину»: стелс в реал-тайм слое, тихое добивание с бонусом XP

### Стелс-гейт и геометрия (`meleeStrike.ts`, `PatrollingCreeps.tsx`)
- Чистая геометрия `isBehindCreep(creepFacingYaw, dx, dz)`: dot(взгляд
  крипа, направление на игрока) ≤ −0.17 (`MELEE_STRIKE_BACKSTAB_DOT_THRESHOLD`)
  — игрок в задней дуге ≥ ~100°. Конвенция forward = (sin(yaw), cos(yaw))
  — та же, что в meleeSweep и headingRef крипа (`Math.atan2(dirX, dirZ)`).
- Гейт двойной: (1) крип не в погоне — провайдер `isAware()` === false
  («в курсе» только chase: убегающий тоже; cooldown после побега — нет —
  крип вернулся к посту и расслабился); (2) удар в задней дуге.
  Провайдеры `getFacingYaw`/`isAware` на `MeleeStrikeTarget` ОПЦИОНАЛЬНЫ
  — цели без них считаются бодрствующими (обычный путь, обратная
  совместимость).

### Контракт `applyStrike({ introHpPct, backstab })` — единая точка решения
- Сила ослабления собирается ТОЛЬКО в `attemptMeleeStrike` и уходит крипу
  одним контрактом; PatrollingCreeps отдаёт движку только факты
  (headingRef, осведомлённость) и применяет готовый introHpPct в
  `startEncounter` — крип больше не вычисляет HP сам.
- Инвариант приоритета: память HP после побега (creepVitality) > стелс
  0.5 (`MELEE_STRIKE_BACKSTAB_INTRO_HP_PCT`) > база 0.75. Стелс НЕ
  наслаивается на запомненный урон: 0.6 остаётся 0.6 (тест).
- Событие `combat:melee_strike` расширено `backstab: boolean` —
  потребители (FX/хаптика/HUD) ветвятся без повторных вычислений
  геометрии.

### Тихое добивание (`rewards.ts §9.3`)
- `computeCreepFinisherRewards({ backstab })`: +25% XP
  (`CREEP_FINISHER_BACKSTAB_XP_BONUS`, floor(25×0.6×1.25)=18 против 15),
  карма неизменна (фиксированная 2), кредиты считаются от бонусного XP
  той же формулой.

### Презентация стелса
- MeleeStrikeHint: третий стейт `data-backstab` («в спину — ЛКМ», EyeOff,
  #c084fc, дыхание ореола 3.2s, reduced-motion глушит); приоритет стейтов
  finishable > backstab > обычный решается в КОМПОНЕНТЕ
  (backstab && !finishable) — CSS конфликтов состояний не разрешает.
- MeleeStrikeFx: фиолетовая искра крупнее обычной; цвет переустанавливается
  при КАЖДОМ acquire из пула (resetHitSpark цвет не трогает — иначе
  стелс-цвет «протекал» бы в обычные удары).
- Хаптика: `hapticStealthStrike([10,60,10,60,25])` — троттлинг общий
  с боевыми (hapticEventFeedback).

## v4.10.0 — «Мир Снов»: 147/147 квестов, инвариант гейтов, единый источник наград

### Пак «Мир Снов» (`data/story/act5DreamWorld.ts` + сателлит акта 5)
- 11 story-узлов сна: шлюз-тетрадь (`act5_dream_descent`), дитя у фонаря
  (`dreamworld_lost_child`), поэт на краю сна (`void_echo_poem`, стих
  `poem_32`). Регистрация двойная, как у всех сателлитов: статический merge
  в `buildStoryNodes()` + lazy-лоадер в `narrativePackRegistry`
  (`ACT_STORY_SATELLITES.act5` + `STANDALONE_STORY_SATELLITE_ORDER`) —
  иначе `ensureStoryNode` бросает «not found» в рантайме (урок v4.8.9).

### Инвариант «гейты после активации»
- Хук активации квеста выставляет `triggerQuest` И флаг-гейт в одном выборе
  (`dream_world_opened` / `void_echo_quest_started` — узел
  `vladimir_secret_room_read`). Каждая зона-сеттер целей гейтится
  `requiredFlag` этим флагом — цель никогда не требует зоны, недоступной
  до активации квеста.
- Обратная сторона — ретроактивный добор: цель, выполненная до активации
  (`poem_32` собран в акте 1), закрывается `QuestTracker.retroactiveCheck`,
  подписанным на `quest:accepted`. Кумулятивные гейты, не являющиеся целями
  (`void_echo_all_heard`), выставляет `checkNewFlags` — по образцу
  quest-специфичных mid-resume флагов.
- Контрпример остался в истории: `final_poem_read` в единственном выборе
  прятал зону тетради за флагом, который ставился этим же выбором
  (soft-lock повторного входа в «Мир Снов») — флаг перенесён в
  visit-эффекты узла.

### Контракт «награды квеста — единый источник грантов»
- Цели `npc_talked` срабатывают при открытии диалога → автокомплит квеста
  выдаёт награды до финального узла. Поэтому диалоговые узлы НЕ должны
  дублировать гранты `rewards` квеста (XP/кредиты/предметы/флаги
  завершения) — дубли вычищены в v4.10.0 (`merchant_boris_thankyou`,
  `blacksmith_ignat_blade_done`, `marina_receive_letter`,
  `captain_garold_cornered`); исключение — уникальные ветко-специфичные
  флаги/карма, которых нет в `rewards`.

## v4.9.0 — «Почтальон оживлённых глав»: сквозные реестры, AAA-пак и гиверы-заглушки

### Kind-recovery: сквозные реестры story/dialogue (`engine/narrative/narrativeKindResolution.ts`)
- Граф повествования сквозной: хуки приветствий ведут прямо в story-узлы
  (`next: 'aaa_*_start'`), `visitStoryNode` меняет `currentNodeId` без смены
  kind оверлея. Рендеры искали узел только в «своём» реестре и показывали
  ошибку загрузки.
- `guessNarrativeKind(nodeId)` — синхронная догадка по кэшам реестров
  (однозначное вхождение ровно в одном); `resolveNarrativeKindByLoading`
  — асинхронное дозагрузкой паков. `narrativeChoiceExecutor` открывает
  оверлей с kind цели; `DialogueRenderer`/`StoryRenderer` переоткрывают
  оверлей синхронно по кэшам и асинхронно через ensure-фолбэк чужого
  реестра. Хуки с `next: null` + `visitStoryNode` продолжаются story-узлом
  через `presentNarrativeBeat` (раньше оверлей закрывался, старт-флаги
  цепочки не выставлялись).

### Достижимость 117 → 145 из 147
- **Анализатор стал точнее**: учитывает `triggerQuest`/`visitStoryNode`
  в node-эффектах узлов (рендер применяет их при визите — так активируется
  `poetry_broadcast`) и в эффектах триггер-зон (интеракция применяет
  эффекты — так активируется `solnysh_roof_wine`).
- **AAA-пак (8 квестов)**: хуки в приветствиях гиверов с гейтами
  `requiredAct` + флаги предпосылок + `missingFlag` от повторного запуска.
- **Гиверы-заглушки**: 14 NPC получили `dialogueNodeId` (готовые деревья
  в `act4_newDialogues` / `act4_expandedDialogues` / `act3_expandedDialogues`)
  и 12 расписаний (`npcSchedules`) — Торговец Борис, Кузнец Игнат,
  Умирающий старик, Информант Серёжа, Капитан Гарольд, Контакт из Сети,
  Поэт Макс, Библиотекарь Фёдор, Радист Катя, Контрабандист Гриша,
  Снабженец Общины, Поставщик Союза.
- **Зоны добычи (7)** в существующих сценах (`forest_clearing`,
  `abandoned_factory`, `park_day`, `river_pier`, `office_day`) закрывают
  цели `item_collected`; сеттеры флагов в диалогах (`archive_puzzle_solved`,
  `bunker_message_decoded`, `bunker_sender_found`, `goods_transport_started`,
  `patrol_avoided`, `blacksmith_special_done`) делают квесты завершаемыми.
- **Бейзлайн регрессии 30 → 2**: остаток — `dreamworld_lost_child` и
  `void_echo_poem` (цели ссылаются на несуществующие сцены «Мира Снов»;
  контент-пак целиком в бэклоге).
- **Маркеры навигации**: `questNpcMarkers` расширен NPC-подсказками и
  сценами-уэйпоинтами всех оживлённых квестов; тесты проверяют валидность
  ссылок против реестров NPC и `SCENE_DEFINITIONS`.

## v4.8.9 — «Мёртвые главы оживают»: достижимость квестов, паритет реестра диалогов

### Достижимость квестов (`shared/validation/questReachability.ts` + CLI)
- **Проблема**: активация квеста возможна только через `triggerQuest`
  (диалог/story-нода), `zone.linkedQuestId`, кинематограф или spine-правила.
  Статический BFS (`computeQuestReachability`) от корней — диалоги NPC с
  расписаниями (+ return/milestone-узлы), зоны, explore-хабы, пролог,
  кинематографические активации — показал: 51 из 147 квестов не имел ни
  одного пути активации. Полностью мёртвыми были пак-ы «Уличные легенды»,
  «Голоса Пирса» и AAA-расширение.
- **Паритет реестра диалогов** (`narrativePackRegistry`): добавлены 9
  отсутствовавших runtime-лоадеров (`part2Expanded…part5Expanded`,
  `returns`, `milestones`, `act4New`, `act3ExpandedDialogues`,
  `act4ExpandedDialogues`) — 220 узлов статического `DIALOGUE_NODES` не
  попадали в сессионный кэш; milestone-диалоги (relationMilestones
  @50/@80 Альберта/Заремы/Марии/Солныш) не резолвились
  `ensureDialogueNode`. `milestones` включён в `BOOTSTRAP_DIALOGUE_PACKS`.
- **27 коллизий return-узлов**: `returnDialogues` (генератор заглушек
  mkReturn) при слиянии затирал авторские return-узлы пак-файлов
  (в т.ч. `albert_return` — вход в дерево `act1_albert_alliance`).
  Теперь returnDialogues — fallback: сливается первым и в статическом
  `dialogue/index.ts`, и в runtime `DIALOGUE_PACK_ORDER`.
- **Оживление 15 квестов** (96 → 117): хуки-выборы в приветствиях гиверов
  (Гриша/Лёня/Тамара/Уличный поэт/Баба Зина/Трофим/Марат-эхо/Ритка/Мастер)
  с гейтами `requiredAct` + флаги завершения предыдущих цепочек;
  расписания и `dialogueNodeId` для безрасписанных NPC (Мастер завода,
  Марина, Марат-эхо, Старик на скамье, Умирающий поэт); мост-диалог
  `trofim_fourth_voice_gate` и новые узлы Марины (`marina_greeting`,
  `marina_waiting_asked`).
- **Гварды**: `questReachability.test.ts` (пак-ы sl_*/pv_* достижимы
  целиком, бейзлайн недостижимых 30 не растёт) и
  `narrativePackParity.test.ts` (runtime-кэш покрывает статический
  реестр; авторские return-узлы побеждают заглушки).

## v4.8.8 — «Добивание до боя»: реал-тайм HP крипов, честные цены торговли

### Реал-тайм HP крипов (`engine/combat/realtime/creepVitality.ts`)
- Модуль-одиночка (без стора и React, паттерн meleeStrike): реестр
  остатков HP по creepId. Пишет PatrollingCreeps — на `combat:fled` читает
  `getCombatState().enemy.hp/maxHp` и вызывает `noteCreepWeakened`; читают
  meleeStrike (решение «добивание или встреча») и applyStrike (встреча
  стартует с запомненным HP вместо константы 0.75).
- Монотонность (повторное ранение берёт минимум), ленивая регенерация
  `CREEP_VITALITY_REGEN_MS = 90 с` (без таймеров — проверка при чтении),
  зажим 0..1 (полные HP снимают запись). Очистка: смена сцены
  (`clearAllCreepVitality`), победа (крип мёртв), поражение (крип лечится).
- Пошаговый CombatSystem НЕ хранит HP между сессиями (state обнуляется
  endSession) — память живёт в реал-тайм слое, слои по-прежнему не
  пересекаются.

### Добивание до боя (`meleeStrike.ts`, `rewards.ts §9.3`)
- Порог `MELEE_STRIKE_FINISHER_HP_PCT = 0.35`. Ветка после всех гейтов
  замаха: `computeCreepFinisherRewards({xpReward шаблона, множитель
  сложности})` → dispatch addKarma/addXp/addCredits → `clearCreepVitality`
  → события `combat:melee_strike{finished:true}` + `combat:creep_finished`
  → `target.applyFinisher()`. Без боевого RNG-сеанса — детерминировано.
- XP = 60% шаблона (мин. 1), карма 2, кредиты по `computeCombatCredits`
  от урезанного XP; лут не выпадает. Балансная логика: игрок экономит
  финальные ходы, но теряет лут и комбо-бонусы победы.
- `MeleeStrikeTarget.enemyType` стал обязательным (награды/событие);
  `applyFinisher` опционален — его отсутствие даёт защитный fallback на
  обычную встречу.
- Событие `combat:creep_finished` — единственный новый combat-канал
  (Combat 25); слушатель PatrollingCreeps добавляет creepId в defeated
  (снятие со сцены, как при combat:victory).

### Презентация ослабления
- HP-полоска крипа: два MeshBasicMaterial-прева (фон #160406 + заполнение
  #ff4757), геометрия заполнения сдвинута на полширины (анкер слева,
  scale.x = hpPct), билборд копирует quaternion камеры, позиция — над
  positionRef крипа (вне вращающейся группы). Видна только exploring &&
  !inArena; depthTest оставлен — стены перекрывают полоску.
- MeleeStrikeHint: `data-finishable` (Skull, «добить — ЛКМ», красная
  капсула) — CSS в hud-extensions.css; MeleeStrikeFx — scale 1.0/opacity 1
  при finished; хаптика — hapticHeavy.

### Торговля: единое отношение + реплики
- `tradingData.resolveTradeRelationValue` (TRADE_FACTION_WEIGHT 0.2) —
  чистая формула смеси; `crossSliceReads.readNpcTradeRelationValue` —
  торговое отношение для синхронных транзакций слайса (репутация фракции
  по ЖИВЫМ slice-сторам через `buildFactionReputationMapFrom` — combined-
  кэш gameStore обновляется микротаской и мог отстать). buyItem/sellItem/
  canBuyItem/canSellItem и гейты minRelation считают по ней же — цена на
  кнопке = списанная сумма.
- `shared/merchantTradeFlavor.resolveMerchantFactionLine` — постоянная
  реплика торговца по tier фракции (все 5 уровней, «%f», детерминизм по
  хешу npcId djb2); TradingPanel рендерит под приветствием с цветом tier.

## v4.8.7 — «Опережающий удар»: реал-тайм слой до пошагового боя, фракционные барки

### Реал-тайм замах (`engine/combat/realtime/`)
- `meleeSweep.ts` — чистая геометрия сектора удара (reach 2.7 м + конус
  ~58°, вплотную ≤1.4 м — без конуса), без импортов Three/Rapier (паттерн
  creepTactics). Конвенция взгляда: forward = (sin(yaw), cos(yaw)) при
  `sharedCameraYawRef.current` — подтверждена QuestDirectionArrow и
  interactionTargetQuery.
- `meleeStrike.ts` — модуль-одиночка: реестр целей
  (`registerMeleeStrikeTarget` — провайдеры позиции/LOS/engage от
  PatrollingCreeps), единая точка `attemptMeleeStrike(source)` (гейты фазы
  exploration → замах → LOS → кулдаун 0.9 с → выносливость 22 → событие
  `combat:melee_strike` → `target.applyStrike()`), зеркало HUD-подсказки
  (`reportMeleeStrikeCandidate` / `getMeleeStrikeHint`, поллинг без
  рендеров, паттерн StaminaBar).
- `playerStamina.consumePlayerStamina(amount)` — разовый расход вне
  спринта: без частичного списания, ставит ту же задержку регенерации.
- Старт встречи: `introHpPct` (0.75) идёт через `EncounterContext` →
  `CombatStartOptions` → `startCombatImmediate` — враг вступает с долей HP
  (floor, min 1) и строкой лога; `maxHp`/награды/фазы босса считаются от
  полного HP. Опция аддитивна: deferred-gate (combatStartGate) тоже знает
  introHpPct — бой, отложенный переходом сцены, не теряет ослабление.
- Ввод: `useEKeyInteraction` ЛКМ — сначала замах, «hit/tired/cooldown»
  consumes клик, «none» — взаимодействие как раньше; мобильная кнопка
  «Удар» в MobileActionButtons (прямой вызов, хаптика по исходу). Слой
  живёт только в exploration — с пошаговым боем не пересекается.
- FX: `MeleeStrikeFx` (PhysicsSceneNpcMounts) — первый рантайм-потребитель
  пула `combatHitSparkPool` (8/16): acquire → императивная анимация 0.45 с
  в skippable-системе `misc` → release; без React-состояния на удар.
  Хаптика — в `hapticEventFeedback` (троттлинг общий с combat:damage).
- HUD: `MeleeStrikeHint` (ExplorationHUD, рядом с
  CombatPreEngagementWarning) — стеклянная янтарная капсула, poll 150 мс,
  честное «не хватает выносливости», reduced-motion гейт пульса.

### Фракционные барки (`shared/npcFactionBark.ts`)
- Чистый shared: `resolveNpcFactionBark(tier, factionLabel, rng)` — только
  ally (45%)/hostile (60%), отдельные броски «сработает ли» и «какая
  строка», метка фракции в шаблон («%f»). Слабые уровни молчат (контроль
  шума, как FACTION_ATTITUDE_LINES в диалоге).
- Проводка: `useNpcBark` → `useNpcFactionAttitude` (стор остаётся в
  компонентном слое) → `computeBark(definition, factionContext?)` —
  приоритет: квестовая барка → фракционная → по личному отношению.

## v4.8.6 — честные сохранения, мобильные сейв/лоад, хаптика, фракции в диалогах

### Сохранение/загрузка: типизированный исход + единая точка обратной связи
- `SaveSliceActions.saveGame/loadGame` возвращают `SaveGameOutcome`/
  `LoadGameOutcome` (saved/skipped{reason}/failed{reason},
  loaded/empty/failed) — вызывающие впервые могут отличить «сохранилось» от
  «молча пропущено». Возвращаемое значение аддитивно: прежние вызовы без
  обработки результата не сломаны.
- `components/game/save/quickSaveLoad.ts` — единственная точка быстрого
  сохранения/загрузки (F5/F9 + меню паузы + мобильный HUD). Слой модуля —
  компонентный (вызывает действия стора и рисует тосты): engine/shared не
  могут импортировать store (границы eslint). Тосты только для
  saved/skipped/empty — ошибки и «восстановлено из резервной копии» уже
  озвучены `game:system_alert` слайса, дублей в каналах уведомлений нет.
- Гвард загрузки `isLoadBlockedNow()`: combat/cutscene/interaction запрещают
  патч сейва (runtime движка сбрасывается `resetEngineRuntimeFromStore`, а
  боевой runtime не персистится). F9 в бою — предупреждение вместо поломки.

### Тактильная отдача: событийный модуль + мастер-гейт
- `engine/feedback/hapticEventFeedback.ts` — module-singleton поверх
  типизированного eventBus: `combat:damage` (троттлинг 350 мс),
  `player:levelup`, `skill:level_up`, `quest:completed`, `perk:unlocked`,
  `player:physics_degraded`. Подписки биндятся при загрузке и
  переустанавливаются через `registerModuleGlobalCleanupBinder` —
  dispose/revive шины не оставляют модуль глухим (паттерн sprint-launch).
- Гейт «Виброотклик» (`hapticsSetting.ts`, localStorage
  `volodka_haptics_enabled`, дефолт ВКЛ) применяется внутри
  `hapticFeedback.vibrateIfEnabled` перед каждым вызовом — переключение
  мгновенно и покрывает ВСЕ источники вибрации, включая будущие.

### Репутация фракции в диалогах
- Чистая презентация в `shared/npcFactionAttitude.ts` (пороги из
  `npcRelationThresholds`: 65/55/45/30) — shared не импортирует
  engine/store. Мост в `useNpcFactionAttitude` (компонентный слой):
  `ALL_NPC_DEFINITIONS.faction` → `normalizeFactionId` →
  `useFactionReputation` (среднее по знакомым членам) → уровень/подпись/
  реплика. NPC без фракции — чип не рисуется.
- Монтирование: шапка `DiegeticDialogueHud` (чип рядом с именем) + строка
  флейвора над текстом только для ally/hostile — слабые уровни видны в чипе,
  текст не шумит на каждом узле.

## v4.8.5 — прямой канал панелей, миникарта-zoom, VO-субтитры, фракции в торговле

### Ввод: панельный свитчборд без синтетических клавиш
- `engine/input/panelShortcutDispatcher.ts` — регистрируемый обработчик
  (`registerPanelShortcutHandler` / `firePanelShortcut`); единственная
  реализация — `runPanelSwitchboard` в `useKeyboardShortcutManager`
  (модификаторные комбинации обработываются до свитчборда). window-keydown и
  мобильный HUD идут через одну и ту же функцию — семантика клавиатуры и
  тача гарантированно совпадает; при несмонтированном оркестраторе —
  деградация к синтетическому событию (legacy).

### Миникарта: множитель радиуса обзора
- `engine/minimapZoomSetting.ts` — три уровня (×1.35/×1/×0.7) в localStorage
  (`volodka_minimap_zoom_index`); `viewRadius = clamp(base * multiplier, ≥4)`;
  контролы — строка под кругом внутри слота `MINIMAP_HEIGHT` (196px),
  сетка правой колонки HUD не меняется.

### Аудио: голосовые линии → события и субтитры
- `voiceLinePlayer.playVoiceLineForNode(nodeId, { text, speaker })`:
  при недоступном VO-файле и включённой opt-in настройке
  (`voiceOverSettings`, localStorage `volodka_voice_over_enabled`) реплика
  идёт через `speechSynthesis` (ru-голос; отсутствие ru-голосов = тихий skip;
  параметры utterance из `emotion` реестра).
- События `audio:voice_line_start` / `audio:voice_line_end` (audioEvents);
  потребитель — `VoiceLineSubtitleHud` (гл. слой `UI_LAYERS.VOICE_SUBTITLE`),
  шрифт через `--subtitle-scale`; `stopVoiceLinePlayback` глушит и аудио,
  и синтез, и закрывает субтитр.

### Торговля: blended-отношение
- `TradingPanel`: `effective = round(0.8·npcRel + 0.2·factionAvg)`, где
  `factionAvg` — средняя репутация фракции торговца среди знакомых
  (`useFactionReputation` + `normalizeFactionId`). Влияние видно в подвале
  панели; семантика `minRelation`-порогов сохранена (тот же blended-значение).

## v4.8.4 — lookahead-ритм музыки, дельты экипировки, байтовый кэш

### MusicEngine: lookahead-планировщик («A Tale of Two Clocks»)

- **Было**: бас/мелодия — `setInterval(beatMs)` с огибающими «сейчас по
  колбэку», аккорды — цепочка `setTimeout`. Дрожание ±4мс+; в скрытом табе
  троттлинг ≥1000мс срывал пульсы и рассинхронизировал слои.
- **Стало**: один `setInterval(100мс)` — стенные часы — расписывает события
  вперёд по сетке `ctx.currentTime`:
  - `nextBeatTime` — басовые пульсы (1-я и 3-я доли, множитель интенсивности);
  - `nextMelodyTime` — шансы мелодии (без множителя — сохранено прежнее
    распределение);
  - `nextChordTime` — смены аккордов + retirement уходящих голосов.
- Горизонт: 0.4с видимый / **2.6с скрытый** (покрывает троттлинг 1с).
  Реанкоринг «протухших» сеток — fast-forward на целое число интервалов без
  взрывного доигрывания; пропущенные аккорды проходят то же блуждание ступеней.
- Очистка узлов мелодии отсчитывается от фактического старта ноты
  (`startDelaySec`), иначе lookahead обрезал бы ноту таймером очистки.
- `retirePadVoices` считает фейд по **таймлайну атаки** голоса
  (`{ start, level, attackEnd }` в реестре голосов), а не по мгновенному
  `.gain.value` в момент планирования — фейд корректен даже когда смена
  аккорда запланирована раньше конца атаки.
- `setIntensityLayer` больше не перестраивает сетку: длительности
  читаются планировщиком на каждом тике → смена темпа без рассинхрона.

### Инвентарь: единый движок сравнения экипировки

- `inventoryTooltipPresentation.ts`:
  - `buildEquipmentComparison(view, equippedItems)` — единственная точка
    сравнения для тултипа и панели деталей (раньше сравнение жило только в
    тултипе); определяет целевой слот (`equipmentSlot` + fallback
    `getEquipmentSlot`), берёт надетый предмет, агрегирует `effects`
    **и `combatBonus`** (раньше боевые бонусы игнорировались).
  - Ключи агрегации: `stat` / `skill:<skill>` / `combat:<skill|all>:<flat|percent>`;
    строки сортируются группа-зависимо: статы → навыки → бой.
  - `buildCombatBonusLines(def)` — человекочитаемые «⚔ навык +N / %».
- Новый UI-блок `components/game/inventory/EquipmentComparisonBlock.tsx`
  (`ComparisonDelta` / `ComparisonRow` / `SideBySideComparison` /
  `EquipmentComparisonSection`) — общий для `InventoryTooltip` (portal) и
  `InventoryDetailPanel` (панель деталей), без дублей разметки.
- `useInventoryPanel` отдаёт `selectedComparison` (memo по view + equipped);
  `Inventory.tsx` прокидывает его в панель деталей.
- `EquipmentPanel`: микро-чип главного бонуса надетого предмета
  (`formatPrimaryEffect`), цвет = польза/вред.

### PWA (public/sw.js): медиа-кэш с байтовым бюджетом

- К капу по записям (120) добавлен **байтовый бюджет 180МБ**: тяжёлые HDRI
  (до 7МБ) не выбивают квоту через счётчик записей.
- Хиты делают LRU-touch (delete + re-put) — вытесняется давно неиспользуемое.
- Размеры — по `content-length`, таблица размеров лениво пересевается после
  рестарта SW; при неизвестных размерах байтовый кап молча отключается
  (деградация к капу по записям), ошибки учёта не ломают раздачу ответов.

### Документация контента

- `poemCollectionMeta.ts`: JSDoc `POEMS_PER_ACT` фиксирует, что акт 6 даёт 0
  основных стихов осознанно (дуга — скрытые `poem_act6_01…08`); изменение
  распределения сломало бы прогресс-UI журнала.

## v4.15.3 — пуловые числа урона (damageNumberLayer)

### Проблема
Каждый хит в пошаговом бою рендерился **тремя слоями одновременно**:
`DamageNumber` (CombatUI) + `CombatDamageNumbers` (framer-motion) +
`FloatingTextLayer` (floatingTextService, подписка `combat:hit`).
Наложенные числа + JS-анимации на главном потоке — риск пропуска кадров
на босс-файтах (аудит-этап 28).

### Решение: engine/floatingText/damageNumberLayer.ts
Модуль-одиночка (паттерн floatingTextService — ленивый init, HMR-dispose,
reset в engineRuntimeReset), **ноль React**:
- контейнер `#volodka-damage-layer` + пул из 24 заранее созданных `<div>`
  (ноль DOM-аллокаций в бою);
- анимация `element.animate()` (WAAPI) с кадрами **только по
  transform/opacity** → композитор GPU, без layout/paint/re-render;
  деградация до setTimeout на WebView без WAAPI;
- коалесценция бёрстов: окно 130 мс на (якорь × тип) — мульти-хит
  доливается в летящее число `Σ×N` (босс-АоЕ/комбо-серии);
- вытеснение по приоритету: killshot > critical > heal/damage >
  status/strike/backstab > miss; спам ниже cheapest активного — drop;
- якорные полосы: `enemy` (верх-центр, у панели врага), `player`
  (лево-низ, у карточки игрока), `center` (реал-тайм замахи);
- `prefers-reduced-motion` → статичный fade.

### Владение событиями
- `combat:hit` — damageNumberLayer (единственный владелец чисел урона;
  floatingTextService больше НЕ слушает его — дублирование устранено);
- `combat:melee_strike` / `combat:melee_miss` / `combat:creep_finished` —
  метки «УДАР» / «В СПИНУ!» / «ПОВЕРЖЕН» / «ПРОМАХ» / «+N ОП»: реал-тайм
  слой опережающего удара получил числовой фидбэк (раньше — только искры);
- floatingTextService сохраняет XP/карму/кредиты/предметы (combat:victory),
  навыки и лут.

### Удалено
`CombatDamageNumbers.tsx`, `hud/parts/DamageFloatSystem.tsx` (768 строк без
импортёров), мёртвый баррель `hud/parts/index-enhanced.ts`, `DamageNumber`
из CombatDamageFx, CSS-кейфреймы `hud-filmic-damage-rise-fade`.
`useCombatUiController` больше не хранит damageNumbers/richDamageEvents —
только крит-шейк/вспышки (фидбэк экрана, не числа).

## v4.16.0 — арки проработки мыслей (Thought Cabinet internalization)

### Проблема
- Кабинет мыслей был плоским: экипировка → полные эффекты мгновенно.
  Roadmap «Days 31–60» требовал арки (Disco Elysium-style
  internalization) — выбор голоса должен быть долгосрочным решением,
  а не мгновенным баффом.

### Решение
- **`src/shared/thoughts/thoughtInternalization.ts`** — чистая логика
  арок в shared-слое (доступна store/engine/UI). Таблица
  `THOUGHT_INSIGHT_POINTS` — канонический источник очков за события
  (выбор 2 / навык 3 / сцена 2 / победа 4 / объектив 5 / стих 4).
  Прогресс 0..1 с клампом; `partialEffects: false` — гейт до 100%.
  Вехи пересекаются строго «вверх» однократно (до/после) — сейв-лоад
  повторов не даёт.
- Срез `thoughtCabinetSlice`: `thoughtInternalizationPoints`
  (persisted, record<string, number>), `advanceThoughtInternalization(event)`
  (очки + уведомления вех/финала кросс-слайсом),
  `getEquippedThoughtEffects()` масштабируется, снятие/повторная
  экипировка сохраняет прогресс.
- Драйверы: 6 слушателей в `useGameLifecycleManager` — событийная
  прогрессия, **ноль таймеров**.
- Боевой мост: `resolveThoughtCombatEffects(contributions)` принимают
  карту очков из снапшота; кэш-ключ снапшота дополнен — изолированные
  изменения очков не дают стейл-эффекты.
- Контент: 10 арок (Критик 60, Шёпот 80, Радиус 90, Юмор 50, Шестое
  Чувство 70, Стихия 100, Ритм Серверной 120 (гейт: Ритм-Синхронизация
  только после проработки), Ностальгия 70, Сопротивление 80, Память 90).
- UI: бейджи прогресса на карточках, `InternalizationProgressSection`
  (бар с тиками вех, тексты вех, финальная реплика), HUD-чипы с
  процентом, pulse-анимация завершённой арки (reduced-motion уважается).

### Правила
- **Чистая логика домена, нужная store и engine одновременно, живёт в
  `src/shared/**`** — не в `src/engine/**` (store не импортирует
  engine; no-restricted-imports).
- **Новое событие-источник очков прозрения → только в
  `THOUGHT_INSIGHT_POINTS` + слушатель в lifecycle-менеджере** — никаких
  локальных таблиц в драйверах.
- **Новая арочная мысль**: `internalization.requiredPoints` 40–120
  (достижимо за ≤ 60 событий любого типа), вехи строго по возрастанию
  в (0, 1), `completionText` обязателен для гейт-арок (игрок должен
  знать, что изменилось).

### Гарды
- `src/shared/thoughts/thoughtInternalization.test.ts` (24): прогресс/
  масштаб/знак/клампы; advance — накопление, завершение однократно,
  вехи вверх, прыжки через вехи, no-op на невалидных очках;
  контент-инварианты арок данных (>= 10, валидность, достижимость).
- `src/store/slices/thoughtCabinetSlice.internalization.test.ts` (9):
  накопление, масштаб эффектов через срез, гейт-арка, уведомления
  финала/вех, совместимость безарочных мыслей, unequip/re-equip,
  fraction-геттер.
- Сейвы: поле в `SavePayloadSchema` с `.default({})` — старые сейвы
  парсятся без миграций.

## v4.15.8 — пробуждение канваса «по спросу» и стабильный NPC-бэтч (этапы 64, 110; ⚠ = 0)

### Проблема
- Слепой keep-alive-интервал (invalidate каждые 2 с) в
  `CanvasFrameloopController` гонял полный кадр R3F даже в меню/интро,
  где канвас CSS-скрыт (`visibility: hidden` в OrchestratorCanvasLayer),
  и в скрытой вкладке, где rAF не срабатывает — рендер без наблюдателя.
- `useRegisterNpcFrame`: `enabled`-опция в deps-массиве эффекта →
  инлайн-стрелки (`enabled: () => cond`) с новой идентичностью на каждом
  рендере сносили/перерегистрировали запись бэтча → dirty →
  `rebuildSortedEntries` почти каждый кадр при 50 NPC.

### Решение
- **`src/engine/canvas/canvasKeepAliveBurst.ts`** — событийные окна
  пробуждения demand-фреймлупа. Меню/интро/скрытая вкладка: интервал
  убран полностью (бут ведут пинки монтирования + сердцебиение
  sceneLoadedGate + эффект `[idle]`). Диалог: реестр
  `BURST_EVENTS` (npc:entry/exit_start — окно EXIT_TIMEOUT_S + 500 мс;
  npc:animation / npc:emotion_triggered / quest:pulse_marker — 700 мс),
  окно = rAF-цепочка с дедлайном, самозавершается; перекрытия
  расширяют окно (max); always-режим — no-op; dispose гасит всё.
  Правило: **новое событие, которое анимирует 3D-мир во время
  диалогового оверлея, обязано попасть в `BURST_EVENTS`** — иначе его
  изменения не отрисуются до закрытия оверлея.
- `npcFrameBatch.ts`: `enabled` выведен из deps — обёртка читает
  `enabledRef` по кадру (undefined → активен, boolean → значение,
  функция → вызов). Правило: **deps-массив `useRegisterNpcFrame` —
  только `[ownerKey, kind]`; динамическое состояние передавать через
  enabled-опцию/refs, не через перерегистрацию.**

### Гарды
- `src/engine/canvas/canvasKeepAliveBurst.test.ts` (6): 0 инвалидаций
  без событий; окно по дедлайну; always no-op; расширение (max);
  dispose; константы.
- `src/engine/npc/npcFrameBatch.hook.test.tsx` (6): churn-регрессия
  (50 ре-рендеров → 1 пересортировка, счётчик
  `getNpcFrameBatchRebuildCount`); семантика enabled; смена ownerKey.

## v4.15.7 — бюджет экранных FX и пинч-зум (этапы 32, 121)

### Проблема
- Пик комбата: до 7 одновременных full-screen композит-слоёв (flash +
  damage vignette + хроматика + винетки HP ×2 + edge-полосы + glitch-канвас
  в DPR 2–3) — fill-rate дропы на iGPU. При этом `fx:screen_flash` и
  `fx:chromatic_burst` из AaaCombatCinematic не имели ни одного слушателя
  (мёртвые события). Viewport `user-scalable=no` — a11i-минус (WCAG
  1.4.10): жест зума недоступен.

### Решение
- **`src/engine/fx/screenFxBudget.ts`** — чистая функция бюджета FX по
  пресету качества. Правило: **новый экранный FX обязан читать бюджет**
  (`resolveScreenFxBudget(preset)`) и уважать его. Тиры: low — 1
  оверлей / без хроматики и blend / merge красных дубликатов / статичные
  винетки / канвас DPR 1; medium — 2 / хроматика без blend; high — 3;
  ultra — 4.
- `ScreenEffects`: пул flash ограничен `maxOverlayLayers` (вытеснение
  старых), `combat:hit` не дублирует красный flash поверх damage vignette,
  `mixBlendMode` гейтится, LowHealthVignette мержит винетки и умеет
  статичный режим. Мёртвые события **вайрены**: `fx:screen_flash` →
  flash-пул, `fx:chromatic_burst` → хроматический слой.
- `GlitchEffect`: DPR канваса кепится бюджетом; `HUDChromaticEdge`
  отключается на low.
- Этап 121: **`pinchZoomViewport.ts`** + третий тип DOM-хука
  `viewportMeta` (accessibilityDomPresentation) + настройка
  «Масштабирование жестом (пинч)» (дефолт off — игровая фиксация).
  Правило: a11i-настройка никогда не меняет дефолт геймплея.

### Гарды
- `src/engine/fx/screenFxBudget.test.ts`: монотонность бюджета по тирам
  (low→ultra не ужесточается), самый строгий low.
- `src/engine/accessibility/pinchZoomViewport.test.ts`: зумируемая мета,
  возврат фиксации, идемпотентность, SSR no-op.

## v4.15.6 — сателлитные диалоги (этап 84)

### Проблема
- 202 из 614 диалоговых узлов были «сателлитами» — глубокие авторские
  ветки без единого внешнего входа: WS-спринты (ws17b/ws22b/ws23b/ws26),
  тюремная линия Заремы, эволюция Александра, исповедь Дмитрия, квест-
  финалы expansion-NPC, эпилоги. Контент в данных есть — игрок его не
  видел никогда.

### Решение
- **`src/data/dialogue/satelliteBridges.ts`** (пак `satelliteBridges`, 14
  узлов): темы-хабы в стиле Gothic 2 — `<npc>_topics` для 13 NPC +
  `volodka_reflections` для внутренних монологов. 136 тем, каждая с
  гейтом (requiredAct 2–5 / флаги событий / minNpcRelation / missingFlag
  одноразовых событий). Вход в хаб — выбор в return-узле NPC
  («поговорить по душам»), для expansion-стабов — тема в их entry-узле
  (гейт по флагу завершения квеста).
- 6 ambient-триггер-зон (улица ×2, комната, кухня ×2, коридор) открывают
  сироты exploration-узлов; `explore_volodka_inner` ведёт в хаб
  размышлений.
- Пак зарегистрирован по правилу «4 зеркальных шага»: статика
  (dialogue/index.ts, последним) + рантайм (DialoguePackId /
  DIALOGUE_PACK_ORDER / лоадер) — паритет-тест покрывает автоматически.

### Гарды
- **`src/data/narrative/dialogueReachability.test.ts`**: BFS от движковых
  входов (NPC dialogue/return/milestones, зоны linkedDialogueNodeId,
  story-выборы) — 0 недостижимых узлов. Гард строже файлового сканирования:
  словари-маппинги и ключи НЕ считаются входами (именно так найдены 3
  движковых сироты: zarema_rescue, explore_corridor_door,
  explore_kitchen_table).
- Правило: новый диалоговый узел обязан иметь вход (NPC-ссылка, зона или
  story-выбор) — иначе красный тест.

## v4.15.5 — системный uiTextScale (этап 79)

### Проблема
- Слайдер «Масштаб интерфейса» (85–130%) задавал `--volodka-ui-text-scale`
  на `<html>`, но масштабировал только rem-текст: ~1200 Tailwind
  arbitrary-классов (`text-[7px]`…`text-[13px]`), ~190 ручных CSS-деклараций
  и 57 инлайн-стилей задавали размер шрифта px-литералами — слайдер не влиял
  на ~95% текста HUD/панелей.

### Решение
- **`vite/uiTextScalePostcss.mjs`** — PostCSS-плагин в цепочке после
  `@tailwindcss/vite` (enforce:'pre' разворачивает утилиты до vite:css):
  чистые px-литералы `font-size` → `calc(Npx * var(--volodka-ui-text-scale, 1))`.
  Работает в dev и build одинаково; rem/em/%/calc()/var() и line-height не
  трогаются — нет двойного масштабирования rem-цепочки, сетки не ломаются.
  Интеграционная проверка конвейера: 244 переписывания, 0 px-литералов
  font-size в финальном CSS.
- **`src/engine/accessibility/uiTextScaleCss.ts`** — `uiTextScaledPx(N)` для
  инлайн-стилей (57 замен в 29 файлах: HUD-виджеты, уведомления, минигеймы,
  индикаторы) и DOM-слоёв движка (числа урона damageNumberLayer).
- Кастомные CSS-свойства вида `--dr-font-size` (единственный случай) —
  переведены на calc вручную; canvas-текстуры 3D — диегетика, вне масштаба.
- Тесты: `vite/uiTextScalePostcss.test.ts` (9),
  `src/engine/accessibility/uiTextScaleCss.test.ts` (3).

### Правило
- Новый инлайн-размер текста в TSX — через `uiTextScaledPx(N)`, НЕ px-литералом.
- Новый CSS px-литерал font-size автоматически подхватится плагином —
  добавлять var() вручную в CSS не нужно.

## v4.15.4 — вайринг Виктории + dialogue-parity (этапы 95–96)

### Проблема
- NPC `victoria` (EXPANSION_NPC_STUBS) — хранительница ключей — была
  зарегистрирована, но без dialogueNodeId и расписания не спавнилась;
  спящая ветка ачивки `flags['met_victoria']` в AchievementEngine не
  срабатывала никогда.
- DIALOGUE_PACK_ORDER (рантайм) ≠ порядок слияния dialogue/index.ts
  (статика): part1AlbertExpanded 3-й vs 11-й, exploration/chk поменяны
  местами. Паритет-тест был только для story.

### Решение
- **`data/dialogue/victoriaDialogues.ts`** — пак из 7 узлов
  (greeting → vault_lesson → keys_question; who_she_is → key_mistake;
  archivist_story; return с полными textVariants). Узлы задают
  `speakerId: 'victoria'` — обязательно: русские спикеры «Виктория»
  резолвятся в `maria` (NPC_SPEAKER_ALIASES, легаси актов 1–5),
  `victoria` — другая, физическая персона.
- **Вайринг**: `dialogueNodeId`/`returnDialogueNodeId` в стабе →
  entry→return-маппинг через DIALOGUE_RETURN_ENTRY_NODES (авто);
  `VICTORIA_SCHEDULE` (guild_mainframe, пост [-1.5,-2.5] / обход [0,1.5]);
  act-4 override `override_victoria_act4_cafe_farewell` (вечера у дверей
  кафе до `victoria_password_received` — зеркало story-узла);
  вариант-оверрайд victoria в albert_backroom (наследование позиций кафе
  в подсобку 8×6 — паттерн npcVariantPlacementOverrides).
- **Паритет**: DIALOGUE_PACK_ORDER ≡ статика пакет-в-пакет; пак `victoria`
  последним в обоих реестрах;
  `narrativeDialogueRegistryParity.test.ts` — множества id совпадают в
  обе стороны + deep-equal каждого узла (ловит расхождение порядка при
  коллизиях) + ensureDialogueNode-резолв паков Виктории.

### Правило на будущее
Новый диалоговый пак = файл в `data/dialogue/` + строка в `dialogue/index.ts`
+ id в `DialoguePackId` + позиция в `DIALOGUE_PACK_ORDER`, ЗЕРКАЛЬНО
статическому порядку. Parity-тест упадёт при любом расхождении.

## v4.17.0 — плотность Acts 3–4 (многобитовые кейсы + детектор мёртвых флагов)

### Проблема
- Четыре сюжетно значимых квеста Acts 3–4 были тонкими (3–5 объективов,
  ноль квестовых диалогов) при godlen-path статусе: roof_of_the_world
  (финал Александра, ~160 слов), vault_defense (283 слова), maria_truth
  (345), thread_of_18_lines (вообще без собственного контента).
- Whisper_of_walls был незавершаем: флаг `bunker_recordings_heard`
  не ставился нигде — класс бага «мёртвый флаг», который не ловит ни
  один существующий тест (questReachability проверяет только активацию).

### Решение
- **`src/data/story/act34CaseExpansions.ts`** — 19 story-узлов, четыре
  многобитовых кейса (канон act1Extended «6–12 бит»). Цепочки: прямые
  (roof, vault — same-scene) и хаб-опосредованные (maria, thread —
  межсценовые, mid-resume по флагам). Входы: 11 выборов в хабах
  sceneExploreHubs + 6 narrative-зон (5 vault-битов + сердце гула).
- Квесты: roof 3→8, vault 4→9, maria 4→9, thread 3→8 объективов;
  все новые флаг-объективы имеют сеттеры в эффектах пака/зон.
- **Ракет-тест `flagSetObjectiveSetters.test.ts`**: каждый flag_set-
  объектив обязан иметь сеттер в story/dialogue/зонах/наградах, либо
  whitelist движка (MINIGAME_COMPLETION_FLAGS, терминалы), либо список
  известного долга (12 позиций expansion-stubs/chkTolpa — только
  сокращаться). Долг виден явно — очередные «незавершаемые квесты»
  невозможны без осознанного решения.
- Баг-фиксы мёртвых флагов: whisper_of_walls (плёнки бункера, 4 зоны),
  watchers_shadow (узел Смотрящего + чип), night_shift (фантомы +
  рубильник), catacombs_shadows (тёмный маг).

### Правила
- Новый story-пак = файл в `data/story/` + запись в `buildStoryNodes.ts`
  (sources, последним) + `narrativePackRegistry.ts`: id в union
  `StorySatellitePackId`, лоадер в storyLoaders, позиция в
  `STANDALONE_STORY_SATELLITE_ORDER`. Parity-тест поймает пропуск.
- Мульти-сценовые бит-цепочки: бит заканчивается уходом в хаб сцены,
  следующий бит открывается выбором хаба с condition {flag: prev,
  missingFlag: own} — это и есть mid-resume для сцен.
- Объективы `flag_set` без сеттера запрещены ракет-тестом: контент-патч
  обязан нести сеттер в тех же изменениях (или осознанно расширить
  KNOWN_DEAD_FLAG_OBJECTIVES с обоснованием).

## v4.22.0 — слот-сетка HUD, реактивный гейт осмотра, перф-волна

### Слот-сетка HUD (shared/constants/hudLayout.ts — единый источник координат)
- Правая колонка — строгая вертикальная цепочка: топ-бар (0–40) →
  сложность (48) → баффы (84) → миникарта (146–368) → квест-карта
  (374, до 216px) → день/ночь (`explorationDayNightTopPx()` =
  `explorationAchievementCardSafeTopPx()`) → погода (каскад) → POI-
  компас. Коллизия квест-карта ↔ день/ночь (оба ≈ minimapBottom+4/6)
  устранена на уровне констант, а не точечными оффсетами.
- Нижний центр: тулбар (60) → quick-use (68) → поэзия (124) →
  [E]-промпт (`bottomInteractPromptPx()` ≈ 234) → тосты-подсказки
  (`bottomCenterHintPx()` / `bottomCenterHintSecondaryPx()`): тост
  «Вы сбились с пути», ContextualHint, CriticalStatusWhisper. Хардкоды
  `bottom-24` / `clamp(72–128px)` / `clamp(118–176px)` запрещены —
  только слоты.
- Левая колонка: именованный `LEFT_INSET` (панели «Персонажи» и
  «Подсказки» раньше использовали `RIGHT_INSET` слева).
- Правило: любой новый HUD-виджет обязан брать координаты из
  hudLayout.ts; хардкод vh/px в fixed-позициях — код-ревью флаг.

### Реактивный гейт оверлеев (engine/assets/gltfPreloadOverlayGate.ts)
- Модульный boolean-гейт (осмотр/сюжет) получил подписки:
  `subscribeOverlayGate` + нотификация на смену → хук
  `useExamineOverlayOpen()` (useSyncExternalStore, getServerSnapshot
  = isExamineOverlayOpen).
- Потребители: InteractionHintPopup, EnhancedCrosshairPrompt,
  ContextualHint, PlayerLostHintToast — пока осмотр/сюжет открыт,
  нижне-центральные подсказки размонтируются (раньше висели поверх
  панели осмотра — «стопка тултипов» со скриншота игрока).
- Сеттеры стали идемпотентными (early-return на same-value) — нотификации
  без дублирования.

### Перф-инварианты горячих путей
- HUD-кулдауны: единый `usePoemPowerCooldownTick` (store/selectors/
  hudMountSelectors.ts) — интервал 500мс живёт ТОЛЬКО пока есть
  кулдаун в пределах длительности; критерий «есть записи в poemPowers»
  не является критерием активности (записи персистентны).
- Интро: анимации первого экрана — только rAF (не setInterval), кап
  частоты через аккумулятор dt.
- DPR-замер (useDynamicDPR): опция `enabled`; в demand-фреймлоупе
  замер suspend'ится (RPGGameCanvas передаёт frameloop-флаг) —
  измерение FPS вне рендера бессмысленно и платно.
- Погодный множитель движения: кэш по квантовому ключу
  (enabled|scene|hour|rain×10) в playerMainMovement.ts —
  determineWeatherType больше не в каждом кадре.
- Аудио-визуализатор: rAF только при реальном AnalyserNode; idle —
  один статичный кадр «нет данных»; persist видимости/режима в
  localStorage (volodka.audioViz.*).

### Бут-гард
- WebGL2-гейт в main.tsx до createRoot: без WebGL2 (three 0.172 / R3F v9
  минимум) рендерится русский экран требований вместо чёрного канваса.

## v4.33.0 — волна стабилизации видимых дефектов: анимации, модели, текстуры

Реакция на фидбек игрока «текстуры, модели, движения корректно не работают».
Три параллельных исследования кодовой базы + runtime-проба (вне репозитория,
реальные three.js-микшеры) подтвердили 10 дефектов; все исправлены и
верифицированы статическим конвейером (tsc 0, ESLint 0 errors/58 legacy,
vitest ПОЛНЫЙ 2725/2725, validate:content 0, validate:act1-extended 0,
build + budgets OK, prune 161 путь, verify:deploy 117 путей, assets:validate OK).

### fix(anim): NPC-«статуи» — действия останавливались и не перезапускались
- Корень: cleanup `useNPCAnimation` с deps `[actions]` вызывал `action.stop()`
  для ВСЕХ действий при каждой смене identity объединённого объекта actions
  (каждый прибывающий отложенный клип idle/walking → sitting → sleeping →
  talking → working), а bind-эффект `useNpcLocomotionBlend` выходил рано при
  неизменном bindKey — idle/walk никогда не запускались снова. Микшер тикал,
  но активных действий не было: NPC замирали в позе (idle) или скользили
  по земле без анимации ног (patrol). Подтверждено пробой: `isRunning: false`
  у обоих действий через несколько секунд после маунта.
- Фикс 1: cleanup останавливает действия ТОЛЬКО при анмаунте хука
  (actionsRef-паттерн) — при пересборке объединённого объекта действия
  принадлежат живому микшеру и их останавливать нельзя.
- Фикс 2 (страховка на любой источник stop): ветка «bindKey не изменился»
  теперь перезапускает остановленные действия (`rearmStoppedAction`: play с
  сохранёнными весами/временем, без reset — без видимого спотыкания).

### fix(anim): скольжение ног (moonwalk/skating) — timeScale больше не константа
- Замер по трекам Foot.L/R shipped-GLB (gltf-transform + meshopt-декодер):
  Walk — цикл 1.333 s, горизонтальный ход стопы 0.88 м → естественная
  скорость 0.66 м/с; Run — 0.800 s / 1.039 м → 1.30 м/с. Старые константные
  scales (1.05/1.45×) при скоростях тела 4/7.2 м/с давали скольжение ~8× на
  шаге и ~3.7× на беге.
- Новый контракт `resolveLocomotionClipState`: timeScale = hSpeed ÷
  естественная скорость клипа (константы WALK_CLIP_NATURAL_MPS/RUN_CLIP_
  NATURAL_MPS + resolveGaitTimeScale с клампами [0.9..9]/[1.2..7]) — ноги
  фазово сцеплены с землёй на всём диапазоне walk→run, включая присед
  (1.8 м/с → 2.73×) и блок (2.5 м/с → 3.79×). Скорости движения НЕ тронуты
  (баланс/стамина/AI не изменились). Тест «timeScales constant» переписан
  под гейт-матчинг.
- NPC: патрульный Walk получает timeScale 1.2/0.66 ≈ 1.82
  (useNpcLocomotionBlend); толпа AmbientSkinnedMidLod — 0.5/0.66 ≈ 0.76,
  скорость блуждания вынесена в константу AMBIENT_WANDER_MPS (единый
  источник истины для mover и анимации).

### fix(anim): расписание-позы и sway
- Bind-эффект NPC-локомоции игнорировал смену clipOverrides (deps `[actions]`):
  overrides `{idle:'sleeping'}`/`{sit:'sitting'}`/идл-варианты эмоций не
  применялись, пока не менялся сам actions — NPC «спали стоя». В bindKey
  добавлен контент-ключ оверрайдов (сортированные `k=v`, стабилен к churn
  identity).
- `applySway` (процедурные слои) писал абсолютный `root.rotation.x` в
  fit-группу GltfNPCModel: для Z-up GLB (fit.rotX = −π/2) запись 0.004 рад
  укладывала NPC на землю. rotation.x из sway убран (rotation.z/position.x
  с нулевой базой безопасны).
- Мелочи: удалён мёртвый self-assignment `scratch.groundY` (playerMainMovement);
  `setCurrentEmotion` вынесен из useMemo в useEffect (render-phase setState
  был React-антипаттерном).

### fix(assets): ambient-толпа выпадала из прод-деплоя (чёрный экран на high/ultra)
- `AmbientSkinnedMidLod` грузит 8 стейдж-ригов `_rigs/*.glb`, а keep-set
  prune-deploy-assets собирался из `getNpcModelUrls()`, где только 6 ригов —
  `male_03/male_05/female_03.glb` есть в dev, но выпиливались из dist → 404
  → неперехваченный rejection Suspense (fallback={null}, без ErrorBoundary)
  → bubbling в Canvas3DErrorBoundary → чёрный канвас + «Ошибка 3D-движка»
  при maxSkinned=8 (high/ultra).
- Фикс: канонический пул `AMBIENT_SKINNED_RIG_POOL` + `getAmbientSkinnedRigUrls()`
  в quaterniusRigCatalog (компонент импортирует из каталога — один источник
  истины); prune-deploy-assets добавил пул в keep-set (161 путь вместо 114,
  stripped 27 файлов вместо 30); verify-deploy-assets верифицирует пул
  (117 путей) — дрейф реестра теперь роняет сборку, а не прод.
- Деградация вместо падения: каждая фигура толпы обёрнута в ErrorBoundary
  (fallback null) — отказ одного GLB убирает одного прохожего, а не канвас.
- SW: `volodka-media-v3` → `volodka-media-v4` — cache-first кэш моделей больше
  не переживает смену keep-set (возврат к старым байтам после регенераций
  ассетов теперь исключён бампом версии).

### fix(textures): тайлинг PolyHaven «плавал» — мутация SHARED-текстур
- `usePolyHavenPbr` конфигурировал repeat/wrap/anisotropy ПРЯМО на текстурах
  из кэша drei useTexture (один инстанс на URL на сессию). Среди ~60 call-site'ов
  с разными repeatScale для одного материала последний сработавший layout-
  эффект решал тайлинг ВСЕХ поверхностей этого материала — тайлинг «случайно»
  менялся между сценами/переключениями качества; в AuthoredInteriorShell
  стена (1×) и потолок (0.9×) одного материала дрались за один инстанс.
- Фикс: конфигурируются КЛОНЫ (Texture.clone() в three ≥r151 шарит Source —
  одна GPU-загрузка, ноль лишней VRAM), repeat применяется пер-материально
  через UV-transform uniform → независимый тайлинг у каждого потребителя без
  размножения видеопамяти.

### fix(pipeline): KTX2-гонка закрыта до этапа 133
- `configureGltfPipeline` теперь сам стартует динамический импорт KTX2Loader
  (рендерер уже закэширован) — раньше импорт стартовал только из
  extendGltfLoader первого useGLTF, а модуль-скоуп preload'ы (CesiumPlayerModel,
  FirstPersonHands, AmbientSkinnedMidLod) выполнялись ДО Canvas-инициализации,
  `cachedRenderer === null` → ensure возвращал null. Первый basisu-GLB,
  распарсенный до резолва импорта, бросил бы «setKTX2Loader must be called
  before loading KTX2 textures» — GLTFLoader НЕ фолбэкается на PNG молча
  (комментарий в gltfPipeline исправлен). Сегодня в репо 0 basisu-GLB, но
  новый порядок пассов v4.32 (draco = draco(etc1s(lod0))) делает это живой
  миной при первой регенерации.

### Инвентаризация v4.32.0 — поправка фактов
- Побайтовый скан всех 149 GLB public/models + 47 assets-source: 0-байтовых
  изображений НЕТ. «Заглушки» из инвентаризации v4.32.0 — крошечные
  палитровые текстуры Kit-дизайна (32×4/64×4/256×4 PNG, 116–155 B);
  интерьеры несут 512×512 колоркарту ~12 KB (не «12K»); полностью без
  текстур — только 8 сгенерированных пропсов (baseColorFactor by design).
  Раздел v4.32.0 в этом файле поправлен, чтобы будущие аудиты не искали
  фантомный дефект.

## v4.32.0 — этап 124 закрыт: тулчейн KTX2, фикс порядка пассов ETC1S/Draco

### Тулчейн KTX2 (блокер-тулинг устранён)
- Установлен KTX-Software 4.4.2 — унифицированный `ktx` CLI. Актуальный
  синтаксис: `ktx create --format <VkFormat> --encode basis-lz
  --generate-mipmap in.png out.ktx2` (legacy-форма `toktx --t2 --bcmp
  out.ktx2 in.png` заменена; VkFormat для цветовых карт — R8G8B8A8_SRGB).
- @gltf-transform/cli 4.4.1 (pinned) внутри `etc1s`/`uastc`-команд спавнит
  именно `ktx create` и требует KTX-Software >= 4.3.0 — зонд
  `command -v ktx` в gltfProcess.mjs корректен, вызовы пайплайна не менялись.
- Runtime-часть без изменений (готова с v4.27): KTX2Loader через dynamic
  import (транскодер ~571KB JS+WASM — вне основного бандла, грузится только
  при GLB с KHR_texture_basisu), setTranscoderPath('/basis/'),
  detectSupport(renderer).

### Питфолл: etc1s декодирует Draco
- Команда `gltf-transform etc1s` при чтении GLB декодирует
  KHR_draco_mesh_compression (in-memory геометрия всегда несжатая) и пишет
  результат БЕЗ возврата Draco. Прежний порядок пассов (ETC1S поверх
  уже-draco-варианта, шаг «3b» заменял файл) молча лишил бы draco-варианты
  сжатия геометрии — на тестовом интерьере геометрия раздувалась
  13.9 → 19.2 KB ещё и без выигрыша по текстуре.
- Исправлено: ETC1S выполняется по оптимизированной lod0-базе ДО Draco
  (copy → optimize → etc1s → draco → meshopt → LOD); draco-вариант
  собирается из etc1s-копии и несёт оба сжатия (KHR_texture_basisu +
  KHR_draco_mesh_compression — проверено end-to-end парсингом JSON-чанка).
  Фолбэк без `ktx` — прежний Draco-only (non-fatal, предупреждение расширено
  подсказкой установки 4.3+). Skinned-LOD1/LOD2 (resize через sharp) и
  meshopt-вариант сознательно остаются на lod0 с PNG-текстурами: sharp не
  читает KTX2, а ultra-тир по решению этапа 123/124 не использует KTX2.

### Инвентаризация текстур и решение не регенерировать ассеты
- Парсинг JSON-чанков всех 31 draco-вариантов public/models: ~0.1 MB
  встроенных текстур суммарно. **Поправка v4.33.0**: первичная формулировка
  («19 NPC/героя/пропсов — изображение-заглушка 0 байт») была ошибочной —
  побайтовый скан всех 149 GLB показал, что 0-байтовых изображений нет: у
  NPC/героя/пропсов — крошечные ПАЛИТРОВЫЕ текстуры 32×4/64×4/256×4 PNG
  (116–155 B, Kit-дизайн Quaternius/ai3dgen: плоские цвета деталей + вертексные
  цвета + tint рантайма); у 10 интерьеров — 512×512 колоркарта ~12 KB
  (12 KB, а не «12K»). «Совсем без текстур» только 8 сгенерированных пропсов
  (desk/bed/door/window/wardrobe/terminal/bookshelf/door_open — чистые
  baseColorFactor). На таких крошечных текстурах ETC1S РАСТЁТ
  (11 784 B PNG → 16 440 B KTX2: mip-цепочка + блочный оверхед) — сжатие
  оправдано только для крупных фото-подобных текстур.
- Интерьеры в ASSET_MANIFEST шипят lod0-`.glb` (maxDistance: 0) — их
  draco-варианты не входят в keep-set prune: регенерация не дала бы ни
  выигрыша деплоя, ни честного «расширения манифеста» (URL-ы не меняются —
  KTX2 встроенный). Полная регенерация каталога вдобавок воскресила бы
  pruned meshopt-файлы (осиротевшие после этапов 123/v4.30).
- Реальный вес текстур — внешние файлы: PolyHaven карты (public/textures,
  14 MB) и HDRI (13 MB). Их перевод в KTX2 требует подмены загрузчика и
  политики кодирования по типу карты (для нормал-карт — UASTC: ETC1S даёт
  артефакты на нормалях) и вынесен в открытый этап 133 ROADMAP с обязательной
  браузерной QA.

## v4.31.0 — контентный слой QTE: событийные триггеры (хак-гейт + финишер), мобильная адаптация оверлея

### Событийные триггеры QTE (`engine/qte/qteTriggers.ts`)
- Подсистема QTE v4.30 до этой волны была dormant (эмитили только тесты).
  Контентный слой — маунт-компонент `QuickTimeEventTriggers`
  (null-рендер, паттерн PoemRevealHost) рядом с хостом в
  GameplaySharedEffects: навешивает слушатели, анмаунт снимает и чистит
  контексты.
- **Хак-гейт терминалов** — декларативное поле `TriggerZone.linkedQte`
  (eventType/duration/difficulty; типы — type-only импорт из engine/qte,
  прецедент: cutscenes.ts → engine/events). `InteractionController.
  triggerLinkedContent` маршрутизирует `linkedMinigame` через
  `startQteMinigameGate`: есть linkedQte и экран свободен → QTE
  «стабилизация канала» (клавиша E) перед терминалом; поля нет/экран занят →
  миниигра сразу (поведение байт-в-байт прежнее). Успех — +2 XP, провал —
  glitch-fx и уведомление, взлом НЕ блокируется (graceful degradation —
  без soft-lock квестовых зон). Данные: 4 терминала (room_terminal —
  обучающий easy 3000 мс; office_openstack_terminal — normal 2400;
  cafe_backroom_terminal — hold 3200; basement_entry_terminal — hard 1900).
- **Двухфазная оркестрация** (устраняет наложение модалок): `qte:resolve`
  даёт награды/помехи, а миниигра открывается на новом событии
  **`qte:closed`** — хост эмитит его, когда оверлей полностью ушёл
  (cancelled — сразу, остальные — после экрана результата 1600 мс).
  Контексты сессий — дискриминированное объединение hack_gate|finisher в
  Map с FIFO-капом 16; чистятся на closed (повторный closed — no-op).
- **Финишер-усилитель** — слушатель `combat:creep_finished`: с шансом 0.65
  и кулдауном 25 с запускает бонусный QTE «фиксация протокола» (пробел,
  2400 мс, normal); успех — +3 XP и karma-уведомление. Кулдаун
  инициализируется в «прошлое» (−25000 мс): при нуле первое добивание
  первых 25 секунд страницы молча блокировалось бы (performance.now()
  мал на старте) — баг вскрыт тестом.
- Двойной гейт занятости экрана триггера и хоста синхронны (один тик
  EventBus): активный QTE/экран результата держат локомоция-гейт →
  хост физически не может отбросить start триггера.

### Мобильная адаптация QTE-оверлея (стиль)
- `useMobileDetection` в оверлее: TOUCH_SIZES (кольцо 160→124, клавиша
  80→64, трейл 48→40) — QTE гарантированно влезает в узкие экраны и не
  перекрывает мобильный HUD; hold-полоса 40→32.
- Safe-area-пады корня оверлея (env(safe-area-inset-*)): контент не уходит
  под вырез/жест-зоны нотч-устройств.
- Экранная кнопка отмены для тача (44px тач-таргет, safe-area-отступ,
  onPointerDown-stopPropagation — тап не считается вводом QTE), подсказка
  «Крестик — отмена» вместо «Esc — отмена».

## v4.30.0 — подсистема QTE (запуск), i18n волна 4, HUD-детали стиля

### QTE-подсистема: домен + хост + локомоция-гейт (новая фича)
- **Типы** (`engine/qte/qteTypes.ts`): нейтральный источник типов
  QTEEventType/QTEKeyBinding/QTEDifficulty/QTEResult/QTEFinalResult —
  и EventBus-домен, и React-оверлей зависят от engine (компонент → engine,
  циклов нет). Оверлей ре-экспортирует типы для совместимости.
- **EventBus-домен** (`engine/events/qteEvents.ts`): `qte:start`
  (id/eventType/keyBindings/duration/difficulty/targetPresses/context) и
  `qte:resolve` (id/result) — домен `qte` влит в EventMap/EVENT_DOMAINS.
  Контракт: ровно один resolve на принятый start.
- **Хост** (`hud/parts/QuickTimeEventHost.tsx`, паттерн PoemRevealHost —
  always-mounted listener, единственная точка монтирования в
  GameplaySharedEffects): гейт занятости экрана — qte:start молча
  отбрасывается при isGameplayOverlayLocomotionLocked() (диалог/кат-сцена/
  миниигра/осмотр/панели) или активном QTE (дедуп); qte:resolve эмитится
  сразу по итогу, экран результата держится 1600 мс (cancelled — закрытие
  сразу); звук qte:* → выделенные пресеты qte_* (sfxPresets.ts: +6
  процедурных осцилляторов) через audioEngine.playSfx.
- **Локомоция-гейт** (`engine/player/playerLocomotionGate.ts`):
  +setQteLocomotionGate в isGameplayOverlayLocomotionLocked — модальный QTE
  замораживает WASD/прыжок/взаимодействие (keyboardInputState держит свой
  window-keydown; stopPropagation соседей не изолирует — гейт единственное
  надёжное решение). Снимается на resolve/unmount (cleanup-эффект).

### QuickTimeEventOverlay: переработка ядра (P0 из аудита сироты)
- **Таймер**: setInterval(16 мс) + setState каждый тик (60 ре-рендеров/с) →
  тик 100 мс (10 Гц); кольцо сглаживается framer-переходом
  (transition = тик). Рендеры поддерева: 60/с → ≤10/с.
- **Ввод**: window-keydown перерегистрировался на каждый инпут (deps
  handleInput/state.*) → одна регистрация keydown+keyup на сессию; значения —
  через refs-зеркала (stateRef/latestRef/inputRef/cancelRef/resolveRef);
  быстрые нажатия между рендерами не теряются (синхронное зеркалирование
  stateRef перед setState).
- **Сессия**: сброс только по isActive-переходу (deps [isActive, stopTimer]) —
  инлайн-массив keyBindings/инлайн-коллбеки больше не перезапускают сессию
  (прежний QTE не доходил до конца при нестабильных пропсах).
- **hold**: прогресс по OS-автоповтору (+0.02/keydown) → keydown/keyup-пара +
  тик-накопление (HOLD_FILL_MS/speedMult, работает на таче); успех по уже
  вычисленному значению (stale-check читал состояние ДО обновления).
- **mash**: e.repeat игнорируется; кольцо pressCount/(pressCount+10) →
  pressCount/targetPresses. **press**: семантика окна/near-miss сохранена
  байт-в-байт (windowStart = adjusted·(1−windowSize), near-miss ≥ 70 % окна).
- **Доступность/мобильность**: тап по центру = нажатие, удержание пальцем =
  hold (pointerdown/up/cancel/leave, touch-none); Escape → onFailure('
  cancelled') без экрана результата (тип QTEFinalResult — «pending»/
  «cancelled» разделены); aria-live="assertive" на результате; подсказка
  «Esc — отмена»; pointer-events-auto на корне (внутрь pointer-events-none
  HUD-родителя ввод умирает).

### i18n: волна 4 этапа 115 (финализация каталога)
- 35 динамических вызовов в 10 файлах + 11 вызовов волн 1–2 (toast-билдеры,
  aria PlayerStatusFrame) = 46 вызовов переведены на литеральные ключи
  каталога-шаблонов t('hud.*', fallback, params) — карты ключей-констант
  (HUD_DYNAMIC_KEYS и пр.) удалены по всему src; вывод байт-в-байт прежний.
- Контракт-тест ru.hudCoverage: порог 60 → ≥220 (фактически 229 ключа);
  it3 +14 assert-ов; шаблоны покрываются автоматически (ключ — литерал).
  Вне контракта — только ключи-переменные из типизированных union
  (minimap.zoom.*, ambient.*, dayNight.phase.* и т.п.).

### HUD-детали стиля (словарь волн v4.27–v4.29)
- **StaminaBar**: пороговая насечка 25 % (stamina-bar--low: риска краснеет и
  пульсирует, fill — красное свечение; DOM-ref classList, без ре-рендеров;
  reduced-motion — статичная риска).
- **HUDNotificationFeed**: TTL-hairline 2px по нижнему краю карточки
  (scaleX 1→0 за 5 с жизни; reduced-motion — статичная).
- **SceneContextChip**: акцент типа сцены (outdoor→cyan, indoor→matrix,
  underground→amber, dream→violet; иконка/рамка/свечение/разделители) +
  одноразовый вспых-пульс значений NPC:/EX: (remount по key=value, паттерн
  StatPulse); в tokens.css добавлен --cyber-violet-rgb.
- **EnvironmentMoodIndicator**: шторм (intensity ≥ 0.8) — пульс иконки,
  красная рамка контейнера, тень лейбла (паттерн HazardStatusIndicator).

### Ассеты: −13 MB мёртвого груза в репозитории
- 31 файл *.meshopt.glb удалён (public/models/**): этап 123 исключил
  meshopt-варианты из манифеста/keep-set, prune вырезал их из dist, файлы же
  оставались в репо. rg-проверка: ни одного референса на пути .meshopt.glb в
  src/scripts/api (gltfProcess.mjs умеет генерировать их заново). Деплой-
  инварианты не изменились: verify:deploy 114 путей, budgets OK.

**Тесты +17 (2710)**: QuickTimeEventOverlay.test.tsx (12: все 4 типа событий,
Escape-cancelled, однократная регистрация keydown, стабильность сессии при
смене identity пропсов, чистка таймеров, pointer-ввод) и
QuickTimeEventHost.test.tsx (5: старт/гейт занятости, дедуп start,
qte:resolve 1:1, симметрия локомоция-гейта, cancelled-путь).

## v4.29.0 — этап 98: персистентный EffectComposer (нулевые ремaунты на смене сцен)

### Механика (ExplorationPostFX, этап 98 — закрыт)
- **Дети композера** — useMemo по structuralKey (`lite|full : preset.id :
  selectedPreset : visualLite : coarsePointer : reducedMotion : agx :
  godrays-ready : vignetteEnabled`). Смена сцены в ключ не входит → React
  memo бандл EffectComposer'а не перерисовывается вообще, EffectPass'ы не
  пересоздаются, шейдеры не перекомпилируются. Props всех пассов —
  константы: обёртки @react-three/postprocessing мемоизируют args через
  JSON.stringify — любое изменение props пересоздало бы инстанс эффекта.
- **Аплаер** (`engine/graphics/applyScenePostFx.ts`, без React): на
  монтировании + на `scene:transition_start` (targetSceneId — событие идёт
  ДО записи сцены в стор, т.е. под визиром SceneTransitionVeil) + на смену
  настроек. Пишет сеттеры postprocessing 6.39: Bloom.intensity +
  luminanceMaterial.threshold/smoothing, Vignette.offset/darkness/eskil,
  HueSaturation.hue/saturation, BrightnessContrast.brightness/contrast,
  ChromaticAberration (uniform offset мутируется на месте), ToneMapping.mode.
- **Профили** (`engine/graphics/scenePostFxProfiles.ts`): SCENE_*-таблицы
  переехали из ExplorationPostFX; `resolveScenePostFxProfile` — чистый,
  замороженный результат; фолбэки derived-сцен (resolveDerivedSceneId)
  байт-в-байт прежние. GODRAYS_SUN_CONFIG/GODRAYS_POST_SCENES тоже здесь
  (компонент → engine, циклов нет).
- **N8AO** — пасс смонтирован всегда на full-структуре; пер-сценное
  вкл/выкл — pass.enabled + Proxy-конфигурация n8ao
  (configuration.aoRadius/intensity/color) — реконструкция тяжёлых SSAO-
  шейдеров исключена. **Scanline/Noise** — blendMode.opacity (константы
  density/premultiply). **SMAA** — structural mount + защитный pass.enabled
  (если пасс слит с соседями — не трогается, эквивалент прежнего поведения).
- **LUT** — пасс живёт постоянно; нейтральная identity-текстура
  (`getNeutralProceduralLut3DTexture`, 16³ RGBA UnsignedByte — формат
  процедурных LUT) для сцен без LUT; пер-сценная подмена — `effect.lut =
  tex`: сеттер только ставит uniform (+ define лишь для float-типов) —
  перекомпиляции нет.
- **GodRays** — персистентный sun mesh вне детей композера
  (GodRaysSunMesh): позиция/цвет/visible — императивно по sceneId в
  layout-эффекте (GodRaysEffect переносит меш в свой lightScene, JSX-props
  позиции убраны). Пер-сценное вкл/выкл — точечный pass.enabled
  (`setEffectPassEnabled` находит EffectPass по инстансу эффекта; пассы с
  2+ эффектами защитно пропускаются). Гейт godRaysSunReady (защита от
  null-sun в конструкторе GodRaysEffect) сохранён.
- **Покадровый тик** (один useFrameTick('postfx')): DOF bokehScale 0↔target
  (диалог/кат-сцена), GodRays opacity 0↔0.55, стресс/энергия/поэм-буст для
  bloom.intensity и виньетки, хроматика (база + стресс-рампа на high).
  Виталы читаются `useGameStore.getState()` — ноль store-подписок на рендер
  у пайплайна (у/postfx перестаёт ре-рендериться на виталах). Soft-budget
  (isSoftWorkAffordable) — гейты N8AO/GodRays/хроматики, переключение
  только при изменении.
- **Композер**: pipelineKey удалён; key = glInstanceKey (ремaунт только при
  смене renderer'а/context restore); dispose — на unmount и webglcontextlost.
  Инвариант postfxActive (CanvasGuardSystem) не тронут. MotionBlurEffect —
  без пропов: cutscene/dialogue-гейт читается из стора в тике.
- **Задокументированный no-op**: ToneMappingEffect (postprocessing 6.39) не
  имеет exposure — проп `exposure` у <ToneMapping> исторически ничего не
  делал; поведение сохранено, SCENE_TONE_EXPOSURE — в профиле документации.
- **Тесты** (+27): scenePostFxProfiles.test.ts (точные значения таблиц,
  дефолты, фолбэки наследников, фриз, godRays/LUT-реестры);
  applyScenePostFx.test.ts (формулы хелперов, lite-parity, гашение
  сканлайнов/зерна, LUT-swap, pass.enabled, защита слитых пассов).

## v4.28.0 — бандлы хотбара/миникарты (этап 100 закрыт), i18n волна 3, HUD-детали

### Точечные подписки: бандлы хотбара и миникарты (этап 100, волна 2 — закрыт)
- `selectQuickUseHotbarState`/`useQuickUseHotbarState` (hudSelectors) — общий
  shallow-бандл QuickUseBar и MobileActionButtons: фаза (selectGamePhase —
  вычисляемая, импорт из uiSelectors без цикла) + inventory + hotbarSlots +
  онбординг-гейт (level, mainPoemCount = countCollectedMainPoems(s.collectedPoems)
  — число в селекторе, контракт ссылочной стабильности не нарушает). У каждого
  из двух виджетов было 6 подписок — стало 1.
- `selectMinimapHudState`/`useMinimapHudState` — MinimapComponent: 4 подписки →
  1 (gamePhase + miniMapState + npcRelations + quests). ВАЖНО: селектор возвращает
  СЫРОЙ quests; фильтр `status === 'active'` — useMemo в компоненте. Фильтр внутри
  plain-селектора создавал бы новый массив на каждый вызов и нарушил бы контракт
  ссылочной стабильности (hudSelectors.test.ts).
- `useMiniMapState` (explorationSelectors): удалено мёртвое playerRotation —
  поле не деструктурировал никто, но стор пишет его на телепортах/кинематике,
  зря будя MinimapComponent и SceneContextChip (shallow-сравнение по 4 полям).
- CompassHUD: raw `useGameStore((s) => s.exploration.currentSceneId)` →
  `useCurrentSceneId()`; импорт useGameStore убран.
- Контракт-тест: оба селектора в shallow-списке; мок makeState дополнен
  срезом фаз (mainMenuOpen/introActive/combatActive/activeCutsceneId) и
  хотбара — selectGamePhase в моке возвращает 'exploration'.

### i18n волна 3: +109 ключей каталога, дедуп дублированных таблиц
- Группы: hud.weather.* (13), hud.dayNight.* (7, включая дедуп дубля
  phaseRuLabel в DayNightCycleIndicator — aria и видимый текст из одного
  PHASE_CONFIG.labelKey), hud.compass.* (17: буквы направлений + полные
  названия для aria + шаблон «Компас: направление {dir}»), hud.minimap.* (12,
  включая {n} м и labelKey уровней масштаба в minimapZoomSetting), hud.quickUse.*
  (10: шаблоны {slot}/{item}/{effects}; эффекты энергии/стресса/кармы
  переиспользуют hud.toast.*), hud.mobileActions.* (22), hud.guide.* (31 —
  все строки INNER_VOICE_LINES; матчер payload-события «осмотр» сознательно
  остался в коде — это не отображаемый текст).
- Механика: t(key, fallback, params?) волны 2; фолбэки байт-в-байт — видимый
  вывод не изменился; репрезентативные byte-проверки в ru.hudCoverage.test.ts.
- **Fix попутный:** тост хотбара показывал сырой ключ навыка («writing +2»).
  Теперь `t('hud.skill.name.' + e.skill, e.skill)` — «Письмо +2» (та же схема,
  что в notificationToastConstants; неизвестный ключ деградирует в сам ключ).

### HUD-детали (стиль/обратная связь)
- MinimapComponent: для прижатых к ободу квест-маркеров рисуется дистанция
  (ctx.fillText, monospace 7–8px, цвет маркера, радиус innerR−14) — цель в
  другой сцене/за краем читается с «далеко ли идти»; кнопкам масштаба и
  «таблетке» — hover/active/focus-visible отклики (Tailwind-классы поверх
  inline-стилей).
- DayNightCycleIndicator: полоса прогресса фазы (aria-hidden, цвет — градиент
  следующей фазы; progress = 1 − hoursUntil/длительность фазы, длительности
  зеркалят PHASE_RANGES) + svg-метки 06/12/21 на дуге (fontSize 6, fill
  slate 0.55).
- QuickUseBar: янтарная пульс-точка «последний предмет» (quantity === 1);
  reduced-motion — статичный span.
- WeatherIndicator: пульс иконки при strong-ветре, дыхание точки при smoggy;
  reduced-motion — статично.
- hud-mobile-responsive.css: transform в transition-список .mobile-action-btn
  (плавное нажатие 0.12s) и первый :focus-visible outline (доступность).

### Этап 98 (persistent EffectComposer): план зафиксирован в ROADMAP
- Композер в приложении один — ExplorationPostFX (ManagedEffectComposer,
  ключ `${glInstanceKey}-${pipelineKey}`); stall переходов создаёт pipelineKey
  (sceneId + lite|ao|full + smaa) — при смене сцены пересобираются все пассы
  (8–10 шейдерных компиляций, 250–2000мс).
- Решение (для отдельного раунда): фиксированный суперсед пассов, вариации —
  императивно (pass.enabled, uniforms, LUT-swap через кэш текстур); ключ →
  glInstanceKey; профили сцен — чистая resolveScenePostFxProfile + unit-тесты;
  применение по scene:transition_start (до первой отрисовки новой сцены, под
  визиром SceneTransitionVeil). Инвариант CanvasGuardSystem сохраняется:
  postfxActive = «композер смонтирован И tonemap-пасс включён»; при
  isPostProcessingEnabled=false композер по-прежнему не монтируется вовсе.
- Риски: prop-churn wrapEffect (пассы — только статичные пропсы на маунте),
  персистентный GodRays sun mesh (позиция из GODRAYS_SUN_CONFIG по сцене,
  отсутствие конфига → pass.enabled=false), SMAA-премаунт (сменить SMAAPreset —
  допустимый единичный ремадаунт), порядок кадров priority=1 → pre_render(500)
  (1-кадровая латентность униформ — вне скоупа, не менять).

## v4.27.0 — точечные подписки HUD, ultra→draco, плейсхолдеры i18n, насечки баров

### Точечные подписки HUD: снос последнего широкого бандла (этап 100, волна 1)
- Инвентаризация уточнила постановку: «голых» `useGameStore()` без селектора
  в src/ — 0 (миграция шла волнами v4.24–v4.26); последним широким бандлом
  оставался 12-полевой `useHUDControllerState` (hudSelectors) — shallow-объект
  «погода + виталы + прогресс + collectedPoems», из-за которого memo-виджеты
  (SceneTopBarHud) и лёгкие оверлеи перерисовывались на нерелевантные поля.
- Бандл удалён; каждый потребитель получает свой срез через существующие
  доменные хуки: SceneTopBarHud → `useProgressionSummary`, HUDChromaticEdge →
  `useScreenEffectsVitals`, RainScreenEffect/SceneAmbientVignette →
  `useHUDExploration`, useContextualHints → `useVitalStats` +
  `useCurrentSceneId`; корень useHUDController → три узкие подписки (все
  нужные ему поля сохранены, мёртвое `collectedPoems` исключено).
- Локальные shallow-бандлы: `useAmbientOverlayState` (HudAmbientOverlay),
  `useAtmosphereCaptionState` (AmbientAtmosphereCaption, 5 подписок → 1),
  `useStatsDashboardState` (GameStatsDashboard, 6 → 1) — все с plain-селекторами
  (экспорт select* для тестов), объектные поля приходят из стора ссылками.
- Контракт-тест `hudSelectors.test.ts`: (1) скан src/ — имя удалённого бандла
  не встречается; (2) shallow-стабильность и ссылочная стабильность объектных
  полей новых селекторов (регрессия React #185).

### Ассеты: ultra→draco, meshopt-варианты вне манифеста (этап 123)
- Схема выбора compression: пресет → `resolveAssetUrl`/`resolveNpcAssetUrl` →
  `asset.variants[compression]`. Пока ultra выбирал 'meshopt', 19 NPC-вариантов
  `.meshopt.glb` (11.47 MiB) гарантированно попадали в keep-set prune.
- Решение: ultra → `'draco'`. Draco-пары есть на диске для всех 19 NPC,
  героя (volodka_lod0.draco.glb) и кафе-пропсов; LOD1/LOD2 NPC уже draco
  (v4.7.1), декодер `/draco/gltf/` в PRESERVED_PREFIXES — клиентских правок нет.
- Из `npcCharacterAsset`/`player_volodka`/`env_cafe_props` удалён ключ
  `meshopt` (тип `Partial<Record<CompressionPreference,…>>` допускает) →
  prune (build:vercel) больше не кладёт 21 файл (12.85 MiB) в дист;
  verify:deploy не требует их (манифест без ключей). Итог: dist 97.1 MB.
- Инвариант: «none»-GLB содержат EXT_meshopt — MeshoptDecoder подключается
  безусловно (gltfPipeline.extendGltfLoader), не удалять.
- Риск задокументирован: per-variant disk-гарда нет — если draco-файл удалить
  с диска, не убрав из манифеста, verify:deploy поймает только при сборке.

### i18n: плейсхолдеры в t() (этап 115, волна 2)
- Сигнатура: `t(key, fallback, params?)`; шаблон = каталог ?? фолбэк;
  интерполяция `\{([A-Za-z_][A-Za-z0-9_]*)\}` → String(params[name]);
  неизвестные параметры остаются литералом; без params поведение прежнее
  (волна 1) — одиночные/некорректные скобки не трогаются.
- Волна 1 workaround («динамические ключи вне каталога») больше не нужен
  для переведённых мест: 8 toast-ключей + 3 aria-ключа PlayerStatusFrame —
  шаблоны в RU_MESSAGES (`{delta}`, `{name}`, `{n}`, `{title}`, `{rewards}`,
  `{type}`, `{message}`, `{karma}`, `{tier}`); фолбэки байт-в-байт —
  видимый вывод не изменился. Остальные динамические ключи (12 файлов) могут
  мигрировать той же механикой в следующих волнах.
- Тесты: index.test.ts (+6: каталог/фолбэк/числа/неизвестные/совместимость/
  скобки).

### HUD-детали: пороговые насечки витальных баров
- BarRow (PlayerStatusFrame) получил `threshold`/`thresholdActive`:
  риска 2px на позиции порога (`HUD_ENERGY_LOW_THRESHOLD`/`HUD_STRESS_HIGH_THRESHOLD`
  — единый источник hudThresholds), бледно-белая при запасе; при пересечении —
  красная + мягкая пульсация (framer-motion opacity), reduced-motion — без
  пульсации. Анимации не вмешиваются в layout бара (absolute, pointer-events-none).

### Этап 124 (KTX2): блокер-тулинг
- Клиент готов (KTX2Loader + `/basis/` + detectSupport, PRESERVED_PREFIXES),
  ассетов нет: энкодер toktx/KTX-Software недоступен в среде; gltfProcess.mjs
  зондирует `ktx` и пропускает ETC1S-пасс. Этап остаётся открытым до тула.

## v4.26.0 — фаза 7 закрыта: диалоги, i18n HUD, терминология, CI-бюджеты, WebP

### Возвратные реплики новых NPC (этап 114)
- Паттерн «возвратная реплика» = conditional choice в уже достижимом
  greeting/return-узле диалога (`condition: { flag, missingFlag }`,
  `next` → мини-узел с эффектами `setFlag`-гарда + npcChange/addKarma).
  Регистрация новых узлов не нужна — они живут внутри зарегистрированных
  паков `chk`/`expanded` (паритет и достижимость проверяются тестами).
- Закрыты нарративные хвосты: Ритка (`chk_ritka_fourth_voice_echo`, выбор
  доступен и в `chk_ritka_pier_return`), Трофим (`trofim_echo_afterword`),
  Баба Зина (`baba_zina_box_afterword` — согласовано с «Сама приду» Марины),
  Марат-эхо (`marat_echo_server_afterword`, маркер завершения — флаг
  `pv_server_block_raised`, тот же, что у гейта четвёртого голоса).

### Локализация HUD: t(key, fallback) (этап 115)
- Инфраструктура `src/i18n` расширена секцией `/* HUD */` в
  `messages/ru.ts` (113 статических ключей `hud.*`).
- Контракт волны: фолбэк байт-в-байт равен прежнему литералу → вывод не
  меняется, все текстовые тесты зелёные без правок.
- Динамические (составленные) строки: `t(HUD_DYNAMIC_KEYS.x, \`шаблон ${v}\`)`
  — ключи-константы сознательно НЕ добавлены в каталог: статичная запись
  `RU_MESSAGES[key]` перебила бы интерполяцию (t возвращает каталог ?? фолбэк).
- Покрытие волны 1: PlayerStatusFrame, TopBarDataTicker, SceneContextChip,
  EnvironmentMoodIndicator, QuestObjectiveCard, ActiveQuestMiniTracker,
  HUDNotificationFeed, StaminaBar, EmergencyHelpButton, ExplorationHUD,
  SceneTopBarHud, QuickAccessToolbar, notificationToastConstants,
  notificationToastPresentation, karmaTier.
- Контракт-тест `ru.hudCoverage.test.ts`: скан всех `t('...')` по src/ —
  каждый ключ `hud.*` обязан быть в RU_MESSAGES (≥60), фолбэки совпадают.

### Терминология: инвариант и фиксы знака кармы (этап 116)
- Инвариант (подтверждён вычиткой): игрок — «Карма»; фракции — всегда
  «Репутация фракции»; «Стресс» — без синонимов.
- Фикс двойного знака: награда `addKarma: -15` (factory_secret_blueprint)
  рендерилась «Карма +-15». Исправлены questAcceptDialogConstants,
  QuestsPanel.humanizeRewardLabel, QuestObjectiveCard (знак + только для
  положительных). Регресс-тест в questAcceptDialogPresentation.test.ts.

### CI: бюджеты и деплой-верификация (этап 122)
- ci.yml: после build — `npm run budgets:check` и `npm run verify:deploy`
  (оба рассчитаны на plain build без prune; проверены локально).

### Ассеты: ночной план меню PNG → WebP (этап 125)
- `public/menu/cinematic_night_plate.webp` (q90, 170 576 B) вместо PNG
  (1 218 655 B) — −86% / −1.05 MB деплоя. Единственный потребитель —
  `POLYHAVEN_MENU_PLATE` (MenuBackgroundEffects).

### Находка этапа 123 (отложен)
- Посылка «исключить meshopt, если не выбран пресетами» частично неверна:
  пресет ultra выбирает `compression: 'meshopt'` → NPC-варианты meshopt
  (19 файлов ≈ 12.0 MB) выбираются. Исключение = перевод ultra на draco
  (решение о визуальном тире), отдельное окно.

## v4.25.0 — хвост фазы 6 (UI-clock, LCP, дедуп, GC) + фаза 7: «Эхо пирса»

### Единый UI-clock: императивный API (этап 104)
- useUiTick.ts: `onUiTick(periodMs, cb)` — та же механика, что и у реактивного
  хука (один интервал на частоту, авто-старт/авто-стоп, скрытая вкладка —
  тики пропущены, догоняющий бамп по visibilitychange), но для колбэков.
- Потребители: useWorldClock (60с), useCityNews (поллер 3,5 мин), 
  useWeatherEffects (1с + 10с, элапс-гард защищает от двойного применения
  после догоняющего бампа), useHudQuiet (1с).
- Инварианты: период ≤0 — no-op подписка (гард busy-loop);
  visibilitychange-листенер вешается один раз на модуль.

### Дедуп отложенных таймеров оркестратора (этап 107)
- shared/utils/keyedTimeoutScheduler.ts: KeyedTimeoutScheduler —
  schedule(key, fn, delay) с заменой незрелого таймера того же ключа;
  disposeAll() в cleanup-эффектах useGameLifecycleManager.
- Все отложенные задачи жизненного цикла имеют ключи: 'scene:banner',
  'thought:scene-entry-initial', 'thought:scene-entry:<sceneId>',
  'thought:combat:victory' и т.д. Быстрые серии одного события не
  складывают очередь эмиссий; после unmount хвосты не срабатывают.

### Кэши фасада без аллокаций (этап 108)
- storeBindings.ts: SliceRefsBuffer — мутабельный кортеж на 9 слайсов;
  collectSliceRefs заполняет его по месту, cachedSliceRefs — поэлементная
  копия. Кэш-попадание getCombinedGameState() не аллоцирует ничего.
- gameSnapshotCache.ts: ключ кэша на 44 поля — keyBuffer/cachedKeyBuffer
  (постоянные массивы), замороженные EMPTY_CHOICE_LOG/EMPTY_MORAL_CHOICES.
  Семантика — референсное сравнение по полям, как раньше.

### LCP-профилировщик (этап 106)
- engine/performance/lcpProfiler.ts: PerformanceObserver
  ('largest-contentful-paint', buffered: true); старт в main.tsx;
  тихое отключение там, где тип не поддерживается.
- LoadingTimeline: после first-scene-playable DEV-лог печатает LCP и тег
  крупнейшего элемента — сравнение с играбельной сценой диагностирует,
  «красился» ли стартовый экран дольше загрузки игры.

### Контент-пак «Эхо пирса» (этапы 111/112/113/117/118)
- Квест ep_pier_echo (акт 2): objectives npc_talked/location_visited/
  flag_set; активация через выбор в trofim_greeting (условие requiredAct 2,
  missingFlag ep_pier_echo_accepted) → story-нода ep_pier_echo_start
  (эффекты triggerQuest + setFlag) — стандартный путь достижимости
  (гивер с расписанием = корень BFS в questReachability).
- Пак 'pierEcho' зарегистрирован в трёх точках: buildStoryNodes (статика),
  narrativePackRegistry — тип + ленивый загрузчик + STANDALONE_STORY_
  SATELLITE_ORDER (паритет статик/рантайм — урок v4.8.9).
- Лор пака обнаруживается discoverLore-эффектами нод (не LORE_SCENE_MAP):
  discovery привязана к прогрессу квеста, а не к географии.
- Баланс: награды 55cr/4кармы/35XP — коридор тира акта 2; тест пака
  (pierEchoQuest.test.ts, 8 кейсов) фиксирует реестры, сцены, эффекты
  addItem/discoverLore, перекрёстные ссылки лора и коридор наград.

## v4.24.0 — фаза 6: перф-волна AI/физики/HUD (этапы 97–105)

### Дистанционный LOD AI-тика крипов (этап 97)
- Константы в чистом creepTactics.ts: CREEP_AI_LOD_FAR_M = 30 м,
  CREEP_AI_LOD_FAR_TICK_S = 0.1 с. Мирные состояния (patrol/return/
  cooldown) дальних крипов тикают на ~10 Гц с аккумуляцией delta
  (lodDeltaRef) — движение/таймеры/LOS/stuck точны по времени; между
  LOD-тиками пропускаются страйк-репорты, навигация, презентация.
- Инвариант: engaged/chase/зона замаха — всегда каждый кадр.
  Связка с HUD-подсказкой замаха: HINT_STALE_MS = 260 мс >
  LOD-период 100 мс, подсказка не протухает.

### Индексный курсор нав-путей (этап 103)
- Потребление путей крипов (returnPathRef/chasePathRef) — через
  курсоры (returnPathCursorRef/chasePathCursorRef) вместо path.shift():
  O(1) за тик, массив не мутируется; сброс курсора обязателен на любом
  присвоении/очистке пути (единый жизненный цикл).

### Выборочная интерполяция динамических физтел (этап 99)
- engine/physics/propSmoothing.ts: EMA-follower (α = 1 − exp(−rate·dt),
  PROP_SMOOTHING_RATE = 22) в фазе post_physics — после снапа
  трансформаций Rapier (порядок R3F-приоритетов: physics 0 →
  post_physics 100).
- Ограничение API: @react-three/rapier 2.2.0 не имеет per-body
  interpolate — глобальный флаг вернул бы лаг аватара за камерой
  (см. PhysicsSceneInner). Поэтому <Physics interpolate={false}>
  сохранён, а плавность получают ТОЛЬКО динамические пропсы
  (DynamicProps): визуальная группа внутри <RigidBody> ставится в
  сглаженную мировую точку через inv(matrixWorld) тела.
- Компромиссы: вращение не сглаживается; спящие тела и сдвиги
  > PROP_SMOOTHING_SNAP_M (0.5 м) снапаются; коллизии — по физтелам.

### Dirty-check расписания мировых часов (этап 101)
- syncWorldSchedule.ts: areNpcScheduleStatesEqual — value-сравнение
  карт {npcId → {position, sceneId}}. useWorldClock записывает
  setExplorationNPCStates только при фактическом изменении: типичный
  тик (60 с реального времени, 0.25 игровых часов) попадает в тот же
  слот расписания. События world:tick/world:hour_changed эмитятся
  всегда — потребители событий не задеты.

### O(1)-среднее DPR (этап 102)
- useDynamicDPR: инкрементальная сумма FPS (frameFpsSum): + на push,
  − на вытеснении (переполнение кольца и протухание по окну), сброс
  при реинициализации буфера. Оценочное окно больше не обходит буфер.

### Зафиксированные бюджеты (этап 105, check-bundle-budgets --report)
- boot 624.5/634.8 KB gzip (hard max), game-start 1326.6/1757.8 KB,
  кумулятив до первой сцены 1951.1 KB, ленивый ярус (Rapier)
  1565.4 KB, весь JS 3607.0 KB gzip, entry CSS 133.4 KB,
  WebGL-стек (three+r3f+drei) 270.1 KB ≈ 20% game-start.

## v4.23.0 — фаза 5 закрыта: полная слот-сетка, UI-clock, тесты-контракты

### Нижне-центральная цепочка — финальная модель
- Desktop (строго возрастает, шаг 58px): guidance 186 (высокая карточка
  режиссуры ~90px) → [E]-промпт 282 (поднят с 234 — реальное наложение
  с верхом карточки, найдено контрактом) → primary 340 → secondary 398 →
  tertiary 456 → guide 514 → alert 572.
- Мобильный: бюджет высоты жёсткий (поэзия 292 и тулбар 216 подняты
  hud-mobile-responsive.css, промпт 402–450): primary 352 — единственный
  ряд под промптом; guidance/secondary/tertiary/guide/alert делят один
  слот 460 над промптом. Принцип: детерминированный запрет конфликтов
  с ИНТЕРАКТИВОМ; наложения редких транзиентов — осознанный компромисс.
- Запрет хардкодов vh/px в fixed-позициях тостов — правило код-ревью;
  контракт hudLayoutSlots.test.ts ловит нарушения до деплоя.

### Правый нижний угол — четыре ряда
Миксер (16) → статусы (72) → помощь (116) → визуализатор (168,
bottomAudioVisualizerPx). На ≤768px визуализатор скрыт (av-panel,
display:none) — как и миксер: конфликт с поднятым рядом статусов.

### Общий UI-clock (hooks/useUiTick.ts)
- useUiTick(periodMs): useSyncExternalStore над модулем-тикером;
  один setInterval на частоту на всех подписчиков; автогашение при
  нуле подписчиков; пропуск тиков в document.hidden + догоняющий бамп
  на visibilitychange; periodMs=0 — подписки нет.
- Потребители: PoemJournalPanel (1с), usePoemCooldownSeconds (500мс,
  канонический в poetryBook), PoemsTab (локальный дубликат хука
  удалён). Пара с usePoemPowerCooldownTick (hudMountSelectors) —
  разные семантики (стеночный тик vs автостоп по кулдаунам).

### Тесты-контракты
- src/shared/lint/jsxNoLiteralNewline.test.ts — сканер всех .tsx на
  литеральные «\n» в JSX-позиции (вне строк, вне комментариев,
  эвристика строковых литералов по нечётности кавычек).
- src/shared/constants/hudLayoutSlots.test.ts — детектор коллизий
  слотов: правая колонка, нижний центр (desktop/mobile), правый угол.
  Инвариант: координаты постоянных виджетов — только из hudLayout.ts.
