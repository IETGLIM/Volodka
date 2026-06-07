/* ─── Volodka RPG – World event director ─── */
/* Region-scale ambient events, cell enter hooks, and district atmosphere. */

import { eventBus } from '@/engine/EventBus';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import type { SceneId } from '@/shared/types/game';
import type { WorldCellId, WorldRegionId } from './types';
import {
  getCellForScene,
  getRegionForScene,
  getWorldLocation,
  isDistrictScene,
} from './worldRegistry';
import { getNavMeshLayer } from './NavMeshLayer';
import { persistDiscoveryForScene } from './WorldPersistence';

type Unsubscribe = () => void;

export class WorldEventDirector {
  private started = false;
  private unsubs: Unsubscribe[] = [];

  start(): void {
    if (this.started) return;
    this.started = true;

    this.unsubs.push(
      eventBus.on('scene:enter', ({ sceneId }) => {
        this.onSceneEnter(sceneId);
      }),
    );

    this.unsubs.push(
      eventBus.on('world:chunks_changed', (payload) => {
        eventBus.emit('world:stream_updated', payload);
      }),
    );

    this.unsubs.push(
      eventBus.on('world:region_enter', ({ regionId, cellId }) => {
        if (import.meta.env.DEV) {
          console.debug(`[WorldEventDirector] region=${regionId} cell=${cellId}`);
        }
      }),
    );
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.started = false;
  }

  private onSceneEnter(sceneId: SceneId): void {
    const loc = getWorldLocation(sceneId);
    const region = getRegionForScene(sceneId);
    const cell = getCellForScene(sceneId);

    persistDiscoveryForScene(sceneId);

    if (region.streaming && isDistrictScene(sceneId)) {
      getNavMeshLayer().loadCell(region.id, cell.id);
    }

    eventBus.emit('world:region_enter', {
      regionId: loc.regionId,
      cellId: loc.cellId,
      sceneId,
      kind: loc.kind,
    });

    this.emitCellAmbience(loc.regionId, loc.cellId, sceneId);
  }

  private emitCellAmbience(
    regionId: WorldRegionId,
    cellId: WorldCellId,
    sceneId: SceneId,
  ): void {
    eventBus.emit('world:cell_ambience', {
      regionId,
      cellId,
      sceneId,
    });
  }
}

let sharedDirector: WorldEventDirector | null = null;

export function getWorldEventDirector(): WorldEventDirector {
  if (!sharedDirector) {
    sharedDirector = new WorldEventDirector();
  }
  return sharedDirector;
}

export function initWorldEventDirector(): () => void {
  const director = getWorldEventDirector();
  director.start();
  return () => director.stop();
}

/** Stop director listeners and release singleton (unmount / HMR). */
export function disposeWorldEventDirector(): void {
  sharedDirector?.stop();
  sharedDirector = null;
}

registerHmrDispose(disposeWorldEventDirector);
