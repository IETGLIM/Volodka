# ANALYSIS REPORT — Part 1: Configuration, Types, State, Bootstrap, Engine Core

**Project:** ВОЛОДЬКА — сказка о потерянных строках  
**Version:** 4.4.2  
**Date:** 2025-08-20  
**Scope:** Configuration, Data Models/Types, State Management, Entry Points/Bootstrap, Engine Core  
**Source Size:** 2,052 files (374 test), 21 MB, 87 CSS files

---

## 1. Project Configuration

### 1.1 Current State

**Build Toolchain:** Vite 6.3.5 + React 19 + Three.js 0.172.0 + TypeScript (dual: TS7 for typecheck, TS6 for build)

**Dependency Highlights:**
- **Rendering:** `@react-three/fiber` 9.6.1 + `@react-three/drei` 10.7.7 + `@react-three/postprocessing` 3.0.4
- **Physics:** `@dimforge/rapier3d-compat` 0.19.3 + `@react-three/rapier` 2.2.0
- **State:** `zustand` 5.0.6
- **UI:** Radix UI primitives, `framer-motion` 12, `lucide-react`, `sonner` toasts
- **Validation:** `zod` 4.0.2
- **Deployment:** `vite-plugin-singlefile` — entire app inlined into a single HTML file for Vercel SPA

**Scripts:** 53 npm scripts covering build, asset pipeline (16 asset scripts), testing (unit + e2e with Playwright), validation, bundle budget checks, and deployment.

**Vite Config (`vite.config.ts`):**
- ES2022 target, esbuild minification, no sourcemaps
- `chunkSizeWarningLimit: 15000` — very high (15MB), justified by singlefile inlining
- Rapier alias shim: `@dimforge/rapier3d-compat` → `src/engine/physics/rapierCompat.ts`
- Pre-bundles heavy deps: three, R3F, drei, rapier, zustand, framer-motion

**TypeScript Config (`tsconfig.json`):**
- Strict mode enabled, noUnusedLocals, noUnusedParameters
- Path alias `@/*` → `./src/*`
- Dual TS toolchain: `@typescript/native` (TS7) for typecheck, `@typescript/typescript6` (TS6) for Vite build
- No `tsconfig.node.json` — Vite config typed via `@types/node`

**Vercel (`vercel.json`):**
- Framework: vite, output: dist
- SPA rewrites: `/(.*)` → `/index.html`
- Build: `npm run build:vercel` (build + prune assets)

**Lock Files:** Both `bun.lock` (1620 lines) and `package-lock.json` (10,897 lines) present. Project uses npm for installs per vercel.json.

### 1.2 Discovered Problems

| # | Severity | File | Issue |
|---|----------|------|-------|
| C-1 | **CRITICAL** | `vite.config.ts:39` | `chunkSizeWarningLimit: 15000` (15 MB) — the singlefile plugin inlines everything. If the bundle exceeds ~10 MB, mobile browsers may fail to parse the HTML. No runtime safeguard detects this. |
| C-2 | HIGH | `package.json:110` | Dual TypeScript toolchain (`@typescript/native` TS7 + `@typescript/typescript6` TS6) is a maintenance burden. The `scripts/tsc7.mjs -b` wrapper adds indirection. If type definitions diverge between TS7/TS6, builds may pass but types may be wrong. |
| C-3 | MEDIUM | `vite.config.ts:13` | `viteSingleFile()` inlines ALL assets (JS, CSS, WASM) into one HTML file. This prevents browser caching of individual chunks and makes every deploy a full re-download. For a 3D game with Rapier WASM, this can produce extremely large payloads. |
| C-4 | MEDIUM | `package.json:96-99` | Both lock files present. `bun.lock` may be stale if npm is the actual installer. CI/deploy must use the correct lock file consistently. |
| C-5 | LOW | `vite.config.ts:46-52` | `optimizeDeps.include` is missing `postprocessing` and `@react-three/postprocessing` — these are heavy and benefit from pre-bundling. |
| C-6 | LOW | `index.html:12-14` | Google Fonts (`Cormorant`, `Manrope`) loaded via external link — blocks rendering until fonts resolve. No `font-display: swap` preload. |

