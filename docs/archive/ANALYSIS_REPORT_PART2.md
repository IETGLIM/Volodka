# ANALYSIS REPORT PART 2 — Deep Codebase Analysis

Generated: 2025-07-11
Scope: 3D Rendering, Combat, NPC/AI, Animation, Audio

---

## 1. 3D Rendering and Scene

### 1.1 Current State

**GPU Resource Lifecycle (engine/three/):**
- A sophisticated GPU resource management system exists with `gpuResourceLifecycle.ts` as the central teardown coordinator. It handles both full engine disposal and HMR hot-reload cycles.
- `moduleGeometryRegistry.ts` and `moduleMaterialRegistry.ts` provide shared caching with refcounted per-scene ownership (`sceneGpuOwnership.ts`). Geometries and materials are claimed when a scene module loads and released on `scene:unload`.
- `disposeThreeResources.ts` (381 lines) is extremely thorough — handles all drawable types (Mesh, SkinnedMesh, InstancedMesh, Points, Line, LineSegments, Sprite), all 29 texture-bearing material keys, ShaderMaterial uniforms, skeleton bone textures, shadow maps, and EffectComposer passes.
- An `ObjectPool<T>` class (`objectPool.ts`) provides capped pooling for transient VFX with `maxSize` limits, `disposeOverflow` callbacks, and GPU-leak warnings.
- `sceneGpuOwnership.ts` implements refcounted GPU resource sharing: shared geometry/material survives until every scene that claims it releases.

**Materials (moduleMaterialRegistry.ts):**
- Shared `MeshStandardMaterial` instances with automatic "AAA de-plasticize" pass — clamps envMapIntensity, enforces roughness floors, reduces metalness for organic-looking materials. Named `mat()` shorthand.
- Only `MeshStandardMaterial` is cached. `ShaderMaterial`, `MeshBasicMaterial`, etc. are NOT in the registry.

**Lighting (components/3d/Lighting.tsx):**
- Per-scene tuned lighting with ~20+ scene entries in `SCENE_ACCENT_LIGHTS`, `INDOOR_AMBIENT`, `INDOOR_FILL`, and `OUTDOOR_READABILITY_AMBIENT`.
- Animated accent lights: `neon_cycle` (hue shift), `candle_flicker` (multi-sine organic flicker), `cold_pulse` (server room data-flow feeling).
- Time-of-day lighting via `TimeOfDayAdjuster` — imperative per-frame updates to directional light color/intensity/position.
- Shadow quality tiers: `low=off, medium=512, high=1024, ultra=2048`.
- Canonical shadow bias constants exported (`CANONICAL_SHADOW_BIAS = -0.002`, `CANONICAL_SHADOW_NORMAL_BIAS = 0.04`).
- Mobile optimization: max 2 accent lights on mobile, 512px shadow on mobile.
- Scene-dimension-aware shadow camera frustum sizing (falls back to `config.size` when `config.dimensions` is missing).

**LOD System (engine/lod/distanceLod.ts, components/3d/lod/):**
- NPC LOD: 3-tier (`culled` / `impostor` / `full`) with hysteresis bands (cullIn=28, cullOut=32, impostorIn=11, impostorOut=17).
- Environment LOD: 3-tier (`minimal` / `standard` / `full`) with hysteresis bands, per-scene profiles (e.g. `volodka_room`: clutter=8, decorative=10; `park_day`: clutter=18, decorative=28).
- `EnvironmentLodProvider` React context supplies live player position + thresholds.
- `threeLodGroup.ts` provides native Three.js `LOD` group wrapper with proper disposal.

**Physics (engine/physics/):**
- `groundProbe.ts`: Raycast-based ground detection with slope filtering (45° max via `MIN_GROUND_NORMAL_Y = cos(π/4)`), ceiling rejection, and per-collider/rigidbody exclusion.
- `groundProbeCache.ts`: Cached ground probes.
- `rapierTypes.ts`, `rapierCompat.ts`: Type-safe Rapier wrappers.
- `preloadPhysicsChunk.ts`: Physics chunk preloading.

### 1.2 Discovered Problems

