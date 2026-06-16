# Changelog — ВОЛОДЬКА RPG
## v4.2.26 — 17 июня 2026

### 3D заставки при взаимодействии (InteractionSplash)
- **Система InteractionSplash**: короткий кинематографический кадр (0.8–2.5 с) перед диалогом / осмотром — камера подъезжает к объекту или NPC, тонкие letterbox-полосы, затем UI.
- **Каталог** `interactionSplashes.ts`: пресеты `npc_orbit`, `prop_push_in`, `examine_close_up`, шаблоны Альберта, Заремы, бариста, серверных фрагментов и свитков.
- **Проп-зоны (5)**: `room_desk`, `office_server_room`, `factory_vault_neutral_fragment`, `library_poetry_stash`, `basement_server_rack` — `splashProfile` на trigger zone.
- **NPC (3)**: albert, zarema, cafe_barista — `npcSplashProfile` в npcDefinitions + каталог.
- **Пропуск**: reduced motion, пресет «Низкое», повторное взаимодействие (`interacted_*` / `met_*`).
- **Камера**: события `camera:interaction_splash_start/end`, переиспользование cutscene controller и CutsceneOverlay.
- **Тесты**: `resolveInteractionSplash.test.ts` — резолв профиля и условия пропуска.

## v4.2.25 — 17 июня 2026

### Prod smoke — Quaternius NPC scale, grounding, scene coverage (medium+)
- **Skinned bounds**: `measureCharacterGltfBounds` — unions Quaternius modular SkinnedMesh slices after skeleton update; fixes room-scale boots and floating feet on medium/high/ultra.
- **Runtime**: `GltfNPCModel` + `CesiumPlayerModel` use character bounds for `fitCharacterGltf` foot pivot (y = 0).
- **Catalog**: `quaterniusNpcSlots.ts` — 20 rig slots (hero + 19 story/CHK NPCs).
- **Tests**: `gltfScale.quaternius` (Albert GLB ~1.75 m, feet on ground), `npcQuaterniusProdSmoke` (19 shipped GLBs, schedule coverage, medium+ GLB gate).

### Golden path onboarding hints
- **GOLDEN_PATH_BRANCH_HINTS**: добавлены подсказки для 7 узлов позвоночника без `guidanceHint` — `go_to_cafe`, `street_bench`, `cafe_explore_mode`, `cafe_barista`, `office_explore_mode`, `park_explore_mode`, `act3_maria_truth_accepted`.

## v4.2.24 — 16 июня 2026

### NPC animation polish (Quaternius embedded clips + dialogue talk)
- **Clip resolution**: `npcClipResolution` — case-insensitive match for Quaternius PascalCase clips (`Idle`, `Walk`, `Wave`, `Idle_Neutral`) with Mixamo alias fallback.
- **Quaternius catalog**: `quaterniusAnimationCatalog.ts` — idle/walk/talk/sit/listen/gesture aliases for Ultimate Modular rigs.
- **Dialogue talk**: `useNpcAnimationController` crossfades to `talk` during Dialogue/Lock; `listen` during Align/Cutscene (was idle-only defer).
- **Schedule activity**: work/read/rest → sit (`Idle_Neutral` on Quaternius); patrol walk → `Walk`.
- **Retarget prep**: `humanoidRetargetProfile.ts` — Mixamo bone naming + Blender notes for when shipped clips override embedded.
- **GPU preload**: `getScheduleBackedNpcIdsForScene` — scene NPC GLB preload/evict derived from schedules + act overrides (all 20 Quaternius slots).
- **Tests**: `npcClipResolution`, interaction talk mapping, schedule-backed preload assertions.

## v4.2.23 — 16 июня 2026

### Consolidated asset pipeline (Kenney · Poly · RPM · Quaternius · Mixamo)
- **NPC priority**: Ready Player Me `npc_*.glb` > Quaternius CC0 > Khronos bootstrap — `npcModelRegistry` ships only files on disk; pending slots use procedural silhouettes.
- **Quaternius shipped**: Ultimate Modular Men/Women CC0 — hero Volodka LOD chain + 19 story/CHK NPC GLBs staged under `public/models/`; sources `male_01`…`female_09` in `assets-source/ai3dgen/npcs/`.
- **Quaternius CLI**: `npm run assets:quaternius-import` (`--download`, `--extract`, `--import`, `--status`) — maps 20 rigged slots to registry ids; bootstrap skips Khronos when sources exist.
- **RPM CLI**: `npm run assets:rpm-import` (`--list`, `--id`, `--apply-all`) — 20 avatar catalog; drop GLBs in `assets-source/ai3dgen/npcs/`.
- **Mixamo CLI**: `npm run assets:mixamo-import` — idle/walk/talk/sit clips for NPC activity + player arms.
- **Kenney + interiors**: `assets:freekit-stage` → citykit props + interior shells in 10 hero scenes (`SceneInteriorAssets`).
- **Status**: `npm run assets:status` reports manifest, AI3DGen, Mixamo, RPM, Quaternius, runtime registries.
- **Docs**: `assets-source/ai3dgen/README.md` (free sources table), `npcs/README.md`, `mixamo/README.md`, `ATTRIBUTION.md`.

