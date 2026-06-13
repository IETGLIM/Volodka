import { describe, it, expect } from 'vitest';
import {
  getMusicIntensityLayer,
  setMusicIntensityLayer,
  musicLayerForMode,
} from '@/engine/audio/musicIntensityLayers';

describe('musicIntensityLayers', () => {
  it('maps combat mode to combat layer', () => {
    expect(musicLayerForMode('combat')).toBe('combat');
    expect(musicLayerForMode('exploration')).toBe('exploration');
  });

  it('updates current layer', () => {
    setMusicIntensityLayer('tension');
    expect(getMusicIntensityLayer()).toBe('tension');
    setMusicIntensityLayer('exploration');
  });
});
