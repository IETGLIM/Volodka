import { describe, expect, it } from 'vitest';
import { shouldUnloadSceneGpuOnTransition } from './sceneChunkGpuLifecycle';

describe('shouldUnloadSceneGpuOnTransition', () => {
  it('skips unload when hopping between a derived scene and its parent', () => {
    expect(shouldUnloadSceneGpuOnTransition('guild_mainframe', 'office_day')).toBe(false);
    expect(shouldUnloadSceneGpuOnTransition('city_square', 'street_night')).toBe(false);
    expect(shouldUnloadSceneGpuOnTransition('pier_evening', 'river_pier')).toBe(false);
  });

  it('unloads when leaving a shared root for a different scene family', () => {
    expect(shouldUnloadSceneGpuOnTransition('guild_mainframe', 'street_night')).toBe(true);
    expect(shouldUnloadSceneGpuOnTransition('office_day', 'park_day')).toBe(true);
  });

  it('skips unload for identical scene ids', () => {
    expect(shouldUnloadSceneGpuOnTransition('street_night', 'street_night')).toBe(false);
  });
});
