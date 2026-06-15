import { describe, it, expect } from 'vitest';
import {
  getMusicIntensityLayer,
  setMusicIntensityLayer,
  resolveMusicIntensityLayer,
} from '@/engine/audio/musicIntensityLayers';

describe('musicIntensityLayers', () => {
  it('maps story overlay during exploration to tension', () => {
    expect(resolveMusicIntensityLayer('exploration', { showStoryOverlay: true })).toBe('tension');
  });

  it('updates current layer', () => {
    setMusicIntensityLayer('tension');
    expect(getMusicIntensityLayer()).toBe('tension');
    setMusicIntensityLayer('exploration');
  });
});
