import { describe, expect, it } from 'vitest';
import { getReverbImpulse, clearReverbImpulseCacheForTests } from './AudioEngineCore';

describe('reverb impulse cache', () => {
  it('returns the same buffer instance for identical decay', () => {
    const ctx = {
      sampleRate: 48_000,
      createBuffer: (channels: number, length: number, sampleRate: number) => ({
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: () => new Float32Array(length),
      }),
    } as unknown as AudioContext;

    clearReverbImpulseCacheForTests();
    const first = getReverbImpulse(ctx, 1.5);
    const second = getReverbImpulse(ctx, 1.5);
    expect(second).toBe(first);
  });
});
