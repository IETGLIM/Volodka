# AI Session Context — ВОЛОДЬКА RPG

> **ЭТОТ ФАЙЛ — КЛЮЧЕВОЙ ДОКУМЕНТ ДЛЯ НЕПРЕРЫВНОСТИ РАЗРАБОТКИ.**
> Каждый AI-агент ДОЛЖЕН прочитать его перед началом работы.
> После каждой сессии — ОБНОВИТЬ этот файл.

---

## 📌 Краткое резюме проекта

**ВОЛОДЬКА** — браузерная 3D RPG (285K+ строк кода, 1701 файл, 304MB ассетов).
Киберпанк-нуар о Володьке — уставшем IT-инженере в постсоветском городе,
который находит стихи в серверном коде и обнаруживает, что слова меняют реальность.

**Автор стихов:** Владимир Лебедев (правообладатель). Стихи НЕEDITABLE.
**Версия:** v4.4.0
**Деплой:** https://volodka.vercel.app/
**Стек:** React 19 + Vite 6 + Three.js 0.172 + R3F 9 + Rapier 2.2 + Zustand 5 + Tailwind 4

---

## 🎯 Видение проекта

Цель: создать диско-элизиумоподобную RPG в киберпанк постсоветском пространстве.
Вдохновение: Disco Elysium (нарративная глубина, проверки навыков, внутренние голоса),
Gothic (живой мир, NPC расписания), GTA (открытые пространства), Max Payne (кинематографичность).

Ключевые принципы:
1. Стихи Владимира Лебедева — священный контент, никогда не менять
2. Постсоветская киберпанк эстетика во всём
3. Глубокий нарратив — каждая проверка навыков, каждый диалог имеет вес
4. Thought Cabinet — внутренние голоса как в Disco Elysium
5. Dice-roll механика — случайность в проверках навыков
6. 120+ часов контента (целевой масштаб)

---

## 📊 Текущее состояние систем

### Полностью реализованные системы (✅)
- 3D рендеринг (R3F, пост-обработка, LOD, адаптивное качество)
- Физика (Rapier KCC, коллизии, стелс с конусами зрения)
- Камера от 3-го лица (пружинная система, 7 стратегий, кинематограф)
- Движение игрока (WASD, спринт, прыжок, coyote time)
- 7 актов + эпилог, 6+ концовок, 116-node golden path
- 18+ стихов как механика игры (poem powers, synergies, combat abilities)
- Диалоги с проверками навыков и dice-roll анимацией
- 55 квестов с зависимостями, таймерами, ежедневными миссиями
- Пошаговый бой (11 типов врагов, комбо, баффы/дебаффы)
- Стелс/патрули (FSM, конусы зрения, погоня)
- 12+ NPC (диалоги, расписания, отношения, LOD, баки)
- 27 сцен (18 core + 9 extension)
- Процедурный звук (Web Audio, 0 аудиофайлов)
- Погода (5 типов с геймплеевыми эффектами)
- Инвентарь, крафтинг, торговля
- Дерево навыков (45 узлов), перки (28)
- Система сохранений (Zod, миграции, автовосстановление)
- 4 миниигры (хакинг, стихосложение, память, терминал)
- HUD (50+ компонентов), журнал (5 вкладок + Thought Cabinet)
- Адаптивное качество, GPU probe, graceful degradation
- Accessibility (субтитры, reduced motion, дальтонизм)

### Новые системы (добавлены в v4.3.0)
- **Thought Cabinet** — 30 мыслей, 6 mutually exclusive пар, макс. 3 экипированных
- **Dice-Roll Skill Checks** — 2d6 + модификатор vs DC, криты, анимация
- **Расширенный контент Акта 1** — 30 нод диалога с Альбертом, 28 нод комнаты

### Новые системы (добавлены в v4.4.0)
- **Расширенные диалоги Актов 2-7** — 123 новых ноды диалога
- **Thought Cabinet расширен** — 12 новых мыслей (всего 30), 3 новых mutually exclusive пары
- **Глубокие NPC-арки** — Дмитрий (дезертир), Александр (искупление), Зарема (камера-освобождение)

