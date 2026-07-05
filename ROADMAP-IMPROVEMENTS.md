# Roadmap — Volodka RPG Improvements

> **Living document.** Updated after each code-analysis iteration.
> Based on expert code review of the actual codebase (NOT changelogs, READMEs, or notes).
> Source: 6 parallel expert agents analyzed 1603 source files, ~22k LOC tests, 27 scenes, 201 story-nodes, 46 poems, 220 GLBs.
> Repo: https://github.com/IETGLIM/Volodka · Branch: main · Current version: v4.2.42

---

## How to use this document

### Process
1. **Before each iteration:** Read this file end-to-end to restore context.
2. **Pick next subsystem** (deep-dive order below, or by user direction).
3. **Analyze code** (Explore agents + direct reads). Cite `file:line`.
4. **Append findings** to the relevant subsystem section. Never delete — mark as `superseded` if a later analysis changes the conclusion.
5. **Return summary** to user + propose next iteration.
6. **When all subsystems analyzed:** sort by priority/dependencies → execute fixes phase-by-phase. Each fix = one commit referencing the roadmap item ID (e.g., `fix(graphics): P1-GFX-02 remove needsUpdate from applyWetness [roadmap:P1-GFX-02]`).

### Conventions
- **Priority:** `P0` (blocker / data-loss / crash) → `P1` (high / perf / architecture) → `P2` (medium / tech-debt) → `P3` (low / polish)
- **Status:** `pending` → `analyzed` → `plan-ready` → `in-progress` → `done` → `superseded`
- **Effort:** `S` (<1h) → `M` (1-4h) → `L` (4-16h) → `XL` (16h+)
- **Source of truth:** code only. If CHANGELOG claims X but code says Y → write Y, note the discrepancy.

### Subsystem ID prefixes
| Prefix | Subsystem |
|--------|-----------|
| `ARCH` | Engine core (EventBus, bridges, frame loop, scene transitions, disposal, content truth) |
| `PLYR` | Player controller, physics, input, camera |
| `CMBT` | Combat system, enemies, buffs, RNG |
| `POEM` | Poem Power, TTL flags, synergies, world effects, reading ritual |
| `STLTH` | Stealth, vision cones, patrolling creeps |
| `STRS` | Stress mechanic |
| `GFX` | Graphics, postFX, adaptive quality, GPU lifecycle, asset compression |
| `WRLD` | World/streaming, chunks, navmesh, spawn director |
| `SAVE` | Save/persistence, migrations, Zod schema |
| `STORE` | Zustand stores, slices, selectors, cross-slice discipline |
| `UI` | Orchestrator, panel stack, HUD, z-index layers, escape routing |
| `AUDIO` | Music engine, ambient, SFX, audio settings |
| `TEST` | Vitest, Playwright, content validators, coverage |
| `NPC` | NPC models, animations, schedules, relationships |
| `NARR` | Story nodes, dialogue, golden path, quests, cutscenes |
| `SCENE` | Scene definitions, prop dressing, colliders, lighting |
| `A11Y` | Accessibility, i18n, reduced motion |
| `BUILD` | Vite config, chunks, bundle budgets, deploy |
| `DOC` | Documentation drift (ARCHITECTURE.md, comments, docstrings) |

---

## Iteration log

| Date | Iteration | Subsystem(s) | Agent(s) | Status |
|------|-----------|--------------|----------|--------|
| 2026-07-02 | 0 (initial synthesis) | ARCH, PLYR, CMBT+POEM, GFX, WRLD+STORE+UI+AUDIO+TEST, innovation audit | 6× Explore (parallel) | analyzed |
| 2026-07-02 | 0.5 (Phase 0 fixes) | P0-GFX-01, P0-CMBT-01/02, P0-DOC-01, GFX-22, ARCH-03/07/09, DOC-02 | direct edits | **done** — 9 fixes applied, typecheck+lint+963 tests green |
| 2026-07-03 | 1 (narrative + animation audit) | NARR content audit, ANIM pipeline audit | 2× Explore (parallel) | analyzed — content complete (+50% nodes, +22% quests); animations have 32 MB dead weight + stale docstrings |
| 2026-07-03 | 1.5 (Phase 1 fixes — content + anim + combat) | ANIM-01/03/04, DOC-03/04, CMBT-05, POEM-04 | direct edits | **done** — 6 fixes applied, typecheck+lint+1197 tests green |
| 2026-07-03 | 2 (Phase 2 fixes — stress + adaptive quality) | STRS-01/02, GFX-02 | direct edits | **done** — 3 fixes applied, typecheck+lint+1288 tests green |
| 2026-07-03 | 2.5 (Phase 2 fixes — adaptive quality cleanup) | GFX-03/04/05 | direct edits | **done** — 3 fixes applied, typecheck+lint+1327 tests green |
| 2026-07-03 | 3 (Phase 3 fixes — engine subsystem registry) | ARCH-02 | direct edits | **done** — 1 fix applied, typecheck+lint+1327 tests green |
| 2026-07-03 | 4 (Phase 4 fixes — save migration framework) | SAVE-01/03, TEST-01 | direct edits | **done** — 3 items resolved via 13 migration tests + documentation |
| 2026-07-03 | 5 (Phase 5 fixes — player feel) | PLYR-07 | direct edits | **done** — jump buffering added, typecheck+lint+47 player tests green |
| 2026-07-03 | 6 (Phase 6 fixes — P2 tech debt cleanup) | PLYR-01/02/04/05, CMBT-07, STLTH-03, GFX-08, ARCH-01/04/15/16/18 | direct edits | **done** — 12 P2 items resolved, typecheck+lint+1224 tests green |
| _pending_ | 2 | Scene definitions & prop dressing | — | pending |
| _pending_ | 4 | Accessibility & i18n | — | pending |
| _pending_ | 5 | Quest system (QuestTracker god object) | — | pending |
| _pending_ | 6 | Dialogue system | — | pending |
| _pending_ | 7 | Crafting/trading/economy/skill tree/perks | — | pending |
| _pending_ | 8 | Minigames (hacking, memory, codebreaker, terminal) | — | pending |
| _pending_ | 9 | Asset pipeline scripts (5454 lines) | — | pending |
| _pending_ | 10 | Vite/build/deploy optimization | — | pending |

---

## P0 — Blockers (do first, before any other work)

| ID | Title | File:line | Effort | Status | Subsystem |
|----|-------|-----------|--------|--------|-----------|
| P0-CMBT-01 | `nexus_guardian` (Act 6 boss) has empty `specialAttacks: []` — shipping blocker | `src/engine/combat/enemies.ts` | M | **done** v4.2.43 | CMBT |
| P0-CMBT-02 | `void_echo` has empty `specialAttacks: []` | `src/engine/combat/enemies.ts` | S | **done** v4.2.43 | CMBT |
| P0-GFX-01 | `applyWetness` sets `material.needsUpdate = true` every frame → per-frame shader recompile on wet-street scenes | `src/engine/graphics/materials/pbrPresets.ts` | S | **done** v4.2.43 | GFX |
| P0-DOC-01 | `ROADMAP.md` referenced 12+ times (CHANGELOG, ARCHITECTURE.md, `.cursor/skills/`) but does not exist — Cursor automations skill instructions will fail | `ROADMAP.md` (created) | S | **done** v4.2.43 | DOC |
| P0-WRLD-01 | Entire world/streaming layer (WorldChunkManager, WorldStreamManager, NavMeshLayer, SpawnDirector) emits 5 events with ZERO external subscribers — cargo-cult | `src/engine/world/*` | XL | analyzed | WRLD |

---

## Findings by subsystem

### 1. Engine core architecture (ARCH) — analyzed ✓

**Sources:** Task 1-arch (EventBus, bridges, frame loop, scene transitions, disposal, content truth, visualSettings, GuidedStory/QuestTracker shells). ~4300 LOC analyzed.

