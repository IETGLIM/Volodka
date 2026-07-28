/**
 * Pure buffer helpers for procedural noise bursts / loops.
 */

/** Fill a channel with white noise shaped by an exponential decay envelope. */
export function fillDecayedNoise(
  data: Float32Array,
  decayRate: number,
): void {
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decayRate);
  }
}

/** Fill a channel with flat white noise (optionally scaled). */
export function fillWhiteNoise(data: Float32Array, amplitude = 1): void {
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * amplitude;
  }
}

/** Create a mono AudioBuffer filled with decayed noise. */
export function createDecayedNoiseBuffer(
  ctx: AudioContext,
  durationSeconds: number,
  decayRate: number,
): AudioBuffer {
  const bufferSize = Math.ceil(ctx.sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  fillDecayedNoise(buffer.getChannelData(0), decayRate);
  return buffer;
}

/** Create a looping mono white-noise buffer (default 2s). */
export function createLoopingWhiteNoiseBuffer(
  ctx: AudioContext,
  durationSeconds = 2,
): AudioBuffer {
  const bufferSize = Math.ceil(ctx.sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  fillWhiteNoise(buffer.getChannelData(0));
  return buffer;
}