### Нуждающиеся в доработке (⚠️)
- Навигационная сетка (A*) — NPC используют waypoint patrols, не A*
- Озвучивание — весь текст, диалоги без голоса
- Локализация — только русский
- Количество контента — для 120+ часов нужно значительно больше текста
- Качество 3D моделей — CC0/Quaternius, не AAA

---

## 📁 Ключевые файлы и их назначение

### Данные и контент
| Файл | Назначение |
|------|-----------|
| `src/data/poems.ts` | **НЕ РЕДАКТИРОВАТЬ** — стихи Владимира Лебедева |
| `src/data/thoughtCabinet.ts` | Определения 30 мыслей для Thought Cabinet |
| `src/data/dialogue/part1-albert-expanded.ts` | Расширенный диалог с Альбертом (30 нод) |
| `src/data/story/act1-room-expanded.ts` | Интерактивные ноды комнаты (28 нод) |
| `src/data/dialogue/part1-albert.ts` | Основной диалог Акта 1 |
| `src/data/dialogue/part2-npcs.ts` — `part5-final.ts` | Диалоги Актов 2-5 |
| `src/data/dialogue/part2-npcs-expanded.ts` | Расширенные диалоги Акта 2 (33 ноды) |
| `src/data/dialogue/part3-mid-expanded.ts` | Расширенные диалоги Акта 3 (30 нод) |
| `src/data/dialogue/part4-late-expanded.ts` | Расширенные диалоги Актов 4-5 (30 нод) |
| `src/data/dialogue/part5-final-expanded.ts` | Расширенные диалоги Актов 5-7 (30 нод) |
| `src/data/story/act1.ts` — `act7.ts` | Стори ноды всех актов |
| `src/data/quests/` | Все квесты (55+) |
| `src/data/npc/npcDefinitions.ts` | Определения NPC (12+) |

### Движок и механики
| Файл | Назначение |
|------|-----------|
| `src/engine/skillCheck/diceRollSkillCheck.ts` | Dice-roll система (2d6) |
| `src/engine/combat/CombatSystem.ts` | Пошаговый бой (оркестратор) |
| `src/engine/combat/combatAffinities.ts` | **Phase 11** — Elemental weakness/resistance system |
| `src/engine/combat/combatConsumables.ts` | **Phase 11** — Combat consumable items (5 items) |
| `src/engine/combat/enemies.ts` | Enemy templates (20 types) + special attacks |
| `src/engine/combat/formulas.ts` | Damage formulas, player stats, cooldowns |
| `src/engine/narrative/` | Система нарратива |
| `src/engine/camera/cinematicCamera.ts` | Камера, spring, bullet time |
| `src/engine/audio/` | Процедурный звук |

### Store
| Файл | Назначение |
|------|-----------|
| `src/store/slices/thoughtCabinetSlice.ts` | Thought Cabinet стор |
| `src/store/slices/playerSlice.ts` | Композитный плеер-слайс |
| `src/store/selectors/thoughtCabinetSelectors.ts` | Селекторы Thought Cabinet |
| `src/store/gameStore.ts` | Фасад всех сторов |

### UI
| Файл | Назначение |
|------|-----------|
| `src/components/game/journal/ThoughtCabinetTab.tsx` | UI Кабинета Мыслей |
| `src/components/game/dialogue/DiceRollDisplay.tsx` | Анимация броска кубиков |
| `src/components/game/DialogueRenderer.tsx` | Рендерер диалогов |
| `src/components/game/journal/JournalPanel.tsx` | Журнал (все вкладки) |

---

## 🔧 Архитектурные правила (КРИТИЧНО)