## v4.2.22 — 16 июня 2026

### Mixamo animation pipeline (idle / walk / talk / sit)
- **Catalog**: `src/config/mixamoAnimationCatalog.ts` — four humanoid clips with NPC state mapping and Mixamo name aliases.
- **Import CLI**: `npm run assets:mixamo-import` (`--list`, `--status`, `--clip <id> --file <path>`) stages to `assets-source/mixamo/` + `public/models/animations/`; auto-updates `mixamoAnimationShipped.ts`.
- **Runtime**: `GltfNPCModel` drives GLB clips from schedule/patrol activity (walk, sit, talk) + dialogue events; `CesiumPlayerModel` prefers shipped Mixamo idle/walking.
- **Docs**: `assets-source/mixamo/README.md` (Adobe export settings), `ATTRIBUTION.md` Mixamo section, cross-link from AI3DGen README.
- **Tests**: catalog registry + `npcActivityAnimation` activity→state mapping.

## v4.2.21 — 16 июня 2026

### Kenney City Kit props + interior shells (Poly Pizza TODO)
- **Source**: 10 CC0 props in `assets-source/ai3dgen/props/` (Kenney Furniture + City Kit Roads + OpenGameArt campfire).
- **Interiors**: 10 Kenney building shells in `assets-source/ai3dgen/interiors/` — Poly Pizza download blocked without API; mapping documented for manual swap.
- **Pipeline**: `npm run assets:freekit-stage` → `public/models/props/citykit/` + `public/models/interiors/`.
- **Runtime**: `SceneInteriorAssets`, `sceneInteriorAssets.ts`, `kenney_city_*` props in `propModelRegistry` + `scenePropDressing` (street, café, pier, CHK, rooftop).
- **Catalog**: 20 entries in `ai3dgenAssetCatalog.ts` (props + interiors, `licenseTier: free`).
- **Docs**: `assets-source/ai3dgen/README.md`, `ATTRIBUTION.md` Kenney + Poly Pizza credits.

## v4.2.20 — 16 июня 2026

### Ready Player Me NPC pipeline (20 story avatars)
- **RPM_NPC_CATALOG**: 20 slots in `src/config/rpmNpcCatalog.ts` — source `npc_*.glb` → registry id → `public/models/npcs/{id}.glb`; aliases for Victoria→maria, Solnysh→alina source, Katya→kate, Zheka→zeka, Trofim→fisherman_trofim.
- **Import CLI**: `npm run assets:rpm-import` — `--list`, `--id npc_albert --file path.glb`, `--apply-all`; regenerates `rpmNpcShipped.generated.ts`.
- **Registry**: `npcModelRegistry` prefers shipped RPM over Khronos CC0; expanded + CHK Tolpa NPCs wired with target `modelPath`.
- **Bootstrap**: `assets:bootstrap` stages RPM sources when present and skips CC0 overwrite for those slots.
- **Docs**: `assets-source/ai3dgen/npcs/README.md` — RPM export, Blender cleanup, Mixamo retarget notes.
- CI never downloads RPM avatars (user account required).

## v4.2.18 — 16 июня 2026

### Story polish + remaining hero scene graphics
- **Act 7 endings**: unified karma thresholds (70/35), `musicCue` + `guidanceSceneLabel` on all three finales; wanderer ending aligned to `street_winter` (scene + ambient).
- **True-end epilogue**: `resolveTrueEndEpilogue` — guild/peace/revolution paths, Dmitry exile, Ritka song, final poem edge cases; traitor scar excludes exile.
- **Dialogue speakerId**: `part1-albert` (Albert/Zarema/Victoria/Dmitry) + exploration nodes for Victoria fragment and Albert lesson.
- **Hero scene graphics**: procedural ceiling/sky washes + LUT for `volodka_room`, `volodka_corridor`, `abandoned_factory`, `factory_basement`, `zarema_albert_room`, `street_winter` (sky dome); bloom profiles tuned.
- **Tests**: act7 ending consistency, epilogue edge cases, sky/LUT/profile regressions.

## v4.2.17 — 16 июня 2026

### Accessibility AAA (gamepad hints, reduced-motion bob, weather caps)
- **Gamepad hints**: `formatInteractionHintKey` / `useGamepadConnected` — interaction popup shows `[A]` when a controller is connected; touch still shows tap icon.
- **FirstPlayTutorial**: controls step switches to stick/LB/A layout when gamepad is detected.
- **FPS arms bob**: `FirstPersonHands` disables head-bob under effective reduced motion (matches exploration camera scale).
- **Weather particle caps**: `getParticleCount` accepts `reducedMotion` — rain, snow, dust, embers, steam, and exploration particles scale to 35% when reduced motion is on.
- **Tests**: `explorationUxPresentation`, `mobileParticleScale`.

