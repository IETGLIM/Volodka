/* ─── Volodka RPG – floating text types ─── */

export type FloatingTextType =
  | 'xp'
  | 'karma'
  | 'skill'
  | 'damage'
  | 'heal'
  | 'item'
  | 'stress'
  | 'energy'
  | 'levelup'
  | 'credits'
  | 'custom';

export type FloatingTextPriority = 'normal' | 'high';

export interface FloatingTextEntry {
  id: number;
  text: string;
  type: FloatingTextType;
  x: number;
  y: number;
  /** Monotonic spawn time from performance.now(). */
  spawnTime: number;
  /** Pre-computed random X offset — fixed at spawn to keep render deterministic. */
  animateOffsetX: number;
  priority: FloatingTextPriority;
}

export const MAX_POOL_SIZE = 15;
export const TEXT_LIFETIME_MS = 1800;
