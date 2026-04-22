import { describe, expect, it } from 'vitest';
import {
  getExplorationCharacterModelScale,
  getExplorationLocomotionScale,
  getExplorationNpcModelScale,
  getExplorationPlayerGlbVisualUniformMultiplier,
  getExplorationPlayerGltfTargetMeters,
  sanitizeExplorationSceneId,
  suggestInteriorCharacterModelScale,
} from './scenes';
import { PLAYER_GLB_TARGET_VISUAL_METERS } from '@/lib/playerScaleConstants';

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

describe('getExplorationPlayerGltfTargetMeters', () => {
  it('zarema_albert_room overrides GLB target height below global default', () => {
    expect(getExplorationPlayerGltfTargetMeters('zarema_albert_room')).toBe(0.78);
    expect(getExplorationPlayerGltfTargetMeters('zarema_albert_room')).toBeLessThan(
      PLAYER_GLB_TARGET_VISUAL_METERS,
    );
  });

  it('volodka_room uses explicit lower GLB target for tight interior', () => {
    expect(getExplorationPlayerGltfTargetMeters('volodka_room')).toBe(0.66);
    expect(getExplorationPlayerGltfTargetMeters('volodka_room')).toBeLessThan(PLAYER_GLB_TARGET_VISUAL_METERS);
  });

  it('falls back to PLAYER_GLB_TARGET_VISUAL_METERS when scene has no override', () => {
    expect(getExplorationPlayerGltfTargetMeters('volodka_corridor')).toBe(PLAYER_GLB_TARGET_VISUAL_METERS);
    expect(getExplorationPlayerGltfTargetMeters('server_room')).toBe(PLAYER_GLB_TARGET_VISUAL_METERS);
  });
});

describe('getExplorationPlayerGlbVisualUniformMultiplier', () => {
  it('volodka_room uses explicit multiplier below 1', () => {
    expect(getExplorationPlayerGlbVisualUniformMultiplier('volodka_room')).toBe(0.22);
  });

  it('defaults to 1 when not configured', () => {
    expect(getExplorationPlayerGlbVisualUniformMultiplier('kitchen_night')).toBe(1);
    expect(getExplorationPlayerGlbVisualUniformMultiplier('server_room')).toBe(1);
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
