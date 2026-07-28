/** Amber sparkle burst when a world pickup is collected. */

export type CollectBurstParticle = {
  /** Horizontal angle (radians). */
  angle: number;
  /** Outward speed in world units / s. */
  speed: number;
  /** Lifetime in seconds. */
  life: number;
  /** Start size. */
  size: number;
};

const DEFAULT_COUNT = 10;

/**
 * Deterministic-ish burst layout for unit tests and GPU mesh spawn.
 * Uses a simple hash of seed so the same zone id yields stable angles.
 */
export function buildPickupCollectBurst(
  seed: string,
  count = DEFAULT_COUNT,
): CollectBurstParticle[] {
  const n = Math.max(3, Math.min(24, count));
  const particles: CollectBurstParticle[] = [];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (i + 1), 16777619);
    const t = (h >>> 0) / 0xffffffff;
    const angle = (i / n) * Math.PI * 2 + t * 0.35;
    particles.push({
      angle,
      speed: 1.1 + t * 1.4,
      life: 0.35 + (1 - t) * 0.25,
      size: 0.04 + t * 0.05,
    });
  }
  return particles;
}

export const PICKUP_COLLECT_BURST_COLOR = '#fbbf24';
export const PICKUP_COLLECT_BURST_DURATION_MS = 480;
