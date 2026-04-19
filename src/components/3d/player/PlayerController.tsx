'use client';

/**
 * Стабилизация рендера игрока (шаг 1): **позиция меша** задаётся только **`RigidBody`** в
 * **`PhysicsPlayer`**; в Zustand **`setPlayerPosition` не вызывается из цикла позиции** —
 * см. **`handlePositionChange`** в **`RPGGameCanvas`** + мост **`lib/explorationLivePlayerBridge`**.
 *
 * Отдельного runtime-`PlayerController` в проекте нет — этот файл навигация по архитектуре.
 */

export {};
