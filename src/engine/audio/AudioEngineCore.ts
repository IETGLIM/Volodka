/* ─── Volodka RPG – Core audio engine infrastructure ─── */

import { getSharedAudioContext } from '../SharedAudioContext';

export { getSharedAudioContext };

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
      // Exponential decay with random noise
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
