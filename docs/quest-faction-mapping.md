# Квесты: строка `faction` и `factionId`

В журнале квестов группировка использует **строку** `Quest.faction` (UX, свободный ярлык). Для учёта квестов в репутации фракций (`factionStore`, `completeQuestForFaction`) задан канонический **`factionId`: `FactionId`**.

## Соответствие ярлыков

| `faction` (журнал) | `factionId` | Примечание |
|--------------------|-------------|------------|
| «Работа · IT» | `it_workers` | IT-цепочки, дежурства, стойки |
| «Район» | `locals` | двор, лавка, быт |

Квесты без `faction` / `factionId` не попадают в список завершённых у фракции, но нормально отображаются в общем списке.

## Где применяется

- `src/lib/questRewards.ts` — при завершении квеста, если в `QUEST_DEFINITIONS[questId]` есть `factionId`, вызывается `completeQuestForFaction`.
- Исходные определения: `src/data/quests.ts`.
