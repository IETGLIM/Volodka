'use client';

import type { InteractiveObjectConfig } from '@/config/scenes';

/** Согласован с радиусом NPC и подсказками: чуть шире старого 2.6 м, чтобы E стабильно ловил стол/ноутбуки. */
const INTERACT_RANGE = 3.25;

export function getNearestInteractiveObjectWithDistance(
  player: { x: number; z: number },
  objects: InteractiveObjectConfig[],
): { object: InteractiveObjectConfig; distance: number } | null {
  let best: InteractiveObjectConfig | null = null;
  let bestD = Number.POSITIVE_INFINITY;
  for (const o of objects) {
    const dx = o.position[0] - player.x;
    const dz = o.position[2] - player.z;
    const d = Math.hypot(dx, dz);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  if (!best || bestD > INTERACT_RANGE) return null;
  return { object: best, distance: bestD };
}

export function getNearestInteractiveObject(
  player: { x: number; z: number },
  objects: InteractiveObjectConfig[],
): InteractiveObjectConfig | null {
  return getNearestInteractiveObjectWithDistance(player, objects)?.object ?? null;
}

export { INTERACT_RANGE };
