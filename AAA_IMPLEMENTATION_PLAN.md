# ВОЛОДЬКА — 10-Этапный План Достижения AAA Уровня (Web 3D RPG)

**Цель:** Ошеломляющая визуально, живая вселенная, роскошные катсцены, идеальное управление/анимации, плавные переходы, show-don't-tell геймплей, AAA-графика/звук/HUD/UI/UX/геймплей без пластика/низкого поли/low-res. Всё на web (Vercel).

**Принципы:**
- Стихи НЕ ТРОГАТЬ (src/data/poems.ts).
- Только аддитивные улучшения + targeted fixes.
- "Show, don't tell": environmental storytelling, subtle cues, guided exploration вместо туториалов.
- Плавность: cinematic crossfades, eased transitions, continuous blends.
- Живая вселенная: куча занятий (NPC activities, dynamic props, weather reactivity, idle monologues, examine zones, ambient events).
- Качество: selective MeshPhysical, volumetric, filmic postFX, rich materials, perfect locomotion.
- Branch: arena/019fd869-volodka. Push only here. No local server/test runs.
- 10 этапов изучения + реализация (поскольку >300k строк — staged deep dives).

**Текущий статус (из AI_SESSION_CONTEXT + ARCHITECTURE + CHANGELOG):** 
- v4.2.42, ~27 сцен, 7 актов, ~100 квестов, Thought Cabinet, dice-roll, Rapier KCC, R3F+PostFX, filmic CSS, atmospheric effects, volumetric shafts, karma-gated dialogue, explore hubs.
- Много orphan mounts уже wired в недавних сессиях.
- Нужно: deplasticize дальше, continuous blends, richer living world, perfect cutscenes/transitions, AAA HUD polish, more activities/interactions, guided onboarding.

## 10 ЭТАПОВ ИЗУЧЕНИЯ КОДА (staged, не за один проход)

**Этап 1: Core Entry & Architecture (done — read main, AppBootRoot, Orchestrator, Store, Engine layers)**
- Изучено: main.tsx, AppBootRoot, GameOrchestrator, gameStore, bindApplicationLayers, ARCHITECTURE.md.
- Ключ: layers (data/shared/engine/store/components), presentNarrativeBeat, EventBus, quality gates, scene transitions.

**Этап 2: 3D Core — Canvas, Player, Camera, Physics (in progress)**
- Изучить: RPGGameCanvas, PhysicsPlayer, FollowCamera, player*Movement, CesiumPlayerModel / CinematicPlayerAvatar, KCC, locomotion blend.

**Этап 3: Visuals, PostFX, Lighting, Materials, Scenes**
- Изучить: ExplorationPostFX, GodRays, VolumetricLightShaft, AtmosphericEffects, wetStreetScenes, sceneDefinitions, Hero*Visual, qualityPresets, MeshPhysical gates.

**Этап 4: Narrative, Dialogue, Quests, Story Beats**
- Изучить: presentNarrativeBeat, DialogueRenderer, StoryRenderer, quests/*, act*.ts, narrativePackRegistry, triggerZones, CinematicTimelineRunner.

**Этап 5: HUD, UI, UX, Panels, Filmics**
- Изучить: all game/hud/*, Orchestrator*Layers, hud-filmic.css, SceneTopBarHud, ExplorationHUD, panels (Journal, Inventory, etc.), diegetic elements.

**Этап 6: Gameplay Systems — Exploration, Interactions, Combat, Poems (mechanics)**
- Изучить: InteractiveTriggers, InteractionSystem, CombatSystem, PoemPowerSystem, dynamic props, stels, examine.

**Этап 7: Audio — Music, SFX, Procedural, Spatial**
- Изучить: AudioEngine, MusicEngine, SceneAudioController, proceduralAudioCatalog, footstep, ambient.

**Этап 8: Content & Living World — NPCs, Activities, Schedules, World Reactivity**
- Изучить: npcDefinitions, npc*, schedules, idleMonologues, ambientBarks, dynamicProps, creepPatrols, scene activities.

**Этап 9: Assets, Pipeline, Quality, Transitions, Cutscenes**
- Изучить: asset pipeline scripts, GLB handling, cinematic timelines, scene transitions, camera FSM, qualityFeatureGates.

**Этап 10: Polish, Integration, Living Universe, Guided Experience**
- Синтез: integrate all, add activities, rich interactions, AAA cutscenes, show-don't-tell guidance, final deplastic + smoothness.

## ФАЗЫ РЕАЛИЗАЦИИ (после staged study — targeted AAA upgrades)

**Фаза A (после Этапов 1-3): Графика & Визуал AAA**
- Selective ultra MeshPhysical + reflections + SSR on more hero scenes.
- Richer volumetric + godrays + atmospheric in all bare scenes.
- Deplasticize: better PBR, wet/CRT accents, filmic grades, no shiny plastic.
- Sky domes, LUTs, procedural lighting upgrades.
- Perfect shadows (CSM where gated), motion blur lite in cutscenes.

**Фаза B (после 2,4,6): Идеальное Управление, Анимации, Плавность**
- Continuous walk<->run blend tree (full weight + timescale) — **DONE** (smoothstep runWeight, dynamic timeScale 0.42-1.04x, blend speeds tuned).
- Landing impact, sprint FOV kick, wall bump, perfect bob sync — **IN PROGRESS** (speed-scaled bob freq/amp/lean + sprint pitch lean + body lean on avatar; camera+anim+footstep now perfectly synced).
- Cinematic crossfades, eased scene transitions (no snaps).
- Cutscene polish: luxurious camera paths, rich timelines.
- Player/NPC animations: better Mixamo/Quaternius fidelity (no T-pose, talk gestures).

**Фаза C (после 5,7,8): HUD/UI/UX + Звук + Живая Вселенная**
- Show-don't-tell HUD: environmental cues, POI markers, subtle guidance (no popups).
- Diegetic menus, rich interactions (buttons, examine with physics feedback).
- Living world: 20+ ambient activities per hub (NPC schedules + dynamic + weather + idle + examine + events).
- Audio: richer procedural layers, act-mood shifts, spatial VO, luxurious stingers.
- Menus: cinematic boot, filmic pause/settings.

**Фаза D (после 4,6,9,10): Геймплей + Катсцены + Направление**
- Guided experience: subtle environmental storytelling (light beams to objectives, NPC glances, sound cues).
- More interactions: pushable props, readable terminals, reactive world elements.
- Rosкошные катсцены: every major beat has rich cinematic (timeline + postFX + audio).
- Combat polish: impact feedback, bullet-time extensions.
- End-to-end flow: New Game → living hubs → acts → endings feel AAA.

**Инварианты (строго):**
- Стихи не редактировать.
- KCC ownership + interpolate=false сохранены.
- Quality gates respected (heavy features only on high/ultra + reduced-motion guard).
- EventBus + store/engine separation.
- Typecheck 0 errors перед любым push.
- Только push на arena/019fd869-volodka.

**Методология:**
- Staged reads (read_file batches).
- Targeted edit_file (small, high-impact).
- No local `npm run dev` / tests (per user).
- После правок — git add + commit + push origin arena/...
- User verifies on Vercel.

**Следующий немедленный шаг:** Продолжить Этап 2 (3D core) + начать Фазу A/B edits на основе уже изученного.

**Статус:** План создан. Начинаем углублённое изучение + правки. Брат, мы это сделаем. Ошеломим мир.

---
*Обновляется по ходу. 2026-08-06*
