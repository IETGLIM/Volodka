/**
 * Evicts quality-dependent GPU caches when the graphics preset changes.
 * Registered once inside Canvas via GltfPipelineInit.
 */

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { ASSET_MANIFEST } from '@/config/assetManifest';
import { FPS_ARMS_URL } from '@/config/fpsArmsUrl';
import { getNpcModelUrls } from '@/config/npcModelRegistry';
import { getPropModelUrls } from '@/config/propModelRegistry';
import { QUALITY_GPU_CLEANUP } from '@/engine/graphics/graphicsSettingsStorage';
import { clearSkyTextureCache } from '@/engine/graphics/proceduralSkyTextures';
import { evictCanvasTextureCache } from '@/engine/three/cachedCanvasTexture';
import { evictNpcTemplateCache } from '@/engine/three/npcTemplateCache';
import { evictTextureReuseMap } from '@/engine/three/textureReuseMap';

function collectQualityDependentGltfUrls(): string[] {
  const urls = new Set<string>([FPS_ARMS_URL]);

  for (const asset of Object.values(ASSET_MANIFEST)) {
    for (const lod of asset.lods) urls.add(lod.url);
    if (asset.variants) {
      for (const url of Object.values(asset.variants)) {
        if (url) urls.add(url);
      }
    }
  }

  for (const url of getPropModelUrls()) urls.add(url);
  for (const url of getNpcModelUrls()) urls.add(url);

  return [...urls];
}

/** Clear loader caches and module-level texture/material pools. */
export function evictQualityDependentGpuCache(): void {
  for (const url of collectQualityDependentGltfUrls()) {
    useGLTF.clear(url);
    THREE.Cache.remove(url);
  }
  evictCanvasTextureCache();
  clearSkyTextureCache();
  evictTextureReuseMap();
  evictNpcTemplateCache();
}

let listenerRegistered = false;

export function registerQualityGpuCleanupListener(): void {
  if (listenerRegistered || typeof window === 'undefined') return;
  listenerRegistered = true;
  window.addEventListener(QUALITY_GPU_CLEANUP, () => {
    evictQualityDependentGpuCache();
  });
}

/** Reset listener guard after HMR so GltfPipelineInit can re-register. */
export function resetQualityGpuCleanupListener(): void {
  listenerRegistered = false;
}

/** Test-only reset */
export function resetQualityGpuCleanupListenerForTests(): void {
  resetQualityGpuCleanupListener();
}
