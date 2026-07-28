/**
 * Procedural 3-layer scene music helpers (MusicEngine).
 * Distinct from proceduralAmbientMusic (AudioEngine ambient-music bus).
 */

import type { SceneMusicConfig } from './musicConfigs';
import { buildChord, midiToFreq, pickRandom } from './musicTheory';
import { tryCreateConvolver } from './audioCapabilities';
import { safeStop } from './types';

export interface PadVoice {
  osc: OscillatorNode;
  gain: GainNode;
}

export interface PadBus {
  padGain: GainNode;
  padFilter: BiquadFilterNode;
  padLfo: OscillatorNode;
  padLfoGain: GainNode;
  padConvolver: ConvolverNode | null;
  padConvolverGain: GainNode;
  padDryGain: GainNode;
}

export interface BassLayer {
  bassOsc: OscillatorNode;
  bassGain: GainNode;
  bassFilter: BiquadFilterNode;
}

/** Stereo-varied IR for MusicEngine pad reverb (preserves prior sonic character). */
export function createMusicReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(sampleRate * decaySeconds);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const stereoVar = channel === 0 ? 1.0 : 0.95;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4 / decaySeconds) * stereoVar;
    }
  }

  return buffer;
}

/** Wire pad filter → dry/wet reverb → destination. */
export function createPadBus(
  ctx: AudioContext,
  dest: AudioNode,
  config: SceneMusicConfig,
): PadBus {
  const now = ctx.currentTime;

  const padConvolver = tryCreateConvolver(ctx, createMusicReverbImpulse(ctx, config.padReverbDecay));
  const padConvolverGain = ctx.createGain();
  const padDryGain = ctx.createGain();

  if (padConvolver) {
    padConvolverGain.gain.value = config.padReverbMix;
    padDryGain.gain.value = 1 - config.padReverbMix;
    padConvolver.connect(padConvolverGain);
  } else {
    padConvolverGain.gain.value = 0;
    padDryGain.gain.value = 1;
  }

  const padFilter = ctx.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = config.padFilterFreq;
  padFilter.Q.value = config.padFilterQ;

  const padLfo = ctx.createOscillator();
  padLfo.type = 'sine';
  padLfo.frequency.setValueAtTime(config.padLfoFreq, now);

  const padLfoGain = ctx.createGain();
  padLfoGain.gain.setValueAtTime(config.padLfoDepth, now);

  padLfo.connect(padLfoGain);
  padLfoGain.connect(padFilter.frequency);

  const padGain = ctx.createGain();
  padGain.gain.setValueAtTime(0, now);

  padFilter.connect(padGain);
  padGain.connect(padDryGain);
  if (padConvolver) {
    padGain.connect(padConvolver);
  }
  padDryGain.connect(dest);
  if (padConvolver) {
    padConvolverGain.connect(dest);
  }

  padLfo.start(now);

  return {
    padGain,
    padFilter,
    padLfo,
    padLfoGain,
    padConvolver,
    padConvolverGain,
    padDryGain,
  };
}

/** Create pad + chorus oscillators for the current chord degree. */
export function createPadChordVoices(
  ctx: AudioContext,
  padFilter: BiquadFilterNode,
  config: SceneMusicConfig,
  chordDegree: number,
  startTime: number,
): PadVoice[] {
  const voices: PadVoice[] = [];
  const chordMidi = buildChord(
    config.scale,
    config.rootMidi,
    chordDegree,
    config.chordVoices,
    config.useSeventhChords,
    config.useOpenFifths,
  );

  for (const midiNote of chordMidi) {
    const freq = midiToFreq(midiNote);

    const osc = ctx.createOscillator();
    osc.type = config.padType;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 10, startTime);

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.001, startTime);
    voiceGain.gain.linearRampToValueAtTime(0.5 / chordMidi.length, startTime + 2);

    osc.connect(voiceGain);
    voiceGain.connect(padFilter);
    osc.start(startTime);
    voices.push({ osc, gain: voiceGain });

    const chorusOsc = ctx.createOscillator();
    chorusOsc.type = config.padType;
    chorusOsc.frequency.setValueAtTime(freq, startTime);
    chorusOsc.detune.setValueAtTime(7 + (Math.random() - 0.5) * 4, startTime);

    const chorusGain = ctx.createGain();
    chorusGain.gain.setValueAtTime(0.001, startTime);
    chorusGain.gain.linearRampToValueAtTime(0.25 / chordMidi.length, startTime + 2.5);

    chorusOsc.connect(chorusGain);
    chorusGain.connect(padFilter);
    chorusOsc.start(startTime);
    voices.push({ osc: chorusOsc, gain: chorusGain });
  }

  return voices;
}

