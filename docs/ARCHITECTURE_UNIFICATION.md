# Architecture Unification Backlog

> Sequential waves toward **whole-codebase architectural uniformity**.
> Companion to [`ARCHITECTURE.md`](../ARCHITECTURE.md) Target Uniform Architecture.
> Last updated: 2026-07-31 (Wave 1).

## North star

One pattern per concern. Prefer delete/consolidate over new frameworks.
Poem reveal FIFO is the reference exclusive-UI pattern — do not undo it.

## Wave 1 — DONE (this session)

| Cluster | Action |
|---------|--------|
| **A. Interstitial** | Removed parallel `poemDiscoveryRevealActive`; kinds = `matrix_quote` \| `first_reading_celebration` \| `poem_reveal`; legacy discovery setter aliases poem reveal |
| **C. Quality gates** | Deleted dead `QualityPreset` knobs (`useInstancing`, `useImpostors`, `impostorDistance`, `bakedLighting`); heavy features stay on `qualityFeatureGates` |
| **E. Notifications** | Poem discovery language = `PoemRevealHost` only; suppress store `poem`/`quest` toast mirrors; kill `poem:collected` floating text; registry documents channel; shared `buildPoemCollectedToastMessage` |
| **D. Input** | Documented single locomotion write path (`VirtualControlsState` + `keyboardInputState`); no second axis writer |

## Inventory of remaining inconsistencies (ordered)

### Wave 2 — Exclusive UI + presentation (high leverage)

1. Optionally fold **quest-complete / chain-unlock busy** into `getActiveExclusiveInterstitialKinds` (today panel-coordinator refs + `questAcceptDeferral`).
2. Document dialogue busy as store-owned forever **or** add thin adapters that publish to interstitial subscribers (avoid dual HUD profiles).
3. Kill remaining **cinematic registry schema triples** (`cutscenes` / `npcCutscenes` / `interactionSplashes`) → one timeline descriptor shape.
4. Deprecate zombie re-exports once call sites migrate (`poemDiscovery/*` shim → delete after import sweep).

### Wave 3 — Explore / narrative content truth

1. Expand `STORY_DEFINED_EXPLORE_HUB_IDS` as more hubs gain act-pack `hubIntroText`; strip leftover registry `hubText` duplicates (validator already fails story-defined dupes).
2. Continue leave-scan ticks for residual next-only mid-beats (Acts 5–7 side chains).
3. Golden path **triple source** (`deriveGoldenPath` + manual fallback + per-node `guidanceHint`) → two sources max.
4. CI eager `STORY_NODES` vs runtime lazy packs — keep parity test; move validators fully onto resolvers.

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

1. Delete deprecated shims after zero imports (`setPoemDiscoveryRevealInterstitialActive`, `poemDiscoveryRevealOrchestrator` re-export file).
2. Keep `ARCHITECTURE.md` migration table in sync each wave; bump honest % below.

## Honest uniformity estimate

| After | Whole-codebase uniform (rough) |
|-------|--------------------------------|
| Poem reveal only (pre-wave) | ~35% |
| **Wave 1 (this session)** | **~48%** |
| Waves 2–3 | ~65% |
| Waves 2–5 | ~80% |
| Full backlog | ~90%+ (never 100% — content/AI gen edges remain) |

Estimate is architectural pattern coverage, not line-count rewrite.
