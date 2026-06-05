/* ─── Volodka RPG – World chunk manager (pure logic) ─── */
/* Computes which terrain/content chunks should be loaded around the player.
 * No React or Three.js dependencies — safe to unit test and reuse in workers later. */

import type {
  WorldChunkCoord,
  WorldChunkDescriptor,
  WorldChunkDiff,
  WorldChunkManagerOptions,
} from './types';
import { chunkKey } from './types';
import { getPrimarySceneForChunk } from './legacySceneBridge';

export class WorldChunkManager {
  private readonly chunkSizeMeters: number;
  private readonly loadRadius: number;
  private loaded = new Set<string>();

  constructor(options: WorldChunkManagerOptions) {
    this.chunkSizeMeters = options.chunkSizeMeters;
    this.loadRadius = Math.max(0, Math.floor(options.loadRadius));
  }

  getChunkSizeMeters(): number {
    return this.chunkSizeMeters;
  }

  /** Convert world XZ position to chunk grid coordinates. */
  worldToChunk(worldX: number, worldZ: number): WorldChunkCoord {
    return {
      x: Math.floor(worldX / this.chunkSizeMeters),
      z: Math.floor(worldZ / this.chunkSizeMeters),
    };
  }

  /** Chunk origin in world space (corner closest to negative X/Z). */
  chunkOrigin(coord: WorldChunkCoord): [number, number, number] {
    return [
      coord.x * this.chunkSizeMeters,
      0,
      coord.z * this.chunkSizeMeters,
    ];
  }

  describeChunk(coord: WorldChunkCoord): WorldChunkDescriptor {
    return {
      coord,
      origin: this.chunkOrigin(coord),
      sizeMeters: this.chunkSizeMeters,
      legacySceneId: getPrimarySceneForChunk(coord),
    };
  }

  /** All chunks within Chebyshev distance `loadRadius` of the center chunk. */
  getChunksInRadius(center: WorldChunkCoord): WorldChunkCoord[] {
    const chunks: WorldChunkCoord[] = [];
    for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
      for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
        chunks.push({ x: center.x + dx, z: center.z + dz });
      }
    }
    return chunks;
  }

  /** Update loaded set and return diff for streaming systems. */
  updateActiveChunks(playerWorldX: number, playerWorldZ: number): WorldChunkDiff {
    const center = this.worldToChunk(playerWorldX, playerWorldZ);
    const desired = this.getChunksInRadius(center);
    const desiredKeys = new Set(desired.map(chunkKey));

    const toLoad: WorldChunkCoord[] = [];
    for (const coord of desired) {
      const key = chunkKey(coord);
      if (!this.loaded.has(key)) {
        toLoad.push(coord);
      }
    }

    const toUnload: WorldChunkCoord[] = [];
    for (const key of this.loaded) {
      if (!desiredKeys.has(key as `${number},${number}`)) {
        const [x, z] = key.split(',').map(Number);
        toUnload.push({ x, z });
      }
    }

    this.loaded = desiredKeys;
    return { toLoad, toUnload, active: desired };
  }

  /** Currently loaded chunk keys (for debugging / save serialization). */
  getLoadedKeys(): string[] {
    return [...this.loaded];
  }

  reset(): void {
    this.loaded.clear();
  }
}

/** Default tuning for web: 64m chunks, 1-chunk halo (3×3 grid max). */
export const DEFAULT_WORLD_CHUNK_OPTIONS: WorldChunkManagerOptions = {
  chunkSizeMeters: 64,
  loadRadius: 1,
};
