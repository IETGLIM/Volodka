import type { SceneId } from '@/shared/types/game';

type ChunkPreloader = () => Promise<unknown>;

/** JS sub-chunks to warm before Suspense resolves (per scene). */
const SCENE_JS_CHUNK_PRELOAD: Partial<Record<SceneId, readonly ChunkPreloader[]>> = {
  volodka_room: [
    () => import('./volodkaRoom/VolodkaRoomClutterChunk'),
  ],
  library_day: [
    () => import('./libraryDay/LibraryDayInteriorChunk'),
  ],
  home_evening: [
    () => import('./homeEvening/HomeEveningPropsChunk'),
  ],
  factory_basement: [
    () => import('./factoryBasement/FactoryBasementClutterChunk'),
  ],
  chk_forest_zorge: [
    () => import('./chkForestZorge/ChkForestZorgeClutterChunk'),
  ],
  street_night: [
    () => import('./streetNight/StreetNightClutterChunk'),
  ],
};

export function preloadSceneJsChunks(sceneId: SceneId): void {
  const loaders = SCENE_JS_CHUNK_PRELOAD[sceneId];
  if (!loaders) return;
  for (const load of loaders) {
    void load();
  }
}

export function getSceneJsChunkPreloaders(sceneId: SceneId): readonly ChunkPreloader[] {
  return SCENE_JS_CHUNK_PRELOAD[sceneId] ?? [];
}