## v4.2.16 — 16 июня 2026

### UX handoff polish (v4.2.14 follow-up)
- **Shared timings**: `EXPLORATION_HUD_HANDOFF` in `transitionTimings.ts` — guidance reveal (420ms) aligned with warm canvas fade; hub toast +60ms (480ms).
- **StoryGuidanceHUD**: uses shared constant; regression tests for overlay / kind-recovery / transition suppression.
- **Quality preset hints**: moved to `formatQualityPresetDetailRu` in `qualityPresets.ts` — clearer Russian copy, tier-driven GLB/reflector hints; auto→ultra nudge for wet reflections.
- **Tests**: `StoryGuidanceHUD.test.tsx`, `qualityPresetDetail.test.ts`, `transitionTimings.test.ts`; SettingsPanel visual-tab hint assertion.

## v4.2.15 — 16 июня 2026

### AAA graphics P2 (daytime interiors + procedural LUT)
- **ExplorationPostFX**: procedural 16³ LUT pass (`LUT3DEffect`) for neon scenes (`street_night`, `cafe_evening`, `sleep_dream`) and interior moods (`home_evening`, `library_day`, `office_day`).
- **office_day ceiling**: cold overcast HDR wash (`createOfficeDayOvercastSkyTexture`) — sterile fluorescent ambience.
- **library_day ceiling**: dusty amber reading-light dome (`createLibraryDayWarmSkyTexture`) — gothic archive mood.
- **home_evening ceiling**: warm amber wash with city-blue window spill (`createHomeEveningWarmSkyTexture`).
- **Visual profiles**: bloom scale boosts for `home_evening` (1.08), `library_day` (1.05), `office_day` (1.04); tuned color grade + bloom thresholds.
- **Tests**: `proceduralLutTextures`, expanded sky texture + scene profile assertions.

## v4.2.14 — 16 июня 2026

### AAA graphics + UX polish
- **street_night sky dome**: procedural synthwave rainy gradient (`createStreetNightSynthwaveSkyTexture`) + stronger IBL intensity for wet-neon mood.
- **cafe_evening ceiling wash**: procedural blue-neon HDR gradient on café ceiling for hazy interior ambience.
- **StoryGuidanceHUD**: 420ms reveal delay after narrative recovery / scene transition — no flash during overlay handoff.
- **Explore hub handoff**: location toast deferred 480ms after overlay close so it does not clash with transition HUD.
- **Settings onboarding**: quality preset hints — «GLB-модели: medium+», «Ultra: мокрые отражения на улице».
- **Tests**: jsdom fix for procedural sky textures; deferred hub toast; new street/café sky texture assertions.

## v4.2.13 — 16 июня 2026

### AAA audio + performance (post-deploy audit P2/P1)
- **Music ducking**: dialogue overlays keep more bed (72% music / 48% ambient) vs cinematic story (58% / 38%); smoother 450ms crossfade ramps.
- **Tension layer**: story overlay switches music intensity to `tension` (faster chord pacing); wired into `MusicEngine` via `subscribeMusicIntensityLayer`.
- **Performance auto-cap**: N8AO, ultra street reflector, animated galaxy stars, and god rays require explicit high/ultra — `auto` preset never enables heaviest GPU features even when heuristics resolve high.
- **Adaptive quality**: repeated FPS budget violations now step quality preset down one tier (auto → medium, ultra → high).
- **Accessibility**: reduced-motion hides HUD ambient particles and god rays; galaxy star drift disabled under reduced motion or auto preset.
- **Tests**: `musicIntensityLayers`, `qualityFeatureGates`, `adaptiveQualityDegrade`, pipeline auto-cap regression.

## v4.2.12 — 16 июня 2026

### Production GLB: distinct CC0 interim meshes
- **Hero**: Volodka LOD chain now stages Khronos RiggedFigure (was duplicate CesiumMan).
- **NPCs**: bootstrap assigns distinct CC0 silhouettes (Xbot, RobotExpressive, RiggedFigure pairs, etc.) — no triple Soldier/CesiumMan copies.
- **Quest/craft props**: each prop uses its own Khronos mesh (Lantern, DamagedHelmet, WaterBottle, Avocado, AntiqueCamera) instead of five Avocado clones.
- **Vegetation / café bundles**: pine LODs and café prop variants use distinct CC0 sources.
- **Attribution**: `public/models/ATTRIBUTION.md` and `npcModelRegistry` updated; run `npm run assets:bootstrap` to refresh on disk.

## v4.2.11 — 16 июня 2026

