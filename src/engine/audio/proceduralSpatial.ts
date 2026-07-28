/**
 * Spatial one-shots and looping ambient sources (Panner / stereo fallback).
 */

import { SFX_PRESETS } from './sfxPresets';
import { safeStop } from './types';
import { connectSpatialSource } from './audioCapabilities';

/** Hash bark text → base voice frequency (150–249 Hz). */
export function barkBaseFrequency(text: string): number {
  const textHash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 150 + (textHash % 100);
}

export function synthesizeSpatialSfx(
  ctx: AudioContext,
  dest: AudioNode,
  type: string,
  position: [number, number, number],
  options?: {
    refDistance?: number;
    maxDistance?: number;
    rolloffFactor?: number;
    coneInnerAngle?: number;
    coneOuterAngle?: number;
    coneOuterGain?: number;
  },
): void {
  const preset = SFX_PRESETS[type] ?? SFX_PRESETS['click'];
  const now = ctx.currentTime;

  const spatial = connectSpatialSource(ctx, dest, position, {
    refDistance: options?.refDistance,
    maxDistance: options?.maxDistance,
    rolloffFactor: options?.rolloffFactor,
    coneInnerAngle: options?.coneInnerAngle,
    coneOuterAngle: options?.coneOuterAngle,
    coneOuterGain: options?.coneOuterGain,
  });

  const osc = ctx.createOscillator();
  osc.type = preset.type;
  osc.frequency.setValueAtTime(preset.frequency, now);

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(preset.gain, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

  osc.connect(envGain);
  envGain.connect(spatial.input);

  osc.start(now);
  safeStop(osc, now + preset.duration + 0.01);
  setTimeout(() => spatial.disconnect(), (preset.duration + 0.05) * 1000);
}

export function synthesizeSpatialBark(
  ctx: AudioContext,
  dest: AudioNode,
  text: string,
  position: [number, number, number],
): void {
  const now = ctx.currentTime;

  const spatial = connectSpatialSource(ctx, dest, position, {
    refDistance: 2,
    maxDistance: 20,
    rolloffFactor: 1.5,
  });

  const textHash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseFreq = barkBaseFrequency(text);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(baseFreq, now);

  const formant1 = ctx.createBiquadFilter();
  formant1.type = 'bandpass';
  formant1.frequency.value = 800 + (textHash % 400);
  formant1.Q.value = 3;

  const formant2 = ctx.createBiquadFilter();
  formant2.type = 'bandpass';
  formant2.frequency.value = 1200 + (textHash % 300);
  formant2.Q.value = 4;

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.06, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  const formant2Gain = ctx.createGain();
  formant2Gain.gain.value = 0.3;

  osc.connect(formant1);
  formant1.connect(envGain);
  envGain.connect(spatial.input);

  osc.connect(formant2);
  formant2.connect(formant2Gain);
  formant2Gain.connect(envGain);

  osc.start(now);
  safeStop(osc, now + 0.25);
  setTimeout(() => spatial.disconnect(), 300);
}

export function createSpatialAmbientSource(
  ctx: AudioContext,
  dest: AudioNode,
  position: [number, number, number],
  config: {
    type: OscillatorType;
    frequency: number;
    gain: number;
    lfoFreq?: number;
    lfoDepth?: number;
  },
): { stop: () => void; setPosition: (position: [number, number, number]) => void } {
  const now = ctx.currentTime;

  const spatial = connectSpatialSource(ctx, dest, position, {
    refDistance: 1,
    maxDistance: 25,
    rolloffFactor: 1,
  });

  const osc = ctx.createOscillator();
  osc.type = config.type;
  osc.frequency.setValueAtTime(config.frequency, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(config.gain, now);

  let lfo: OscillatorNode | null = null;
  let lfoGain: GainNode | null = null;
  if (config.lfoFreq && config.lfoDepth) {
    lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(config.lfoFreq, now);

    lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(config.lfoDepth, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now);
  }

  osc.connect(gainNode);
  gainNode.connect(spatial.input);
  osc.start(now);

  return {
    setPosition: spatial.setPosition,
    stop: () => {
      const stopNow = ctx.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, stopNow);
      gainNode.gain.linearRampToValueAtTime(0, stopNow + 0.5);
      setTimeout(() => {
        try { osc.stop(); } catch { /* already stopped */ }
        try { lfo?.stop(); } catch { /* already stopped */ }
        spatial.disconnect();
        try { gainNode.disconnect(); } catch { /* ignore */ }
        try { lfoGain?.disconnect(); } catch { /* ignore */ }
      }, 600);
    },
  };
}
