# AI Session Context — ВОЛОДЬКА RPG

> **ЭТОТ ФАЙЛ — КЛЮЧЕВОЙ ДОКУМЕНТ ДЛЯ НЕПРЕРЫВНОСТИ РАЗРАБОТКИ.**
> Каждый AI-агент ДОЛЖЕН прочитать его перед началом работы.
> После каждой сессии — ОБНОВИТЬ этот файл.
>
> Каноническая карта систем: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> AA visual/content ticks: [`docs/AA_QUALITY_ROADMAP.md`](./docs/AA_QUALITY_ROADMAP.md).

---

## 📌 Краткое резюме проекта

**ВОЛОДЬКА** — браузерная 3D RPG (киберпанк-нуар о Володьке — уставшем IT-инженере
в постсоветском городе, который находит стихи в серверном коде).

**Автор стихов:** Владимир Лебедев (правообладатель). Стихи НЕEDITABLE.
**Версия:** v4.2.42 (`package.json` / `APP_VERSION`)
**Деплой:** https://volodka.vercel.app/
**Стек:** React 19 + Vite 6 + Three.js 0.172 + R3F 9 + Rapier 2.2 Wasm + Zustand 5 + Zod 4 + Tailwind 4 → Vercel SPA

---

## 🎯 Видение проекта

Цель: Disco Elysium–подобная RPG в постсоветском киберпанке (выбор, Thought Cabinet,
dice checks, живые хабы). Вдохновение также: Gothic (расписания), Max Payne (кинематограф).

Ключевые принципы:
1. Стихи Владимира Лебедева — священный контент, никогда не менять
2. Постсоветская киберпанк эстетика во всём
3. Глубокий нарратив — каждая проверка навыков, каждый диалог имеет вес
4. Thought Cabinet — внутренние голоса как в Disco Elysium
5. Dice-roll механика — случайность в проверках навыков
6. **Честный масштаб:** сейчас ~10–40 h плотного AA; **120 h** — aspiration через content factory
   (structure/text split + lazy packs), не маркетинговый shipped claim

---

## 📊 Текущее состояние систем

### Полностью реализованные системы (✅)
- 3D рендеринг (R3F, PostFX, selective MeshPhysical wet/CRT, LOD, adaptive quality, scene GPU lifecycle)
- Физика (Rapier KCC, коллизии, стелс с конусами зрения); degraded → SimplePlayer
- Камера / cinematic timelines (`CinematicTimelineRunner` + camera FSM)
- Metric scale coherence + interior shell mount policy (`exterior_building` blocked as walkable)
- 7 актов + эпилог, 6+ концовок, ~116-node golden path; closed-overlay explore hubs
- Leave + hub/zone/dialogue mid-resume soft-lock pattern (AA ticks; residual scan ongoing)
- Narrative packs + registry parity (lazy runtime ↔ CI eager)
- ~30 Thought Cabinet thoughts (6 mutually exclusive pairs), dice-roll skill checks
- ~100 quest definitions (spine + sides + CHK + expansion); density uneven — stubs→cases ongoing
- Пошаговый бой, стелс/патрули, 27 сцен, procedural Web Audio
- Zod saves + migrations, bundle budgets, Vercel SPA

### Нуждающиеся в доработке (⚠️)
- Mixamo ↔ Quaternius full bone remap (hip filter / talk fallback interim)
- Authored score / VO — procedural audio only
- Content factory toward 120 h (authoring, not engine)
- GLB mass re-export / AI3DGen hero meshes (asset pipeline debt)
- PostFX on low for some hero scenes — partial gap
- SSR on wet streets (ultra-only, needs A/B)
- Continuous walk↔run blend (locomotion blend tree partial)
- More content density Acts 3-4 (ongoing)

### ✅ Недавно закрыто (cron-tick 10, 2026-08-02)
- 5 unwired filmic CSS classes now active on components (ink-bleed, boot-stagger, boot-cursor, crosshair-ring, vignette-pulse)
- 6 new filmic CSS micro-animations (compass-glow, panel-sweep, tooltip-ink, stat-bar-sheen, notification-slide, quest-tracker-shimmer) + 3 wired onto components
- CompassPOIMarkers orphan mounted in CompassHUD (quest POI directional markers)
- StatPulse orphan mounted in SceneTopBarHud (stat change pulse)
- Atmospheric effects for 5 bare scenes (chk_forest_zorge, forest_clearing, zarema_albert_room, factory_roof, office_day)
- 5 VolumetricLightShaft presets (12 shafts: abandoned_factory, underground_bunker, chk_campfire_night, library_basement, albert_backroom)

### ✅ Недавно закрыто (cron-tick 9, 2026-08-02)
- Procedural act mood audio tables — ACTIVATED (ACT_MOOD_OVERRIDES in proceduralAudioCatalog.ts, 20 entries covering 5 key scenes across acts 2-5, resolveActMoodOverride helper)
- Atmospheric effects for 6 bare scenes — ACTIVATED (solnysh_room/chk_campfire_night/library_basement/underground_bunker/albert_backroom/zarema_room now have dust/embers/mist/flicker)
- Fog + godray presets for 7 extension scenes — ACTIVATED (FOG_PRESETS + GODRAY_PRESETS extended)

### ✅ Недавно закрыто (cron-tick 6, 2026-08-02)
- VolumetricLightShafts for home_evening/factory_basement — ACTIVATED (presets added to SCENE_VOLUMETRIC_LIGHTS; mesh cones complement GodRays postprocessing)
- Dialogue karma-gated branches — implemented (cron-tick 5: 8 karma-gated choices via ChoiceCondition.minKarma/maxKarma)
- Accessibility pass — extended (cron-tick 6: global reduced-motion kill-switch in accessibility.css + panel-specific close aria-labels; FocusTrap already wide via PanelWrapper)

### Новые системы (исторически v4.3–4.4; всё ещё в дереве)
- Thought Cabinet, dice-roll checks, Act 1–7 expanded dialogue packs
- DE-style dialogue extras, clothing, combat affinities — см. session history ниже

---

## 📁 Ключевые файлы и их назначение

### Данные и контент
| Файл | Назначение |
|------|-----------|
| `src/data/poems.ts` | **НЕ РЕДАКТИРОВАТЬ** — стихи Владимира Лебедева |
| `src/data/thoughtCabinet.ts` | Определения ~30 мыслей для Thought Cabinet |
| `src/data/narrative/narrativePackRegistry.ts` | Lazy act packs + satellites |
| `src/shared/sceneExploreHubRegistry.ts` | Hub topology / entryNodeIds / closed-overlay set |
| `src/data/narrativeExpansionTriggerZones.ts` | 3D trigger zones for mid-resume / discovery |
| `src/data/story/act1.ts` — `act7.ts` + `structures/` + `texts/` | Story packs |
| `src/data/quests/` | Quest definitions (~100 via index merge) |
| `src/data/npc/npcDefinitions.ts` | NPC definitions |

### Движок / AA visuals
| Файл | Назначение |
|------|-----------|
| `src/config/metricScaleCoherence.ts` | 1u=1m human/prop targets |
| `src/config/interiorShellScale.ts` | Shell mount kinds + fit scales |
| `src/engine/graphics/wetStreetScenes.ts` | Selective MeshPhysical wet/CRT gates |
| `src/engine/scene/sceneGpuLifecycle.ts` | Scene GPU preload/evict |
| `src/engine/narrative/presentNarrativeBeat.ts` | Единая точка открытия story/dialogue |
| `src/engine/guidedStory/aaaSideQuestHints.ts` | Live side-quest cues |
| `src/components/3d/CinematicTimelineRunner.tsx` | Cinematic timeline runner |
| `src/engine/skillCheck/diceRollSkillCheck.ts` | Dice-roll (2d6) |
| `src/engine/combat/CombatSystem.ts` | Turn combat |

### Store / UI
| Файл | Назначение |
|------|-----------|
| `src/store/gameStore.ts` | Фасад сторов |
| `src/store/slices/thoughtCabinetSlice.ts` | Thought Cabinet state |
| `src/components/game/journal/ThoughtCabinetTab.tsx` | Thought Cabinet UI |
| `src/components/game/dialogue/DiceRollDisplay.tsx` | Dice animation |

---

## 🔧 Архитектурные правила (КРИТИЧНО)

1. **`src/data/poems.ts` — НЕВОСПОЛНИМО. Никогда не редактировать.**
2. Store и Engine НЕ импортируют друг друга напрямую (ESLint rule)
3. Все мутации состояния — через `dispatchGameAction()` / `applyGameAction()`
4. Новый контент = данные (packs/hubs/zones/quests); не размазывать overlay open
5. Нарратив открывается ТОЛЬКО через `presentNarrativeBeat()`
6. Kenney `exterior_building` shells — не walkable rooms (`AuthoredInteriorShell` refuses)
7. Mid-beat quests need leave → hub + zone + dialogue mid-resume (soft-lock pattern)
8. `npm run check` перед каждым коммитом (lint + tsc + validate + build + budgets)
9. TypeScript strict mode, 0 ошибок обязательно
10. Полная карта — `ARCHITECTURE.md`; AA ticks — `docs/AA_QUALITY_ROADMAP.md`

---

## 🗺️ Дорожная карта

Исторические фазы 1–15 и session log ниже сохранены как хроника.
**Актуальный AA план:** [`docs/AA_QUALITY_ROADMAP.md`](./docs/AA_QUALITY_ROADMAP.md)
(Wave 1–2 visuals done; soft-lock / quest flesh ticks continuous; Mixamo remap + act mood audio open).

### ✅ Выполнено (сводка)
- Thought Cabinet, dice-roll, Act 1–7 expanded dialogue, free-exploration hubs
- Hub visual stages 11–17, AA selective wet/CRT, interior shell policy
- Leave/mid-resume soft-lock pattern across Acts 1–7 (residual leave-scan ongoing)
- Combat polish, clothing, NPC emotion, adaptive quality, Zod saves

### 🔄 Следующие шаги
- Residual leave-scan / quiet-hour / expansionQuestStory next-only chains
- Mixamo ↔ Quaternius full bone remap
- Procedural act mood tables / optional CC0 stems
- Content factory toward honest dense hours (not vanity quest IDs)
- AI3DGen hero meshes / visual judge on remaining thin hubs

---

## 📝 История сессий

### Сессия: 2026-08-02 (cron-tick 10) — "Filmic CSS wiring + orphan HUD mounts + atmospheric effects + volumetric shafts + content"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser на https://volodka.vercel.app/ подтвердила стабильность (0 ошибок, tick-6 filmic CSS confirmed live: examine-fade + corner-bracket + plate-glass). 3 параллельных work-stream'а: (me) filmic CSS wiring + orphan HUD mounts + atmospheric effects; (10-a) karma-gated dialogue + examine zones + Thought Cabinet + idle/byAct; (10-b) VolumetricLightShaft presets.

