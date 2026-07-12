import { describe, expect, it } from 'vitest';
import {
  getMusicIntensityLayer,
  resolveMusicIntensityLayer,
  setMusicIntensityLayer,
} from './musicIntensityLayers';

describe('resolveMusicIntensityLayer', () => {
  it('maps combat to combat layer', () => {
    expect(resolveMusicIntensityLayer('combat')).toBe('combat');
  });

  it('maps cutscene to tension', () => {
    expect(resolveMusicIntensityLayer('cutscene')).toBe('tension');
  });

  it('maps story overlay during exploration to tension', () => {
    expect(resolveMusicIntensityLayer('exploration', { showStoryOverlay: true })).toBe('tension');
  });

  it('keeps exploration when no overlay', () => {
    expect(resolveMusicIntensityLayer('exploration')).toBe('exploration');
    expect(resolveMusicIntensityLayer('exploration', { showStoryOverlay: false })).toBe('exploration');
  });
});

describe('setMusicIntensityLayer', () => {
  it('updates current layer', () => {
    setMusicIntensityLayer('tension');
    expect(getMusicIntensityLayer()).toBe('tension');
    setMusicIntensityLayer('exploration');
  });
});
