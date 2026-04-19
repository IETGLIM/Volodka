'use client';

/**
 * Шаг 1 (анти-мерцание / стабильный кадр): единая конфигурация R3F `<Canvas>` для 3D-обхода.
 *
 * - **`frameloop="always"`** — при `"demand"` кадр не рисуется без `invalidate()`; физика/камера
 *   могут обновляться без синхронного рендера → отставание и ощущение «мигания».
 * - **`logarithmicDepthBuffer: false`** — при `true` на части сцен возможны артефакты глубины.
 *
 * Шаг Б (после отключения поста мерцание осталось): жёстче **`antialias`**, **`powerPreference`**, без
 * логарифмического буфера глубины — см. **`getExplorationSceneGlProps`**; у **`Canvas`** в **`RPGGameCanvas`**
 * — **`camera.near` / `far`** для точности Z (не чрезмерный диапазон).
 *
 * Потребитель: **`RPGGameCanvas`**. Не монтируйте второй Canvas для той же сцены.
 *
 * CLS: контейнер 3D-обхода — фиксированный вьюпорт (**`EXPLORATION_GAME_VIEWPORT_CLASS`**), без смены
 * размеров после гидрации; сам `<Canvas>` внутри заполняет родителя (**`block h-full w-full`** в `RPGGameCanvas`).
 */

import type { CanvasProps } from '@react-three/fiber';

/** Обёртка вокруг `<RPGGameCanvas>` в `GameOrchestrator` — жёсткий полноэкранный слот под WebGL. */
export const EXPLORATION_GAME_VIEWPORT_CLASS =
  'fixed inset-0 z-[12] h-svh min-h-0 w-screen max-w-[100vw] overflow-hidden touch-manipulation';

export const EXPLORATION_SCENE_FRAMELOOP: NonNullable<CanvasProps['frameloop']> = 'always';

export function getExplorationSceneGlProps(visualLite: boolean, narrow: boolean) {
  void visualLite;
  void narrow;
  return {
    antialias: true,
    alpha: false,
    stencil: false,
    logarithmicDepthBuffer: false as const,
    powerPreference: 'high-performance' as const,
  };
}