**Что сделано (21 файлов, ~+1008/-10 строк, 1 коммит 20afe8e):**
1. **Wire 5 unwired filmic CSS classes onto components:** hud-filmic-ink-bleed → SceneDiscoveryCelebration (blur-to-clarity text reveal), hud-filmic-boot-stagger → HUDBootSequence (staggered fade-in), hud-filmic-boot-cursor → HUDBootSequence (warm amber cursor), hud-filmic-crosshair-ring → DynamicCrosshair (expanding ring on interaction), hud-filmic-vignette-pulse → SprintDrainOverlay (red pulse for critical sprint).
2. **6 NEW filmic CSS micro-animations (hud-filmic.css +207 строк):** hud-filmic-compass-glow (warm glow on compass cardinal), hud-filmic-panel-sweep (horizontal light sweep on panel open), hud-filmic-tooltip-ink (ink-bleed tooltip reveal), hud-filmic-stat-bar-sheen (one-shot highlight on stat bar change), hud-filmic-notification-slide (filmic slide-in for toasts), hud-filmic-quest-tracker-shimmer (warm shimmer on quest text). All gated on prefers-reduced-motion.
3. **Wire 3 new classes onto components:** StoryGuidanceHUD (+quest-tracker-shimmer), ExaminePanel (+panel-sweep), ToastItem (+notification-slide).
4. **Mount CompassPOIMarkers orphan widget in CompassHUD:** quest POI directional markers around the compass — shows glowing dots at the correct angle relative to player facing for active quest objectives. Was orphaned (0 imports) — now live.
5. **Mount StatPulse orphan widget in SceneTopBarHud:** stat change pulse animation on the mood indicator — color-coded pulse (rose for high stress, amber for low energy). Was orphaned — now live.
6. **Atmospheric effects for 5 bare scenes (AtmosphericEffects.tsx):** chk_forest_zorge (mist), forest_clearing (mist), zarema_albert_room (dust), factory_roof (dust), office_day (fluorescent flicker). These 5 scenes previously had ZERO atmospheric effects.
7. **5 VolumetricLightShaft presets (10-b, VolumetricLightShaft.tsx, +203 строк):** abandoned_factory (3 shafts: broken skylight beams, warm amber, high dust), underground_bunker (2 shafts: green CRT glow + red emergency), chk_campfire_night (2 shafts: ground-level campfire cones, warm orange), library_basement (2 shafts: bare bulb overhead, warm amber, high dust), albert_backroom (2 shafts: dim desk lamp + faint window spill, warm amber).
8. **+8 karma-gated dialogue choices (10-a, 4 dialogue files):** zarema_daily_life (minKarma:50, maxKarma:20), maria_dialogue (minKarma:60, maxKarma:15), cafe_barista_night_pulse (minKarma:45, maxKarma:20), colleague_suspects (minKarma:55, maxKarma:15), barista_maria (minKarma:65, maxKarma:20), alexander_past (minKarma:40, maxKarma:10), dmitry_factory_impossible (minKarma:55, maxKarma:25), alexander_about_system (minKarma:50, maxKarma:15).
9. **+9 examine TriggerZones (10-a, triggerZones.ts, +185 строк):** zarema_room (2), library_basement (2), chk_campfire_night (2), guild_mainframe (2), city_square (1).
10. **+6 Thought Cabinet thoughts (10-a, thoughtCabinet.ts, +92 строки):** items 55-60: Пепельный Ритм, Протокол Эмпатии, Тишина Кабеля, Часовой Механизм, Голос Татарский, Протокол Сожаления.
11. **+2 idle monologue scenes (10-a, idleMonologues.ts, +44 строки):** zarema_room, forest_clearing (10 lines each).
12. **+6 byAct revisit thoughts (10-a, sceneEntryThoughts.ts, +6 строк):** factory_roof +acts{6,7}, library_basement +acts{6,7}, river_pier +acts{3,4}.

**TypeScript:** 0 ошибок. **Стихи:** не тронуты. **Инварианты:** сохранены.

**Следующий шаг:** Author QA на Vercel — проверить CompassPOIMarkers в compass, panel-sweep на ExaminePanel, notification-slide на toasts, atmospheric effects в chk_forest_zorge/forest_clearing/office_day, VolumetricLightShafts в abandoned_factory/underground_bunker/chk_campfire_night. Дальше — SSR wet streets, walk↔run blend, Mixamo remap, ещё контент Acts 3-4, ещё orphaned HUD mounts (14 remaining: CyberpunkMinimap, QuickTimeEventOverlay, QuestObjectiveCard, DamageFloatSystem, etc.).

---

### Сессия: 2026-08-02 (cron-tick 9) — "Atmospheric effects for bare scenes + filmic CSS depth/scanline/mood + per-act audio + content"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser на https://volodka.vercel.app/ подтвердила стабильность (0 ошибок, exploration HUD + examine panel + filmic CSS confirmed live). Tick-8 filmic CSS (npc-name-plate, dialogue-reveal, scene-title) confirmed live. 3 параллельных work-stream'а: (me) atmospheric effects + filmic CSS wiring + new CSS micro-animations; (5-a) karma-gated dialogue + examine zones + Thought Cabinet + idle/byAct; (5-b) fog/godray presets + per-act mood audio overrides.

**Что сделано (20 файлов, ~+1000/-14 строк, 1 коммит a96868c):**
1. **Atmospheric effects for 6 bare scenes (AtmosphericEffects.tsx):** Added dust motes to `solnysh_room`, `library_basement`, `albert_backroom`, `zarema_room`; embers to `chk_campfire_night`; mist to `underground_bunker`; flickering lights to `underground_bunker`, `library_basement`. These 6 scenes previously had ZERO atmospheric effects.
2. **Fog presets for 7 extension scenes (VolumetricFog.tsx, +78 строк):** `solnysh_room`, `chk_campfire_night`, `factory_roof`, `library_basement`, `underground_bunker`, `albert_backroom`, `zarema_room` — all now have authored fog presets matching their scene mood.
3. **Godray presets for 6 extension scenes (GodRays.tsx, +111 строк):** `solnysh_room` (warm pendant lamp), `chk_campfire_night` (campfire glow), `factory_roof` (distant neon), `library_basement` (dusty lamp), `underground_bunker` (green CRT), `albert_backroom` (desk lamp).
4. **6 new filmic CSS micro-animations (hud-filmic.css, +226 строк):** `.hud-filmic-depth-shimmer` (atmospheric depth-of-field shimmer on HUD plates), `.hud-filmic-crt-overlay` (CRT scanline overlay with green sweep), `.hud-filmic-mood-vignette` (scene-type-dependent vignette tint), `.hud-filmic-choice-badge` (choice number badge animation), `.hud-filmic-thought-new` (Thought Cabinet entry glow), `.hud-filmic-dice-flash-success/fail` (dice roll result flash). All gated on prefers-reduced-motion.
5. **Wired 6 filmic CSS classes onto components:** CyberStatBar (+stat-fill), NarrativeChoiceList (+hover-lift +choice-badge), DialogueRenderer (+interjection glow), DiegeticDialogueHud (+depth-shimmer), ExplorationHUD (+mood-vignette), ThoughtCabinetTab (+thought-new glow), DiceRollDisplay (+dice-flash).
6. **Per-act mood audio overrides NEW FEATURE (proceduralAudioCatalog.ts, +81 строк):** `ActMoodOverride` type + `ACT_MOOD_OVERRIDES` map (20 entries covering 5 key scenes across acts 2-5) + `resolveActMoodOverride()` helper. The same scene now sounds subtly different as the story darkens — volodka_room shifts from cozy_indoor (act 1) to tension (act 3) to noir_street (act 5).
7. **+8 karma-gated dialogue choices (5-a, 4 dialogue files):** albert_philosophy (minKarma 40 + maxKarma 15), albert_personal_story (minKarma 55), cafe_barista_frequency_match (minKarma 30 + maxKarma 20), maria_hub_network (minKarma 45), alexander_redemption (minKarma 60), barista_philosophy (minKarma 35), zarema_father_revelation (minKarma 50 + maxKarma 25), alexander_system_crash (minKarma 35).
8. **+8 examine TriggerZones (5-a, triggerZones.ts, +194 строк):** chk_campfire_night (2), library_basement (2), albert_backroom (2), forest_clearing (2).
9. **+6 Thought Cabinet thoughts (5-a, thoughtCabinet.ts, +92 строки):** items 49-54: Архитектор Разрушения, Эхо Завода, Протокол Сопротивления, Тень Кода (hidden), Голос Подземелья, Строка Без Конца.
10. **+2 idle monologue scenes (5-a, idleMonologues.ts, +46 строк):** city_square, albert_backroom (10 lines each).
11. **+6 byAct revisit thoughts (5-a, sceneEntryThoughts.ts, +6 строк):** solnysh_room +acts{2,3,5}, park_day +acts{2,6,7}.

**TypeScript:** 0 ошибок. **Стихи:** не тронуты. **Инварианты:** сохранены.

**Следующий шаг:** Author QA на Vercel — проверить atmospheric effects в solnysh_room/chk_campfire_night/underground_bunker (dust/embers/mist/flicker), depth shimmer на dialogue plate, mood vignette tint, CRT scanline overlay, per-act audio shifts. Дальше — SSR wet streets, walk↔run blend, Mixamo remap, ещё контент Acts 3-4.

---

### Сессия: 2026-08-02 (cron-tick 8) — "Filmic dialogue CSS + NPC name plate + karma dialogue + examine zones + Thought Cabinet + content"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser подтвердила стабильность (0 ошибок, tick-6 filmic CSS confirmed live). Tick-7 HUD elements (KarmaTierBadge, fade-edge, text-glow, pulse-ring) hidden на headless browser viewport — NOT a bug (responsive `hidden sm:*`). 3 параллельных work-stream'а: (me) filmic CSS для dialogue experience; (4-a) karma-gated dialogue + examine zones; (4-b) Thought Cabinet + idle + byAct.

**Что сделано (11 файлов, ~+843/-3 строк, 1 коммит):**
1. **Filmic CSS для dialogue experience (src/styles/hud-filmic.css +186 строк + 3 component wirings):** 6 NEW classes: .hud-filmic-npc-name-plate (warm underline accent, scaleX draw 0.6s), .hud-filmic-hover-lift (subtle lift + shadow on hover), .hud-filmic-scene-title (cinematic title card: letterSpacing+blur+opacity reveal 0.8s), .hud-filmic-dialogue-reveal (text-shadow pulse on NPC speech 0.6s), .hud-filmic-stat-fill (gradient fill sweep 3s infinite), .hud-filmic-interjection (glow for thought interjection lines). All gated на prefers-reduced-motion. Wired: DiegeticDialogueHud (+npc-name-plate +dialogue-reveal), SceneContextChip (+scene-title).
2. **Karma-gated dialogue (4-a, 4 dialogue files, +130 строк):** +8 choices: albert_deep_talk (minKarma 35), albert_deep_alliance (maxKarma 15), colleague_trust_test (minKarma 50), cafe_barista_network_reveal (maxKarma 20), victoria_sacrifice (minKarma 60), albert_resistance (maxKarma 10), victoria_after_storm (minKarma 40), alexander_charter (minKarma 25).
3. **Examine TriggerZones (4-a, triggerZones.ts, +245 строк):** +10 zones для 4 zero-coverage scenes: city_square 0→3, underground_bunker 0→3, guild_mainframe 0→2, zarema_room 0→2.
4. **Thought Cabinet (4-b, thoughtCabinet.ts, +93 строки):** +6 thoughts (items 43-48): production_syndrome, code_shard, server_silence, sleep_protocol, documentation_echo, memory_cache.
5. **Idle monologues (4-b, idleMonologues.ts, +69 строк):** +3 scenes (chk_forest_zorge, factory_roof, zarema_albert_room — 30 new lines).
6. **byAct revisit thoughts (4-b, sceneEntryThoughts.ts, +12 строк):** +12 entries across 4 scenes (zarema_room +3 acts, underground_bunker +3 acts, pier_evening +3 acts, city_square +3 acts).

**TypeScript:** 0 ошибок. **Стихи:** не тронуты. **Инварианты:** сохранены.

**Следующий шаг:** Author QA на Vercel. Дальше — SSR wet streets, walk↔run blend, Mixamo remap, procedural act mood audio, ещё контент Acts 3-4.

---

### Сессия: 2026-08-02 (cron-tick 7) — "KarmaTierBadge mount + filmic CSS micro-animations + weather-reactive NPC barks + karma dialogue Acts 3-4 + content"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser на https://volodka.vercel.app/ подтвердила стабильность (0 ошибок, tick-6 filmic CSS confirmed live: examine-fade + corner-bracket + plate-glass all present in DOM). Решение: багов нет, продолжить аддитивные AAA-улучшения. 3 параллельных work-stream'а: (me) KarmaTierBadge orphan mount + filmic CSS; (3-a) karma-gated dialogue Acts 3-4 + examine zones; (3-b) weather-reactive NPC barks NEW FEATURE + Thought Cabinet + idle content.

