/* ─── Volodka RPG – Open world layer (public API) ─── */

export type {
  WorldRegionId,
  WorldCellId,
  WorldLocationKind,
  WorldChunkCoord,
  WorldChunkKey,
  WorldChunk,
  WorldChunkDescriptor,
  WorldChunkDiff,
  WorldChunkManagerOptions,
  WorldRegion,
  WorldCell,
  WorldLocation,
  WorldStreamState,
  WorldPersistedSnapshot,
  NavMeshNode,
  NavMeshLayerSnapshot,
} from './types';

export { chunkKey, parseChunkKey } from './types';

export {
  WORLD_REGIONS,
  WORLD_CELLS,
  WORLD_LOCATIONS,
  SCENE_CHUNK_COORD,
  getWorldLocation,
  getWorldRegion,
  getWorldCell,
  getRegionForScene,
  getCellForScene,
  isDistrictScene,
  isInstancedLocation,
  scenesOfKind,
  getPrimarySceneForChunk,
  getChunkForScene,
  chunkWorldCenter,
} from './worldRegistry';

export {
  WorldChunkManager,
  DEFAULT_WORLD_CHUNK_OPTIONS,
} from './WorldChunkManager';

export {
  WorldStreamManager,
  getWorldStreamManager,
  resetWorldStreamManager,
} from './WorldStreamManager';

export {
  WorldPersistence,
  getWorldPersistence,
  persistDiscoveryForScene,
} from './WorldPersistence';

export {
  WorldEventDirector,
  getWorldEventDirector,
  initWorldEventDirector,
} from './WorldEventDirector';

export {
  SpawnDirector,
  getSpawnDirector,
  type SpawnRequest,
  type SpawnResolution,
  type SpawnContext,
} from './SpawnDirector';

export { NavMeshLayer, getNavMeshLayer } from './NavMeshLayer';

/** @deprecated use worldRegistry exports */
export { LEGACY_SCENE_CHUNK_MAP } from './legacySceneBridge';
