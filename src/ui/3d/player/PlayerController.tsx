'use client';

/**
 * Стабилизация рендера игрока (шаг 1): **позиция меша** задаётся только **`RigidBody`** в
 * **`PhysicsPlayer`**; в Zustand **`setPlayerPosition` не вызывается из цикла позиции** —
 * см. **`handlePositionChange`** в **`RPGGameCanvas`** + мост **`lib/explorationLivePlayerBridge`**.
 *
 * Шаг 2: UI в обходе, которому нужна актуальная позиция без стора на каждом кадре, читает мост
 * (**`getExplorationLivePlayerPositionOrNull`**) с тиком **`useExplorationLivePlayerTick`** (`MiniMap`, **`TutorialOverlay`**);
 * перед сохранением стор подмешивается из моста в **`saveGame`**.
 *
 * Шаг 3: группа визуала не двигается из стора — см. **`PlayerModel.tsx`** и комментарий у **`PlayerVisualRoot`**
 * в **`PhysicsPlayer`**.
 *
 * Шаг 4: анимации без root translation на корневых костях — см. **`AnimationController.tsx`** (папка `player`) и
 * **`lib/stripExplorationPlayerRootMotionFromClips`**.
 *
 * Шаг 5 (ручной игровой процесс, мерцание / двойное движение): в сборке обхода пройти **все доступные
 * локации**; **вперёд/назад**, **повороты** (визуал совпадает с капсулой, без «двойника»); **стены** —
 * без проскальзывания и рывков при удержании клавиши; **NPC** — стабильное скольжение вдоль коллайдера,
 * без дёрганья позиции модели относительно мира. Автоматическая подстраховка данных сцен —
 * **`config/explorationScenesMovementSanity.test.ts`** + полный **`vitest`**.
 *
 * Диагностика «мерцание от физики или от GLB»: **`NEXT_PUBLIC_EXPLORATION_PLAYER_DEBUG_PRIMITIVE=1`**
 * (пересборка) — в **`PhysicsPlayer`** вместо **`GLBPlayerModel`** рисуется красный бокс по размеру капсулы;
 * см. **`lib/explorationPlayerDebugPrimitive.ts`**, проп **`debugPlayerPrimitive`**.
 *
 * Отдельного runtime-`PlayerController` в проекте нет — этот файл навигация по архитектуре.
 */

export {};
