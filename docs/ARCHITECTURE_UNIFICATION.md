# Architecture Unification Backlog

> Sequential waves toward **whole-codebase architectural uniformity**.
> Companion to [`ARCHITECTURE.md`](../ARCHITECTURE.md) Target Uniform Architecture.
> Last updated: 2026-07-31 (Wave 2 + Wave 3 start).

## North star

One pattern per concern. Prefer delete/consolidate over new frameworks.
Poem reveal FIFO is the reference exclusive-UI pattern — do not undo it.

## Wave 1 — DONE

| Cluster | Action |
|---------|--------|
| **A. Interstitial** | Removed parallel `poemDiscoveryRevealActive`; kinds = `matrix_quote` \| `first_reading_celebration` \| `poem_reveal`; legacy discovery setter aliases poem reveal |
| **C. Quality gates** | Deleted dead `QualityPreset` knobs (`useInstancing`, `useImpostors`, `impostorDistance`, `bakedLighting`); heavy features stay on `qualityFeatureGates` |
| **E. Notifications** | Poem discovery language = `PoemRevealHost` only; suppress store `poem`/`quest` toast mirrors; kill `poem:collected` floating text; registry documents channel; shared `buildPoemCollectedToastMessage` |
| **D. Input** | Documented single locomotion write path (`VirtualControlsState` + `keyboardInputState`); no second axis writer |

## Wave 2 — DONE (this session)

| Cluster | Action |
|---------|--------|
| **Exclusive UI** | Folded `quest_complete` + `quest_chain_unlock` into `getActiveExclusiveInterstitialKinds`; panel coordinator publishes flags |
| **Dialogue busy** | Documented store-owned forever (`showStoryOverlay` / `diegeticNarrative`); no dual dialogue busy module |
| **Cinematic schemas** | Deleted dead `npcCutscenes.ts`; shared `waypointsToTimelinePhases`; `cutsceneDefToTimeline` + splash converters → one `CinematicTimelineDef` shape |
| **Shim purge** | Migrated `FirstReadingCelebration` off `poemDiscovery/*`; deleted shim + duplicate shim test |

## Wave 3 — STARTED (this session)

| Cluster | Action |
|---------|--------|
| **Hub ID set** | `STORY_DEFINED_EXPLORE_HUB_IDS` lives on `sceneExploreHubRegistry`; auto-gen skip uses same set (removed duplicate ACT1/ACT_PACK sets) |
| **Golden path** | Documented two spine sources max (derive + fallback); `guidanceHint` = annotation merged into branchHints |

## Inventory of remaining inconsistencies (ordered)

### Wave 3 — Explore / narrative content truth (remainder)

1. Expand `STORY_DEFINED_EXPLORE_HUB_IDS` as more hubs gain act-pack `hubIntroText` (cafe / office / home_evening first); strip leftover registry `hubText` duplicates (validator already fails story-defined dupes).
2. Continue leave-scan ticks for residual next-only mid-beats (Acts 5–7 side chains).
3. Retire `goldenPath.ts` fallback tables as `choice.goldenPath` markers reach coverage — keep fallback only where markers missing.
4. CI eager `STORY_NODES` vs runtime lazy packs — keep parity test; move validators fully onto resolvers.
5. Residual: wire `useCutsceneController` story beats through `startCinematicTimeline(cutsceneDefToTimeline(...))` (converter ready; playback still on `camera:cutscene_*`).

### Wave 4 — Graphics / GPU lifecycle

1. Audit ad-hoc `dispose()` outside `sceneGpuLifecycle` / ownership claims.
2. Hero-scene PostFX on low (`resolveSceneRenderingPipeline` gap) — one policy table.
3. Wire or delete any remaining unused preset/detail strings in settings UI.
4. Ensure MeshPhysical / wet / CRT consumers never bypass `allowsHeavyGfxFeature`.

### Wave 5 — Notifications / FX hygiene

1. Sweep `ui:exploration_message` vs `EventNotificationPopup` vs diegetic HUD for duplicate hub toast copy.
2. Confirm FloatingText never re-subscribes to discovery / quest complete events.
3. Collapse unused `showPoemToast` API if no DevPanel caller remains (or route DevPanel through reveal request).

### Wave 6 — Input / a11y polish

1. Ensure mouse-both-buttons forward never fights gamepad clear on overlay lock (single clear API already exists).
2. Touch HUD + gamepad both write only `sharedVirtualControlsRef` — add a unit test that samples merge order with keyboard singleton.

### Wave 7 — Docs / zombie purge

1. Delete remaining deprecated aliases after zero imports (`setPoemDiscoveryRevealInterstitialActive`).
2. Keep `ARCHITECTURE.md` migration table in sync each wave; bump honest % below.

## Honest uniformity estimate

| After | Whole-codebase uniform (rough) |
|-------|--------------------------------|
| Poem reveal only (pre-wave) | ~35% |
| Wave 1 | ~48% |
| **Wave 2 + Wave 3 start (this session)** | **~62%** |
| Waves 3 remainder–5 | ~80% |
| Full backlog | ~90%+ (never 100% — content/AI gen edges remain) |

Estimate is architectural pattern coverage, not line-count rewrite.
