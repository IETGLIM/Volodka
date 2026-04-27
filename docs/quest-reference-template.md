# Референс-флоу квестов и шаблон выравнивания

Документ закрепляет **четыре опорных квеста** по среде (офис, дом, кафе, 3D-обход) — полный путь *от принятия квеста до награды* в смысле данных, UX трекера и слоёв из `quest-scene-pipeline.md`. Остальные квесты **подтягиваются** к тому же контракту: те же поля, те же `stageType`, ясные `hint` / `targetLocation` / `linkedStoryNodeId` где уместно.

**См. также:** [quest-scene-pipeline.md](quest-scene-pipeline.md), `src/lib/cinematicQuestDefaults.ts` (биты старт / шаг / финиш по умолчанию), `src/game/core/questEvents.ts` (события → прогресс).

---

## 1. Канонический ритм (8 шагов)

Совпадает с таблицей в `quest-scene-pipeline.md` §1: принятие → (опц.) бит → текст → явная цель в 📋 → выбор/реплики → механика (VN / 💻 / 3D) → награда → переход.

**Данные, которые делают флоу «продакшн»:**

| Слой | Минимум |
|------|---------|
| Квест | `id`, `title`, `description`, `objectives[]`, `reward`, для сюжетного входа — `startNode` (или явное `questStart` из узла) |
| Биты | `cutsceneOnStart` / `OnComplete` / `OnObjective` *опционально*; иначе подставляются `cinematic_beat_quest_*` из `cinematicQuestDefaults` |
| Шаг | `hint`, по возможности `stageType` (`minigame` / `narration` / `exploration` / `dialogue` / `terminal`), `targetLocation` / `targetNPC` / `mapHint`, `linkedStoryNodeId` для привязки к `STORY_NODES` |
| Завершение | `runQuestCompletionScan` после `incrementQuestObjective` (квест закрывается, когда **все** `objectives` удовлетворены) |

---

## 2. Четыре референс-флоу (эталон)

### Офис — `whitehat_uat_sprint`

- **Смысл:** согласованный white-hat UAT-прогон (ИБ, границы, терминал, handoff) без «кино-хакерства».
- **Старт сюжета:** `startNode: 'start'`, квест берётся из панели 📋 после сюжетного входа в офисную линию; шаги завязаны на `office_artyom`, `office_colleague` и команды в 💻.
- **Прогресс:** `npc_talked` для двух шагов (см. `EVENT_OBJECTIVE_MAP` в `questEvents.ts`); остальные — `questOperations` / терминал в сценарии `ITTerminal`.
- **Награда:** `skillPoints`, `karma`, `stability`, `intuition` в `createReward` квеста.

**Шаблон:** диалог (ИБ) → терминал (curl) → терминал (лог) → диалог (handoff) — **чередование** `stageType: 'dialogue'` / `'terminal'`.

### Дом — `first_words`

- **Смысл:** мини-игра стиха + рефлексия в `home_evening`.
- **Старт:** `startNode: 'start'`, активация сюжетом; цели: `write_poem` (minigame) → `reflect` (narration) с `linkedStoryNodeId` на `write_evening` / `write_evening_result`.
- **Событие прогресса:** `poem_written` (см. `questEvents.ts`).

**Шаблон:** VN-узел пишет `questOperations` + флаг; шаги помечены `minigame` + `narration`.

### Кафе — `first_reading`

- **Смысл:** путь в «Синюю яму» → open mic → знакомство; часть `main` линии по творчеству.
- **Старт сюжета:** квест `first_reading` дискаверится флагом `visited_cafe`; `go_to_cafe` двигается **эффектом** на узле `blue_pit` (см. `storyNodes`, `questOperations` на `first_reading` / `coffee_affair`) *и* дублируется по `location_visited` при входе в `cafe_evening` для кофейного сайда.
- **Узлы:** `blue_pit` → `open_mic` / ветки чтения → `stranger_approach`; у целей — `linkedStoryNodeId` на эти id.

**Шаблон:** `stageType: exploration` (прибытие) → `narration` / `dialogue` (сцена и люди) — **одна** цель = один внешне понятный глазу «кадр» сцены.

