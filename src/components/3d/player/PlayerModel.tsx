'use client';

/**
 * Стабилизация позиции игрока (шаг 3): **группа визуала** (`PlayerVisualRoot` в **`PhysicsPlayer`**) **не**
 * подписана на **`exploration.playerPosition`** из Zustand. Не добавляйте **`useEffect`**, который копирует
 * стор в **`group.position`** — второй источник перемещения даст джиттер и рассинхрон с Rapier.
 *
 * Реальная загрузка GLB и анимации — **`GLBPlayerModel`** внутри **`RigidBody`** в **`PhysicsPlayer`**.
 * Шаг 4 (root motion): см. **`AnimationController.tsx`** в этой папке.
 *
 * Отдельного runtime-`PlayerModel` в проекте нет — этот файл навигация по архитектуре.
 */

export {};
