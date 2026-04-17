import { describe, expect, it } from 'vitest';
import { getAtmosphereGenreForScene } from './atmosphereMusicGenres';

describe('getAtmosphereGenreForScene', () => {
  it('maps known scenes', () => {
    expect(getAtmosphereGenreForScene('battle')).toBe('brutal_heavy');
    expect(getAtmosphereGenreForScene('kitchen_night')).toBe('chiptune_8bit');
    expect(getAtmosphereGenreForScene('dream')).toBe('ambient');
  });

  it('defaults to ambient for unknown ids', () => {
    expect(getAtmosphereGenreForScene('unknown_scene_xyz')).toBe('ambient');
  });
});
