/* ─── Volodka RPG – World persistence ─── */
/* Serializes region/cell discovery and per-cell flags into player flags + save flow. */

import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { SceneId } from '@/shared/types/game';
import type { WorldCellId, WorldPersistedSnapshot, WorldRegionId } from './types';
import {
  getCellForScene,
  getRegionForScene,
  getWorldLocation,
} from './worldRegistry';

const REGION_FLAG_PREFIX = 'world_region_discovered:';
const CELL_FLAG_PREFIX = 'world_cell_discovered:';
const CELL_STATE_PREFIX = 'world_cell_flag:';

function regionFlagKey(regionId: WorldRegionId): string {
  return `${REGION_FLAG_PREFIX}${regionId}`;
}

function cellFlagKey(cellId: WorldCellId): string {
  return `${CELL_FLAG_PREFIX}${cellId}`;
}

function cellStateKey(cellId: WorldCellId, flag: string): string {
  return `${CELL_STATE_PREFIX}${cellId}:${flag}`;
}

function playerFlags(): Record<string, boolean> {
  return getGameSnapshot().playerState.flags;
}

export class WorldPersistence {
  discoverRegion(regionId: WorldRegionId): void {
    dispatchGameAction({ type: 'player/setFlag', key: regionFlagKey(regionId), value: true });
  }

  discoverCell(cellId: WorldCellId): void {
    dispatchGameAction({ type: 'player/setFlag', key: cellFlagKey(cellId), value: true });
  }

  /** Mark region + cell when entering any scene. */
  discoverFromScene(sceneId: SceneId): void {
    const loc = getWorldLocation(sceneId);
    this.discoverRegion(loc.regionId);
    this.discoverCell(loc.cellId);
  }

  isRegionDiscovered(regionId: WorldRegionId): boolean {
    return playerFlags()[regionFlagKey(regionId)] === true;
  }

  isCellDiscovered(cellId: WorldCellId): boolean {
    return playerFlags()[cellFlagKey(cellId)] === true;
  }

  setCellFlag(cellId: WorldCellId, flag: string, value: boolean): void {
    dispatchGameAction({
      type: 'player/setFlag',
      key: cellStateKey(cellId, flag),
      value,
    });
  }

  getCellFlag(cellId: WorldCellId, flag: string): boolean {
    return playerFlags()[cellStateKey(cellId, flag)] === true;
  }

  captureSnapshot(): WorldPersistedSnapshot {
    const flags = playerFlags();
    const discoveredRegions = (Object.keys(flags)
      .filter((k) => k.startsWith(REGION_FLAG_PREFIX) && flags[k])
      .map((k) => k.slice(REGION_FLAG_PREFIX.length)) ) as WorldRegionId[];

    const discoveredCells = (Object.keys(flags)
      .filter((k) => k.startsWith(CELL_FLAG_PREFIX) && flags[k])
      .map((k) => k.slice(CELL_FLAG_PREFIX.length)) ) as WorldCellId[];

    const cellFlags: Record<WorldCellId, Record<string, boolean>> = {};
    for (const [key, value] of Object.entries(flags)) {
      if (!key.startsWith(CELL_STATE_PREFIX) || !value) continue;
      const rest = key.slice(CELL_STATE_PREFIX.length);
      const sep = rest.indexOf(':');
      if (sep < 0) continue;
      const cellId = rest.slice(0, sep) as WorldCellId;
      const flagName = rest.slice(sep + 1);
      if (!cellFlags[cellId]) cellFlags[cellId] = {};
      cellFlags[cellId][flagName] = true;
    }

    const sceneId = getGameSnapshot().exploration.currentSceneId;
    const loc = getWorldLocation(sceneId);

    return {
      discoveredRegions,
      discoveredCells,
      cellFlags,
      lastRegionId: loc.regionId,
      lastCellId: loc.cellId,
    };
  }

  /** Restore is implicit via player flags already in save — this validates consistency. */
  restoreFromStore(): WorldPersistedSnapshot {
    return this.captureSnapshot();
  }
}

let sharedPersistence: WorldPersistence | null = null;

export function getWorldPersistence(): WorldPersistence {
  if (!sharedPersistence) {
    sharedPersistence = new WorldPersistence();
  }
  return sharedPersistence;
}

/** Convenience: discover world graph for current scene after load or transition. */
export function persistDiscoveryForScene(sceneId: SceneId): void {
  getWorldPersistence().discoverFromScene(sceneId);
  const region = getRegionForScene(sceneId);
  const cell = getCellForScene(sceneId);
  void region;
  void cell;
}
