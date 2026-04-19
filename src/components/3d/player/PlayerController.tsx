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
 * Отдельного runtime-`PlayerController` в проекте нет — этот файл навигация по архитектуре.
 */

export {};
