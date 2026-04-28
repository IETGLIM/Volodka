# Приоритет клавиши E в обходе

Реализация: [`resolveExplorationInteractionPriority`](../src/lib/explorationPrimaryInteraction.ts).

## Правила

1. Среди кандидатов (NPC, интерактивный объект из сцены, триггер с `requiresInteraction`) выбирается **ближайший** по дистанции до якоря (NPC — xz; объект — логика `getNearestInteractiveObjectWithDistance`; триггер — центр AABB в XZ).
2. При почти равной дистанции (в пределах `PRIORITY_TIE_EPS` ≈ 0.2 м): **NPC > объект > триггер** — диалог не перехватывается дверным/крупным боксом.
3. Триггер с `interactionId` ведёт в реестр (`registry` → `tryExecute`); без `interactionId` — `story_trigger` (сюжетный узел / cutscene).

## См. также

- [exploration-interaction-inventory.md](./exploration-interaction-inventory.md)
- [quest-scene-pipeline.md](./quest-scene-pipeline.md)
