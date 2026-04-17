'use client';

import type { InteractiveObjectConfig } from '@/config/scenes';

const INTERACT_RANGE = 2.6;

export function getNearestInteractiveObject(
  player: { x: number; z: number },
  objects: InteractiveObjectConfig[],
): InteractiveObjectConfig | null {
  let best: InteractiveObjectConfig | null = null;
  let bestD = INTERACT_RANGE;
  for (const o of objects) {
    const dx = o.position[0] - player.x;
    const dz = o.position[2] - player.z;
    const d = Math.hypot(dx, dz);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

export { INTERACT_RANGE };