### 1.3 Potential Improvements

1. **Bundle splitting strategy:** Consider code-splitting by scene/chunk instead of singlefile for non-Vercel targets. Keep singlefile only for the Vercel deploy path.
2. **Font loading:** Use `<link rel="preload" as="font" crossorigin>` or self-host fonts.
3. **Consolidate lock files:** Pick one package manager and remove the other lock file.
4. **Add `optimizeDeps.exclude`** for Rapier if WASM inlining causes issues.

---

## 2. Data Models and Types

### 2.1 Current State

**Type Architecture:** Well-organized hierarchical type system under `src/shared/types/`:

```
game.ts (barrel)
├── brands.ts          — Branded ID types (NpcId, QuestId, PoemId, ItemId, StoryNodeId, DialogueNodeId)
├── common/
│   ├── conditions.ts  — ChoiceCondition (14+ gate types: karma, skill, flag, time, poem, item, clothing...)
│   └── effects.ts     — StoryEffect (17 effect types), SideEffect, deprecated GameEffect
├── definitions/
│   ├── skills.ts      — PlayerSkills (7 skills), TrainablePlayerSkill
│   ├── items.ts       — InventoryItem (stackable/non-stackable), EquipmentSlot, DialogueModifier
│   ├── npc.ts         — NPCDefinition (30+ fields), NPCAppearance, NPCAnimationClips, RelationMilestone
│   ├── quest.ts       — QuestDefinition, QuestObjective (7 types), QuestDifficulty
│   ├── story.ts       — StoryNode, StoryChoice (with goldenPath, conditions)
│   ├── dialogue.ts    — DialogueNode, DialogueChoice (partial/success/failure effects)
│   ├── combat.ts      — 23 EnemyType variants (incl. 3 bosses), CombatEnemy, CombatBuff, BuffEffect (11 types)
│   ├── scene.ts       — SceneConfig, SceneExit (13 transition styles)
│   ├── poem.ts        — Poem
│   ├── progression.ts — SkillTreeNode, SkillBranch
│   ├── schedule.ts    — ScheduleEntry
│   ├── weather.ts     — EventWeatherType (5 types)
│   └── thoughtCabinet.ts — ThoughtCabinetItem, ThoughtCabinetEffect
├── state/
│   ├── player.ts      — PlayerState, PlayerProgression
│   ├── game.ts        — GameState (top-level composite)
│   ├── quest.ts       — QuestState
│   ├── combat.ts      — CombatState (complex: RNG, buffs, combo, poem powers)
│   ├── combatRng.ts   — CombatRngState, CombatRngPityState
│   ├── exploration.ts — ExplorationState
│   ├── relations.ts   — NPCRelation
│   └── daily.ts       — AcceptedDailyMission
├── sceneDefinition.ts — SceneDefinition (single-source-of-truth, generates SceneConfig)
├── ambientSound.ts   — AmbientSoundType (14 profiles), SceneAmbienceConfig
├── camera.ts          — CameraWaypointData
├── levelUp.ts        — LevelUpEvent
├── notifications.ts  — GameNotification
└── locationCategory.ts — LocationCategory (10 types)
```

**Key Design Decisions:**
- **Branded types** for entity IDs — prevents accidental string mixing
- **`readonly`** on definition fields — enforces immutability
- **`ChoiceCondition`** is extremely rich: 14+ conditional gate types
- **Combat state** includes deterministic seeded RNG (`CombatRngState`) with pity system
- **SceneDefinition** (not SceneConfig) is the source of truth — SceneConfig is generated

### 2.2 Discovered Problems

