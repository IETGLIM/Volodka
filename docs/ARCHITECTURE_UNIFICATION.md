# Architecture Unification Backlog

> Sequential waves toward **whole-codebase architectural uniformity**.
> Companion to [`ARCHITECTURE.md`](../ARCHITECTURE.md) Target Uniform Architecture.
> Last updated: 2026-07-31 (Wave 4 done + Wave 5 toast/float hygiene).

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

## Wave 2 — DONE

| Cluster | Action |
|---------|--------|
| **Exclusive UI** | Folded `quest_complete` + `quest_chain_unlock` into `getActiveExclusiveInterstitialKinds`; panel coordinator publishes flags |
| **Dialogue busy** | Documented store-owned forever (`showStoryOverlay` / `diegeticNarrative`); no dual dialogue busy module |
| **Cinematic schemas** | Deleted dead `npcCutscenes.ts`; shared `waypointsToTimelinePhases`; `cutsceneDefToTimeline` + splash converters → one `CinematicTimelineDef` shape |
| **Shim purge** | Migrated `FirstReadingCelebration` off `poemDiscovery/*`; deleted shim + duplicate shim test |

## Wave 3 — DONE

| Cluster | Action |
|---------|--------|
| **Hub ID set** | `STORY_DEFINED_EXPLORE_HUB_IDS` + `ACT_PACK_STRUCTURE_EXPLORE_HUB_IDS`; cafe / office / home_evening prose in `act1.json`; auto-gen still builds choices, strips registry `hubText` |
| **Golden path** | Markers cover full spine (0 fallback steps); `GOLDEN_PATH_STORY_SPINE` = CI parity snapshot; shrunk exact-duplicate `BRANCH_HINTS` rows |
| **Leave-scan** | Acts 5–7 expanded meshes are finite climax chains (leave at act7 epilogue); solnysh roof mid-beat gained leave; no true soft-locks left in scan |
| **Cutscene playback** | `useCutsceneController` → `startCinematicTimeline(cutsceneDefToTimeline(...))`; camera/overlay via `CinematicTimelineRunner` |

## Wave 4 — DONE (this session)

| Cluster | Action |
|---------|--------|
| **PostFX low policy** | `resolveSceneRenderingPipeline`: low always lite even when `forceFullPostFx` |
| **GPU unload path** | `releaseSceneGpuOnUnload` = ownership + GLTF eviction behind `shouldUnloadSceneGpuOnTransition`; `bindSceneChunkGpuLifecycle` is the unload binder; Bridge = enter warm only; `disposeEphemeralGpuResources` for component clones; star/ground buffers → `useOwnedBufferGeometry` |
| **Settings detail strings** | Dropped unused English `QualityPreset.label`; Settings buttons use `labelRu`; RU detail aligned to gates (reflector @ medium; MeshPhysical accents @ high/ultra) |
| **MeshPhysical gates** | Hero street neon/glass + `home_evening` night window via `allowsSelectiveMeshPhysicalWet` / `roomNightWindow`; CRT/wet hubs already on gates |

## Wave 5 — DONE (partial, this session)

| Cluster | Action |
|---------|--------|
| **Toast API** | Deleted unused `showPoemToast` / `showQuestToast` |
| **FloatingText** | Confirmed + tested: no `poem:collected` / `quest:completed` spawn mirrors |
| **Hub toast** | Already single path (`ui:exploration_message` / first-visit `game:notification` → `EventNotificationPopup`); no further duplicate copy found |
| **Expanded leave** | Acts 5–7 / expansion leave-scan clean; quiet-hour hub↔vignette loops intentional |

## Inventory of remaining inconsistencies (ordered)

### Wave 6 — Input / a11y polish

1. Ensure mouse-both-buttons forward never fights gamepad clear on overlay lock (single clear API already exists).
2. Touch HUD + gamepad both write only `sharedVirtualControlsRef` — add a unit test that samples merge order with keyboard singleton.

### Wave 7 — Docs / zombie purge

1. Delete remaining deprecated aliases after zero imports (`setPoemDiscoveryRevealInterstitialActive`).
2. Keep `ARCHITECTURE.md` migration table in sync each wave; bump honest % below.
3. Residual: CI eager `STORY_NODES` vs runtime lazy packs — keep parity test; move validators fully onto resolvers.
4. Further `BRANCH_HINTS` shrinkage where `guidanceHint` differs but node should own copy.
5. Optional expanded-pack mid-resume leftovers if leave-scan finds new soft-locks.

## Honest uniformity estimate

| After | Whole-codebase uniform (rough) |
|-------|--------------------------------|
| Poem reveal only (pre-wave) | ~35% |
| Wave 1 | ~48% |
| Wave 2 + Wave 3 start | ~62% |
| Wave 3 done + Wave 4 PostFX policy | ~72% |
| **Wave 4 + Wave 5 hygiene** | **~80%** |
| Full backlog (Waves 6–7) | ~90%+ (never 100% — content/AI gen edges remain) |

Estimate is architectural pattern coverage, not line-count rewrite.
