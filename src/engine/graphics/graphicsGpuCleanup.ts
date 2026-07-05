/**
 * Evicts quality-dependent GPU caches when the graphics preset changes.
 * Registered once inside Canvas via GltfPipelineInit.
 *
 * [roadmap:GFX-04] Surgical eviction on degrade — only texture caches, NOT
 * GLB caches. GLBs are reused across tiers; evicting them during a
 * memory-pressure hitch forces re-fetch + re-decode on the next frame,
 * making the hitch WORSE before it gets better. Full eviction only on
 * upgrade (new GLB variants needed) or manual preset change (explicit user action).
 */

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { ASSET_MANIFEST } from '@/config/assetManifest';
import { FPS_ARMS_URL } from '@/config/fpsArmsUrl';
import { getNpcModelUrls } from '@/config/npcModelRegistry';
import { getPropModelUrls } from '@/config/propModelRegistry';
import {
  QUALITY_GPU_CLEANUP,
  type GpuCleanupReason,
  type QualityGpuCleanupDetail,
} from '@/engine/graphics/graphicsSettingsStorage';
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

/**
 * Clear texture caches only (procedural sky, canvas textures, texture reuse map,
 * NPC template cache). Cheaper than full eviction — these are regenerated on demand.
 * Used on degrade to avoid forcing GLB re-fetch during a memory-pressure hitch.
 */
export function evictTextureCachesOnly(): void {
  evictCanvasTextureCache();
  clearSkyTextureCache();
  evictTextureReuseMap();
  evictNpcTemplateCache();
}

/**
 * Clear loader caches and module-level texture/material pools — full eviction.
 * Used on upgrade (new GLB variants needed) or manual preset change.
 */
export function evictQualityDependentGpuCache(): void {
  for (const url of collectQualityDependentGltfUrls()) {
    useGLTF.clear(url);
    THREE.Cache.remove(url);
  }
  evictTextureCachesOnly();
}

let listenerRegistered = false;

export function registerQualityGpuCleanupListener(): void {
  if (listenerRegistered || typeof window === 'undefined') return;
  listenerRegistered = true;
  window.addEventListener(QUALITY_GPU_CLEANUP, (e: Event) => {
    const detail = (e as CustomEvent<QualityGpuCleanupDetail>).detail;
    const reason: GpuCleanupReason = detail?.reason ?? 'manual';
    // [roadmap:GFX-04] Surgical eviction on degrade — texture caches only.
    // Full eviction on upgrade/manual — GLB variants may differ at new tier.
    if (reason === 'degrade') {
      evictTextureCachesOnly();
    } else {
      evictQualityDependentGpuCache();
    }
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
