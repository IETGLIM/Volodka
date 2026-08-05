import { describe, expect, it } from 'vitest';
import {
  MAX_AMBIENT_NPC_INSTANCES,
  resolveAmbientNpcCount,
  resolveAmbientNpcOpacity,
} from '@/engine/world/resolveAmbientNpcBudget';

describe('resolveAmbientNpcBudget', () => {
  it('boosts hero scene counts on higher tiers', () => {
    // AAA density: base lift 2 + tier boost + profile boost (street_night has 1)
    // low: 2+1+1=4 => 3+4=7, medium: 2+2+1=5 => 8, high: 2+4+1=7 =>10, ultra:2+6+1=9 =>12
    expect(resolveAmbientNpcCount('street_night', 3, 'low')).toBe(7);
    expect(resolveAmbientNpcCount('street_night', 3, 'medium')).toBe(8);
    expect(resolveAmbientNpcCount('street_night', 3, 'high')).toBe(10);
    expect(resolveAmbientNpcCount('street_night', 3, 'ultra')).toBe(12);
    expect(resolveAmbientNpcCount('street_night', 3, 'ultra')).toBeGreaterThan(
      resolveAmbientNpcCount('street_night', 3, 'medium'),
    );
  });

  it('boosts non-hero scenes with AAA base lift', () => {
    // factory_basement is standard: base lift 2 + tier boost (low/med 0, high 2, ultra 3)
    expect(resolveAmbientNpcCount('factory_basement', 2, 'low')).toBe(4);
    expect(resolveAmbientNpcCount('factory_basement', 2, 'medium')).toBe(4);
    expect(resolveAmbientNpcCount('factory_basement', 2, 'high')).toBe(6);
    expect(resolveAmbientNpcCount('factory_basement', 2, 'ultra')).toBe(7);
    // hero districts still more populated than non-hero at same tier
    expect(resolveAmbientNpcCount('street_night', 2, 'ultra')).toBeGreaterThan(
      resolveAmbientNpcCount('factory_basement', 2, 'ultra'),
    );
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
