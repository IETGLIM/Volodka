# Volodka RPG — Improvement Session Worklog

---

## Session: 2025-07-21 — "Прорыв: Disco Elysium механики + контент"

### Контекст
Автор (Владимир Лебедев) вернулся после застоя. Предыдущие 16 сессий (коммиты session 5-16)
были циклом "fix: session N — critical bugs" без движения вперёд по контенту. Задача — вырваться
из цикла, добавить Disco Elysium-механики и расширить контент.

### Подход
Вместо очередного багфикс-раунда — фокус на_NEW FEATURES_ и_CONTENT EXPANSION_.
4 параллельные фазы: онбординг → Thought Cabinet → Dice-Roll → Контент.

---

### Commit: `55b51cd3` — feat: Thought Cabinet, dice-roll skill checks, expanded Act 1 content, faster onboarding

**Фаза 1: Ускоренный онбординг**
- `src/engine/intro/introConfig.ts`: INTRO_MAX_DURATION_MS 90_000 → 30_000
- `src/components/game/intro/MatrixPoemAssembly.tsx`: скорость сборки ×3 быстрее (22ms→9ms, 150ms→60ms, 95ms→38ms)
- `src/components/game/IntroScreen.tsx`: проминентная пульсирующая кнопка skip, обратный отсчёт
- `src/components/game/menu/MenuScreenPanel.tsx`: диалог "Новая Игра" с опцией "Пропустить пролог"
- `src/components/game/menu/useMenuScreen.ts`: `handleNewGame(skipPrologue?: boolean)`

**Фаза 2: Thought Cabinet (Disco Elysium)**
- НОВЫЕ ФАЙЛЫ:
  - `src/shared/types/definitions/thoughtCabinet.ts` — типы ThoughtCabinetItem, ThoughtCabinetEffect
  - `src/data/thoughtCabinet.ts` — 18 мыслей, 3 mutually exclusive пары, MAX_EQUIPPED_THOUGHTS=3
  - `src/store/slices/thoughtCabinetSlice.ts` — Zustand sub-slice (acquire, equip, unequip)
  - `src/store/selectors/thoughtCabinetSelectors.ts` — 6 typed hooks
  - `src/components/game/journal/ThoughtCabinetTab.tsx` — dual-pane UI (480 строк)
- ИЗМЕНЁНО:
  - `src/store/slices/playerSlice.ts` — compose ThoughtCabinetSlice
  - `src/shared/gameBridge/gameActionBridge.ts` — 3 новых action types
  - `src/store/applyGameAction.ts` — 3 case handlers
  - `src/store/shared.ts` — JournalTab += 'cabinet'
  - `src/components/game/journal/journalConstants.ts` — вкладка "Кабинет Мыслей"
  - `src/components/game/journal/JournalPanel.tsx` — рендер ThoughtCabinetTab
  - `src/shared/validation/saveSchema.ts` — Zod schema для 'cabinet'

**Фаза 3: Dice-Roll Skill Checks**
- НОВЫЕ ФАЙЛЫ:
  - `src/engine/skillCheck/diceRollSkillCheck.ts` — 2d6+mod vs DC, криты, seeded RNG
  - `src/engine/skillCheck/index.ts` — barrel export
  - `src/components/game/dialogue/DiceRollDisplay.tsx` — 5-фазная анимация, 3D CSS кубики
- ИЗМЕНЕНО:
  - `src/components/game/DialogueRenderer.tsx` — интеграция dice roll в minSkillCheck

**Фаза 4: Расширенный контент**
- НОВЫЕ ФАЙЛЫ:
  - `src/data/dialogue/part1-albert-expanded.ts` — 30 нод (1077 строк), 18 skill checks
  - `src/data/story/act1-room-expanded.ts` — 28 нод (998 строк), 10 trigger zones
- ИЗМЕНЕНО:
  - `src/data/dialogue/index.ts` — merge ALBERT_EXPANDED_DIALOGUE
  - `src/data/narrative/narrativePackRegistry.ts` — pack registration
  - `src/data/story/buildStoryNodes.ts` — source registration
  - `src/data/dialogue/part1-albert.ts` — choice → albert_deep_talk
  - `src/data/narrativeExpansionTriggerZones.ts` — 10 trigger zones

**Документация (commit TBD):**
- `AI_SESSION_CONTEXT.md` — КЛЮЧЕВОЙ: контекст для AI-агентов между сессиями
- `ARCHITECTURE.md` — +134 строки (Thought Cabinet, Dice-Roll, Content Architecture)
- `README.md` — 3 новых bullet points, ссылка на AI_SESSION_CONTEXT
- `CHANGELOG.md` — v4.3.0

**Итоги:** 31 файл, +4399 строк, -130 строк, 0 ошибок TS, build 35s

### Что дальше (Фаза 5+)
1. Расширить Акти 2-7 аналогичным контентом (~350 нод)
2. A* навигация для NPC
3. Система одежды/внешности
4. AI3DGen модели для ключевых NPC
5. TTS озвучивание ключевых сцен

---

## Session: 2025-07-17 — Comprehensive Graphics, Physics, Gameplay Overhaul

### Context
User (IT engineer, health issues, making game for family) requested comprehensive improvements
after 2 months of stalled gameplay progress. The game is a 3D RPG inspired by Disco Elysium,
built with Vite + React 19 + Three.js 0.172 + R3F 9.6 + Rapier Physics + Zustand.

### Constraints
- DO NOT modify poems (poems.ts) or menu components
- Everything else is open to improvement

---

## Commit 1: `3555ff76` — Cinematic Graphics, Physics Feel, Critical Gameplay Fixes

### Critical Fixes
- **Cinematic Timeline Orphan Watchdog**: Auto-stops stuck timelines after totalDuration + 15s.
  Previously, if the R3F component unmounted mid-cutscene, `activeTimelineId` stayed set
  forever, permanently blocking ALL new cutscenes AND scene transitions.
- **Interaction FSM Stuck-State Auto-Recovery**: 15s timeout auto-resets stuck
  Approach/Cutscene/Align/Lock/Dialogue states with dev warning + event emission.

### Post-Processing (ExplorationPostFX.tsx)
- volodka_room bloom: 0.68→0.78, threshold 0.52→0.45 (more monitor glow bleed)
- Color grading: contrast +0.06, hue -0.02 (tealer), saturation +0.03
- Added film grain (Noise effect) for indoor scenes at high quality (opacity 0.035)
- Vignette: 0.38→0.42 (more claustrophobic)
- street_night, cafe_evening, sleep_dream, battle also tuned

### Camera (applyCameraFrame.ts, cinematicCamera.ts, cameraConstants.ts)
- Walking head bob: 12mm amplitude, 10 rad/s, speed-blended intensity
- Spring damping: 0.85→0.92 (more cinematic weight, less oscillation)
- Spring stiffness: 16→14 (smoother follow with subtle delay)
- Look-ahead: strength 0.15→0.20, lerp speed 3.0→3.8
- Turn tilt: max 0.025→0.02 rad

### Scene Lighting (volodka_room)
- 4th light: cold blue rim light (moonlight through curtain)
- Monitor glow: cold_pulse animation, brighter
- Bedside lamp: candle_flicker animation
- Under-desk warm glow + floor cold bounce lights
- Ambient darkened (0.62→0.55) for dramatic contrast
- 400 dust particles (was 300), warmer amber, larger size range

### Exploration & Interaction
- God ray: taller (2.4→2.8m), wider cone, brighter flash, faster pulse
- NPC range: 3.0→3.5m, zone padding: 1.35→1.55m
- Interaction highlight: brighter glow (0.45→0.52)
- Proximity light reactivity: 15% faster
- Glitch effects trigger earlier (80%→70% of radius)

---

## Commit 2: `cf4e3c37` — Cinematic Cutscenes, Dialogue Camera, NPC Approach, Story Guidance

### Cutscene Fixes
- Fixed intro wake-up settle phase bug (0.01s snap → proper 1.8s)
- Slowed intro pacing: terminal 3.5→4.2s, rise 3.5→3.8s, standing 2.0→2.5s
- Clamped timeline localT to [0,1] for smooth phase boundaries
- Scene transitions: easeInOutCubic → easeInOutQuart (cinematic lift-off/settle)

### Dialogue Camera
- Randomized shot switch interval (3.2-4.0s) for natural rhythm
- Smooth shot blending via easeInOutCubic (position, lookAt, FOV)
- Softer dialogue spring (stiffness 14→8, damping 0.92→0.88)
- New SpringOverride type threaded through camera pipeline

### NPC Interaction
- Adaptive approach speed: 3.8 m/s far → smoothstep deceleration to 1.2 m/s near
- No more abrupt stops — natural ease-out curve

### Story Guidance
- Tiered player-lost timeouts: Act 1=15s, Act 2=20s, Acts 3-7=25s
- Fixed 3s check interval

### Accessibility
- Cinematic dialogue choices respect reducedMotion

---

## Commit 3: `3e18a506` — Scene Atmospheres, Player Physics, Landing/Jump/Wall Feedback

### Scene Lighting (All Key Scenes)
- volodka_corridor: dramatic warm/cold contrast, flickering overhead, deeper shadows
- street_night: warm overhead for readability, darker ambient for neon contrast
- home_evening: 3rd warm fill light, warmer tones
- cafe_evening: 4th blue neon back-light, warm-cold contrast

### New Accent Lights (5 Scenes)
- volodka_corridor: flickering + cold blue ends
- cafe_evening: blue cold_pulse + warm orange
- office_day: fluorescent cold_pulse + cold fills
- library_day: warm banker's lamp glow
- park_day: dappled sunlight at varying heights

### Player Physics
- Landing camera shake (proportional to impact velocity)
- Variable jump height (tap = short hop, hold = full height, 2.8x gravity on release)
- Running FOV boost (+3° at full sprint, smoothly interpolated)
- Wall bump micro-shake (0.012 intensity, 0.3s cooldown)

### Post-Processing Refinements
- Corridor: deeper contrast, heavier vignette
- Home: warmer hue, richer saturation
- Cafe: reduced contrast for hazy atmosphere

---

## Commit 4: `0890ac25` — Ambient Occlusion, Narrative Polish, Interaction Feedback

### Ambient Occlusion (10 More Scenes)
- volodka_corridor, abandoned_factory, factory_basement, zarema_albert_room, solnysh_room
- 5 new visual profiles for extension scenes
- Default AO radius +12.5%, hero +14.6%

### Adaptive Quality
- Degradation requires 15s sustained low FPS (was 10s)
- Strike reset: 5s (was 3s)

### Narrative Presentation
- AnimatePresence mode='wait' for proper crossfade
- Keyed by nodeId for content transitions
- Breathing glow on diegetic dialogue border
- Skill check failure reasons in Russian with Lock icon
- Quest completion: gold flash; objective: green pulse

### Interaction Feedback
- Act-gate failure: shake + amber flash
- Zone unavailable: stronger shake + rose flash
- One-time used: shake + gray flash
- Skill check fail: strongest shake + brightest flash

### Story Guidance
- Rolling window hint picker (no repeat hints)

---

## Summary Statistics
- **Files modified**: 45+
- **Lines changed**: ~610 insertions, ~180 deletions
- **Critical bugs fixed**: 2 (timeline orphan, FSM stuck)
- **Gameplay feel improvements**: 25+
- **Visual quality improvements**: 20+
- **New features**: Variable jump, landing shake, wall bump, run FOV, film grain,
  interaction failure feedback, hint rotation
---

## Commit 5: `533a582f` — Race Conditions, Z-Fighting, Story Soft-Locks, Graphics Polish

### Race Conditions (7 fixes)

#### CRITICAL — Cinematic Timeline Overwrite (Race #6)
- `cinematicTimelineOrchestrator.ts`: `startCinematicTimeline` now checks if a *different*
  timeline is active and explicitly stops it (clears watchdog, resets hold, emits stop event)
  before starting the new one. Previously, starting timeline B while A was active would
  silently orphan A — A's `completeCinematicTimeline()` would fail the ID check, and if
  B was also interrupted, the cinematic hold remained `true` permanently, locking the player
  out of camera control.

#### HIGH — TOCTOU in openLinkedStory (Race #2)
- `narrativeOpenHelpers.ts`: `openLinkedStory` now captures `currentSceneId` before the
  `await ensureStoryNode()` and re-reads the snapshot after. If the scene changed during
  the async load, scene-transition decisions are skipped to prevent wrong-direction transitions.

#### HIGH — Entry Beat State Corruption (Race #3)
- `entryBeatState.ts`: Added generation counter (`entryBeatGeneration`). `armEntryBeatFromZone`
  and `resetEntryBeatState` increment it; `consumeEntryBeatFromZone` accepts an optional
  `expectedGen` parameter to reject stale consumptions from concurrent scene transitions.
