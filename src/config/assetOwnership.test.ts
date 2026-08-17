import { describe, expect, it } from 'vitest';
import {
  collectAssetOwnershipPublicUrls,
  getSceneSlotOwnership,
  isSceneAssetSystemAllowed,
  validateSceneAssetOwnershipConflicts,
} from '@/config/assetOwnership';
import { getSceneInteriorAssets } from '@/config/sceneInteriorAssets';

describe('assetOwnership', () => {
  it('has no conflicting exclusive owners per scene slot', () => {
    expect(validateSceneAssetOwnershipConflicts()).toEqual([]);
  });

  it('mounts authored apartment envelope on volodka_room via AuthoredInteriorShell', () => {
    expect(isSceneAssetSystemAllowed('volodka_room', 'interior_shell', 'AuthoredInteriorShell')).toBe(true);
    expect(isSceneAssetSystemAllowed('volodka_room', 'interior_shell', 'SceneInteriorAssets')).toBe(false);
    expect(getSceneInteriorAssets('volodka_room')).toEqual([]);
    expect(getSceneSlotOwnership('volodka_room', 'interior_shell')[0]?.owner).toBe('authored_shell');
  });

  it('keeps remaining hero walkable interiors on procedural envelopes (not Kenney exterior GLBs)', () => {
    for (const sceneId of [
      'cafe_evening',
      'office_day',
      'library_day',
      'albert_backroom',
      'guild_mainframe',
      'library_basement',
    ] as const) {
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'AuthoredInteriorShell')).toBe(false);
      expect(getSceneSlotOwnership(sceneId, 'interior_shell')[0]?.owner).toBe('procedural');
    }
  });

  it('keeps Kenney fallback shells owned by SceneInteriorAssets', () => {
    const ownership = getSceneSlotOwnership('volodka_corridor', 'interior_shell');
    expect(ownership).toHaveLength(1);
    expect(ownership[0].owner).toBe('kenney_fallback');
    expect(isSceneAssetSystemAllowed('volodka_corridor', 'interior_shell', 'SceneInteriorAssets')).toBe(true);
    expect(isSceneAssetSystemAllowed('volodka_corridor', 'interior_shell', 'AuthoredInteriorShell')).toBe(false);
  });

  it('mounts hero outdoor backdrops from scene visuals via AuthoredInteriorShell', () => {
    expect(isSceneAssetSystemAllowed('river_pier', 'interior_shell', 'AuthoredInteriorShell')).toBe(true);
    expect(isSceneAssetSystemAllowed('river_pier', 'interior_shell', 'SceneInteriorAssets')).toBe(false);
    expect(getSceneInteriorAssets('river_pier')).toEqual([]);
  });

  it('mounts industrial backdrop shells via SceneBackdropShell (not walkable envelopes)', () => {
    for (const sceneId of [
      'abandoned_factory',
      'factory_basement',
      'underground_bunker',
    ] as const) {
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'AuthoredInteriorShell')).toBe(true);
      expect(isSceneAssetSystemAllowed(sceneId, 'interior_shell', 'SceneInteriorAssets')).toBe(false);
      expect(getSceneInteriorAssets(sceneId)).toEqual([]);
    }
  });

  it('publishes ownership-owned deploy keep-list urls', () => {
    expect(collectAssetOwnershipPublicUrls()).toEqual(
      expect.arrayContaining([
        '/models/interiors/apartment_envelope.glb',
        '/models/interiors/cafe_interior.glb',
        '/models/polyhaven/street_lamp_01/street_lamp_01_1k.gltf',
      ]),
    );
  });

  it('documents prop_dressing ownership for dressed interior scenes', () => {
    expect(getSceneSlotOwnership('cafe_evening', 'prop_dressing')).toHaveLength(1);
    expect(isSceneAssetSystemAllowed('cafe_evening', 'prop_dressing', 'ScenePropDressing')).toBe(true);
    expect(getSceneSlotOwnership('volodka_room', 'prop_dressing')).toHaveLength(1);
  });
});
