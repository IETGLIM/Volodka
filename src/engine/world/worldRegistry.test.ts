import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '@/config/sceneIds';
import {
  SCENE_CHUNK_COORD,
  WORLD_LOCATIONS,
  getChunkForScene,
  getWorldLocation,
} from './worldRegistry';

describe('worldRegistry scene ownership', () => {
  it('assigns a unique chunk coord to every SCENE_CHUNK_COORD entry', () => {
    const seen = new Map<string, string>();
    for (const [sceneId, coord] of Object.entries(SCENE_CHUNK_COORD)) {
      const key = `${coord.x},${coord.z}`;
      expect(seen.has(key), `collision at (${key}): ${seen.get(key)} vs ${sceneId}`).toBe(false);
      seen.set(key, sceneId);
    }
  });

  it('registers every SceneId in WORLD_LOCATIONS (no downtown fallback)', () => {
    for (const sceneId of SCENE_IDS) {
      expect(WORLD_LOCATIONS[sceneId], `missing WORLD_LOCATIONS.${sceneId}`).toBeDefined();
    }
  });

  it('does not fall back procedural_aaa / city_square to street chunk (0,0)', () => {
    expect(getChunkForScene('procedural_aaa')).toEqual({ x: 3, z: 0 });
    expect(getChunkForScene('city_square')).toEqual({ x: 1, z: -3 });
    expect(getChunkForScene('underground_bunker')).toEqual({ x: -2, z: 1 });
  });

  it('anchors bunker to factory basement (schedule parent alignment)', () => {
    expect(getWorldLocation('underground_bunker').anchorSceneId).toBe('factory_basement');
    expect(getWorldLocation('underground_bunker').regionId).toBe('industrial_quarter');
  });
});
