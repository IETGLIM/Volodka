/* ─── Volodka RPG – Core audio engine infrastructure ─── */

import { getSharedAudioContext, safeResume, whenAudioReady, isSharedAudioContextReady } from '../SharedAudioContext';

export { getSharedAudioContext, safeResume, whenAudioReady, isSharedAudioContextReady };

/** Cached impulse buffers keyed by sampleRate + decay — avoids ~96k-sample regen per preset change. */
const reverbImpulseCache = new Map<string, AudioBuffer>();

function reverbImpulseCacheKey(sampleRate: number, decaySeconds: number): string {
  return `${sampleRate}:${decaySeconds.toFixed(4)}`;
}

/**
 * Create an artificial reverb impulse response.
 * Used by the ambient music system for pad reverb.
 */
export function createReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(sampleRate * decaySeconds);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4 / decaySeconds);
    }
  }

  return buffer;
}

/**
 * Create an impulse response buffer for ambient reverb.
 * Used by the ambient drone system for scene reverb.
 */
export function createAmbientReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
  return createReverbImpulse(ctx, decaySeconds);
}

/** Return a cached reverb impulse for the given decay (shared across music + ambient buses). */
export function getReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
  const key = reverbImpulseCacheKey(ctx.sampleRate, decaySeconds);
  const cached = reverbImpulseCache.get(key);
  if (cached) return cached;

  const buffer = createReverbImpulse(ctx, decaySeconds);
  reverbImpulseCache.set(key, buffer);
  return buffer;
}

/** Alias for ambient/SFX convolvers — same algorithm and cache as getReverbImpulse. */
export function getAmbientReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
  return getReverbImpulse(ctx, decaySeconds);
}

/** Drop cached impulses when the shared AudioContext is closed (HMR / unmount). */
export function clearReverbImpulseCache(): void {
  reverbImpulseCache.clear();
}

/** Test harness — clear impulse caches between cases. */
export function clearReverbImpulseCacheForTests(): void {
  clearReverbImpulseCache();
}

/** Stop a buffer source and drop its AudioBuffer so GC can reclaim scene audio memory. */
export function releaseBufferSource(source: AudioBufferSourceNode): void {
  try {
    source.stop();
  } catch {
    // already stopped
  }
  try {
    source.disconnect();
  } catch {
    // ignore
  }
  source.buffer = null;
}

/** Disconnect a convolver and release its impulse response buffer. */
export function releaseConvolver(convolver: ConvolverNode): void {
  try {
    convolver.disconnect();
  } catch {
    // ignore
  }
  convolver.buffer = null;
}
