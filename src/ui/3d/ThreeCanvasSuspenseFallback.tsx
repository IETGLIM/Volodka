'use client';

import { memo } from 'react';

/**
 * Лёгкий placeholder внутри `<Canvas>` пока Suspense ждёт GLB / ленивые чанки.
 * Вместо `fallback={null}` — иначе первый кадр «пустой», затем резко появляется сцена («прыжок»).
 */
export const ThreeCanvasSuspenseFallback = memo(function ThreeCanvasSuspenseFallback() {
  return (
    <group name="ThreeCanvasSuspenseFallback">
      <mesh position={[0, 0.55, 0]}>
        <icosahedronGeometry args={[0.1, 1]} />
        <meshBasicMaterial color="#64748b" wireframe />
      </mesh>
    </group>
  );
});
