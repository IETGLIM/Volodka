import * as THREE from 'three';

interface TextureEntry {
  texture: THREE.Texture;
  refs: number;
}

/** Ref-counted GPU texture reuse — complements THREE.Cache (loader) and canvas texture cache. */
const textureReuseMap = new Map<string, TextureEntry>();

export function acquireSharedTexture(
  key: string,
  factory: () => THREE.Texture,
): THREE.Texture {
  const existing = textureReuseMap.get(key);
  if (existing) {
    existing.refs += 1;
    return existing.texture;
  }
  const texture = factory();
  textureReuseMap.set(key, { texture, refs: 1 });
  return texture;
}

export function releaseSharedTexture(key: string): void {
  const entry = textureReuseMap.get(key);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.texture.dispose();
    const image = entry.texture.image as { close?: () => void } | null;
    if (image && typeof image.close === 'function') {
      image.close();
    }
    entry.texture.image = null;
    textureReuseMap.delete(key);
  }
}

export function getSharedTextureRefCount(key: string): number {
  return textureReuseMap.get(key)?.refs ?? 0;
}

/** Drop all shared textures — used on quality preset change. */
export function evictTextureReuseMap(): void {
  for (const entry of textureReuseMap.values()) {
    entry.texture.dispose();
    const image = entry.texture.image as { close?: () => void } | null;
    if (image && typeof image.close === 'function') {
      image.close();
    }
    entry.texture.image = null;
  }
  textureReuseMap.clear();
}

/** Test-only reset */
export function clearTextureReuseMapForTests(): void {
  evictTextureReuseMap();
}
