import * as THREE from 'three';

const MIN_ESTIMATE_BYTES = 64_000;
const MAX_ESTIMATE_BYTES = 250_000_000;

function addTextureBytes(tex: THREE.Texture | null | undefined, sum: { n: number }) {
  if (!tex?.image) return;
  const img = tex.image as {
    width?: number;
    height?: number;
    data?: ArrayBufferView;
  };
  const w = img.width ?? 0;
  const h = img.height ?? 0;
  if (w > 0 && h > 0) {
    sum.n += w * h * 4;
    return;
  }
  if (img.data && typeof (img.data as ArrayBufferView).byteLength === 'number') {
    sum.n += (img.data as ArrayBufferView).byteLength;
  }
}

function accumulateMaterialTextures(mat: THREE.Material, sum: { n: number }) {
  const rec = mat as unknown as Record<string, unknown>;
  for (const k of Object.keys(rec)) {
    if (k === 'uuid' || k === 'type' || k === 'name' || k === 'version') continue;
    const v = rec[k];
    if (v && typeof v === 'object' && 'isTexture' in v && (v as THREE.Texture).isTexture) {
      addTextureBytes(v as THREE.Texture, sum);
    }
  }
}

function accumulateGeometryBytes(geo: THREE.BufferGeometry, sum: { n: number }) {
  if (geo.index?.array) sum.n += geo.index.array.byteLength;
  for (const key of Object.keys(geo.attributes)) {
    const a = geo.attributes[key];
    if (a?.array) sum.n += a.array.byteLength;
  }
  const morph = geo.morphAttributes;
  if (morph) {
    for (const key of Object.keys(morph)) {
      const arr = morph[key];
      if (!arr) continue;
      for (const attr of arr) {
        if (attr?.array) sum.n += attr.array.byteLength;
      }
    }
  }
}

/**
 * Грубая оценка VRAM (геометрия + текстуры по дереву), без `renderer.info` — достаточно для LRU-бюджета.
 * Не учитывает mip-chain полностью (умножаем текстуры ~1.33 как запас).
 */
export function estimateObject3DGpuBytes(root: THREE.Object3D): number {
  const sum = { n: 0 };
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh & { isMesh?: boolean; isSkinnedMesh?: boolean };
    if (mesh.isMesh || mesh.isSkinnedMesh) {
      const g = mesh.geometry as THREE.BufferGeometry | undefined;
      if (g) accumulateGeometryBytes(g, sum);
      const mats = mesh.material;
      if (Array.isArray(mats)) {
        for (const m of mats) {
          if (m) accumulateMaterialTextures(m, sum);
        }
      } else if (mats) {
        accumulateMaterialTextures(mats, sum);
      }
    }
    const line = obj as THREE.Line & { isLine?: boolean };
    if (line.isLine && line.geometry) {
      accumulateGeometryBytes(line.geometry as THREE.BufferGeometry, sum);
    }
    const pts = obj as THREE.Points & { isPoints?: boolean };
    if (pts.isPoints && pts.geometry) {
      accumulateGeometryBytes(pts.geometry as THREE.BufferGeometry, sum);
    }
  });
  const texBoost = Math.ceil(sum.n * 0.33);
  const total = sum.n + texBoost;
  return Math.max(MIN_ESTIMATE_BYTES, Math.min(MAX_ESTIMATE_BYTES, total));
}

/** Только dev: оценка по сцене + при наличии `performance.memory` (Chromium). */
export function logGltfLoadedFootprintDev(url: string, root: THREE.Object3D) {
  if (process.env.NODE_ENV !== 'development') return;
  const est = estimateObject3DGpuBytes(root);
  const mem =
    typeof performance !== 'undefined' &&
    performance &&
    'memory' in performance &&
    typeof (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize ===
      'number'
      ? (performance as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize
      : undefined;
  const heap = mem != null ? ` jsHeap≈${(mem / (1024 * 1024)).toFixed(0)}MB` : '';
  console.debug(`[gltfByteEstimate] ${url} ~${(est / (1024 * 1024)).toFixed(2)} MB (geom+tex est)${heap}`);
}
