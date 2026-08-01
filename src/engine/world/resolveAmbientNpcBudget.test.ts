import { describe, expect, it } from 'vitest';
import {
  MAX_AMBIENT_NPC_INSTANCES,
  resolveAmbientNpcCount,
  resolveAmbientNpcOpacity,
} from '@/engine/world/resolveAmbientNpcBudget';

describe('resolveAmbientNpcBudget', () => {
  it('boosts hero scene counts on higher tiers', () => {
    // street_night has ambientNpcCountBoost: 1 even on low (profile boost, not tier).
    expect(resolveAmbientNpcCount('street_night', 3, 'low')).toBe(4);
    expect(resolveAmbientNpcCount('street_night', 3, 'medium')).toBeGreaterThan(4);
    expect(resolveAmbientNpcCount('street_night', 3, 'ultra')).toBeGreaterThan(
      resolveAmbientNpcCount('street_night', 3, 'medium'),
    );
  });

  it('does not boost non-hero scenes', () => {
    expect(resolveAmbientNpcCount('factory_basement', 2, 'ultra')).toBe(2);
  });

  it('caps at MAX_AMBIENT_NPC_INSTANCES', () => {
    expect(resolveAmbientNpcCount('park_day', 5, 'ultra')).toBeLessThanOrEqual(
      MAX_AMBIENT_NPC_INSTANCES,
    );
  });

  it('raises opacity on hero scenes', () => {
    expect(resolveAmbientNpcOpacity('cafe_evening', 0.6)).toBeGreaterThan(0.6);
    expect(resolveAmbientNpcOpacity('factory_basement', 0.6)).toBe(0.6);
  });
});
