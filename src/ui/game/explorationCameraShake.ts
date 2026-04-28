import type { Camera } from 'three';
import { eventBus } from '@/engine/EventBus';

/** Накопленная амплитуда тряски от успешных взаимодействий (централизованно через EventBus). */
let shakeStrength = 0;
let lastShakeTs = 0;
const SHAKE_COOLDOWN_MS = 80;

let isInitialized = false;

function ensureInit(): void {
  if (isInitialized) return;
  if (typeof window === 'undefined') return;
  isInitialized = true;
  eventBus.on('ui:interaction_feedback', (e) => {
    if (e.kind === 'success') {
      if (e.timestamp - lastShakeTs < SHAKE_COOLDOWN_MS) return;
      lastShakeTs = e.timestamp;
      const id = e.actionId;
      const delta =
        id === 'loot' ? 0.015 : id === 'npc' ? 0.01 : 0.02;
      shakeStrength = Math.min(shakeStrength + delta, 0.08);
    }
  });
}

/**
 * Декрементирует амплитуду и добавляет кадровый оффсет к позиции камеры (после damp3 + lookAt).
 */
export function applyExplorationInteractionCameraShake(camera: Camera, deltaSec: number): void {
  ensureInit();
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
