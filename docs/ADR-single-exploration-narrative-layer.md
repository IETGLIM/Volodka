# ADR: единый слой exploration + те же narrative-данные

## Статус

Принято (2026-04-27). Дополняет поток «3D как основной канал» без параллельного «VN-режима» в роутинге.

## Контекст

Исторически в продукте фигурировали разные способы показать сюжет (отдельный визуальный слой и полевой 3D). Целевая архитектура: **одна живая exploration-сцена** (`RPGGameCanvas`) как единственный игровой слой в фазе `game`, а узлы `STORY_NODES` и диалоговые деревья остаются **источником правды** для нарратива.

## Решение

1. **Роутинг приложения** — по-прежнему `AppPhase`: `loading` → `intro` / `menu` → `game`. Внутри `game` нет второго маршрута «режим 1 / режим 2»; переключение идёт через `GameMode` полевого цикла (`exploration` | `dialogue` | `cutscene` | `combat`) и фазу обхода `useGamePhaseStore` (`gameplay` | `intro_cutscene`).

2. **Сюжет поверх 3D** — если у текущего узла есть контент для оверлея (текст, выборы, `autoNext`, типы `poem_game` / `interpretation`), показывается `StoryRenderer` **над** тем же канвасом. Правило вынесено в `storyNodeShowsStoryOverlay` (`src/lib/storyOverlayEligibility.ts`); **видимость** оверлея считается в `useGameUiLayout` от переданного `currentNode`, без дублирования флага снаружи.

3. **Конфликты слоёв** — на время 3D-вводной (`explorationPhase === 'intro_cutscene'`) нижний `StoryRenderer` скрывается, чтобы не дублировать подписи с `IntroCutsceneOverlays`. В `dialogue` / `cutscene` оверлей сюжетного узла не показывается; диалог — `DialogueRenderer`, кат-сцены — `AnimeCutscene`.

4. **Сохранения** — значение `gameMode: 'visual-novel'` в старых сейвах по-прежнему нормализуется в `exploration` при загрузке (`gameStore`, `saveManager`); это миграция данных, не активный режим UI.

## Последствия

- Новые фичи нарратива добавляют узлы/переходы в данных; не вводят отдельный «режим рендера» без ADR.
- Тесты золотого пути и целостности (`goldenPath.test.ts`, `narrativePoetryIntegrity.test.ts`) обязательны при изменении `storyNodes` / квестовых связок.

## Связанные файлы

- `src/ui/game/GameOrchestrator.tsx` — композиция 3D + оверлеи + диалог.
- `src/hooks/useGameUiLayout.ts` — единая логика `showStoryOverlay`.
- `src/lib/storyOverlayEligibility.ts` — когда узел «тянет» оверлей.