### 3D-обход — `exploration_zarema_hearth` (и расширение: `exploration_volodka_rack`)

- **Минимальный эталон (`exploration_zarema_hearth`):** один шаг, один триггер E в `zarema_albert_room`, `startNode: 'explore_hub_welcome'`, `mapHint` — полный **цикл** хаб → сцена → взаимодействие → `completeQuest` через `incrementQuestObjective` (см. граф обхода).
- **Расширенный эталон (`exploration_volodka_rack`):** ветвление *форс (minigame)* vs *аудит (exploration)*, оба `targetLocation: volodka_room` — **одна** ветка доводится до награды, вторая нежива (логика в `explorationQuestGraphs` / `volodkaRackQuestBranch`).

**Шаблон:** `startNode` в хабе, `mapHint` + `stageType: 'exploration' | 'minigame'`, согласование с `InteractionRegistry` / триггерами.

---

## 3. Чеклист — «без обрыва» (📋, бит, VN)

После `completeQuest` (через `questMetaStore` / `useGameStore`) и `completeCutscene` (полноэкранный бит в `useGameRuntime`) игроку должно быть ясно, **что в журнале**, **куда ведёт сцена** и **без дублирования** одной и той же «цели» в двух оверлеях.

| Правило | В коде |
|--------|--------|
| Пока идёт `AnimeCutscene` (в т.ч. квестовый бит) или VN-оверлей сюжета — **компактный трекер** в `HUD` скрыт (`suppressQuestStrip` в `GameOrchestrator` + `activeCutsceneId` / `showStoryOverlay` / 3D-интро) | `HUD.tsx`, `GameOrchestrator.tsx` |
| `QuestTracker` (модульные core-квесты) не показан **поверх** квестового бита | `GameOrchestrator`: рендер только `!activeCutsceneId` |
| После **закрытия** любого `AnimeCutscene` шина `cinematic:ended` (payload: `completionKey`); по ключам `cinematic::quest::*` — тост «**Следующий шаг**» из `getNextTrackedObjective` (если ещё есть незавершённая цель) | `useGameRuntime.completeCutscene` → `eventBus.emit('cinematic:ended', …)` |
| События `quest:activated` / `quest:completed` / `quest:objective_updated` по-прежнему ведут в биты **до** `cinematic:ended` (тайминг: стор квеста уже обновлён, HUD вернулся вместе с битом) | `questMetaStore.ts`, `useGameRuntime` |

*Панель квестов 📋, открытая вручную* (`QuestsPanel`) — намеренный просмотр: не путать с «навязчивым дублем» в компактной полосе HUD.

---

## 4. Чеклист для остальных квестов (данные)

1. **Заполнить `stageType` у каждой цели** (даже грубый ярлык: `terminal` для всех шагов 💻, `dialogue` для «поговори с NPC»).
2. **Имеет сюжетный визуал —** добавить `linkedStoryNodeId` на существующий `STORY_NODES` id.
3. **3D-шаг** — `targetLocation` = `SCENE_CONFIG` id, при необходимости `mapHint`.
4. **Офисные main без `startNode`** — по возможности `startNode: 'start'`, как у референса офиса, чтобы привязка к панели была предсказуема.
5. **Кинематограф** — кастомные `cutsceneOn*` только если нельзя сказать смысл дефолтными `cinematic_beat_quest_*` (текст в `animeCutscenes` уже под общий бит).
6. **События** — при новом `event.type` в `questEvents.ts` сразу писать пару `(questId, objectiveId)` и `condition` в тестируемом виде.

---

## 5. Идентификаторы (быстрый указатель)

| Среда | Квест-референс | `startNode` (если задан) |
|--------|-----------------|-------------------------|
| Офис | `whitehat_uat_sprint` | `start` |
| Дом | `first_words` | `start` |
| Кафе | `first_reading` | (дискавери по флагу) |
| Обход | `exploration_zarema_hearth` | `explore_hub_welcome` |
| Обход+ветки | `exploration_volodka_rack` | `explore_hub_welcome` |

*Документ: 2026-04-27; согласование бита и 📋 — §3; `stageType` в `QUEST_DEFINITIONS` — §4.*
