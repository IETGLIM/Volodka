/* ─── Volodka RPG – World region / cell / location registry ─── */
/*
 * Open World Districts
 *   → handcrafted interiors
 *   → story scenes
 *   → combat arenas
 *   → dream/poetry spaces
 *
 * All existing SceneIds remain handcrafted locations; districts provide continuity.
 */

import type { SceneId } from '@/shared/types/game';
import type {
  WorldCell,
  WorldCellId,
  WorldChunkCoord,
  WorldLocation,
  WorldLocationKind,
  WorldRegion,
  WorldRegionId,
} from './types';

/* ─── Regions (districts) ─── */

export const WORLD_REGIONS: Record<WorldRegionId, WorldRegion> = {
  volodka_city: {
    id: 'volodka_city',
    displayName: 'Город Володьки',
    streaming: true,
    entrySceneId: 'street_night',
    cellIds: [
      'volodka_city:downtown',
      'volodka_city:residential',
      'volodka_city:civic',
      'volodka_city:volodka_home',
    ],
  },
  industrial_quarter: {
    id: 'industrial_quarter',
    displayName: 'Промзона',
    streaming: true,
    entrySceneId: 'abandoned_factory',
    cellIds: ['industrial_quarter:factory', 'industrial_quarter:rooftop'],
  },
  chk_tolpa: {
    id: 'chk_tolpa',
    displayName: 'Лес Зорге (ЧК)',
    streaming: true,
    entrySceneId: 'chk_forest_zorge',
    cellIds: ['chk_tolpa:forest'],
  },
};

/* ─── Cells ─── */

export const WORLD_CELLS: Record<WorldCellId, WorldCell> = {
  'volodka_city:downtown': {
    id: 'volodka_city:downtown',
    regionId: 'volodka_city',
    displayName: 'Центр',
    chunkCoords: [
      { x: 0, z: 0 },
      { x: 1, z: 0 },
      { x: 0, z: -1 },
    ],
    locationSceneIds: ['street_night', 'street_winter', 'cafe_evening'],
  },
  'volodka_city:residential': {
    id: 'volodka_city:residential',
    regionId: 'volodka_city',
    displayName: 'Спальные кварталы',
    chunkCoords: [
      { x: 0, z: -2 },
      { x: 0, z: -3 },
      { x: 1, z: -2 },
      { x: -2, z: -1 },
    ],
    locationSceneIds: ['volodka_corridor', 'volodka_room', 'home_evening', 'zarema_albert_room'],
  },
  'volodka_city:civic': {
    id: 'volodka_city:civic',
    regionId: 'volodka_city',
    displayName: 'Деловой и культурный центр',
    chunkCoords: [
      { x: 0, z: 1 },
      { x: -1, z: 1 },
      { x: 1, z: 1 },
    ],
    locationSceneIds: ['office_day', 'park_day', 'library_day'],
  },
  'volodka_city:volodka_home': {
    id: 'volodka_city:volodka_home',
    regionId: 'volodka_city',
    displayName: 'Особые пространства',
    chunkCoords: [{ x: 0, z: 2 }],
    locationSceneIds: ['sleep_dream', 'battle'],
  },
  'industrial_quarter:factory': {
    id: 'industrial_quarter:factory',
    regionId: 'industrial_quarter',
    displayName: 'Заброшенный завод',
    chunkCoords: [{ x: -1, z: 0 }],
    locationSceneIds: ['abandoned_factory'],
  },
  'industrial_quarter:rooftop': {
    id: 'industrial_quarter:rooftop',
    regionId: 'industrial_quarter',
    displayName: 'Крыши',
    chunkCoords: [{ x: -1, z: -1 }],
    locationSceneIds: ['rooftop_edge'],
  },
  'chk_tolpa:forest': {
    id: 'chk_tolpa:forest',
    regionId: 'chk_tolpa',
    displayName: 'Чаща',
    chunkCoords: [{ x: 2, z: 1 }],
    locationSceneIds: ['chk_forest_zorge'],
  },
};

/* ─── Handcrafted locations (every legacy SceneId) ─── */

