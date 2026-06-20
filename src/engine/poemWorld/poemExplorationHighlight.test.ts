import { describe, expect, it } from 'vitest';
import {
  resolvePoemExplorationHighlight,
  shouldHighlightZoneForPoemMode,
} from './poemExplorationHighlight';

describe('resolvePoemExplorationHighlight', () => {
  const now = 1_000_000;

  it('enables exploration highlight when guiding_star_active TTL is live', () => {
    const state = resolvePoemExplorationHighlight(
      {
        guiding_star_active: {
          key: 'guiding_star_active',
          poemId: 'poem_3',
          expiryTimestamp: now + 30_000,
        },
      },
      {},
      { now, reducedMotion: false },
    );
    expect(state.mode).toBe('exploration');
    expect(state.pulse).toBe(true);
    expect(state.color).toBe('#ffd866');
  });

  it('disables pulse when reduced motion is on', () => {
    const state = resolvePoemExplorationHighlight(
      {
        guiding_star_active: {
          key: 'guiding_star_active',
          poemId: 'poem_3',
          expiryTimestamp: now + 30_000,
        },
      },
      {},
      { now, reducedMotion: true },
    );
    expect(state.mode).toBe('exploration');
    expect(state.pulse).toBe(false);
  });

  it('returns none when guiding star TTL expired', () => {
    const state = resolvePoemExplorationHighlight(
      {
        guiding_star_active: {
          key: 'guiding_star_active',
          poemId: 'poem_3',
          expiryTimestamp: now - 1,
        },
      },
      {},
      { now },
    );
    expect(state.mode).toBe('none');
  });

  it('maps npc_shimmer hint flag to dialogue zone filter', () => {
    const state = resolvePoemExplorationHighlight(
      {},
      { poem_hint_npc_shimmer_active: true },
      { now },
    );
    expect(state.mode).toBe('dialogue');
    expect(shouldHighlightZoneForPoemMode({ linkedNpcId: 'albert' }, state.mode)).toBe(true);
    expect(shouldHighlightZoneForPoemMode({}, state.mode)).toBe(false);
  });

  it('enables interaction highlight when child_gaze_active TTL is live', () => {
    const state = resolvePoemExplorationHighlight(
      {
        child_gaze_active: {
          key: 'child_gaze_active',
          poemId: 'poem_7',
          expiryTimestamp: now + 20_000,
        },
      },
      {},
      { now, reducedMotion: false },
    );
    expect(state.mode).toBe('interaction');
    expect(state.color).toBe('#b8f0ff');
    expect(shouldHighlightZoneForPoemMode({}, state.mode)).toBe(true);
  });
});
