# Volodka RPG — Improvement Session Worklog

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
