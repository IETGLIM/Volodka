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
import { devWarn } from '@/shared/utils/devLog';
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
      { x: 1, z: -3 },
      { x: 3, z: 0 },
    ],
    locationSceneIds: ['street_night', 'street_winter', 'cafe_evening', 'city_square', 'procedural_aaa'],
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
      { x: -2, z: -2 },
      { x: 1, z: -4 },
    ],
    locationSceneIds: [
      'volodka_corridor',
      'volodka_room',
      'home_evening',
      'solnysh_room',
      'zarema_albert_room',
      'zarema_room',
      'albert_backroom',
    ],
  },
  'volodka_city:civic': {
    id: 'volodka_city:civic',
    regionId: 'volodka_city',
    displayName: 'Деловой и культурный центр',
    chunkCoords: [
      { x: 0, z: 1 },
      { x: -1, z: 1 },
      { x: 1, z: 1 },
      { x: -1, z: 2 },
      { x: 0, z: 4 },
      { x: 2, z: 2 },
      { x: 2, z: 3 },
    ],
    locationSceneIds: [
      'office_day',
      'park_day',
      'library_day',
      'library_basement',
      'guild_mainframe',
      'river_pier',
      'pier_evening',
    ],
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
    chunkCoords: [
      { x: -1, z: 0 },
      { x: -2, z: 0 },
      { x: -2, z: 1 },
    ],
    locationSceneIds: ['abandoned_factory', 'factory_basement', 'underground_bunker'],
  },
  'industrial_quarter:rooftop': {
    id: 'industrial_quarter:rooftop',
    regionId: 'industrial_quarter',
    displayName: 'Крыши',
    chunkCoords: [
      { x: -1, z: -1 },
      { x: -1, z: -2 },
    ],
    locationSceneIds: ['rooftop_edge', 'factory_roof'],
  },
  'chk_tolpa:forest': {
    id: 'chk_tolpa:forest',
    regionId: 'chk_tolpa',
    displayName: 'Чаща',
    chunkCoords: [
      { x: 2, z: 1 },
      { x: 3, z: 1 },
    ],
    locationSceneIds: ['chk_forest_zorge', 'chk_campfire_night', 'forest_clearing'],
  },
};

/* ─── Handcrafted locations (every legacy SceneId) ─── */

