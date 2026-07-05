/* ─── Volodka RPG – Open world layer types ─── */
/*
 * Hierarchy:
 *   WorldRegion (open-world district)
 *     └─ WorldCell (neighbourhood / logical zone)
 *          └─ WorldChunk (spatial streaming unit, XZ grid)
 *               └─ WorldLocation (handcrafted SceneId: interior | story | combat | dream)
 *
 * Legacy SceneIds remain first-class; districts stream chunks, locations are authored.
 */

import type { SceneId } from '@/shared/types/game';

/* ─── Region & cell identifiers ─── */

export type WorldRegionId = 'volodka_city' | 'industrial_quarter' | 'chk_tolpa';

/** Namespaced cell id: `${regionId}:${localName}` */
export type WorldCellId = `${WorldRegionId}:${string}`;

/**
 * How a handcrafted scene participates in the world graph.
 * - district: open exterior — chunk streaming, free roam between cells
 * - interior: authored room/building — loads as discrete SceneId
 * - story: narrative set-piece (cutscene/VN backdrop)
 * - combat: isolated arena
 * - dream: poetry / dream space
 */
export type WorldLocationKind = 'district' | 'interior' | 'story' | 'combat' | 'dream';

/* ─── Spatial chunk (streaming grid) ─── */

export interface WorldChunkCoord {
  x: number;
  z: number;
}

export type WorldChunkKey = `${number},${number}`;

export function chunkKey(coord: WorldChunkCoord): WorldChunkKey {
  return `${coord.x},${coord.z}`;
}

export function parseChunkKey(key: WorldChunkKey): WorldChunkCoord {
  const [x, z] = key.split(',').map(Number);
  return { x, z };
}

/** Loaded streaming unit — terrain/props/NPC hooks attach here later. */
export interface WorldChunkSpatial {
  coord: WorldChunkCoord;
  origin: [number, number, number];
  sizeMeters: number;
  legacySceneId?: SceneId;
}

export interface WorldChunk extends WorldChunkSpatial {
  regionId: WorldRegionId;
  cellId: WorldCellId;
}

/** @deprecated alias — prefer WorldChunk */
export type WorldChunkDescriptor = WorldChunkSpatial;

export interface WorldChunkManagerOptions {
  chunkSizeMeters: number;
  loadRadius: number;
}

export interface WorldChunkDiff {
  toLoad: WorldChunkCoord[];
  toUnload: WorldChunkCoord[];
  active: WorldChunkCoord[];
}

/* ─── Region / cell / location graph ─── */

export interface WorldRegion {
  id: WorldRegionId;
  displayName: string;
  /** When true, WorldStreamManager keeps neighbouring chunks resident */
  streaming: boolean;
  /** Default entry scene when fast-travelling to the district */
  entrySceneId: SceneId;
  cellIds: WorldCellId[];
}

export interface WorldCell {
  id: WorldCellId;
  regionId: WorldRegionId;
  displayName: string;
  /** Chunks that belong to this cell (open-world districts only) */
  chunkCoords: WorldChunkCoord[];
  /** All handcrafted scenes anchored in this cell */
  locationSceneIds: SceneId[];
}

export interface WorldLocation {
  sceneId: SceneId;
  kind: WorldLocationKind;
  regionId: WorldRegionId;
  cellId: WorldCellId;
  /** Exterior scene used for world-map / chunk positioning */
  anchorSceneId?: SceneId;
  /** Spawn on district when exiting this location (local coords) */
  districtSpawn?: [number, number, number];
}

/* ─── Streaming & persistence snapshots ─── */

export interface WorldStreamState {
  regionId: WorldRegionId | null;
  cellId: WorldCellId | null;
  playerChunk: WorldChunkCoord;
  activeChunkKeys: WorldChunkKey[];
  streamingEnabled: boolean;
}

export interface WorldPersistedSnapshot {
  discoveredRegions: WorldRegionId[];
  discoveredCells: WorldCellId[];
  cellFlags: Record<WorldCellId, Record<string, boolean>>;
  lastRegionId: WorldRegionId | null;
  lastCellId: WorldCellId | null;
}

/* ─── Navigation (district-scale; interiors use physics colliders) ─── */

export interface NavMeshNode {
  id: string;
  position: [number, number, number];
  neighbors: string[];
}

export interface NavMeshLayerSnapshot {
  regionId: WorldRegionId;
  cellId: WorldCellId | null;
  nodeCount: number;
}