#### Strengths
- **Typed EventBus** (`EventBus.ts`, ~711 LOC) with FNV-1a 32-bit dedup (`eventBusDedup.ts:21-26`), 64-slot ring, field-name fallback for nested-only payloads (line 96-100), priority tiers Engine=0→Debug=1000 (`eventBusPriority.ts:13-21`), generation-based in-flight cancel, `EventBusScope` for batch dispose, hard caps (20 handlers/event). Tested.
- **ESLint-enforced three-way boundary** (`eslint.config.js:32-94`): store ↮ engine, shared ↮ neither. **Best architectural decision in the codebase.** Prevents circular-import death spiral.
- **`GameAction` discriminated union** (`gameActionBridge.ts:79-151`) — 60+ typed actions, compile-time exhaustiveness.
- **4-phase frame pipeline** (`frame/types.ts:15-21`) aligned with R3F `useFrame` priorities. `frameGameSnapshot.ts` captures minimal slice ONCE per frame (prevents 82 ticks × store reads). `wrapStoreSubscribe` (`frameProfilerCounters.ts:50-61`) counts Zustand notifications in dev.
- **Scene transition 4-event protocol**: `scene:transition_start → scene:unload → store write → scene:enter → scene:loaded`. The `scene:enter` (store committed) vs `scene:loaded` (first composited frame) distinction is correct for React + Suspense + R3F.
- **`combatStartGate`** defers combat during transitions, with scene-change invalidation (`combatStartGate.ts:99-110`). 15s timeout fallback.
- **`reviveGameEngine()`** (`disposeGameEngine.ts:138-169`) re-binds 11 listeners, revives 8 subsystems. Real StrictMode/HMR survival, tested.
- **Content Truth manifest** (`shared/contentTruthManifest.ts`) documents canonical source for 17 domains. CI parity test enforces lazy vs eager registry equality.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| ARCH-01 | 4 alias files for one bridge (stateDispatcher + gameActionBridge + StateDispatcher + GameActionDispatcher) | `shared/gameBridge/*`, `engine/StateDispatcher.ts`, `engine/GameActionDispatcher.ts` | P2 | S | **done** v4.2.50 | Documented GameActionDispatcher as canonical; stateDispatcher.ts + StateDispatcher.ts marked deprecated with migration instructions |
| ARCH-02 | Hand-maintained dispose/revive list — add subsystem → must edit both lists, no compile-time guarantee | `disposeGameEngine.ts:89-132, 138-169` | P1 | M | **done** v4.2.47 | Created `EngineSubsystemRegistry` + `engineSubsystemRegistrations.ts`; disposeGameEngine is now a 15-line wrapper |
| ARCH-03 | Top-level binders run at import time (`ensureSceneLoadedBridge` etc.) — fragile to import order | `SceneTransitionManager.ts` | P1 | S | **done** v4.2.43 | Moved into `reviveGameEngine()` |
| ARCH-04 | `combatStartGate` holds ONE pending combat — second silently overwrites first | `combatStartGate.ts:31` | P2 | S | **done** v4.2.50 | Replaced single `pending` with `pendingQueue` array; only last valid combat starts (idempotency); scene change invalidates all |
| ARCH-05 | `assertNarrativeKind` is a no-op identity function — looks like contract, isn't | `contentTruthManifest.ts:110-112` | P3 | S | analyzed | Make real assert or delete |
| ARCH-06 | `gpuFrameMs: null` stub masquerading as feature | `FrameProfilerState.ts:144` | P2 | M | analyzed | Implement via `EXT_disjoint_timer_query` or remove |
| ARCH-07 | `installFrameProfilerInstrumentation` dead code | `frameProfilerCounters.ts` | P3 | S | **done** v4.2.43 | Deleted |
| ARCH-08 | `legacyUseFrameEstimate` — guess labeled as estimate | `FrameProfilerState.ts:148` | P3 | S | analyzed | Rename or remove |
| ARCH-09 | `@deprecated setSceneTransitionInProgress` kept "for existing call sites" | `sceneTransitionGuard.ts` | P3 | S | **done** v4.2.43 | Migrated call site, deleted |
| ARCH-10 | `StoreLifecycleHost` interface with ONE method | `storeLifecycleHost.ts` | P3 | S | analyzed | Over-abstracted |
| ARCH-11 | `CONTENT_TRUTH` string-valued with no compile-time link to actual functions | `contentTruthManifest.ts:27-62` | P3 | S | analyzed | Use `satisfifies` with function refs |
| ARCH-12 | `DEDUP_ENABLED_EVENTS` hardcoded 8-event list, no per-event window customization | `EventBus.ts:40-49` | P3 | M | analyzed | 500ms wrong for both fx:glitch (~100ms) and weather:rain (~2000ms) |
| ARCH-13 | `maxHandlersPerEvent = 20` arbitrary global cap | `EventBus.ts:119-130` | P3 | S | analyzed | Combat alone could legit have 25 |
| ARCH-14 | `off()` is O(N) findIndex bypassing O(1) `removeListenerById` | `EventBus.ts:321-335` | P3 | S | analyzed | |
| ARCH-15 | `GuidedStoryManager` has 6 manual unsubscribe fields — should use `EventBusScope` | `GuidedStoryManager.ts:53-58` | P2 | S | **done** v4.2.50 | 4 EventBus listeners now in EventBusScope; 2 store subscriptions kept as individual unsubs; 4 unsub fields removed |
| ARCH-16 | `reviveGuidedStoryManager()` is a NO-OP — guidance silently broken after HMR until `initGuidedStoryManager()` called | `GuidedStoryManager.ts:468-470` | P2 | S | **done** v4.2.50 | Now calls instance.init() if not initialized; added isInitialized() public accessor |
| ARCH-17 | `QuestTracker.ts` is 795 LOC god object; `start()` alone is 100+ lines | `QuestTracker.ts:174-289` | P2 | L | analyzed | Split into collaborators |
| ARCH-18 | `EventBus` singleton + HMR dispose sets `disposed=true` but doesn't auto-revive — first subscribe throws | `EventBus.ts:382, 392` | P2 | S | **done** v4.2.50 | assertSubscribable now auto-revives in dev mode (with warning) instead of throwing; production still throws |
| ARCH-19 | `GameStoreSnapshot` is 40-field flattened projection — no compile-time guarantee it matches actual slices | `gameActionBridge.ts:35-76` | P2 | M | analyzed | Selector-based on real store type safer |
| ARCH-20 | `applyEffectsBridge.test.ts` exists but `applyEffectsBridge.ts` does NOT — misleading naming | `shared/gameBridge/` | P3 | S | analyzed | |

---

### 2. Player controller & physics (PLYR) — analyzed ✓

**Sources:** Task 2-player (Rapier KCC, input, camera, fallback chain, FPS arms). Note: agent output was truncated; some findings inferred from worklog.

