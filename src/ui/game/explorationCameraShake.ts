import type { Camera } from 'three';
import type { MutableRefObject } from 'react';

/**
 * Декрементирует амплитуду и добавляет кадровый оффсет к позиции камеры (после damp3 + lookAt).
 */
export function applyExplorationInteractionCameraShake(
  camera: Camera,
  shakeAmpRef: MutableRefObject<number>,
  deltaSec: number,
): void {
  let a = shakeAmpRef.current;
  if (a < 1e-6) return;
  camera.position.x += (Math.random() - 0.5) * a * 2.2;
  camera.position.y += (Math.random() - 0.5) * a * 1.35;
  camera.position.z += (Math.random() - 0.5) * a * 2.2;
  a *= Math.exp(-18 * deltaSec);
  shakeAmpRef.current = a;
}

export function bumpExplorationInteractionShake(
  shakeAmpRef: MutableRefObject<number>,
  amount = 0.018,
  cap = 0.04,
): void {
  shakeAmpRef.current = Math.min(cap, shakeAmpRef.current + amount);
}
