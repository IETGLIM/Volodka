/* ─── Volodka RPG – Legacy scene → world chunk bridge ─── */
/* Places existing 14 discrete scenes on a coarse world grid for prototyping
 * open-world navigation before true continuous geometry exists. */

import type { SceneId } from '@/shared/types/game';
import type { WorldChunkCoord } from './types';

/** Hub layout: street_night at origin; indoor scenes as adjacent cells. */
export const LEGACY_SCENE_CHUNK_MAP: Record<SceneId, WorldChunkCoord> = {
  street_night: { x: 0, z: 0 },
  street_winter: { x: 1, z: 0 },
  cafe_evening: { x: 0, z: -1 },
  office_day: { x: 0, z: 1 },
  park_day: { x: 1, z: 1 },
  library_day: { x: -1, z: 1 },
  abandoned_factory: { x: -1, z: 0 },
  rooftop_edge: { x: -1, z: -1 },
  volodka_corridor: { x: 0, z: -2 },
  volodka_room: { x: 0, z: -3 },
  home_evening: { x: 1, z: -2 },
  zarema_albert_room: { x: -2, z: -1 },
  battle: { x: 2, z: 0 },
  sleep_dream: { x: 0, z: 2 },
  chk_forest_zorge: { x: 2, z: 1 },
};

const CHUNK_BY_SCENE = LEGACY_SCENE_CHUNK_MAP;

/** Reverse lookup: chunk → primary legacy scene (first match wins). */
const SCENE_BY_CHUNK = new Map<string, SceneId>();
for (const [sceneId, coord] of Object.entries(CHUNK_BY_SCENE) as [SceneId, WorldChunkCoord][]) {
  const key = `${coord.x},${coord.z}`;
  if (!SCENE_BY_CHUNK.has(key)) {
    SCENE_BY_CHUNK.set(key, sceneId);
  }
}

export function getChunkForScene(sceneId: SceneId): WorldChunkCoord {
  return CHUNK_BY_SCENE[sceneId] ?? { x: 0, z: 0 };
}

export function getPrimarySceneForChunk(coord: WorldChunkCoord): SceneId | undefined {
  return SCENE_BY_CHUNK.get(`${coord.x},${coord.z}`);
}

/** World-space center of a chunk (Y = 0). */
export function chunkWorldCenter(
  coord: WorldChunkCoord,
  chunkSizeMeters: number,
): [number, number, number] {
  const half = chunkSizeMeters / 2;
  return [
    coord.x * chunkSizeMeters + half,
    0,
    coord.z * chunkSizeMeters + half,
  ];
}