1. **`src/data/poems.ts` — НЕВОСПОЛНИМО. Никогда не редактировать.**
2. Store и Engine НЕ импортируют друг друга напрямую (ESLint rule)
3. Все мутации состояния — через `dispatchGameAction()` / `applyGameAction()`
4. Новый контент = новые файлы данных, не модификация существующих
5. Нарратив открывается ТОЛЬКО через `presentNarrativeBeat()`
6. `npm run check` перед каждым коммитом (lint + tsc + validate + build + budgets)
7. TypeScript strict mode, 0 ошибок обязательно

---

## 🗺️ Дорожная карта (ROADMAP)

### ✅ Выполнено
- [x] Фаза 1: Ускоренный онбординг (90с → 30с, skip prologue)
- [x] Фаза 2: Thought Cabinet (18 мыслей, mutually exclusive пары, UI)
- [x] Фаза 3: Dice-roll проверки навыков (2d6, анимация, интеграция)
- [x] Фаза 4: Расширение контента Акта 1 (30 диалогов + 28 комнатных нод)
- [x] **Фаза 5 (частично): Расширение Актов 2-7** — 123 новых ноды диалога
  - Акт 2: 33 ноды (Альберт 8, Виктория 7, Дмитрий 6, Бариста 6, Коллега 6)
  - Акт 3: 30 нод (Зарема 8, Александр 7, Альберт 5, Виктория 5, Бариста 5)
  - Акты 4-5: 30 нод (Володька 6, Зарема 5, Александр 5, Виктория 4, Альберт 5+5)
  - Акты 5-7: 30 нод (Зарема 5, Виктория 5, Альберт 5, Александр 5, Бариста 5, Коллега 5)
  - Thought Cabinet: +12 мыслей (всего 30), +3 mutually exclusive пары (всего 6)
  - TypeScript: 0 ошибок

### 🔄 Следующие шаги (приоритет по убыванию)
- [x] **Фаза 5 (продолжение): Расширение story-нод Актов 2-7** — +120 exploration nodes (20 per act)
- [x] **Фаза 5 (продолжение): Новые квесты Актов 2-7** — 10 дополнительных побочных квестов
- [x] **Фаза 5.5: Критический фикс дёргания модели** — animation blending, camera spring rebalance, hysteresis
- [x] **Фаза 5.6: Asset Audit & LOD Pipeline Fix** — mesh validation, LOD effectiveness analysis, pipeline v2
- [x] **Фаза 6: A* навигация для NPC** — nav mesh builder, A* pathfinder, path smoothing, npcPatrol integration
- [x] **Фаза 6.5: DE-style dialogue systems** — thought interjection, white/red checks, partial success, thought-gated choices
- [x] **Фаза 6.6: Thought→Combat bridge** — equipped thoughts affect attack/defense/crit/flee/combo/HP
- [x] **Фаза 7.1: Критический фикс дёргания модели (v2)** — weight-based blend tree, rotation reversal, hysteresis widening, walk bob reduction
- [x] **Фаза 7: Система одежды/внешности** — 6 слотов, 20 предметов, social perception tags, DialogueModifier, ClothingTab UI
- [ ] **Фаза 8: Улучшенные 3D модели** — AI3DGen для ключевых NPC и окружения
- [x] **Фаза 9.1: NPC эмоциональные реакции** — 7 эмоций, idle variants, proximity awareness, EventBus bridge, emotion-linked barks
- [ ] **Фаза 10: TTS озвучивание** — ключевые сцены и диалоги
- [x] **Фаза 11: Полировка боевой системы** — affinity system, 6 new enemies (20 total), combo decay, combat consumables, bullet time
- [ ] **Фаза 12: Музыкальное разнообразие** — уникальные темы для каждого акта
- [ ] **Фаза 13: Мобильная оптимизация** — touch-контроли, виртуальный джойстик
- [ ] **Фаза 14: Балансировка** — сложность, экономика, квестовая прогрессия
- [ ] **Фаза 15: Финальная полировка** — QA, оптимизация, багфикс

---

## 📝 История сессий

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

### Сессия: 2026-07-23 — "Phase 9.1: NPC Emotional Reactions & Ambient Behaviors"
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