### P0: narrative blank dim fix
- **GameplayNarrativeOverlay**: show «Загрузка сцены…» while `showStoryOverlay` is true but `narrativeKind` is still null (avoids dark screen with no text during kind recovery).
- **useOrchestratorRuntime**: treat resolving narrative kind as an active overlay (pointer lock exit, panel dismiss).
- **Tests**: `OrchestratorGameplaySections.test.tsx` regression for recovery loading state.

## v4.2.10 — 16 июня 2026

### AAA graphics P1 (rooftop galaxy sunset, park haze, synthwave boost)
- **rooftop_edge sky dome**: procedural galaxy-sunset gradient with nebula wisps and slow-drifting horizon stars (`createRooftopSunsetGalaxySkyTexture` / `createRooftopHorizonStarGeometry`).
- **park_day sky dome**: overcast gothic haze dome (`createParkHazySkyTexture`) — closes the memorial park horizon without new assets.
- **Synthwave grade boost**: stronger LUT-style tuning and wet-neon bloom for `street_night` and `cafe_evening`; galaxy-sunset grade + bloom for `rooftop_edge`; warmer haze grade for `park_day`.
- **Visual profiles**: `rooftop_edge` forceFullPostFx + bloom 1.14; `park_day` bloom 1.06.
- **Tests**: procedural sky textures, scene visual profiles, rendering pipeline rooftop profile.

## v4.2.9 — 16 июня 2026

### AAA graphics P1 (dream galaxy sky + ethereal grade)
- **sleep_dream sky dome**: procedural galaxy gradient with nebula wisps and slow-drifting starfield (`GalaxySkyDome` in `SleepDreamVisual`; fog-exempt, no new asset files).
- **Dream color grade**: stronger magenta/cyan LUT-style tuning in exploration post-FX (hue, saturation, contrast, bloom threshold).
- **Visual profile**: `sleep_dream` bloom intensity scale 1.12 for ethereal glow on floating elements.
- **Tests**: `proceduralSkyTextures.test.ts`, `sceneVisualProfiles` dream bloom assertion.

## v4.2.8 — 16 июня 2026

### GLB model integration (scene rendering)
- **Manifest / dressing / trigger props**: all shipped GLB bundles render in exploration when quality preset allows (`allowsGlbAssetRendering` — hybrid/glb tiers only).
- **Scene prop dressing**: volodka room/corridor, café, factory, and basement placements for AI3DGen quest props (compiler, filter, amulet, server fragment).
- **Trigger zone props**: encrypted scroll, digital amulet, and server fragment wired to desk, vault, park patrol, office server, and basement rack zones; availability gated via `isTriggerZoneAvailable`.
- **NPC bootstrap**: distinct CC0 silhouettes for Maria (RiggedSimple), Tamara (CesiumMan), barista/colleague/viktor (Soldier).
- **GPU lifecycle**: office/factory scene ids registered for GLTF preload bookkeeping.

## v4.2.7 — 16 июня 2026

### AAA graphics P0 (synthwave grade, bloom, street reflector, N8AO)
- **Color grade**: stronger synthwave/neon tuning for `street_night`, `cafe_evening`, and `sleep_dream` in exploration post-FX.
- **Bloom**: higher wet-neon bloom on `street_night` and café evening scenes.
- **street_night profile**: N8AO (`enhancedAmbientOcclusion`) and bloom intensity scale 1.18; café bloom scale 1.15.
- **Ultra reflector**: planar `MeshReflectorMaterial` wet ground on `street_night` at ultra quality with rain-driven wetness ticks.
- **Tests**: scene visual profiles and rendering pipeline expectations updated.


## v4.2.6 — 15 июня 2026

### Asset pipeline (environment bundles + status tooling)
- **Shipped env bundles**: `env_cafe_props` and `veg_tree_pine` marked `shipped: true` with CC0 interim GLBs (BrainStem / Avocado) staged via `assets:bootstrap`.
- **Asset status**: `npm run assets:status` — manifest vs disk, AI3DGen catalog import progress, prop/NPC registry coverage.
- **AI3DGen CLI**: `assets:ai3dgen-import -- --status`; catalog entries for café props and park pine (`environment` / `vegetation` categories).
- **Pipeline folders**: `assets-source/ai3dgen/{characters,npcs,props,environments,vegetation}` scaffold for Pro imports.

## v4.2.5 — 15 июня 2026

### AAA polish pass (endings + accessibility)
- **True ending epilogue**: `resolveTrueEndEpilogue` appends up to 3 personalized lines to `act7_true_end` from ending flags, poem collection, and NPC fates (Зарема, Дмитрий, Виктория, ЧК, «Заря-М»).
- **ScreenEffects**: `useEffectiveReducedMotion` — shake/vignette/chromatic/slowmo off; combat flashes softened when reduced motion is on.
- **Tests**: `resolveTrueEndEpilogue.test.ts`.

