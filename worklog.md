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
