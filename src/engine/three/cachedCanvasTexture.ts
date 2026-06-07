import * as THREE from 'three';

interface CacheEntry {
  texture: THREE.CanvasTexture;
  refs: number;
}

const canvasTextureCache = new Map<string, CacheEntry>();

/** Module-level canvas texture cache — survives scene transitions, ref-counted per consumer. */
export function getCachedCanvasTexture(
  key: string,
  factory: () => THREE.CanvasTexture,
): THREE.CanvasTexture {
  const existing = canvasTextureCache.get(key);
  if (existing) {
    existing.refs += 1;
    return existing.texture;
  }
  const texture = factory();
  canvasTextureCache.set(key, { texture, refs: 1 });
  return texture;
}

export function releaseCachedCanvasTexture(key: string): void {
  const entry = canvasTextureCache.get(key);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.texture.dispose();
    canvasTextureCache.delete(key);
  }
}

/** Test-only reset */
export function clearCanvasTextureCacheForTests(): void {
  for (const entry of canvasTextureCache.values()) {
    entry.texture.dispose();
  }
  canvasTextureCache.clear();
}
