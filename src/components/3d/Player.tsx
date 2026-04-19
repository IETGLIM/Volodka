'use client';

/**
 * Шаг 2 (анти-мерцание): «игрок» в 3D — это **`PhysicsPlayer`** (`@/components/game/PhysicsPlayer`).
 *
 * **Источник истины для позиции меша** — только Rapier **`RigidBody`** (kinematic + `setNextKinematicTranslation`
 * в `useBeforePhysicsStep`). Дочерний `group` с GLB **не** должен получать `position` из Zustand/`useEffect`:
 * иначе двойное обновление (физика + стор) даёт скачки и мерцание.
 *
 * Колбэк **`onPositionChange`** — только для камеры / throttled-записи в стор, не для сдвига визуала.
 */

export {
  PhysicsPlayer,
  PhysicsPlayer as Player,
  PhysicsPlayer as default,
  type PhysicsPlayerProps,
  type PhysicsPlayerRef,
} from '@/components/game/PhysicsPlayer';
