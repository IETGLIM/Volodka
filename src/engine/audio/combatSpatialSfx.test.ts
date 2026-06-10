import { describe, expect, it } from 'vitest';
import {
  getEnemyHitPan,
  getEnemySpatialPan,
  getPlayerHitPan,
} from '@/engine/audio/combatSpatialSfx';

describe('combatSpatialSfx', () => {
  it('maps primary enemy types to distinct stereo pans', () => {
    expect(getEnemySpatialPan('system_daemon')).toBeLessThan(0);
    expect(getEnemySpatialPan('corporate_golem')).toBe(0);
    expect(getEnemySpatialPan('shadow_agent')).toBeGreaterThan(0);
  });

  it('derives player hit pan from enemy position', () => {
    expect(getPlayerHitPan('shadow_agent')).toBeCloseTo(0.595, 2);
    expect(getEnemyHitPan('system_daemon')).toBe(-0.65);
  });
});
