# Architecture Unification Backlog

> Sequential waves toward **whole-codebase architectural uniformity**.
> Companion to [`ARCHITECTURE.md`](../ARCHITECTURE.md) Target Uniform Architecture.
> Last updated: 2026-07-31 (BRANCH_HINTS emptied; Mixamo↔Quaternius remap step).

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

## Wave 4 — DONE

| Cluster | Action |
|---------|--------|
| **PostFX low policy** | `resolveSceneRenderingPipeline`: low always lite even when `forceFullPostFx` |
| **GPU unload path** | `releaseSceneGpuOnUnload` = ownership + GLTF eviction behind `shouldUnloadSceneGpuOnTransition`; `bindSceneChunkGpuLifecycle` is the unload binder; Bridge = enter warm only; `disposeEphemeralGpuResources` for component clones; star/ground buffers → `useOwnedBufferGeometry` |
| **Settings detail strings** | Dropped unused English `QualityPreset.label`; Settings buttons use `labelRu`; RU detail aligned to gates (reflector @ medium; MeshPhysical accents @ high/ultra) |
| **MeshPhysical gates** | Hero street neon/glass + `home_evening` night window via `allowsSelectiveMeshPhysicalWet` / `roomNightWindow`; CRT/wet hubs already on gates |

## Wave 5 — DONE

| Cluster | Action |
|---------|--------|
| **Toast API** | Deleted unused `showPoemToast` / `showQuestToast` |
| **FloatingText** | Confirmed + tested: no `poem:collected` / `quest:completed` spawn mirrors |
| **Hub toast** | Already single path (`ui:exploration_message` / first-visit `game:notification` → `EventNotificationPopup`); no further duplicate copy found |
| **Expanded leave** | Acts 5–7 / expansion leave-scan clean; quiet-hour hub↔vignette loops intentional |

## Wave 6 — DONE

| Cluster | Action |
|---------|--------|
| **Mouse vs gamepad clear** | `setSharedVirtualControlsWritable(false)` on overlay lock clears axes + blocks writers; mouse-both-buttons uses `applyMouseBothButtonsForward`; gamepad block uses `clearSharedVirtualControls()` |
| **Merge-order test** | `locomotionInputMerge.test.ts` — keyboard wins over virtual; virtual when idle; write-gate blocks mouse fight after clear |

## Wave 7 — DONE

| Cluster | Action |
|---------|--------|
| **Zombie alias** | Deleted `setPoemDiscoveryRevealInterstitialActive` (zero production imports) |
| **BRANCH_HINTS** | Removed 95 rows where `node.guidanceHint` owns copy; 31 table-only fallbacks remain |
| **CI story nodes** | Validator reads via `getCiParityStoryNodes()` from `contentTruthManifest` (eager parity; runtime stays lazy packs) |
| **Docs** | `ARCHITECTURE.md` migration table + uniformity bumped |

## Follow-up (post Wave 7) — DONE this session

| Cluster | Action |
|---------|--------|
| **BRANCH_HINTS → nodes** | Authored `guidanceHint` on all 31 former table-only nodes (act1/3/4 JSON, solnysh, CHK, park hub prose); `GOLDEN_PATH_BRANCH_HINTS` emptied |
| **Mixamo↔Quaternius remap** | `remapClipTracksToSkeleton` + alias map (Mixamo classic + KayKit `hand.l` / `Rig_Medium`); strip Quaternius `Body` root translation; dotted-bone track split |
| **Leave-scan** | Reconfirmed: no new true soft-locks; quiet-hour hub↔vignette loops intentional |

## Inventory of remaining inconsistencies

1. Content/AI-gen edges and remaining Mixamo finger/slot fidelity — not pattern unification.
2. Dual registry (eager CI vs lazy runtime) stays by design — parity test + `getCiParityStoryNodes` are the bridge.
3. MeshPhysical thin-hub polish / GLB mass re-export — asset/content debt, not architecture waves.

## Honest uniformity estimate

| After | Whole-codebase uniform (rough) |
|-------|--------------------------------|
| Poem reveal only (pre-wave) | ~35% |
| Wave 1 | ~48% |
| Wave 2 + Wave 3 start | ~62% |
| Wave 3 done + Wave 4 PostFX policy | ~72% |
| Wave 4 + Wave 5 hygiene | ~80% |
| **Waves 6–7 done** | **~90%** |
| **Post Wave 7 follow-up (hints + remap step)** | **~92%** |
| Theoretical ceiling | never 100% — content/AI gen edges remain |

Estimate is architectural pattern coverage, not line-count rewrite.
