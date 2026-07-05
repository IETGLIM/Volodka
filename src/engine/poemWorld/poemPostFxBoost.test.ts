import { describe, expect, it } from 'vitest';
import { resolvePoemTTLPostFxBoost } from '@/engine/poemWorld/poemPostFxBoost';

describe('resolvePoemTTLPostFxBoost', () => {
  const now = 1_000_000;

  it('returns zero boost when no live TTL flags', () => {
    expect(resolvePoemTTLPostFxBoost({}, false, now)).toEqual({
      bloomIntensity: 0,
      vignetteDarkness: 0,
    });
  });

  it('boosts bloom for exploration guiding star', () => {
    const boost = resolvePoemTTLPostFxBoost(
      {
        guiding_star_active: {
          key: 'guiding_star_active',
          poemId: 'poem_3',
          expiryTimestamp: now + 60_000,
        },
      },
      false,
      now,
    );
    expect(boost.bloomIntensity).toBeGreaterThan(0);
    expect(boost.vignetteDarkness).toBeGreaterThan(0);
  });

  it('scales down boost for reduced motion', () => {
    const full = resolvePoemTTLPostFxBoost(
      {
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: now + 30_000,
        },
      },
      false,
      now,
    );
    const reduced = resolvePoemTTLPostFxBoost(
      {
        truth_voice_active: {
          key: 'truth_voice_active',
          poemId: 'poem_1',
          expiryTimestamp: now + 30_000,
        },
      },
      true,
      now,
    );
    expect(reduced.bloomIntensity).toBeLessThan(full.bloomIntensity);
    expect(reduced.vignetteDarkness).toBeLessThan(full.vignetteDarkness);
  });
});
