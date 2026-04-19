'use client';

/**
 * Шаг 1 (анти-мерцание / стабильный кадр): единая конфигурация R3F `<Canvas>` для 3D-обхода.
 *
 * - **`frameloop="always"`** — при `"demand"` кадр не рисуется без `invalidate()`; физика/камера
 *   могут обновляться без синхронного рендера → отставание и ощущение «мигания».
 * - **`logarithmicDepthBuffer: false`** — при `true` на части сцен возможны артефакты глубины.
 *
 * Потребитель: **`RPGGameCanvas`**. Не монтируйте второй Canvas для той же сцены.
 */

import type { CanvasProps } from '@react-three/fiber';

export const EXPLORATION_SCENE_FRAMELOOP: NonNullable<CanvasProps['frameloop']> = 'always';

export function getExplorationSceneGlProps(visualLite: boolean, narrow: boolean) {
  return {
    antialias: !visualLite,
    alpha: false,
    stencil: false,
    logarithmicDepthBuffer: false as const,
    powerPreference: (visualLite || narrow ? 'default' : 'high-performance') as
      | 'default'
      | 'low-power'
      | 'high-performance',
  };
}
