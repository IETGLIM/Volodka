/**
 * Client for textureGen.worker — transferable buffers → DataTextures on main thread.
 */

import * as THREE from 'three';
import type { TextureGenRequest, TextureGenResponse } from '@/proceduralAaa/workers/textureGen.worker';
import type { DynamicTextureKind, DynamicTextureSet } from '@/proceduralAaa/DynamicTextureGenerator';

let worker: Worker | null = null;
let reqId = 0;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(
      new URL('./workers/textureGen.worker.ts', import.meta.url),
      { type: 'module' },
    );
  }
  return worker;
}

function makeTex(data: Uint8Array, size: number, colorSpace: THREE.ColorSpace): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size);
  tex.colorSpace = colorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Off-main-thread texture gen; falls back to sync if workers unavailable. */
export async function generateDynamicTexturesAsync(
  kind: DynamicTextureKind,
  size: number,
  seed: number,
): Promise<DynamicTextureSet> {
  const w = getWorker();
  if (!w) {
    const { generateDynamicTexturesSync } = await import('@/proceduralAaa/DynamicTextureGenerator');
    return generateDynamicTexturesSync(kind, size as 512 | 1024 | 2048, seed);
  }

  const id = ++reqId;
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<TextureGenResponse>) => {
      if (event.data.id !== id) return;
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      const d = event.data;
      resolve({
        albedo: makeTex(new Uint8Array(d.albedo), d.size, THREE.SRGBColorSpace),
        normal: makeTex(new Uint8Array(d.normal), d.size, THREE.NoColorSpace),
        roughness: makeTex(new Uint8Array(d.roughness), d.size, THREE.NoColorSpace),
        metalness: makeTex(new Uint8Array(d.metalness), d.size, THREE.NoColorSpace),
        height: makeTex(new Uint8Array(d.height), d.size, THREE.NoColorSpace),
        size: d.size,
        kind: d.kind as DynamicTextureKind,
      });
    };
    const onError = (e: ErrorEvent) => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      reject(e.error ?? new Error(e.message));
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    const req: TextureGenRequest = { op: 'genTexture', id, kind, size, seed };
    w.postMessage(req);
  });
}
