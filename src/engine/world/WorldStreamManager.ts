/* ─── Volodka RPG – World stream manager ─── */
/* Orchestrates chunk streaming, region/cell context, and world-space player tracking. */

import { eventBus } from '@/engine/EventBus';
import type { SceneId } from '@/shared/types/game';
import {
  WorldChunkManager,
  DEFAULT_WORLD_CHUNK_OPTIONS,
} from './WorldChunkManager';
import type {
  WorldCellId,
  WorldChunk,
  WorldChunkCoord,
  WorldChunkDiff,
  WorldRegionId,
  WorldStreamState,
} from './types';
import { chunkKey } from './types';
import {
  getCellForScene,
  getChunkForScene,
  getPrimarySceneForChunk,
  getRegionForScene,
  getWorldLocation,
  isDistrictScene,
} from './worldRegistry';
import { getSpawnDirector } from './SpawnDirector';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import {
  isWorldComputeWorkerAvailable,
  requestWorldChunkDiff,
  resetWorldComputeWorkerState,
} from '@/engine/workers/computeWorkerClient';

export class WorldStreamManager {
  private readonly chunks: WorldChunkManager;
  private streamingEnabled = false;
  private lastDiff: WorldChunkDiff | null = null;
  private currentRegionId: WorldRegionId | null = null;
  private currentCellId: WorldCellId | null = null;

  constructor(options = DEFAULT_WORLD_CHUNK_OPTIONS) {
    this.chunks = new WorldChunkManager(options);
  }

  setStreamingEnabled(enabled: boolean): void {
    this.streamingEnabled = enabled;
    if (!enabled) {
      this.chunks.reset();
      resetWorldComputeWorkerState();
      this.lastDiff = null;
    }
  }

  isStreamingEnabled(): boolean {
    return this.streamingEnabled;
  }

  /** Sync region/cell from the active handcrafted scene. */
  syncContextFromScene(sceneId: SceneId): void {
    const loc = getWorldLocation(sceneId);
    const region = getRegionForScene(sceneId);
    this.currentRegionId = loc.regionId;
    this.currentCellId = loc.cellId;
    this.setStreamingEnabled(region.streaming && isDistrictScene(sceneId));
  }

  /** World XZ from scene chunk origin + local exploration position. */
  resolvePlayerWorldPosition(
    sceneId: SceneId,
    localPosition: [number, number, number],
  ): { x: number; z: number } {
    const sceneChunk = getChunkForScene(sceneId);
    const size = this.chunks.getChunkSizeMeters();
    return {
      x: sceneChunk.x * size + localPosition[0],
      z: sceneChunk.z * size + localPosition[2],
    };
  }

  getPlayerChunk(
    sceneId: SceneId,
    localPosition: [number, number, number],
  ): WorldChunkCoord {
    const world = this.resolvePlayerWorldPosition(sceneId, localPosition);
    return this.chunks.worldToChunk(world.x, world.z);
  }

  /** Update streaming set; emits world:chunks_changed when diff non-empty. */
  updateStream(
    sceneId: SceneId,
    localPosition: [number, number, number],
  ): WorldChunkDiff {
    this.syncContextFromScene(sceneId);

    if (!this.streamingEnabled) {
      return { toLoad: [], toUnload: [], active: [] };
    }

    const world = this.resolvePlayerWorldPosition(sceneId, localPosition);
    const diff = this.chunks.updateActiveChunks(world.x, world.z);
    return this.commitChunkDiff(diff, world.x, world.z);
  }

  /** Apply worker-computed diff to the main-thread chunk manager. */
  applyWorkerChunkDiff(response: {
    toLoad: string[];
    toUnload: string[];
    active: string[];
  }): WorldChunkDiff {
    const parseKey = (key: string): WorldChunkCoord => {
      const [x, z] = key.split(',').map(Number);
      return { x, z };
    };

    const diff: WorldChunkDiff = {
      toLoad: response.toLoad.map(parseKey),
      toUnload: response.toUnload.map(parseKey),
      active: response.active.map(parseKey),
    };

    this.chunks.applyExternalDiff(diff);
    return diff;
  }