## v4.2.4 — 15 июня 2026

### AAA polish pass (presentation profile)
- **Gameplay presentation profile**: helpers `isMotionFxProfile` / `shouldMountSceneTransitionFx` — level-up bursts, floating damage, and transition chrome hide during encounter beats and scene wipes (cleaner cinematic stack).
- **OrchestratorGameplaySections**: motion FX and scene-transition layers gated on profile instead of raw `mode`.
- **Exploration HUD**: `StoryGuidanceHUD`, `InteractionHintPopup`, `FirstPlayTutorial`, `AmbientAtmosphereCaption` use `isExplorationHudProfile` — no objective strip or E-hint over encounter/transition beats.
- **Guidance regression**: `goldenPathGuidance.test.ts` — every spine step must resolve to hint, NPC, or scene label (AAA onboarding for non-gamers).
- **Regression tests**: `useGameplayPresentationProfile.test.tsx`, `useSceneEnterEffect.test.tsx` — guard EventBus singleton hooks after production leak fix.

## v4.2.3 — 15 июня 2026

### AAA polish pass
- **Poem registry**: 21 main + 25 hidden = 46 unified poems (`poemCollectionMeta`); `poem_act6_01` kept as registry ID; achievement/dialogue gates aligned with `TOTAL_UNIFIED_POEMS`.
- **gameDataLoader**: split boot/narrative preload, error reporting via `loadingPipeline`, quest-loaded guard on bootstrap failure; unit tests.
- **NPC registry**: merged `ALL_NPC_DEFINITIONS` with O(1) maps, duplicate detection, `speakerId` on dialogue nodes, `resolveNpcIdFromSpeaker(speaker, speakerId)`.
- **CHK Tolpa**: `speakerId` on all dialogue nodes; `tolpa_honorary_chekist` farewell variant; `chk_silence` / `chk_silence_night` time gates; Act 7 `chk_act7_farewell` story beat + trigger zone.
- **Rapier**: `rapierInitFix` hardened — esbuild expand, `module_or_path` patch, transform cache, DEV self-test.
- **Chunks**: rollup manual chunks keep narrative engine + data acyclic (no circular TDZ splits).
- **Validation**: content pipeline OK; poem count parity enforced in `contentPipelineValidator`.

## v4.2.2 — 15 июня 2026

### AAA polish pass (content, boot, bundles)
- **Poem registry**: 21 main (`poem_1`–`poem_21`) + 25 bonus/hidden = **46 unified**; `poem_act6_01` kept as registry id (not aliased to `poem_22`); achievements and CHK easter-egg gates aligned with `TOTAL_UNIFIED_POEMS`.
- **gameDataLoader**: boot/narrative preload error handling, load-state introspection, `resetGameDataLoader` for tests; guided-path cache invalidation without circular-import TDZ.
- **NPC registry**: merged `ALL_NPC_DEFINITIONS` with O(1) lookup, `speakerId` on CHK dialogues, `resolveNpcIdFromSpeaker` for i18n-safe portrait routing.
- **CHK Tolpa**: `speakerId`, night/day `chk_silence` variants, `tolpa_honorary_chekist` farewell dialogue, Act 7 story beat `chk_act7_farewell` + explore trigger.
- **Rapier / Vite**: `rapierInitFix` hardened (esbuild expand, pattern guards, transform cache, version logging).
- **Rollup chunks**: manual chunk splits to avoid data-mechanics TDZ; validator enforces poem registry parity.
- **Regression tests**: `poemCollectionMeta`, `allNpcDefinitions`, `gameDataLoader`, expanded CHK dialogue coverage.

### Scene transitions / narrative
- **Progress bar 90% hang**: `scene:enter` вложенно срабатывал до latch прогресс-бара — приоритеты EventBus (`Engine` → `Orchestrator`) и буфер `pendingEnter`.
- **Коридор коммуналки**: `corridor_door` / кат-сцена `act1_corridor_solnysh` — story-узел выставляется до `transitionScene`, чтобы cutscene-controller и entry-хелперы видели beat.
- **Regression test**: `SceneTransitionProgress.test.ts` на порядок `scene:transition` / `scene:enter`.

## v4.2.1 — 13 июня 2026

### Player / controls
- **Keyboard movement**: мгновенная целевая скорость WASD (как в SimplePlayer) — без медленного damp-разгона.
- **KCC**: slide-damping скорости только при реальном ударе о стену, не на микро-коллизиях пола.
- **Input**: held-клавиши не сбрасываются при blur, если документ ещё в фокусе (клик по HUD).
- **Virtual controls**: единый `virtualControlsRef` через `usePlayerControls` для HUD и физики.

## v4.2.0 — 13 июня 2026

