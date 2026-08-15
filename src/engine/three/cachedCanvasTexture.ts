import { CanvasTexture, SRGBColorSpace } from 'three';

interface CacheEntry {
  texture: CanvasTexture;
  refs: number;
}

const canvasTextureCache = new Map<string, CacheEntry>();

/** Module-level canvas texture cache — survives scene transitions, ref-counted per consumer. */
export function getCachedCanvasTexture(
  key: string,
  factory: () => CanvasTexture,
): CanvasTexture {
  const existing = canvasTextureCache.get(key);
  if (existing) {
    existing.refs += 1;
    return existing.texture;
  }
  const texture = factory();
  // Canvas pixels are sRGB-encoded but CanvasTexture defaults to NoColorSpace,
  // which makes Three.js treat them as linear data → textures render ~2.2×
  // too dark. Force sRGB so the renderer's color pipeline decodes them
  // correctly. This was a P1 bug: every procedural canvas texture (sky
  // gradients, painted props, paper text) appeared washed-out and dark.
  if (texture.colorSpace !== SRGBColorSpace) {
    texture.colorSpace = SRGBColorSpace;
  }
  texture.needsUpdate = true;
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

/** Drop all cached canvas textures — used on quality preset change. */
export function evictCanvasTextureCache(): void {
  for (const entry of canvasTextureCache.values()) {
    entry.texture.dispose();
  }
  canvasTextureCache.clear();
}

/** Test-only reset */
export function clearCanvasTextureCacheForTests(): void {
  evictCanvasTextureCache();
}
