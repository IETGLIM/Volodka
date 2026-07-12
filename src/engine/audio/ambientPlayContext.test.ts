import { describe, expect, it } from 'vitest';
import {
  buildAmbienceResolveOptions,
  getStoryProceduralAmbientOverride,
  resolveAmbientPresentation,
} from '@/engine/audio/ambientPlayContext';

describe('ambientPlayContext', () => {
  it('returns story override only when overlay is open', () => {
    expect(getStoryProceduralAmbientOverride(false, 'act6_nadzor_battle')).toBeUndefined();
    expect(getStoryProceduralAmbientOverride(true, 'act6_nadzor_battle')).toBe('combat');
  });

  it('builds weather + story options for scene resolution', () => {
    const opts = buildAmbienceResolveOptions(true, 'act6_nadzor_battle', 'battle', 12);
    expect(opts.proceduralOverride).toBe('combat');
    expect(opts.weather).toBe('storm');
  });

  it('resolves presentation labels for exploration', () => {
    const state = resolveAmbientPresentation('river_pier', 14, false, null);
    expect(state.resolved?.sound).toBe('pier');
    expect(state.label).toContain('Пирс');
    expect(state.accessibilityDescription).toBeTruthy();
  });
});
