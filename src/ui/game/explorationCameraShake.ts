import type { Camera } from 'three';
import { eventBus } from '@/engine/EventBus';

/** Накопленная амплитуда тряски от успешных взаимодействий (централизованно через EventBus). */
let shakeStrength = 0;

let busAttached = false;

function attachInteractionShakeBus(): void {
  if (busAttached || typeof window === 'undefined') return;
  busAttached = true;
  eventBus.on('ui:interaction_feedback', (e) => {
    if (e.kind === 'success') {
      shakeStrength = Math.min(shakeStrength + 0.02, 0.08);
    }
  });
}

/**
 * Декрементирует амплитуду и добавляет кадровый оффсет к позиции камеры (после damp3 + lookAt).
 */
export function applyExplorationInteractionCameraShake(camera: Camera, deltaSec: number): void {
  attachInteractionShakeBus();
  const a = shakeStrength;
  if (a < 1e-6) return;
  camera.position.x += (Math.random() - 0.5) * a * 2.2;
  camera.position.y += (Math.random() - 0.5) * a * 1.35;
  camera.position.z += (Math.random() - 0.5) * a * 2.2;
  shakeStrength *= Math.exp(-6 * deltaSec);
}

/** Для тестов / отладки стабильности шейка. */
export function getExplorationCameraShakeStrengthForTests(): number {
  return shakeStrength;
}