#### Strengths
- **Fallback chain `kcc → kcc_degraded → simple`** is real, not stub. `SimplePlayer.tsx` is 409 lines with damp-based velocity, walkable bounds clamp, stuck-lock watchdog.
- **`kccRecoveryState.ts`** — pure function, well-tested: 60 fail frames → degrade; recreate up to 5 attempts/incident; 30 healthy frames → restore.
- **Coyote time 0.15s** present (`playerConstants.ts:21`).
- **Substep accumulator** correct pattern (`MAX_PHYSICS_DT=1/30, MAX_PHYSICS_STEPS=4`).
- **Camera ownership FSM** clean: `cutscene(5) > wakeUp(4) = timeline(4) > cinematicFreeze(3) > transition(2) > followCamera(1)`.
- **Camera collision** on layer 5, separate from render layers 0-4.
- **Keyboard rollover resolution** (W+S / A+D via `lastVerticalAxis`/`lastHorizontalAxis`), clear on blur.
- **Gamepad** radial deadzone preserves direction, trigger rescale, right-stick orbit buffered.
- **E-key consumption** 200ms debounce, race-safe.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| PLYR-01 | Capsule radius 0.30m too thick (adult shoulders ≈ 0.45m → r 0.22-0.25) — feels "fat" in doorways | `playerConstants.ts:11` | P2 | S | **done** v4.2.50 | Reduced to 0.25m — fits standard 0.9m door openings with margin |
| PLYR-02 | Snap-to-ground 0.15m too tight for 7 m/s run (Valve L4D ≈ 0.25m) | `playerConstants.ts:19` | P2 | S | **done** v4.2.50 | Increased to 0.22m — ~2 frames tolerance at 60fps (Valve L4D ~0.25m) |
| PLYR-03 | Skin width 0.04m (13% of radius) — capsule visibly floats 4cm above floor | `playerConstants.ts:14` | P3 | S | analyzed | Unity default 0.01-0.02 |
| PLYR-04 | `applyImpulsesToDynamicBodies = false` — ARCHITECTURE.md:131 and DynamicProps.tsx:2-4 comments LIE (claim props pushed "without extra code") | `characterControllerLifecycle.ts:47` | P2 | S | **done** v4.2.50 | Updated DynamicProps.tsx + ARCHITECTURE.md — documents kinematic→dynamic contact resolution |
| PLYR-05 | Substep capped at 2 in practice (`dt = min(delta, 0.05)` before substep calc) — `MAX_PHYSICS_STEPS=4` path dead | `playerFramePrepare.ts:48` | P2 | S | **done** v4.2.50 | Raised clamp to 0.133s (4 × 1/30) — full 4-substep path now activates on severe hitches |
| PLYR-06 | No determinism: `interpolate={false}` + `timeStep={1/60}` → 144Hz world steps every ~2.4 r3f frames, capsule sweeps every frame → visual stutter for dynamic bodies on 120/144Hz | `PhysicsSceneInner.tsx:66-67` | P2 | M | analyzed | |
| PLYR-07 | **No jump buffering** — press 50ms before landing is lost. Standard since ~2010 | (absent) | P1 | S | **done** v4.2.49 | Added JUMP_BUFFER_TIME=0.15s constant + jumpBufferTimerRef + buffer logic in playerMainMovement; buffer consumed on successful jump |
| PLYR-08 | No IK foot placement — CesiumMan placeholder will foot-slide on slopes/stairs | (absent) | P2 | L | analyzed | |
| PLYR-09 | No root motion — animations playback-only, movement purely velocity-driven | `playerMainMovement.ts:176-184` | P2 | L | analyzed | |
| PLYR-10 | No crouch/slide/dash/swim/climb/vault/wall-slide — states only walk\|run\|jump\|fall\|idle\|combat | `playerLocomotionPresentation.ts:7` | P2 | XL | analyzed | Scope decision |
| PLYR-11 | No movement state machine — implicit boolean refs instead of enum with enter/exit/update | `playerMainMovement.ts` | P2 | M | analyzed | |
| PLYR-12 | No landing impact / camera dip (breathing bob exists) | (absent) | P3 | M | analyzed | |
| PLYR-13 | `JUMP_COOLDOWN = 0.3s` reset on landing — only prevents re-jump during early ascent, name misleading | `playerMainMovement.ts:293` | P3 | S | analyzed | |
| PLYR-14 | `FIRST_PERSON_ENABLED = false` globally — entire FPS arms subsystem dormant | `cameraConstants.ts:11` | P3 | M | analyzed | fpsArmsPresentation, fpsFingerEnhancement, FirstPersonHands all dead code |
| PLYR-15 | `setGlobalTimeScale(0.92)` on dialogue enter — 8% slow-mo, no comment, unexpected side-effect | `applyCameraFrame.ts:57` | P3 | S | analyzed | |
| PLYR-16 | `RAPIER_PHYSICS_TIMESTEP = 1/60` doc constant never imported by PhysicsSceneInner (which hardcodes 1/60) | `physicsSubstep.ts:8` vs `PhysicsSceneInner.tsx:66` | P3 | S | analyzed | Loose coupling |
| PLYR-17 | `kccDegradedMetrics.ts` — in-memory counters only, no telemetry export, no alarm threshold | `kccDegradedMetrics.ts` | P3 | M | analyzed | Adequate for dev, insufficient for prod monitoring |

---

### 3. Combat system (CMBT) — analyzed ✓

