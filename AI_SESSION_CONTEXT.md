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