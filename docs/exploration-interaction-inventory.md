# Инвентаризация взаимодействий (E) в обходе

Канон: каждый `interactionId` из [`triggerZones.ts`](../src/data/triggerZones.ts) (поле `interactionId` у зон с `requiresInteraction`) **должен** существовать в [`explorationInteractionRegistry`](../src/game/interactions/registerBaseInteractions.ts) после `registerBaseInteractions()`.

Исключения без зоны (allowlist): см. `REGISTRY_IDS_WITHOUT_TRIGGER_ZONE` в [`explorationInteractionCoverage.test.ts`](../src/game/interactions/explorationInteractionCoverage.test.ts) (например `zarema_resonance_ping` — вызов из другого кода).

## Реестр (актуальный список в тесте)

Ожидаемые id: `npc_intro`, `quest_district_chronicle`, `quest_mvd_bureau`, `quest_zarema_hearth`, `quest_zarema_tv`, `volodka_rack_hack`, `zarema_resonance_ping`.

## Проверка

```bash
npx vitest run src/game/interactions/explorationInteractionCoverage.test.ts
```

При добавлении нового квеста с E в 3D: зона в `STORY_TRIGGERS` + обработчик в `registerBaseInteractions` + ребро графа в `explorationQuestGraphs.ts` по [quest-scene-pipeline.md](./quest-scene-pipeline.md).

## Приоритет E

См. [exploration-interaction-priority.md](./exploration-interaction-priority.md).
