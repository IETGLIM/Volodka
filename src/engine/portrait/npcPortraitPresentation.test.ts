import { describe, expect, it } from 'vitest';
import { LRUCache } from '@/shared/utils/LRUCache';
import {
  adaptPortraitAppearance,
  buildPortraitCacheKey,
  fallbackAppearance,
  hashString,
  neonGlowFromSeed,
} from '@/engine/portrait/npcPortraitPresentation';
import {
  clearNpcPortraitCache,
  getCachedNpcPortrait,
  resetNpcPortraitCacheForTests,
  setCachedNpcPortrait,
} from '@/engine/portrait/npcPortraitGeneration';

describe('LRUCache', () => {
  it('evicts oldest entry', () => {
    const evicted: number[] = [];
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3, (value) => evicted.push(value));
    expect(cache.get('b')).toBeUndefined();
    expect(evicted).toEqual([2]);
  });
});

describe('npcPortraitPresentation', () => {
  it('generates distinct glow colors from seed', () => {
    const a = neonGlowFromSeed(1);
    const b = neonGlowFromSeed(2);
    expect(a).not.toBe(b);
    expect(a.startsWith('hsl(')).toBe(true);
  });

  it('adapts appearance for color blind modes', () => {
    const base = fallbackAppearance(1);
    const adapted = adaptPortraitAppearance(base, 'deuteranopia');
    expect(adapted.glowColor).toBe('#facc15');
  });

  it('builds stable cache keys', () => {
    const appearance = fallbackAppearance(hashString('npc-a'));
    const key = buildPortraitCacheKey('npc-a', 'Albert', appearance, 'none');
    expect(key).toContain('npc-a');
    expect(key).toContain('A');
  });
});

describe('npcPortraitCache', () => {
  it('stores and clears cached urls', () => {
    resetNpcPortraitCacheForTests();
    const appearance = fallbackAppearance(3);
    const key = buildPortraitCacheKey('x', 'Test', appearance, 'none');
    setCachedNpcPortrait(key, 'blob:test');
    expect(getCachedNpcPortrait(key)).toBe('blob:test');
    clearNpcPortraitCache();
    expect(getCachedNpcPortrait(key)).toBeUndefined();
  });
});