/**
 * Fade out pad voices then stop/disconnect.
 * Returns the retirement timer so the owner can cancel on cleanup.
 */
export function schedulePadVoiceRetirement(
  voices: PadVoice[],
  startTime: number,
  durationSec: number,
  onRetired?: () => void,
): ReturnType<typeof setTimeout> | null {
  if (voices.length === 0) return null;

  for (const voice of voices) {
    try {
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, startTime);
      voice.gain.gain.linearRampToValueAtTime(0.001, startTime + durationSec);
    } catch {
      // node may already be stopping
    }
  }

  return setTimeout(() => {
    for (const voice of voices) {
      try { voice.osc.stop(); } catch { /* already stopped */ }
      try { voice.gain.disconnect(); } catch { /* ignore */ }
    }
    onRetired?.();
  }, (durationSec + 0.5) * 1000);
}

export function stopPadVoicesImmediate(voices: PadVoice[]): void {
  for (const voice of voices) {
    try { voice.osc.stop(); } catch { /* already stopped */ }
    try { voice.gain.disconnect(); } catch { /* ignore */ }
  }
}

/** Bass oscillator → lowpass → gain → destination. */
export function createBassLayer(
  ctx: AudioContext,
  dest: AudioNode,
  config: SceneMusicConfig,
  startTime: number,
): BassLayer {
  const rootFreq = midiToFreq(config.rootMidi);

  const bassOsc = ctx.createOscillator();
  bassOsc.type = config.bassType;
  bassOsc.frequency.setValueAtTime(rootFreq, startTime);

  const bassFilter = ctx.createBiquadFilter();
  bassFilter.type = 'lowpass';
  bassFilter.frequency.value = 200;
  bassFilter.Q.value = 0.7;

  const bassGain = ctx.createGain();
  bassGain.gain.setValueAtTime(0, startTime);

  bassOsc.connect(bassFilter);
  bassFilter.connect(bassGain);
  bassGain.connect(dest);
  bassOsc.start(startTime);

  return { bassOsc, bassGain, bassFilter };
}

/** One half-note bass pulse envelope (beats 1 & 3 of a 4-beat bar). */
export function applyBassPulse(
  bassGain: GainNode,
  ctx: AudioContext,
  bassLevel: number,
  beatMs: number,
): void {
  const now = ctx.currentTime;
  bassGain.gain.setValueAtTime(0.001, now);
  bassGain.gain.linearRampToValueAtTime(bassLevel, now + 0.1);
  bassGain.gain.linearRampToValueAtTime(bassLevel * 0.3, now + beatMs / 2000);
  bassGain.gain.linearRampToValueAtTime(0.001, now + beatMs / 1000);
}

/**
 * Play a single sparse melody note. Returns duration (sec) for deferred disconnect.
 */
export function playMelodyNote(
  ctx: AudioContext,
  dest: AudioNode,
  config: SceneMusicConfig,
  musicVolume: number,
): { duration: number; disconnect: () => void } {
  const now = ctx.currentTime;

  const degree = Math.floor(Math.random() * config.scale.intervals.length);
  const interval = config.scale.intervals[degree];
  const octaveRange = [0, 12, 24];
  const octaveShift = pickRandom(octaveRange);
  const midiNote = config.rootMidi + interval + octaveShift;
  const freq = midiToFreq(midiNote);

  const osc = ctx.createOscillator();
  osc.type = config.melodyType;
  osc.frequency.setValueAtTime(freq, now);
  osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

  const noteDuration = 1.5 + Math.random() * 2;
  const melodyLevel = config.melodyGain * musicVolume;

  const envGain = ctx.createGain();
  envGain.gain.setValueAtTime(0.001, now);
  envGain.gain.linearRampToValueAtTime(melodyLevel, now + 0.3);
  envGain.gain.setValueAtTime(melodyLevel, now + noteDuration - 0.8);
  envGain.gain.linearRampToValueAtTime(0.001, now + noteDuration);

  const melodyFilter = ctx.createBiquadFilter();
  melodyFilter.type = 'lowpass';
  melodyFilter.frequency.value = 2000;
  melodyFilter.Q.value = 0.5;

  osc.connect(melodyFilter);
  melodyFilter.connect(envGain);
  envGain.connect(dest);

  osc.start(now);
  safeStop(osc, now + noteDuration + 0.1);

  return {
    duration: noteDuration,
    disconnect: () => {
      try { melodyFilter.disconnect(); } catch { /* ignore */ }
      try { envGain.disconnect(); } catch { /* ignore */ }
    },
  };
}