| # | Severity | File | Issue |
|---|----------|------|-------|
| T-1 | **HIGH** | `brands.ts:17-39` | `asNpcId()`, `asQuestId()`, etc. are **unsafe casts** — they don't validate the input, just `as T`. Any string passes through. This provides false type safety. |
| T-2 | HIGH | `combat.ts:47-60` | `CombatEnemy` has **mutable fields** (`hp: number`, `specialCooldown: number`) mixed with `readonly` on all other fields. This is intentional for combat state mutation but breaks the readonly convention. |
| T-3 | MEDIUM | `definitions/items.ts:6` | `InventoryItemCategory` in `items.ts` ('key', 'consumable', 'misc', 'quest', 'equipment') differs from `ItemCategory` in the same file ('consumable', 'quest_item', 'key_item', 'book', 'equipment', 'poem_fragment', 'misc') — two overlapping but different category enums. |
| T-4 | MEDIUM | `state/player.ts:29` | `equippedItems: Record<EquipmentSlot, InventoryItem \| null>` — the `InventoryItem` type union makes it hard to access slot-specific fields without narrowing. |
| T-5 | MEDIUM | `definitions/combat.ts:1-12` | Historical fix comments ("FIX-1D Phase 11.1") left in type files — these should be in git history, not source code. |
| T-6 | LOW | `sceneDefinition.ts:232` | `transitionStyle` union is duplicated between `SceneDefinition` (line 232) and `SceneConfig` (scene.ts:53) — DRY violation. |
| T-7 | LOW | `definitions/narrative.ts:18` | `StoryMusicCue` only has 4 values ('tension', 'discovery', 'danger', 'emotional', 'mystery') — actually 5 but missing from the doc comment. |
| T-8 | LOW | `state/combat.ts:33` | `_sideEffects?: SideEffect[]` uses private `_` prefix but is part of a public interface. Should be a separate mechanism. |

### 2.3 Potential Improvements

1. **Validate branded IDs:** Add runtime validation in `asNpcId()` etc. (at minimum in dev mode).
2. **Unify item categories:** Merge `InventoryItemCategory` and `ItemCategory` into one.
3. **Separate mutable combat state:** Create `MutableCombatEnemy` that extends the readonly `CombatEnemy` template.
4. **Generate transitionStyle union once** and import everywhere.

---

## 3. State Management

### 3.1 Current State

**Architecture: Independent Slice Stores + Facade Pattern**

The state system is a sophisticated multi-store architecture:

```
gameStore.ts (facade) ─── read-only view, never directly mutated
  ├── stores/playerStore.ts       — PlayerSlice (6 sub-slices composed)
  ├── stores/explorationStore.ts   — ExplorationSlice
  ├── stores/worldStore.ts         — WorldSlice
  ├── stores/uiStore.ts            — UISlice
  ├── stores/cutsceneStore.ts      — CutsceneSlice
  ├── stores/saveStore.ts          — SaveSlice
  ├── stores/dialogueHistoryStore.ts — DialogueHistorySlice
  └── stores/achievementStore.ts   — AchievementSlice
```

**Key Mechanisms:**

1. **Independent Slice Stores:** Each slice is a standalone Zustand store with `subscribeWithSelector` middleware. They are NOT composed into a single store.

2. **Facade Pattern (`gameStore.ts`):** A `useGameStore` facade creates a `GameStoreState` by `Object.assign()`-ing all slice states. It's read-only — mutations go through `applyCombinedPatch()` which fans out to individual stores.

3. **Cache Invalidation:** The facade uses a ref-equality check (`sliceRefsEqual`) to skip rebuilding the combined state when no slice has changed. `invalidateCombinedGameStateCache()` forces rebuild.

4. **Microtask Batching:** `subscribeAllStores()` batches listener notifications via `queueMicrotask` to avoid multiple facade rebuilds per synchronous batch.

5. **Frame-level Coalescing:** `scheduleAfterSliceStoresSettle()` defers post-mutation work to `requestAnimationFrame` (or microtask fallback).

6. **Cross-Slice Reads:** `crossSliceReads.ts` provides typed functions like `readPlayerFromExploration()` that read from other stores. These are direct function calls (not reactive).

7. **Action Dispatcher:** `applyGameAction.ts` is a big switch statement (~45 action types) that routes `GameAction` to the correct slice store's action.

8. **GameActionBridge:** `gameActionBridge.ts` registers a bridge so the engine can dispatch actions without importing store modules directly (avoids circular deps).

