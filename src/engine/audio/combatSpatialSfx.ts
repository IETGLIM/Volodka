/**
 * Spatial pan mapping for combat SFX — left/right stereo by enemy archetype.
 * Uses fixed stereo pan; HRTF is attempted in AudioEngine when supported.
 */

import type { EnemyType } from '@/shared/types/game';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';

/** Resolve stereo pan (-1 left … +1 right) for an enemy type. */
export function getEnemySpatialPan(enemyType: EnemyType): number {
  const template = ENEMY_TEMPLATES[enemyType];
  return template.spatialPan ?? 0;
}

/** Pan for player-side hits (enemy struck the player). */
export function getPlayerHitPan(enemyType: EnemyType): number {
  const enemyPan = getEnemySpatialPan(enemyType);
  return Math.max(-1, Math.min(1, enemyPan * 0.85));
}

/** Pan for enemy-side hits (player struck the enemy). */
export function getEnemyHitPan(enemyType: EnemyType): number {
  return getEnemySpatialPan(enemyType);
}