  /** Worker offload — falls back to sync updateStream on failure. */
  async updateStreamAsync(
    sceneId: SceneId,
    localPosition: [number, number, number],
  ): Promise<WorldChunkDiff> {
    this.syncContextFromScene(sceneId);

    if (!this.streamingEnabled) {
      return { toLoad: [], toUnload: [], active: [] };
    }

    const world = this.resolvePlayerWorldPosition(sceneId, localPosition);

    if (isWorldComputeWorkerAvailable()) {
      try {
        const response = await requestWorldChunkDiff(world.x, world.z);
        const diff = this.applyWorkerChunkDiff(response);
        return this.commitChunkDiff(diff, world.x, world.z);
      } catch (err) {
        console.warn('[WorldStreamManager] worker chunk diff failed, falling back to main thread', err);
      }
    }

    return this.updateStream(sceneId, localPosition);
  }

  private commitChunkDiff(
    diff: WorldChunkDiff,
    worldX: number,
    worldZ: number,
  ): WorldChunkDiff {
    this.lastDiff = diff;

    if (diff.toLoad.length > 0 || diff.toUnload.length > 0) {
      const playerChunk = this.chunks.worldToChunk(worldX, worldZ);
      eventBus.emit('world:chunks_changed', {
        toLoad: diff.toLoad.map(chunkKey),
        toUnload: diff.toUnload.map(chunkKey),
        active: diff.active.map(chunkKey),
        playerChunk: chunkKey(playerChunk),
        regionId: this.currentRegionId,
        cellId: this.currentCellId,
      });
    }

    return diff;
  }

  describeChunk(coord: WorldChunkCoord): WorldChunk {
    const descriptor = this.chunks.describeChunk(coord);
    const legacySceneId = getPrimarySceneForChunk(coord);
    const regionId = this.currentRegionId ?? 'volodka_city';
    const cellId = this.currentCellId ?? 'volodka_city:downtown';

    return {
      ...descriptor,
      regionId,
      cellId,
      legacySceneId,
    };
  }

  getStreamState(
    sceneId: SceneId,
    localPosition: [number, number, number],
  ): WorldStreamState {
    const playerChunk = this.getPlayerChunk(sceneId, localPosition);
    return {
      regionId: this.currentRegionId,
      cellId: this.currentCellId,
      playerChunk,
      activeChunkKeys: this.chunks.getLoadedKeys() as WorldStreamState['activeChunkKeys'],
      streamingEnabled: this.streamingEnabled,
    };
  }

  getLastDiff(): WorldChunkDiff | null {
    return this.lastDiff;
  }

  /** Enter an instanced or district location with authored spawn rules. */
  requestEnterLocation(sceneId: SceneId, portalSpawn?: [number, number, number]): void {
    const resolution = getSpawnDirector().resolve({
      sceneId,
      portalSpawn,
      context: 'enter',
    });
    eventBus.emit('world:location_enter', {
      sceneId: resolution.sceneId,
      spawn: resolution.spawn,
      kind: getWorldLocation(sceneId).kind,
    });
  }
}

let sharedStream: WorldStreamManager | null = null;

export function getWorldStreamManager(): WorldStreamManager {
  if (!sharedStream) {
    sharedStream = new WorldStreamManager();
  }
  return sharedStream;
}

export function resetWorldStreamManager(): void {
  sharedStream = null;
}

/** Disable streaming and release singleton (unmount / HMR). */
export function disposeWorldStreamManager(): void {
  if (sharedStream) {
    sharedStream.setStreamingEnabled(false);
  }
  sharedStream = null;
}

registerHmrDispose(disposeWorldStreamManager);