9. **Lazy Data Loading:** `gameDataLoader.ts` implements two-phase boot: boot data (world/mechanics) loads first, narrative data loads on game start. Story/dialogue packs load on demand.

**Slice Composition:**
- `PlayerSlice` = `PlayerCoreSlice` + `PlayerInventorySlice` + `PlayerProgressionSlice` + `PlayerEconomySlice` + `PlayerQuestRewardsSlice` + `ThoughtCabinetSlice`
- Each sub-slice is a `StateCreator<GameStoreState>` that receives the full (unused) state type
- `bindSliceCreator()` in `stores/bindSliceCreator.ts` casts `set`/`get` to `never` — this is intentional because each store is independent

### 3.2 Discovered Problems

| # | Severity | File | Issue |
|---|----------|------|-------|
| S-1 | **CRITICAL** | `storeBindings.ts:108-122` | `getCombinedGameState()` uses `Object.assign()` to merge 9 slice states. This creates a **new object on every cache miss** but the sub-objects (e.g. `state.playerState`) are **shared references**. If any consumer mutates a nested property of the combined state, it corrupts the source slice state. |
| S-2 | **HIGH** | `applyGameAction.ts:25` | `applyGameAction` is explicitly documented as **non-transactional**: "cross-slice reads within a synchronous batch may see intermediate states." The `batchGameActions` function (line 141) just loops — no batching primitive. A quest completion that triggers XP + karma + flag + achievement fires 4+ separate store mutations with 4+ facade rebuilds. |
| S-3 | HIGH | `gameStore.ts:62-70` | `useGameStore.getState()` is overridden to NOT flush the facade, while `useGameStore.setState()` DOES flush. This means `getState()` after a `setState()` call returns stale data if no microtask/frame has passed. The comment says "hot paths should use getGameSnapshot()" but this is a footgun. |
| S-4 | HIGH | `storeBindings.ts:13-20` | Slice store refs are module-level `let` variables, initialized to `null`. `requireBinding()` throws if accessed before `bindSliceStores()`. If any module-level code (not in a function) accesses these before `stores/index.ts` is imported, it crashes. |
| S-5 | MEDIUM | `combinedState.ts:12` | `SLICE_STORES` array for `subscribeAllStores` is hardcoded and does NOT include the `DifficultyStore`. The `types.ts` `GameStoreState` includes `DifficultySlice`, but changes to difficulty settings won't trigger facade rebuilds. |
| S-6 | MEDIUM | `gameStore.ts:84-113` | `buildGameSnapshot()` creates a massive inline object literal spanning 30 lines. This runs on every facade flush. Deep property access like `state.playerState.progression?.level ?? 1` is verbose and error-prone. |
| S-7 | MEDIUM | `playerCoreSlice.ts:102-113` | `visitNode()` spreads `visitedNodes` array on every visit — O(n) copy for each new node. With 500+ nodes in a long playthrough, this degrades. The `visitedNodeTimestamps` record is also spread each time. |
| S-8 | MEDIUM | `explorationSlice.ts:155-170` | `toggleInteractiveObject()` creates `setTimeout` timers that capture `get()` state. These timers are stored in a separate module (`explorationAutoCloseTimers`). If the store is disposed/reset, stale timers may fire and set state on a dead store. |
| S-9 | MEDIUM | `worldSlice.ts:1-50` | `worldSlice.ts` is 864 lines with ~40 actions — far too large for a single slice. Quest management, poem collection, NPC relations, achievements, daily missions, and affinity are all in one file. |
| S-10 | LOW | `patchState.ts:18-25` | Key sets are built at module load time with explicit string literals. Adding a new field to a slice requires manually updating the corresponding key set in `patchState.ts` — no compile-time guarantee. |
| S-11 | LOW | `uiSlice.ts:74` | `conversationLog: Record<string, ConversationLogEntry[]>` — each NPC's log is capped at 10 entries (line 299), but the record itself grows unboundedly as more NPCs are talked to. |