### Critical fixes
- **NPC templates**: `disposeNpcInstance` skips shared GPU geometry/materials on clone teardown.
- **Audio**: one-shot SFX/ambient/random sounds disconnect nodes on `onended`; gesture handlers re-arm after dispose/revive.
- **LOD**: `lodBias` scales thresholds correctly (low preset → sooner downgrade, ultra → longer detail).
- **Combat**: `getEnemyDefenseReduction` reads buffs only — fixes poem_1 100% defense strip after first attack.
- **Data**: missing perk prerequisites (`iron_will`, `scavenger`, `poetic_soul`, `combat_veteran`); lazy narrative barrel (no eager `STORY_NODES` export).
- **R3F dev**: removed React `StrictMode` wrapper to prevent double effect invocations / physics duplication.

### Engine / UI
- **Canvas registry**: `canvasRendererRegistry` + ErrorBoundary GPU cleanup on crash.
- **Store/hooks**: quest objective emit after `set()`, stable toast/scene-enter/DPR deps, monotonic notification IDs.
- **Workers**: `worldCompute.worker` error responses; client rejects and falls back to main thread.
- **Content**: poem margin fallbacks (22–35, act6/7), `TOTAL_UNIFIED_POEMS`, NPC model path validation, compiled ambience regexes.

## v4.1.0 — 13 июня 2026

### Архитектура и типы
- **Модульные game types**: `src/shared/types/` — `definitions/`, `state/`,
  `common/`, `brands.ts`; barrel `game.ts` без циклического re-export EventMap.
- **GPU lifecycle**: `graphicsGpuCleanup`, `moduleGeometryRegistry`, расширенный
  `bufferGeometrySanitize`, ref-count текстур/геометрий, тесты teardown.
- **Scene transitions**: `SceneTransitionManager` — re-entrance guard, combat
  start gate; тесты и события `sceneEvents`.

### UI / оркестратор (performance & leaks)
- **Lazy CombatUI** — code-split через `LazyCombatUI` + Suspense (не в boot bundle).
- **Lazy minigames** — `retryLazyDefault` для всех 8 мини-игр (retry на flaky network).
- **Cutscene controller** — cleanup `cutscene:overlay_end` + `ControllerSession.cancel`.
- **CyberpunkTheme** — stable context value (`useMemo`).
- **MiniMap** — stable rAF loop (refs для player/NPC/quest data).
- **CombatUI** — tracked timeouts; memoized buffs/powers.
- **HUD controller** — tracked timeouts (save indicator, karma/energy/stress pulse).
- **Panel coordinator** — `onPanelOpened` только при открытии панели.
- **DialogueRenderer** — memoized NPC/emotion/relation lookups.

### Engine / gameplay
- **Combat buffs**: отдельные слоты buff/debuff (2+2 на target); тесты `buffSystem`.
- **Combat transient pool**, gamepad input tests, head tracking fixes.
- **AudioEngine** refactor + capability probe; player movement/math helpers.
- **Interaction session** — generation guards; NPC sprite texture stability (3D).

### Качество
- Юнит-тесты: **363/363** · `npm run check` (lint + typecheck + validate + build + budgets) — OK.

## v3.4.0 — 12 июня 2026

- **Exploration-first сюжет**: explore-hub для всех игровых локаций
  (кафе, офис, парк, библиотека, крыша, завод, подвал, ЧК, пирс и др.).
  Overlay остаётся открытым, но движение и [E]-триггеры работают на hub-узлах.
- **Remap legacy `explore_mode`**: выбор «осмотреться» из act5/ЧК больше не
  закрывает overlay — переход на hub текущей сцены (`cafe_explore_mode` и т.д.).
- **`syncNarrativeOnSceneEnter`**: beat-узлы в уже загруженной сцене
  автоматически повышаются до scene hub (не только door-узлы).
- Реестр `sceneExploreHubRegistry.ts`, story nodes `sceneExploreHubs.ts`,
  тесты remap + beat promotion.

## v3.3.3 — 12 июня 2026 (hotfix)

- **Прыжок и движение после перехода сцены**: физика больше не обнуляет `vel.y`
  в кадре после tap-jump; при входе в сцену narrative overlay синхронизируется
  с explore-hub (`corridor_door` → `corridor_explore_mode`, `go_home` →
  `explore_mode`, `street_bench` → `street_bench_view`).
- **Наслоение UI в бою**: при старте боя закрывается story overlay; в режиме
  `combat` скрыты narrative renderer и ambient HUD (компас, quick bar и т.д.).
- **NPC в коридоре**: лимит 2 NPC на сцену, патрульные waypoints, разнесённые
  spawn-координаты в расписании, убраны ambient NPC в узком коридоре; spawn
  коридора смещён с z=4 на z=2.
- Регрессионные тесты `exploreHubNodes.test.ts`.

## v3.3.2 — 11 июня 2026 (hotfix)