| # | Severity | File | Line(s) | Description |
|---|----------|------|---------|-------------|
| R1 | LOW | `engine/three/moduleMaterialRegistry.ts` | 75-107 | `aaaDeplasticizeParams` uses string-based heuristic (`nameHint`) to classify materials as organic. `typeof params.color === 'string'` (line 79) means any hex-color material is treated as organic, which may be wrong for neon signs or metal objects specified by hex. |
| R2 | LOW | `components/3d/Lighting.tsx` | 103 | `getShadowMapResolution(preset.id as any)` — unsafe `as any` cast. If `preset.id` doesn't match the expected union, runtime behavior is undefined. |
| R3 | MEDIUM | `engine/three/moduleGeometryRegistry.ts` | 166 | `resetSceneGpuOwnershipForTests()` called inside `disposeAllModuleGeometries()` (a non-test path). While harmless (it just clears maps), it's a semantic confusion — the test helper leaks into production disposal. |
| R4 | LOW | `engine/three/objectPool.ts` | 44-53 | When pool is at capacity and `disposeOverflow` is unset, the warning is logged but the item is **silently dropped**. The item (possibly containing GPU resources) is never disposed — GPU leak. |
| R5 | LOW | `components/3d/lod/EnvironmentLodProvider.tsx` | 25-28 | Default thresholds use `clutterDistance: 999, decorativeDistance: 999` — effectively disabling LOD when the provider isn't mounted or when `useEnvironmentLod()` is called outside the provider tree. This is a silent failure mode. |
| R6 | INFO | `engine/physics/groundProbe.ts` | 70 | The ceiling rejection check `if (hitY > originY) return fallbackFloorY` correctly rejects hits above the ray origin, but the comment says "Any hit at or above the ray origin" while the code uses `>` (strict). A hit exactly at originY would be accepted, which is technically fine. |

### 1.3 Potential Improvements

1. **InstancedMesh batching for clutter props:** Currently each environment prop is a separate mesh. For repeated props (crates, barrels), use `InstancedMesh` with per-instance transforms to reduce draw calls dramatically.
2. **Material registry should extend to ShaderMaterial:** `moduleMaterialRegistry` only caches `MeshStandardMaterial`. Custom shader materials used in VFX, post-processing overlays, and custom scene visuals are not tracked.
3. **Shadow cascade maps:** The current shadow system uses a single directional light shadow map. For outdoor scenes (`park_day`, `street_night`, `city_square`), cascaded shadow maps (CSM) would eliminate shadow pixellation at the far frustum.
4. **GPU memory budget enforcement:** `GpuResourceBudgetTracker` is referenced but no hard limit enforcement was found. On mobile, scene transitions could OOM without an eviction strategy.
5. **Lighting data-driven refactor:** 20+ scenes of hardcoded accent light arrays in `Lighting.tsx` (lines 403-532) could move to the scene config system (`config/scenes`) for better modularity.

### 1.4 Bug List (sorted by criticality)

1. **[LOW] GPU leak in ObjectPool** — `engine/three/objectPool.ts:44-53` — Items dropped at capacity without `disposeOverflow` leak GPU resources. No runtime crash, but progressive memory degradation during long combat sequences.
2. **[LOW] Silent LOD bypass** — `components/3d/lod/EnvironmentLodProvider.tsx:25-28` — Components consuming LOD outside the provider context get `distance: 999` thresholds, defeating LOD. Likely benign in practice (provider wraps all 3D content) but fragile.
3. **[INFO] Test helper in production path** — `engine/three/moduleGeometryRegistry.ts:166` — `resetSceneGpuOwnershipForTests()` called during `disposeAllModuleGeometries()`. No functional bug but a code smell.

---

## 2. Combat System

### 2.1 Current State

**Architecture:** Turn-based RPG combat with:
- Pure function pipeline: `formulas.ts` (damage), `enemyTurn.ts` (incoming damage), `buffSystem.ts` (buffs/debuffs), `combatDifficulty.ts` (scaling), `combatRng.ts` (seeded RNG with pity).
- `enemies.ts` — Large file (78KB+) defining enemy templates with special attacks, bark lines, and loot tables.
- `types.ts` — Re-exports from shared types, adds `EnemyTemplate`, `PoemCombatAbility`, `isBossEnemyType()`.
- UI: 22-component combat UI system under `components/game/combatUi/` (health bars, action bar, log, thought badges, boss cinematic, etc.).

**Damage Pipeline (enemyTurn.ts, 8 layers):**
1. Base damage from enemy attack + buffs
2. Difficulty scaling (act/level)
3. Player defending → defended damage
4. Player defense boost buff → flat reduction
5. Player damage_reduction buff → fractional reduction
6. Player vulnerability buff → fractional amplification
7. Spiritual skills → fractional reduction (5% per level)
8. Perk incoming damage reduction → fractional reduction