### 3.3 Potential Improvements

1. **Transactional action batching:** Implement a `batchUpdate` that collects mutations and applies them in a single `setState` per store, reducing N mutations to 1 per slice.
2. **Deep-freeze combined state:** Use `Object.freeze()` on the combined state in dev mode to catch mutations.
3. **Split WorldSlice:** Extract quest management, NPC relations, achievements, and daily missions into separate stores.
4. **Visited nodes index:** Use a `Set`-backed index (already exists in `visitedNodesIndex.ts`) for O(1) lookup.
5. **Auto-generate patchState keys:** Use `keyof` extraction at the type level to eliminate manual key set maintenance.
6. **Add DifficultyStore to SLICE_STORES** in `combinedState.ts`.

---

## 4. Entry Points and Bootstrap

### 4.1 Current State

**Entry Flow:**

```
index.html
  └── src/main.tsx
      ├── installChunkLoadRecovery()       — vite:preloadError handler
      ├── bindApplicationLayers()           — store↔engine wiring
      ├── applyGameSettings()               — graphics settings
      ├── initAccessibilitySettings()       — a11y preferences
      ├── initVoiceLineRegistry()           — voice line cache
      ├── installSceneLoadDebugTap()        — debug F3 handler
      └── createRoot().render(<AppBootRoot />)
          ├── BootScreen (loading overlay)
          └── LazyGamePage (Suspense, lazy)
              ├── preloadBootGameData()   — 9 data modules
              ├── loadingPipeline        — progress reporting
              └── GamePage (full game orchestrator)
```

**Bootstrap Sequence:**
1. `main.tsx` — Side-effect imports run first (chunk recovery, store bindings, settings, a11y, voice)
2. `AppBootRoot` — Shows `BootScreen` overlay, kicks off `preloadBootGameData()`
3. `preloadBootGameData()` — Dynamic imports 9 modules in parallel (achievements, daily missions, lore, triggers, items, NPCs, skill tree, perks, NPC gifts)
4. `GamePage` — Lazy-loaded, contains the full 3D game orchestrator
5. Narrative data loads later when game starts (quests, poems, story/dialogue packs)

**`bindApplicationLayers()`** wires:
- Store ↔ engine host callbacks (scene transitions, combat, guided story)
- Store lifecycle host (XP batch reset)
- Store subscribe profiler (dev)
- Scene transition bridge
- App event bus ↔ engine event bus
- Music store events
- Difficulty combat multiplier

### 4.2 Discovered Problems

| # | Severity | File | Issue |
|---|----------|------|-------|
| B-1 | **HIGH** | `main.tsx:33` | StrictMode is disabled by default (`VITE_ENABLE_STRICT_MODE !== 'true'`). This means React's double-render safety net is off in dev. The comment says "Rapier KCC lifecycle breaks in StrictMode" — this is a known issue but hiding bugs during development. |
| B-2 | HIGH | `AppBootRoot.tsx:95-141` | The `tryCompleteMenuBoot()` function has a complex retry/synthesize logic for first-frame detection. The 68% threshold (`snap.pct >= 68`) is a magic number that may cause premature boot completion on slower devices. |
| B-3 | MEDIUM | `main.tsx:6` | `bindApplicationLayers()` is called at module scope (not in an effect). This means the store→engine wiring runs before React renders. If any binding fails, the entire app fails to mount with no UI feedback. |
| B-4 | MEDIUM | `AppBootRoot.tsx:100` | `eventBus.emit('canvas:first-frame', ...)` is called SYNTHETICALLY inside the boot component when progress is stuck. This is a workaround for a deeper timing issue between the loading pipeline and the canvas renderer. |
| B-5 | LOW | `index.html:2` | `lang="ru"` is hardcoded. The project has `src/i18n/messages/ru.ts` suggesting i18n is planned but not active. |

### 4.3 Potential Improvements

