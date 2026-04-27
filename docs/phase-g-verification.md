# Фаза G — проверка и закрепление (smoke, золотая линия, IT-сайд)

## 1. Автоматизированные проверки (не полный браузерный E2E)

| Что | Где | Охват |
|-----|-----|--------|
| **Целостность золотого пути** | `src/data/goldenPath.test.ts` | Узлы `GOLDEN_PATH_STORY_SPINE` есть в `STORY_NODES`; квесты `GOLDEN_PATH_*` есть в `QUEST_DEFINITIONS`; подсказки ветвлений согласованы с `choices` / `autoNext`. |
| **Стихи / нарратив** | `src/data/narrativePoetryIntegrity.test.ts` | Согласованность данных сюжета и стихов (по правилам репозитория). |
| **Контент-граф** | `src/validation/contentValidator.test.ts` | Предметы, заставки, сцены — по мере настроенных проверок. |
| **Browserbase smoke** | `browserbase-functions/volodka-smoke`, `docs/volodka-room-smoke.md` | Загрузка `/` → «Новая игра» → пропуск интро → **хотя бы один WebGL-canvas**. **Нет** сценария «хаб → квест до награды → следующая сцена» — слишком длинно и флейково для облачного smoke; осознанно вне PR CI. |

**Вывод:** полноценного Playwright E2E «3D-хаб → один закрытый квест с наградой → переход сцены» в репозитории **нет**. Регресс сюжета/данных — через Vitest; «живой» слой — чеклисты ниже.

## 2. Ручной сценарий ~30–40 мин: золотая линия (срез) + `whitehat_uat_sprint`

### 2.1 Золотая линия — осмысленный срез

Ориентир: `GOLDEN_PATH_STORY_SPINE` и подсказки в `src/data/goldenPath.ts` (финал канона — `ending_creator`).

**Минимальный маршрут на одну сессию 30–40 мин:**

1. **Офис:** `start` → `start_2` → `start_diagnosis` (Kibana / IT-контекст), дальше `database_analysis` → `fix_choice` → `fix_success` → `lunch_time` / `colleagues_talk` / `after_lunch`.
2. **Дом + творчество:** `go_home` → `home_alone` → `evening_choice` → **«Писать»** → `write_evening` / `write_evening_result` (закрытие `first_words`, прогресс `main_goal`).
3. **Кафе (литлиния):** `sleep_alone` … по желанию ускорить → `friday_arrives` → `blue_pit` → `open_mic` (поднять руку) → чтение → `after_reading` / знакомство — проверка, что `first_reading` движется, UI 📋 согласован.

Имеет смысл **в одной сессии не добивать весь** спайн до `ending_creator` — цель среза: убедиться, что ветки из `GOLDEN_PATH_BRANCH_HINTS` кликабельны, квесты из спайна активируются и дают ожидаемую награду/прогресс.

### 2.2 IT-сайд после офиса: `whitehat_uat_sprint`

После прохождения офисного блока (лучше когда открыт доступ к панели квестов и 💻 **ITTerminal**):

- Взять квест **`whitehat_uat_sprint`** (референс-описание — `docs/quest-reference-template.md` §2).
- Пройти **полный цикл:** диалог (ИБ) → терминал (curl / логи) → handoff, до выдачи награды.
- Проверить, что `stageType` и события (`npc_talked` / `questEvents`) ведут себя предсказуемо вместе с основной сюжетной линией (без дублирования кармы/стат — см. `docs/adp-inventory-karma-portraits.md`).

### 2.3 3D-хаб (короткая проверка «хаб → квест → награда → сцена»)

Если время осталось:

- Узел `explore_hub_welcome` → открытие 3D-обхода.
- Квест **`exploration_zarema_hearth`**: один шаг, триггер в `zarema_albert_room`, **награда** и возврат/переход по сцене — сверка с `quest-reference-template.md` (3D-референс).

Это ближайший ручной аналог сценария **«хаб → цикл с наградой → следующая сцена»**, раз автоматизации нет.

## 3. Ссылки

- [adp-inventory-karma-portraits.md](adp-inventory-karma-portraits.md) — решения по инвентарю, карме, портретам.
- [karma-scale.md](karma-scale.md) — детализация кармы.
- [quest-reference-template.md](quest-reference-template.md) — референсные квесты, в т.ч. `whitehat_uat_sprint`.
- [volodka-room-smoke.md](volodka-room-smoke.md) — Browserbase smoke и чеклист комнаты Володьки.
