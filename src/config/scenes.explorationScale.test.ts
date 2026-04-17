import { describe, expect, it } from 'vitest';
import { getExplorationCharacterModelScale } from './scenes';

describe('getExplorationCharacterModelScale', () => {
  it('returns >1 for wide plaza streets', () => {
    expect(getExplorationCharacterModelScale('street_night')).toBeGreaterThan(1);
    expect(getExplorationCharacterModelScale('street_winter')).toBeGreaterThan(1);
  });

  it('returns <1 for compact indoor kitchen', () => {
    expect(getExplorationCharacterModelScale('kitchen_night')).toBeLessThan(1);
  });

  it('defaults to 1 for unknown scene ids', () => {
    expect(getExplorationCharacterModelScale('server_room')).toBe(1);
  });
});
