/**
 * Scene GPU lifecycle — evict previous scene loader cache, preload next scene GLBs.
 * Prop/NPC preloads are scoped per scene instead of loading the full registry.
 */

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { SceneId } from '@/shared/types/game';
import { getAssetDefinition } from '@/config/assetManifest';
import { preloadGltfAsset } from '@/components/3d/assets/GltfAsset';
import { preloadTriggerZoneProps } from '@/components/3d/TriggerZoneProp';
import { preloadSceneJsChunks } from '@/components/3d/sceneChunks/sceneChunkRegistry';
import { resolveNpcModelUrl } from '@/config/npcModelRegistry';
import { getPropModelDefinition } from '@/config/propModelRegistry';
import { extendGltfLoader } from '@/engine/assets/gltfPipeline';

const FPS_ARMS_URL = '/models/fps/fps_arms.glb';
const extendLoader = extendGltfLoader as unknown as NonNullable<Parameters<typeof useGLTF>[3]>;

/** GLB assets warmed per scene — extend as interior props migrate off procedural meshes. */
const SCENE_GLTF_ASSETS: Partial<Record<SceneId, readonly string[]>> = {
  cafe_evening: ['env_cafe_props'],
  park_day: ['veg_tree_pine'],
  volodka_room: ['player_volodka'],
  volodka_corridor: [],
};

/** Kenney prop ids used per scene (trigger-zone props + set dressing). */
const SCENE_PROP_IDS: Partial<Record<SceneId, readonly string[]>> = {
  volodka_room: ['kenney_desk', 'kenney_bed', 'kenney_wardrobe', 'kenney_terminal'],
  volodka_corridor: ['kenney_door'],
  office_day: ['kenney_desk', 'kenney_terminal', 'kenney_bookshelf'],
  library_day: ['kenney_bookshelf'],
  zarema_albert_room: ['kenney_bed', 'kenney_wardrobe'],
  cafe_evening: ['kenney_desk'],
};

/** Shipped GLB NPC ids present in each scene (procedural NPCs are not preloaded). */
const SCENE_NPC_IDS: Partial<Record<SceneId, readonly string[]>> = {
  cafe_evening: ['cafe_barista'],
  office_day: ['office_colleague'],
};

export function getSceneGltfAssetIds(sceneId: SceneId): readonly string[] {
  return SCENE_GLTF_ASSETS[sceneId] ?? [];
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

function preloadScenePropModels(sceneId: SceneId): void {
  for (const propId of SCENE_PROP_IDS[sceneId] ?? []) {
    const def = getPropModelDefinition(propId);
    if (def) useGLTF.preload(def.url, true, true, extendLoader);
  }
}

function preloadSceneNpcModels(sceneId: SceneId): void {
  for (const npcId of SCENE_NPC_IDS[sceneId] ?? []) {
    const url = resolveNpcModelUrl(npcId);
    if (url) useGLTF.preload(url, true, true, extendLoader);
  }
}

export function preloadSceneGpuAssets(sceneId: SceneId): void {
  for (const assetId of getSceneGltfAssetIds(sceneId)) {
    preloadGltfAsset(assetId);
  }
  preloadTriggerZoneProps(sceneId);
  preloadScenePropModels(sceneId);
  preloadSceneNpcModels(sceneId);
  useGLTF.preload(FPS_ARMS_URL, true, true, extendLoader);
}

/** Remove loader + THREE.Cache entries for assets only used by `fromSceneId`. */
export function evictSceneGpuCache(fromSceneId: SceneId, keepSceneId?: SceneId): void {
  const keepIds = new Set<string>();
  if (keepSceneId !== undefined) {
    for (const assetId of getSceneGltfAssetIds(keepSceneId)) {
      keepIds.add(assetId);
    }
  }

  for (const assetId of getSceneGltfAssetIds(fromSceneId)) {
    if (keepIds.has(assetId)) continue;
    for (const url of collectAssetUrls(assetId)) {
      useGLTF.clear(url);
      THREE.Cache.remove(url);
    }
  }
}

/** Evict old scene GPU cache, then preload the destination scene. */
export function handleSceneGpuTransition(fromSceneId: SceneId, toSceneId: SceneId): void {
  if (fromSceneId !== toSceneId) {
    evictSceneGpuCache(fromSceneId, toSceneId);
  }
  preloadSceneGpuAssets(toSceneId);
  preloadSceneJsChunks(toSceneId);
}

/** Warm GLTF decoder path during menu / boot. */
export function preloadAdjacentSceneAssets(sceneId: SceneId): void {
  preloadSceneGpuAssets(sceneId);
}
