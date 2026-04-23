import { describe, expect, it } from 'vitest';
import {
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  getExplorationNpcModelScale,
  sanitizeExplorationPlayerPositionAgainstSpawn,
  sanitizeExplorationSceneId,
  suggestInteriorCharacterModelScale,
} from './scenes';
import { PLAYER_FEET_SPAWN_Y } from '@/lib/playerScaleConstants';

describe('getExplorationCharacterModelScale', () => {
  it('returns >1 for wide plaza streets', () => {
    expect(getExplorationCharacterModelScale('street_night')).toBeGreaterThan(1);
    expect(getExplorationCharacterModelScale('street_winter')).toBeGreaterThan(1);
  });

  it('returns <1 for compact indoor kitchen', () => {
    expect(getExplorationCharacterModelScale('kitchen_night')).toBeLessThan(1);
    expect(getExplorationCharacterModelScale('volodka_corridor')).toBeLessThan(1);
  });

  it('zarema_albert_room: NPC location scale matches player (unified human height)', () => {
    expect(getExplorationNpcModelScale('zarema_albert_room')).toBe(
      getExplorationCharacterModelScale('zarema_albert_room'),
    );
  });

  it('getExplorationNpcModelScale defaults to character scale when not overridden', () => {
    expect(getExplorationNpcModelScale('volodka_room')).toBe(getExplorationCharacterModelScale('volodka_room'));
  });

  it('suggestInteriorCharacterModelScale decreases as room footprint grows', () => {
    expect(suggestInteriorCharacterModelScale(8)).toBeGreaterThan(suggestInteriorCharacterModelScale(14));
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

describe('sanitizeExplorationPlayerPositionAgainstSpawn', () => {
  it('pulls floating legacy y down to floor spawn in zarema_albert_room', () => {
    const out = sanitizeExplorationPlayerPositionAgainstSpawn('zarema_albert_room', {
      x: 0,
      y: 1,
      z: 1.35,
      rotation: 0,
    });
    expect(out.y).toBe(PLAYER_FEET_SPAWN_Y);
    expect(out.x).toBe(0);
    expect(out.z).toBe(1.35);
  });

  it('does not touch y when spawn anchor is high (e.g. mvd)', () => {
    const out = sanitizeExplorationPlayerPositionAgainstSpawn('mvd', { x: 0, y: 1, z: 3, rotation: 0 });
    expect(out.y).toBe(1);
  });

  it('leaves sane floor height unchanged', () => {
    const pos = { x: 0, y: PLAYER_FEET_SPAWN_Y, z: 1.35, rotation: 0.2 };
    expect(sanitizeExplorationPlayerPositionAgainstSpawn('zarema_albert_room', pos)).toEqual(pos);
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