1. **Fix StrictMode compatibility with Rapier:** The KCC lifecycle issue should be fixable with proper cleanup in `disposeGameEngine`/`reviveGameEngine`. Enabling StrictMode catches many timing bugs.
2. **Guard bootstrap bindings:** Wrap `bindApplicationLayers()` in try/catch and surface errors through the BootScreen.
3. **Add i18n lang attribute:** Dynamically set `document.documentElement.lang` based on user locale.

---

## 5. Engine Core

### 5.1 Current State

The engine is the largest subsystem (724 .ts/.tsx files). Key subsystems:

**Event System (`EventBus.ts`):**
- Typed pub/sub with priority ordering (Engine → Orchestrator → UI → FX)
- Payload-aware deduplication (FNV-32 hash, 64-slot fixed array, lazy expiry)
- Hard caps (20 handlers/event, 20 onAny) — throws on overflow (catches leaks)
- Scope-based lifecycle (`createScope()`) for orchestrator cleanup
- Dispose/revive cycle for React StrictMode and HMR
- Auto-revive with warning in dev (StrictMode race detection)
- Singleton `eventBus` with HMR-safe reset

**Combat System (`CombatSystem.ts`, 1467 lines + sub-modules):**
- Turn-based with deterministic seeded RNG (`SeededCombatRng` using Mulberry32)
- 23 enemy types including 3 bosses with multi-phase mechanics
- 11 buff/debuff effect types with duration tracking
- Poem power combat abilities with cooldowns and combo detection
- Difficulty scaling (enemy damage multiplier, flee bonus, stress accumulation)
- Combat session management with generation tokens (cancels stale async callbacks)
- Return stack for story→combat→story transitions (capped at 8)
- Side effects system that feeds back into the store after combat

**Scene Transition (`SceneTransitionManager.ts`):**
- Ordered protocol: unload → store write → enter → loaded (deferred)
- Synchronous + async transition guards (prevent re-entrant transitions)
- Global cleanup service (`GlobalCleanupService`) for GPU/audio/timer teardown
- Combat start gate with timeout fallback
- Scene loaded gate with deferred first-frame detection

**Physics (`rapierCompat.ts`):**
- Custom Vite alias shim for Rapier WASM initialization
- Two-mode init: external WASM file (cacheable) with inline base64 fallback
- HEAD probe to check external WASM availability (1.5s timeout)
- Suppresses Rapier's internal "deprecated parameters" warning during inline init

**Engine Lifecycle (`disposeGameEngine.ts`):**
- Ordered teardown: keyboard → engine state → frame visibility → player → interaction → NPC → timers → combat → quest → guided story → world → navmesh → stream → workers → canvas → GPU → audio → cleanup → bridges → event bus
- Matching `reviveGameEngine()` for StrictMode/HMR remount
- HMR-safe via `registerHmrDispose()`

**Player System:**
- First-person character controller with Rapier kinematic character controller
- Physics substep system, locomotion gate, movement mode system
- FPS arms presentation, movement scene sync
- Idle monologue system, virtual joystick bridge (mobile)

**NPC System (40+ files):**
- Procedural silhouette-based rendering (3 render tiers: hero/interactive/background)
- Head tracking, emotional reactions, activity animations
- State machine, patrol system, schedule-driven movement
- NavMesh pathfinding with caching
- Ambient bark system, quest bark system
- Obstacle avoidance, sprite pool for performance

**Audio System (25+ files):**
- AudioEngine (SFX), MusicEngine, AmbientEngine, SfxEngine
- Voice line player with registry
- Procedural mood generation, music intensity layers
- Scene audio controller, ambient play context
- Random sound loop registry, typewriter SFX

**Graphics System (35+ files):**
- Adaptive quality degradation based on FPS
- Quality presets (low/medium/high)
- GPU resource lifecycle, contact shadow textures
- Procedural sky/environment/LUT textures
- Weather environment materials, wet street effects
- Post-FX governor, instanced props

**Frame System:**
- Frame budget registry
- Frame profiler counters
- Frame visibility (pauses updates when tab not visible)
- Frame game snapshot caching

### 5.2 Discovered Problems

