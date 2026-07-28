import { describe, expect, it } from 'vitest';
import { shouldUnloadSceneGpuOnTransition } from './sceneChunkGpuLifecycle';

describe('shouldUnloadSceneGpuOnTransition', () => {
  it('skips unload when hopping between a derived scene and its parent', () => {
    expect(shouldUnloadSceneGpuOnTransition('pier_evening', 'river_pier')).toBe(false);
  });

  it('unloads dedicated extension rooms (own GPU chunk) when leaving family', () => {
    expect(shouldUnloadSceneGpuOnTransition('guild_mainframe', 'office_day')).toBe(true);
    expect(shouldUnloadSceneGpuOnTransition('city_square', 'street_night')).toBe(true);
    expect(shouldUnloadSceneGpuOnTransition('underground_bunker', 'factory_basement')).toBe(true);
    expect(shouldUnloadSceneGpuOnTransition('library_basement', 'library_day')).toBe(true);
    expect(shouldUnloadSceneGpuOnTransition('albert_backroom', 'cafe_evening')).toBe(true);
  });

  it('unloads when leaving a shared root for a different scene family', () => {
    expect(shouldUnloadSceneGpuOnTransition('guild_mainframe', 'street_night')).toBe(true);
    expect(shouldUnloadSceneGpuOnTransition('office_day', 'park_day')).toBe(true);
  });

  it('skips unload for identical scene ids', () => {
    expect(shouldUnloadSceneGpuOnTransition('street_night', 'street_night')).toBe(false);
  });
});
