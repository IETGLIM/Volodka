import type { SceneId } from '@/config/sceneDefinitions';
import type { WorldCellId, WorldLocationKind, WorldRegionId } from '@/engine/world/types';

/** World clock, chunk streaming, region/cell graph — useWorldClock, useWorldStream. */
export interface WorldEvents {
  /**
   * Store → engine: time advanced; scheduleSyncController rebuilds NPC states
   * then emits world:hour_changed. explorationSlice must not call ScheduleEngine.
   */
  'schedule:sync_npcs': {
    hour: number;
    previousHour: number;
  };
  'world:hour_changed': {
    hour: number;
    previousHour: number;
    npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
  };
  'world:tick': { hour: number; deltaHours: number };
  'world:chunks_changed': {
    toLoad: string[];
    toUnload: string[];
    active: string[];
    playerChunk: string;
    regionId?: WorldRegionId | null;
    cellId?: WorldCellId | null;
  };
  'world:stream_updated': WorldEvents['world:chunks_changed'];
  'world:region_enter': {
    regionId: WorldRegionId;
    cellId: WorldCellId;
    sceneId: SceneId;
    kind: WorldLocationKind;
  };
  'world:cell_ambience': {
    regionId: WorldRegionId;
    cellId: WorldCellId;
    sceneId: SceneId;
  };
  'world:location_enter': {
    sceneId: SceneId;
    spawn: [number, number, number];
    kind: WorldLocationKind;
  };
}
