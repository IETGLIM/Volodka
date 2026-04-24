'use client';

/**
 * Шаг 1 (анти-мерцание / стабильный кадр): единая конфигурация R3F `<Canvas>` для 3D-обхода.
 *
 * - **`frameloop="always"`** — при `"demand"` кадр не рисуется без `invalidate()`; физика/камера
 *   могут обновляться без синхронного рендера → отставание и ощущение «мигания».
 * - **`logarithmicDepthBuffer: false`** — при `true` на части сцен возможны артефакты глубины.
 *
 * Шаг Б (после отключения поста мерцание осталось): жёстче **`antialias`**, **`powerPreference: 'high-performance'`**, без
 * логарифмического буфера глубины — см. **`getExplorationSceneGlProps`**; у **`Canvas`** в **`RPGGameCanvas`**
 * — **`dpr={[1, 1.5]}`**, **`PerformanceMonitor`** (drei), **`camera.near` / `far`** для точности Z.
 *
 * Потребитель: **`RPGGameCanvas`**. Не монтируйте второй Canvas для той же сцены.
 *
 * **WebGPU / тяжёлые compute:** клиентский билд не ограничен serverless-чанком, но размер WASM/шейдерного
 * чанка и лимиты драйвера (Chrome / Edge / Safari) критичны для первого кадра; тяжёлые пайплайны держите
 * за флагом и проверяйте на целевых GPU перед включением по умолчанию.
 * **Стриминг 3D-ассетов / память:** см. `docs/scene-streaming-spec.md` (координатор, `scene:enter`/`exit`, Rapier при выгрузке чанка).
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