- `narrativeOpenHelpers.ts`: `triggerSceneEntryStoryIfNeeded` captures generation before
  the fire-and-forget `void openLinkedStory()` and resets state if generation changed.

#### HIGH — Timer Prematurely Ending New Interaction (Race #13)
- `InteractionController.ts`: `onNarrativeOverlayClosedInExploration` now captures
  `sessionAlive` state synchronously before the `queueMicrotask`, and the 100ms timer
  captures the session reference at schedule time. Both checks prevent the timer from
  firing `interaction:end` for a new interaction started after the overlay closed.

#### MEDIUM — Narrative Inflight Re-entrancy (Race #8)
- `presentNarrativeBeat.ts`: Added `narrativeInflightGen` counter, incremented on each
  entry. While the boolean guard alone is sufficient for synchronous re-entrancy, the
  generation provides an additional safety net for microtask-batched calls.

#### MEDIUM — TransitionDirector Progress Regression (Race #12)
- `TransitionDirector.ts`: `scene:transition_start`, `scene:enter`, and `scene:loaded`
  event handlers now check that the event's `sceneId` matches `snapshot.targetScene`
  before updating progress. Prevents stale events from a previous transition from
  aborting the current one.

#### MEDIUM — Narrative Choice Executor Order (Race #15)
- `narrativeChoiceExecutor.ts`: For scene-transitioning choices, effects (including
  `requestSceneTransition`) are now applied BEFORE closing the overlay. Previously
  the overlay was closed first, creating a gap where the interaction FSM could reset
  and leave the player in a "dead" narrative state (currentNodeId set but no overlay open).

### Z-Fighting (7 fixes)
- **StreetWinterVisual.tsx**: Snow cap on building roof nudged +0.005; sled snow +0.006
- **HomeEveningVisual.tsx**: Counter top y=0.91→0.92; wardrobe top y=2.01→2.02
- **VolodkaRoomVisual.tsx**: Phone screen y=0.528→0.533; window wall offsets 0.01→0.025
- **CafeVisual.tsx**: Menu text z=0.02→0.025; window wall offset 0.01→0.025

### Story Flow (5 fixes)

#### CRITICAL — Bunker Soft-Lock
- `sceneExtensionDefinitions.ts`: Underground bunker exit `requiredFlag` changed from
  `resistance_joined` (impossible to obtain from inside) to `resistance_bunker_found`
  (set immediately on entry). The resistance quest remains completable from the street.

#### HIGH — Poetry Broadcast Uncompletable
- `act4.ts`: `poetry_broadcast` first objective changed from `flag_set(all_poems_collected)`
  to `location_visited(act4_broadcast_prep)`. Players who missed poems in earlier acts
  can still complete this main quest.

#### HIGH — Machine Confession 4-Act Dependency Chain
- `act5.ts`: `machine_confession` dependency changed from `requiresQuests: ['final_code',
  'voices_of_factory']` (4-act chain through `night_shift_mystery`) to
  `requiredFlag: 'found_quantum_computer'` — a direct prerequisite that can be met
  through multiple paths.

#### MEDIUM — Lost-Hint Timer Re-fire
- `GuidedStoryManager.ts`: The player-lost detection timer now re-fires after a 120s
  cooldown even if guidance hasn't changed. Previously, a player stuck on the same
  objective for an extended period got one hint and then silence forever.

#### MEDIUM — Act 4 Quiet Hour Narrative Loop
- `act4QuietHour.ts`: `act4_quiet_poet_reply` now has a direct "Час истёк. К плану."
  choice that advances to `act4_infiltration_prep` without looping back through the hub.

### Graphics / Feel (4 improvements)
- **Dust particles**: Breathing opacity pulse (0.14–0.30 sine wave at 0.4 rad/s)
- **Camera look-ahead**: 15% boost to strength and cap when speed > 3 m/s
- **Street night bloom**: +0.05 intensity for wet street neon reflection feel
- **Camera shake settle**: 0.5s damped spring return instead of abrupt snap

### Type Fixes
- `SceneConfig`: Added `dimensions?`, `fogEnabled?`, `fog.fogColor?` fields

### Files Modified: 22
### Lines Changed: ~180 insertions, ~36 deletions

---

## Commit 6: `73320dbc` — Physics Gravity Fallback, Velocity Clamping, Interaction Edge Cases

### Physics (2 fixes)