- **NaN god-rays / гигантские цилиндры**: guard в `GodRays.tsx` при `dist ≈ 0`,
  `normalizeGodRayConfig()`, санитизация `BufferGeometry`.
- **Rapier deprecation**: shim `rapierCompat.ts` через Vite alias.

## v3.3.1 — 11 июня 2026 (hotfix)

- **Критический фикс React #185** (Maximum update depth exceeded) при открытии
  сюжетного оверлея из панели осмотра: `useStoryContext`/`useDialogueContext`
  возвращали вложенный объект-литерал на каждый снапшот, ломая `useShallow` и
  зацикливая `useSyncExternalStore`. Селекторы сделаны плоскими, контекст условий
  собирается в `useMemo`; регрессионный тест на стабильность снапшотов.
- Заглушено предупреждение GLTFLoader `KHR_materials_pbrSpecularGlossiness`
  (источник — fps_arms.glb): зарегистрирован no-op плагин в `gltfPipeline`,
  материал штатно фоллбечится на metallic-roughness.

## v3.3.0 — 11 июня 2026

### Две новые локации
- **«Подвал завода»** (`factory_basement`) — катакомбы под заводом: ряды серверных
  стоек с мигающими LED (инстансинг), пульсирующий монолит «Зари-М» (машина дышит
  задолго до исповеди акта 5), капающие трубы, лужи, красные аварийные лампы.
  Фригийский саб-дрон в музыке, зелёный god ray, холодный грейд.
- **«Пирс у реки»** (`river_pier`) — вторая тусовка ЧК: костёр в бочке, портвейн
  «777», гитара, гирлянда, лунная дорожка на воде, камыши, старая лодка, удочка.
  Тёплая пентатоника, плеск воды и треск костра в эмбиенте.
- Полная провязка: завод ↔ подвал (за ключом сторожа), парк ↔ пирс; погодные/
  мировые/музыкальные карты типобезопасно расширены.

### Контент и история
- **NPC**: Трофим (старик-рыбак, бывший сторож завода — ключ от подвала за
  портвейн) и Ритка из ЧК с гитарой; диалоговые деревья, расписания.
- **Квесты**: «Ключ сторожа» → «Гул под полом» (форшадоуинг «Зари-М» со 2-го
  акта), «Песня для Ритки» (ЧК-линия, флаг для концовок). 10 trigger-зон,
  5 лор-записей, 4 предмета.
- **«Поля»** — 52 заметки Володьки на полях стихов (poem_1–21, 2–3 варианта
  на стих): тон меняется от кармы, флагов судьбы Заремы и акта. Тексты стихов
  Владимира Лебедева не тронуты — меняется только отношение героя к ним.
- **Концовки-зеркала**: у всех 6 концовок акта 5 и финала акта 7 появился выбор
  «оглянуться» — узлы-отражения собирают итог конкретного прохождения (судьба
  Заремы и «Зари-М», письмо, тихие сцены, карма).
- **«Тихий час»** перед штурмом (акт 4): 5 необязательных контемплятивных сцен
  (крыша с Дмитрием, чай с Заремой, сообщение Альберта, окно опенспейса, первый
  стих) — их флаги выстреливают в зеркалах концовок.
- Крипы: Призрак Данных в подвале, Дрон-Цензор на пирсе (акт 3+); пинаемые
  предметы в обеих локациях.

### Интерфейс
- **«Тихий HUD»**: амбиентные элементы (статы, мини-карта, компас, погода,
  день/ночь, карма, тулбары) тают до 14% после 6 с без ввода и мгновенно
  просыпаются от действия; в бою не засыпают. Компас теперь только на улице.
- **Арбитр уведомлений**: 7 каналов (квесты, события, тосты, ачивки, погода,
  крафт, лут) делят максимум 2 слота по приоритету — стена карточек невозможна.
- **Портреты NPC в диалогах**: детерминированные процедурные нуар-аватары
  (canvas, сканлайны, неоновая окантовка) + затемнение HUD при диалоге.

### Исправления
- **Масштабы моделей**: Kenney-пропсы (стол 7.3 м, дверь 10 м, окно 13 м!)
  отцеплены от зон — в комнатах остаётся более богатая процедурная мебель
  (анимированные двери, мониторы Grafana/Zabbix); реестр получил выверенные
  масштабы для будущего использования. Александр больше не гном 0.6 м
  (двойная коррекция scale поверх авто-нормализации); битые 15-КБ стабы
  баристы/коллеги заменены валидным Soldier (CC0).
- Письмо на кухне теперь ставит флаг `read_zarema_letter` (был `read_maria_letter`
  — письмо от Заремы, не от Марии), и концовки на него реагируют.

## v3.2.0 — 11 июня 2026