export const WORLD_LOCATIONS: Record<SceneId, WorldLocation> = {
  /* District exteriors */
  street_night: {
    sceneId: 'street_night',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:downtown',
  },
  street_winter: {
    sceneId: 'street_winter',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:downtown',
  },
  cafe_evening: {
    sceneId: 'cafe_evening',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:downtown',
  },
  office_day: {
    sceneId: 'office_day',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
  },
  park_day: {
    sceneId: 'park_day',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
  },
  library_day: {
    sceneId: 'library_day',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
  },

  /* Interiors */
  volodka_corridor: {
    sceneId: 'volodka_corridor',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'street_night',
    districtSpawn: [0, 0.01, -2],
  },
  volodka_room: {
    sceneId: 'volodka_room',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'street_night',
    districtSpawn: [0, 0.01, -3],
  },
  home_evening: {
    sceneId: 'home_evening',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'street_night',
    districtSpawn: [1, 0.01, -2],
  },
  zarema_albert_room: {
    sceneId: 'zarema_albert_room',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'street_night',
    districtSpawn: [-2, 0.01, -1],
  },

  /* Industrial district */
  abandoned_factory: {
    sceneId: 'abandoned_factory',
    kind: 'district',
    regionId: 'industrial_quarter',
    cellId: 'industrial_quarter:factory',
  },
  rooftop_edge: {
    sceneId: 'rooftop_edge',
    kind: 'story',
    regionId: 'industrial_quarter',
    cellId: 'industrial_quarter:rooftop',
    anchorSceneId: 'street_night',
    districtSpawn: [-1, 0.01, -1],
  },

  /* CHK Tolpa */
  chk_forest_zorge: {
    sceneId: 'chk_forest_zorge',
    kind: 'district',
    regionId: 'chk_tolpa',
    cellId: 'chk_tolpa:forest',
  },

  /* Combat & dream */
  battle: {
    sceneId: 'battle',
    kind: 'combat',
    regionId: 'volodka_city',
    cellId: 'volodka_city:volodka_home',
    anchorSceneId: 'street_night',
    districtSpawn: [2, 0.01, 0],
  },
  sleep_dream: {
    sceneId: 'sleep_dream',
    kind: 'dream',
    regionId: 'volodka_city',
    cellId: 'volodka_city:volodka_home',
    anchorSceneId: 'volodka_room',
    districtSpawn: [0, 0.01, 2],
  },
};

/* ─── Lookup helpers ─── */

export function getWorldLocation(sceneId: SceneId): WorldLocation {
  return WORLD_LOCATIONS[sceneId];
}

export function getWorldRegion(regionId: WorldRegionId): WorldRegion {
  return WORLD_REGIONS[regionId];
}

export function getWorldCell(cellId: WorldCellId): WorldCell {
  return WORLD_CELLS[cellId];
}

export function getRegionForScene(sceneId: SceneId): WorldRegion {
  const loc = getWorldLocation(sceneId);
  return getWorldRegion(loc.regionId);
}

export function getCellForScene(sceneId: SceneId): WorldCell {
  const loc = getWorldLocation(sceneId);
  return getWorldCell(loc.cellId);
}

export function isDistrictScene(sceneId: SceneId): boolean {
  return getWorldLocation(sceneId).kind === 'district';
}

export function isInstancedLocation(sceneId: SceneId): boolean {
  const kind = getWorldLocation(sceneId).kind;
  return kind === 'interior' || kind === 'story' || kind === 'combat' || kind === 'dream';
}

export function scenesOfKind(kind: WorldLocationKind): SceneId[] {
  return (Object.values(WORLD_LOCATIONS) as WorldLocation[])
    .filter((loc) => loc.kind === kind)
    .map((loc) => loc.sceneId);
}

/** Per-scene chunk placement on the coarse world grid (hybrid migration layout). */
export const SCENE_CHUNK_COORD: Record<SceneId, WorldChunkCoord> = {
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

const SCENE_BY_CHUNK = new Map<string, SceneId>();
for (const [sceneId, coord] of Object.entries(SCENE_CHUNK_COORD) as [SceneId, WorldChunkCoord][]) {
  const key = `${coord.x},${coord.z}`;
  if (!SCENE_BY_CHUNK.has(key)) {
    SCENE_BY_CHUNK.set(key, sceneId);
  }
}

export function getPrimarySceneForChunk(coord: WorldChunkCoord): SceneId | undefined {
  return SCENE_BY_CHUNK.get(`${coord.x},${coord.z}`);
}

export function getChunkForScene(sceneId: SceneId): WorldChunkCoord {
  return SCENE_CHUNK_COORD[sceneId] ?? { x: 0, z: 0 };
}

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
