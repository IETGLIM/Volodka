import { describe, expect, it } from 'vitest';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { resolveEnvAnimationsForTier } from '@/engine/world/resolveEnvAnimationBudget';

const SAMPLE: EnvAnimation[] = [
  { id: 'a', type: 'light_flicker', position: [0, 0, 0], config: {} },
  { id: 'b', type: 'neon_pulse', position: [0, 0, 0], config: {} },
  { id: 'c', type: 'drip', position: [0, 0, 0], config: {} },
  { id: 'd', type: 'fan_spin', position: [0, 0, 0], config: {} },
  { id: 'e', type: 'steam_rise', position: [0, 0, 0], config: {} },
];

describe('resolveEnvAnimationsForTier', () => {
  it('keeps all animations on hero scenes', () => {
    expect(resolveEnvAnimationsForTier('street_night', SAMPLE, 'low')).toHaveLength(SAMPLE.length);
  });

  it('trims animations on standard scenes at low tier', () => {
    expect(resolveEnvAnimationsForTier('factory_basement', SAMPLE, 'low')).toHaveLength(2);
    expect(resolveEnvAnimationsForTier('factory_basement', SAMPLE, 'medium')).toHaveLength(4);
  });
});
