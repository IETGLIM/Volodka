/**
 * Procedural ambient drone layers, noise beds, and random one-shot events.
 * Stateless synthesis helpers — AudioEngine owns timers / node lists.
 */

import type { AmbientLayer, NoiseLayerDef, RandomSoundDef } from './types';
import { safeStop } from './types';
import { connectWithStereoPan } from './audioCapabilities';
import {
  createDecayedNoiseBuffer,
  createLoopingWhiteNoiseBuffer,
} from './audioNoiseBuffers';

export interface AmbientLayerNodes {
  osc: OscillatorNode;
  gain: GainNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
  harmonicOsc?: OscillatorNode;
  harmonicGain?: GainNode;
}

export interface NoiseLayerNodes {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter: BiquadFilterNode;
  lfo?: OscillatorNode;
}

/** Create a single ambient layer (drone oscillator + optional harmonic + LFO). */
export function createAmbientLayer(
  ctx: AudioContext,
  layer: AmbientLayer,
  destination: AudioNode,
): AmbientLayerNodes {
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = layer.type;
  osc.frequency.setValueAtTime(layer.frequency, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(layer.gain, now);

  let lfo: OscillatorNode | undefined;
  let lfoGain: GainNode | undefined;
  if (layer.lfoFreq > 0) {
    lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(layer.lfoFreq, now);

    lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(layer.lfoDepth, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
  }

  osc.connect(gain);
  gain.connect(destination);

  let harmonicOsc: OscillatorNode | undefined;
  let harmonicGain: GainNode | undefined;
  if (layer.harmonic) {
    harmonicOsc = ctx.createOscillator();
    harmonicOsc.type = layer.harmonic.type;
    harmonicOsc.frequency.setValueAtTime(layer.harmonic.frequency, now);

    harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(layer.harmonic.gain, now);

    harmonicOsc.connect(harmonicGain);
    harmonicGain.connect(destination);

    harmonicOsc.start(now);
  }

  osc.start(now);
  lfo?.start(now);

  return { osc, gain, lfo, lfoGain, harmonicOsc, harmonicGain };
}

/** Create a continuous noise layer (rain, wind, steam, etc.). */
export function createNoiseLayer(
  ctx: AudioContext,
  noiseDef: NoiseLayerDef,
  destination: AudioNode,
): NoiseLayerNodes {
  const now = ctx.currentTime;

  const buffer = createLoopingWhiteNoiseBuffer(ctx, 2);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = noiseDef.filterType;
  filter.frequency.setValueAtTime(noiseDef.filterFreq, now);
  filter.Q.value = noiseDef.filterQ;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(noiseDef.gain, now);

  let lfo: OscillatorNode | undefined;
  if (noiseDef.lfoFreq > 0) {
    lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(noiseDef.lfoFreq, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(noiseDef.lfoDepth, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    lfo.start(now);
  }

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);
  source.start(now);

  return { source, gain: gainNode, filter, lfo };
}

/** Legacy layer-level randomSound one-shot. */
export function playLegacyRandomSound(
  ctx: AudioContext,
  destination: AudioNode,
  sound: NonNullable<AmbientLayer['randomSound']>,
): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = sound.type;
  osc.frequency.setValueAtTime(
    sound.frequency * (0.85 + Math.random() * 0.3),
    now,
  );

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(sound.gain, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

  osc.connect(envGain);
  envGain.connect(destination);

  osc.start(now);
  safeStop(osc, now + sound.duration + 0.01);
}

/** Scene-level random sound event (noise or oscillator, optional stereo pan). */
export function playRandomSoundEvent(
  ctx: AudioContext,
  destination: AudioNode,
  soundDef: RandomSoundDef,
): void {
  const now = ctx.currentTime;

  if (soundDef.useNoise) {
    const duration = soundDef.duration;
    const buffer = createDecayedNoiseBuffer(ctx, duration, 5);
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = soundDef.noiseFilterFreq ?? soundDef.frequency;
    filter.Q.value = 1.0;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(soundDef.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(envGain);

    if (soundDef.panStart !== undefined && soundDef.panEnd !== undefined) {
      connectWithStereoPan(
        ctx,
        envGain,
        destination,
        soundDef.panStart,
        soundDef.panEnd,
        now,
        duration,
      );
    } else {
      envGain.connect(destination);
    }

    source.start(now);
    return;
  }

  const osc = ctx.createOscillator();
  osc.type = soundDef.type;
  const pitchVar = 0.8 + Math.random() * 0.4;
  osc.frequency.setValueAtTime(soundDef.frequency * pitchVar, now);

  if (soundDef.frequencyRamp) {
    osc.frequency.exponentialRampToValueAtTime(
      soundDef.frequencyRamp * pitchVar,
      now + soundDef.duration,
    );
  }

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(soundDef.gain, now);
  envGain.gain.exponentialRampToValueAtTime(0.001, now + soundDef.duration);

  if (soundDef.panStart !== undefined && soundDef.panEnd !== undefined) {
    osc.connect(envGain);
    connectWithStereoPan(
      ctx,
      envGain,
      destination,
      soundDef.panStart,
      soundDef.panEnd,
      now,
      soundDef.duration,
    );
  } else {
    osc.connect(envGain);
    envGain.connect(destination);
  }

  osc.start(now);
  safeStop(osc, now + soundDef.duration + 0.01);
}

/** Next delay (ms) for a scene-level random sound loop. */
export function nextRandomSoundDelayMs(soundDef: RandomSoundDef): number {
  const { minInterval, maxInterval } = soundDef;
  const baseInterval = minInterval + Math.random() * (maxInterval - minInterval);
  const variation = baseInterval * (0.8 + Math.random() * 0.4);
  return variation * 1000;
}

/** Next delay (ms) for a legacy fixed-interval random sound. */
export function nextLegacyRandomDelayMs(intervalSeconds: number): number {
  return intervalSeconds * (0.8 + Math.random() * 0.4) * 1000;
}