**Sources:** Task 3-combat-poem. CombatSystem.ts + engine/combat/* + enemies + PatrollingCreeps + seededRand.

#### Strengths
- **Generation-token async safety** — stale combat callbacks no-op via captured generation (`CombatSystem.ts:91-198`). Tested.
- **Deterministic seeded RNG** (mulberry32) with player-favorable pity: 6→14 rolls soft/hard crit pity, variance floor pity. Per-encounter seed from player seed + encounter counter + enemy type. `combatEncounterSeq` persisted → QA reproduces any combat from save. **Best-in-class for small RPG.**
- **Buff stack limit** with eviction priority, refresh-on-reapply, mutual exclusion (`defense_reduction` vs `damage_multiplier`). Darkest Dungeon / Slay the Spire pattern.
- **Cumulative flee chance** (35% base + 15% per fail, clamp [0.15, 0.95]).

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| P0-CMBT-01 | `nexus_guardian` (Act 6 boss!) has empty `specialAttacks: []` | `enemies.ts:526` | P0 | M | analyzed | Shipping blocker |
| P0-CMBT-02 | `void_echo` has empty `specialAttacks: []` | `enemies.ts:539` | P0 | S | analyzed | |
| CMBT-03 | Action economy = 4 options only (Attack/Defend/Poem/Flee) — no positioning, no initiative, no AP, no resource cost for poems. Persona 1 (1996) depth, not Divinity/BG3/Persona 5 | `CombatSystem.ts`, `combat/actions.ts` | P2 | XL | analyzed | Design decision; scope |
| CMBT-04 | Enemy AI: `roll special chance → execute → else basic attack`. Nothing else | `combat/actions.ts` | P2 | L | analyzed | |
| CMBT-05 | `resolveEnemyType` silently swaps enemy type if player low level — no warning, no telemetry, breaks narrative contract | `enemies.ts` | P1 | S | **done** v4.2.44 | Added `allowFallback` option + dev warnings | |
| CMBT-06 | Legacy flags `doubleAttack`/`playerDefending`/`enemyDefending` mirror buff state, no compile-time guarantee they agree — two sources of truth | `CombatSystem.ts` | P2 | M | analyzed | |
| CMBT-07 | Difficulty localStorage-only, not in save — cross-machine save sharing loses setting | `combatDifficulty.ts:5` | P2 | S | **done** v4.2.50 | Added combatDifficulty to SavePayloadSchema + UISlice + persistedState; synced to localStorage on load/set |
| CMBT-08 | `defaultCombatRng = Math.random` trapdoor — never hit in prod but future contributor could break determinism | `formulas.ts:38-40` | P3 | S | analyzed | |

---

### 4. Poem Power system (POEM) — analyzed ✓

**Sources:** Task 3-combat-poem. PoemPowerSystem + poemPower/* + poemEffects/* + poemWorld/* + poemReading/* + poetryBook/* + config/poem* + data/poems + unifiedPoemRegistry.

#### Strengths
- **Same poem, two context-dependent mechanics**: `POEM_POWERS` (world) vs `POEM_COMBAT_ABILITIES` (combat). "Путеводная Звезда" = shrink creep vision + reveal exits in exploration, AND skip enemy turn in combat. `unifiedPoemRegistry` enforces canonical display names. **Fresh framing.**
- **TTL flags as systemic bus** — one flag `guiding_star_active` drives stealth AI (×0.45), post-FX bloom, trigger-zone highlight, HUD, combat opening buffs. **Dishonored-pattern: one verb, many noun-responses.** Strongest systemic pillar.
- **Rhythm-window synergies** (5s, bidirectional pairs, layered VFX).
- **`scaleStressWithPoemEffects` funnel** — every `player/addStress` through one function respecting TTL flags.
- **Monotonic↔epoch TTL conversion** for save/load (`ttlClock.ts:14-21`, `persistedState.ts:197-218`). Correct, tested.
- **Poem Reading Ritual cutscene** — letterbox + line-by-line + camera push + skip setting + reduced-motion bypass.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| POEM-01 | **Poem `themes` field is decorative — PoemPowerSystem never reads it.** Truly systemic design would derive mechanics from themes (смерть → death-resistance, детство → reveal hidden paths). Biggest missed opportunity | `data/poems.ts:48`, `PoemPowerSystem.ts` | P1 | XL | analyzed | The USP earns its claim only partially |
| POEM-02 | Two parallel combo systems that don't talk: combat `checkPoemPowerCombo` (2-element sliding window, 4 hardcoded pairs) vs exploration `tryApplyPoemSynergy` (5s window, 5 bidirectional pairs). Same word, different mechanics/data/windows | `combat/actions.ts:561-625` vs `applyPoemSynergy.ts:98-121` | P1 | M | analyzed | Unify |
| POEM-03 | Synergies are 5 hardcoded pairs, NOT emergent. "Systemic" framing is marketing | `config/poemSynergies.ts` | P2 | L | analyzed | Rule-based system instead |
| POEM-04 | Combat TTL expiry gap: `processExpiredTTLFlags` runs on 1s setInterval, NOT in combat. Flag expiring mid-combat doesn't revert until post-combat. Untested edge | `CombatSystem.ts` | P1 | S | **done** v4.2.44 | Now called at turn start in transitionToPlayerTurn | |
| POEM-05 | 6 parallel lookup tables for one poem (POEM_POWERS, POEM_COMBAT_ABILITIES, UNIFIED_POEM_REGISTRY, POEM_WORLD_EFFECT_OVERRIDES, POEM_TTL_CONSUMERS, POEM_POWER_COOLDOWN_MS). No single `PoemDefinition` type. Adding poem = edit all six | multiple | P2 | M | analyzed | |
| POEM-06 | `activeEffects` is non-serializable parallel array duplicating TTL flag state with own expiry sweep — two expiry paths | `PoemPowerSystem.ts:144-156` | P2 | M | analyzed | |

---

### 5. Stealth (STLTH) — analyzed ✓

**Sources:** Task 3-combat-poem. PatrollingCreeps + creepPatrols.

#### Strengths
- 4-state FSM `patrol → chase → engaged → cooldown`. `chaseSpeed < player run speed` ensures flee always works. Generation-safe combat entry via `startEncounter`. `combat:victory` removes creep until scene remount.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| STLTH-01 | No occlusion, no hearing, no height check | `PatrollingCreeps.tsx` | P2 | L | analyzed | |
| STLTH-02 | No offensive stealth (sneak attack/takedown/distraction) | (absent) | P2 | L | analyzed | |
| STLTH-03 | `GUIDING_STAR_VISION_SCALE = 0.45` hardcoded for ONE poem — `POEM_TTL_CONSUMERS` could have `creepVisionScale` field for systemic response, doesn't | `PatrollingCreeps.tsx:48` | P2 | S | **done** v4.2.50 | Added creepVisionScale field to PoemTTLConsumerMeta; guiding_star_active uses it; PatrollingCreeps reads from registry |

---

### 6. Stress (STRS) — analyzed ✓

**Sources:** Task 3-combat-poem. scaleStressWithPoemEffects + statusEffects.

#### Strengths
- `scaleStressWithPoemEffects` funnel — every stress source respects TTL flags. `stone_skin_active` halves positive stress. Single seam.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| STRS-01 | **Combat doesn't apply stress on hit/defeat/victory.** Stress only touched by poem side-effects and story nodes. Darkest Dungeon loop (combat → stress → affliction → behavior) broken at first link | `CombatSystem.ts` | P1 | M | **done** v4.2.45 | Enemy hits apply stress (scaled by damage/maxHp), victory applies relief (-5), defeat applies penalty (+10) | |
| STRS-02 | `stressed` status effect defined but not wired into combat | `statusEffects.ts:132` | P1 | S | **done** v4.2.45 | Added high-stress (>80) defense penalty (-2) in getPlayerDefense; updated status description |

---

### 7. Graphics & GPU pipeline (GFX) — analyzed ✓

**Sources:** Task 4-graphics. qualityPresets + gpuQualityProbe + adaptiveQuality* + fxGovernor + resolveSceneRenderingPipeline + graphicsGpuCleanup + proceduralLutTextures + proceduralSkyTextures + wetStreetScenes + useGraphicsQuality + pbrPresets + engine/three/* (14 files) + canvas/* (5 files) + ExplorationPostFX + performanceBudgets + chunks.ts + rapierInitFix.ts + webGlRendererSingleton.

#### Strengths
- **Refcounted per-scene GPU ownership** (`sceneGpuOwnership.ts` + `sceneModuleGpu.ts` + `importWithSceneGpuRegistration.ts`) — best-in-class for web Three.js. Shared geometry survives scene transitions until all scenes release.
- **EffectComposer disposal workaround** (`disposeThreeResources.ts:226-289`) for @react-three/postprocessing non-dispose bug. Tested including "composer.dispose() throws" case.
- **Error-boundary GPU teardown** (`forceDisposeOrphanedWebGLResources`) prevents black-screen-after-error.
- **Context-loss recovery** — deliberately does NOT call `THREE.Cache.clear()` (correct).
- **Modern post-processing** — Bloom (mipmapBlur), Vignette, HueSaturation, BrightnessContrast, N8AO (high+), procedural 16³ LUT (tetrahedral), ACES_FILMIC. 17 hand-tuned per-scene tables.
- **Stress-reactive vignette** (`ExplorationPostFX.tsx:355-371`).
- **Procedural sky textures** — 14 hand-painted canvas domes, seeded, cached.
- **Bundle chunking** — 400+ lines careful manual chunking with documented circular-dep fixes.
- **Buffer geometry sanitization** — defensively repairs NaN/Infinity in GLB attributes at runtime.
- **Multi-signal auto-tier detection** (viewport + pixel budget + GPU renderer + deviceMemory + Battery API) — state-of-the-art for browser.
- **HMR integration** throughout — module-level GPU state survives HMR.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| P0-GFX-01 | `applyWetness` sets `material.needsUpdate = true` every frame → per-frame shader recompile on wet-street scenes | `pbrPresets.ts:67-77` + `StreetVisual.tsx:80-86` | P0 | S | analyzed | Remove needsUpdate; roughness/metalness are uniforms |
| GFX-02 | Adaptive bridge reacts ONLY to FPS — ignores cpuFrame, physics, drawCalls, reactRenders, zustand, gpuMemory, gpuGeometries, gpuTextures, gpuMemoryDrift. Memory leak grows to tab crash without degrade | `adaptiveQualityBridge.ts:34` | P1 | M | **done** v4.2.45 | Now tracks fps + memory strikes (gpuMemory/gpuMemoryDrift/gpuGeometries/gpuTextures); memory needs only 3 strikes (vs 10 for FPS) |
| GFX-03 | `applyGfxPressureToPreset` + `GfxPressureLevel` dead code — wired into resolveQualityPreset signature, never driven (only 'none' passed) | `qualityPresets.ts:337-360, 373` | P1 | M | **done** v4.2.46 | adaptiveQualityBridge now tracks pressure (none/memory/critical) + emits QUALITY_GFX_PRESSURE_CHANGED; useGraphicsQuality listens and passes to resolveQualityPreset |
| GFX-04 | Every tier change nukes EVERY GPU cache (all GLBs in manifest) — makes hitches worse before better | `graphicsGpuCleanup.ts:37-46` | P1 | M | **done** v4.2.46 | Surgical eviction on degrade (texture caches only); full eviction on upgrade/manual. Added GpuCleanupReason to QUALITY_GPU_CLEANUP event |
| GFX-05 | `useDynamicDPR` and `adaptiveQualityBridge` not coordinated — DPR drops to 0.75 while bridge accumulates, then bridge degrades tier (resets DPR) → double-dip | `RPGGameCanvas.tsx:363-370` vs `adaptiveQualityBridge.ts` | P1 | M | **done** v4.2.46 | useDynamicDPR resets streaks + 8s cooldown after tier change; upgrade allowed during cooldown, downgrade blocked |
| GFX-06 | `useInstancing: true` flag in all presets — drives no global instancing. Only AmbientNPCs + StreetVisual use InstancedMesh. Each NPC = template clone = 1 draw call. Hundreds of draw calls vs 220-420 budget | `qualityPresets.ts` | P1 | L | analyzed | Biggest perf win |
| GFX-07 | No KTX2/Basis textures shipped — KTX2Loader configured, `resolveAtlasUrl` returns .ktx2 paths, but 0 .ktx2 files. All PNG/JPG inside GLBs (4-7× bandwidth waste) | `gltfPipeline.ts:40-42`, `public/` | P1 | L | analyzed | |
| GFX-08 | `meshopt` compression gated ultra-only — backwards. Meshopt is faster+smaller than Draco, should be high+ default | `qualityPresets.ts:143` | P2 | S | **done** v4.2.50 | Changed high preset from draco to meshopt; low/medium keep draco for older GPU compatibility |
| GFX-09 | No GPU instancing for skinned NPCs (three.js r158+ `InstancedBone` available, unused) | — | P2 | L | analyzed | Pairs with GFX-06 |
| GFX-10 | No occlusion culling — every frustum mesh renders | — | P2 | XL | analyzed | |
| GFX-11 | No cascaded shadow maps / shadow atlas — `preset.shadows` is boolean, likely single directional | — | P2 | L | analyzed | |
| GFX-12 | No SMAA/TAA — only renderer-level MSAA or none. postprocessing SMAA effect unused | — | P3 | S | analyzed | |
| GFX-13 | No screen-space reflections — wet streets use expensive planar reflection (doubles draw calls) | `StreetVisual.tsx:91-110` | P3 | L | analyzed | |
| GFX-14 | No WebGPU path — three.js 0.172 ships WebGPURenderer. Firmly on WebGLRenderer | — | P3 | XL | analyzed | Opt-in high-tier desktop |
| GFX-15 | No texture streaming / mip streaming | — | P3 | L | analyzed | |
| GFX-16 | `useImpostors: true` + `impostorDistance` aspirational — no atlas ships, 'impostor' LOD tier = procedural capsule | `qualityPresets.ts:77-78, 98-99`, `assetManifest.ts:153` | P3 | L | analyzed | |
| GFX-17 | `bakedLighting: true` in all presets — no lightmaps ship, field inert | `qualityPresets.ts:79, 100, 121, 142` | P3 | S | analyzed | |
| GFX-18 | `textureScale` + `resolveAtlasUrl` — KTX2 atlas path resolver exists, 0 .ktx2 files | — | P3 | S | analyzed | Pairs with GFX-07 |
| GFX-19 | `godRays` heavy FX in fxGovernor — no actual god rays effect in ExplorationPostFX | `fxGovernor.ts` | P3 | S | analyzed | |
| GFX-20 | `capQualityTierForPixelBudget` logic gap — >20M pixels cascades ultra→high→medium but never caps to low | `qualityPresets.ts:182-198` | P3 | S | analyzed | 4K@120Hz on integrated → medium, too aggressive |
| GFX-21 | `isWeakMobileGpuRenderer` regex misses modern parts (Adreno 6xx+, Mali-G76+, Apple GPUs) | `gpuQualityProbe.ts:77-80` | P3 | S | analyzed | Negative heuristic only |
| GFX-22 | Bundle budget enforcement gap — `npm run build` uses `--report` (never fails); only `budgets:check` enforces, not in build chain | `package.json`, `scripts/check-bundle-budgets.mjs` | P1 | S | **done** v4.2.43 | |
| GFX-23 | `softenVisualSettingsOnDegrade` writes localStorage directly bypassing visualSettings hook — side-channel mutation | `adaptiveQualityDegrade.ts:37-45` | P2 | S | analyzed | |
| GFX-24 | `npcTemplateCache` clone(true) on SkinnedMesh — bone list shared by reference (per-clone boneTexture OK via Skeleton.clone) | `npcTemplateCache.ts:42-58` | P3 | S | analyzed | Verified correct, note for future |
| GFX-25 | `moduleMaterialRegistry` dedupes MeshStandardMaterial only — MeshPhysicalMaterial, ShaderMaterial not deduped | `moduleMaterialRegistry.ts:16` | P3 | S | analyzed | monitorGlass uses MeshPhysicalMaterial |
| GFX-26 | `textureReuseMap.ts` and `cachedCanvasTexture.ts` — two parallel refcount systems for textures, should unify | — | P3 | M | analyzed | |
| GFX-27 | Two parallel LOD systems (THREE.LOD via threeLodGroup + hysteresis via distanceLod) — mild redundancy | `threeLodGroup.ts` vs `distanceLod.ts` | P3 | M | analyzed | |
| GFX-28 | Rapier WASM init fix string-patches minified output — brittle, two layers of workaround (fix + alias) | `vite/rapierInitFix.ts`, `vite.config.ts:76` | P3 | M | analyzed | Audit if both still needed |
| GFX-29 | WebGL renderer singleton sacrifices multi-canvas (no minimap canvas) | `canvas/webGlRendererSingleton.ts` | P3 | S | analyzed | Correct trade-off for scope |
| GFX-30 | `useRendererReady` polling hack (50ms × 2^n, 10 attempts) — ugly but necessary workaround for postprocessing v6.39 EffectComposer crash | `ExplorationPostFX.tsx:121-207` | P3 | S | analyzed | Document louder |

---

### 8. World / streaming (WRLD) — analyzed ✓

**Sources:** Task 5-world-store-ui. WorldChunkManager + WorldStreamManager + WorldEventDirector + SpawnDirector + NavMeshLayer + WorldPersistence + worldRegistry + sceneDefinitions.

#### Strengths
- `sceneDefinitions.ts` (1400+ lines) + `sceneDefinitionGenerator.ts` (300 lines) — strong single-source-of-truth. Doorway-aware boundary wall generation with recessed backstops.
- `sceneInheritance.ts` lets 9 extension scenes derive from parents.
- `scenePropDressing.ts` splits props into critical/deferred load tiers.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| P0-WRLD-01 | **Entire world/streaming layer is cargo-cult** — 5 events (chunks_changed, stream_updated, region_enter, cell_ambience, location_enter) fire with ZERO external subscribers. Chunks computed, never consumed. NavMesh placeholder never queried. SpawnDirector dead code | `src/engine/world/*` | P0 | XL | analyzed | DECISION NEEDED: real streaming OR delete layer |
| WRLD-02 | `useWorldStream` called in orchestrator but result discarded — hook does work for no benefit | `useOrchestratorRuntime.ts:94` | P2 | S | analyzed | Remove or wire |
| WRLD-03 | NavMeshLayer is 4-neighbor grid graph, O(n) linear scan, never queried externally | `NavMeshLayer.ts:23-49` | P2 | L | analyzed | Real navmesh (recast-wasm) or delete |
| WRLD-04 | SpawnDirector.resolve has no external callers — actual spawn via SCENE_CONFIG[sceneId].spawnPoint | `SpawnDirector.ts:31-76` | P2 | S | analyzed | Delete |
| WRLD-05 | WorldPersistence pollutes playerState.flags with generated keys `world_cell_flag:${cellId}:${flagName}` instead of proper worldSlice | `WorldPersistence.ts:30-43` | P2 | M | analyzed | O(n) scan to reconstruct |
| WRLD-06 | Scene grid collisions — `street_night`, `city_square`, `underground_bunker` all at {x:0,z:0}; `pier_evening`+`river_pier` both {x:2,z:2}; `chk_campfire_night`+`chk_forest_zorge` both {x:2,z:1}; `factory_roof`+`abandoned_factory` both {x:-1,z:0} | `worldRegistry.ts:381-409` | P3 | S | analyzed | getPrimarySceneForChunk silently orphans |
| WRLD-07 | `computeWorkerClient` offload for chunk diff — trivial Chebyshev set difference, worker overhead likely exceeds savings | `WorldStreamManager.ts:132-140` | P3 | S | analyzed | |

---

### 9. Save / persistence (SAVE) — analyzed ✓

**Sources:** Task 5-world-store-ui. saveStorage + saveMigrations + saveSchema + persistedState + gameSnapshotCache.

#### Strengths
- Two-phase write with backup fallback — backup promoted ONLY if primary valid (corrupt primary doesn't destroy last good backup). Tested 6 cases.
- Load resolution: primary → backup → corrupt WITHOUT deleting keys (manual recovery possible).
- Zod schema 30+ sub-schemas, all post-v1 fields `.optional().default()`, migration-friendly. `ActiveTTLFlagsSchema` accepts legacy array, transforms to map.
- `gameSnapshotCache` solves real perf problem (30-field snapshot per dispatch).

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| SAVE-01 | `MIGRATIONS` table empty, `SAVE_VERSION=1`, framework never tested against real saves | `saveMigrations.ts:11-14` | P1 | M | **done** v4.2.48 | Migration framework now tested (13 tests in saveMigrations.test.ts); MIGRATIONS table intentionally empty (no breaking changes yet); documented 3-step process for first real migration |
| SAVE-02 | Soft migrations scattered in `persistedState.ts:259-374` (poem_2 flag retro-fit, cooldownMs re-stamp, legacy mode→phaseFlags, closed-overlay hub restore) — should formalize as v1→v2 steps | `persistedState.ts:259-374` | P2 | M | analyzed | |
| SAVE-03 | No save migration tests | — | P1 | S | **done** v4.2.48 | 13 tests in saveMigrations.test.ts covering edge cases + sequential application + data preservation + future migration template |

---

### 10. Store architecture (STORE) — analyzed ✓

**Sources:** Task 5-world-store-ui. gameStore + 6 stores + slices + selectors + combinedState + crossSliceReads + skillHelpers.

#### Strengths
- 6 independent Zustand stores + rAF-coalesced facade — unusual but justified (engine often needs one slice without composing all 6).
- `combinedState.ts` rAF batching — multiple slice mutations across macrotasks → 1 facade re-render. Tested.
- Selector discipline: `useShallow` for objects, `Object.is` for scalars, 20+ composite hooks for hot paths. Documented in `selectors/README.md`.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| STORE-01 | `worldSlice.ts` (~700 lines) is god-slice — quests + collected poems + poem powers + NPC relations + achievements + daily missions | `worldSlice.ts` | P2 | L | analyzed | Split into questSlice + poemSlice + npcRelationSlice + achievementSlice |
| STORE-02 | Cross-slice write discipline documented but NOT enforced — `uiSlice.ts:245` calls `getPlayerStore().addXp(5)`, `worldSlice.ts` calls `getPlayerStore()` 4× | `uiSlice.ts:245`, `worldSlice.ts` | P2 | M | analyzed | |
| STORE-03 | `cutsceneSlice.triggeredCutscenes` as `string[]` instead of `Set` — comment claims "Zustand serializability" but Zustand handles Sets fine; `Array.includes()` O(n) vs `Set.has()` O(1) | `cutsceneSlice.ts:5-7` | P3 | S | analyzed | Misunderstanding |
| STORE-04 | 79 store files for 6 logical stores — heavy indirection | `src/store/` | P3 | M | analyzed | |
| STORE-05 | `playerSlice.ts` composes 5 sub-slices — borderline god-slice | `playerSlice.ts` | P3 | M | analyzed | |

---

### 11. UI orchestrator (UI) — analyzed ✓

**Sources:** Task 5-world-store-ui. GameOrchestrator + OrchestratorContent + panel stack + usePanelCoordinator + useOrchestratorRuntime + uiLayers + escapeDismissAction.

#### Strengths
- Thin tree (GameOrchestrator 22 LOC → OrchestratorContent 49 LOC) + god-hook.
- Panel stack reducer (64 LOC) — `GAMEPLAY_EXCLUSIVE_PANELS` (quests/inventory/poetry) replaces instead of stacking. Tested.
- `UI_LAYERS` — 22 named z-index layers, comprehensive.
- Escape routing clean: `examine → minigame → panel stack → pause menu → noop`, exhaustive `never`-default.
- Memo + field-wise compare on canvas-only rerender — working.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| UI-01 | `useOrchestratorRuntime` (213 LOC) is god-hook with 13 bundled hooks | `useOrchestratorRuntime.ts` | P2 | M | analyzed | Split into 3-4 focused |
| UI-02 | `MOBILE_CONTROLS=42` sits between `MINIGAME=40` and `COMBAT=50` — touch controls should be above combat UI | `uiLayers.ts` | P3 | S | analyzed | |
| UI-03 | Panel stack can collide with LOADING=100 at ~20 panels deep (PANEL=60 + 20×2 = 100) | `PanelStackContext.tsx:51-56` | P3 | S | analyzed | Theoretical |
| UI-04 | Stale P0 UI-holes warning in ARCHITECTURE.md:281 (Escape/inventory overlap) but :424 marks both resolved — text never updated | `ARCHITECTURE.md:281` vs `:424` | P3 | S | analyzed | DOC-02 overlap |

---

### 12. Audio (AUDIO) — analyzed ✓

**Sources:** Task 5-world-store-ui. MusicEngine + AudioEngine + SharedAudioContext + AudioSettings + SceneAudioController + proceduralAudioCatalog + ambientSounds.

#### Strengths
- **Procedural 3-layer music** (pad + bass + melody), 17 scene configs with hand-tuned scales (minor pentatonic, natural minor, phrygian, lydian, g_minor_exotic, major), root MIDI, osc types, filter freqs/Q, LFO rates/depth, reverb mix/decay, tempo.
- **21 hand-authored NPC leitmotifs** + hash-derived procedural stubs for minor NPCs + 3 poem motifs + 6 emotional transitions with crossfade + stingers. **Wwise/FMOD interactive music hierarchy reimplemented in raw Web Audio.**
- Scene crossfade: `stopMusic(1)` fade → 1100ms delay → `startMusicForScene`. Generation counter invalidates pending callbacks on rapid transitions.
- HMR-safe Proxy singleton for audio engines.
- Reduced motion strips vestibular layers.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| AUDIO-01 | No sidechain ducking — duck is static gain multiplier (0.72 dialogue / 0.58 cinematic), not envelope. AAA ducks pad less than melody | `MusicEngine.ts:98-102` | P2 | M | analyzed | |
| AUDIO-02 | No music layer isolation — pad/bass/melody share masterGainNode, duck together | `MusicEngine.ts` | P2 | M | analyzed | |
| AUDIO-03 | Reverb synthetic plate only — no early reflections, no ER/late split | `AudioEngineCore.ts:18-32` | P3 | L | analyzed | |
| AUDIO-04 | No audio perf monitoring | — | P3 | M | analyzed | |
| AUDIO-05 | `Math.random()` everywhere — unseeded, playback differs every session, not reproducible for QA | `MusicEngine.ts`, `AmbientEngine.ts` | P2 | S | analyzed | Seed it |
| AUDIO-06 | `AudioListener` fixed at origin — no `setListenerPosition`, all spatial sources in world space but listener never moves with camera | — | P2 | S | analyzed | |
| AUDIO-07 | `MusicEngine.dispose` disconnects masterGain but doesn't null it — minor leak | `MusicEngine.ts:858-860` | P3 | S | analyzed | |

---

### 13. Testing (TEST) — analyzed ✓

**Sources:** Task 5-world-store-ui. vitest.config + setupComponentTests + playwright.config + e2e/helpers + validators + narrativeRegistryParity.

#### Strengths
- 324 test files (~22k LOC), 12 e2e specs, ratio ~27:1 (industry sweet spot 10:1-100:1).
- Coverage thresholds 80/80/75/80 on game-logic globs.
- `contentPipelineValidator.ts` (890 LOC) — cross-references every story choice → effect → registry. Real guard.
- `narrativeRegistryParity.test.ts` — lazy vs eager registry, real guard.
- `check-event-map.mjs` — emit/on event names vs defined keys.
- ESLint three-way boundary with real teeth.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| TEST-01 | No save migration tests | — | P1 | S | **done** v4.2.48 | See SAVE-03 — saveMigrations.test.ts (13 tests) |
| TEST-02 | Playwright Chromium only — no Firefox/WebKit | `playwright.config.ts` | P2 | M | analyzed | |
| TEST-03 | No visual regression testing — `visual-smoke.spec.ts` is 17 lines | `e2e/visual-smoke.spec.ts` | P2 | L | analyzed | |
| TEST-04 | No a11y e2e — axe-core not in devDeps | — | P2 | M | analyzed | |
| TEST-05 | No load/stress testing | — | P3 | L | analyzed | |
| TEST-06 | Coverage thresholds not enforced in CI build chain — `npm run build` doesn't run coverage | `package.json:9` | P2 | S | analyzed | |
| TEST-07 | `validate-gltf-assets.ts` checks magic bytes only, not full GLTF validity | `scripts/validate-gltf-assets.ts` | P3 | S | analyzed | |
| TEST-08 | E2E specs slow — act1-smoke has 5 tests at 180s timeout each; full suite likely 30-60min | `e2e/act1-smoke.spec.ts` | P3 | M | analyzed | |
| TEST-09 | E2E helpers full of `try/catch` + `.catch(() => undefined)` + polling loops — UI timing instability indicator | `e2e/helpers.ts` | P2 | M | analyzed | |

---

### 14. Documentation drift (DOC) — analyzed ✓

**Sources:** Task 6-innovations. CHANGELOG + ARCHITECTURE.md + comments + docstrings + ROADMAP references.

#### Items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| P0-DOC-01 | `ROADMAP.md` referenced 12+ times but does not exist — Cursor automations skill will fail | `ROADMAP.md` (created) | P0 | S | **done** v4.2.43 | Created file with historical sprint record + pointer to ROADMAP-IMPROVEMENTS.md |
| DOC-02 | Stale P0 UI-holes warning (ARCHITECTURE.md:281 lists Escape/inventory overlap as P0, :424 marks resolved) | `ARCHITECTURE.md:281` | P3 | S | **done** v4.2.43 | Updated text |
| DOC-03 | `quaterniusNpcSlots.ts:3` stale docstring claims GLBs are "rig references" but medium+ renders them | `quaterniusNpcSlots.ts` | P3 | S | **done** v4.2.44 | Updated — GLBs never rendered at any preset until RPM ships | |
| DOC-04 | ARCHITECTURE.md:131 + DynamicProps.tsx:2-4 claim props pushed "without extra code" but `applyImpulsesToDynamicBodies=false` | `ARCHITECTURE.md:131`, `DynamicProps.tsx:2-4` | P2 | S | analyzed | Pairs with PLYR-04 |
| DOC-05 | `assertNarrativeKind` no-op looks like contract | `contentTruthManifest.ts:110-112` | P3 | S | analyzed | ARCH-05 overlap |
| DOC-06 | NPC visual SoT fragmentation flagged in ARCHITECTURE.md:438 ("устаревшие id в части тестов") | `ARCHITECTURE.md:438` | P2 | M | analyzed | |
| DOC-07 | `mixamoClipsOnDisk.ts:5` stale docstring claims "Empty until imported" but lists 6 CC0 fallback clips | `mixamoClipsOnDisk.ts` | P3 | S | **done** v4.2.44 | Updated — documents CC0 fallbacks (3 Quaternius + 2 UAL + 1 KayKit) |

---

### 15. Innovation audit & iteration pattern — analyzed ✓

**Sources:** Task 6-innovations. CHANGELOG.md (589 lines) + git history + scope verification.

#### Findings
- **All scope claims verified or exceeded**: 27 scenes ✓, 55 quests (actually 68) ✓, 11 enemy types ✓, 7 acts ✓, 6+ endings (actually 10+) ✓, 1300+ tests (actually 1481) ✓, 46 poems ✓, 220 GLBs ✓, 20 Quaternius slots ✓, 201 story-nodes ✓. **Unusually honest.**
- **Iteration pace**: 41 versions v4.2.x in 5 days (peak 17 versions June 16, ~1/hour). v4.0.0 never released (jumped v3.4.0→v4.1.0). v4.2.19 and v4.2.32 silently missing. Single git commit July 2 (after all "version dates" June 11-17).
- **~25-30% of versions are regression fixes from adjacent versions**: v4.2.35 added @formkit/auto-animate → v4.2.36 removed it + migrated to tailwindcss-animate (2 "innovations" for 1 net swap); v4.2.37 fixes shallow-snapshot regression from v4.2.36; v4.2.42 is one-line validator fix as a version.
- **Verdict**: AI-assisted rapid iteration (likely Cursor automations). Real underlying code, but velocity hides fragility.

#### Items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| DOC-07 | CHANGELOG chronology unverifiable from git (single squash commit) | repo | P2 | M | analyzed | Establish git discipline before fixes |
| DOC-08 | `.cursor/skills/volodka-roadmap-automations/` references missing ROADMAP.md | `.cursor/skills/` | P2 | S | analyzed | Pairs with P0-DOC-01 |

---

## Subsystems NOT YET analyzed (pending deep-dive)

These areas were flagged but not deeply explored in iteration 0. Each will get its own iteration.

| # | Subsystem | Why it matters | Est. effort |
|---|-----------|----------------|-------------|
| 1 | **NPC systems** (6 overlapping registries: proceduralNpcAvatarCatalog + npcModelRegistry + npcComposer + quaterniusNpcSlots + RPM catalog + Khronos bootstrap) | Flagged as MEDIUM risk; stale docstrings; test ID mismatches | M |
| 2 | **Narrative/story/quest data integrity** (201 nodes, 7 acts, golden path, 68 quests, 6+ endings, mirror endings, marginalia) | Verify connectivity, no orphan nodes, ending reachability | L |
| 3 | **Scene definitions & prop dressing** (1400-line sceneDefinitions + sceneDefinitionGenerator + sceneInheritance + scenePropDressing) | Collider correctness, doorway logic, lighting | M |
| 4 | **Accessibility & i18n** (AccessibilityManager, accessibilitySettings, reduced-motion, i18n/ru.ts) | A11y claims in README, axe-core absent | M |
| 5 | **Quest system deep-dive** (QuestTracker 795 LOC god object, questPresentation, questAcceptDeferral, questTimeLimits) | ARCH-17 god object split | L |
| 6 | **Dialogue system** (dialogueNodes, dialogueRenderer, resolveDialoguePresentation, poem-gated branches) | Poem TTL dialogue gates (v4.2.36) verification | M |
| 7 | **Crafting/trading/economy/skill tree/perks** (craftingRecipes, tradingData, skillTree, perks, passiveSkillEffects) | Untouched by iteration 0 | M |
| 8 | **Minigames** (hacking, memoryPuzzle, codebreaker, openstackTerminal, poetryComposition) | MINIGAME z-index layer, escape routing | M |
| 9 | **Asset pipeline scripts** (5454 lines across 30+ scripts) | Tooling health, idempotency | L |
| 10 | **Vite/build/deploy optimization** (vite.config, chunks.ts, vercel.json, deploy archive) | Bundle budget enforcement, chunk strategy | M |

---

### 16. Animation pipeline & NPC models (ANIM) — analyzed ✓

**Sources:** Task 8-anim-pipeline. Player model, Mixamo, RPM, Quaternius, NPC registry, schedules, composer.

#### Strengths
- Player GLB (Volodka) — real Quaternius Adventurer, 10,196 tris, 24 embedded clips.
- 6 CC0 fallback animation clips shipped (idle/walk/talk/sit/sleep/work) — functionally work via bone retargeting.
- 25 unique NPC GLBs ship on disk (125 files: lod0/draco/meshopt/lod1/lod2 variants).
- ComposerRigDriver retargets Quaternius bones onto procedural capsule figures — functional animation runtime.
- NPC schedules (33/34 NPCs scheduled) drive animation state at runtime.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| ANIM-01 | `_rigs/` directory (20 GLBs, 32 MB) — zero runtime callers, `resolveQuaterniusStagedRigUrl` dead code | `public/models/npcs/_rigs/`, `quaterniusRigCatalog.ts` | P1 | S | **done** v4.2.44 | Deleted _rigs/ + QUATERNIUS_STAGED_RIG_URLS + resolveQuaterniusStagedRigUrl |
| ANIM-02 | Fake LOD chains — player LOD1/LOD2 same tris as LOD0 (+48% file size); NPC LOD1/LOD2 same tris (+35%). Referenced in assetManifest but LOD system functional, just data is fake | `assetManifest.ts`, `public/models/` | P2 | L | analyzed | Needs real Blender decimation pass, not deletion |
| ANIM-03 | `UNSAFE_IDLE_CLIP_PATTERN` missing 'tpose'/'t_pose' — future GLB with TPose clip could leak as idle | `playerClipResolution.ts:48` | P2 | S | **done** v4.2.44 | Added tpose\|t_pose to pattern |
| ANIM-04 | `marat_echo` only NPC without schedule (33/34 scheduled) | `npcSchedules.ts` | P2 | S | **done** v4.2.44 | Added MARAT_ECHO_SCHEDULE (library_day, 24h, work) |
| ANIM-05 | 5 NPCs use GENERIC_NPC_COMPOSE_RECIPE (chk_guest_analyst, chk_guest_devops, guild_defector, marat_echo, street_poet) — no per-NPC visual identity | `npcComposer/recipes.ts` | P3 | M | analyzed | |
| ANIM-06 | 4 NPCs (lena, lyonya, oleg, sergey) have composer recipe but no own GLB — reuse another NPC's GLB as rig driver | `quaterniusRigCatalog.ts` | P3 | S | analyzed | Works for animation, no visual identity |
| ANIM-07 | All 34 NPCs render as procedural silhouettes at ALL presets — 25 unique GLBs ship but never rendered (RPM on disk = 0, `shouldRenderGltfNpc` always false) | `npcModelRegistry.ts`, `rpmNpcOnDisk.generated.ts` | P1 | XL | analyzed | Decision needed: commit to RPM pipeline (manual 20-avatar export) OR accept procedural silhouettes forever |
| ANIM-08 | `fps_arms.glb` is Khronos Vanguard full-body (2.1 MB, 11,376 tris) — used as FPS arms but mesh hidden, only clips used | `public/models/fps/fps_arms.glb` | P3 | M | analyzed | Replace with smaller arms-only GLB or delete |
| ANIM-09 | Mixamo "blocked" is real (Adobe sign-in) but stale docstring claimed clips ARE Mixamo when they're CC0 fallbacks | `mixamoClipsOnDisk.ts:5` | P3 | S | **done** v4.2.44 | See DOC-07 |

---

### 17. Narrative content audit (NARR) — analyzed ✓

**Sources:** Task 7-narr-content. Story nodes, quests, dialogue, endings, golden path, CHK Tolpa.

#### Strengths
- **Content exceeds scope claims**: 302 story nodes (claimed 201, +50%), 83 quests (claimed 68, +22%), 11 endings + 9 mirrors + true_end (claimed 6+, +83%), 309 dialogue nodes, 85,394 chars of Russian prose.
- **Zero gaps**: 0 empty text/speaker/choices, 0 TODO/FIXME/PLACEHOLDER, 0 broken pointers, 0 validator errors.
- **Golden path integrity**: 117 spine steps, 116/117 with goldenPath marker, 100% guidance coverage.
- **CHK Tolpa questline complete**: 15 quests, 41 dialogue, 8 NPCs, 17 trigger zones, 8 schedules.

#### Weaknesses / items

| ID | Title | File:line | Priority | Effort | Status | Notes |
|----|-------|-----------|----------|--------|--------|-------|
| NARR-01 | 5 orphan story nodes — full prose but no player-reachable entry point (wiring gap, not content gap) | `act1Extended.ts:397`, `act2.structure.ts:861`, `act3.structure.ts:1521`, `act5.structure.ts:1323, 2273` | P2 | M | analyzed | Needs narrative design decision: wire via trigger zones OR delete. Prose preserved in git history if deleted. |
| NARR-02 | 2 cutscene-only-reachable nodes (poem_virus_truth, join_resistance) — orphaned unless cutscene trigger fires | `cutscenes.ts:528, 573` | P3 | S | analyzed | Verify cutscene trigger conditions achievable in normal play |

---

## Execution phases (after all analysis complete)

### Phase 0 — Blockers & quick wins (P0 + S-effort P1)
- P0-CMBT-01, P0-CMBT-02: give boss + void_echo special attacks
- P0-GFX-01: remove `needsUpdate` from applyWetness
- P0-DOC-01: create ROADMAP.md or remove refs
- P0-WRLD-01: DECISION (real streaming vs delete) — then execute
- ARCH-03: move top-level binders to reviveGameEngine()
- ARCH-07, ARCH-09: delete dead code
- GFX-22: wire budgets:check into build

### Phase 1 — High-risk architecture (P1)
- ARCH-02: registration API for engine subsystems
- GFX-02, GFX-03, GFX-04: adaptive quality memory pressure + surgical eviction
- POEM-04: combat TTL expiry
- STRS-01, STRS-02: wire stress into combat
- CMBT-05: remove silent enemy type swap
- SAVE-01, SAVE-03, TEST-01: migration framework + tests
- POEM-01: derive mechanics from themes (XL — may defer to Phase 3)
- POEM-02: unify combo systems

### Phase 2 — Tech debt (P2)
- STORE-01: split worldSlice
- ARCH-17: split QuestTracker
- UI-01: split useOrchestratorRuntime
- ARCH-15, ARCH-16: GuidedStoryManager EventBusScope + revive
- GFX-06, GFX-07: GPU instancing + KTX2 (big perf wins)
- PLYR-07: jump buffering
- WRLD-02...05: world layer cleanup (post P0-WRLD-01 decision)

### Phase 3 — Polish & depth (P3)
- PLYR-08...10: IK, root motion, movement states
- STLTH-01, STLTH-02: occlusion, offensive stealth
- CMBT-03, CMBT-04: combat depth (scope decision)
- GFX-10...15: occlusion culling, CSM, SSR, WebGPU
- AUDIO-01...03: sidechain, layer isolation, reverb ER/late

---

## Decision log (choices made during analysis)

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-02 | Roadmap lives at `/home/z/my-project/ROADMAP-IMPROVEMENTS.md` (persistent), not in /tmp/Volodka (cleaned between sessions) | tmp is volatile; roadmap must survive |
| 2026-07-02 | Re-clone Volodka to /tmp/Volodka at start of each analysis iteration | tmp cleanup is expected; worklog + roadmap persist |
| 2026-07-02 | Append-only roadmap; mark `superseded` not delete | Preserves analysis history for audit |
| 2026-07-02 | Source of truth = code, not CHANGELOG/README | User explicit requirement; CHANGELOG has phantom features |

---

## Open questions for user

1. **P0-WRLD-01 decision**: commit to real streaming (recast-wasm navmesh, position-triggered transitions, per-chunk Suspense) OR delete the world/streaming layer entirely? This is XL effort vs XL effort — need your call before Phase 0.
2. **Git discipline**: establish commit-per-fix with roadmap refs before we start? (recommended) Or batch fixes?
3. **POEM-01 scope**: deriving mechanics from poem themes is the biggest innovation opportunity but XL effort. Include in Phase 1 or defer?
4. **Iteration order for pending subsystems** (1-10 above): user's choice, or follow the listed order?
5. **Branch strategy**: work on `main`, or create `improvements/` branch?