**RNG System (combatRng.ts):**
- Deterministic Mulberry32 PRNG seeded from `player.rngSeed + encounterSeq + enemyType hash`.
- Soft pity: +4% crit per roll after 6 non-crits, guaranteed crit at 14.
- Variance floor pity: minimum damage factor increases after 8 low-variance rolls.
- Save/load deterministic: RNG state is part of `CombatState` and serialized.

**Buff System (buffSystem.ts):**
- Max 2 active buffs + 2 active debuffs per target.
- Mutual exclusion: `stun_immune` blocks `skip_turn`, `stun_immune` clears existing `skip_turn`.
- Refresh-on-reapply (spamming Defend refreshes duration, doesn't stack).
- Priority-based eviction: lowest-priority buff evicted when at cap.
- 10 effect types: `stun_immune`, `skip_turn`, `silence_specials`, `defensive_verse`, `damage_reduction`, `defense_boost`, `damage_multiplier`, `attack_boost`, `defense_reduction`, `stat_drain`, `hp_drain_percent`.

**Difficulty (combatDifficulty.ts):**
- 3 legacy presets (story/normal/hard) with `enemyDamageMultiplier`.
- 5-level user-facing difficulty (via `difficultySlice`) registered as a getter at boot.
- Act scaling: +15% per act beyond first.
- Level scaling: +10% per player level beyond first.
- At Act 5 / Level 10 on Normal: 3.04× multiplier.

**Player Stats (formulas.ts):**
- Attack = coding + logic + perk bonuses + thought bonuses + equipment bonuses.
- Defense = empathy + floor(energy/10) × perk defense multiplier + perk flat + thought bonuses + equipment bonuses.
- Max HP = max(20 + (level-1)×5, energy×2) + thought HP bonus.
- Crit = min(0.5, 0.1 + writing×0.02 + thought crit bonus).

### 2.2 Discovered Problems

| # | Severity | File | Line(s) | Description |
|---|----------|------|---------|-------------|
| C1 | MEDIUM | `engine/combat/formulas.ts` | 161-167 | `getEquippedItemsSafe()` catches ALL errors and returns `{}`. If the player store is initialized but `equippedItems` has an unexpected shape, equipment bonuses silently vanish. No logging. |
| C2 | LOW | `engine/combat/buffSystem.ts` | 80-96 | `MUTUALLY_EXCLUSIVE` map is defined INSIDE `addBuff()` on every call. This is a per-call allocation of a 10-entry object. Should be a module-level constant. |
| C3 | LOW | `engine/combat/formulas.ts` | 151-153 | `snap()` calls `getGameSnapshot()` which is an imperative store read — this function is called multiple times per damage calculation. Should snapshot once at the top of each public function. |
| C4 | INFO | `engine/combat/enemyTurn.ts` | 93 | The comment says "Layer 3: Player defending (damage_reduction buff)" but this is actually checking for the `damage_reduction` buff, not the defend action. The naming is confusing: `computeDefendedDamage` is only called when player has `damage_reduction` buff, not when they chose the Defend action. |
| C5 | INFO | `engine/combat/combatRng.ts` | 157-161 | `nextInt(min, max)` uses `Math.floor(this.nextFloat() * (hi - lo + 1))` which gives a slightly non-uniform distribution when `(hi - lo + 1)` doesn't divide evenly into 2^32. Negligible in practice. |
| C6 | LOW | `engine/combat/types.ts` | 60-64 | `BOSS_ENEMY_TYPES` is a hardcoded set of 3 boss types. New boss types added to `enemies.ts` must also be registered here — no compile-time enforcement. Should derive from `EnemyTemplate` data. |

### 2.3 Potential Improvements

1. **Defend action is not in the damage pipeline:** `enemyTurn.ts:93` applies `computeDefendedDamage` only when a `damage_reduction` buff exists. The Defend action (which the player explicitly chooses) should be a separate input to the damage pipeline, not conflated with a buff.
2. **Equipment bonus double-read:** `getPlayerAttack()` and `getPlayerDefense()` both call `snap()` independently. If the store changes between the two calls (unlikely but possible during async dispatches), attack and defense would be computed from different game states.
3. **Enemy file size:** `enemies.ts` at 78KB is the single largest engine file. Split into per-act enemy definitions (enemies-act1.ts, enemies-act2.ts, etc.).
4. **Buff system should be data-driven:** The 10 effect types with their derived getters (`getPlayerDamageMultiplier`, `getEnemyAttackBoost`, etc.) are hand-written. A registry pattern would make adding new buff types trivial.
5. **Combat log performance:** `appendLog()` in `types.ts:73-76` creates a new array and slices on every log entry. For a 50-entry log with spread syntax, this creates temporary arrays. Use a ring buffer instead.

### 2.4 Bug List (sorted by criticality)

1. **[MEDIUM] Silent equipment bonus loss** — `engine/combat/formulas.ts:161-167` — `getEquippedItemsSafe()` swallows all errors with no logging. If the store binding breaks (e.g., during HMR), all equipment combat bonuses silently disappear. Player won't see their equipped ring's +2 coding bonus.
2. **[LOW] Per-call MUTUALLY_EXCLUSIVE allocation** — `engine/combat/buffSystem.ts:80-96` — Allocates a 10-entry object on every `addBuff()` call. In a combat with many buffs, this is unnecessary GC pressure.
3. **[LOW] Boss type list not enforced** — `engine/combat/types.ts:60-64` — New boss types in `enemies.ts` won't get cinematic UI treatment unless manually added to `BOSS_ENEMY_TYPES`.
4. **[INFO] Multiple snapshot reads per calculation** — `engine/combat/formulas.ts:151-153` — `snap()` called multiple times per public function. Theoretically could return inconsistent state.

---

## 3. NPC System and AI

### 3.1 Current State

**Render Tier System (npcRenderTier.ts):**
- 3 tiers: `hero` (always full visual + Mixamo clips + head tracking + name labels + proximity barks + quest markers), `interactive` (same features), `background` (static idle only, no head tracking, no labels, no barks).
- Hero NPCs are hardcoded in a 28-entry `HERO_NPC_IDS` set.
- Crowd scenes (9 entries in `CROWD_SCENE_IDS`) default non-dialogue NPCs to background tier.
- Per-NPC override via `NPCDefinition.renderTier`.

**State Machine (npcStateMachine.ts):**
- 4 states: `idle`, `walk`, `talk`, `combat`.
- Valid transitions: `combat → {idle, walk}` (blocked `combat → talk` to prevent combat pose blending into dialogue).
- Exhaustive switch on `InteractionState` with compile-time enforcement via `never` type.

**Patrol System (npcPatrol.ts):**
- Waypoint-based patrol with idle durations (2-5s random).
- A* nav mesh pathfinding integration (`navMeshPathfinder.ts`): binary heap A* on grid, line-of-sight smoothing, max 200 cells explored.
- Fallback: direct interpolation when nav mesh unavailable or waypoints close (<2m).
- Ray-avoidance steering for non-nav-mesh movement (wall avoidance).
- `shouldPatrol()` gates: only during `idle`/`walk`/`rest` activities, not during interactions or `sleep`/`work`.

**Frame Batch System (npcFrameBatch.ts):**
- Central `useFrameTick` coordinator for ALL NPC updates.
- 5 callback kinds: `main` (0), `mixer` (1), `procedural` (2), `overlay` (3), `sprite` (4).
- Token-based registration survives React remount races.
- Dirty-flag re-sorting on registration changes.

**Head Tracking (headTracking.ts, 627 lines):**
- Supports both bone-based (GLB skeletons) and group-based (procedural models) head objects.
- Two modes: direct `updateHeadTracking` (full quaternion slerp) and layered `applyLayeredHeadTracking` (additive on top of animation).
- Proximity-aware intensity scaling: 5m proximity radius, 8m activation distance.
- Emotion-driven intensity: different emotions change tracking speed and max angle.
- Pause/resume during dialogue with 600ms transition delay.
- Zero-allocation hot path: pre-allocated Vector3/Quaternion temps per NPC.
- Safe quaternion math: handles degenerate directions and anti-parallel vectors.

**Visual Behavior (useNpcVisualBehavior.ts):**
- Unified FSM → animation state resolver.
- Bus-driven animation overrides during interactions (via `npc:animation` event).
- Emotion-driven animation state overrides.
- Idle variant selection from NPC definitions.
- Head tracking pause/resume integration.

**Sprite Pool (npcSpritePool.ts):**
- Ref-counted canvas texture pool for NPC name labels, speech bubbles, quest markers, and activity barks.
- Shared `SpriteMaterial` template cloned per sprite.

**Nav Mesh (navMeshPathfinder.ts, navMeshBuilder.ts):**
- Grid-based A* with binary heap.
- Line-of-sight path smoothing.
- Snap-to-walkable for start/end positions (4-cell search radius).
- Fallback direct path when nav mesh unavailable.

**NPC Composer (config/npcComposer/):**
- Part catalog, recipes, and type resolution for procedurally composed NPCs.
- `resolveComposeRecipe()` builds NPC appearance from parts.

### 3.2 Discovered Problems

| # | Severity | File | Line(s) | Description |
|---|----------|------|---------|-------------|
| N1 | LOW | `engine/npc/npcRenderTier.ts` | 8-46 | `HERO_NPC_IDS` is a hardcoded 28-entry set. New story NPCs added to `allNpcDefinitions.ts` but not here will be `interactive` tier instead of `hero`. No compile-time check. |
| N2 | LOW | `engine/npc/npcPatrol.ts` | 91 | `randomIdleDuration()` uses `Math.random()` — not seeded, so NPC idle timing varies between saves/replays. Minor for gameplay, but inconsistent with combat's seeded RNG philosophy. |
| N3 | LOW | `engine/npc/headTracking.ts` | 549 | `resolveProximityIntensity()` compares `distance` (which is `distSq` from `npcGroup.position.distanceToSquared`) against squared radius constants (`proximitySq`, `activationSq`). However, the function name and parameter name say `distance`, and the interpolation at line 558 uses `Math.sqrt(distance)` — this is correct but confusing. The parameter should be named `distSq`. |
| N4 | INFO | `engine/npc/npcFrameBatch.ts` | 51 | `entries.findIndex()` is O(n) on every unregister. With many NPCs, this is O(n²) cumulative for mass unregister (scene transitions). Consider a `Map<token, index>` or using `filter`. |
| N5 | LOW | `engine/npc/npcSpritePool.ts` | 301-310 | `createNpcSpriteMaterial()` clones from a shared template but the template itself is never disposed (only nulled in `evictNpcSpritePool()`). If the template accumulates state across HMR cycles, it could leak. |
| N6 | INFO | `engine/npc/navMeshPathfinder.ts` | 231 | A* allows re-visiting nodes — the `openSet` can contain duplicate entries for the same cell with different f-scores. While the `gScore` check prevents incorrect paths, it wastes heap operations. A closed-set check would be more efficient. |

### 3.3 Potential Improvements

1. **Hero NPC auto-detection:** Instead of a hardcoded set, derive hero tier from NPC definition data (e.g., `hasStoryRole: true` or `priority: 'hero'`).
2. **Nav mesh dynamic updates:** Currently the nav mesh is static per scene. Dynamic obstacles (pushable crates, doors opening/closing) are not reflected. Consider runtime nav mesh invalidation.
3. **NPC render tier should be part of NPCDefinition type:** Currently `renderTier` is an optional field that must be manually set. Making it a required discriminated union would catch missing assignments at compile time.
4. **Batch sprite rendering:** Each NPC label/bubble is an individual `Sprite` with its own draw call. For 20+ NPCs, a single `InstancedMesh` with UV-offset textures or a single canvas atlas would reduce draw calls.
5. **Patrol should use seeded RNG:** For save/load consistency, patrol idle durations should be derived from the NPC ID + patrol index, not `Math.random()`.

### 3.4 Bug List (sorted by criticality)

1. **[LOW] Hero NPC list is not data-driven** — `engine/npc/npcRenderTier.ts:8-46` — New story NPCs may silently get wrong render tier.
2. **[LOW] Unseeded patrol timing** — `engine/npc/npcPatrol.ts:91` — NPCs have different idle timings across play sessions.
3. **[INFO] O(n²) frame batch unregister** — `engine/npc/npcFrameBatch.ts:51` — Could cause frame spikes during scene transitions with many NPCs.
4. **[INFO] A* allows duplicate open-set entries** — `engine/npc/navMeshPathfinder.ts:231` — Wasted computation but no correctness issue.

---

## 4. Animation System

### 4.1 Current State

**Mixamo Clip Loading (useMixamoAnimationClips.ts):**
- Two-tier loading: **critical clips** (idle, walking, sitting, sleeping) load immediately in parallel; **deferred clips** (talking, working, etc.) load sequentially through the GLTF preload scheduler.
- Critical locomotion pair (idle + walking) is published **atomically** via `queueMicrotask` to prevent incompatible mixed poses.
- Deferred clips are gated by `isUiOverlayBlockingDeferredAssets()` and `requestIdleCallback`.
- Clip track filtering: `filterClipTracksToExistingNodes`, `remapClipTracksToSkeleton`, `stripRootTranslationTracks` ensure retargeted clips only modify bones present in the target skeleton.
- Cleanup: all created `AnimationAction`s are stopped and uncached from the mixer on unmount.

**Skinned GLTF Clone (useSkinnedGltfClone.ts):**
- Deep-clones a cached GLTF scene with independent skeletons using `SkeletonUtils.clone()` (with fallback to `deepCloneWithSkeletons`).
- Clone work is deferred via `requestIdleCallback` (32ms timeout) to avoid rAF hitches.
- Proper cleanup: previous clone is disposed (mixer stopped, GPU resources freed) before creating a new one.

**NPC Animation (useNPCAnimation.ts):**
- State-based crossfade system with 0.42s transition duration.
- Tracks previous action to fade only the old→new pair (not blanket fadeOut on all clips).
- Force-idle on first action population only (not on subsequent Mixamo clip loads, which would cause visible "stumbles").
- `locomotionBlend` option defers idle/walk/listen to `useNpcLocomotionBlend`.

**Clip Resolution (npcClipResolution.ts):**
- Hierarchical clip lookup: embedded GLB clips → Mixamo overrides → fallback.
- Per-NPC animation state mapping (e.g., `idle` → `mixamo_idle`, `walk` → `mixamo_walking`).

**Locomotion Blend (useNpcLocomotionBlend.ts):**
- Weight-based locomotion blending between idle and walk animations.
- Avoids hard crossfade hitches during walk↔idle transitions.

**Activity Animation (npcActivityAnimation.ts):**
- Maps schedule activities (work, read, rest, sleep) to animation states and clip overrides.
- Schedule-aware: NPCs in 'work' activity get a 'working' animation override.

**Idle Variants (npcIdleVariants.ts):**
- Per-NPC idle animation variants (e.g., `idle_variant_arms_crossed`).
- Emotion-aware idle selection.

### 4.2 Discovered Problems

| # | Severity | File | Line(s) | Description |
|---|----------|------|---------|-------------|
| A1 | LOW | `hooks/useMixamoAnimationClips.ts` | 236 | Dependency array includes `MIXAMO_CLIP_IDS_ON_DISK.join(',')` — stringified array as a dep. This forces re-evaluation whenever any clip ID changes (even for clips not relevant to this NPC). Should use a stable reference. |
| A2 | LOW | `hooks/useSkinnedGltfClone.ts` | 106 | Dependency on `[sourceScene, animations]` — if the `animations` array reference changes on every render (common with inline GLTF loading), the clone is destroyed and rebuilt every frame. The `useMemo` in the caller usually prevents this, but it's fragile. |
| A3 | INFO | `engine/npc/useNPCAnimation.ts` | 33 | `crossfadeDuration = 0.42` is hardcoded. Different animation transitions may benefit from different durations (e.g., idle→walk should be faster than idle→talk). |
| A4 | INFO | `engine/npc/useNPCAnimation.ts` | 99-103 | Cleanup effect stops all actions on unmount, but the `actions` dependency means it re-runs whenever actions change. If actions are replaced (e.g., new Mixamo clips loaded), all current actions are stopped momentarily. |

### 4.3 Potential Improvements

1. **Animation event system:** No animation event listener system was found. For combat attacks, footsteps, or NPC reactions at specific animation frames, an `AnimationEvent`-based system would be needed.
2. **Procedural animation layering:** `useProceduralNpcLimbAnimation.ts` exists for procedural NPC limb motion, but it operates independently from the Mixamo system. A unified additive animation layer would allow breathing, posture shifts, etc. to blend with loaded clips.
3. **Animation state machine for player:** The NPC animation system is well-structured with FSM + crossfade + layered tracking, but the player's animation system (`useProceduralPlayerAnimation.ts`) is less mature. Unifying these would improve maintainability.
4. **Clip loading priority:** Currently only 4 clips are "critical." As the NPC count grows, the sequential deferred loading could cause visible pop-in for NPCs that the player approaches quickly after scene load.

### 4.4 Bug List (sorted by criticality)

1. **[LOW] Unstable dependency in Mixamo clip hook** — `hooks/useMixamoAnimationClips.ts:236` — `MIXAMO_CLIP_IDS_ON_DISK.join(',')` as dep causes unnecessary re-evaluations.
2. **[LOW] Fragile clone dependency** — `hooks/useSkinnedGltfClone.ts:106` — Relies on caller's `useMemo` stability for `animations` array.
3. **[INFO] Hardcoded crossfade duration** — `engine/npc/useNPCAnimation.ts:33` — All transitions use same 0.42s duration.

---

## 5. Audio System

### 5.1 Current State

**Architecture:**
- `useAudioOrchestrator.ts` — Thin React hook that subscribes to game state + EventBus and delegates all decisions to `SceneAudioController`.
- `SceneAudioController.ts` (305 lines) — Central audio conductor: scene transitions, mode changes, stingers, reverb, act-mood overrides.
- `AmbientEngine.ts` (756 lines) — Procedural ambient drone system: oscillators, noise layers, LFOs, random sound events, HRTF spatial panning, crossfading.
- `AudioEngine.ts` / `SfxEngine.ts` — One-shot SFX, footsteps, stingers, reverb, dialogue muffle.
- `AudioEngineCore.ts` — Shared `AudioContext`, reverb impulse cache, buffer/convolver release helpers.
- `AmbientEngine` uses a Proxy pattern for HMR-safe singleton access.

**Ambient System Features:**
- Crossfading between ambient types (default 2s).
- Combat muting (full mute during combat, ambient `combat` type plays instead).
- Dialogue ducking with profiles: `dialogue` (48% volume), `cinematic` (38% volume).
- Tab visibility: pauses ambient when document is hidden.
- Accessibility: `reducedMotion` disables LFO and random layers.
- Scene reverb presets: `small_room` (2200Hz), `corridor` (1400Hz), `nature` (1100Hz), `large_space` (900Hz), `dream` (650Hz).
- Per-scene ambient resolution with weather and time-of-day modifiers.
- Act-mood override: same scene sounds different as story progresses (5 key scenes × acts 2-5).

**Audio Cleanup:**
- Monotonic `transitionGeneration` counter prevents stale crossfade callbacks from corrupting state.
- `randomScheduleEpoch` invalidates in-flight random-sound callbacks on dispose.
- `pendingScheduledTimers` Set tracks all setTimeout IDs for complete cleanup.
- Noise loop buffers are released on scene change (`noiseBuffer = undefined`).
- Reverb impulse cache keyed by `sampleRate:decay`.
- HMR-safe: `registerHmrDispose` on both `AmbientEngine` and `SceneAudioController`.

**Music System:**
- Procedural music engine with pad oscillators, filter sweeps, and mood-based parameters.
- Scene-specific music beds with crossfade transitions.
- Presentation ducking for dialogue/cutscenes.
- Menu music with deferred autoplay (Chrome policy).

**SFX:**
- Procedural footstep synthesis (material-dependent).
- Stinger system: `tension`, `discovery`, `danger`, `emotional`, `mystery`.
- Door open/close SFX.
- Dialogue muffle (lowpass filter on master).

### 5.2 Discovered Problems

| # | Severity | File | Line(s) | Description |
|---|----------|------|---------|-------------|
| AU1 | MEDIUM | `engine/audio/AmbientEngine.ts` | 746-755 | HMR Proxy facade (`ambientEngine`) binds methods via `.bind(instance)` on every property access. This creates a new bound function on every call. For hot-path methods called from `useFrameTick`, this is allocation pressure. |
| AU2 | LOW | `engine/audio/AmbientEngine.ts` | 117-119 | `initContext()` connects `destination` to `this.ctx.destination` — connecting a GainNode to itself creates a feedback loop. This is likely intentional (the shared context's destination is the actual output), but the naming is confusing. |
| AU3 | LOW | `hooks/useAudioOrchestrator.ts` | 147 | `scene:enter` event triggers `triggerCameraShake(0.03, 3)` — every scene transition shakes the camera slightly. This is a side effect mixed into the audio orchestrator. Should be in the scene transition system. |
| AU4 | INFO | `engine/audio/AmbientEngine.ts` | 89-90 | `baseVolume = 0.7` is hardcoded. There's no exposed API for the player to control ambient volume independently of master volume. The `AudioSettings` module may handle this, but it's not clear from the AmbientEngine alone. |
| AU5 | INFO | `engine/audio/AudioEngineCore.ts` | 18-31 | `createReverbImpulse` generates white noise × exponential decay. This is a basic algorithmic reverb — no early reflections, no diffusion. For a cyberpunk noir game, higher-quality convolution reverb from recorded IRs would significantly improve spatial immersion. |
| AU6 | LOW | `engine/audio/AmbientEngine.ts` | 340-345 | Noise buffer is always 4 seconds (`Math.ceil(ctx.sampleRate * 4)`). For 48000Hz, that's ~192KB per ambient instance. If multiple ambients overlap during crossfade, memory temporarily doubles. No pooling or reuse. |

### 5.3 Potential Improvements

1. **Real convolution reverb:** Replace algorithmic reverb with recorded impulse responses for each scene type (small room, cathedral, tunnel, outdoor). Would dramatically improve audio quality.
2. **Ambient volume control:** Expose a per-bus volume slider (music, ambient, SFX, voice) in the settings panel.
3. **Spatial audio for NPCs:** `AmbientEngine` supports HRTF panning for ambient sources, but NPC barks and footsteps don't use spatial audio. Adding `PannerNode` to NPC audio sources would improve immersion.
4. **Audio memory pooling:** 4-second noise buffers (192KB each) are allocated per ambient instance. A shared noise buffer pool would reduce allocation during crossfades.
5. **Dynamic music system:** The current procedural music is oscillator-based. A sampler-based system with recorded phrases (even short ones) would sound much richer.
6. **Separate camera shake from audio:** `useAudioOrchestrator.ts:147` mixes camera shake into the audio system. This violates single-responsibility and makes it hard to adjust shake intensity independently.

### 5.4 Bug List (sorted by criticality)

1. **[MEDIUM] HMR Proxy creates bound functions per access** — `engine/audio/AmbientEngine.ts:746-755` — Allocation pressure in hot paths. Not a user-facing bug but a dev-experience issue.
2. **[LOW] Camera shake in audio orchestrator** — `hooks/useAudioOrchestrator.ts:147` — Architectural violation. Every scene transition shakes the camera, which may not be desired for all transitions.
3. **[LOW] Unpooled noise buffers** — `engine/audio/AmbientEngine.ts:340-345` — ~192KB allocated per ambient instance during crossfades.
4. **[INFO] Basic algorithmic reverb** — `engine/audio/AudioEngineCore.ts:18-31` — Sounds flat compared to convolution reverb.

---

## Summary: Top 10 Issues by Priority

| Rank | Area | Severity | Issue | File:Line |
|------|------|----------|-------|----------|
| 1 | Combat | MEDIUM | Silent equipment bonus loss on store error | `formulas.ts:161-167` |
| 2 | Audio | MEDIUM | HMR Proxy bound-function allocation | `AmbientEngine.ts:746-755` |
| 3 | Combat | MEDIUM | Defend action not properly pipelined | `enemyTurn.ts:93` |
| 4 | Rendering | LOW | GPU leak in ObjectPool overflow | `objectPool.ts:44-53` |
| 5 | NPC | LOW | Hero NPC list not data-driven | `npcRenderTier.ts:8-46` |
| 6 | Combat | LOW | Per-call MUTUALLY_EXCLUSIVE allocation | `buffSystem.ts:80-96` |
| 7 | NPC | LOW | Unseeded patrol idle durations | `npcPatrol.ts:91` |
| 8 | Animation | LOW | Unstable Mixamo hook dependency | `useMixamoAnimationClips.ts:236` |
| 9 | Audio | LOW | Camera shake in audio orchestrator | `useAudioOrchestrator.ts:147` |
| 10 | Rendering | INFO | Test helper in production disposal path | `moduleGeometryRegistry.ts:166` |

---

## Overall Architecture Assessment

The codebase demonstrates **advanced engineering** across all five areas:

- **GPU resource management** is production-grade with refcounted ownership, HMR safety, and comprehensive disposal.
- **Combat** uses a clean pure-function pipeline with seeded deterministic RNG and pity systems.
- **NPC AI** has a sophisticated 3-tier LOD system, A* pathfinding with nav mesh, proximity-aware head tracking, and emotion-driven behavior.
- **Animation** supports Mixamo clip retargeting, atomic locomotion pair loading, and layered additive animations.
- **Audio** has procedural ambient synthesis, crossfading, spatial panning, accessibility support, and act-aware mood overrides.

The primary **architectural risks** are:
1. Growing complexity in hardcoded lists (hero NPCs, boss types, scene lighting) that should be data-driven.
2. Some cross-concern coupling (camera shake in audio, defend action conflated with buff in damage pipeline).
3. No instanced mesh batching for repeated props, which will become a draw-call bottleneck as scene complexity grows.