export const WORLD_LOCATIONS: Partial<Record<SceneId, WorldLocation>> = {
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
  solnysh_room: {
    sceneId: 'solnysh_room',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'volodka_corridor',
    districtSpawn: [2, 0.01, 3.6],
  },

  /* Industrial district */
  abandoned_factory: {
    sceneId: 'abandoned_factory',
    kind: 'district',
    regionId: 'industrial_quarter',
    cellId: 'industrial_quarter:factory',
  },
  factory_basement: {
    sceneId: 'factory_basement',
    kind: 'interior',
    regionId: 'industrial_quarter',
    cellId: 'industrial_quarter:factory',
    anchorSceneId: 'abandoned_factory',
    districtSpawn: [-8, 0.01, -6],
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
  river_pier: {
    sceneId: 'river_pier',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
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

  /* AAA narrative extension scenes */
  chk_campfire_night: {
    sceneId: 'chk_campfire_night',
    kind: 'district',
    regionId: 'chk_tolpa',
    cellId: 'chk_tolpa:forest',
    anchorSceneId: 'chk_forest_zorge',
  },
  // FIX S13-17: forest_clearing added to WORLD_LOCATIONS — was missing, causing
  // 3 test failures (sceneIdInvariants + worldRegistry). Mirrors chk_campfire_night
  // pattern: derived from chk_forest_zorge, same cell.
  forest_clearing: {
    sceneId: 'forest_clearing',
    kind: 'district',
    regionId: 'chk_tolpa',
    cellId: 'chk_tolpa:forest',
    anchorSceneId: 'chk_forest_zorge',
  },
  pier_evening: {
    sceneId: 'pier_evening',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
    anchorSceneId: 'river_pier',
  },
  factory_roof: {
    sceneId: 'factory_roof',
    kind: 'story',
    regionId: 'industrial_quarter',
    cellId: 'industrial_quarter:rooftop',
    anchorSceneId: 'abandoned_factory',
  },
  library_basement: {
    sceneId: 'library_basement',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
    anchorSceneId: 'library_day',
  },
  city_square: {
    sceneId: 'city_square',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:downtown',
    anchorSceneId: 'street_night',
  },
  underground_bunker: {
    sceneId: 'underground_bunker',
    kind: 'interior',
    regionId: 'industrial_quarter',
    cellId: 'industrial_quarter:factory',
    anchorSceneId: 'factory_basement',
  },
  guild_mainframe: {
    sceneId: 'guild_mainframe',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:civic',
    anchorSceneId: 'office_day',
  },
  zarema_room: {
    sceneId: 'zarema_room',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'zarema_albert_room',
  },
  albert_backroom: {
    sceneId: 'albert_backroom',
    kind: 'interior',
    regionId: 'volodka_city',
    cellId: 'volodka_city:residential',
    anchorSceneId: 'cafe_evening',
  },
  procedural_aaa: {
    sceneId: 'procedural_aaa',
    kind: 'district',
    regionId: 'volodka_city',
    cellId: 'volodka_city:downtown',
    anchorSceneId: 'street_night',
  },
};

/* ─── Lookup helpers ─── */

/** Safe defaults when a SceneId is not yet registered in WORLD_LOCATIONS. */
function createFallbackWorldLocation(sceneId: SceneId): WorldLocation {
  if (import.meta.env.DEV) {
    devWarn(
      `[worldRegistry] Unknown scene "${sceneId}" — using fallback location (volodka_city:downtown)`,
    );
  }
  return {
    sceneId,
    kind: 'story',
    regionId: 'volodka_city',
    cellId: 'volodka_city:downtown',
  };
}

export function getWorldLocation(sceneId: SceneId): WorldLocation {
  return WORLD_LOCATIONS[sceneId] ?? createFallbackWorldLocation(sceneId);
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

/** Per-scene chunk placement — each SceneId must own a unique (x,z). */
export const SCENE_CHUNK_COORD: Partial<Record<SceneId, WorldChunkCoord>> = {
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
  solnysh_room: { x: 1, z: -1 },
  battle: { x: 2, z: 0 },
  sleep_dream: { x: 0, z: 2 },
  chk_forest_zorge: { x: 2, z: 1 },
  factory_basement: { x: -2, z: 0 },
  river_pier: { x: 2, z: 2 },
  pier_evening: { x: 2, z: 3 },
  chk_campfire_night: { x: 3, z: 1 },
  forest_clearing: { x: 3, z: 2 },
  factory_roof: { x: -1, z: -2 },
  library_basement: { x: -1, z: 2 },
  city_square: { x: 1, z: -3 },
  underground_bunker: { x: -2, z: 1 },
  guild_mainframe: { x: 0, z: 4 },
  zarema_room: { x: -2, z: -2 },
  albert_backroom: { x: 1, z: -4 },
  procedural_aaa: { x: 3, z: 0 },
};

const SCENE_BY_CHUNK = new Map<string, SceneId>();
const CHUNK_COLLISION_WARNED = new Set<string>();
for (const [sceneId, coord] of Object.entries(SCENE_CHUNK_COORD) as [SceneId, WorldChunkCoord][]) {
  const key = `${coord.x},${coord.z}`;
  if (SCENE_BY_CHUNK.has(key)) {
    if (import.meta.env.DEV && !CHUNK_COLLISION_WARNED.has(key)) {
      CHUNK_COLLISION_WARNED.add(key);
      devWarn(
        `[worldRegistry] SCENE_CHUNK_COORD collision at (${key}): ` +
          `"${SCENE_BY_CHUNK.get(key)}" wins over "${sceneId}"`,
      );
    }
    continue;
  }
  SCENE_BY_CHUNK.set(key, sceneId);
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