### Геймплей: живой мир
- **Патрулирующие крипы** вместо невидимых боевых зон: 6 видимых врагов с конусами зрения,
  FSM «патруль → погоня → бой». Скорость погони ниже бега — убежать можно всегда.
  Победа убирает врага до перезахода в сцену; поражение/побег дают 8 секунд форы
  (`src/data/creepPatrols.ts`, `PatrollingCreeps.tsx`).
- **Поэтический стелс**: активная «Путеводная Звезда» (poem_3) сжимает конусы зрения
  крипов до 45% — визуально и механически. Стихи Владимира Лебедева управляют миром.
- **Пинаемые физические предметы**: банки, бутылки, ящики, бочки — dynamic-тела Rapier
  в 5 сценах, толкаются персонажем, звенят процедурным звуком удара (`DynamicProps.tsx`).

### Сюжет: сквозной путь до финала
- Все 6 концовок акта 5 теперь ведут через эпилог `act5_ending_epilogue` в акты 6–7 —
  47 узлов и 9 main-квестов перестали быть недостижимым контентом.
- Квесты акта 5 (`final_code`, `machine_confession`, `echo_of_vladimir`) получили
  триггеры и сцены; все «висячие» флаги objectives теперь выставляются сюжетом.
- `GOLDEN_PATH_STORY_SPINE` продлён до `act7_true_end`; квестовый spine покрывает акты 5–7.
- 60 меток `goldenPath: true` в актах 1–5 — derived-spine совпадает с каноном
  (75 → 15 предупреждений валидатора; остаток — честная диагностика хабовых переходов).

### Физика и мир
- **Дверные проёмы в стенах**: периметр сцен генерируется с проёмами по `doorways`
  и утопленными «нишами»-backstop — двери стали альковами, из карты не выйти.
  Дубли definition-стен на периметре убраны. Покрыто юнит-тестами.
- Улица: видимый бордюр + металлическое ограждение по границе играбельной зоны.

### Визуал
- **Лес Зорге**: инстансированный пояс из ~46 деревьев (3 draw call), луна, звёздное
  небо, светлячки у костра, валежник и подлесок.
- **Крыша**: закатный градиентный купол неба, лужи с отражениями; окна skyline
  детерминированы (исправлено «прыгание» на каждом рендере).
- **Парк**: туманный пояс из 34 деревьев за оградой, вороны, кованые ворота.
- **Арена боя**: эмиссивная сетка пола с пульсом и вспышками на ударах
  (синхронизация с боем через EventBus), разбитая машина как укрытие.
- **Офис**: сетка люминесцентных потолочных панелей.
- Убран двойной дождь (street_night) и двойной снег (street_winter).

### Настройки, которые теперь работают
- Пост-обработка, яркость, тряска камеры, чувствительность мыши, инверсия Y,
  сканлайны, частицы, «Без звука» — все переключатели подключены к рендеру/вводу/звуку
  (новый модуль `engine/visualSettings.ts`; раньше писались в localStorage и игнорировались).
- `npcRenderMode` из пресетов качества управляет выбором GLB/процедурных NPC.

### Производительность
- **Меню больше не тянет весь движок**: разорваны цепочки статических чанков
  (LoadingTimeline выпал из `game-canvas`, `gameDataLoader` отделён от валидатора
  контента, `goldenPath` — от barrel всех актов). Modulepreload на старте: 28 → 5
  чанков; boot ~300 КБ gzip при бюджете 439 КБ.

### Надёжность
- **Автовосстановление сейва**: при битом основном сохранении загружается резервная
  копия с уведомлением; битые ключи не затираются до первого успешного сохранения.
- Валидатор GLB-ассетов проверяет реальные рантайм-реестры (props/NPC/FPS-руки)
  и ловит «404-заглушки» по магическим байтам; восстановлены битые Soldier/Xbot GLB.
- Удалены ~15 осиротевших файлов прошлых сессий, ломавших typecheck.

### Метрики релиза
- typecheck: 0 ошибок · ESLint: 0 ошибок · юнит-тесты: 144/144
- валидатор контента: 0 ошибок / 15 предупреждений (golden-path fallback)
- бюджеты бандла: boot 300/439 КБ, game-start 540/1172 КБ — OK

---

## v3.1.0

### Исправления
- Камера адаптируется к масштабу локации — 2.5 м в комнатах, 6.5 м на улицах
- Улучшенная коллизия — skin width 2 → 8 см, персонаж не проходит сквозь мебель
- MatrixRain больше не блокирует управление в indoor-сценах

### Новый контент
- +10 записей лора, +8 перков, +5 рецептов крафта, +5 предметов

### Оптимизация
- Кэширование статических ассетов в Vercel, security-заголовки

## v3.0.x
- Большой рефакторинг: typed EventBus с дедупликацией и приоритетами,
  GameActionDispatcher, ленивые narrative-паки по актам, бюджеты бандла в CI,
  валидатор контента, error boundaries с graceful degradation.
