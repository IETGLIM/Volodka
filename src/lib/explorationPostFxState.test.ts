import { describe, expect, it } from 'vitest';
import {
  explorationBloomIntensityFromPlayer,
  explorationChromaOffsetFromStress,
  isExplorationCyberGradeScene,
} from './explorationPostFxState';

describe('explorationPostFxState', () => {
  it('bloom растёт с креативом и слегка с кармой', () => {
    const low = explorationBloomIntensityFromPlayer(0, 50);
    const high = explorationBloomIntensityFromPlayer(100, 100);
    expect(high).toBeGreaterThan(low);
  });

  it('хрома усиливается от стресса и паники', () => {
    const calm = explorationChromaOffsetFromStress(0, false);
    const hot = explorationChromaOffsetFromStress(80, true);
    expect(hot.x).toBeGreaterThan(calm.x);
  });

  it('кибер-грейд для volodka_room, blue_pit, district, mvd', () => {
    expect(isExplorationCyberGradeScene('volodka_room')).toBe(true);
    expect(isExplorationCyberGradeScene('blue_pit')).toBe(true);
    expect(isExplorationCyberGradeScene('district')).toBe(true);
    expect(isExplorationCyberGradeScene('mvd')).toBe(true);
    expect(isExplorationCyberGradeScene('memorial_park')).toBe(false);
  });
});
