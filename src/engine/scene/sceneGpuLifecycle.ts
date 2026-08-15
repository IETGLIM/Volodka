/**
 * Scene GPU lifecycle — evict previous scene loader cache, preload next scene GLBs.
 * Prop/NPC preloads are scoped per scene instead of loading the full registry.
 */

import { Cache } from 'three';
import { useGLTF } from '@react-three/drei';
import type { SceneId } from '@/shared/types/game';
import { sceneMatchesScheduleEntry, resolveDerivedSceneId } from '@/config/sceneInheritance';
import { NPC_SCHEDULES_MAP, ACT_SCHEDULE_OVERRIDES } from '@/data/npcSchedules';
import { getAssetDefinition, isAssetEffectiveShipped } from '@/config/assetManifest';
import { FPS_ARMS_URL } from '@/config/fpsArmsUrl';
import { preloadGltfAsset } from '@/components/3d/assets/GltfAsset';
import { preloadTriggerZoneProps } from '@/components/3d/TriggerZoneProp';
import { preloadScenePropDressing } from '@/components/3d/ScenePropDressing';
import { preloadSceneJsChunks } from '@/components/3d/sceneChunks/sceneChunkRegistry';
import { isUniqueNpcMeshOnDisk, resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { getPropModelDefinition } from '@/config/propModelRegistry';
import { getScenePropDressingIds } from '@/config/scenePropDressing';
import { getSceneStreetDressingUrls } from '@/config/streetDressingGpuUrls';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';
import {
  GltfPreloadPriority,
  resetGltfPreloadQueue,
  scheduleGltfPreload,
} from '@/engine/assets/gltfPreloadScheduler';
import { unloadSceneGpuResources } from '@/engine/three/unloadSceneGpuResources';

const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

/**
 * Derived variants (pier_evening ↔ river_pier) share GPU pools — do not unload mid-hop.
 * Canonical guard for scene:unload GLTF eviction + module ownership release.
 */
export function shouldUnloadSceneGpuOnTransition(
  sceneId: SceneId,
  nextSceneId: SceneId,
): boolean {
  if (sceneId === nextSceneId) return false;
  return resolveDerivedSceneId(sceneId) !== resolveDerivedSceneId(nextSceneId);
}

/**
 * Single scene:unload teardown path: ownership claims + GLTF/Cache eviction.
 * Prefer this over ad-hoc dispose of module-level shared resources.
 */
export function releaseSceneGpuOnUnload(sceneId: SceneId, nextSceneId: SceneId): void {
  if (!shouldUnloadSceneGpuOnTransition(sceneId, nextSceneId)) return;
  unloadSceneGpuResources(resolveDerivedSceneId(sceneId));
  evictSceneGpuCache(sceneId, nextSceneId);
}

/** GLB assets warmed per scene — extend as interior props migrate off procedural meshes. */
const SCENE_GLTF_ASSETS: Partial<Record<SceneId, readonly string[]>> = {
  cafe_evening: ['env_cafe_props', 'interior_cafe'],
  park_day: ['veg_tree_pine'],
  volodka_room: ['player_volodka'], // apartment_envelope.glb + ThinMonitors own the wake room
  volodka_corridor: ['interior_corridor'],
  office_day: ['interior_office'],
  library_day: ['interior_library'],
  abandoned_factory: ['interior_factory'],
  factory_basement: ['interior_basement'],
  rooftop_edge: ['interior_rooftop'],
  river_pier: ['interior_pier'],
  chk_forest_zorge: ['interior_forest_clearing', 'veg_tree_pine'],
  street_night: [],
};

/** Kenney prop ids used per scene — derived from scenePropDressing placements. */
function getScenePropIds(sceneId: SceneId): readonly string[] {
  return getScenePropDressingIds(sceneId);
}

/** All NPC ids that may appear in a scene (base schedules + act overrides). */
export function getScheduleBackedNpcIdsForScene(sceneId: SceneId): readonly string[] {
  const rootSceneId = resolveDerivedSceneId(sceneId);
  const ids = new Set<string>();

  for (const [npcId, schedule] of Object.entries(NPC_SCHEDULES_MAP)) {
    for (const entry of schedule.entries) {
      if (sceneMatchesScheduleEntry(rootSceneId, entry.sceneId)) {
        ids.add(npcId);
        break;
      }
    }
  }

  for (const override of ACT_SCHEDULE_OVERRIDES) {
    for (const entry of override.entries) {
      if (sceneMatchesScheduleEntry(rootSceneId, entry.sceneId)) {
        ids.add(override.npcId);
        break;
      }
    }
  }

  return [...ids].sort();
}

function getSceneNpcIds(sceneId: SceneId): readonly string[] {
  return getScheduleBackedNpcIdsForScene(sceneId);
}

export function getSceneGltfAssetIds(sceneId: SceneId): readonly string[] {
  return SCENE_GLTF_ASSETS[resolveDerivedSceneId(sceneId)] ?? [];
}

function collectAssetUrls(assetId: string): string[] {
  const asset = getAssetDefinition(assetId);
  if (!asset) return [];
  const urls = new Set<string>();
  for (const lod of asset.lods) urls.add(lod.url);
  if (asset.variants) {
    for (const url of Object.values(asset.variants)) {
      if (url) urls.add(url);
    }
  }
  return [...urls];
}

function evictGltfUrl(url: string): void {
  useGLTF.clear(url);
  Cache.remove(url);
}

function preloadScenePropModels(sceneId: SceneId): void {
  preloadScenePropDressing(resolveDerivedSceneId(sceneId));
}

function preloadSceneNpcModels(sceneId: SceneId): void {
  for (const npcId of getSceneNpcIds(sceneId)) {
    if (!isUniqueNpcMeshOnDisk(npcId)) continue;
    const url = resolveNpcModelUrl(npcId);
    if (!url) continue;
    scheduleGltfPreload(
      url,
      () => useGLTF.preload(url, true, true, extendLoader),
      GltfPreloadPriority.Low,
    );
  }
}

function preloadSceneStreetDressing(sceneId: SceneId): void {
  for (const url of getSceneStreetDressingUrls(sceneId)) {
    scheduleGltfPreload(
      url,
      () => useGLTF.preload(url, true, true, extendLoader),
      GltfPreloadPriority.High,
    );
  }
}

export function preloadSceneGpuAssets(sceneId: SceneId): void {
  resetGltfPreloadQueue();

  for (const assetId of getSceneGltfAssetIds(sceneId)) {
    const priority = assetId.startsWith('interior_')
      ? GltfPreloadPriority.Deferred
      : GltfPreloadPriority.Critical;
    preloadGltfAsset(assetId, priority);
  }
  preloadTriggerZoneProps(sceneId, GltfPreloadPriority.High);
  preloadScenePropModels(sceneId);
  preloadSceneStreetDressing(sceneId);
  preloadSceneNpcModels(sceneId);
  if (isAssetEffectiveShipped('fps_arms')) {
    scheduleGltfPreload(
      FPS_ARMS_URL,
      () => useGLTF.preload(FPS_ARMS_URL, true, true, extendLoader),
      GltfPreloadPriority.Deferred,
    );
  }
}

/** Warm a single NPC GLB before approach / dialogue (interaction:start). */
export function preloadNpcModel(npcId: string): void {
  if (!isUniqueNpcMeshOnDisk(npcId)) return;
  const url = resolveNpcModelUrl(npcId);
  if (!url) return;
  scheduleGltfPreload(
    url,
    () => useGLTF.preload(url, true, true, extendLoader),
    GltfPreloadPriority.Critical,
  );
}

/** Remove loader + Cache entries for assets only used by `fromSceneId`. */
export function evictSceneGpuCache(fromSceneId: SceneId, keepSceneId?: SceneId): void {
  const fromRoot = resolveDerivedSceneId(fromSceneId);
  const keepRoot = keepSceneId !== undefined ? resolveDerivedSceneId(keepSceneId) : undefined;
  const keepGltfAssetIds = new Set<string>();
  const keepPropIds = new Set<string>();
  const keepNpcIds = new Set<string>();
  if (keepRoot !== undefined) {
    for (const assetId of getSceneGltfAssetIds(keepSceneId!)) {
      keepGltfAssetIds.add(assetId);
    }
    for (const propId of getScenePropIds(keepRoot)) {
      keepPropIds.add(propId);
    }
    for (const npcId of getSceneNpcIds(keepSceneId!)) {
      keepNpcIds.add(npcId);
    }
  }

  for (const assetId of SCENE_GLTF_ASSETS[fromRoot] ?? []) {
    if (keepGltfAssetIds.has(assetId)) continue;
    for (const url of collectAssetUrls(assetId)) {
      evictGltfUrl(url);
    }
  }

  for (const propId of getScenePropIds(fromRoot)) {
    if (keepPropIds.has(propId)) continue;
    const def = getPropModelDefinition(propId);
    if (def) evictGltfUrl(def.url);
  }

  for (const npcId of getSceneNpcIds(fromSceneId)) {
    if (keepNpcIds.has(npcId)) continue;
    const url = resolveNpcModelUrl(npcId);
    if (url) evictGltfUrl(url);
  }

  const keepStreetDressingUrls = new Set<string>();
  if (keepRoot !== undefined) {
    for (const url of getSceneStreetDressingUrls(keepSceneId!)) {
      keepStreetDressingUrls.add(url);
    }
  }
  for (const url of getSceneStreetDressingUrls(fromSceneId)) {
    if (keepStreetDressingUrls.has(url)) continue;
    evictGltfUrl(url);
  }
}

/** Evict old scene GPU cache, then preload the destination scene. */
export function handleSceneGpuTransition(fromSceneId: SceneId, toSceneId: SceneId): void {
  releaseSceneGpuOnUnload(fromSceneId, toSceneId);
  preloadSceneGpuAssets(toSceneId);
  preloadSceneJsChunks(toSceneId);
}

/** Warm GLTF decoder path during menu / boot. */
export function preloadAdjacentSceneAssets(sceneId: SceneId): void {
  preloadSceneGpuAssets(sceneId);
}