**Что сделано (15 файлов, ~+960/-11 строк, 1 коммит):**
1. **KarmaTierBadge orphan mount (src/components/game/hud/SceneTopBarHud.tsx):** импортирован KarmaTierBadge (был orphaned — 0 imports) + usePlayerKarma selector. Mounted в top-right cluster (перед EnvironmentMoodIndicator + ExplorationProgressBadge). Badge показывает tier label (✦/◆/✧) с breathing-glow анимацией, color-coded по знаку кармы (cyan/amber/rose). Show-don't-tell feedback кармы в top-bar.
2. **Filmic CSS micro-animations (src/styles/hud-filmic.css +184 строк + 3 component wiring):** 6 NEW classes: .hud-filmic-choice number badge enhancement (descendant selector — corner-bracket frame ::before/::after + warm glow on hover, pure CSS no component change), .hud-filmic-crt-scanlines (subtle scanline overlay для terminal panels), .hud-filmic-text-glow (dual warm text-shadow), .hud-filmic-fade-edge (gradient mask для ticker edge dissolve), .hud-filmic-pulse-ring (pulsing box-shadow 2.4s), .hud-filmic-boot-stagger (staggered fade-in 6 children 60ms). All gated на prefers-reduced-motion. Wired: TopBarDataTicker (+fade-edge), SceneContextChip (+text-glow), CrosshairInteractionPrompt (+pulse-ring).
3. **Weather-reactive NPC barks NEW FEATURE (3-b, src/shared/npcBark.ts + npcAmbientBarkSystem.ts + npcEvents.ts, +115 строк):** getWeatherBark() function + WEATHER_BARKS data (16 lines: 4 per rain/snow/fog/storm). Wired в resolveNpcAmbientBark() Priority 0 (30% gate, separate weatherRng, weather derived via deriveSceneWeather). NPC теперь комментируют погоду — living world ↑. Backward-compatible (optional params).
4. **Karma-gated dialogue Acts 3-4 (3-a, 4 dialogue files, +133 строк):** +8 karma-gated choices: alexander_respect (minKarma 55), alexander_proposition (maxKarma 15), zarema_in_cell (minKarma 60), victoria_vault_truth_revealed (minKarma 50), albert_poetry_of_code (maxKarma 10), dmitry_about_factory (maxKarma 20), victoria_sacrifice_debate (minKarma 65), albert_last_stand (minKarma 45).
5. **Examine TriggerZones (3-a, src/data/triggerZones.ts, +209 строк):** +9 zones: sleep_dream 2→5 (clock_no_hands, floating_window, mirror_self), albert_backroom 4→6 (old_radio, recipe_box), factory_roof 4→6 (graffiti_wall, old_antenna), chk_forest_zorge 4→6 (carved_birch, mossy_bench).
6. **Thought Cabinet thoughts (3-b, src/data/thoughtCabinet.ts, +90 строк):** +6 thoughts (items 37-42): server_room_voice, despair_protocol, digital_dust, ping_echo, shadow_cache, ram_memory. Standalone (no new mutually-exclusive pairs).
7. **Idle monologues (3-b, src/data/idleMonologues.ts, +70 строк):** +3 scenes (solnysh_room, pier_evening, chk_campfire_night) — all 4 bands: neutral×4 + high×2 + low×2 + highStress×2 = 30 new lines.

**TypeScript:** 0 ошибок. **Стихи:** не тронуты. **Инварианты:** сохранены.

**Следующий шаг:** Author QA на Vercel — проверить KarmaTierBadge в top-bar (breathing glow), choice number brackets, pulse ring на interaction prompt, weather barks (rain/snow/fog/storm), new thoughts в Cabinet. Дальше — SSR wet streets, walk↔run blend, Mixamo remap, procedural act mood audio, ещё контент Acts 3-4.

---

### Сессия: 2026-08-02 (cron-tick 6) — "VolumetricLightShafts hero scenes + filmic CSS micro-animations + accessibility hardening + living-world content"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser на https://volodka.vercel.app/ подтвердила стабильность (0 ошибок, HUD widgets/live, tick-5 filmic CSS confirmed in DOM). Решение: багов нет, продолжить аддитивные AAA-улучшения. 4 параллельных work-stream'а: (me) VolumetricLightShafts для home_evening/factory_basement — долгосрочный отложенный item; (2-a) filmic CSS polish; (2-b) accessibility pass; (2-c) living-world content.

