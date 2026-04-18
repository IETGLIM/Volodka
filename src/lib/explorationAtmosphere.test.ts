import { describe, expect, it } from 'vitest';
import {
  getExplorationAmbientStressPerTick,
  getExplorationWeather,
  isDeepNight,
} from './explorationAtmosphere';

describe('explorationAtmosphere', () => {
  it('detects deep night hours', () => {
    expect(isDeepNight(23)).toBe(true);
    expect(isDeepNight(3)).toBe(true);
    expect(isDeepNight(12)).toBe(false);
  });

  it('street winter is snow', () => {
    expect(getExplorationWeather('street_winter', 14)).toBe('snow');
  });

  it('street night is worse at night', () => {
    const day = getExplorationAmbientStressPerTick('street_night', 14);
    const night = getExplorationAmbientStressPerTick('street_night', 23);
    expect(night).toBeGreaterThan(day);
  });

  it('indoor scenes have no ambient street stress', () => {
    expect(getExplorationAmbientStressPerTick('home_evening', 23)).toBe(0);
    expect(getExplorationAmbientStressPerTick('volodka_room', 23)).toBe(0);
  });
});
