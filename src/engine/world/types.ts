/* ─── Volodka RPG – Open world chunk types ─── */
/* Foundation for migrating from discrete scene loads to continuous world streaming.
 * Chunks are square regions in world space; existing SceneIds map to chunk coords
 * via legacySceneBridge until scenes become true sub-regions of a shared world. */

import type { SceneId } from '@/shared/types/game';

/** Integer grid coordinate of a world chunk (XZ plane). */
export interface WorldChunkCoord {
  x: number;
  z: number;
}

/** Stable string key for maps/sets: "x,z" */
export type WorldChunkKey = `${number},${number}`;

export function chunkKey(coord: WorldChunkCoord): WorldChunkKey {
  return `${coord.x},${coord.z}`;
}

export function parseChunkKey(key: WorldChunkKey): WorldChunkCoord {
  const [x, z] = key.split(',').map(Number);
  return { x, z };
}

/** Metadata for a loaded chunk — content hooks come later (terrain, props, NPCs). */
export interface WorldChunkDescriptor {
  coord: WorldChunkCoord;
  /** World-space origin (bottom-left corner) in meters */
  origin: [number, number, number];
  sizeMeters: number;
  /** During hybrid migration: which legacy scene owns this chunk */
  legacySceneId?: SceneId;
}

export interface WorldChunkManagerOptions {
  /** Edge length of one chunk in world meters */
  chunkSizeMeters: number;
  /** Chebyshev radius (chunk steps) kept loaded around the player */
  loadRadius: number;
}

export interface WorldChunkDiff {
  toLoad: WorldChunkCoord[];
  toUnload: WorldChunkCoord[];
  active: WorldChunkCoord[];
}