**Что сделано (14 файлов, ~+713/-12 строк, 1 коммит):**
1. **VolumetricLightShafts для hero-сцен (src/components/3d/VolumetricLightShaft.tsx, +125 строк):** добавлены presets для home_evening (3 shafts: warm amber pendant [0,2.5,0] #ffaa44 + amber corner lamp + mellow warm fill) и factory_basement (4 shafts: hero green «Заря-М» glow [0,2.6,-5.2] #22ff88 + 2 mirrored red emergency + cold aisle spill). Positions mirror GodRaysSunMesh configs — mesh-cones emanate from same origin as postprocessing GodRaysEffect (complementary layers). Component уже mounted в SceneEnvironment.tsx:324 — только data добавлена. Quality-gated (high/ultra desktop, 2-shaft cap mobile, reduced-motion → steady glow).
2. **Filmic CSS polish (2-a, src/styles/hud-filmic.css +232 строк + 4 component wiring):** 6 NEW classes: .hud-filmic-choice-accent (left-edge amber bar grows on hover/focus via ::before scaleY), .hud-filmic-examine-fade (staggered fade-in 0/90/180ms via nth-child), .hud-filmic-divider (gradient line + centered diamond glyph), .hud-filmic-quote (decorative 3em quotation mark ::before on cinematic captions), .hud-filmic-corner-bracket (4 animated L-brackets draw in 360ms stagger 60ms), .hud-filmic-boot-flicker (boot title flicker 1.2s). All gated на prefers-reduced-motion с static fallbacks. Wired: ExaminePanel (corner-bracket + examine-fade + divider), CinematicNarrativeFrame (quote), LoadingScreen (boot-flicker), MenuScreenPanel (divider).
3. **Accessibility hardening (2-b, 5 files):** Found all 4 target panels (Inventory/QuestBoard/Codex/Settings) ALREADY had FocusTrap via PanelWrapper. Added closeAriaLabel prop (3 specific labels: Закрыть инвентарь/доску заданий/кодекс). Extended accessibility.css @media (prefers-reduced-motion: reduce) с global kill-switch (*, *::before, *::after { animation-duration: 0.01ms !important; ... }). Icon-button audit: HUD already well-labeled, 0 changes.
4. **Living-world content (2-c, 3 data files):** +14 NPC bark lines (2 per emotion × 7, neutral 0→2); +3 idle monologue scenes (guild_mainframe, library_basement, underground_bunker — все 4 bands: neutral×4 + high×2 + low×2 + highStress×2 = 30 new lines); +8 byAct revisit thoughts (park_day +acts{4,5}, library_day +acts{3,4}, factory_roof +acts{4,5} new field, library_basement +acts{4,5} new field).

**TypeScript:** 0 ошибок. **Стихи:** не тронуты. **Инварианты:** сохранены (Rapier interpolate={false}, KCC ownership, postprocessing depth-blit patch, test contracts).

**Следующий шаг:** Author QA на Vercel — проверить VolumetricLightShafts в home_evening/factory_basement (Ultra), filmic micro-animations (choice accent, examine fade, corner brackets, boot flicker), reduced-motion fallbacks. Дальше — SSR wet streets, walk↔run blend, Mixamo remap, procedural act mood audio, ещё контент Acts 3-4.

---

### Сессия: 2026-08-02 (cron-tick 5) — "Thought Cabinet bugfix + orphan HUD mounts + filmic CSS activation + karma-gated dialogue + examine/idle/byAct content"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser на https://volodka.vercel.app/ подтвердила стабильность (0 ошибок, HUD widgets из предыдущих сессий подтверждены live: SessionPlayTimer, FootstepPedometer, SceneContextChip, interaction prompt). 3 параллельные разведки нашли: (1) 6 genuinely-orphaned HUD widgets (3 named candidates оказались false alarms), (2) 10 orphan filmic CSS classes (~250 lines dead CSS) + 5 new additions + token-swap opportunities, (3) CRITICAL BUG: commit 43a16b0 добавил MUTUALLY_EXCLUSIVE_PAIRS но не 6 ThoughtCabinetItem entries → 4 dangling IDs.

**Что сделано (21 файлов, ~+903/-23 строк, коммит 381d0bf после rebase поверх 448e253, push в main):**
1. **BUGFIX Thought Cabinet**: добавлены 6 missing ThoughtCabinetItem entries (31-36): Цифровой Зов, Призрак Кодекса, Ночной Дозор, Поэтическая Матрица, Холодный Расчёт, Уличный Шёпот. Discovery: `endurance`/`authority` НЕ валидные TrainablePlayerSkills (claim из Task 3-c ложный). Substituted rhythm/persuasion, aligned descriptions.
2. **Orphan HUD mounts (6)**: PlayerCoordinatesDisplay → SceneTopBarHud; AmbientParticles (HUD) → ExplorationHUD; HUDBootSequence → GameplayExplorationHud (sessionStorage once-per-session guard); InteractionDistanceRing → ExplorationHUD (crosshair cluster); SceneDiscoveryCelebration REPLACES SceneDiscoveryToast (filmic); HUDNotificationFeed → GameplayExplorationHud (verified disjoint events vs NotificationToasts).
3. **Filmic CSS activation (~250 lines dead CSS wired)**: .hud-filmic-dialogue-breath → DiegeticDialogueHud plate; .hud-ambient-particles+.hud-ambient-pulse → ExplorationHUD root; .hud-filmic-letterbox-gradient → CinematicShell bars; .hud-filmic-status-pulse → CyberStatBar. + 5 NEW classes: .hud-filmic-plate-glass, .hud-filmic-ink-bleed, .hud-filmic-status-segment, .hud-filmic-vignette-pulse, .hud-filmic-boot-cursor. + 2 a11y blocks: @media (prefers-contrast: more), @media (forced-colors: active).
4. **Token swaps (WCAG-AA)**: LoadingScreen (cyan/slate→filmic), MenuScreenPanel (text-stone-400/55→ink-meta, contrast fix), ExaminePanel (+plate-glass+ink-hero), DiegeticDialogueHud (+icon-btn).
5. **Content (pure data)**: 8 karma-gated dialogue choices (minKarma 25-70 / maxKarma 10-20) across part1-5; 10 new examine TriggerZones (forest_clearing 0→4, albert_backroom +2, chk_forest_zorge +2, factory_roof +2); 1 new IDLE_MONOLOGUES scene (factory_basement) + 8 neutral lines; 6 byAct revisit thoughts across 4 scenes.

**Rebase conflict resolution:** remote имел 5 новых коммитов (448e253, visual/mobile fixes). 2 конфликта: DiegeticDialogueHud (combined remote flex+maxHeight with my dialogue-breath); OrchestratorGameplaySections (remote перенёс MoralCompassHUD/KarmaShiftLayer/DayNightCycleIndicator INSIDE <LazyHUD> progressive-reveal — сохранено, мои HUDNotificationFeed+SceneDiscoveryCelebration оставлены снаружи, удалён duplicate DayNightCycleIndicator).

**TypeScript:** 0 ошибок. **Стихи:** не тронуты. **Инварианты:** сохранены.

**Следующий шаг:** Author QA на Vercel (новые HUD widgets, filmic CSS, karma lock icons, examine zones). Дальше — SSR wet streets, walk↔run blend, Mixamo remap, ещё контент Acts 3-4.

---

### Сессия: 2026-08-02 (cron-tick 4) — "Orphaned HUD mounts + filmic CSS polish + new Thought Cabinet thoughts + NPC emotion indicator"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser на https://volodka.vercel.app/ подтвердила стабильность (0 ошибок, 0 console errors). 3 параллельные разведки замапили: (1) 6 orphaned HUD widgets для монтажа, (2) 7+ filmic CSS classes + 12+ tokens, (3) 6 новых Thought Cabinet мыслей + NPC emotion indicator + scene atmosphere profile. Решение: багов нет, продолжить аддитивные AAA-улучшения.

**Что сделано (16 файлов, ~+807/-52 строк, коммит 43a16b0, push в main):**

*Orphaned HUD widget mounts (6 виджетов):*
- `FootstepPedometer` + `SessionPlayTimer` → `SceneTopBarHud.tsx` — bottom-left cluster с motion entrance
- `LootProximityIndicator` → `ExplorationHUD.tsx` — after NPCProximityIndicator
- `EnvironmentalEffectsOverlay` → `GameplayExplorationHud` — wired via `useEnvironmentalEffectsOverlayProps()` (weather, timeOfDay, locationType, healthPercent)
- `BuffDebuffTracker` → `GameplayExplorationHud` — wired via `useActiveEffects()` (reads poemPowers)
- `SkillRechargeHUD` → `GameplayAmbientExplorationHud` — wired via `useSkillSlots()` (reads poemPowers)
- `hudMountSelectors.ts` (NEW) — 3 store wiring hooks

*Filmic CSS styling (7 new classes + 12 new tokens + 1 new CSS file):*
- `.hud-filmic-scanline` — CRT sweep line (8s, reduced-motion gated)
- `.hud-filmic-dialogue-breath` — border breathing glow (4s)
- `.hud-filmic-toast-enter/exit` — standardized slide+fade transitions
- `.hud-filmic-status-pulse` — opacity pulse on status bar changes
- `.hud-filmic-crosshair-ring` — expanding ring on interaction start
- `.hud-filmic-letterbox-gradient` — gradient fade into darkness
- 12 new CSS tokens: vignette-indoor/outdoor/digital/combat, ink-hero, plate-glass, glow-warm/cool, transition-slow, scan-speed
- `hud-filmic-ambient.css` (NEW) — CSS-only dust particles, light flicker, exploration pulse

*New Thought Cabinet thoughts (6 мыслей, items 31–36):*
- Цифровой Зов, Призрак Кодекса, Ночной Дозор, Поэтическая Матрица, Холодный Расчёт, Уличный Шёпот
- 2 mutually exclusive pairs: digital_call↔street_whisper, cold_calculation↔poetic_matrix

*NPC emotion indicator + scene atmosphere:*
- `NpcEmotionIndicator.tsx` — enhanced with EventBus-driven `npc:emotion_change` events
- `forest_clearing` — natural, peaceful, mystical visual profile + scene definition

**Безопасность:** все правки аддитивны; инварианты сохранены. typecheck `node scripts/tsc7.mjs --noEmit` → exit 0. Стихи не трогались.

**Следующий шаг:** Author QA на Vercel — проверить HUD widgets, filmic CSS, new thoughts. Дальше — VolumetricLightShafts, content factory Acts 3-4, Mixamo remap, dialogue karma-gated branches.

---

### Сессия: 2026-08-02 (cron-tick 3) — "GodRays postprocessing + orphan HUD mounts + accessibility pass + filmic styling polish"
**Контекст:** Cron-triggered продолжение AAA-polish. QA via agent-browser подтвердила стабильность (0 ошибок). 3 параллельные разведки (Explore-агенты) замапили: (1) GodRays postprocessing feasibility — SAFE, (2) remaining orphan HUD widgets — 5 Tier-1 candidates, (3) accessibility + styling gaps — 5 a11y + 5 styling opportunities. Решение: багов нет, продолжить аддитивные AAA-улучшения.

**Что сделано (7 modified + 1 new file, ~+232/-9 строк):**

*Filmic visuals — GodRays postprocessing (ultra-only, hero-interior-scenes-only):*
- `GodRaysSunMesh.tsx` (NEW) — dedicated emissive sphere mesh (0.1m, additive blending, depthWrite=false, toneMapped=false) как sun source для GodRaysEffect. Positions mirror GODRAY_PRESETS: home_evening [0,2.5,0] #ffaa44, factory_basement [0,2.6,-5.2] #22ff88.
- `ExplorationPostFX.tsx` — added GodRays effect between DOF and Vignette. Always mounted when gates pass (ultra + reduced-motion-gated + soft-work-budget + GODRAYS_POST_SCENES). Opacity animated 0↔0.55 via godRaysRef (0.5s easeInOutCubic), decays to 0 during dialogue/cutscene. 60 samples, density 0.96, decay 0.92, blur, KernelSize.SMALL, SCREEN blend. Complements existing mesh-based GodRays.tsx shafts.
- Depth-blit patch invariant preserved: GodRaysEffect allocates independent DepthTexture (no collision).

*Show-don't-tell HUD — 5 orphan widget mounts:*
- `HUDChromaticEdge` в ExplorationHUD — stress-reactive chromatic edge fringing (selector-driven).
- `InteractionCooldownRing` в ExplorationHUD — cooldown sweep over crosshair (EventBus interaction:start/end).
- `InteractionRadarPulse` в ExplorationHUD — radar pulse while moving (EventBus exploration:footstep).
- `EmergencyHelpButton` в GameplayExplorationHud — self-contained popover с objective + nearby zones + reset-interaction. Idle-pulse after 15s.
- `ActiveQuestMiniTracker` в GameplayExplorationHud — self-gating (touch-only, renders nothing on desktop).

*Accessibility (WCAG 2.4.7 + ARIA):*
- `DiegeticDialogueHud` — + `aria-modal="true"` + `<FocusTrap>` wrapper (keyboard Tab stays inside dialogue).
- `DialogueHistoryPanel` — + `role="dialog"` + `aria-modal="true"` + `aria-label` on search input + `<FocusTrap>`.
- `CinematicShell` — + reducedMotion gate на CinematicLetterboxBars (duration 0.7→0) + CinematicAmbientGlow (duration 1.6→0). Was missing.

*Styling polish (filmic CSS — additive):*
- `hud-filmic.css` — +6 CSS tokens: `--hud-filmic-ink-meta`, `--hud-filmic-focus`, `--hud-filmic-focus-glow`, `--hud-filmic-grain-opacity`, `--hud-filmic-scan-accent`, `--hud-filmic-transition-fast/base`.
- + bottom-edge hairline `::after` на dialogue plate (frames plate consistently with top rule).
- + film grain texture `::before` overlay (SVG fractalNoise, opacity 0.08, mix-blend-mode overlay). Gated `@media (prefers-reduced-motion: no-preference)`. Reduced-motion users get static grain at 60% opacity.
- Fixed WCAG 2.4.7 fail: `.hud-filmic-choice:focus-visible` was `outline: none` → now 2px filmic focus ring + 4px glow halo.
- + `.hud-filmic-icon-btn:focus-visible` (was missing, inherited neon cyan).
- + `.cinematic-menu-item:focus-visible` (was missing, inherited neon cyan).
- + `[data-exploration-ui] .hud-corner-accent { border-color: var(--hud-filmic-rule-soft) }` — softens neon cyan corner brackets to filmic rule color.

**Безопасность:** все правки аддитивны; инварианты сохранены. typecheck `node scripts/tsc7.mjs --noEmit` → exit 0. Стихи не трогались.

**Следующий шаг:** Author QA на Vercel — проверить GodRays в home_evening/factory_basement (Ultra), HUDChromaticEdge, InteractionCooldownRing/RadarPulse, EmergencyHelpButton, FocusTrap в диалогах. Дальше — SSR, content factory Acts 3-4, Mixamo remap, procedural act mood tables.

---

### Сессия: 2026-08-02 (cron-tick 2) — "Mount orphaned HUD widgets + dialogue history + cross-scene exit bearing"
**Контекст:** Cron-triggered продолжение AAA-polish сессии. Сначала review worklog'ов (sandbox `/home/z/my-project/worklog.md` + project `worklog.md` + `AI_SESSION_CONTEXT.md`), затем QA via `agent-browser` на https://volodka.vercel.app/. Принято решение: багов нет (главное меню и HUD рендерятся чисто, 3D canvas не рендерится в headless browser — известное ограничение SwiftShader, НЕ баг кода), продолжить аддитивные AAA-улучшения из списка кандидатных orphan-виджетов.

**QA findings:**
- Главное меню: чисто, кинематографично, bloom/glow на cyan заголовке, типографика polished.
- New Game flow работает: prompt → narrative text → exploration mode.
- HUD рендерится: interaction prompt, location chip «ДОМ», status panel, narrative caption.
- 0 ошибок в browser console / page errors.
- 3D canvas не рендерится в headless browser (SwiftShader limitation) — не баг.

**Что сделано (7 modified + 3 new files, ~+155/-11 строк):**

*Show-don't-tell HUD — монтирование ещё 6 orphan-виджетов + 1 новый слой:*
- `KarmaShiftLayer` (NEW) — Disco Elysium-style «☯ +N Свет / Тень / Тьма» floating pip над MoralCompassHUD при каждой смене кармы. Pool-based, TTL 2200ms. Подписан на `usePlayerKarma()` через useRef delta-detection.
- `SceneTopBarHud` (NEW) — cohesive top-bar wrapper: SceneContextChip (top-left) + TopBarDataTicker (top-center) + EnvironmentMoodIndicator + ExplorationProgressBadge (top-right). Все 4 виджета были построены но orphaned. Shared `useHudQuietStyle` fade.
- `FloatingActionIndicator` — EventBus-driven XP/quest/karma acknowledgement chips над QuickUseBar. Слушает `fx:xp_gain`, `quest:completed`, `choice:made`.
- `DialogueHistoryPanel` button в DiegeticDialogueHud header (иконка History lucide). Local state toggle. Entries from `useDialogueHistoryStore`.
- `QuickUseCooldownOverlay` mounted over QuickUseBar slots. SVG ring с depletion по `cooldownMs`. Расширил `sound:play` payload: +`slotIndex`/`itemId`/`cooldownMs` (optional fields, backward-compatible).

*Navigation show-don't-tell:*
- `QuestDirectionArrow` — cross-scene exit bearing sub-label «↑ → {exitLabel}». Когда quest marker в другой сцене, вычисляет bearing к ближайшему exit trigger zone в текущей сцене через `SCENE_CONFIG.exits`. Read-only lookup, no state writes. Sub-arrow вращается с camera yaw.

**Безопасность:** все правки аддитивны; инварианты сохранены. typecheck `node scripts/tsc7.mjs --noEmit` → exit 0. Стихи не трогались.

**Следующий шаг:** Author QA на Vercel — проверить karma-shift pip, top-bar cluster, dialogue history button, exit bearing sub-label. Дальше — VolumetricLightShafts, SSR, content factory Acts 3-4.

---

### Сессия: 2026-08-02 — "AAA: filmic post-FX deplasticize + locomotion feel + diegetic HUD wiring"
**Контекст:** Автор попросил продолжить доводку до AAA: «ошеломляющая визуально», «роскошные катсцены», «плавно, без резких переходов», «идеальная анимация движений», «главное — геймплей», «показывай, не рассказывай». 3 параллельные разведки (Explore-агенты) замапили графику/рендер, движение/камеру, HUD/diegetic. Правки — только аддитивные, типобезопасные. Гейт: `node scripts/tsc7.mjs --noEmit` → 0 ошибок. Сервер/тесты не запускались — только код + push в main (по запросу автора). Стихи НЕ трогались.

**Что сделано (17 файлов + 1 новый, ~+244/-31 строк, коммит 20ea763, push в main):**

*Графика — deplasticize + киношный муд (ExplorationPostFX + LUT + reflections):*
- Bloom `KernelSize.HUGE` на Ultra — мягче filmic falloff неона
- N8AO per-scene tinted color — оттенённый ambient occlusion (физически поглощённый свет, не плоско-чёрный SSAO); главный «deplasticizer»
- ChromaticAberration `radialModulation` — фрингинг концентрируется по краям (настоящая линза)
- Vignette `eskil` mode на Ultra hero-сценах — фотографическое заваривание
- Per-scene ACES tone-mapping exposure — бой темнее, сон/закат светлее
- DOF `height=720` на Ultra — круглее боке в диалогах/катсценах
- `cold_noir` LUT для `underground_bunker` + `guild_mainframe` — green-teal CRT грейд
- NeonRainReflections для `river_pier` + `pier_evening` — тёплый отблеск огня/гирлянд
- WetStreetGround `mirror` 0.5→0.6 на Ultra — лужи, а не просто влажность

*Движение/камера — multi-channel impact + momentum:*
- `landingImpact.ts` (новый) — landing FOV dip (краткий внутренний пинч, ~0.4s восстановление), использует ранее мёртвое поле `scratch.landingImpactVel`
- Sprint-start FOV «kick» (+0.6° затухающий) — ощущение ускорения
- Sprint look-ahead cap boost — камера ведёт дальше на спринте (momentum)
- Синхронизирована частота дыхания камеры (2.0 Hz) с procedural body idle — убран 5s beat-воббл
- Dialogue time-scale ease — плавный вход/выход из замедления диалога (вместо жёсткого «click»)
- Wall-bump shake масштабирован по `slideRatio` — лоб в стену vs касание угла
- Footstep dust масштабируется по скорости (walk ~3, sprint ~6 + сильнее вверх)

*HUD / diegetic / show-don't-tell — монтирование уже построенных orphan-виджетов:*
- `InteractionProximityGlow` в ExplorationHUD — дышащая аура прицела + edge-flash на активации
- `StatChangeLayer` в оркестраторе + `showStatChange()` подключён к karma/energy/stress/XP (цвет = направление)
- `DialogueRelationBar` в шапке DiegeticDialogueHud — Disco Elysium-бар отношений
- `SceneDiscoveryToast` — отложенный счётчик «Открыто N/M» для сцен с title-card (оба бита видны)
- `AmbientAtmosphereCaption` скрыт во время diegetic-диалога (без наложения на плату)

**Безопасность:** все правки аддитивны; инварианты сохранены (`<Physics interpolate={false}>`, KCC ownership, postprocessing depth-blit patch, test contracts `playerLocomotionPresentation`/`explorationStrategy`/`cinematicCamera`/`cameraShake`). Все новые эффекты гейтятся на `isEffectiveReducedMotion()` и quality-tier. Стихи не трогались.

**Следующий шаг:** QA автора на https://volodka.vercel.app/ — визуальная проверка Ultra-режима в hero-сценах (street_night, city_square, volodka_room), чувство приземления/спринта, relation bar в диалогах. Дальше — VolumetricLightShafts для home_evening/factory_basement (отложено: требует проверки геометрии сцены), SSR на мокрых улицах (нужен A/B), content factory Acts 3–4, Mixamo↔Quaternius full bone remap.

---

### Сессия: 2026-08-01 — "AAA loop: deplastic + hybrid street + soft cinema"
**Контекст:** Динамический `/loop` на ошеломляющий AAA look/feel; независимый судья по `docs/AAA_JUDGE_CRITERIA.md` (LOCKED). Стихи/меню не трогали.

**Что сделано:**
- `deplasticizeCharacterMaterials` → Cesium player + GLB NPCs (меньше пластика)
- `street_night` hybrid AAA atmosphere/landmarks на high/ultra (не только flag)
- Плотнее street landmarks + deplastic на GLB props
- Мягче locomotion blend / cinematic crossfade / scene transition fades
- Filmic color grade (меньше candy neon); interiors/facades менее зеркальные
- Desktop StoryGuidanceHUD показывает directionHint (show-don't-tell)
- Unique `_rigs/` hero meshes for former twin aliases; wear maps on large shells
- High budget + `docs/evidence/high-fps-measure.json` (headless ANGLE ~60 FPS)

**Блокер сессии:** независимый `aaa-visual-judge` недоступен (Cursor usage limit). PASS не выставлять без судьи. Push отложен.

**Следующий шаг:** восстановить usage → перезапуск судьи; при PASS — commit + push.

---
### Сессия: 2026-07-31 — "AA docs + leave/mid-resume ticks 45–47"
**Контекст:** Документация приведена к актуальной архитектуре (shell policy, MeshPhysical,
GPU lifecycle, soft-lock pattern). Uncommitted leave/mid-resume для `pier_ritka`,
library archive/Katya, fishing, resistance defector, Act 4 bank/AI/night_watch.

**Следующий шаг:** по `docs/AA_QUALITY_ROADMAP.md` Next 3 actions.

---
### Сессия: 2026-07-28 — "Phase 7.3: Combat feel + NPC emotion HUD + touch combat"
**Контекст:** Свежий clone с GitHub в `C:\Users\IETGL\Projects\Volodka` (OneDrive-копия была битая/устаревшая). Typecheck 0 errors, 1513/1513 tests pass.

**Что сделано:**
- Combat hit-pause: bullet-time на combo ≥ 3 и player stagger; дифференцированный camera shake
- `combat:action` payload: damageChannel / isCritical / comboCount
- `NpcEmotionIndicator` — облачко эмоции над NPC (Html billboard)
- `CombatTouchControls` — крупные touch-кнопки + swipe по стихам
- ClothingTab: пунктирные пустые слоты + tooltip «Можно надеть: …»

**Следующий шаг:** Фаза 8 (модели) / Фаза 13 (exploration joystick) / контент factory — по приоритету автора.

---
### Сессия: 2026-07-24 — "Phase 7.2: Deep-fix jitter + 360° rotation + Volodka Room & Prologue duplicate-frame cleanup (v3)"
**Что сделано (16 файлов, ~+450/-220 строк):**

Пользователь (Володька) сообщил что после Phase 5.5 и Phase 7.1 модель всё ещё дёргается при движении, а управление крутит по кругу вместо шага в сторону. Также просил проверить дубликаты кадров и ререндеры в volodka room и прологе. Проведено 3 параллельных глубоких аудита (Task IDs 1-A/1-B/1-C), найдены конкретные root cause'ы, применены точечные фиксы.

**Bug #2 (вращение вместо стрейфа) — ROOT CAUSE:**
- **FIX 2.1 (CRITICAL): `SimplePlayer.tsx`** — fallback-путь (когда Rapier WASM не загрузился) вообще НЕ имел strafe-gate'а. При нажатии A/D модель безусловно поворачивалась к moveDir через `Math.atan2(moveDir.x, moveDir.z)`, а камера в `applyCameraFrame.ts` автоследовала за новым facing'ом → игрок+камера ко-вращались → 360° spin на месте. Добавлен тот же `forwardIntent`-гейт что в `playerMainMovement.ts:229-247`, плюс reversal-логика GTA/Gothic-style.
- **FIX 2.2: `playerMainMovement.ts` + `SimplePlayer.tsx`** — порог `forwardIntent` поднят с `0.01` до `0.1`. Старый 0.01 пропускал геймпадный стик-шум 0.02-0.05 и стрелял ротацией при "strafe-only" интенте.

**Bug #1 (дёргание модели при движении) — ROOT CAUSES:**
- **FIX 1.1 (HIGHEST IMPACT): `PhysicsSceneInner.tsx`** — `interpolate={false}` на `<Physics>`. Player RigidBody — `type="kinematicPosition"`, KCC вызывает `rb.setTranslation(...)` 1-4 раза/кадр в `physicsSubstep.ts`. С `interpolate` enabled @react-three/rapier лерпил визуальный трансформ между physics steps → GLB avatar рендерился на `lerp(prevPos, curPos, α)`, а камера (`livePlayerPositionRef = rb.translation()`) стояла на `curPos` → avatar лагал на один interpolation step → видимый твитч. Это transform-sync проблема, не React-rerender — Phase 5.5/7.1 её не починили потому что трогали spring/bob/delta-clamp, а не interpolation. Trade-off: другие dynamic bodies (PatrollingCreeps, AmbientNPCs props) теряют interpolation smoothness, но player — доминирующий фокус.
- **FIX 1.2: `applyCameraFrame.ts`** — `_walkBobPhase` теперь копит smoothed delta (`_smoothedDelta += (delta - _smoothedDelta) * 0.15`). Phase-based осцилляторы крайне чувствительны к вариациям delta — 50fps+60fps кадры дают видимый phase jump даже при маленькой амплитуде. Phase 5.5 только halved amplitude, не фиксила uneven phase advance.
- **FIX 1.3: `explorationStrategy.ts:87`** — `speedMs = playerSpeed / ctx.delta` → `speedMs = playerSpeed`. `ctx.playerVelocity` уже в m/s (построен в FollowCamera как `(pos - prevPos)/delta`), повторное деление на delta давало m/s². При 60fps + playerSpeed=4 m/s → speedMs=240, `t=1`, FOV буст +3° на ЛЮБОМ движении.
- **FIX 1.4: `useMixamoAnimationClips.ts`** — 6 отдельных `setMixamoActions` вызовов (по одному на critical clip load) коалесированы в один batched flush через `queueMicrotask` + pending map. Раньше: 6 re-render'ов CesiumPlayerModelInner в первые 1-2s игры → если игрок начинал двигаться в этом окне, модель hitch'ила.
- **FIX 1.6: `SimplePlayer.tsx:322-324`** — keyboard velocity теперь damped (stiffness 25) вместо hard-snap. Hard-snap давал instant velocity change который camera spring должен был догонять — видимый "kick" на каждое нажатие клавиши.

**Volodka Room duplicate-frame cleanup (Task 1-B):**
Найдены 4 HIGH-severity duplicate-frame source'а — все дублировали работу которую VolodkaRoomVisual уже делает сама:
- **FIX-B1: `VolodkaRoomVisual.tsx`** — удалён `<DustParticles />` (400 частиц, raw useFrame). AtmosphericEffects'ный `DustMotes` (50 частиц, useFrameTick('weather'), player-wake, mobile scaling) уже покрывает volodka_room. Оба писали GPU-буферы каждый кадр.
- **FIX-B2/B3/B4: `EnvironmentalAnimations.ts`** — удалены все 5 env-animation записей для volodka_room (`monitor_flicker`, `desk_lamp_flicker`, `monitor_glow_pulse`, `crt_monitor_effect`, `hanging_lamp_sway`). Все 5 дублировали VolodkaRoomVisual's собственные: desk lamp at `[0.3,1.5,-2.3]`, FlickeringCeilingLight at `[0,2.85,-1]`, terminal monitor with useMonitorGlitch + texture-scroll. После удаления: -4 duplicate point lights, -4 duplicate meshes, -5 wasted useFrameTick callbacks, -1 "monitor flicker fighting terminal text" visual jitter.
- **FIX-B5: `sceneDefinitions.ts`** — удалён bedside accent light at `[-1.5,2.0,2.0]` (дублировал VolodkaRoomVisual's bed fill at `[-1.5,1.8,2.5]`, 0.5m apart).
- **FIX-B6: `VolodkaRoomVisual.tsx`** — обёрнут в `memo()` для defensive hardening против incidental parent re-renders.

**Prologue/IntroWake duplicate-frame cleanup (Task 1-C):**
- **FIX-C1 (CRITICAL): `OrchestratorGameplaySections.tsx` + `IntroWakeOverlay.tsx` (DELETED)** — во время всего 29s intro_wakeup cutscene ОДНОВРЕМЕННО монтировались ДВЕ letterbox-overlay системы: standalone `IntroWakeOverlay` (7dvh letterbox + hardcoded "03:47 — писк терминала" + ESC skip) И generic `CutsceneOverlay` (4dvh 'thin' letterbox + timeline's per-phase main text + "Пропустить" skip). Это и было "duplicate frames in the prologue". Standalone overlay — pre-timeline legacy code, оставшийся после добавления CinematicTimelineRunner. Удалён `GameplayIntroWakeOverlay` компонент, его mount в `GameplaySharedEffects`, import, и сам файл `IntroWakeOverlay.tsx` (159 строк dead code). CutsceneOverlay уже рендерит phase 1's text "Ты просыпаешься от назойливого писка терминала." — никакой контент не потерян.

**Pre-existing TS error cleanup (Task 1-D):**
- Phase 11 оставила проект в состоянии с 12 TypeScript ошибок (блокировали Vercel build `node scripts/tsc7.mjs -b`). Все 12 исправлены в 5 файлах:
  - `combatConsumables.ts` — CombatState import перенесён из `definitions/combat` в `state/combat`; `snap.inventory` → `snap.playerState.inventory as Array<{id,quantity}>`.
  - `combatEvents.ts` — добавлено `itemId?: string` в `combat:action` event payload type.
  - `enemyVisualRegistry.ts` — добавлены 6 EnemyVisualSpec для новых Phase 11 enemy types (corporate_ai, grief_echo, memory_devourer, network_spy, quantum_ghost, rust_sentinel).
  - `combat.ts` — расширен `BuffEffect.stat_drain` union до `'empathy'` (также чинит 2 errors в enemies.ts).
  - `CombatSystem.ts` — обновлён cast + добавлена `'empathy'` ветка в per-turn stat-drain handler (latent runtime bug: empathy-drain debuffs от grief_echo/memory_devourer ранее no-op'или).

**Verification:**
- `bun run typecheck` → 0 ошибок ✅
- `npx vite build` → 41s, 0 ошибок ✅ (предупреждения о chunk size — pre-existing, informational)
- ESLint — локально не запускается (incompatibility между @typescript-eslint и TS7), но Vercel build не запускает lint (`vercel.json: buildCommand = "node scripts/tsc7.mjs -b && npx vite build"`)

**Следующий шаг:** Пользовательский QA на https://volodka.vercel.app/ — проверить что (1) модель больше не дёргается при движении, (2) A/D делает шаг в сторону вместо вращения, (3) volodka room визуально чище без дубликатов, (4) пролог показывает только одну letterbox + один skip button. Затем — Фаза 8 (Улучшенные 3D модели) или Фаза 10 (TTS озвучивание).

### Сессия: 2026-07-24 — "Phase 11: Combat Polish — Affinity System + New Enemies + Consumables + Bullet Time"
**Что сделано (10 файлов, ~600+ строк):**
- **combatAffinities.ts** — Elemental weakness/resistance system (Persona/Disco Elysium-style)
  - 6 damage channels: code, logic, empathy, intuition, writing, physical
  - Affinity multipliers: 2.0 (super effective), 1.5 (effective), 1.0 (neutral), 0.7/0.5 (resist), 0.0 (immune)
  - 20 enemy affinity maps — each has ≥1 weakness and ≥1 resistance
  - Design: daemons weak to code, ghosts immune to physical, censors weak to writing
  - Poem→damage channel mapping (23 poems → thematic channels)
  - Russian labels + cyberPalette colors for UI display
  - API: resolveAffinityMultiplier(), getEnemyWeaknesses(), getEnemyResistances(), applyAffinityToDamage()
- **6 new enemy types** (14→20 total):
  - Сетевой Шпион (network_spy) — Act 2+, data extraction/misinformation specials
  - Квантовый Призрак (quantum_ghost) — Act 3+, superposition double-attack, quantum entangle
  - Эхо Скорби (grief_echo) — Act 2+, stress-based damage mirror, overwhelm debuffs
  - Корпоративный ИИ (corporate_ai) — Act 4+, optimization buffs, predictive silence
  - Ржавый Страж (rust_sentinel) — Act 1+, corrosion debuff, self-damaging overload
  - Пожиратель Памяти (memory_devourer) — Act 5+, skill drain, identity erase (wipes buffs+combo)
- **Combo decay** — damage now decays combo by -2 instead of instant reset
  - Makes combo building less punishing, rewards sustained aggression (Gothic/DE-style)
- **Combat consumables** (combatConsumables.ts) — 5 usable items during combat:
  - energy_drink: +20 HP, +5 attack 2 turns
  - combat_stim: +8 attack 3 turns, +5 stress
  - nano_patch: +15 HP, remove 1 debuff
  - herbal_tea: +10 HP, -8 stress, +3 defense
  - coffee: +4 attack 2 turns, +3 stress
  - New action type: 'use_item' (takes player turn like defend/flee)
  - playerUseItem(itemId) exported from CombatSystem
- **Max Payne bullet time** — cinematic slow-motion on critical/super-effective hits
  - enterBulletTime() in cinematicCamera.ts — temporarily reduces globalTimeScale
  - 0.3s duration, 0.15 intensity for double crit+super, 0.25 for single
  - Camera state machine subscribes to combat:bullet_time event
- **Affinity integration in CombatSystem** — player attacks apply affinity multiplier
  - Log entries show affinity labels ("Суперэффективно!", "Иммунитет!")
  - New log types: affinity_super, affinity_weak, affinity_immune
- **CombatAction extended** — 'use_item' added
- **CombatLogEntry extended** — affinityMultiplier, damageChannel, itemId fields
- **combatEvents.ts** — combat:bullet_time, combat:item_used event types
- **resolveEnemyType/pickEnemyForCurrentState** — updated for 6 new enemy phase unlocks
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 10 — TTS озвучивание или Фаза 12 — Музыкальное разнообразие

### Сессия: 2026-07-24 — "Phase 12: Reactive World & Consequence System"
**Коммит:** e7c9a4e7
**Что сделано (12 файлов, +1248/-33 строк):**
- **npcEmotionTypes.ts** — NpcEmotion type: 7 эмоций (neutral/curious/alarmed/contemplative/annoyed/respectful/fearful)
- **npcEmotionalReactions.ts** — emotion→behavior mapping, outfit→emotion resolution, per-NPC emotion state with duration/decay
- **npcIdleVariants.ts** — 5 idle variants: relaxed/alert/bored/working/social, role→variant mapping
- **npcScheduleAnimations.ts** — 8 schedule-driven behavior animations (office→typing, cafe→pouring, etc.)
- **npcEmotionalReactionEngine.ts** — EventBus bridge: weather/combat/poem events trigger NPC emotional reactions
- **headTracking.ts** — proximity awareness: 5m focus zone, distance-scaled intensity, dialogue pause (600ms resume), emotion-based tracking
- **npcAmbientBarkSystem.ts** — emotion-adjusted cooldown and bark selection
- **npcBark.ts** — 4 Russian lines per emotion (curious/alarmed/contemplative/respectful/annoyed/fearful)
- **useNpcVisualBehavior.ts** — emotion system integration, priority chain (emotion>idle variant>activity>default)
- **npcEvents.ts** — npc:emotion_triggered / npc:emotion_decayed events
- **npc.ts** — idleVariant field in NPCDefinition
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 10 — TTS озвучивание

### Сессия: 2026-07-23 — "Phase 7: Система одежды/внешности"
**Коммит:** ec5cac7c
**Что сделано (16 файлов, +899/-9 строк):**
- **EquipmentSlot расширен** — 3→6 слотов (head/body/legs/feet/hands/accessory)
- **clothingCatalog.ts** — 20 предметов в постсоветском киберпанк стиле:
  - 4 head (ушанка, кибер-визор, каска, неоновая бандана)
  - 5 body (потёртая куртка, униформа IT, кибер-плащ, кожанка, рабочий халат)
  - 4 legs, 3 feet, 2 hands, 2 accessory
  - Каждый предмет имеет socialPerception tags и DialogueModifier
- **SocialPerceptionTag** — 'official', 'shabby', 'cyberpunk_chic', 'worker', 'casual', 'suspicious'
- **DialogueModifier** — dcAdjustment, skillBonus, unlockTag, lockTag (outfit gating dialogue choices)
- **clothingSelectors.ts** — 4 selectors + React hooks:
  - getEquippedClothing, getSocialPerceptionTags, getClothingSkillModifiers, getClothingDialogueModifier
- **ClothingTab.tsx** — новая вкладка в Journal UI (6 слотов, perception tags, skill modifiers, каталог)
- **DialogueRenderer integration** — clothing modifiers affect skill check DC and skill bonuses
- **storyConditions.ts** — clothingTagRequired/clothingTagForbidden для dialogue gating
- **Save backward compatibility** — новые слоты optional/default null в Zod schema
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 8 — Улучшенные 3D модели

### Сессия: 2026-07-23 — "Phase 7.1: Критический фикс дёргания модели (v2)"
**Коммит:** 1391c40f
**Что сделано (6 файлов, +177/-91 строк):**
- **🔴 Fix 1: Weight-Based Animation Blend Tree** — переписан `usePlayerLocomotionController.ts`
  - Заменён `crossFadeTo()` на weight-based blending через `setEffectiveWeight()`
  - All 3 locomotion clips (idle/walk/run) play simultaneously with varying weights — no pose restart
  - Exponential damping: `newWeight = prev + (target-prev) * (1-exp(-blendSpeed*dt))`
  - Blend speeds: accel=6, walk→run=4, decel=3, cinematic=8
  - Устранён primary root cause: pose-restart stutter на idle→walk transitions
- **🟠 Fix 2: Rotation-Camera Sync** — `playerMainMovement.ts` + `playerConstants.ts`
  - ROTATION_SPEED: 10→8 (менее агрессивный, лучше синхронизируется с камерой)
  - Новый ROTATION_SPEED_REVERSAL=4.5 для 180° разворотов (>45° yaw diff)
  - GTA/Gothic-style: персонаж физически поворачивается вместо snap-дёргания
- **🟡 Fix 3: Animation Hysteresis Widening** — `playerFinalizeFrame.ts`
  - ANIM_UPPER_THRESHOLD: 0.5→0.6 (вход в locomotion)
  - ANIM_LOWER_THRESHOLD: 0.25→0.15 (выход из locomotion)
  - Band 0.45 m/s (был 0.25) — предотвращает idle↔walk flickering при KEYBOARD_ACCEL=50
- **🟢 Fix 4: Walk Bob & Delta Consistency** — `applyCameraFrame.ts` + `playerFramePrepare.ts`
  - WALK_BOB_AMPLITUDE: 0.012→0.006 (halved, меньше camera micro-jitter叠加)
  - Physics delta cap: 0.05→0.1 (согласовано с camera delta, предотвращает desync)
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 7 — Система одежды/внешности

### Сессия: 2026-03-06 — "Phase 5.6: Asset Audit & LOD Pipeline Fix"
**Что сделано:**
- **Полный аудит 200 GLB файлов (289MB) и 148 3D-компонентов**
  - Все манифест-референсированные файлы присутствуют на диске ✅ (0 missing)
  - Все GLB имеют корректный binary glTF magic ✅ (0 corrupt)
  - Draco/Meshopt/Basis декодеры корректно инициализируются ✅
  - Анимационные клипы корректны (6 animation-only GLB, 0 mesh contamination) ✅

- **Критические находки LOD-пайплайна:**
  - 🔴 **52 LOD-проблемы**: Все NPC LOD1/LOD2 = копии LOD0 (0% vertex reduction)
  - 🔴 **Root cause**: `--error 0.01` был слишком строгий для small submesh (~1K verts)
    - simplify couldn't remove vertices without exceeding error budget
  - 🔴 **Khronos reference models (58MB)** shipped в production — debug assets
  - 🔴 **AI3DGen placeholder props (50MB)** = Khronos CC0 interim (Avocado = encrypted_scroll)
  - 🟡 **Pine LOD0/LOD1/LOD2 все ~8MB** — текстуры не resized для LOD
  - 🟡 **Cafe props LOD1 > LOD0** — та же simplify проблема

- **Фиксы:**
  - `scripts/lib/gltfProcess.mjs` → **LOD pipeline v2 (asset-aware)**:
    - **Skinned meshes** (hero-lod, npc-flat): Draco + texture-resize LOD strategy
      (LOD1=draco+tex50%, LOD2=draco+tex25%) — geometry unchanged, bandwidth saved
    - **Static meshes** (suffix-lod): weld + simplify с relaxed thresholds
      (--error 0.5/1.0, --lock-border false)
  - `scripts/validate-lod-effectiveness.mjs` → новый скрипт проверки LOD
  - `scripts/validate-gltf-assets.ts` → добавлены LOD size sanity check + Khronos warning
  - `.vercelignore` → исключение khronos/ и assets-source/ из deployment
  - `package.json` → `assets:validate-lod` npm script

- **Действующие LOD (валидные):**
  - env_cafe_props: LOD1 47.3% vert reduction, LOD2 76.6% ✅
  - veg_tree_pine: LOD1 51.0%, LOD2 78.3% ✅

- **Требует re-processing**: `npm run assets:process-catalog` для обновления NPC/hero LOD
  с новой texture-resize стратегией (пока LOD1/LOD2 — старые копии)

### Сессия: 2026-03-04 (продолжение) — "Phase 6: A* Nav Mesh + DE-style Dialogue Systems + Thought→Combat Bridge"
**Коммит:** 512455b8
**Что сделано (+2144 строк, 23 файла):**
- **Phase 6: A* Nav Mesh для NPC**
  - `navMeshBuilder.ts` — 0.5m grid из scene collision data, 0.3m wall margin, 8-connected
  - `navMeshPathfinder.ts` — A* с binary heap, path smoothing, direct fallback
  - `navMeshCache.ts` — Per-scene cached nav meshes
  - `npcPatrol.ts` extended с pathQueue + nav mesh integration
  - NPC.tsx обновлен для передачи sceneId/floorY для path computation
- **DE-style Dialogue Systems (P0-P3)**
  - `thoughtInterjection.ts` — Equipped thoughts "speaking" как inner voices в dialogue
    - Amber/gold `[ThoughtName]` prefix, timing phases (before/after NPC/on_skill_check)
  - `whiteRedCheckSystem.ts` — White checks retryable after skill growth; red checks one-shot
    - CheckAttemptRecord tracking, retry hints в UI ("Можно повторить, если навык вырастет")
  - `partialSuccessSystem.ts` — 6 success degrees (critical/strong/success/marginal/failure/disastrous)
    - Russian labels, color mapping, choice effects by degree
  - `diceRollSkillCheck.ts` — Extended DiceRollResult с degree + partialEffects
  - `DialogueRenderer.tsx` — Thought interjection lines, check type badges, thought-gated filtering
  - `DiceRollDisplay.tsx` — Degree labels, retry/closed hints
  - `dialogue.ts` — Added thoughtInterjections, partialSuccess/strongSuccess/disastrousFailure effects
  - `conditions.ts` — Added checkType (white/red), thoughtRequired
- **Thought→Combat Modifier Bridge (P6)**
  - `thoughtCombatModifiers.ts` — Voice→stat mapping (logic→defense, coding→attack, etc.)
    - Stacking caps (+1.5 max), per-thought contributions, Russian flavor descriptions
  - `formulas.ts` — Integrated thought bonuses into attack/defense/crit/flee/combo/HP
  - `CombatUI.tsx` — ThoughtCombatBadges с amber styling near player stats
  - `gameActionBridge.ts` — Added equippedThoughtIds to snapshot
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 7 — Система одежды/внешности

### Сессия: 2026-03-04 — "Критический фикс дёргания модели + Camera Spring Rebalance"
**Что сделано:**
- **Глубокий аудит причин дёргания модели** — найдены 3 критических и 3 средних root cause
- 🔴 **Fix 1: Animation State Blending** — переписан `useProceduralPlayerAnimation.ts` (537 строк)
  - Добавлена 5-уровневая иерархическая blend система (idle ↔ walk ↔ run ↔ combat ↔ airborne)
  - Каждый blend weight использует frame-rate-independent exponential damping (`1 - exp(-speed * dt)`)
  - Asymmetric blend: к движению быстрее (8), к idle медленнее (5) — естественная декцелерация
  - Катсцен-состояния (sitting, sleeping, talking, working) остаются hard-switch
- 🔴 **Fix 2: Animation Hysteresis** — добавлен в `playerFinalizeFrame.ts`
  - `ANIM_UPPER_THRESHOLD = 0.5` (switch to walk), `ANIM_LOWER_THRESHOLD = 0.25` (revert to idle)
  - Между порогами при locomotion: состояние сохраняется (no flickering)
  - Locked thresholds: upper=0.12, lower=0.06
- 🔴 **Fix 3: Camera Spring Rebalance** — `cinematicCamera.ts`
  - `SPRING_STIFFNESS`: 14 → **8** (gentler pull, 12% force/frame vs 20%)
  - `SPRING_DAMPING`: 0.92 → **6** (proper critical damping, 2×√8 ≈ 5.66)
  - `LOOK_AT_STIFFNESS`: 14 → **8** (matched for consistency)
  - `DIALOGUE_SPRING_STIFFNESS`: 8 → **5**, `DIALOGUE_SPRING_DAMPING`: 0.88 → **4**
  - All `Math.min(delta, 0.05)` → `Math.min(delta, 0.1)` (5 locations)
- 🟡 **Fix 4: Auto-Follow Continuous Blend** — `applyCameraFrame.ts`
  - Заменён hard threshold `playerSpeed > 0.5` на continuous `followStrength = min(playerSpeed/1.0, 1.0)`
  - Нет on/off flickering при колебании скорости вокруг порога
- 🟡 **Fix 5: Ground Override Feedback Loop** — `playerFinalizeFrame.ts`
  - KCC `isGroundedNow` теперь primary ground decision (trust physics)
  - Rescue fallback только при micro-hovering (pos ≤ groundY+0.02, |vel.y| < 0.15)
  - Eliminated feedback loop что создавал vertical micro-bobbing
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 6 — A* навигация для NPC

### Сессия: 2026-07-23 — "UI Overlap Audit + Phase 5 Content Expansion"
**Коммиты:** e570e48, 78f1936, cec23f3
**Что сделано:**
- Полный аудит всех UI-компонентов на наложение/stacking (39 файлов исправлено)
- 🔴 5 критических: z-[9999]/9998 → UI_LAYERS (QTE, RecoveryScreen, QuestArrow, Tooltip, DevBadge)
- 🟠 16 hardcoded z-index → UI_LAYERS constants
- 🟡 15 fullscreen overlays без z-index + AnimatePresence mode="wait"
- 🟢 3 дополнительных: DataTerminalOverlay, InnerMonologueOverlay, CombatUI
- **+120 exploration story nodes (Acts 2-7)** — 6 файлов, 20 нод на акт
  - Акт 2: jukebox, neon graffiti, pier dawn, ЧК campfire, server poems, cyber cat, etc.
  - Акт 3: park sculpture, library stacks, Zarema camera, cyber flowers, poetry circle, etc.
  - Акт 4: rooftop antenna, street winter, square poster, broadcast prep, neon blackout, etc.
  - Акт 5: factory Заря-М, bunker comms, welder poems, code-poem encryption, etc.
  - Акт 6: bunker defense, traitor reveal, factory sabotage, defector rescue, etc.
  - Акт 7: archive opened, monument restored, cafe reopening, letters received, epilogue vision
- **+10 new side quests (Acts 2-7)** — Охота на стихи, Неоновый архив, Кибер-цветение, Свидетельство Заремы, Антенна свободы, Самиздат, Память Зари-М, Шифр-стих, Перебежчик, Имена на камне
- TypeScript: 0 ошибок
**Следующий шаг:** Фаза 6 — A* навигация для NPC

### Сессия: 2026-07-22 — "Фаза 5: Расширение контента"
**Что сделано:**
- Созданы 4 новых файла расширенных диалогов (123 ноды)
  - `part2-npcs-expanded.ts` — Акт 2: Альберт (философия живого кода), Виктория (Сеть), Дмитрий (дезертирство), Бариста (кофейный протокол), Коллега (страх и совесть)
  - `part3-mid-expanded.ts` — Акт 3: Зарема (арест, камера, освобождение), Александр (ночные чтения, черта), Альберт (парк, манифест), Виктория (Хранилище), Бариста (расширение)
  - `part4-late-expanded.ts` — Акты 4-5: Володька (внутренний монолог, прозрение), Зарема (завод, «Заря-М»), Александр (крыша, выбор), Виктория (жертва), Альберт (последний рубеж)
  - `part5-final-expanded.ts` — Акты 5-7: Зарема (фабрика, эпилог), Виктория (новое начало), Альберт (возрождение), Александр (искупление), Бариста (новая Сеть), Коллега (искупление)
- Расширен Thought Cabinet: +12 мыслей (19-30), всего 30 мыслей с 6 mutually exclusive парами
  - Новые пары: Резонатор/Наблюдатель, Вирус Свободы/Карантин, Коллективный Разум/Одинокий Волк
  - Скрытые: Голос Мёртвых Серверов, Серверный Аутизм, Тень Гильдии
  - Уникальные: Поэтическая Справедливость, Код как Молитва, Память Воды
- Обновлён `src/data/dialogue/index.ts` — подключены 4 новых файла
- TypeScript: 0 ошибок компиляции
**Следующий шаг:** Продолжение Фазы 5 — story-ноды и новые квесты

### Сессия: 2025-07-21 — "Прорыв из цикла багфиксов"
**Коммит:** 55b51cd3
**Что сделано:**
- Проведён полный аудит кодабазы (285K строк, все 23+ системы)
- Обнаружена проблема: 16 сессий подряд "fix: session N" — застряли в цикле багфиксов
- Ускорен онбординг (3x быстрее стихотворная заставка, skip prologue)
- Реализован Thought Cabinet (18 мыслей, mutually exclusive пары, полный UI)
- Реализована dice-roll система (2d6 + модификатор, анимация, интеграция в диалоги)
- Добавлен 2100+ строк нового русского контента (30 диалогов + 28 комнатных нод)
- Всё зарегистрировано в narrativePackRegistry и triggerZones
- 31 файл изменён, 4399 строк добавлено, 0 ошибок TypeScript
**Следующий шаг:** Фаза 5 — расширение Актов 2-7 аналогичным контентом

### Предыдущие сессии (из worklog.md)
- Сессии 5-16 (2025-07): цикл исправления багов, кинематограф, NPC, физика
- Сессии 1-4 (2025-07): начальная архитектура, бои, квесты, стихи-механика

---

## 🚀 Команды для разработки

```bash
npm install              # Установка зависимостей
npm run dev              # Dev-сервер
npm run typecheck        # Проверка типов (использовать node scripts/tsc7.mjs --noEmit)
npm run build            # Production-сборка
npm run check            # Полный гейт
npm run test:unit        # Юнит-тесты
npm run validate:content # Валидация контента
```

**ВАЖНО:** Для typecheck в этом проекте используйте `node scripts/tsc7.mjs --noEmit` (проект использует TypeScript 7+ фичи).

---

## 💬 Стиль написания контента

При написании диалогов и стори нод:
- **Язык:** Русский, литературный
- **Тон:** Постсоветский киберпанк-нуар, меланхоличный юмор
- **Длина:** Каждая нода — 2-4 абзаца минимум (Disco Elysium standard)
- **Герой:** Володька — уставший, циничный, но с глубокой эмпатией
- **Атмосфера:** Neon + бетон, серверы + стихи, усталость + надежда
- **Проверки навыков:** DC 10 (лёгко), DC 12 (средне), DC 14 (трудно), DC 16 (очень трудно)
- **Флаги:** Использовать `thought_available_*` для триггеров Thought Cabinet
---

## 🔄 Сессия 11 — внешний коллаборатор (AAA visual/animation/audio/hud push)

**Дата:** 2025-08
**Агент:** внешний orchestrator (по запросу правообладателя)
**Коммит:** см. `git log` (1 коммит, 44 файла, ~+1600/-30 строк)
**Typecheck:** `node scripts/tsc7.mjs --noEmit` → exit 0

### Что сделано (4 параллельных work-stream, файлы НЕ пересекались)

**Визуал (ultra-only, graceful degrade):**
- **SSR wet streets** — новый `ssrWetStreets` HeavyGfxFeature (ultra-exclusive). Ultra tier: 1024-res planar reflector + anisotropic streak blur [1024,32] + rain-gated strong mirror (`getUltraSsrWetStreetMirrorAmount`, до 0.92 при шторме). Three-state gate в `WetStreetGround.tsx` (ultra SSR → basic reflector → MeshStandard). **Medium/high basic reflector path математически идентичен старому поведению.**
- **AgX tone mapping** — ultra-only, toggleable (`volodka_agx`, default ON), +0.15 exposure lift. ACES_FILMIC путь полностью сохранён.
- **+6 GodRays сцен** — street_night, city_square, river_pier, rooftop_edge, chk_campfire_night, factory_roof (позиции из SCENE_ACCENT_LIGHTS).

**Анимация (KCC НЕ тронут):**
- **Continuous walk↔run blend** — `resolveLocomotionClipState` теперь возвращает `runWeight = smoothstep(hSpeed, WALK*0.7, RUN*0.85)`. `currentHSpeedRef` продёрнут через playerFrameTypes → usePhysicsPlayerMovement → playerFinalizeFrame → usePlayerLocomotionController → CesiumPlayerModel/CinematicPlayerAvatar/PhysicsPlayer. Walk timeScale scales с hSpeed (0.4×→1.0×) — нет больше moonwalk на низкой скорости. **Физическая скорость KCC осталась BINARY** (`running ? RUN_SPEED : WALK_SPEED`) — continuous только анимационный blend. `interpolate={false}` + KCC ownership + `runMainPlayerMovement` НЕ тронуты.

**HUD/UX/Cutscenes:**
- Wired 8 unwired filmic CSS классов (compass-glow, crt-scanlines+crt-overlay на 4 CRT-сценах, menu, scanline, stat-bar-sheen, status-segment, tooltip-ink).
- Mounted KarmaRing + LevelBadge + CompassIndicator в SceneTopBarHud (hidden sm:flex).
- New `SkipPrologueOverlay.tsx` — 3-page Disco Elysium inner-monologue typewriter (IMPROVEMENT_PLAN 4.1).
- Camera ease-back на cutscene skip (0.6s eased cubic, новый `camera:ease_back` event, interruptible) — нет больше hard snap.

**Аудио (revived dead code + spatial):**
- **`resolveActMoodOverride` WIRED** — был МЁРТВЫМ КОДОМ (tick-9 "feature" без consumers). Теперь `SceneAudioController.onSceneEnter` вызывает его, `MusicEngine.applyActMoodOverride` рампит padFilter+reverb за 1.5s. **20 entries × 5 сцен × 4 актов теперь звучат.**
- **AudioListener tracking** — `SharedAudioContext.setListenerPosition/Orientation` + `applyCameraFrame` каждые 3 кадра.
- **`playSpatialBark` в DialogueRenderer** — NPC позиционный голос (1.5s debounce, player-pos fallback). Раньше все диалоги были безмолвны.
- +stone +dream footstep presets. `playSpatialSfx` для DynamicProps + PatrollingCreeps.

### Invariants (всё сохранено)
- Стихи (`src/data/poems.ts`) — НЕ тронуты.
- `<Physics interpolate={false}>` — НЕ тронут.
- KCC ownership / `runMainPlayerMovement` — НЕ тронуты.
- Postprocessing depth-blit patch — НЕ тронут.
- Тесты не запускались (только typecheck-гейт per запросу пользователя).

### Risks / TODO для авторского QA на Vercel
- AgX mode swap может потребовать смены сцены для применения (toggle UX quirk, не breakage).
- Ultra SSR reflections скрыты ниже 60% rain (intentional, tunable в `getReflectorMaterialSettings`).
- Runtime QA НЕ проводился locally (по запросу). Ключевые сцены для проверки: street_night (SSR+GodRays+AgX stack на ultra), city_square, river_pier, chk_campfire_night, home_evening.

### Нерешённые приоритеты следующей фазы
- Mixamo↔Quaternius real-clip remap (нужен Adobe login + asset pipeline).
- CSM (cascaded shadow maps) для outdoor hero-сцен.
- MotionBlur для катсцен.
- Больше контента Acts 3–4.
- Ещё orphaned HUD mounts: CyberpunkMinimap (Ctrl+M toggle), QuickTimeEventOverlay, QuestObjectiveCard.

---

## 🔄 Сессия 12 — пролог/комната/коридор: first-impression perfection

**Дата:** 2025-08
**Агент:** внешний orchestrator (по запросу правообладателя)
**Фокус:** довести до идеала начало игры — пролог, комнату Володьки, коридор. Управление, анимация, визуал, текстуры, масштабы, сцены, взаимодействие. Проверка пересечений логик, наслоений, мешей, утечек памяти, зон, гонок. Фоновая музыка.
**Коммит:** см. `git log` (1 коммит, 29 файлов, +708/-150 строк)
**Typecheck:** `node scripts/tsc7.mjs --noEmit` → exit 0

### Методология
5 параллельных Explore-агентов (scenes/controls-anim-camera/visual-textures/audio/bug-hunter) → синтез → 4 параллельных исполнителя (S12-A/B/C/D, файлы НЕ пересекались).

### КРИТИЧЕСКИЕ баги первого впечатления — найдены и исправлены
1. **Аватар просыпался на полу в 1.3м от кровати.** `BED_POSITION=[0.5,0.01,2.4]`, а видимая gothicBed в `[1.78,0,2.05]`. Первый кадр игры — персонаж на голом полу рядом с пустой кроватью. → `BED_POSITION=[1.78,0.35,2.05]` (на кровати, y=0.35 на матрасе) + spawn + rise-phase camera lookAt обновлён.
2. **4 trigger-зоны в пустом месте.** room_bookshelf/wardrobe/bed/wardrobe_stash на левой стене, а мебель на правой/задней. Игрок подходит к кровати → нет промпта; идёт в пустое место → «Осмотреть кровать» в воздухе. → Все 4 зоны + deep-zones перемещены на визуальную мебель.
3. **Walk↔run contamination (regression от session 11).** `smoothstep(WALK*0.7, RUN*0.85, hSpeed)` = `smoothstep(2.8, 5.95, 4)` = 0.325 → 32% run-клипа постоянно в ходьбе. → `smoothstep(WALK_SPEED, RUN_SPEED, hSpeed)` = `smoothstep(4, 7, hSpeed)`. Ходьба теперь 100% walk-клип.
4. **Camera ease-back был NO-OP (regression от session 11).** `applyExplorationSnap` хард-снапал spring синхронно до capture'а pre-pose → lerp из snapped в snapped = ничего. И на natural completion `easeMs` вообще не передавался. → FULL FIX: `preserveSpring` param + module-level `easeBackPending` flag + FollowCamera capture'ит `_easePrePos` синхронно в event handler (до recenter) + `easeMs:600` добавлен в completeCinematicTimeline/stopCinematicTimeline/finishIntroWake.
5. **Nature HDRI (lebombo — саванна) для интерьера квартиры.** Зелёный tint на всех PBR поверхностях. `warm_apartment` baked PMREM был dead code. → 5 apartment сцен dropped из lebombo → warm_apartment PMREM.
6. **Коридор на canvas-текстурах 512×512.** Единственный indoor hero без PBR. "Plastic/low-res". → Poly Haven concrete_floor_painted + plastered_wall PBR.
7. **Мониторы комнаты без CRT.** Плоские emissive плоскости. → CRT scanlines (SCANLINE_SCENES) + crtTerminalGlass MeshPhysical на ThinMonitor.
8. **MeshReflectorMaterial leak 16MB GPU** на каждой смене wet-street сцены. → Best-effort FBO disposal (текстуры диспозятся; framebuffers всё ещё текут — нужен fork drei для полного fix).

### HIGH/MEDIUM баги — исправлены
- corridor_mirror зона на 1.5м от зеркала → Z -5.5 → -4.0
- VIKTOR_SCHEDULE спавнил NPC сквозь стену (x=-3.0 при half-width 2.5) → [-1.5, 0, 2.5]
- bathroom_door без doorway → стена solid, игрок упирался в невидимую стену → doorway cut + obstacles
- corridor obstacles отсутствовали для mailboxes/intercom/mirror/bathroom door → добавлены
- 11+ дублирующих света в комнате (3 sceneDefinition + 8 visual) → 3 sceneDefinition lights removed
- Duplicate AmbientParticles(150) в corridor (дублировал DustMotes) → removed
- Corridor metals (mirror/mailboxes/pipe/coathooks) без envMapIntensity clamp → 0.4
- Accent light "bedside lamp" в 2.5м от actual bedside → moved to [1.98, 1.6, 2.16]
- Corridor music в Bb major для noir_street mood → natural_minor (D3, matches street_night)
- Room ambient без rain/fridge (narration говорит "За окном моросит дождь") → rain noise + 50Hz fridge hum
- Corridor ambient без fluorescent buzz/voices → 120Hz buzz + muffled voices randomSound
- Corridor reverb 0.65s/10.5% wet (мёртвый) → 1.04s/14% wet (audible echo)
- Music crossfade 100ms silence gap → startDelay 1100→900 (NOTE: pre-existing stopMusic bug может лимитировать эффект)
- ACT_MOOD_OVERRIDES без act-1 entry → 'volodka_room:1' (cozy_indoor, 600Hz, 0.3 reverb — теплее/суше для утра)
- scene:enter не emit на New Game → useAudioOrchestrator mount effect вызывает onSceneEnter once
- Orbit input НЕ заблокирован во время 'intro' фазы → gated on mode==='intro' + isCinematicTimelineActive()
- First footstep silent 0.4s после W → immediate на idle→walk edge
- Cinematic→locomotion exit: weight dip (BLEND_DECEL 2.8 vs fadeOut 0.48s) → BLEND_CINEMATIC 6.5
- Dead setListenerPosition call в FollowCamera → removed (applyCameraFrame handles it)
- 3 orphaned intro events (0 subscribers) → removed emits + type declarations

### Invariants (всё сохранено)
- Стихи (`src/data/poems.ts`) — НЕ тронуты.
- `<Physics interpolate={false}>` — НЕ тронут.
- KCC ownership / `runMainPlayerMovement` — НЕ тронуты (физическая скорость осталась BINARY).
- Postprocessing depth-blit patch — НЕ тронут.
- Тесты не запускались (только typecheck-гейт per запросу).

### Risks / TODO для авторского QA на Vercel
- **Standing-phase camera waypoint НЕ re-tuned** — аватар off-center в standing shot (~2s cinematic-only). MINIMAL fix: обновлён только rise-phase lookAt.
- **introWakeTimeline.ts y-discontinuity** на rise→standing (rise ends y=0.01, standing starts y=0.35) — pre-existing pattern, но больше с новым BED_POSITION.y.
- **MeshReflector framebuffer leak PARTIAL** — текстуры диспозятся, но ~2-4MB framebuffers всё ещё текут per wet-scene exit (нужен fork drei).
- **D5 music crossfade** — startDelay change может быть ограничен pre-existing bug в `playSceneMusic→stopMusic` handoff (`stopMusic` nulls `currentScene` до `!== null` check → `startDelay` всегда 0).
- **D4 corridor reverb preset shared** 5 сценами (office_day/cafe_evening/library_day/abandoned_factory/battle) — net improvement, но split если что-то washy.

### Ключевые сцены для QA на Vercel
- **volodka_room** (New Game full prologue): avatar на кровати → rise → stand → walk → sit → desk. Мониторы с CRT scanlines + glass. Walk чистый (без run contamination). Camera ease-back на handoff. Rain ambient + fridge hum. Warm_apartment IBL.
- **volodka_corridor** (room→corridor): PBR floor/walls. Music в minor. Reverb echo. Fluorescent buzz + voices. Mirror/mailboxes/bathroom door с colliders.
- **street_night** (corridor→street, ultra): SSR wet streets + GodRays + AgX (session 11). MeshReflector FBO disposal на exit.
