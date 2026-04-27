# Оценка длительности прохождения (нарратив)

Метод: **не** гарантированные «8 ч», а воспроизводимая смета по данным.

1. **Плотность сюжета** — `GOLDEN_PATH_STORY_SPINE` в [`src/data/goldenPath.ts`](../src/data/goldenPath.ts): число узлов × эвристика минут на узел (чтение + выбор, без стихов).
2. **Побочные ветки** — `QUEST_DEFINITIONS` с `stageType: 'exploration'` / IT-цепочки: суммировать зарегистрированные цели и зоны в [`src/data/triggerZones.ts`](../src/data/triggerZones.ts).
3. **Контент-бюджет** — см. [`docs/content-budget-8h.md`](content-budget-8h.md) для прикидки «сайд к сцене».

Обновляйте таблицу при добавлении `STORY_NODES` / квестов; регрессии золотого пути и стихов — [`src/data/goldenPath.test.ts`](../src/data/goldenPath.test.ts), [`src/data/narrativePoetryIntegrity.test.ts`](../src/data/narrativePoetryIntegrity.test.ts).

| Слой | Источник | Примечание |
|------|----------|------------|
| Скелет | `GOLDEN_PATH_STORY_SPINE` | Минимальная линия к финалу |
| Сайды 3D | `exploration_*` в `quests.ts` + `explorationQuestGraphs.ts` | Напр. «Тёплый угол», «Лог подъезда», район, МВД |
| Стресс/пост | `ExplorationPostFX` + `explorationPostFxState` | Время «в ощущениях», не в словах |
