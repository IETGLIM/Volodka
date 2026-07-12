/* ─── Volodka RPG – Spawn director ─── */
/* Resolves player/NPC spawn when entering districts or instanced locations. */

import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId } from '@/shared/types/game';
import type { WorldLocationKind } from './types';
import {
  getWorldLocation,
  isInstancedLocation,
} from './worldRegistry';

export type SpawnContext = 'enter' | 'exit' | 'fast_travel' | 'story' | 'combat';

export interface SpawnRequest {
  sceneId: SceneId;
  kind?: WorldLocationKind;
  context?: SpawnContext;
  /** Override spawn from portal / trigger */
  portalSpawn?: [number, number, number];
}

export interface SpawnResolution {
  sceneId: SceneId;
  spawn: [number, number, number];
  rotation: number;
  /** When exiting an instanced location, return to this district scene */
  returnDistrictSceneId?: SceneId;
  returnDistrictSpawn?: [number, number, number];
}

export class SpawnDirector {
  resolve(request: SpawnRequest): SpawnResolution {
    const { sceneId, portalSpawn, context = 'enter' } = request;
    const loc = getWorldLocation(sceneId);
    const config = SCENE_CONFIG[sceneId];

    if (portalSpawn) {
      return {
        sceneId,
        spawn: [...portalSpawn] as [number, number, number],
        rotation: config?.initialRotation ?? 0,
      };
    }

    const defaultSpawn = config?.spawnPoint ?? ([0, 0.01, 0] as [number, number, number]);

    if (context === 'exit' && isInstancedLocation(sceneId) && loc.anchorSceneId) {
      return {
        sceneId: loc.anchorSceneId,
        spawn: loc.districtSpawn ?? defaultSpawn,
        rotation: SCENE_CONFIG[loc.anchorSceneId]?.initialRotation ?? 0,
        returnDistrictSceneId: loc.anchorSceneId,
        returnDistrictSpawn: loc.districtSpawn,
      };
    }

    return {
      sceneId,
      spawn: [...defaultSpawn] as [number, number, number],
      rotation: config?.initialRotation ?? 0,
      returnDistrictSceneId: loc.anchorSceneId,
      returnDistrictSpawn: loc.districtSpawn,
    };
  }

  /** Spawn when returning from combat/dream/story to the anchor district. */
  resolveReturnFromInstanced(fromSceneId: SceneId): SpawnResolution | null {
    const loc = getWorldLocation(fromSceneId);
    if (!loc.anchorSceneId || !loc.districtSpawn) return null;
    return {
      sceneId: loc.anchorSceneId,
      spawn: [...loc.districtSpawn] as [number, number, number],
      rotation: SCENE_CONFIG[loc.anchorSceneId]?.initialRotation ?? 0,
    };
  }
}

let sharedSpawnDirector: SpawnDirector | null = null;

export function getSpawnDirector(): SpawnDirector {
  if (!sharedSpawnDirector) {
    sharedSpawnDirector = new SpawnDirector();
  }
  return sharedSpawnDirector;
}
