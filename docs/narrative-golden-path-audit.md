# Аудит золотого пути (сверка с квестами)

Краткая матрица: `GOLDEN_PATH_STORY_SPINE` из `goldenPath.ts` + ожидаемый тон + связь с `QUEST_DEFINITIONS`. Используется для вычитки и регрессий; обновлять при добавлении узлов в скелет.

| nodeId | Тон / режим | Квесты / примечание |
|--------|-------------|---------------------|
| start | Офис, IT-noir, метафора тикетов | `main_goal` старт; энергия на длинный текст |
| start_2 | Системный алерт | Ветки диалогов NPC → тот же диагноз |
| start_diagnosis | Kibana, логи, старт IT-цепочек | `questOperations` side quests |
| database_analysis | Внутренний голос | — |
| fix_choice / fix_success | Действие, облегчение | `auth_crisis` и др. по ветке |
| lunch_time / colleagues_talk | Быт, чужая норма | — |
| after_lunch | Вечер, выбор пути | — |
| go_home / home_alone / evening_choice | Дом, уязвимость | `first_words` активируется выбором «Писать» |
| write_evening / write_evening_result | Мини-игра, черновик | `first_words` +1 `main_goal.write_poems` |
| sleep_alone / dream_sequence | Сон | — |
| friday_arrives / blue_pit / cafe_atmosphere | Кафе | `first_reading`, `go_to_cafe` |
| open_mic / read_poetry | Сцена | `read_poem` objective |
| after_reading / stranger_approach / cafe_end | Контакт | `meet_someone` |
| evening_choice_act2 / next_friday / second_cafe_visit | Повтор | Линия Виктории |
| victoria_reading / reading_reaction / maria_warm / victoria_hand | Откровение | `maria_connection` по данным квестов |
| cafe_evening_end / act2_bridge / act2_dilemma | Мост | — |
| act3_start / crisis_choice | Кризис | Ветка «Писать до утра» → наследие / сборник |
| volunteer_read_result | Опция наследия | `poetry_collection`, `main_goal` |
| poetry_life_review | связка 3D Zarema/Albert | Опциональный узел обзора |
| ending_choice / ending_creator | Финал | `first_words` + ≥2 квеста |

## Проверки противоречий (выполнено при аудите волны 1)

- Подсказки `main_goal` согласованы с реальными точками: дом (`home_evening`, мини-игра), `volodka_room` в 3D, кафе `cafe_evening` / сюжет `blue_pit`, финальные узлы наследия.
- `first_words.linkedStoryNodeId` указывает на `write_evening` / `write_evening_result` — узлы существуют (`narrativePoetryIntegrity.test.ts`).
- Кафе в квесте: «Синяя Яма» = сюжетные `blue_pit` / `cafe_evening`, не расхождение с `perform_live`.

## Как обновлять

1. Добавили узел в `GOLDEN_PATH_STORY_SPINE` — строка в таблицу + тест `goldenPath.test.ts`.
2. Изменили `hint` у `main_goal` — сверить с `STORY_NODES` и 3D-логами.
