/**
 * Scene GPU lifecycle — evict previous scene loader cache, preload next scene GLBs.
 * Runs on scene:enter (after store update, before visual Suspense resolves).
 */

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { SceneId } from '@/shared/types/game';
import { getAssetDefinition } from '@/config/assetManifest';
import { preloadGltfAsset } from '@/components/3d/assets/GltfAsset';
import { preloadTriggerZoneProps } from '@/components/3d/TriggerZoneProp';
import { preloadSceneJsChunks } from '@/components/3d/sceneChunks/sceneChunkRegistry';
import { getNpcModelUrls } from '@/config/npcModelRegistry';
import { getPropModelUrls } from '@/config/propModelRegistry';
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

export function preloadSceneGpuAssets(sceneId: SceneId): void {
  for (const assetId of getSceneGltfAssetIds(sceneId)) {
    preloadGltfAsset(assetId);
  }
  preloadTriggerZoneProps(sceneId);
  useGLTF.preload(FPS_ARMS_URL, true, true, extendLoader);
  for (const url of getPropModelUrls()) {
    useGLTF.preload(url, true, true, extendLoader);
  }
  for (const url of getNpcModelUrls()) {
    useGLTF.preload(url, true, true, extendLoader);
  }
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