| # | Severity | File | Issue |
|---|----------|------|-------|
| E-1 | **CRITICAL** | `CombatSystem.ts:112-220` | `CombatManager` is a **module-level singleton class** (not in a store). Its `_state`, `listeners`, `timers`, and `returnStack` are instance fields that persist across game resets. `dispose()` is called from `disposeGameEngine()` but if the combat system is accessed after dispose but before revive, it silently no-ops. |
| E-2 | **CRITICAL** | `rapierCompat.ts:77-84` | `console.warn` is **monkey-patched** globally during Rapier inline init to suppress a deprecation warning. If any other code calls `console.warn` during the init window (~100ms), it's silently swallowed. This is a side-effect footgun. |
| E-3 | HIGH | `EventBus.ts:146-156` | `assertSubscribable()` auto-revives the disposed bus in production too (the `NODE_ENV` check is only for the warning message). This means a subscription leak in production silently revives the bus, potentially running stale handlers. |
| E-4 | HIGH | `disposeGameEngine.ts:172-210` | `reviveGameEngine()` calls `bindDeferredCombatStartListener()` **twice** (lines 187 and 188 are duplicates). This registers duplicate event bus listeners on every StrictMode remount. |
| E-5 | HIGH | `SceneTransitionManager.ts:78-81` | Module-level side effects (`ensureSceneLoadedBridge()`, `bindSceneTransitionGuardListeners()`, etc.) run on import. These register EventBus listeners before `bindApplicationLayers()` in `main.tsx`. If the EventBus is not yet initialized, these calls may fail silently. |
| E-6 | MEDIUM | `CombatSystem.ts:1467` | The file is 1467 lines. While it delegates to sub-modules, the main file still contains significant logic (player turn, enemy turn orchestration, session management). |
| E-7 | MEDIUM | `rapierCompat.ts:41-44` | The external WASM HEAD request has a 1.5s timeout but no retry. On flaky connections, this may cause the external path to be skipped and fall back to inline, even if the file is available. |
| E-8 | MEDIUM | `GlobalCleanupService.ts:50-57` | `runGlobalCleanup()` catches and logs handler errors but continues. If a cleanup handler partially fails (e.g., disposes 2 of 3 GPU resources), the remaining resources leak silently. |
| E-9 | LOW | `EventBus.ts:41-49` | `DEDUP_ENABLED_EVENTS` is a hardcoded `as const` array. Adding a new dedup-enabled event requires modifying this source file. Consider a registration API. |
| E-10 | LOW | `disposeGameEngine.ts:98` | `engineDisposed` flag is module-level state. In test environments where multiple test files share the module, dispose in one test affects others. |

### 5.3 Potential Improvements

1. **Fix duplicate `bindDeferredCombatStartListener()`** in `reviveGameEngine()` — remove the duplicate line.
2. **Replace console.warn monkey-patching** with a targeted approach (filter by stack trace or message content in a less invasive way).
3. **Guard auto-revive in production** — only auto-revive in dev mode (StrictMode), throw in production.
4. **Defer module-level listener registration** in `SceneTransitionManager.ts` to an explicit init function called from `bindApplicationLayers()`.
5. **Consider a combat state machine** (XState or similar) instead of the manual generation-token pattern.
6. **Add retry logic** to the external WASM probe in `rapierCompat.ts`.
7. **Report partial cleanup failures** — track which handlers succeeded/failed.

---

## Master Bug List (Sorted by Criticality)

### 🔴 CRITICAL (3)

| ID | Location | Description |
|----|----------|-------------|
| C-1 | `vite.config.ts:39` | 15 MB chunk size limit — no runtime safeguard for mobile browser OOM |
| S-1 | `storeBindings.ts:108-122` | `Object.assign` combined state exposes mutable shared references — data corruption risk |
| E-1 | `CombatSystem.ts:112` | Module-level CombatManager singleton — stale state access after dispose |

### 🟠 HIGH (8)

