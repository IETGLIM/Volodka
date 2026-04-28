# Нарратив: акты 2–3 и привязка к данным

Короткий указатель для контент-итераций (без дублирования [narrative-style-bible.md](./narrative-style-bible.md)).

## Золотой путь

Скелет в `src/data/goldenPath.ts`: мосты `act2_bridge`, `act2_dilemma`, вход в третий акт `act3_start`, кризисный узел `crisis_choice`. Любой новый сайд-квест или 3D-граф должен иметь **явный** `linkedStoryNodeId` / вход в `docs/quest-scene-pipeline.md`, если ветка касается недельного романа или кризиса.

## Квестовые графы обхода

- Реестр графов: `src/game/quests/explorationQuestGraphs.ts`.
- При добавлении узла следовать [quest-reference-template.md](./quest-reference-template.md) и тестам на граф (`questGraphIntegrity.test.ts`).

## Синхронизация с UI

Волна 2 токенов (`--game-ui-*`) и VN-слой `StoryRenderer` дают единую кожу; полноэкранный сюжет + 3D: флаг `suppressQuestStrip` в `HUD` (см. `useGameUiLayout`).
