# Целевой бюджет контента (~8 ч) и метрики

К ориентиру **8 часов** ведёт не число `SceneId` в `scenes.ts`, а **плотность** сюжетных узлов, обязательного обхода и сайд-цепочек. Ниже — снимок для планирования (обновлять вручную по мере роста данных).

## Золотой путь (скелет)

- **Источник:** `src/data/goldenPath.ts` — `GOLDEN_PATH_STORY_SPINE`, целевой финал `GOLDEN_PATH_TARGET_ENDING_NODE_ID`.
- **Проверки:** `npx vitest run src/data/goldenPath.test.ts src/data/narrativePoetryIntegrity.test.ts` после правок `storyNodes`, `quests`, `poems`, `goldenPath`.

## Побочные цепочки 3D (обход)

| Локация `SceneId` | Квест (id) | Примечание |
|-------------------|------------|------------|
| `zarema_albert_room` | `exploration_zarema_hearth` | Граф `HEARTH_EXPLORATION_QUEST_GRAPH` |
| `volodka_room` | `exploration_volodka_rack` | Форс (wire) / аудит панелей |
| `district` | `exploration_district_chronicle` | Граф `DISTRICT_CHRONICLE_EXPLORATION_QUEST_GRAPH` |
| `mvd` | `exploration_mvd_bureau` | Граф `MVD_BUREAU_EXPLORATION_QUEST_GRAPH` |
| `office_morning` | IT-линия (`incident_scroll_4729`, `vault_backup_trial`, `dependency_sigil` и т.д.) | Терминал / NPC |

## Оценка длительности (эвристика)

- **Сюжетный оверлей (чтение + выбор):** ориентир 120–200 слов/мин для внимательного чтения; узлы `STORY_NODES` с длинным текстом дают дискретные минуты.
- **3D-обход:** 5–20 мин на локацию при полном осмотре, в зависимости от квеста и пропов.
- **Цель 8 ч:** ветка 2.5–3.5 ч на основной путь + 3–4 ч на сайд-квесты и повторяемый контент (стихи, IT-задачи, исследование) + запас.

Точный «тайминг» в коде не хранится; при релизе крупного пакета данных можно снова пройти руками с секундомером / записью стрима и уточнить таблицу.
