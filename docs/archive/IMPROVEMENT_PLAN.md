# Volodka RPG — План поэтапных улучшений

> **Проект:** Personal 3D RPG об IT-поддержке и стихах пользователя. Post-Soviet cyberpunk в духе Disco Elysium.
> **Стек:** Vite + React 19 + Three.js + R3F + Rapier + Zustand 5
> **Масштаб:** ~285K строк, ~2197 файлов, 306 тестов
> **Репозиторий:** [github.com/IETGLIM/Volodka](https://github.com/IETGLIM/Volodka)
> **Назначение:** Семейное использование

---

## Фаза 1 ✅ Критические баг-фиксы (Завершена)

**Цель:** Устранение критических проблем, выявленных в ходе баг-аудита.

| # | Проблема | Решение | Затронутые файлы |
|---|----------|----------|-------------------|
| 1 | **Clothing selectors: `Set` не сериализуется** — `useEquippedItems()` возвращал `Set<string>`, который при сохранении/загрузке терял данные (JSON.stringify → `{}`) | Миграция с `Set` на `string[]` во всех селекторах одежды; нормализация при чтении из сохранения | `src/store/selectors/clothingSelectors.ts`, `src/store/slices/playerSlice.ts`, `src/shared/validation/saveSchema.ts` |
| 2 | **Cross-slice reads внутри `set()` callback** — `thoughtCabinet` уведомления (`eventBus.emit`) вызывались внутри `set()` Zustand, что нарушало контракт «no side effects in setter» | Вынос `eventBus.emit('thought:changed')` за пределы `set()` callback — уведомления теперь отправляются после завершения транзакции стора | `src/store/slices/thoughtCabinetSlice.ts`, `src/store/applyGameAction.ts` |
| 3 | **Quest indicator staleness** — индикаторы квестов на 3D-карте читали state через императивный `getGameStore()` и не обновлялись при изменениях | Миграция на реактивный `useGameSelector()` — индикаторы теперь автоматически ре-рендерятся при смене активного квеста | `src/components/3d/QuestWaypoints.tsx`, `src/store/selectors/questSelectors.ts` |
| 4 | **EventBus auto-revive без предупреждений** — disposed EventBus молча «оживал» при попытке подписки, маскируя логические ошибки | Добавлено dev-режим предупреждение `console.warn` + счётчик `autoReviveCount` для отслеживания повторных оживлений | `src/engine/EventBus.ts` |
| 5 | **CombatSystem монолит (1329 строк)** — `executeEnemyTurn()` содержал всю логику в одном месте, затрудняя тестирование | Извлечён `src/engine/combat/enemyTurn.ts` (202 строки) с чистыми функциями: `computeEnemyIncomingDamage()`, `resolveStatDrain()`, `computeEnemyIncomingDamage()` | `src/engine/combat/enemyTurn.ts`, `src/engine/CombatSystem.ts` |

**Итог фазы:** 5 критических багов исправлено, combat system частично декомпозирован, сериализация сохранений надёжна.

---

## Фаза 2: Визуальные и UX улучшения

**Цель:** Повышение тактильной отдачи боя, улучшение навигации по журналам, визуальная обратная связь от NPC.

### 2.1 Combat UI — тактильная обратная связь

**Проблема:** Боевой интерфейс (`CombatUI.tsx`, 1202 строки) визуально информативен, но ощущается «плоским» — нет ощущения удара.

**Задачи:**

- **Плавающие числа урона (Damage Number Float).** Компонент `DamageNumberFloat.tsx` (335 строк) уже существует, но не привязан к **каждому** типу урона. Нужно обеспечить emits из `playerAttack()` и `executeEnemyTurn()` для всех типов: базовый урон, крит, урон от affinity, урон от status-эффектов, drain-урон.
  - Файлы: `src/components/game/DamageNumberFloat.tsx`, `src/engine/CombatSystem.ts` (строки 421–537, 923–1070)
  - Текущее событие: `combat:action` — нужно добавить `damage_channel` в payload

- **Hit-pause (combat:bullet_time уже есть!).** Механика bullet-time уже реализована (строки 516–526 в CombatSystem.ts), но применяется **только** к критическим и суперэффективным ударам. Расширить на:
  - Обычные атаки с комбо ≥ 3 (лёгкий slow-mo, `timeScale: 0.5`, `duration: 0.15`)
  - Получение урона игроком (быстрый «stagger» — `timeScale: 0.6`, `duration: 0.1`)
  - Файлы: `src/engine/CombatSystem.ts`, `src/components/game/ScreenEffects.tsx`

- **Screen shake дифференциация.** Модуль `cameraShake.ts` (214 строк) предоставляет `triggerCameraShake(intensity, decay)`. Сейчас используется единый `combat:combat_impact` intensity. Нужно:
  - Критический удар: `intensity: 0.8, decay: 4`
  - Обычная атака: `intensity: 0.3, decay: 6`
  - Полученный урон: `intensity: 0.5, decay: 5` + сдвиг камеры вниз
  - Файлы: `src/engine/camera/cameraShake.ts`, `src/engine/CombatSystem.ts`

### 2.2 Journal / ClothingTab — UX поиска

**Проблема:** Поиск в журнале (`JournalPanel.tsx`) передаёт `searchQuery` только в `ClothingTab`, но фильтрация в остальных вкладках не реализована.

**Задачи:**

- **Распространить `searchQuery` на все вкладки:**
  - `ThoughtCabinetTab.tsx` — фильтрация по названию мысли
  - `PoemsTab.tsx` — фильтрация по названию/фрагменту стихотворения
  - `LoreTab.tsx` — фильтрация по заголовку лора
  - `NotesTab.tsx` — полнотекстовый поиск по заметкам
  - `SkillsTab.tsx` — фильтрация по названию навыка
  - Файлы: `src/components/game/journal/*.tsx`, `src/components/game/journal/useJournalPanel.ts`

- **ClothingTab — улучшение визуальной навигации:** Вкладка одежды (`ClothingTab.tsx`, 346 строк) показывает все 6 слотов (`ALL_EQUIPMENT_SLOTS`). Добавить:
  - Визуальный индикатор пустого слота (outline + label «Пусто» вместо пустого места)
  - Tooltip при наведении на пустой слот: какие предметы можно надеть
  - Файлы: `src/components/game/journal/ClothingTab.tsx`

### 2.3 NPC — визуальные индикаторы эмоций

**Проблема:** Система эмоций NPC полноценно реализована (`npcEmotionTypes.ts` — 7 эмоций, `npcEmotionalReactions.ts` — маппинг на анимации и бarks, `npcEmotionalReactionEngine.ts` — подписки на события), но **нет визуального индикатора** в HUD для игрока.

**Задачи:**

- **NPC Emotion Indicator (HUD).** Добавить небольшой иконку-«облачко» над NPC при смене эмоции:
  - Иконки: 😐 нейтральный, 🤔 любопытный, 😨 встревоженный, 🧐 задумчивый, 😤 недовольный, 🙏 почтительный, 😰 испуганный
  - Длительность: inherit из `PROXIMITY_EMOTION_DURATION` (5000ms) + decay
  - Использовать существующий `NPC_EMOTION_LABELS` из `npcEmotionTypes.ts`
  - Файлы: `src/components/3d/NpcEmotionIndicator.tsx` (новый), `src/engine/npc/useNpcVisualBehavior.ts`

- **Связь karma ↔ эмоция.** Функция `getKarmaEmotionModifier()` уже существует в `npcEmotionalReactions.ts`. Убедиться что karma-сдвиги (высокая карма → `respectful`, низкая → `annoyed`/`fearful`) реально отображаются через emotion indicator.

### 2.4 Мобильные touch-управление для боя

**Проблема:** Gamepad mapping существует (`combatGamepadMap.ts` — 80 строк, маппинг A/B/X/Y/LB/RB), но нет touch-аналогов для мобильных устройств. `useTouchDevice()` hook есть, но в CombatUI не используется.

**Задачи:**

- **Combat Touch Buttons.** Добавить группу tap-кнопок внизу экрана для мобильных:
  - 4 основных действия: Атака, Защита, Бегство, Стихотворение
  - Размер: ≥ 48px (touch target),间距 ≥ 8px
  - Показывать только при `useTouchDevice() === true`
  - Файлы: `src/components/game/CombatTouchControls.tsx` (новый), `src/components/game/CombatUI.tsx`

- **Swipe-навигация по списку стихотворений:** Свайп влево/вправо для цикличного переключения poem powers в бою
  - Файлы: `src/components/game/CombatUI.tsx`, `src/hooks/useTouchDevice.ts`

### 2.5 Skeleton-загрузки для тяжёлых панелей

**Проблема:** При открытии панелей (Inventory, Journal, QuestBoard) данные могут загружаться с задержкой. UI-компонент `Skeleton` (`src/components/ui/skeleton.tsx`) уже есть в shadcn/ui, но не используется в игровых панелях.

**Задачи:**

- Добавить skeleton-состояния для:
  - `InventoryGrid.tsx` — placeholder-карточки предметов
  - `JournalPanel.tsx` — placeholder-списки по вкладкам
  - `QuestBoardPanel.tsx` — placeholder-карточки квестов
  - `CodexPanel.tsx` — placeholder-статьи
- Определять loading-состояние через `useGameDataPreload()` hook
- Файлы: `src/components/game/inventory/InventoryGrid.tsx`, `src/components/game/journal/JournalPanel.tsx`, `src/components/game/QuestBoardPanel.tsx`, `src/components/game/CodexPanel.tsx`

---

## Фаза 3: Архитектурный рефакторинг

**Цель:** Дальнейшая декомпозиция CombatSystem (1329 строк), повышение тестируемости.

### 3.1 Декомпозиция CombatSystem — новые модули

`CombatSystem.ts` по-прежнему содержит 1329 строк и является « God Object ». После извлечения `enemyTurn.ts` (202 строки) осталось ещё несколько candidate-модулей:

#### 3.1.1 `turnCycle.ts` — управление фазами хода

**Вынести из CombatSystem.ts:**

- `endPlayerTurn()` (строки 788–808) — переключение фазы
- `transitionToPlayerTurn()` (строки 811–910) — обработка начала хода игрока (buff tick, stat drain, stun check)
- `gotoEnemyTurnEnd()` — финализация хода врага (проверка player defeat, transition back)

**Зачем:** `transitionToPlayerTurn()` содержит 100+ строк логики обработки buff lifecycle + stat drain (4 ветки: energy, karma, logic, empathy) + stun handling. Выделение в отдельный модуль позволит покрыть unit-тестами все ветки drain-логики без необходимости инстанцировать combat singleton.

- Целевой файл: `src/engine/combat/turnCycle.ts` (~180 строк)
- Импорты: `buffSystem.ts`, `formulas.ts`, `types.ts`

#### 3.1.2 `rewards.ts` — подсчёт наград за победу

**Вынести из CombatSystem.ts:**

- `handleVictory()` (строки 1072–1130) — расчёт XP, karma, credits, loot, skill XP, combo bonus
- `handleDefeat()` — аналогичная логика для поражения
- `computeCombatCredits()` уже в `formulas.ts`, но вся «сборка» награды — в handleVictory

**Зачем:** Награды — чистая функция от combat state → reward object. Идеальный кандидат на unit-тестирование: различные combo count, enemy types, loot tables.

- Целевой файл: `src/engine/combat/rewards.ts` (~100 строк)
- Экспорт: `computeVictoryRewards(state: CombatState): CombatReward`
- Тесты: `src/engine/combat/rewards.test.ts` — 10+ кейсов

#### 3.1.3 `gamepadInput.ts` — обработка gamepad в бою

**Вынести из CombatSystem.ts:**

- `getGamepadSelectedPoemIndex()` (императивный getter)
- `handleCombatGamepadInput()` — если существует inline-обработчик
- Логика poem cycling через gamepad (LB/RB, D-pad)

**Зачем:** Gamepad mapping (`combatGamepadMap.ts`) отделён, но обработка input всё ещё в CombatSystem. Выделение позволит тестировать mappings и poem selection отдельно.

- Целевой файл: `src/engine/combat/gamepadInput.ts` (~60 строк)

### 3.2 Извлечение damage pipeline для playerAttack()

**Проблема:** `playerAttack()` (строки 421–537) — 117 строк, содержит тот же тип логики что и `computeEnemyIncomingDamage()` в `enemyTurn.ts`, но для атаки игрока. Это дублирование архитектурного паттерна.

**Задача:**

- Создать `computePlayerOutgoingDamage()` в отдельном модуле (чистая функция)
- Параметры: `PlayerAttackParams { attack, enemyDef, buffs, rng, comboCount, skillLevels, perks, enemyType }`
- Возврат: `{ damage: number, isCritical: boolean, comboCount: number, affinityResult: AffinityResult, rng: CombatRngState }`
- `playerAttack()` становится тонким orchestrator: вызывает pure function → применяет setState → emits events

- Целевой файл: можно расширить `enemyTurn.ts` → переименовать в `damagePipeline.ts`, или создать отдельный `playerTurn.ts` (~120 строк)

### 3.3 transitionToPlayerTurn() — упрощение

**Проблема:** Функция (строки 811–910) содержит:
1. Buff ticking (делегировано в `tickBuffs()`)
2. Stat drain loop (4 ветки: energy/karma/logic/empathy + hp_drain_percent)
3. Stun check + immunity buff
4. State assembly

**Задача:**

- Вынести stat drain logic в `processStatDrainDebuffs(state: CombatState): { hpDelta: number, log: CombatLogEntry[], actions: GameAction[] }` — чистая функция
- Вынести stun check в `checkPlayerStun(state: CombatState): { stunned: boolean, state: CombatState, log: CombatLogEntry[] }`
- `transitionToPlayerTurn()` становится: `tickBuffs → processStatDrain → checkStun → assembleState → combat.setState()`

- Целевые файлы: `src/engine/combat/turnCycle.ts`, `src/engine/combat/statDrain.ts` (~50 строк)

### 3.4 Покрытие тестами enemyTurn.ts

**Проблема:** Модуль `enemyTurn.ts` (202 строки) содержит чистые функции, но **не имеет тестов**.

**Тест-кейсы для `src/engine/combat/enemyTurn.test.ts`:**

```
computeEnemyIncomingDamage:
  - базовый урон без баффов
  - с defense_reduction на враге (урон увеличивается)
  - с damage_reduction на игроке (урон уменьшается)
  - с vulnerability на игроке (урон увеличивается)
  - с spiritual skills (дополнительное reduction)
  - с perkModifiers (outgoingDamageMultiplier врага)
  - edge case: урон ≤ 0 → clamp до 0

resolveStatDrain:
  - targetsStat === 'none' → null
  - targetsStat === 'logic' с rng → action
  - targetsStat === 'energy' с rng → action
  - rng не попадает в шанс → null
```

- Целевой файл: `src/engine/combat/enemyTurn.test.ts`
- Ожидаемый объём: ~25 тест-кейсов

---

## Фаза 4: Контент и наратив

**Цель:** Улучшение подачи сюжета, расширение поэтической боевой системы, углубление NPC-диалогов.

### 4.1 Skip-prologue — нарративный контекст

**Проблема:** Опция «Пропустить пролог» в `useMenuScreen.ts` (строка 26: `handleNewGame(skipPrologue = false)`) спавнит игрока за партой **без какого-либо сюжетного контекста**. Игрок оказывается в комнате без понимания: кто он, где он, что происходит.

**Текущее поведение при skip:**
```typescript
// useMenuScreen.ts:40–54
store.setCurrentNodeId('start');
store.setPlayerPosition([0.5, 0.01, 2.4]);  // спавн за партой
store.setIntroSeen(true);
store.setIntroActive(false);
// НЕТ narrative overlay, НЕТ backstory
```

**Задача:**

- **Narrative skip overlay:** При старте с `skipPrologue=true` показать текстовый overlay (2-3 экрана) в стиле Disco Elysium inner monologue:
  - «Вы — Володня. IT-специалист. Утро. Будильник не звенел — телефон умер.»
  - «На столе — нерешённый тикет, остывший кофе и блокнот со стихами.»
  - «Кажется, сегодня будет долгий день.»
- Вариант реализации: компактный `SkipPrologueOverlay.tsx` с `useNarrativeTypewriter` hook
- После прочтения — установить `currentNodeId` на первый после-пролог узел (не `'start'`, а актуальный игровой узел)
- Файлы: `src/components/game/menu/SkipPrologueOverlay.tsx` (новый), `src/components/game/menu/useMenuScreen.ts`, `src/components/game/menu/MenuScreenPanel.tsx`

### 4.2 Consequence Recap System — улучшения

**Проблема:** Система `consequenceRecap.ts` (128 строк) генерирует суммарisations из `choiceLog` + `moralChoices`, но:
- Парсит JSON из строк (`JSON.parse(entry)`) — хрупко
- Нет категоризации по актам (всё плоским списком)
- Нет привязки к karma-сдвигам

**Задачи:**

- **Группировка по актам:** Добавить `currentAct` в `ParsedChoice` и фильтровать по интервалам
- **Karma-резюме:** Показывать «Ваша карма изменилась: +12 (Act 1) → -3 (Act 2) = +9»
- **UI-компонент:** Создать `ConsequenceRecapPanel.tsx` для отображения в Journal/Notes tab
- **Trigger zones:** Показывать recap при переходе между актами (событие `story:act_transition`)
- Файлы: `src/engine/narrative/consequenceRecap.ts`, `src/components/game/journal/ConsequenceRecapPanel.tsx` (новый)

### 4.3 Дополнительные poem combat abilities

**Проблема:** `POEM_COMBAT_ABILITIES` в `actions.ts` (659 строк) содержит набор боевых стихотворных способностей, но количество ограничено и не все стихотворения из коллекции имеют combat-представление.

**Задачи:**

- **Audition новых poem abilities:** Для каждого стихотворения без combat-способности создать уникальный эффект:
  - Усиление существующих каналов (physical/magical/spiritual/karmic)
  - Status-эффекты: silence, shield, buff, debuff
  - Синергии: poem A + poem B → combo ability (модуль `poemSynergies.ts` уже существует)
- **Регистрация в `POEM_COMBAT_ABILITIES`:** Каждая новая способность описывается через `PoemCombatAbility` interface
- **Тесты:** Обновить `actions.test.ts` (если существует) или создать
- Файлы: `src/engine/combat/actions.ts`, `src/config/poemSynergies.ts`, `src/config/poemEffectRegistry.ts`

### 4.4 NPC-диалоги — karma-gated ветки

**Проблема:** Диалоги NPC (`src/data/dialogue/`) содержат условные ветки через `conditions`, но karma-gated ветки (когда karma-уровень определяет доступные опции) реализованы только для нескольких NPC.

**Задачи:**

- **Audit karma conditions:** Проверить все NPC dialogues на наличие karma-ветвления
- **Расширение ключевых NPC:**
  - Albert (`part1-albert-expanded.ts`, 1077 строк) — добавить ветку при высокой карме: «Вы замечаете, что Альберт относится к вам с уважением»
  - Maria, Boris, Viktor — аналогичные karma-sensitive реплики
- **UI-индикация:** В `DialogueRenderer.tsx` подсветить karma-зависимые опции (иконка⚖️)
- Файлы: `src/data/dialogue/*.ts`, `src/components/game/DialogueRenderer.tsx`

---

## Фаза 5: Тестирование и стабилизация

**Цель:** Исправление существующих тестовых падений, расширение покрытия, E2E тестирование критических потоков.

### 5.1 Исправление 16 pre-existing test failures

**Проблема:** В текущем тестовом наборе (306 тестов) есть ~16 падающих тестов (pre-existing failures).

**Действия:**

- Запустить `npx vitest run --reporter=verbose` и собрать список падающих тестов
- Классифицировать по типу:
  - **Stale mocks:** Моки не обновлены после рефакторинга stores/combat
  - **Missing exports:** Функции были перемещены (например, в `enemyTurn.ts`)
  - **Type mismatches:** Изменение типов (Set → string[], BuffEffect union extensions)
  - **Async timeout:** Flaky tests с таймаутами
- Исправить приоритетно: сначала тесты combat subsystem, затем store tests
- Цель: 0 failures, 306+ passing

### 5.2 Integration-тесты для combat flow

**Проблема:** Combat system покрыт unit-тестами (formulas, buffs, RNG, difficulty), но **нет integration-тестов** полного хода боя.

**Новые тесты (`src/engine/combat/combatFlow.integration.test.ts`):**

```
Полный бой от начала до победы:
  - playerAttack → enemyTurn → playerAttack → enemyTurn → victory
  - Проверка: HP врага уменьшается, HP игрока уменьшается, combo растёт
  - Проверка: victory rewards корректны

Полный бой с защитой:
  - playerDefend → enemyTurn (сниженный урон) → playerAttack → victory
  - Проверка: damage reduction корректно применяется

Бой со status-эффектами:
  - poem power → buff → enemy с debuff → reduced damage
  - Проверка: buff lifetime, expiry, stat drain

Бой с побегом:
  - playerFlee → success / failure → flee retry → cumulative bonus
  - Проверка: flee chance scaling

Поражение:
  - enemyTurn → playerHp ≤ 0 → defeat → game over
  - Проверка: defeat state, нет crash loop
```

- Целевой файл: `src/engine/combat/combatFlow.integration.test.ts`
- Ожидаемый объём: ~15 integration-тестов

### 5.3 E2E тесты для New Game flow

**Проблема:** Playwright config (`playwright.config.ts`) существует, но E2E тесты для критического «New Game» потока не написаны.

**E2E сценарии (`e2e/new-game-flow.spec.ts`):**

```
New Game с прологом:
  1. Клик "Новая Игра" → диалог подтверждения
  2. Подтверждение → fade-out → loading screen → canvas mount
  3. Intro cinematic (intro_wakeup) → auto-advance / skip
  4. Игрок за партой → открытие UI → подсказка взаимодействия

New Game без пролога (skip):
  1. Клик "Новая Игра" → диалог → "Пропустить пролог"
  2. Fade-out → спавн за партой (без cinematic)
  3. Проверка: UI доступен, квесты активны

Continue (загрузка сохранения):
  1. Клик "Продолжить" (при наличии save)
  2. Fade-out → загрузка → восстановление state
  3. Проверка: позиция игрока, активные квесты, инвентарь совпадают с сохранением
```

- Целевой файл: `e2e/new-game-flow.spec.ts`
- Зависимости: `playwright.config.ts` уже настроен

### 5.4 Snapshot-тесты для критических UI-компонентов

**Проблема:** Крупные UI-компоненты (CombatUI 1202 строки, JournalPanel, InventoryGrid) не имеют snapshot-тестов, что означает регрессии верстки могут проходить незамеченными.

**Компоненты для snapshot-тестирования:**

| Компонент | Файл | Рендер-кейс |
|-----------|------|-------------|
| CombatUI (player turn) | `src/components/game/CombatUI.tsx` | Базовый бой, баффы, HP/energy |
| CombatUI (victory) | `src/components/game/CombatUI.tsx` | Состояние победы с rewards |
| CombatUI (defeat) | `src/components/game/CombatUI.tsx` | Состояние поражения |
| JournalPanel (all tabs) | `src/components/game/journal/JournalPanel.tsx` | Каждая вкладка |
| ClothingTab | `src/components/game/journal/ClothingTab.tsx` | С одеждой / без одежды |
| ThoughtCabinetTab | `src/components/game/journal/ThoughtCabinetTab.tsx` | С мыслями / пустой |
| DialogueRenderer | `src/components/game/DialogueRenderer.tsx` | С dice-roll / без |
| QuestNotificationSystem | `src/components/game/QuestNotificationSystem.tsx` | Quest accepted |

- Файлы: `src/components/game/CombatUI.test.tsx` (расширить), `src/components/game/journal/*.test.tsx`
- Реализация: `vitest` + `@testing-library/react` + `toMatchSnapshot`

---

## Приоритеты и зависимости

```
Фаза 1  ✅  ──→  Фаза 2 (UX)     ──→  Фаза 4 (Контент)
                  ↕
              Фаза 3 (Архитектура)
                  ↕
              Фаза 5 (Тесты)
```

**Рекомендуемый порядок:**
1. **Фаза 3.4** (тесты enemyTurn.ts) — немедленный ROI, закрепляет извлечение из Фазы 1
2. **Фаза 5.1** (fix 16 test failures) — стабилизация test suite
3. **Фаза 2.1** (combat UI feedback) — наибольший визуальный эффект для игроков
4. **Фаза 3.1–3.3** (архитектурный рефакторинг) — после стабилизации тестов
5. **Фаза 2.2–2.5** (остальные UX улучшения)
6. **Фаза 4.1** (skip-prologue overlay) — быстрый win
7. **Фаза 4.2–4.4** (контент)
8. **Фаза 5.2–5.4** (integration/E2E/snapshot) — финальная стабилизация

---

*Документ обновлён: 2025-07-24. Каждая фаза должна быть разбита на отдельные PRs с размером ≤ 500 строк изменений для удобного ревью.*
