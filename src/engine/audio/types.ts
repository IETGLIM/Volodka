/* ─── Volodka RPG – Audio type definitions ─── */

/** Safely stop an OscillatorNode or AudioBufferSourceNode, ignoring InvalidStateError */
export function safeStop(node: OscillatorNode | AudioBufferSourceNode, when?: number): void {
  try {
    if (when !== undefined) {
      node.stop(when);
    } else {
      node.stop();
    }
  } catch {
    // Node already stopped — ignore InvalidStateError
  }
}

/** SFX type → oscillator configuration */
export interface SfxConfig {
  type: OscillatorType;
  frequency: number;
  duration: number;
  gain: number;
}

/** Footstep material presets */
export interface FootstepConfig {
  baseFreq: number;
  noiseDuration: number;
  gain: number;
  filterQ: number;
  filterType: BiquadFilterType;
  /** Additional harmonic "click" frequency (0 = no click) */
  clickFreq: number;
  clickGain: number;
}

/** Continuous noise layer for rain, wind, steam hiss, etc. */
export interface NoiseLayerDef {
  /** Filter type to shape the noise */
  filterType: BiquadFilterType;
  /** Filter center/cutoff frequency in Hz */
  filterFreq: number;
  /** Filter Q (resonance) */
  filterQ: number;
  /** Gain level (0.01–0.06 to avoid overwhelming) */
  gain: number;
  /** LFO frequency for filter modulation (0 = no LFO) */
  lfoFreq: number;
  /** LFO depth for filter modulation in Hz */
  lfoDepth: number;
}

/** Random sound event that plays at irregular intervals */
export interface RandomSoundDef {
  /** Oscillator type */
  type: OscillatorType;
  /** Base frequency in Hz */
  frequency: number;
  /** Duration in seconds */
  duration: number;
  /** Gain level */
  gain: number;
  /** Minimum interval between plays in seconds */
  minInterval: number;
  /** Maximum interval between plays in seconds */
  maxInterval: number;
  /** Optional frequency ramp target for sirens, sweeps */
  frequencyRamp?: number;
  /** Use filtered noise buffer instead of oscillator */
  useNoise?: boolean;
  /** Filter frequency for noise-based sounds */
  noiseFilterFreq?: number;
  /** Stereo pan start (-1 left to +1 right) for panning sounds */
  panStart?: number;
  /** Stereo pan end (-1 left to +1 right) for panning sounds */
  panEnd?: number;
}

export interface AmbientLayer {
  type: OscillatorType;
  frequency: number;
  gain: number;
  lfoFreq: number;
  lfoDepth: number;
  harmonic?: {
    type: OscillatorType;
    frequency: number;
    gain: number;
  };
  /** @deprecated Use scene-level randomSounds instead — kept for backward compat */
  randomInterval: number;
  /** @deprecated Use scene-level randomSounds instead — kept for backward compat */
  randomSound?: {
    type: OscillatorType;
    frequency: number;
    duration: number;
    gain: number;
  };
}

export interface AmbientConfig {
  /** Continuous drone oscillator layers */
  layers: AmbientLayer[];
  /** Continuous noise layers (rain, wind, steam) */
  noiseLayers?: NoiseLayerDef[];
  /** Multiple random sound events with independent timing */
  randomSounds?: RandomSoundDef[];
}

/* ─── Ambient Music Configurations ─── */

export interface MusicChord {
  /** Frequencies for each voice in the chord */
  frequencies: number[];
  /** Duration in seconds for this chord */
  duration: number;
}

export interface AmbientMusicConfig {
  /** Chord progression that loops */
  chords: MusicChord[];
  /** Oscillator type for the pad voices */
  padType: OscillatorType;
  /** Master gain (0–1) — should be very quiet, typically 0.02–0.05 */
  gain: number;
  /** LFO modulation rate in Hz */
  lfoFreq: number;
  /** LFO depth in Hz */
  lfoDepth: number;
  /** Filter cutoff for pad warmth */
  filterFreq: number;
  /** Filter Q (resonance) */
  filterQ: number;
  /** Reverb wet/dry mix (0–1) */
  reverbMix: number;
  /** Seconds of artificial reverb tail */
  reverbDecay: number;
  /** Optional secondary oscillator layer for texture */
  textureLayer?: {
    type: OscillatorType;
    /** Frequency multiplier relative to the root chord frequency */
    freqMult: number;
    gain: number;
    lfoFreq: number;
    lfoDepth: number;
  };
}

/* ─── Ambient Reverb Presets ─── */

export interface ReverbPresetConfig {
  /** Reverb decay time in seconds */
  decay: number;
  /** Wet mix level (0–1) */
  wetMix: number;
}
