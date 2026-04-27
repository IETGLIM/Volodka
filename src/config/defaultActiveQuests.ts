/**
 * Стартовый набор активных квестов при `resetGame` / `hydrate` без `activeQuestIds` в сейве.
 * Согласовано с `questMetaStore` и золотым путём (`GOLDEN_PATH_QUEST_SPINE`, `src/data/goldenPath.ts`):
 * `main_goal` — нарративный якорь; `first_words` — вводная цепочка стихов/квартиры.
 */
export const DEFAULT_ACTIVE_QUEST_IDS: readonly [string, ...string[]] = [
  'main_goal',
  'first_words',
];