| ID | Location | Description |
|----|----------|-------------|
| C-2 | `package.json:96-99` | Dual TypeScript toolchain — type correctness divergence risk |
| T-1 | `brands.ts:17-39` | Branded ID constructors are unsafe casts — no runtime validation |
| T-2 | `combat.ts:47-60` | Mutable fields in otherwise-readonly CombatEnemy |
| S-2 | `applyGameAction.ts:25` | Non-transactional action dispatch — intermediate cross-slice reads are stale |
| S-3 | `gameStore.ts:62-70` | Overridden getState() returns stale data after setState() |
| S-4 | `storeBindings.ts:13-20` | Null refs crash if accessed before bindSliceStores() |
| B-1 | `main.tsx:33` | StrictMode disabled in dev — hidden timing bugs |
| E-3 | `EventBus.ts:146-156` | Auto-revive in production masks subscription leaks |
| E-4 | `disposeGameEngine.ts:187-188` | Duplicate `bindDeferredCombatStartListener()` call |
| E-5 | `SceneTransitionManager.ts:78-81` | Module-level side effects before EventBus init |

### 🟡 MEDIUM (12)

| ID | Location | Description |
|----|----------|-------------|
| C-3 | `vite.config.ts:13` | Singlefile prevents browser caching |
| C-4 | `package.json` | Dual lock files may be stale |
| T-3 | `items.ts:6` | Two overlapping item category enums |
| T-4 | `state/player.ts:29` | Equipment items hard to narrow without type guards |
| T-5 | `combat.ts:1-12` | Historical fix comments in type files |
| S-5 | `combinedState.ts:12` | DifficultyStore missing from SLICE_STORES |
| S-6 | `gameStore.ts:84-113` | 30-line inline snapshot builder runs on every flush |
| S-7 | `playerCoreSlice.ts:102-113` | O(n) array copy on every node visit |
| S-8 | `explorationSlice.ts:155-170` | Stale setTimeout timers after store reset |
| S-9 | `worldSlice.ts` | 864-line mega-slice with 40+ actions |
| B-2 | `AppBootRoot.tsx:95-141` | Magic 68% boot threshold |
| B-3 | `main.tsx:6` | Uncaught bootstrap binding failures |
| E-6 | `CombatSystem.ts` | 1467-line orchestrator file |
| E-7 | `rapierCompat.ts:41-44` | No retry on flaky WASM probe |
| E-8 | `GlobalCleanupService.ts:50-57` | Partial cleanup silently leaks resources |

### 🟢 LOW (7)

| ID | Location | Description |
|----|----------|-------------|
| C-5 | `vite.config.ts:46-52` | Missing optimizeDeps entries |
| C-6 | `index.html:12-14` | External Google Fonts block rendering |
| T-6 | `sceneDefinition.ts:232` | Duplicated transition style union |
| T-7 | `narrative.ts:18` | Incorrect doc comment |
| T-8 | `combat.ts:33` | Private `_sideEffects` in public interface |
| S-10 | `patchState.ts:18-25` | Manual key sets — no compile-time guarantee |
| S-11 | `uiSlice.ts:74` | Unbounded conversationLog record growth |
| B-5 | `index.html:2` | Hardcoded lang="ru" |
| E-9 | `EventBus.ts:41-49` | Hardcoded dedup event list |
| E-10 | `disposeGameEngine.ts:98` | Module-level disposed flag taints tests |

---

## Summary

This is a **large, ambitious browser-based 3D RPG** with:
- **2052 source files** (374 tests), **21 MB** of source code
- **Well-designed type system** with branded IDs, rich conditional gating, and immutable definitions
- **Sophisticated state architecture** — independent slice stores with facade pattern, lazy data loading, cross-slice read helpers
- **Mature engine** with typed event bus, deterministic combat RNG, scene transition protocol, and ordered lifecycle management
- **Extensive content pipeline** — 53 build scripts, lazy narrative pack loading, asset optimization

**Top 3 risks:**
1. **Singlefile bundle size** (C-1) — may exceed mobile browser limits with Rapier WASM inlined
2. **State mutation safety** (S-1, S-3) — shared references in combined state + stale getState after setState
3. **Module-level singleton lifecycle** (E-1, E-4, E-5) — combat system, event bus, and scene transition listeners have ordering and cleanup issues
