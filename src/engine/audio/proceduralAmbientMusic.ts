/**
 * Procedural ambient pad / chord music helpers (AudioEngine ambient-music bus).
 * Distinct from MusicEngine's 3-layer scene music.
 */

import type { AmbientMusicConfig } from './types';
import { safeStop } from './types';
import { createReverbImpulse } from './AudioEngineCore';
import { tryCreateConvolver } from './audioCapabilities';

export interface MusicVoiceNodes {
  osc: OscillatorNode;
  gain: GainNode;
}

export interface AmbientMusicBus {
  musicGain: GainNode;
  musicFilter: BiquadFilterNode;
  musicLfo: OscillatorNode;
  musicLfoGain: GainNode;
  musicConvolver: ConvolverNode | null;
  musicConvolverGain: GainNode;
  musicDryGain: GainNode;
  textureOsc: OscillatorNode | null;
  textureGain: GainNode | null;
  textureLfo: OscillatorNode | null;
  textureLfoGain: GainNode | null;
}

/** Wire filter → dry/wet reverb → destination and optional texture layer. */
export function createAmbientMusicBus(
  ctx: AudioContext,
  dest: AudioNode,
  config: AmbientMusicConfig,
): AmbientMusicBus {
  const now = ctx.currentTime;

  const musicConvolver = tryCreateConvolver(ctx, createReverbImpulse(ctx, config.reverbDecay));
  const musicConvolverGain = ctx.createGain();
  const musicDryGain = ctx.createGain();

  if (musicConvolver) {
    musicConvolverGain.gain.value = config.reverbMix;
    musicDryGain.gain.value = 1 - config.reverbMix;
    musicConvolver.connect(musicConvolverGain);
  } else {
    musicConvolverGain.gain.value = 0;
    musicDryGain.gain.value = 1;
  }

  const musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(0, now);
  musicGain.gain.linearRampToValueAtTime(config.gain, now + 2);

  const musicFilter = ctx.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = config.filterFreq;
  musicFilter.Q.value = config.filterQ;

  const musicLfo = ctx.createOscillator();
  musicLfo.type = 'sine';
  musicLfo.frequency.setValueAtTime(config.lfoFreq, now);

  const musicLfoGain = ctx.createGain();
  musicLfoGain.gain.setValueAtTime(config.lfoDepth, now);

  musicLfo.connect(musicLfoGain);
  musicLfoGain.connect(musicFilter.frequency);

  musicFilter.connect(musicGain);
  musicGain.connect(musicDryGain);
  if (musicConvolver) {
    musicGain.connect(musicConvolver);
  }
  musicDryGain.connect(dest);
  if (musicConvolver) {
    musicConvolverGain.connect(dest);
  }

  musicLfo.start(now);

  let textureOsc: OscillatorNode | null = null;
  let textureGain: GainNode | null = null;
  let textureLfo: OscillatorNode | null = null;
  let textureLfoGain: GainNode | null = null;

  if (config.textureLayer) {
    const tl = config.textureLayer;
    textureOsc = ctx.createOscillator();
    textureOsc.type = tl.type;
    const rootFreq = config.chords[0].frequencies[0] * tl.freqMult;
    textureOsc.frequency.setValueAtTime(rootFreq, now);

    textureGain = ctx.createGain();
    textureGain.gain.setValueAtTime(tl.gain, now);

    textureLfo = ctx.createOscillator();
    textureLfo.type = 'sine';
    textureLfo.frequency.setValueAtTime(tl.lfoFreq, now);

    textureLfoGain = ctx.createGain();
    textureLfoGain.gain.setValueAtTime(tl.lfoDepth, now);

    textureLfo.connect(textureLfoGain);
    textureLfoGain.connect(textureOsc.frequency);

    textureOsc.connect(textureGain);
    textureGain.connect(musicFilter);

    textureOsc.start(now);
    textureLfo.start(now);
  }

  return {
    musicGain,
    musicFilter,
    musicLfo,
    musicLfoGain,
    musicConvolver,
    musicConvolverGain,
    musicDryGain,
    textureOsc,
    textureGain,
    textureLfo,
    textureLfoGain,
  };
}

/** Start pad voices for one chord; returns nodes + duration for scheduling. */
export function startMusicChordVoices(
  ctx: AudioContext,
  musicFilter: BiquadFilterNode,
  config: AmbientMusicConfig,
  chordIndex: number,
  startTime: number,
): { voices: MusicVoiceNodes[]; chordDuration: number } {
  const chord = config.chords[chordIndex % config.chords.length];
  const now = startTime;
  const voices: MusicVoiceNodes[] = [];

  for (const freq of chord.frequencies) {
    const osc = ctx.createOscillator();
    osc.type = config.padType;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(0.001, now);
    voiceGain.gain.linearRampToValueAtTime(0.7 / chord.frequencies.length, now + 1.5);

    osc.connect(voiceGain);
    voiceGain.connect(musicFilter);

    osc.start(now);
    safeStop(osc, now + chord.duration + 1);

    voices.push({ osc, gain: voiceGain });
  }

  const fadeTime = now + chord.duration - 1;
  for (const node of voices) {
    try {
      node.gain.gain.setValueAtTime(node.gain.gain.value, fadeTime);
      node.gain.gain.linearRampToValueAtTime(0.001, fadeTime + 1);
    } catch {
      /* node may already be stopping */
    }
  }

  return { voices, chordDuration: chord.duration };
}
