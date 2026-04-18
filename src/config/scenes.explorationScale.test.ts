import { describe, expect, it } from 'vitest';
import {
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  sanitizeExplorationSceneId,
} from './scenes';

describe('getExplorationCharacterModelScale', () => {
  it('returns >1 for wide plaza streets', () => {
    expect(getExplorationCharacterModelScale('street_night')).toBeGreaterThan(1);
    expect(getExplorationCharacterModelScale('street_winter')).toBeGreaterThan(1);
  });

  it('returns <1 for compact indoor kitchen', () => {
    expect(getExplorationCharacterModelScale('kitchen_night')).toBeLessThan(1);
    expect(getExplorationCharacterModelScale('volodka_corridor')).toBeLessThan(1);
  });

  it('defaults to 1 for unknown scene ids', () => {
    expect(getExplorationCharacterModelScale('server_room')).toBe(1);
  });
});

describe('sanitizeExplorationSceneId', () => {
  it('keeps valid scene ids', () => {
    expect(sanitizeExplorationSceneId('volodka_room')).toBe('volodka_room');
    expect(sanitizeExplorationSceneId('home_evening')).toBe('home_evening');
  });

  it('falls back to volodka_room for garbage or unknown', () => {
    expect(sanitizeExplorationSceneId('typo_scene')).toBe('volodka_room');
    expect(sanitizeExplorationSceneId(null)).toBe('volodka_room');
    expect(sanitizeExplorationSceneId(123)).toBe('volodka_room');
  });
});

describe('getExplorationLocomotionScale', () => {
  it('is >1 on streets but slightly below character model scale', () => {
    const m = getExplorationCharacterModelScale('street_night');
    const l = getExplorationLocomotionScale('street_night');
    expect(l).toBeGreaterThan(1);
    expect(l).toBeLessThan(m);
  });

  it('is <1 for compact indoor scenes with configured locomotion', () => {
    expect(getExplorationLocomotionScale('kitchen_night')).toBeLessThan(1);
    expect(getExplorationLocomotionScale('volodka_corridor')).toBeLessThan(1);
  });

  it('defaults to 1 for unknown scene ids', () => {
    expect(getExplorationLocomotionScale('server_room')).toBe(1);
  });
});
