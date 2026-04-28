# HUD: трекер квестов и лента цели в 3D

Чтобы не дублировать текст с полноэкранным сюжетом (`StoryRenderer`) и заставками, слой `GameOrchestrator` разделяет два элемента.

## Компактный трекер в `HUD` (TRACK // QUESTS)

Показ: `phase === 'game'`, есть активные цели в `questTracker`.

**Скрытие** (`suppressQuestStrip`): полноэкранный сюжетный оверлей `showStoryOverlay`, любой `activeCutsceneId` (в т.ч. `AnimeCutscene`), или 3D-интро `introOpening3dActive`. См. [GameOrchestrator.tsx](../src/ui/game/GameOrchestrator.tsx).

## Лента «Цель · локация» (`ExplorationObjectiveStrip`)

Фиксированная лента над 3D-обходом, привязка к `explorationSceneQuestObjectives`.

**Скрытие:** те же условия, что и для визуального спокойствия при VN — в т.ч. при `showStoryOverlay` (без одновременного дубля с блоком цели в сюжете). Не показывается при 3D-интро и активной заставке.

## Связанные файлы

- [GameOrchestrator.tsx](../src/ui/game/GameOrchestrator.tsx) — условия `suppressQuestStrip` и монтирования `ExplorationObjectiveStrip`
- [HUD.tsx](../src/ui/game/HUD.tsx) — проп `suppressQuestStrip`
- [ExplorationObjectiveStrip.tsx](../src/ui/game/ExplorationObjectiveStrip.tsx)