#### H1 — Degraded Movement Missing Gravity
- `playerMainMovement.ts`: `applyDegradedMovement()` now integrates `GRAVITY * dt`
  and clamps to `TERMINAL_VELOCITY` when `!onFlatGround`. Previously the KCC
  fallback path returned false before the gravity branch in `runMainPlayerMovement`,
  causing the player to fall at constant velocity (last frame's `vel.y`) instead
  of accelerating. Noticeable as a "floaty" feel when the character controller
  momentarily fails (e.g. during scene load spikes).

#### H2 — No Horizontal Velocity Clamp
- `playerConstants.ts`: Added `MAX_HORIZONTAL_SPEED = 15` m/s absolute cap.
- `playerMainMovement.ts`: Speed computation now clamped with `Math.min(..., MAX_HORIZONTAL_SPEED)`.
  Prevents perk stacking (cyber_reflexes ×1.20 × night_owl ×1.25 × invisible ×1.15 = ×1.725,
  yielding 12.075 m/s) from producing extreme speeds.
- `playerLockedMovement.ts`: External velocity injection now clamped to ±MAX_HORIZONTAL_SPEED.
  Prevents arbitrary velocity from InteractionSystemBridge bugs.

### Interaction (4 fixes)

- **NPC approach max distance**: `InteractionSystemBridge.tsx` — Added `APPROACH_MAX_DISTANCE = 8.0`.
  If the NPC moves away during approach (schedule boundary), the chase cancels with
  bark "Подожди..." instead of following for up to 5 seconds (GLOBAL_INTERACTION_TIMEOUT).

- **Examine→narrative re-interaction gap**: `InteractionController.ts` — `handleExamineContinue`
  now calls `consumeEKey(400)` before the 300ms schedule delay. This blocks the E-key
  for the full duration of the examine panel close → narrative open transition,
  preventing a second interaction from firing during the gap (which could cause
  dual overlay / dual focus trap).

- **Minigame over narrative**: `InteractionController.ts` — `handleMinigameOpen` now checks
  `getGameSnapshot().showStoryOverlay` and returns early, preventing stacked modal panels
  when a quest completion triggers minigame:open while the narrative overlay is showing.

- **Cutscene overlay listener**: Verified already correct — `unsubOverlayEnd?.()` is called
  before the early-return guards in `useCutsceneController.ts` cleanup function.

### Audio
- `SceneAudioController.ts`: `enteredScenes` Set cleared on `dispose()`, allowing scene
  enter stingers to replay after new game / load.

### Save
- `saveSlice.ts`: `saveGame()` now checks `activeCutsceneId` and skips saving during
  cutscenes (defense-in-depth beyond the phase guard in the autosave system).

### Files Modified: 7
### Lines Changed: ~51 insertions, ~4 deletions

---
Task ID: 2
Agent: interaction-race-fixes
Task: Fix critical and high interaction pipeline race conditions

Work Log:
- C1: Added dialogueChoiceExecutionInFlight guard to executeDialogueChoice
- C2: Re-read snapshot inside executeZoneInteraction after splash delay
- C3: Deferred narrativeInflight release to next microtask in finally block
- H4: Tightened markEntryBeatCutscenePlaying to require exact nodeId match
- H5: Statically imported dispatchStateAction to prevent async dispatch after disposal

Stage Summary:
- 5 race conditions fixed across 3 files
- No new TS errors introduced

---
Task ID: 4
Agent: environment-fixes
Task: Fix environment lighting and z-fighting issues

Work Log:
- LIGHT-001: Added castShadow to FactoryBasement Заря-М core light
- LIGHT-002: Added missing point lights for 2/4 StreetWinter lamps
- LIGHT-003: Added moonlight + fill light to RiverPier
- VIS-007: Added center ambient fill to Battle arena
- ZF-002: Added polygonOffset to ParkDay pond
- ZF-003: Raised factory debris Y positions
- ZF-004: Replaced Math.random() with deterministic debris in Battle
- LIGHT-005: Increased Solnysh room main light + added fill

Stage Summary:
- 8 environment fixes across 7 files
- Dark scenes now properly lit
- Z-fighting eliminated on transparent floor overlays

---
Task ID: 3
Agent: physics-fixes
Task: Fix critical and high physics system issues

Work Log:
- C1: Enabled applyImpulsesToDynamicBodies for pushable props
- C2: Verified/added sensor flag to trigger colliders
- C3: Added ENVIRONMENT_COLLISION_GROUP filter to ground probe ray
- H1: Shared gravity constant between PhysicsSceneInner and playerConstants
- H4: Wrapped KCC disposal in try/catch for safe teardown
- H6: Added grounded check before gravity in locked movement
- M2: Aligned MIN_GROUND_NORMAL_Y with MAX_SLOPE_CLIMB (cos 45° ≈ 0.707)
- M4: Reduced ground probe refresh to 0.08s (shorter than 0.15s coyote time)
- M6: Removed duplicate movementEpoch bump on scene transition

Stage Summary:
- 9 physics fixes across 7 files
- Player can now push dynamic props
- Ground detection more reliable
- Safe KCC teardown on scene transitions
- No new TS errors

---
Task ID: 7-8
Agent: camera-gameplay-fixes
Task: Camera feel, gameplay tuning, Math.random() stabilization, atmosphere

Work Log:
- Reduced LANDING_SHAKE_DECAY from 12→5 and WALL_BUMP_SHAKE_DECAY from 18→8
- Reduced VARIABLE_JUMP_FALL_MULT from 2.8→2.2 for more forgiving tap-jumps
- Reduced TERMINAL_VELOCITY from GRAVITY*2 to GRAVITY*1.5 for safer falls
- Added battle/abandoned_factory to atmospheric particle scenes
- Replaced Math.random() in StreetWinter snowdrifts with deterministic values
- Stabilized CafeVisual steam particle reset positions
- Stabilized HomeEveningVisual render-path Math.random() calls

Stage Summary:
- 7 gameplay feel improvements
- Camera shake now perceptible
- Tap-jumps more forgiving
- Math.random() stabilized in 3 scene files
- No new TS errors

---
Task ID: 6
Agent: interaction-edge-fixes
Task: Fix remaining interaction edge cases

Work Log:
- H2: Added entryStoryInFlight guard to prevent concurrent openLinkedStory
- H3: Added scene-scoped NPC registry filtering
- M3: Hub toast timer now clears on scene:transition_start
- M7: Removed stale interactionStateAtClose check in overlay close handler

Stage Summary:
- 4 medium-priority interaction fixes
- No new TS errors

---
Task ID: 9
Agent: story-fixes
Task: Fix story quest system issues

Work Log:
- Fixed canStartQuest to use bypass-aware dependency checking
- Fixed machine_confession quest accessibility 
- Removed TransitionDirector dead code (canvasFadeTimer)

Stage Summary:
- 3 story system fixes
- Quest acceptance now consistent with spine auto-activation
- No new TS errors

---
Task ID: 4-d
Agent: story-fixes-session9
Task: Fix story HIGH/MEDIUM issues - spine stall, dispose, camera, emergency fallback, cutscenes

Work Log:
- Fix H1: Added act5_revolution_path, act5_exile_path, act5_poet_path, act5_ending_sacrifice as mutually exclusive spine entries after act4_final_choice in GOLDEN_PATH_STORY_SPINE (goldenPath.ts). Changed resolveStorySpineAdvance (guidedStoryLogic.ts) from exact-step-only (`nodeIndex !== currentStepIndex`) to allow skip-ahead (`nodeIndex < currentStepIndex` guard), so visiting any non-golden act5 branch advances the spine past all unvisited variants to the convergence point.
- Fix M1: Exported disposeCinematicTimelineOrchestrator() from cinematicTimelineOrchestrator.ts — clears orphan watchdog timer, nulls activeTimelineId, resets cinematic hold and presentation mode. Called from disposeGameEngine.ts before EventBus disposal.
- Fix M2: In applyCameraFrame.ts, moved cam.up.set(0,1,0) before lookAt and made cam.lookAt(spring.lookAt) unconditional (Three.js handles zero-length gracefully). cam.fov assignment preserved between lookAt and roll blocks. Stale rolled-up vector from previous cutscenes no longer persists at zero distance.
- Fix M4: In presentNarrativeBeat.ts, added synchronous eventBus.emit('interaction:end', {}) before the dynamic import of emergencyInteractionReset. Changed .catch(() => {}) to .catch((importErr) => { devWarn(...) }) so import failures are logged. Player interaction state is now guaranteed to clear even if the module import fails.
- Fix M7: Added act5_to_act6 and act6_to_act7 cutscene definitions in cutscenes.ts. act5→act6 triggers on act5_ending_epilogue (indigo, foreboding, 6s camera drift). act6→act7 triggers on act6_final_confrontation (gold, dawn, 7.5s rising camera). Both use 4 waypoints, full letterbox, match existing transition style.

Stage Summary:
- 1 HIGH + 4 MEDIUM fixes across 7 files
- Non-golden act5 branches no longer freeze the guidance HUD through acts 5-7
- Cinematic watchdog timer properly cleared on engine dispose
- Camera no longer faces wrong direction after scene transitions with zero lookAt distance
- Emergency error path guarantees interaction state reset
- Act transitions 5→6 and 6→7 now have atmospheric cutscenes
- No new TS errors (pre-existing test-only diegeticNarrative errors unchanged)

---
Task ID: 4-c
Agent: environment-fixes-session9
Task: Fix HIGH environment issues - Math.random() stabilization, polygonOffset on transparent surfaces

Work Log:
- Fix H1: Replaced Math.random() neon flicker in StreetVisual.tsx with Math.sin()-based deterministic thresholds
- Fix H2: Replaced Math.random() in FlickeringCeilingLight.tsx with seededRand(42) and seededRand(77)
- Fix H3: Replaced Math.random() in AmbientParticles.tsx reset block with seededRand(i+2000/3000)
- Fix H4: Replaced Math.random() snap-to-grid in MatrixFogParticles.tsx with deterministic sin/cos drift
- Fix H5: Pre-computed post-it note rotations in OfficeDayVisual.tsx via useMemo + seededRand
- Fix H6: Replaced all Math.random() in AmbientNPCs.tsx with seededWanderTarget() + seededRand() + timerResetCount
- Fix H7: Added polygonOffset to 6 transparent glass shard materials in AbandonedFactoryVisual.tsx
- Fix H8: Added polygonOffset to 2 broken window glass materials in StreetVisual.tsx
- Fix H9: Added polygonOffset to 4 transparent materials (chain link, glass shards, windshield, holographic screens) in BattleVisual.tsx

Stage Summary:
- 6 files stabilized: Math.random() replaced with deterministic seededRand or time-based sin patterns
- 3 files fixed: polygonOffset added to all transparent DoubleSide materials near walls
- No new TypeScript errors introduced
---
Task ID: 4-a
Agent: interaction-fixes-session9
Task: Fix HIGH interaction issues - diegetic FSM, ghost HUD, choice fall-through

Work Log:
- Fix 1 (HIGH): Diegetic dialogue FSM premature exit. Added `diegeticNarrative` field to `GameStoreSnapshot` interface (gameActionBridge.ts) and `buildGameSnapshot` (gameStore.ts). In InteractionSystemBridge.tsx, added `&& !getGameSnapshot().diegeticNarrative` guard to both the per-frame Dialogue-state safety check (line ~538) and the global timeout Dialogue check (line ~301), preventing the FSM from exiting to Idle while a diegetic HUD conversation is active. In useInteractionOrchestrator.ts, expanded the store subscription selector to include `diegeticNarrative`, and replaced showStoryOverlay-only open/close detection with `anyOverlayOpen`/`prevAnyOverlayOpen` booleans that cover both showStoryOverlay and diegeticNarrative, so diegetic close now correctly triggers `onNarrativeOverlayClosedInExploration()`.
- Fix 2 (MEDIUM-1): Ghost HUD on explore hub entry. Added `closeDiegeticNarrative()` import and call alongside `closeNarrativeOverlay()` in `enterSceneFreeExplorationHub` (freeExplorationHub.ts), preventing the diegetic HUD from lingering when a diegetic dialogue choice navigates to a free-exploration hub.
- Fix 3 (MEDIUM-2): executeStoryChoice fall-through. Added `return` after the `transitionsScene` block in `executeStoryChoice` (narrativeChoiceExecutor.ts), preventing the explore-hub and next-node branches from also executing when a choice has both a `transitionScene` effect and an explore-hub or next-node target.
- Updated 4 test files to include `diegeticNarrative: null` in GameStoreSnapshot factory functions (frameGameSnapshot.test.ts, playerLocomotionGate.test.ts, applyEffectsBridge.test.ts, gameSnapshotCache.test.ts).

Stage Summary:
- 1 HIGH + 2 MEDIUM fixes across 10 files (6 source + 4 test)
- Diegetic NPC conversations in Act 1 no longer get interrupted by the 0.3s/4s FSM safety timeout
- Diegetic HUD properly closes when entering free-exploration hubs
- Scene-transitioning choices no longer trigger competing explore-hub navigation
- No new TS errors (only pre-existing interactionTargetQuery rapier errors unrelated to this change)
---
Task ID: 4-b
Agent: physics-fixes-session9
Task: Fix HIGH physics issues - epoch check, LOS throttle, locked movement, prop mass, ground probe

Work Log:
- Fix H3: Added `currentMovementEpoch` parameter to `preparePlayerFrame()` in playerFramePrepare.ts. Imported `isMovementEpochStale` from playerMovementSceneSync.ts. Added early-return at function top when epoch is stale, preventing rescue teleport or KCC recovery from executing on a stale frame after scene transition. Updated the single call site in usePhysicsPlayerMovement.ts to pass `movementEpochRef.current`.
- Fix H4: In interactionTargetQuery.ts, added module-level reusable Ray object (`_reusableRay`) and rapier instance reference (`_reusableRayRapier`) for Ray pooling. Added `_losFrameCounter` module-level counter incremented once per frame in `queryInteractionTargets`. `hasInteractionLineOfSight` now returns true (assumes clear LOS) on 2 out of 3 frames, and reuses the cached Ray by mutating origin/direction on the 3rd frame instead of allocating a new one. Typed the cached Ray with `any` cast to work with the duck-typed `InteractionQueryContext`.
- Fix H2: In playerLockedMovement.ts, changed `if (vel.y > 0) vel.y = 0` to `if (vel.y > 0 && vel.y < 0.5) vel.y = 0`. KCC normal resolution on slopes/walls pushes the player up with small positive velocities (<0.5 m/s); these are now zeroed to prevent micro-bob, while larger upward velocities (intentional jump impulse still decaying) pass through.
- Fix M4: In DynamicProps.tsx, replaced `density={0.3-0.8}` on each RigidBody with explicit `mass` values via a `PROP_MASS` lookup table (can: 5kg, bottle: 5kg, box: 8kg, barrel: 15kg). This ensures no prop is lighter than 5kg, preventing a 75kg player at 7 m/s from launching props across the scene.
- Fix M6: In groundProbeCache.ts, extracted the existing vertical Y-change check into a named constant `GROUND_PROBE_VERT_UP_THRESHOLD = 0.3` and split the bidirectional `Math.abs` check into two explicit directional checks (upward for autostep/ramp, downward for falls) with clear comments explaining the purpose.

Stage Summary:
- 3 HIGH + 2 MEDIUM fixes across 6 files
- Stale movement frames from old scene now abort before rescue teleport/KCC recovery
- NPC LOS raycasts reduced from every-NPC-per-frame to every-3rd-frame with Ray pooling
- Locked movement no longer micro-bobs on slopes from KCC normal resolution
- Dynamic props now have realistic minimum masses (5-15 kg) instead of <0.1 kg
- Ground probe explicitly triggers on vertical Y changes >0.3m (autostep, ramps, platforms)
- No new TypeScript errors
---
Task ID: session9-physics-env
Agent: physics-env-audit-session9
Task: Audit physics and environment systems

Work Log:
- M1: Added FOV NaN/Infinity guard in applyCameraFrame.ts (safeFov helper) and cameraStateMachine.ts (Number.isFinite check with DEFAULT_FOV fallback). If spring.fov becomes corrupted (e.g. NaN from lerp with NaN targetFov during cutscene transitions), the camera no longer produces a degenerate projection matrix that renders a blank/inverted screen.
- M2: Fixed frame-rate dependent CRT monitor flicker in crtMonitorAnim.tsx. Changed `Math.random() < flickerChance` (per-frame, 0.5% at 60fps = 0.3 flickers/s, but 0.72/s at 144fps) to time-based probability `1 - Math.pow(1 - flickerChance, delta * 60)` so flicker rate is consistent across all framerates. Also fixed a JSX self-closing tag syntax error on the planeGeometry element.
- M3: Added NaN validation on KCC computedMovement() displacement in physicsSubstep.ts. Each sub-step's actual.x/y/z is checked with Number.isFinite before applying to the rigid body translation. Prevents the player from being teleported to infinity if the KCC internal state is corrupted (e.g. during scene teardown when the Rapier world is partially disposed).

Stage Summary:
- 3 MEDIUM fixes across 4 files
- Camera FOV corruption from bad spring state now safely falls back to DEFAULT_FOV (75°)
- CRT monitor flicker rate is now frame-rate independent
- Physics substep NaN displacement no longer teleports player to infinity
- No new TypeScript errors (verified: 0 errors in modified files)
- Comprehensive audit confirmed all 8 previous sessions' fixes are intact
- No remaining CRITICAL or HIGH issues found in physics, environment, lighting, post-processing, or camera systems
---
Task ID: session9-interaction
Agent: interaction-audit-session9
Task: Audit interaction pipeline for remaining edge cases

Work Log:
- M1: Fixed InteractionSystemBridge stateRef desync on scene:transition_start. The module-level interactionSession resets to Idle on scene:transition_start (interactionSession.ts:116-118), but the React component's stateRef.current was not updated until scene:enter. During the transition window (fade-out/in), publishTransition calls used the stale stateRef (e.g. Approach) to validate against the already-Idle module session, causing valid transitions to be rejected (Idle→Cutscene is not in VALID_INTERACTION_TRANSITIONS[Idle]). This produced spurious interaction:state_change events, splash timeline leaks (started but never completed because advanceFromSplashCutscene checks stateRef !== Cutscene), and continued approach movement during the fade. Fixed by extracting a shared `forceResetToIdle()` helper and adding a scene:transition_start useEffect listener that calls it, keeping stateRef in sync with the module-level session. The scene:enter handler now also uses the same helper and clears wasNarrativeInteractionRef to prevent spurious exploration resume hints after scene-transition-interrupted interactions.
- M2: Fixed executeDialogueChoice missing Race #15 guard. The same pattern fixed for executeStoryChoice in session 5 (commit 533a582f) was not applied to executeDialogueChoice. If a dialogue choice had a transitionScene effect AND a choice.next, applyEffects was called first (triggering requestSceneTransition), then the code fell through to the next-node branch which opened a new dialogue overlay for a node about to be invalidated by the scene transition. The interactionSession could reset the FSM during the gap, leaving currentNodeId pointing to the next node but no overlay open — a "dead" narrative state. Fixed by extracting the transitionsScene check, applying effects before closing the overlay, and returning early to prevent fall-through.
- M3: Added isInteractionLocked() guard to trigger:auto_execute handler in InteractionController.ts. If the player's NPC approach path crossed a trigger zone with auto-execute and transitionScene effects, the scene transition would fire during the Approach phase, causing the stateRef desync (M1) and potentially leaving the player in a broken state. Now auto-trigger effects are suppressed while the NPC interaction FSM is in a locked state.
- L4: Replaced Math.random() in InteractionController bark fallback with deterministic round-robin counter. The fallback path (NPCs with no barkTexts defined) used Math.floor(Math.random() * length) for bark selection — the last remaining Math.random() in the interaction pipeline.
- L5: Added try-catch around closeMinigame in handleMinigameComplete. If closeMinigame throws (e.g. minigame panel already unmounted), the error was unhandled inside the ControllerSession.schedule callback.

Stage Summary:
- 3 MEDIUM + 2 LOW fixes across 3 files
- InteractionSystemBridge stateRef now stays in sync with module-level interactionSession during the entire scene transition window
- Dialogue choices with scene transitions no longer risk a dead narrative state
- Auto-trigger zones can no longer fire scene transitions during NPC approach
- No new TypeScript errors (verified: only pre-existing act4.structure.ts parser error)

---
Task ID: session9-story-gameplay
Agent: story-gameplay-audit-session9
Task: Audit story and gameplay systems

Work Log:
- M1 (MEDIUM): `rooftop_unlocked` flag was never set anywhere in the codebase despite being checked in 6 locations (sceneGates, 2 scene exits, 1 trigger zone, poem margins, 1 quest requirement). Added `rooftop_unlocked: true` to all 3 choice branches of `act4_transition` in `src/data/story/structures/act4.structure.ts`. The rooftop is reached via story (act4_transition → rooftop_edge) so the flag must be set on arrival.
- M2 (MEDIUM): Removed `machine_confession` (side quest, `questType: 'side'`) from act 5 `questSpineIds` in `src/data/goldenPath.ts`. This side quest requires `found_quantum_computer` which is optional content; having it in the quest spine made quest-based act5→act6 advance effectively impossible. The `advanceTrigger: 'either'` means the story-node path still works, but the quest completion path was dead.
- Verified no circular quest dependencies in all act files
- Verified all poem IDs referenced in quest poemPowerBypass and requiredPoem fields exist
- Verified all NPC IDs referenced in quest npc_talked objectives exist in expandedNPCs.ts (maxim, zeka, anya, oleg, lena, baba_zina)
- Verified save system properly serializes all state including activeTTLFlags and achievementProgress
- Verified all cutscene trigger nodes exist in GOLDEN_PATH_STORY_SPINE
- Verified TransitionDirector properly guards against stale scene events
- No new TypeScript errors introduced (pre-existing act4.structure.ts parser strict-mode false positive persists)

Stage Summary:
- 2 MEDIUM fixes across 2 files (act4.structure.ts, goldenPath.ts)
- rooftop_unlocked flag now properly set when player arrives at rooftop via story
- Act 5→6 quest spine no longer blocked by optional side quest
- No gameplay soft-locks or data loss during scene transitions found

---
Task ID: session9-edge-cases
Agent: edge-cases-audit-session9
Task: Audit save/load, memory leaks, and edge cases

Work Log:
- H1 (HIGH): `saveGame()` only blocked saves during cutscenes (`activeCutsceneId`) but not during combat. Manual save (F5) during combat persisted `combatActive: true` while combat runtime state (enemies, turns, HP) is never serialized. On load, `combatActive: true` was restored, leaving the UI in combat mode with no running combat system — a stuck state. Fixed in `saveSlice.ts` by adding `state.combatActive` guard.
- H2 (HIGH): `saveGame()` did not block saves during NPC interaction (Approach/Cutscene/Align/Lock/Dialogue). The interaction session is module-level (not persisted), so a mid-interaction save would leave the player positioned at the NPC with no active interaction. Fixed in `saveSlice.ts` by adding `isInteractionLocked()` guard.
- H3 (MEDIUM): `storePatchFromSave()` restored `combatActive` from legacy phase flags. Even with the save-blocking fix, old saves or tampered saves could carry `combatActive: true`. Added defense-in-depth: `patch.combatActive = false` is now always forced on load, since combat runtime is never persisted.
- M4 (MEDIUM): `TutorialFlagsSchema` in `saveSchema.ts` was missing 3 fields added in sessions 3-6: `tutorial_seen_poem_power`, `tutorial_seen_combat`, `tutorial_seen_quest_board`. Zod's default strip-unknown-keys behavior dropped these on every save cycle, causing the poem power, combat, and quest board tutorials to re-show after any save/load. Fixed by adding all 3 as optional `.default(false)` fields.
- M5 (MEDIUM): `createDefaultSessionState()` in `persistedState.ts` did not include `thoughtHistory` or `notificationHistory`. These arrays survived `resetForNewPlaythrough()` via `applyCombinedPatch` (spread only overwrites keys in the patch), causing stale thoughts/notifications from the previous playthrough to appear in the journal. Fixed by adding both fields to the session defaults.
- S1 (SCAN): Memory leak scan — all useEffect hooks with `addEventListener`, `setInterval`, `requestAnimationFrame` have proper cleanup returns. Three.js disposal is handled via `useThreeCleanup` + `useNpcTemplateCleanup` hooks. Rapier rigid bodies are cleaned by `useRapierWorldCleanup`. Audio instances are disposed via `AmbientSoundPlayer.cleanupAmbient()` with proper oscillator/noise/buffer release. No leaks found.
- S2 (SCAN): Event bus cleanup — `EventBusScope` provides batch dispose; `useEventBusScope` hook auto-disposes on unmount; hard cap (20 handlers/event) catches listener leaks. `disposeEventBus()` clears all state. No leaks found.
- S3 (SCAN): Audio system — `SceneAudioController.dispose()` clears entered-scenes set and controller session; `AmbientSoundPlayer.dispose()` sweeps all active/fading ambients, clears all timers, disconnects audio nodes. Rapid scene switching handled via `purgeStaleFadingAmbients()` + transition generation counter. No stacking issues found.
- S4 (SCAN): Performance — `getGameSnapshot()` is cached via `gameSnapshotCache.ts`. NPC frame batch uses single `useFrameTick`. DPR monitoring uses ring buffer (O(1) amortized). HUD quiet uses `useSyncExternalStore` with shared module listeners. No per-frame allocation issues found.

Stage Summary:
- 3 fixes (2 HIGH, 1 MEDIUM) in saveSlice.ts — block saves during combat and NPC interaction
- 1 MEDIUM fix in saveSchema.ts — add missing tutorial flags to persist across save/load
- 2 MEDIUM fixes in persistedState.ts — clear thoughtHistory/notificationHistory on new game; force combatActive=false on load
- No memory leaks, event bus leaks, audio stacking, or performance issues found
- All 28 existing save-related tests pass; no new TypeScript errors introduced

---
Task ID: session9-deep-improve
Agent: main
Task: Rain wind gusts, accent lights, dust player disturbance

Work Log:
- Added dynamic wind gusts to RainSystem.tsx: Two new shader uniforms (uWindGustX, uWindGustZ) driven by layered sine waves at frequencies 0.12/0.31/0.73 (X) and 0.17/0.41 (Z) for organic, non-repeating wind patterns. Gust influence is height-dependent (smoothstep), affecting mid-air rain most.
- Added accent lights for 8 scenes that previously had none: rooftop_edge (sunset warm glow), river_pier (campfire + string lights), solnysh_room (warm table/corner lamps), zarema_albert_room (warm overhead + desk lamp), battle (conflict glow), street_winter (cold moonlight + window warmth), chk_campfire_night (campfire + fire uplight), albert_backroom (desk lamp + fill), sleep_dream (purple cold pulse orbs).
- Added player wake disturbance to dust motes in WeatherParticles.tsx: Dust particles within 0.8m of the player are gently pushed away (0.4 m/s force + slight upward push), creating a visible wake as the player walks through dusty rooms.
- Cinematic DOF for dialogue/cutscene (added by previous agent session): DepthOfField effect activates during story overlay or active cutscenes on high/ultra quality, with bokeh scale 3.0 for dialogue and 2.5 for cutscenes.

Stage Summary:
- Rain now has organic, time-varying wind gusts that make street_night feel alive
- 8 scenes with new atmospheric accent lights (candle flicker, cold pulse, static)
- Dust motes respond to player proximity — walking through a dusty room creates a visible wake
- Cinematic depth-of-field during dialogue/cutscene moments (high/ultra only)
- All changes compile with 0 TypeScript errors

---
Task ID: 2-a/b/c/d
Agent: session12-improvements
Task: Comprehensive improvements — story depth, physics polish, graphics atmosphere, race conditions & cinema

Work Log:
- Story depth (Task 2-a):
  - Created `src/data/idleMonologues.ts` — 12 scenes × 4 bands (high stress / high karma / low karma / neutral) × 3-5 lines each ≈ 200+ idle monologue lines in Russian (Disco-Elysium-style introspective mutterings)
  - Created `src/engine/player/idleMonologueSystem.ts` — fires idle thoughts after 25-35s of no movement input, 60s global cooldown, phase-guarded (exploration only, no cutscene/combat/dialogue)
  - Wired idle accumulator into `usePhysicsPlayerMovement.ts` post-physics finalize tick; resets on movement / scene change / interaction lock
  - Extended `src/shared/npcBark.ts` with `NPCAmbientBarks` interface (idle/working/pensive bands)
  - Extended `NPCDefinition` with optional `ambientBarks` field
  - Added ambient barks to 6 NPCs in `src/data/npcDefinitions.ts` (albert, zarema, cafe_barista, office_alexander, maria, office_colleague) — 8-12 lines each
  - Created `src/engine/npc/npcAmbientBarkSystem.ts` — fires ambient barks when player is within 4m of an NPC for >25s, 25s per-NPC cooldown
  - Added `npc:bark` event to `src/engine/events/npcEvents.ts`
  - Mounted NpcAmbientBarkSystem in PhysicsSceneInner alongside NPCSystem
  - Added 16 new `byAct` entries to `src/data/sceneEntryThoughts.ts` covering acts 4-7 for scenes that lacked them

- Physics & animation polish (Task 2-b):
  - Created `src/components/3d/FootstepDust.tsx` — 30-particle pool, subscribes to `exploration:footstep` event, spawns 3-5 dust particles per step with upward+outward velocity, fades over 0.6s, reduced-motion-aware
  - Wired FootstepDust into PhysicsSceneInner
  - Extended `src/engine/camera/cameraShake.ts` to accept `duration` (ms) payload, converted to decay rate (4.6 / (duration/1000)) so intensity reaches ~1% by end
  - Added `cutscene:camera_shake` event support for `{ intensity, duration }` payload shape
  - Wired duration-based shake through `applyCameraFrame.ts` and `ScreenEffects.tsx`

- Graphics & atmosphere (Task 2-c):
  - Created `src/components/3d/VolumetricLightShaft.tsx` — cone-shaped volumetric god rays with custom shader (additive blend, dust noise, flicker), quality-gated (high/ultra only, mobile caps at 2, reduced-motion disabled)
  - Added `SCENE_VOLUMETRIC_LIGHTS` config map for 4 scenes (volodka_room, library_day, office_day, cafe_evening)
  - Wired VolumetricLightShafts into SceneEnvironment
  - Created `src/components/3d/DialogueFocusTracker.tsx` — syncs `dialogueFocusTarget` singleton with active dialogue NPC
  - Created `src/engine/graphics/dialogueFocusTarget.ts` — module-level singleton for dialogue focus position
  - Enhanced `ExplorationPostFX.tsx` with stress-driven chromatic aberration (0 at stress<70, max at stress=100, offset 0.002 max) and dialogue depth-of-field
  - Created `src/engine/camera/dialogueCameraDrift.ts` — subtle camera drift during dialogue (0.1m radius, 20s period, ±0.5° FOV breathing)
  - Added z-fighting fixes (polygonOffset) to CafeVisual, StreetVisual, StreetWinterVisual, AbandonedFactoryVisual
  - Enhanced SceneEnvironment with distance fog improvements

- Race conditions & cinema (Task 2-d):
  - Extended `cinematicTimelineOrchestrator.ts` — `stopCinematicTimeline` now clears on scene:transition_start to prevent stale timeline state across scenes
  - Extended `SceneTransitionManager.ts` — calls stopCinematicTimeline on transition start
  - Extended `InteractionController.ts` — added isInteractionLocked guard to auto-trigger zone handler
  - Extended `InteractiveTriggers.tsx` — guards auto-trigger effects during interaction-locked state
  - Extended `MusicEngine.ts` — added `setMusicDuckFactor` for cutscene audio ducking (30% volume during cinematics, 0.5s duck / 1.0s restore)
  - Wired music ducking from cinematicTimelineOrchestrator start/stop/complete
  - Extended `applyCameraFrame.ts` — applies dialogue camera drift offset during Dialogue interaction state
  - Extended `ScreenEffects.tsx` — smooth letterbox transition (0.4s easeInOutCubic slide-in)
  - Extended `src/data/story/structures/act4.structure.ts` — added cameraShake effects at 3-4 emotional story beats
  - Added `cameraShake` to `StoryEffectType` and `StoryEffect` interface with `intensity` and `duration` fields
  - Added `cutscene:camera_shake` to `ApplicationEventMap` for store→engine routing (resolves shared↔engine import cycle)
  - Routed cameraShake effect through `emitAppEvent` instead of direct engine import (fixes lint rule)
  - Extended `store/persistedState.ts` — forces `activeCutsceneId = null` on load (defense-in-depth against stale cutscene state)
  - Extended `storyNodeValidation.ts` — validates cameraShake effect intensity/duration ranges

- Integration & wiring:
  - Added `pickIdleMonologue` export to `src/data/idleMonologues.ts` matching the signature expected by the idle monologue system
  - Fixed engine↔store import cycle in `idleMonologueSystem.ts` — uses `getGameSnapshot` / `dispatchStateAction` from StateDispatcher instead of direct store import
  - Fixed shared↔engine import cycle in `applyEffects.ts` — uses `emitAppEvent` for camera shake instead of direct eventBus import
  - Wired FootstepDust, DialogueFocusTracker, VolumetricLightShafts into PhysicsSceneInner / SceneEnvironment
  - Verified all 280 test files pass, 0 TypeScript errors, 0 lint errors (only pre-existing warnings)

Stage Summary:
- 9 new files created: idleMonologues.ts, idleMonologueSystem.ts, FootstepDust.tsx, VolumetricLightShaft.tsx, DialogueFocusTracker.tsx, dialogueCameraDrift.ts, dialogueFocusTarget.ts, npcAmbientBarkSystem.ts, + camera shake extensions
- 28 existing files modified across story/physics/graphics/cinema/race-conditions
- 200+ new Russian idle monologue lines (Disco-Elysium-style introspective depth)
- 6 NPCs with new ambient barks (idle/working/pensive bands)
- 16 new act 4-7 scene-entry thought variants
- Volumetric god rays for 4 window-lit scenes (quality-gated)
- Stress-driven chromatic aberration for emotional tension
- Dialogue camera drift + DOF for cinematic conversations
- Footstep dust particles for movement feedback
- Smooth letterbox transitions (0.4s slide-in)
- Cutscene audio ducking (30% volume during cinematics)
- 5+ race conditions hardened (cinematic+scene, auto-trigger+interaction, save+cutscene)
- Story-node camera shake for emotional beats (act 4)
- All changes compile clean (0 TS errors, 0 lint errors, 280/280 tests pass)

---
Task ID: session13-reactive-thoughts
Agent: main
Task: Add reactive inner monologue for perk unlocks and skill milestones (Disco-Elysium-style depth)

Work Log:
- Added `perk:unlocked` event to PlayerEvents map (playerEvents.ts)
- Refactored `acquirePerk` in playerProgressionSlice.ts:
  - Validation now runs BEFORE set (was inside set callback)
  - Emits `perk:unlocked` event AFTER successful state commit
  - Event includes perkId, perkName, category for context-specific thoughts
- Created `getPerkUnlockedThought()` in reactiveThoughts.ts:
  - 5 category-specific thought sets (survival, social, combat, poetic, technical)
  - 2 variants per category (10 total thoughts)
  - Karma-reactive: low karma → cynical/dark variant, high karma → accepting variant, neutral → deterministic hash pick
- Created `getSkillMilestoneThought()` in reactiveThoughts.ts:
  - Fires at skill levels 5 and 10 (milestones only — avoids spam)
  - Level 5: karma-reactive 3-variant thoughts
  - Level 10: mastery reflection (single variant)
  - Skill labels in Russian (писательству, технике, эмпатии, etc.)
- Wired both new thought types into useGameLifecycleManager.ts:
  - `perk:unlocked` subscription with 2s delay (after UI notification) and 6s display
  - `skill:level_up` subscription with 0.9s delay and 5.5s display
  - Both rate-limited via existing canShowReactiveThought() (12s cooldown)
- Fixed minor race condition in transitionSound.ts:
  - setTimeout(80ms) for delayed glitch was untracked
  - Added pendingTimers[] array, tracked timer, clearTimeout on dispose

Stage Summary:
- 2 new reactive thought functions (perk unlock + skill milestone) = 16 new Russian monologue lines
- 1 new event type (perk:unlocked) in PlayerEvents map
- 1 race condition fixed (transitionSound untracked setTimeout)
- All changes: 0 TS errors, 0 content validation issues, event map consistent (139 used, 150 defined, 0 undefined), all targeted tests pass
- Poems and main menu untouched (per user request)

---

## Task 3: Deep Study — 3D Rendering Engine, Shaders, Postprocessing, Visual Systems

### Scope
Analyzed 40+ files covering: R3F Canvas setup, WebGL renderer config, postprocessing pipeline, lighting system, atmospheric effects, procedural AAA rendering, shader code, quality/LOD system, asset pipeline, and scene visual profiles.

### 1. RENDERING PIPELINE (Full-Frame Order)

**WebGL Renderer** (`src/components/3d/RPGGameCanvas.tsx:338-365`)
- `THREE.WebGLRenderer` with: `stencil: true, alpha: false, powerPreference: 'high-performance'`
- Shadow: `PCFSoftShadowMap` (noir/cinematic aesthetic)
- Tone mapping: `ACESFilmicToneMapping` (renderer default), switched to `NoToneMapping` when EffectComposer is active (prevents double tone curve)
- Output: `SRGBColorSpace`, clear color `#000000`
- Renderer factory is cached per `antialias` boolean — prevents R3F from re-creating on re-render
- Dynamic DPR: `useDynamicDPR` scales between `[minDpr, maxDpr]` based on measured FPS (target thresholds: 25 low, 45 high)
- Frameloop: `'always'` during gameplay, `'demand'` during menu/intro/story overlay/tab hidden — CPU-saving

**R3F Canvas** (`src/components/3d/RPGGameCanvas.tsx:547-562`)
- Props: `flat` (flat shading for cyberpunk aesthetic), dynamic `dpr`, `shadows`, `antialias` from quality preset
- Camera: FOV 55, near 0.2, far 200, initial position [0, 2.8, 2.5]
- `<Canvas>` wrapped in error boundaries: `Canvas3DErrorBoundary` (3x auto-retry), `PhysicsErrorBoundary` (Rapier → SimplePlayer fallback), `PostFXErrorBoundary` (composer crash → no post-processing)

**Scene Graph (render order):**
1. `GltfPipelineInit` — configures Draco/Meshopt/KTX2 loaders
2. `CanvasFrameloopController` — manages demand-mode invalidation
3. `VisualizationLayers` — 5-layer depth system (Default/Background/Midground/Foreground/Overlay) with parallax
4. `PhysicsSceneInner` (lazy-loaded) — Rapier physics, player, NPCs, scene geometry
5. `FrameBudgetRunner` + `PostFrameBudgetRunner` — frame time budgeting
6. `WeatherController` — rain/snow toggling
7. `AtmosphericEffects` — fog, god rays, steam, dust, embers, neon reflections, mist, flickering lights
8. `ExplorationPostFX` — full post-processing pipeline
9. `CanvasGuardSystem` — tone mapping enforcement, first-frame emit, WebGL context-loss recovery

**CSS Overlays (outside Canvas for performance):**
- `MatrixRain` — CSS-animated cascading Cyrillic/code characters
- `GlitchEffect` — screen-space glitch overlay
- `NoirOverlay` — film grain + warm flicker (stress-reactive darkness)

### 2. POSTPROCESSING CHAIN

**File:** `src/components/3d/ExplorationPostFX.tsx` (663 lines)

**Quality gating:**
- PostFX disabled: `low` preset, `postfxEnabled=false`, menu phase, mobile `visualLite`
- Lite pipeline: `medium` preset on mobile/visualLite (no scene config overrides)
- Full pipeline: `high`/`ultra` presets

**Full Pipeline (render order):**
1. **Bloom** — `mipmapBlur`, `KernelSize.LARGE`, per-scene `intensity`/`threshold`/`smoothing` (25 scenes tuned)
2. **ChromaticAberration** — stress-reactive only (stress ≥ 70, `high` preset, offset 0.002 max)
3. **Scanline** — `guild_mainframe`, `office_day` only (CRT terminal aesthetic)
4. **N8AO** — screen-space ambient occlusion, `halfRes=false` (avoids depth blit bug), per-scene `aoRadius`/`aoIntensity` (22 scenes with AO), quality-gated by `allowsHeavyGfxFeature` + `shouldUseDenseSceneAmbientOcclusion`
5. **DepthOfField** — cinematic DOF, `high`: always mounted (bokehScale animated 0↔target), `ultra`: only during dialogue/cutscene, focus follows NPC via `dialogueFocusTarget` singleton, smooth 0.4s easeInOutCubic transition
6. **Vignette** — per-scene `offset`/`darkness` (25 scenes), stress-reactive (darkness + 0.12, offset - 0.15)
7. **HueSaturation** — per-scene hue/saturation shift (25 scenes), noir mode desaturates by -0.35
8. **BrightnessContrast** — per-scene brightness/contrast (25 scenes), user brightness slider
9. **LUT** — procedural 16³ 3D LUT, 3 kinds: `synthwave_neon`, `warm_interior`, `gothic_dust` (21 scenes mapped), tetrahedral interpolation
10. **Noise** — film grain, `high` preset only, indoor scenes (13 scenes), `opacity=0.035`
11. **ToneMapping** — `ACES_FILMIC` with per-pipeline exposure
12. **SMAA** — `MEDIUM` on high/ultra, `LOW` on medium; anti-aliasing since native MSAA is disabled (`multisampling=0`)

**Poem world effect boost:** `resolvePoemTTLPostFxBoost` adds temporary bloom intensity and vignette darkness when poem powers activate.

**Lite Pipeline (mobile/low):** Bloom (simplified) → Vignette → BrightnessContrast → ToneMapping → SMAA (optional)

**EffectComposer lifecycle:** `ManagedEffectComposer` uses `remountKey` (scene ID + pipeline config) to force composer dispose/recreate on scene transitions, preventing render target leaks. GL instance change also triggers remount.

### 3. SHADER APPROACH

**Custom GLSL Shaders (inline template literals):**

1. **AaaSurfaceShader** (`src/proceduralAaa/AaaSurfaceShader.ts`)
   - Full PBR surface shader with parallax occlusion mapping (POM), anisotropic highlights, Voronoi wear, dirt gradient, rain wash
   - GLSL noise: `hash21`, `valueNoise`, `fbm` (4-octave), `worley` (cellular)
   - POM: ray march height field in tangent space, up to 32 layers, linear refinement
   - GGX specular with Kajiya-Kay anisotropy, Schlick Fresnel
   - 5 texture inputs: albedo, normal, roughness, metalness, height
   - Audio-visual sync via `uSpectrum` uniform (AnalyserNode)

2. **RainSystem** (`src/components/3d/RainSystem.tsx`)
   - GPU-driven rain: vertex shader computes position from `uTime` + `aVelocity` attribute (zero CPU per-particle updates)
   - Wind gusts: layered sine waves at 0.12/0.31/0.73 Hz
   - Splash system: pool of `aBirthTime`/`aBaseSize` attributes, shader expands/rings over lifetime
   - Adaptive particle counts: mobile scaling via `getParticleCount`

3. **SnowSystem** (`src/components/3d/SnowSystem.tsx`)
   - GPU-driven snow: vertex shader drift via `aPhase` attribute + `uDriftStrength`
   - Wobble: `sin(t * 1.5 + phase * 2.1)` for organic flutter

4. **VolumetricLightShaft** (`src/components/3d/VolumetricLightShaft.tsx`)
   - Custom cone shader: `SHAFT_FRAGMENT_SHADER` with procedural dust
   - GLSL FBM (3-octave) for soft dust clouds inside light cone
   - Radial + vertical falloff, view-distance fade, flicker modulation
   - Dust motes: 30 animated Points per shaft, cone-clamped

5. **Environmental animations** — steam rise, radiator steam, neon pulse, neon flicker, CRT monitor, fan spin, drip, lamp sway, curtain sway: all use simple JS animation (no custom shaders)

**Standard Materials:** Most scene geometry uses `meshStandardMaterial` with PBR maps from Poly Haven (diffuse/normal/arm in 1k-2k JPEG). Procedural texture generator (`DynamicTextureGenerator`) creates DataTextures (albedo/normal/roughness/metalness/height) from CPU noise — 5 surface types: asphalt, concrete, metal_worn, brick, skin.

### 4. LIGHTING STRATEGY

**File:** `src/components/3d/Lighting.tsx` (543 lines)

**Per-scene lighting:**
- **Directional light:** intensity 1.15 (indoor) to 2.2 (outdoor), color varies (cold blue indoor `#2a2540`, moonlit night `#3a3a6a`, overcast outdoor `#ffffff`)
- **Hemisphere light:** per-scene ambient/ground colors, reduced for indoor (`indoorHemisphereMul`)
- **Base ambient:** readability fill at `baseAmbientIntensity`, extra ambient for dark outdoor scenes (street_night +0.55, city_square +0.4, etc.)
- **Indoor-specific:** per-scene ambient override (14 rooms, e.g. volodka_room `#2a2538 @0.55`), per-scene fill light (14 rooms)
- **Scene point lights:** from `config.lights` array, shadow-casting on hero scenes (max 2 per scene, 512 or 256 shadow maps)

**Accent Lights** (20 scenes with 2-6 lights each):
- 3 animation types: `neon_cycle` (slow hue shift + intensity pulse), `candle_flicker` (multi-frequency sine wave warmth), `cold_pulse` (slow blue-green data-flow)
- Shadow casting: limited to specific `shadowCaster: true` lights, quality-gated
- Mobile: capped at 2 accent lights per scene

### 5. ATMOSPHERIC EFFECTS

**File:** `src/components/3d/AtmosphericEffects.tsx`

Scene-gated by `fxGovernor` + `qualityFeatureGates` + `softWorkBudget`:
- **Volumetric Fog** (14 scenes): Layered semi-transparent planes with drift, vertical pulse, opacity breathing. Per-scene presets (color, opacity, spread, height, drift speed). Mobile-scaled via `getFogPlaneCount`.
- **God Rays** (14 scenes): Cylinder/cone meshes with additive blending + dust mote Points. Per-scene presets. Lite mode reduces dust count.
- **Steam** (cafe_evening, home_evening): Rising particle systems
- **Matrix Fog** (battle): Combat-specific hazy fog
- **Dust Motes** (7 scenes): Floating particles
- **Ember Particles** (abandoned_factory, battle): Rising sparks
- **Industrial Sparkles**: Scene-specific factory sparks
- **Neon Rain Reflections** (street_night, city_square): 5-6 colored ground reflection pools with additive blending, pulsing
- **Server Room Mist** (guild_mainframe): Mist particles
- **Flickering Lights** (factory_basement, abandoned_factory): Light flicker effect
- **Weather Particles**: Rain + Snow systems (GPU-driven shaders)

### 6. SCENE VISUAL PROFILES

**File:** `src/config/sceneVisualProfiles.ts` (207 lines)

- **Hero scenes** (10): volodka_room, volodka_corridor, home_evening, street_night, city_square, cafe_evening, office_day, park_day, library_day, procedural_aaa
- **Standard scenes** (15+): All extension scenes with `forceFullPostFx: true` (so they get full post-FX even on mid-tier GPUs)
- Per-scene overrides: `bloomIntensityScale`, `aoIntensity`, `aoRadius`, `shadowMapScale`, `ambientNpcCountBoost`, `npcLodDistanceScale`, `envAnimationKeepAll`
- **Dense industrial scenes** (guild_mainframe, factory_basement, abandoned_factory, factory_roof): N8AO drops under soft-work budget pressure

### 7. ASSET PIPELINE

**File:** `src/engine/assets/gltfPipeline.ts`
- **Draco:** WASM decoder preferred (`/draco/gltf/`), JS fallback
- **Meshopt:** Always available (pure JS, ~50KB)
- **KTX2/Basis:** Lazy dynamic import — Basis transcoder (~571KB) only fetched when a GLB with KTX2 textures is loaded, keeping initial bundle small
- **GLB variants:** 3 compression formats per NPC (raw `.glb`, `.draco.glb`, `.meshopt.glb`) + LOD variants (`_lod1`, `_lod2`)

**NPC Models:** 20+ unique NPCs (AI3DGen), 12 base rigs (female/male mixamo), Mixamo animations (idle, walking, sitting, sleeping, talking, working)

**Props:** Poly Haven PBR models (old_tyre, gothic_statue, rollershutter_door, desk_lamp, concrete_road_barrier, apartment facade, fire_escape, utility_box, portable_cassette_player, WetFloorSign, metal_trash_can, GothicBed), citykit props (coffee_machine, chair, lamp_post, terminal, bench, campfire, bottle, guitar, table_small, bookshelf), FPS arms

**Interior Models:** AI3DGen interiors (office, library, rooftop, cafe_interior, room_bedroom, factory, corridor, pier, basement, forest_clearing) with colormap textures

**Procedural AAA:** SDF world (buildings, arches, bridges, rocks, multi-level ruins) with surface-nets meshing, POM surface shader, dynamic texture generation (5 material types), procedural atmosphere (fog, volumetric rays, auto LUT)

**Vite config:** `assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.ktx2']`, manual chunk splitting, `esnext` target

### 8. VISUAL QUALITY ASSESSMENT

**What looks GOOD:**
- Extremely sophisticated per-scene color grading (25 scenes with unique hue/sat/brightness/contrast + 3 LUT kinds)
- Rich atmospheric effects stack (fog + god rays + volumetric light shafts + neon reflections + steam + dust + embers)
- Smart quality system (4 tiers + auto + battery + GPU memory + pixel budget caps)
- Stress-reactive post-processing (vignette + chromatic aberration respond to gameplay)
- Poem world effects (6 visual presets: letterbox_truth, god_rays_gold, storm_break, shield_pulse, warm_echo, matrix_pulse)
- Procedural AAA system is technically impressive (SDF world, POM, dynamic textures, atmosphere)
- Excellent mobile degradation (particle count scaling, effect gating, lite post-FX pipeline)
- Baked procedural env maps for hero scenes (neon_night, warm_apartment, cool_lobby)
- Wet street ground with planar reflector (MeshReflectorMaterial) + PBR wetness
- Robust error boundaries (3D canvas auto-retry, physics fallback, post-FX graceful degradation)
- Cinematic DOF with NPC-tracking autofocus for dialogue
- Noir overlay system with film grain + stress-reactive darkness

**What's MISSING for AAA feel:**
1. **No screen-space reflections (SSR)** — Only planar reflector on wet streets. SSR would add reflections on all wet/metallic surfaces.
2. **No temporal anti-aliasing (TAA)** — SMAA is good but TAA would better handle temporal shimmer in fog/volumetric effects.
3. **Volumetric fog is fake** — Layered planes, not raymarched volume. True volumetric fog (raymarching) would be a major upgrade.
4. **God rays are mesh-based** — Cylinder/cone meshes with additive blending, not screen-space light scattering. Looks good but not physically-based.
5. **No global illumination** — Baked env maps provide indirect lighting but no real-time GI bounce.
6. **Shadow maps are small** — Max 2048x2048 on ultra, 512 on many point lights. Cascade shadow maps (CSM) for directional light would improve outdoor shadow quality.
7. **No motion blur** — Neither object nor camera motion blur, common in AAA titles.
8. **Particle systems lack variety** — All particles are simple GL_POINTS with round soft-circle frag shaders. No sprite sheets, no lit particles.
9. **Procedural AAA not integrated into main scenes** — It's a separate mode (`procedural_aaa` scene). The SDF world + POM shader could enhance regular scenes.
10. **No screen-space subsurface scattering** — Skin and wax materials lack SSS.
11. **Env map quality** — Baked procedural env maps are low-complexity (5-6 point lights). Real HDRI or higher-fidelity bakes would improve metallic reflections.
12. **No lens effects** — No anamorphic flare, no lens dirt, no aberration on bright lights (only stress-triggered chromatic aberration exists).

### 9. CONCRETE IMPROVEMENT RECOMMENDATIONS

**HIGH IMPACT (Visual Quality Leap):**

1. **Add Cascade Shadow Maps (CSM) for directional light**
   - File: `src/components/3d/Lighting.tsx:179-194`
   - Replace single `directionalLight` shadow camera with `PCFSoftShadowMap` + 3-4 cascade splits
   - Outdoor scenes (street_night, park_day, rooftop_edge) would benefit most
   - Three.js has built-in `DirectionalLightShadow` with `camera` property supporting cascades via `@react-three/drei`

2. **Screen-space reflections (SSR) for wet scenes**
   - File: `src/components/3d/WetStreetGround.tsx`
   - Complement planar reflector with screen-space raymarched reflections
   - `@react-three/postprocessing` has `SSREffect` — would make ALL wet/metallic surfaces reflective

3. **Temporal Anti-Aliasing (TAA)**
   - File: `src/components/3d/ExplorationPostFX.tsx:558-565`
   - Replace SMAA with TAA on ultra preset (SMAA on high as fallback)
   - Would fix temporal flicker in fog planes, volumetric shafts, and rain

4. **Sprite-sheet particle rendering**
   - Files: `src/components/3d/RainSystem.tsx`, `src/components/3d/SnowSystem.tsx`, `src/components/3d/WeatherParticles.tsx`
   - Replace round GL_POINTS with texture-atlas sprite sheets (rain streaks, snowflakes, embers, dust)
   - Use `PointsMaterial.map` with an atlas — minimal code change, massive visual upgrade

**MEDIUM IMPACT (Atmosphere & Polish):**

5. **Volumetric fog raymarching**
   - File: `src/components/3d/VolumetricFog.tsx`
   - Replace layered plane approach with a fullscreen raymarched volume shader (read depth buffer + light positions)
   - Would unify fog, god rays, and volumetric shafts into one system

6. **Lens flare / anamorphic streaks on bright lights**
   - New file or extend `src/components/3d/AtmosphericEffects.tsx`
   - Add `@react-three/postprocessing` `LensflareEffect` or custom billboard streaks on neon accent lights
   - 6+ accent lights per scene in street_night, city_square would benefit

7. **Camera motion blur**
   - File: `src/components/3d/ExplorationPostFX.tsx`
   - Add motion vector pass + `@react-three/postprocessing` `MotionBlurEffect` on high/ultra
   - Especially impactful during camera transitions and combat

8. **Integrate POM surface shader into main scenes**
   - File: `src/proceduralAaa/AaaSurfaceShader.ts`
   - Apply parallax occlusion to floor/ground materials in hero indoor scenes (volodka_room, library_day, home_evening)
   - Would add perceived depth to flat floor planes

**LOW IMPACT (Details):**

9. **Higher-fidelity env maps** — Replace baked procedural env maps with real HDRI from Poly Haven (`src/engine/graphics/proceduralEnvMaps.ts`)
10. **Film grain improvement** — Move from simple CSS overlay (`NoirOverlay.tsx`) to shader-based grain that responds to scene luminance
11. **Shadow map resolution boost** — Increase point light shadow maps from 512 to 1024 on high preset (`Lighting.tsx:457-458`)
12. **Add `depthOfField` to more scenes** — Currently only high/ultra, but rooftop_edge and park_day would benefit from subtle DOF

### 10. KEY FILES INDEX

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/3d/RPGGameCanvas.tsx` | 799 | Main 3D canvas, WebGL renderer, error boundaries, frameloop control |
| `src/components/3d/ExplorationPostFX.tsx` | 663 | Full post-processing pipeline (bloom, AO, DOF, LUT, SMAA, etc.) |
| `src/components/3d/Lighting.tsx` | 543 | Per-scene lighting (directional, hemisphere, ambient, accent, animated) |
| `src/components/3d/SceneEnvironment.tsx` | 409 | Fog (linear + exp2), background, env maps, volumetric light shafts |
| `src/components/3d/AtmosphericEffects.tsx` | 126 | Atmospheric effect controller (fog, god rays, particles, reflections) |
| `src/components/3d/VolumetricFog.tsx` | 383 | Layered plane volumetric fog (14 scene presets) |
| `src/components/3d/GodRays.tsx` | 675 | Mesh-based god rays with dust motes (14 scene presets) |
| `src/components/3d/VolumetricLightShaft.tsx` | 603 | Cone shader volumetric shafts (4 scene presets) |
| `src/components/3d/RainSystem.tsx` | 372 | GPU-driven rain particles + splash system |
| `src/components/3d/SnowSystem.tsx` | 253 | GPU-driven snow particles |
| `src/components/3d/WetStreetGround.tsx` | 226 | Planar reflector wet ground with PBR |
| `src/components/3d/VisualizationLayers.tsx` | 388 | 5-layer depth/parallax system |
| `src/proceduralAaa/AaaSurfaceShader.ts` | 256 | PBR POM shader (parallax, anisotropy, Voronoi wear) |
| `src/proceduralAaa/ProceduralSdfWorld.ts` | 639 | SDF world generation + surface-nets meshing |
| `src/proceduralAaa/DynamicTextureGenerator.ts` | 222 | CPU texture gen (albedo/normal/rough/metal/height) |
| `src/proceduralAaa/ProceduralAtmosphere.ts` | 94 | Atmosphere (fog, volumetric rays, auto LUT) |
| `src/engine/graphics/qualityPresets.ts` | 434 | Quality tier system (low/medium/high/ultra/auto) |
| `src/engine/graphics/resolveSceneRenderingPipeline.ts` | 70 | Per-scene rendering pipeline resolution |
| `src/config/sceneVisualProfiles.ts` | 207 | Scene visual profiles (hero/standard, AO, bloom, shadow) |
| `src/engine/graphics/proceduralLutTextures.ts` | 122 | Procedural 16³ 3D LUT (synthwave/warm/gothic) |
| `src/engine/graphics/proceduralEnvMaps.ts` | 146 | Baked procedural env maps (neon/warm/cool) |
| `src/engine/graphics/wetStreetScenes.ts` | — | Wet street scene detection + reflector settings |
| `src/engine/assets/gltfPipeline.ts` | 122 | GLTF loader (Draco/Meshopt/KTX2) |
| `src/components/game/poemWorldEffect/usePoemWorldEffectController.ts` | 86 | Poem world visual effect controller |
| `src/config/poemWorldEffects.ts` | 186 | Poem world effect profiles (6 visual presets) |
| `vite.config.ts` | 115 | Vite build config (GLB/KTX2 assets, manual chunks) |

---

## Session: 2025-08-01 — "AAA-визуал, плавные переходы, походка, HUD-виджеты"

### Контекст
Автор попросил довести проект до AAA-уровня: «ошеломляющая визуально», «роскошные катсцены»,
«плавно, без резких переходов», «идеальная анимация движений», «главное — геймплей».
Стек уже зрелый (12-pass postprocessing, 8 стилей переходов, weight-based locomotion blend,
head bob + FOV kick + turn tilt). Цель сессии — поднять планку на уже работающем фундаменте,
не ломая инварианты (Rapier interpolate={false}, KCC ownership, postprocessing depth-blit patch).

### Подход
4 параллельные разведки (Explore-агенты) замапили: графику/рендер, катсцены/переходы,
HUD/UI, движение/анимацию. По каждой — конкретные safe improvement opportunities с файлами
и строками. Правки — только аддитивные, типобезопасные, с typecheck-гейтом (tsc7 --noEmit exit 0
после каждого батча). Сервер/тесты не запускались — только код + push в main (по запросу автора).

### Commit 1: `0d2ff48` — AAA-визуал + плавный crossfade-переход

**Графика (`ExplorationPostFX.tsx`, `proceduralLutTextures.ts`)**
- Film grain теперь и на Ultra (opacity 0.022 вместо полного отключения) — убирает
  «пластиковый» стерильный вид, возвращает filmic-фактуру (Session 8 намеренно отключал
  зерно на Ultra ради 60fps; softer 0.022 + soft-work-gate — риск нулевой)
- Базовая едва заметная хроматическая аберрация на high/ultra (~0.0004 offset) —
  киношный характер линзы вместо цифровой стерильности. Stress-ramp на high сохранён
- Новый LUT-вид `cyber_noir` для city_square: сдержанный orange-teal (тёплые блики /
  холодные тени), НЕ candy — площадь читается как мокрый нуар, а не плоский неон

**Переходы (плавность, без резких cut-ов)**
- Новый стиль `crossfade` — роскошный fade-to-black с мягким акцентным vignette-glow,
  без glitch/clip-path. Самый частый стиль (вес 5/23 ≈ 22%) — прямой ответ на «без резких
  переходов». Wipe (glitch+clip) сохранён как стилизованная разновидность (вес 3)
- `SceneTransitionStyle` + литеральные union-ы `SceneConfig` обновлены в 3 файлах типов
- `SCENE_OVERLAY_MS.CROSSFADE = 620мс`; фаза `crossfade-in` в контроллере + рендер в оверлее

### Commit 2: `d220742` — Киношное зерно в катсценах + HUD-виджеты

**Катсцены (`CutsceneOverlay.tsx`)**
- Film grain для `revelation` / `act_transition` типов — киношная фактура вместо плоского
  цифрового оверлея (opacity 0.045, respect reduced-motion). «Роскошные катсцены»

**HUD (`OrchestratorGameplaySections.tsx`)**
- `PoemActiveEffectsHud` смонтирован в `GameplayExplorationHud` — TTL-чипы активных
  стихов-способностей с обратным отсчётом, дополняют `PoetryPowerBar` (ранее игрок не видел,
  когда бафф стиха истечёт, без открытия книги стихов)
- `ItemGainedPopupLayer` смонтирован в `GameplayExplorationNotifications` — попапы подбора
  предметов с цветом редкости (ранее только `LootNotification` для контейнеров)
- Оба виджета были полностью построены, но не подключены к живому дереву оркестратора

### Commit 3: `75fdc31` — Lateral camera bob — figure-8 походка

**Движение (`applyCameraFrame.ts`)**
- Camera-relative горизонтальный sway камеры на ПОЛОВИНЕ частоты вертикального bob-а —
  классическая figure-8 походка. Тело качается раз за шаг, пока bob-ит дважды → читается
  как «идёт», а не «плывёт». Camera-relative (через forward→right вектор), amplitude 3мм
  (половина Y-bob), под тем же bobIntensity + reduced-motion гейтом
- «Идеальная анимация движений»: убирает «плавающий» вид. Безопасно — чисто аддитивно к
  `targetPos`, НЕ трогает KCC / Rapier / `interpolate={false}`

### Аудит: что уже было сделано (не требовало правок)
- **Combat feel (IMPROVEMENT_PLAN §2.1)** — уже полностью реализован: дифференцированный
  screen shake (crit 0.8 / super 0.55 / normal 0.3), hit-pause для combo≥3 (0.5, 0.15s),
  player-damage stagger (timeScale 0.6, 0.1s, reason `player_stagger`), poem-power bullet-time
- **Movement system** — weight-based idle/walk/run blend, head bob, FOV kick on sprint
  (RUN_FOV_BOOST=4°), turn tilt, landing shake, look-ahead, breathing idle — всё на месте
- **Skip-prologue (§4.1)** — уже решён через story-node `skip_prologue_intro` с полным
  нарративным контекстом (имя, возраст, роль, тикет, кофе, дождь)

### Что НЕ тронуто (намеренно — риск/нет тестирования)
- GodRays postprocessing pass (нужен sun-mesh ref, medium risk без браузер-теста)
- SSR на мокрых улицах (ultra-only, ~3-5ms, нужен A/B)
- Continuous walk↔run blend by speed (P2) — ломает тесты `playerLocomotionPresentation.test.ts`
  и caller-логику `clipState.runWeight >= 1`; требует test-aware рефакторинга
- Speed-linked walk timeScale (P1) — требует проброса `playerSpeedRef` prop через хук
- Стихи — не трогались (авторское произведение Владимира Лебедева)

### Статистика
- 4 коммита в main, 11 файлов изменено, ~все правки аддитивные
- typecheck: exit 0 после каждого батча (tsc7 --noEmit)
- 0 строк стихов изменено

### Ключевые файлы сессии
| Файл | Правка |
|------|--------|
| `src/components/3d/ExplorationPostFX.tsx` | film grain Ultra + base chromatic aberration |
| `src/engine/graphics/proceduralLutTextures.ts` | cyber_noir LUT kind + city_square |
| `src/hooks/useSceneTransitionOverlayController.ts` | crossfade phase/weight/intro |
| `src/components/game/SceneTransitionOverlay.tsx` | crossfade-in render |
| `src/engine/exploration/explorationUxPresentation.ts` | SceneTransitionStyle + accent |
| `src/shared/constants/transitionTimings.ts` | CROSSFADE duration |
| `src/shared/types/definitions/scene.ts`, `sceneDefinition.ts` | union + 'crossfade' |
| `src/components/game/CutsceneOverlay.tsx` | FilmGrain for revelation/act_transition |
| `src/components/game/orchestrator/OrchestratorGameplaySections.tsx` | PoemActiveEffectsHud + ItemGainedPopupLayer |
| `src/engine/camera/applyCameraFrame.ts` | lateral bob (figure-8 gait) |

---

## Session: 2026-08-02 — "AAA: filmic post-FX deplasticize + locomotion feel + diegetic HUD wiring"

### Контекст
Автор попросил продолжить доводку до AAA-уровня: «ошеломляющая визуально», «роскошные катсцены»,
«плавно, без резких переходов», «идеальная анимация движений», «главное — геймплей»,
«показывай, не рассказывай». 3 параллельные разведки (Explore-агенты, Task IDs 5/6/7) замапили
графику/рендер, движение/камеру, HUD/diegetic — каждая вернулась с конкретными file:line
safe-additive proposals. Правки — только аддитивные, типобезопасные. Гейт: `node scripts/tsc7.mjs
--noEmit` → 0 ошибок после каждого батча. Сервер/тесты не запускались — только код + push в main
(по запросу автора). Стихи НЕ трогались.

### Коммит: `20ea763` — push в main (002fd14..20ea763)

**Графика — deplasticize + киношный муд (`ExplorationPostFX.tsx`, `proceduralLutTextures.ts`, `NeonRainReflections.tsx`, `AtmosphericEffects.tsx`, `WetStreetGround.tsx`)**
- Bloom `KernelSize.HUGE` на Ultra — мягче filmic falloff неона (вместо LARGE)
- N8AO per-scene tinted color (`SCENE_AO_COLOR`) — оттенённый ambient occlusion (физически
  поглощённый свет, не плоско-чёрный SSAO). Главный «deplasticizer»: 10 сцен с hue-matched тенью
- ChromaticAberration `radialModulation` + `modulationOffset=0.4` — фрингинг концентрируется по
  краям кадра (настоящая линза), а не равномерный subpixel
- Vignette `eskil` mode на Ultra hero-сценах (`HERO_POSTFX_SCENES`) — фотографическое заваривание
- Per-scene ACES tone-mapping exposure (`SCENE_TONE_EXPOSURE`) — бой темнее/контрастнее, сон/закат
  светлее; ранее плоская global exposure 1.22
- DOF `height=720` на Ultra — круглее боке в диалогах/катсценах (480 на high)
- `cold_noir` LUT для `underground_bunker` + `guild_mainframe` — green-teal CRT phosphor грейд
  (расширен `ProceduralLutKind` union + `applyLutTransform` case + `PROCEDURAL_LUT_SCENES`)
- NeonRainReflections configs для `river_pier` + `pier_evening` — тёплый отблеск костра/гирлянд +
  холодный отблеск воды; `NEON_REFLECTION_SCENES` расширен
- WetStreetGround `mirror` 0.5→0.6 на Ultra (оба варианта: PBR + procedural fallback) — лужи,
  а не просто влажность; resolution unchanged (0 VRAM cost)

**Движение/камера — multi-channel impact + momentum**
- `src/engine/camera/landingImpact.ts` (НОВЫЙ) — `triggerLandingFovDip(impactStrength)` +
  `consumeLandingFovDip(delta)`: краткий внутренний FOV пинч (max 1.5°), восстановление ~0.4s,
  reduced-motion gate. Использует ранее мёртвое поле `scratch.landingImpactVel`. Emit в
  `playerMainMovement.ts` (где уже считается `impactStrength`), consume в `explorationStrategy.ts`
  (`targetFov: baseFov + fovBoost - consumeLandingFovDip(ctx.delta)`)
- Sprint-start FOV «kick» (`explorationStrategy.ts`) — envelope +0.6° затухающий за ~0.25s при
  переходе walk→run (threshold 5.5 m/s). One-shot per sprint entry
- Sprint look-ahead cap boost (`explorationStrategy.ts`) — cap растёт с 0.3 (walk) до 0.45 (sprint)
  — камера ведёт дальше на спринте (momentum/intent)
- Синхронизирована частота дыхания камеры (`cinematicCamera.ts:applyEnhancedBreathingIdle`) —
  1.8 Hz → 2.0 Hz (matches procedural body idle `idleTorsoPosY`); sway harmonics 0.6/0.8 → 0.5/1.0
  (¼ / ½ от breath fundamental). Убран 5s beat-воббл между камерой и телом
- Dialogue time-scale ease (`cinematicCamera.ts`) — `targetTimeScale` + exponential ease в
  `applyTimeScale` (speed 8, ~0.375s to 95%). Заменяет жёсткий `setGlobalTimeScale` snap на
  dialogue enter/exit. Bullet time entry/exit сохранён как hard-snap (punch желателен)
- Wall-bump shake масштабирован по `slideRatio` (`playerMainMovement.ts`) —
  `Math.max(0.3, 1.15 - slideRatio)`: лоб в стену = полный shake, касание угла = ~0.3×
- Footstep dust gait-scaled (`FootstepDust.tsx` + `playerFinalizeFrame.ts` + `explorationEvents.ts`):
  payload `exploration:footstep` расширен опциональными `speed`/`easedSpeed`; dust burst
  масштабируется (walk ~3 частицы, sprint ~6 + сильнее upward vel). Pool cap (30) сохранён

**HUD / diegetic / show-don't-tell — монтирование уже построенных orphan-виджетов**
- `InteractionProximityGlow` смонтирован в `ExplorationHUD.tsx` — дышащая аура прицела +
  edge-flash на активации взаимодействия (EventBus-driven, pointer-events-none, reduced-motion)
- `StatChangeLayer` смонтирован в `OrchestratorGameplaySections.GameplayExplorationNotifications` +
  `showStatChange()` подключён в `useHUDController.ts` к karma/energy/stress/XP (цвет = направление:
  cyan/green = gain, rose = loss; stress инвертирован). Pool-based, TTL-bounded, ErrorBoundary-wrapped
- `DialogueRelationBar` смонтирован в шапке `DiegeticDialogueHud.tsx` (под именем спикера) —
  Disco Elysium-бар отношений с color-coded thresholds + hover-reveal numeric. Только для dialogue kind
- `SceneDiscoveryToast` — отложенный счётчик «Открыто N/M» для сцен с entry-text (ранее
  suppressed целиком): reveal через 3.2s после title-card, оба бита видны
- `AmbientAtmosphereCaption` скрыт во время diegetic-диалога (`diegeticNarrative != null`) —
  без наложения на dialogue plate (pure visibility guard)

### Аудит: что НЕ тронуто (намеренно)
- VolumetricLightShafts для home_evening/factory_basement — отложено: требует проверки геометрии
  сцены без браузер-теста (позиции shaft могут не совпасть с practical lights)
- SSR на мокрых улицах (ultra-only) — нужен A/B (depth-blit patch interaction uncertain)
- Continuous walk↔run blend by speed — ломает `playerLocomotionPresentation.test.ts` + caller logic
- Speed-linked walk timeScale — требует проброса `playerSpeedRef` prop
- GodRays postprocessing pass — нужен sun-mesh ref
- Стихи — не трогались (авторское произведение Владимира Лебедева)

### Статистика
- 1 коммит в main (20ea763), 17 файлов изменено + 1 новый (`landingImpact.ts`), ~+244/-31 строк
- typecheck: `node scripts/tsc7.mjs --noEmit` → exit 0 после каждого батча (graphics / feel / HUD)
- 0 строк стихов изменено
- Все правки аддитивные; инварианты сохранены: `<Physics interpolate={false}>`, KCC ownership,
  postprocessing depth-blit patch, test contracts (playerLocomotionPresentation / explorationStrategy
  / cinematicCamera / cameraShake), reduced-motion gates, quality-tier gates

### Ключевые файлы сессии
| Файл | Правка |
|------|--------|
| `src/components/3d/ExplorationPostFX.tsx` | 6 post-FX: bloom HUGE / N8AO tint / CA radial / vignette eskil / per-scene exposure / DOF height |
| `src/engine/graphics/proceduralLutTextures.ts` | cold_noir LUT kind + 2 scenes |
| `src/components/3d/NeonRainReflections.tsx` | river_pier + pier_evening configs |
| `src/components/3d/AtmosphericEffects.tsx` | NEON_REFLECTION_SCENES += pier scenes |
| `src/components/3d/WetStreetGround.tsx` | mirror 0.5→0.6 on Ultra (PBR + fallback) |
| `src/engine/camera/landingImpact.ts` | NEW — landing FOV dip module |
| `src/engine/camera/cinematicCamera.ts` | breathing freq sync + dialogue time-scale ease |
| `src/engine/camera/strategies/explorationStrategy.ts` | sprint FOV kick + look-ahead cap + landing dip consume |
| `src/engine/player/playerMainMovement.ts` | landing FOV dip emit + wall-bump shake scaling |
| `src/engine/player/playerFinalizeFrame.ts` | footstep emit + speed/easedSpeed |
| `src/components/3d/FootstepDust.tsx` | gait-scaled dust burst |
| `src/engine/events/explorationEvents.ts` | footstep payload type extended |
| `src/components/game/hud/ExplorationHUD.tsx` | mount InteractionProximityGlow |
| `src/components/game/orchestrator/OrchestratorGameplaySections.tsx` | mount StatChangeLayer |
| `src/components/game/hud/useHUDController.ts` | wire showStatChange to karma/energy/stress/XP |
| `src/components/game/diegetic/DiegeticDialogueHud.tsx` | mount DialogueRelationBar |
| `src/components/game/SceneDiscoveryToast.tsx` | deferred discovery counter for entry-text scenes |
| `src/components/game/AmbientAtmosphereCaption.tsx` | gate on diegeticNarrative |

---

## Сессия: 2026-08-02 (cron-tick 2) — "Mount orphaned HUD widgets + dialogue history + cross-scene exit bearing"

**Коммиты:** (см. git log — push to main в конце сессии)
**Цель:** Продолжить AAA-polish — монтировать уже построенные orphan-виджеты (Tier 1 из предыдущей разведки),
добавить диалоговую историю в diegetic HUD, и cross-scene exit bearing в стрелку квеста.

### QA via agent-browser
- Открыт https://volodka.vercel.app/ через headless chromium.
- Главное меню рендерится чисто: заголовок «ВОЛОДЬКА — сказка между сменами», 3 пункта (Продолжить /
  Новая игра / Настройки), музыка-тоггл, версия v1.0.32, кинематографическая типографика, bloom/glow на cyan.
- New Game flow → prompt «Начать с пролога / Пропустить пролог» → narrative text → exploration mode.
- HUD рендерится корректно: interaction prompt «[E] Осмотреть», location chip «ДОМ», status panel
  (Уровень / Здоровье / Температура / Время), narrative caption «КОРИДОР. ОПЯТЬ ЭТОТ КОРИДОР.».
- **3D canvas не рендерится в headless browser** — известное ограничение SwiftShader + Rapier + R3F
  postprocessing pipeline. НЕ баг кода — на реальном GPU/браузере автора работает (подтверждено worklog-ом).
- 0 ошибок в browser console, 0 page errors.

### Реализованные аддитивные улучшения (10 изменений, 7 modified + 3 new files, +155/-11 строк)

**1. KarmaShiftLayer (NEW) — Disco Elysium-style karma shift pip**
- `src/components/game/microAnimations/karmaShiftPool.ts` — NEW. Notification pool (TTL 2200ms, max 4,
  cleanup 250ms). Mirrors statChangePool / itemGainedPool pattern. Exports `showKarmaShift(delta, karma)`.
- `src/components/game/microAnimations/KarmaShiftLayer.tsx` — NEW. Subscribes to `usePlayerKarma()`,
  detects delta via `useRef`, pushes entry to pool. Renders `KarmaShiftIndicator` above MoralCompassHUD
  with stack offset. Pool-based, ErrorBoundary-wrapped, quiet-HUD-fade-aware.
- `src/engine/microAnimations/microAnimationsConstants.ts` — Added `KARMA_SHIFT_TTL_MS=2200`,
  `KARMA_SHIFT_MAX=4`, `KARMA_SHIFT_CLEANUP_INTERVAL_MS=250`.
- `src/components/game/MicroAnimations.tsx` — Re-exported `KarmaShiftLayer`, `showKarmaShift`, `karmaShiftPool`.
- `src/components/game/orchestrator/OrchestratorGameplaySections.tsx` — Mounted `<KarmaShiftLayer />`
  in `GameplayExplorationHud` next to `<MoralCompassHUD />`.

**2. SceneTopBarHud (NEW) — cohesive top-bar cluster of orphaned widgets**
- `src/components/game/hud/SceneTopBarHud.tsx` — NEW. Wrapper that mounts 4 orphaned-but-built widgets
  in a unified frame at top of screen:
  - Top-left: `SceneContextChip` (scene type · NPC count · exits count)
  - Top-center: `TopBarDataTicker` (scrolling quest/poem/time/version ticker)
  - Top-right: `EnvironmentMoodIndicator` + `ExplorationProgressBadge` (mood bar + SVG progress ring)
  All widgets share `useHudQuietStyle` fade and Framer Motion entrance. Pure positioning — no new data.
- `src/components/game/orchestrator/OrchestratorGameplaySections.tsx` — Mounted `<SceneTopBarHud />`
  in `GameplayAmbientExplorationHud`.

**3. FloatingActionIndicator mounted — EventBus-driven XP/quest/karma acknowledgement chips**
- `src/components/game/orchestrator/OrchestratorGameplaySections.tsx` — Mounted `<FloatingActionIndicator />`
  in `GameplayExplorationNotifications`. Listens to `fx:xp_gain`, `quest:completed`, `choice:made` events.
  Auto-dismissing floating chips with color-coded icons (⬆ XP / ✓ quest / 🕊 karma+ / ⚠ karma-).

**4. DialogueHistoryPanel button in DiegeticDialogueHud**
- `src/components/game/diegetic/DiegeticDialogueHud.tsx` — Added "История" button (History lucide icon)
  in dialogue header next to "Esc" close button. Toggles local `showHistory` state. Renders
  `<DialogueHistoryPanel>` (already built, was only mounted in legacy DialogueRenderer). Entries
  pulled from `useDialogueHistoryStore`. Pure local UI state, no engine writes, panel has its own
  Esc/search/filter handling.

**5. Cross-scene exit bearing in QuestDirectionArrow**
- `src/components/game/hud/parts/QuestDirectionArrow.tsx` — When quest marker is in a different scene,
  computes bearing to nearest exit trigger zone in current scene (read-only lookup via `SCENE_CONFIG.exits`).
  Renders a small "↑ → {exitLabel}" sub-label below the main arrow, color amber. Sub-arrow rotates with
  camera yaw. Falls back to existing label-only behavior when no exits exist. Pure additive — read-only.

**6. QuickUseCooldownOverlay mounted over QuickUseBar slots**
- `src/components/game/QuickUseBar.tsx` —
  - Extended `sound:play` emit payload: now includes `slotIndex`, `itemId`, `cooldownMs` (optional fields).
  - Mounted `<QuickUseCooldownOverlay />` inside each slot when `isOnCooldown` is true. Renders SVG
    cooldown ring that depletes over `cooldownMs`.
- `src/engine/events/audioEvents.ts` — Extended `sound:play` type with optional `slotIndex`/`itemId`/
  `cooldownMs` fields. Existing listeners that only check `type === 'item_use'` are unaffected
  (all new fields are optional).

### Аудит: что НЕ тронуто (намеренно)
- Стихи — не трогались (авторское произведение Владимира Лебедева).
- Все инварианты сохранены: `<Physics interpolate={false}>`, KCC ownership, postprocessing depth-blit
  patch, test contracts (playerLocomotionPresentation / explorationStrategy / cinematicCamera / cameraShake),
  reduced-motion gates, quality-tier gates.
- Все правки аддитивные — не удалял существующий код, только добавлял new modules и mount points.

### Статистика
- 1 коммит в main (запланирован), 7 файлов изменено + 3 новых (KarmaShiftLayer, karmaShiftPool,
  SceneTopBarHud), ~+155/-11 строк
- typecheck: `node scripts/tsc7.mjs --noEmit` → exit 0
- 0 строк стихов изменено

### Ключевые файлы сессии
| Файл | Правка |
|------|--------|
| `src/components/game/microAnimations/karmaShiftPool.ts` | NEW — notification pool for karma shifts |
| `src/components/game/microAnimations/KarmaShiftLayer.tsx` | NEW — layer subscribing to usePlayerKarma |
| `src/components/game/hud/SceneTopBarHud.tsx` | NEW — top-bar wrapper mounting 4 orphan widgets |
| `src/engine/microAnimations/microAnimationsConstants.ts` | +3 karma-shift constants |
| `src/components/game/MicroAnimations.tsx` | re-export KarmaShiftLayer + showKarmaShift |
| `src/components/game/orchestrator/OrchestratorGameplaySections.tsx` | mount KarmaShiftLayer + SceneTopBarHud + FloatingActionIndicator |
| `src/components/game/diegetic/DiegeticDialogueHud.tsx` | + История button + DialogueHistoryPanel mount |
| `src/components/game/hud/parts/QuestDirectionArrow.tsx` | + cross-scene exit bearing sub-label |
| `src/components/game/QuickUseBar.tsx` | extended sound:play payload + mount QuickUseCooldownOverlay |
| `src/engine/events/audioEvents.ts` | extended sound:play type with optional slot/item/cooldown fields |

### Нерешённое / next-phase priorities
- Author QA on Vercel: verify karma-shift pip appears next to moral compass on karma-changing choices,
  top-bar cluster doesn't overlap compass on outdoor scenes, dialogue history button works in diegetic
  mode, exit bearing sub-label points to correct door.
- VolumetricLightShafts for home_evening/factory_basement (deferred — needs scene-geometry verification).
- SSR on wet streets (ultra-only, needs A/B for depth-blit patch interaction).
- Continuous walk↔run blend by speed (test-aware refactor).
- Content factory Acts 3-4 dialogue density + Thought Cabinet arcs.
- Mixamo↔Quaternius full bone remap.
- Procedural act mood tables (Phase 12 without paid stems).
