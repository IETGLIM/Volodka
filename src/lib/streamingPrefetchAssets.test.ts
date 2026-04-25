import { describe, it, expect } from 'vitest';
import { collectPrefetchGltfUrlsForScene } from '@/lib/streamingPrefetchAssets';

describe('collectPrefetchGltfUrlsForScene', () => {
  it('returns unique GLB urls from volodka_room streaming chunks', () => {
    const urls = collectPrefetchGltfUrlsForScene('volodka_room');
    expect(urls).toContain('/desk_volodka.glb');
    expect(urls).toContain('/Chair.glb');
    expect(urls).toContain('/mug.glb');
    expect(urls).toContain('/Keyboard.glb');
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('returns lamp for volodka_corridor', () => {
    expect(collectPrefetchGltfUrlsForScene('volodka_corridor')).toEqual(['/lamp.glb']);
  });

  it('returns empty when scene has no streaming chunks', () => {
    expect(collectPrefetchGltfUrlsForScene('kitchen_dawn')).toEqual([]);
  });
});
