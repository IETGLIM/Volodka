/* ─── Volodka RPG – AAA procedural audio engine ───
 *  Ambient music, spatial audio, UI sounds, footstep variety
 *  All procedural via Web Audio API — zero audio files required
 */

import type { SceneId } from '@/shared/types/game';
import { getSharedAudioContext } from './SharedAudioContext';

/** Safely stop an OscillatorNode or AudioBufferSourceNode, ignoring InvalidStateError */
function safeStop(node: OscillatorNode | AudioBufferSourceNode, when?: number): void {
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
interface SfxConfig {
  type: OscillatorType;
  frequency: number;
  duration: number;
  gain: number;
}

const SFX_PRESETS: Record<string, SfxConfig> = {
  click: { type: 'square', frequency: 800, duration: 0.04, gain: 0.15 },
  confirm: { type: 'sine', frequency: 600, duration: 0.08, gain: 0.2 },
  cancel: { type: 'sawtooth', frequency: 300, duration: 0.06, gain: 0.12 },
  notify: { type: 'sine', frequency: 1000, duration: 0.1, gain: 0.18 },
  quest_complete: { type: 'sine', frequency: 520, duration: 0.25, gain: 0.2 },
  error: { type: 'square', frequency: 200, duration: 0.15, gain: 0.15 },
  ui_open: { type: 'sine', frequency: 440, duration: 0.05, gain: 0.1 },
  ui_close: { type: 'sine', frequency: 330, duration: 0.05, gain: 0.1 },
};

/** Footstep material presets */
interface FootstepConfig {
  baseFreq: number;
  noiseDuration: number;
  gain: number;
  filterQ: number;
  filterType: BiquadFilterType;
  /** Additional harmonic "click" frequency (0 = no click) */
  clickFreq: number;
  clickGain: number;
}

const FOOTSTEP_PRESETS: Record<string, FootstepConfig> = {
  default: { baseFreq: 100, noiseDuration: 0.08, gain: 0.12, filterQ: 1.0, filterType: 'bandpass', clickFreq: 0, clickGain: 0 },
  wood: { baseFreq: 180, noiseDuration: 0.06, gain: 0.14, filterQ: 1.5, filterType: 'bandpass', clickFreq: 800, clickGain: 0.03 },
  concrete: { baseFreq: 80, noiseDuration: 0.07, gain: 0.1, filterQ: 1.0, filterType: 'bandpass', clickFreq: 0, clickGain: 0 },
  metal: { baseFreq: 400, noiseDuration: 0.1, gain: 0.08, filterQ: 2.0, filterType: 'bandpass', clickFreq: 1200, clickGain: 0.04 },
  carpet: { baseFreq: 60, noiseDuration: 0.12, gain: 0.05, filterQ: 0.8, filterType: 'lowpass', clickFreq: 0, clickGain: 0 },
  snow: { baseFreq: 50, noiseDuration: 0.15, gain: 0.06, filterQ: 0.6, filterType: 'lowpass', clickFreq: 0, clickGain: 0 },
  // ─── New material types ───
  tile: { baseFreq: 250, noiseDuration: 0.05, gain: 0.11, filterQ: 2.5, filterType: 'bandpass', clickFreq: 1500, clickGain: 0.05 },
  gravel: { baseFreq: 120, noiseDuration: 0.1, gain: 0.13, filterQ: 0.7, filterType: 'bandpass', clickFreq: 600, clickGain: 0.02 },
  grass: { baseFreq: 70, noiseDuration: 0.14, gain: 0.05, filterQ: 0.5, filterType: 'lowpass', clickFreq: 0, clickGain: 0 },
  metal_grate: { baseFreq: 500, noiseDuration: 0.12, gain: 0.09, filterQ: 3.0, filterType: 'bandpass', clickFreq: 2000, clickGain: 0.06 },
};

/* ─── Ambient scene configurations ─── */

/** Continuous noise layer for rain, wind, steam hiss, etc. */
interface NoiseLayerDef {
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
interface RandomSoundDef {
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

interface AmbientLayer {
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

interface AmbientConfig {
  /** Continuous drone oscillator layers */
  layers: AmbientLayer[];
  /** Continuous noise layers (rain, wind, steam) */
  noiseLayers?: NoiseLayerDef[];
  /** Multiple random sound events with independent timing */
  randomSounds?: RandomSoundDef[];
}

const AMBIENT_CONFIGS: Record<SceneId, AmbientConfig> = {
  /* ─── 1. volodka_room — Terminal hum + clicks (kept as is) ─── */
  volodka_room: {
    layers: [
      {
        type: 'sawtooth',
        frequency: 55,
        gain: 0.04,
        lfoFreq: 0.1,
        lfoDepth: 3,
        harmonic: { type: 'sine', frequency: 110, gain: 0.02 },
        randomInterval: 4,
        randomSound: { type: 'square', frequency: 1200, duration: 0.02, gain: 0.06 },
      },
    ],
  },

  /* ─── 2. volodka_corridor — Echoing hallway, door slams, muffled voices, fluorescent buzz ─── */
  volodka_corridor: {
    layers: [
      // Echoing hallway hum
      {
        type: 'sawtooth',
        frequency: 65,
        gain: 0.03,
        lfoFreq: 0.04,
        lfoDepth: 4,
        harmonic: { type: 'sine', frequency: 130, gain: 0.012 },
        randomInterval: 0,
      },
      // Fluorescent light buzz
      {
        type: 'square',
        frequency: 120,
        gain: 0.012,
        lfoFreq: 0.25,
        lfoDepth: 2,
        randomInterval: 0,
      },
    ],
    randomSounds: [
      // Distant door slam — low thud
      { type: 'sine', frequency: 80, duration: 0.15, gain: 0.04, minInterval: 6, maxInterval: 14 },
      // Muffled voices — mid-range warble
      { type: 'sawtooth', frequency: 220, duration: 0.25, gain: 0.015, minInterval: 8, maxInterval: 18, frequencyRamp: 280, useNoise: true, noiseFilterFreq: 500 },
      // Echo drip
      { type: 'sine', frequency: 1800, duration: 0.06, gain: 0.02, minInterval: 10, maxInterval: 20 },
    ],
  },

  /* ─── 3. home_evening — Warm home drone (kept as is) ─── */
  home_evening: {
    layers: [
      {
        type: 'sine',
        frequency: 100,
        gain: 0.025,
        lfoFreq: 0.08,
        lfoDepth: 2,
        harmonic: { type: 'triangle', frequency: 200, gain: 0.01 },
        randomInterval: 4,
        randomSound: { type: 'sine', frequency: 1500, duration: 0.02, gain: 0.025 },
      },
    ],
  },

  /* ─── 4. cafe_evening — Music drone + clinking (kept as is) ─── */
  cafe_evening: {
    layers: [
      {
        type: 'sine',
        frequency: 165,
        gain: 0.025,
        lfoFreq: 0.15,
        lfoDepth: 5,
        harmonic: { type: 'triangle', frequency: 330, gain: 0.01 },
        randomInterval: 3,
        randomSound: { type: 'sine', frequency: 2500, duration: 0.015, gain: 0.04 },
      },
    ],
  },

  /* ─── 5. street_night — Rain, sirens, car pass-by ─── */
  street_night: {
    layers: [
      // Night drone
      {
        type: 'sawtooth',
        frequency: 80,
        gain: 0.03,
        lfoFreq: 0.05,
        lfoDepth: 8,
        harmonic: { type: 'sine', frequency: 200, gain: 0.015 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Rain patter — bandpass white noise
      { filterType: 'bandpass', filterFreq: 3000, filterQ: 0.5, gain: 0.025, lfoFreq: 0.08, lfoDepth: 500 },
    ],
    randomSounds: [
      // Distant siren — slow ascending sine
      { type: 'sine', frequency: 400, duration: 2.5, gain: 0.02, minInterval: 12, maxInterval: 30, frequencyRamp: 800 },
      // Car pass-by — panning sawtooth fade
      { type: 'sawtooth', frequency: 150, duration: 3.0, gain: 0.015, minInterval: 10, maxInterval: 25, panStart: -1, panEnd: 1, frequencyRamp: 120 },
      // Distant dog bark
      { type: 'sawtooth', frequency: 350, duration: 0.15, gain: 0.015, minInterval: 15, maxInterval: 35, frequencyRamp: 250 },
    ],
  },

  /* ─── 6. office_day — Server hum, keyboard, AC, phone ring ─── */
  office_day: {
    layers: [
      // Server room hum — multiple close frequencies
      {
        type: 'sawtooth',
        frequency: 60,
        gain: 0.03,
        lfoFreq: 0.08,
        lfoDepth: 2,
        harmonic: { type: 'sine', frequency: 120, gain: 0.015 },
        randomInterval: 0,
      },
      // Second server harmonic
      {
        type: 'sawtooth',
        frequency: 63,
        gain: 0.018,
        lfoFreq: 0.12,
        lfoDepth: 1,
        randomInterval: 0,
      },
      // Air conditioning drone
      {
        type: 'sine',
        frequency: 95,
        gain: 0.015,
        lfoFreq: 0.03,
        lfoDepth: 3,
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // AC air flow
      { filterType: 'lowpass', filterFreq: 400, filterQ: 0.3, gain: 0.012, lfoFreq: 0.05, lfoDepth: 50 },
    ],
    randomSounds: [
      // Keyboard typing — random clicks
      { type: 'square', frequency: 1800, duration: 0.02, gain: 0.03, minInterval: 0.5, maxInterval: 3 },
      // Phone ring — occasional
      { type: 'sine', frequency: 440, duration: 0.8, gain: 0.025, minInterval: 20, maxInterval: 50, frequencyRamp: 520 },
      // Second phone ring burst
      { type: 'sine', frequency: 440, duration: 0.3, gain: 0.02, minInterval: 0.9, maxInterval: 1.1, frequencyRamp: 520 },
    ],
  },

  /* ─── 7. park_day — Wind, birds, water, rustling ─── */
  park_day: {
    layers: [
      // Gentle park drone
      {
        type: 'sine',
        frequency: 90,
        gain: 0.02,
        lfoFreq: 0.06,
        lfoDepth: 4,
        harmonic: { type: 'sine', frequency: 180, gain: 0.01 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Wind through trees — filtered noise with LFO
      { filterType: 'bandpass', filterFreq: 600, filterQ: 0.4, gain: 0.02, lfoFreq: 0.15, lfoDepth: 300 },
      // Distant water — low noise
      { filterType: 'lowpass', filterFreq: 300, filterQ: 0.3, gain: 0.012, lfoFreq: 0.02, lfoDepth: 30 },
    ],
    randomSounds: [
      // Birds chirping — high sine bursts
      { type: 'sine', frequency: 3200, duration: 0.06, gain: 0.025, minInterval: 2, maxInterval: 6, frequencyRamp: 3800 },
      // Second bird species
      { type: 'sine', frequency: 4500, duration: 0.04, gain: 0.018, minInterval: 3, maxInterval: 8, frequencyRamp: 5200 },
      // Rustling leaves — noise burst
      { type: 'sawtooth', frequency: 200, duration: 0.3, gain: 0.012, minInterval: 4, maxInterval: 10, useNoise: true, noiseFilterFreq: 1500 },
      // Distant dog
      { type: 'sawtooth', frequency: 300, duration: 0.2, gain: 0.01, minInterval: 20, maxInterval: 45, frequencyRamp: 220 },
    ],
  },

  /* ─── 8. library_day — Deep silence, page turns, clock, murmur, creak ─── */
  library_day: {
    layers: [
      // Very deep silence drone
      {
        type: 'sine',
        frequency: 40,
        gain: 0.008,
        lfoFreq: 0.02,
        lfoDepth: 1,
        randomInterval: 0,
      },
    ],
    randomSounds: [
      // Clock ticking — square wave at ~2Hz equivalent via timing
      { type: 'square', frequency: 800, duration: 0.01, gain: 0.018, minInterval: 0.45, maxInterval: 0.55 },
      // Page turn — noise burst
      { type: 'sine', frequency: 300, duration: 0.12, gain: 0.02, minInterval: 6, maxInterval: 15, useNoise: true, noiseFilterFreq: 2000 },
      // Distant murmur
      { type: 'sawtooth', frequency: 180, duration: 0.4, gain: 0.008, minInterval: 10, maxInterval: 25, useNoise: true, noiseFilterFreq: 600 },
      // Creaking floor
      { type: 'sawtooth', frequency: 250, duration: 0.2, gain: 0.012, minInterval: 15, maxInterval: 35, frequencyRamp: 350 },
    ],
  },

  /* ─── 9. battle — Ominous drone, crackling, alarm, heartbeat ─── */
  battle: {
    layers: [
      // Low ominous drone
      {
        type: 'sawtooth',
        frequency: 100,
        gain: 0.04,
        lfoFreq: 0.2,
        lfoDepth: 10,
        harmonic: { type: 'square', frequency: 200, gain: 0.02 },
        randomInterval: 0,
      },
      // Heartbeat bass sub-layer
      {
        type: 'sine',
        frequency: 35,
        gain: 0.035,
        lfoFreq: 1.1,
        lfoDepth: 8,
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Electrical crackling atmosphere
      { filterType: 'bandpass', filterFreq: 2500, filterQ: 3.0, gain: 0.015, lfoFreq: 0.4, lfoDepth: 800 },
    ],
    randomSounds: [
      // Electrical crackle burst
      { type: 'sawtooth', frequency: 800, duration: 0.05, gain: 0.04, minInterval: 1, maxInterval: 4, useNoise: true, noiseFilterFreq: 3000 },
      // Alarm pulse — square wave beep
      { type: 'square', frequency: 600, duration: 0.08, gain: 0.03, minInterval: 2, maxInterval: 6 },
      // Metal impact
      { type: 'triangle', frequency: 150, duration: 0.12, gain: 0.035, minInterval: 3, maxInterval: 8, frequencyRamp: 60 },
      // Warning tone
      { type: 'square', frequency: 440, duration: 0.15, gain: 0.02, minInterval: 8, maxInterval: 18, frequencyRamp: 550 },
    ],
  },

  /* ─── 10. sleep_dream — Ethereal pad, echoes, breathing, surreal ─── */
  sleep_dream: {
    layers: [
      // Ethereal pad — slow sine chord
      {
        type: 'sine',
        frequency: 70,
        gain: 0.02,
        lfoFreq: 0.03,
        lfoDepth: 5,
        harmonic: { type: 'sine', frequency: 105, gain: 0.008 },
        randomInterval: 0,
      },
      // Second pad voice — slightly detuned
      {
        type: 'sine',
        frequency: 72,
        gain: 0.015,
        lfoFreq: 0.025,
        lfoDepth: 4,
        harmonic: { type: 'sine', frequency: 108, gain: 0.006 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Breathing rhythm — very low filtered noise with slow LFO
      { filterType: 'lowpass', filterFreq: 200, filterQ: 0.5, gain: 0.012, lfoFreq: 0.25, lfoDepth: 80 },
    ],
    randomSounds: [
      // Distant echo
      { type: 'sine', frequency: 500, duration: 0.8, gain: 0.012, minInterval: 8, maxInterval: 18, frequencyRamp: 450 },
      // Surreal reversing sound — descending chime
      { type: 'sine', frequency: 1200, duration: 0.6, gain: 0.01, minInterval: 12, maxInterval: 25, frequencyRamp: 400 },
      // Dream shimmer
      { type: 'triangle', frequency: 800, duration: 0.3, gain: 0.008, minInterval: 6, maxInterval: 14, frequencyRamp: 1000 },
      // Memory fragment — muffled tone
      { type: 'sine', frequency: 300, duration: 0.5, gain: 0.008, minInterval: 15, maxInterval: 30, useNoise: true, noiseFilterFreq: 800 },
    ],
  },

  /* ─── 11. rooftop_edge — Strong wind, city drone, antenna creak, pigeons ─── */
  rooftop_edge: {
    layers: [
      // City drone from below
      {
        type: 'sawtooth',
        frequency: 70,
        gain: 0.025,
        lfoFreq: 0.12,
        lfoDepth: 6,
        harmonic: { type: 'sine', frequency: 140, gain: 0.012 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Strong wind — noise with LFO for gusts
      { filterType: 'bandpass', filterFreq: 500, filterQ: 0.3, gain: 0.04, lfoFreq: 0.18, lfoDepth: 400 },
      // Higher wind whistle
      { filterType: 'highpass', filterFreq: 2000, filterQ: 1.5, gain: 0.01, lfoFreq: 0.25, lfoDepth: 500 },
    ],
    randomSounds: [
      // Antenna creak — slow frequency sweep
      { type: 'sawtooth', frequency: 200, duration: 0.4, gain: 0.02, minInterval: 6, maxInterval: 15, frequencyRamp: 350 },
      // Pigeon coo
      { type: 'sine', frequency: 500, duration: 0.2, gain: 0.018, minInterval: 8, maxInterval: 20, frequencyRamp: 400 },
      // Second pigeon
      { type: 'sine', frequency: 550, duration: 0.15, gain: 0.014, minInterval: 9, maxInterval: 22, frequencyRamp: 460 },
      // Distant siren from below
      { type: 'sine', frequency: 350, duration: 2.0, gain: 0.01, minInterval: 20, maxInterval: 45, frequencyRamp: 700 },
    ],
  },

  /* ─── 12. abandoned_factory — Industrial hum, dripping, metal creak, steam ─── */
  abandoned_factory: {
    layers: [
      // Industrial hum
      {
        type: 'sawtooth',
        frequency: 45,
        gain: 0.035,
        lfoFreq: 0.07,
        lfoDepth: 5,
        harmonic: { type: 'square', frequency: 90, gain: 0.01 },
        randomInterval: 0,
      },
      // Second machine hum
      {
        type: 'sawtooth',
        frequency: 52,
        gain: 0.02,
        lfoFreq: 0.1,
        lfoDepth: 3,
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Steam hiss — filtered noise
      { filterType: 'highpass', filterFreq: 3000, filterQ: 0.5, gain: 0.02, lfoFreq: 0.06, lfoDepth: 600 },
      // Low rumble
      { filterType: 'lowpass', filterFreq: 150, filterQ: 0.5, gain: 0.015, lfoFreq: 0.03, lfoDepth: 20 },
    ],
    randomSounds: [
      // Dripping water — random blips
      { type: 'sine', frequency: 2200, duration: 0.04, gain: 0.03, minInterval: 2, maxInterval: 7 },
      // Second drip variant
      { type: 'sine', frequency: 1800, duration: 0.03, gain: 0.025, minInterval: 3, maxInterval: 9 },
      // Metal creaking — slow sweep
      { type: 'sawtooth', frequency: 150, duration: 0.5, gain: 0.02, minInterval: 5, maxInterval: 14, frequencyRamp: 300 },
      // Distant metallic bang
      { type: 'triangle', frequency: 120, duration: 0.1, gain: 0.03, minInterval: 10, maxInterval: 25, frequencyRamp: 60 },
    ],
  },

  /* ─── 13. zarema_albert_room — Conversation murmur, cooking, kettle, soft music ─── */
  zarema_albert_room: {
    layers: [
      // Warm ambient drone
      {
        type: 'sine',
        frequency: 130,
        gain: 0.02,
        lfoFreq: 0.1,
        lfoDepth: 3,
        harmonic: { type: 'triangle', frequency: 260, gain: 0.008 },
        randomInterval: 0,
      },
      // Soft music pad
      {
        type: 'triangle',
        frequency: 196,
        gain: 0.012,
        lfoFreq: 0.07,
        lfoDepth: 2,
        harmonic: { type: 'sine', frequency: 329.63, gain: 0.006 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Cooking ambient — low noise
      { filterType: 'bandpass', filterFreq: 800, filterQ: 0.4, gain: 0.01, lfoFreq: 0.1, lfoDepth: 200 },
    ],
    randomSounds: [
      // Conversation murmur — mid-range noise burst
      { type: 'sawtooth', frequency: 200, duration: 0.5, gain: 0.012, minInterval: 3, maxInterval: 8, useNoise: true, noiseFilterFreq: 800 },
      // Tea kettle whistle
      { type: 'sine', frequency: 2800, duration: 0.8, gain: 0.015, minInterval: 20, maxInterval: 40, frequencyRamp: 3200 },
      // Cooking sizzle
      { type: 'sawtooth', frequency: 500, duration: 0.3, gain: 0.012, minInterval: 8, maxInterval: 18, useNoise: true, noiseFilterFreq: 3500 },
      // Cup clink
      { type: 'sine', frequency: 3500, duration: 0.03, gain: 0.025, minInterval: 10, maxInterval: 25 },
    ],
  },

  /* ─── 14. street_winter — Wind howl, snow crunch, bells, cold drone ─── */
  street_winter: {
    layers: [
      // Cold drone
      {
        type: 'sawtooth',
        frequency: 50,
        gain: 0.03,
        lfoFreq: 0.06,
        lfoDepth: 6,
        harmonic: { type: 'sine', frequency: 100, gain: 0.012 },
        randomInterval: 0,
      },
      // Second cold harmonic
      {
        type: 'triangle',
        frequency: 75,
        gain: 0.015,
        lfoFreq: 0.04,
        lfoDepth: 3,
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Wind howl — noise with strong LFO
      { filterType: 'bandpass', filterFreq: 400, filterQ: 0.3, gain: 0.035, lfoFreq: 0.15, lfoDepth: 500 },
      // Higher wind whistle
      { filterType: 'highpass', filterFreq: 1500, filterQ: 1.0, gain: 0.01, lfoFreq: 0.2, lfoDepth: 400 },
    ],
    randomSounds: [
      // Crunching snow footsteps
      { type: 'sine', frequency: 100, duration: 0.1, gain: 0.03, minInterval: 1, maxInterval: 4, useNoise: true, noiseFilterFreq: 800 },
      // Distant bells
      { type: 'sine', frequency: 700, duration: 0.6, gain: 0.015, minInterval: 10, maxInterval: 25, frequencyRamp: 680 },
      // Second bell
      { type: 'sine', frequency: 1050, duration: 0.4, gain: 0.012, minInterval: 12, maxInterval: 28, frequencyRamp: 1000 },
      // Wind gust — louder noise burst
      { type: 'sawtooth', frequency: 200, duration: 1.5, gain: 0.018, minInterval: 6, maxInterval: 15, useNoise: true, noiseFilterFreq: 600 },
    ],
  },
};

/* ─── Ambient Music Configurations ─── */

interface MusicChord {
  /** Frequencies for each voice in the chord */
  frequencies: number[];
  /** Duration in seconds for this chord */
  duration: number;
}

interface AmbientMusicConfig {
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

/** C minor: C3-Eb3-G3  →  130.81, 155.56, 196.00 */
const C_MINOR = [130.81, 155.56, 196.0];
/** D minor: D3-F3-A3  →  146.83, 174.61, 220.00 */
const D_MINOR = [146.83, 174.61, 220.0];
/** F major 7th: F3-A3-C4-E4  →  174.61, 220.00, 261.63, 329.63 */
const F_MAJ7 = [174.61, 220.0, 261.63, 329.63];
/** A minor: A2-C3-E3  →  110.00, 130.81, 164.81 */
const A_MINOR = [110.0, 130.81, 164.81];
/** Whole tone scale fragment: C3-D3-E3-F#4  →  130.81, 146.83, 164.81, 369.99 */
const WHOLE_TONE = [130.81, 146.83, 164.81, 369.99];
/** A minor power chord variant for battle */
const A_POWER = [110.0, 164.81, 220.0];
const E_POWER = [82.41, 123.47, 164.81];
const F_POWER = [87.31, 130.81, 174.61];
const G_POWER = [98.0, 146.83, 196.0];

const AMBIENT_MUSIC_CONFIGS: Partial<Record<SceneId, AmbientMusicConfig>> = {
  volodka_room: {
    chords: [
      { frequencies: C_MINOR, duration: 8 },
      { frequencies: [130.81, 155.56, 196.0, 233.08], duration: 8 }, // Cm7
      { frequencies: [116.54, 146.83, 174.61], duration: 8 }, // Bb
      { frequencies: C_MINOR, duration: 8 },
    ],
    padType: 'sawtooth',
    gain: 0.03,
    lfoFreq: 0.08,
    lfoDepth: 4,
    filterFreq: 400,
    filterQ: 1.5,
    reverbMix: 0.4,
    reverbDecay: 3,
  },
  street_night: {
    chords: [
      { frequencies: D_MINOR, duration: 10 },
      { frequencies: [146.83, 174.61, 220.0, 261.63], duration: 10 }, // Dm7
      { frequencies: [130.81, 155.56, 196.0], duration: 10 }, // Cm
      { frequencies: D_MINOR, duration: 10 },
    ],
    padType: 'sawtooth',
    gain: 0.025,
    lfoFreq: 0.04,
    lfoDepth: 6,
    filterFreq: 350,
    filterQ: 2.0,
    reverbMix: 0.6,
    reverbDecay: 5,
    textureLayer: {
      type: 'sawtooth',
      freqMult: 0.5,
      gain: 0.012,
      lfoFreq: 0.02,
      lfoDepth: 8,
    },
  },
  cafe_evening: {
    chords: [
      { frequencies: F_MAJ7, duration: 7 },
      { frequencies: [174.61, 220.0, 261.63, 311.13], duration: 7 }, // F7#11
      { frequencies: [164.81, 207.65, 246.94, 311.13], duration: 7 }, // E7#9
      { frequencies: F_MAJ7, duration: 7 },
    ],
    padType: 'triangle',
    gain: 0.03,
    lfoFreq: 0.1,
    lfoDepth: 3,
    filterFreq: 600,
    filterQ: 0.8,
    reverbMix: 0.35,
    reverbDecay: 2.5,
  },
  office_day: {
    chords: [
      { frequencies: A_MINOR, duration: 6 },
      { frequencies: [110.0, 138.59, 164.81], duration: 6 }, // Am variant
      { frequencies: [98.0, 130.81, 164.81], duration: 6 }, // G
      { frequencies: A_MINOR, duration: 6 },
    ],
    padType: 'sawtooth',
    gain: 0.02,
    lfoFreq: 0.15,
    lfoDepth: 5,
    filterFreq: 300,
    filterQ: 3.0,
    reverbMix: 0.2,
    reverbDecay: 1.5,
    textureLayer: {
      type: 'square',
      freqMult: 2.0,
      gain: 0.008,
      lfoFreq: 0.3,
      lfoDepth: 10,
    },
  },
  park_day: {
    chords: [
      { frequencies: [130.81, 164.81, 196.0], duration: 10 }, // C
      { frequencies: [110.0, 138.59, 164.81], duration: 10 }, // Am
      { frequencies: [116.54, 146.83, 174.61], duration: 10 }, // Bb
      { frequencies: [130.81, 164.81, 196.0], duration: 10 }, // C
    ],
    padType: 'sine',
    gain: 0.02,
    lfoFreq: 0.05,
    lfoDepth: 2,
    filterFreq: 800,
    filterQ: 0.5,
    reverbMix: 0.5,
    reverbDecay: 4,
  },
  library_day: {
    // Silence with very subtle ambient — page turns handled by random sounds in ambient config
    chords: [
      { frequencies: [65.41, 98.0], duration: 12 }, // Very low C2+G2
    ],
    padType: 'sine',
    gain: 0.005,
    lfoFreq: 0.01,
    lfoDepth: 1,
    filterFreq: 200,
    filterQ: 0.3,
    reverbMix: 0.7,
    reverbDecay: 6,
  },
  battle: {
    chords: [
      { frequencies: A_POWER, duration: 2 },
      { frequencies: E_POWER, duration: 2 },
      { frequencies: F_POWER, duration: 2 },
      { frequencies: G_POWER, duration: 2 },
      { frequencies: A_POWER, duration: 2 },
      { frequencies: [110.0, 164.81, 220.0, 261.63], duration: 2 }, // Am7
      { frequencies: E_POWER, duration: 2 },
      { frequencies: A_POWER, duration: 2 },
    ],
    padType: 'sawtooth',
    gain: 0.05,
    lfoFreq: 0.25,
    lfoDepth: 15,
    filterFreq: 500,
    filterQ: 4.0,
    reverbMix: 0.3,
    reverbDecay: 1.5,
    textureLayer: {
      type: 'square',
      freqMult: 1.0,
      gain: 0.02,
      lfoFreq: 0.5,
      lfoDepth: 20,
    },
  },
  sleep_dream: {
    chords: [
      { frequencies: WHOLE_TONE, duration: 10 },
      { frequencies: [146.83, 185.0, 207.65, 415.3], duration: 10 },
      { frequencies: [164.81, 196.0, 233.08, 466.16], duration: 10 },
      { frequencies: WHOLE_TONE, duration: 10 },
    ],
    padType: 'sine',
    gain: 0.025,
    lfoFreq: 0.03,
    lfoDepth: 6,
    filterFreq: 500,
    filterQ: 0.6,
    reverbMix: 0.8,
    reverbDecay: 8,
  },
  // Additional scenes get lighter music configs
  volodka_corridor: {
    chords: [
      { frequencies: [130.81, 155.56, 196.0], duration: 10 },
      { frequencies: [116.54, 146.83, 174.61], duration: 10 },
    ],
    padType: 'sawtooth',
    gain: 0.02,
    lfoFreq: 0.06,
    lfoDepth: 3,
    filterFreq: 300,
    filterQ: 1.0,
    reverbMix: 0.5,
    reverbDecay: 4,
  },
  home_evening: {
    chords: [
      { frequencies: [130.81, 164.81, 196.0], duration: 9 },
      { frequencies: [146.83, 174.61, 220.0], duration: 9 },
      { frequencies: [130.81, 164.81, 196.0], duration: 9 },
    ],
    padType: 'triangle',
    gain: 0.025,
    lfoFreq: 0.07,
    lfoDepth: 2,
    filterFreq: 600,
    filterQ: 0.7,
    reverbMix: 0.3,
    reverbDecay: 2,
  },
  street_winter: {
    chords: [
      { frequencies: [110.0, 130.81, 164.81], duration: 10 },
      { frequencies: [98.0, 130.81, 164.81], duration: 10 },
      { frequencies: [87.31, 130.81, 174.61], duration: 10 },
      { frequencies: [110.0, 130.81, 164.81], duration: 10 },
    ],
    padType: 'sawtooth',
    gain: 0.022,
    lfoFreq: 0.04,
    lfoDepth: 5,
    filterFreq: 280,
    filterQ: 1.5,
    reverbMix: 0.55,
    reverbDecay: 5,
  },
  rooftop_edge: {
    chords: [
      { frequencies: [130.81, 155.56, 196.0], duration: 10 },
      { frequencies: [116.54, 146.83, 174.61], duration: 10 },
      { frequencies: D_MINOR, duration: 10 },
    ],
    padType: 'sawtooth',
    gain: 0.02,
    lfoFreq: 0.08,
    lfoDepth: 5,
    filterFreq: 350,
    filterQ: 1.2,
    reverbMix: 0.6,
    reverbDecay: 6,
  },
  abandoned_factory: {
    chords: [
      { frequencies: [82.41, 123.47, 164.81], duration: 8 },
      { frequencies: [73.42, 110.0, 146.83], duration: 8 },
      { frequencies: [82.41, 123.47, 164.81], duration: 8 },
    ],
    padType: 'sawtooth',
    gain: 0.03,
    lfoFreq: 0.1,
    lfoDepth: 4,
    filterFreq: 250,
    filterQ: 2.0,
    reverbMix: 0.4,
    reverbDecay: 3,
    textureLayer: {
      type: 'square',
      freqMult: 0.5,
      gain: 0.01,
      lfoFreq: 0.05,
      lfoDepth: 5,
    },
  },
  zarema_albert_room: {
    chords: [
      { frequencies: [130.81, 164.81, 196.0], duration: 9 },
      { frequencies: [146.83, 174.61, 220.0], duration: 9 },
    ],
    padType: 'triangle',
    gain: 0.02,
    lfoFreq: 0.08,
    lfoDepth: 2,
    filterFreq: 500,
    filterQ: 0.6,
    reverbMix: 0.3,
    reverbDecay: 2,
  },
};

/* ─── Ambient Reverb Presets ─── */

interface ReverbPresetConfig {
  /** Reverb decay time in seconds */
  decay: number;
  /** Wet mix level (0–1) */
  wetMix: number;
}

const REVERB_PRESETS: Record<string, ReverbPresetConfig> = {
  small_room: { decay: 0.5, wetMix: 0.15 },
  corridor: { decay: 1.0, wetMix: 0.3 },
  large_space: { decay: 2.0, wetMix: 0.45 },
  dream: { decay: 3.0, wetMix: 0.6 },
};

/** Map each scene to its default reverb preset */
const SCENE_REVERB_PRESETS: Partial<Record<SceneId, string>> = {
  volodka_room: 'small_room',
  zarema_albert_room: 'small_room',
  home_evening: 'small_room',
  volodka_corridor: 'corridor',
  office_day: 'corridor',
  cafe_evening: 'corridor',
  library_day: 'corridor',
  street_night: 'large_space',
  park_day: 'large_space',
  street_winter: 'large_space',
  rooftop_edge: 'large_space',
  abandoned_factory: 'large_space',
  battle: 'corridor',
  sleep_dream: 'dream',
};

/**
 * AAA procedural audio engine using the Web Audio API.
 * Generates ambient music, SFX, footstep sounds, ambient drones, spatial audio,
 * door sounds, and UI feedback without any audio files.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.7;
  private disposed = false;

  // Ambient state
  private ambientNodes: Array<{
    osc: OscillatorNode;
    gain: GainNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    harmonicOsc?: OscillatorNode;
    harmonicGain?: GainNode;
  }> = [];
  private ambientGain: GainNode | null = null;
  private currentAmbientScene: SceneId | null = null;
  /** Multiple random sound timers (one per random sound def) */
  private randomSoundTimers: Array<ReturnType<typeof setTimeout>> = [];

  // Noise layer state
  private noiseSourceNodes: Array<AudioBufferSourceNode> = [];
  private noiseGainNodes: Array<GainNode> = [];
  private noiseLfoNodes: Array<OscillatorNode> = [];
  private noiseFilterNodes: Array<BiquadFilterNode> = [];

  // Ambient music state
  private musicNodes: Array<{
    osc: OscillatorNode;
    gain: GainNode;
  }> = [];
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicLfo: OscillatorNode | null = null;
  private musicLfoGain: GainNode | null = null;
  private currentMusicScene: SceneId | null = null;
  private musicChordTimer: ReturnType<typeof setTimeout> | null = null;
  private musicConvolver: ConvolverNode | null = null;
  private musicConvolverGain: GainNode | null = null;
  private musicDryGain: GainNode | null = null;
  private textureOsc: OscillatorNode | null = null;
  private textureGain: GainNode | null = null;
  private textureLfo: OscillatorNode | null = null;
  private textureLfoGain: GainNode | null = null;

  // Dialogue muffle filter state
  private ambientMuffleFilter: BiquadFilterNode | null = null;
  private muffleEnabled = false;

  // Ambient reverb state
  private ambientConvolver: ConvolverNode | null = null;
  private ambientReverbGain: GainNode | null = null;
  private ambientDryReverbGain: GainNode | null = null;
  private currentReverbPreset: string | null = null;

  // Blur/focus handlers for audio context suspend/resume
  private _onBlur: (() => void) | null = null;
  private _onFocus: (() => void) | null = null;

  constructor() {
    // DEFER AudioContext creation — browsers require a user gesture before
    // AudioContext can start. Creating it here (module load time) causes:
    //   "The AudioContext was not allowed to start. It must be resumed
    //    (or created) after a user gesture on the page."
    // Instead, we lazily create the context on the first audio method call
    // (playSfx, playFootstep, playAmbient, etc.) which is always triggered
    // by user interaction.
    //
    // We still register blur/focus handlers so the context is suspended/resumed
    // correctly once it exists.

    // P1-3.5 FIX: No longer creating a separate AudioContext.
    // SharedAudioContext module manages the singleton context + blur/focus.
    // Individual blur/focus handlers removed — managed centrally.
  }

  /** Lazily get the shared AudioContext (P1-3.5 FIX) */
  private initContext(): void {
    if (this.ctx) return;
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  /** Ensure context is running (browsers require user gesture) */
  private resume(): void {
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /**
   * Play a procedural SFX sound.
   * @param type — preset name (click, confirm, cancel, notify, etc.)
   */
  playSfx(type: string): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const preset = SFX_PRESETS[type] ?? SFX_PRESETS['click'];
    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.frequency, now);

    // Envelope gain
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(preset.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

    osc.connect(envGain);
    envGain.connect(dest);

    osc.start(now);
    safeStop(osc, now + preset.duration + 0.01);
  }

  /**
   * Play a procedural footstep sound.
   * @param material — surface material (default, wood, concrete, metal, carpet, snow, tile, gravel, grass, metal_grate)
   */
  playFootstep(material?: string): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const preset = FOOTSTEP_PRESETS[material ?? 'default'] ?? FOOTSTEP_PRESETS['default'];
    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Create a short burst of filtered noise for the footstep "thud"
    const bufferSize = Math.ceil(ctx.sampleRate * preset.noiseDuration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with random noise shaped by a decay envelope
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.exp(-t * 12);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Band-pass filter to shape the sound for the material
    const filter = ctx.createBiquadFilter();
    filter.type = preset.filterType;
    filter.frequency.value = preset.baseFreq;
    filter.Q.value = preset.filterQ;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(preset.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.noiseDuration);

    noiseSource.connect(filter);
    filter.connect(envGain);
    envGain.connect(dest);

    noiseSource.start(now);

    // Additional click/harmonic for hard surfaces (tile, metal_grate, wood, gravel)
    if (preset.clickFreq > 0) {
      const clickOsc = ctx.createOscillator();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(preset.clickFreq * (0.9 + Math.random() * 0.2), now);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(preset.clickGain, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      clickOsc.connect(clickGain);
      clickGain.connect(dest);

      clickOsc.start(now);
      safeStop(clickOsc, now + 0.05);
    }
  }

  /**
   * Play ambient sound for a scene.
   * Stops any currently playing ambient before starting the new one.
   * @param sceneId — the scene to play ambient for
   */
  playAmbient(sceneId: SceneId): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // If same scene, do nothing
    if (this.currentAmbientScene === sceneId) return;

    // Stop current ambient
    this.stopAmbient();

    const config = AMBIENT_CONFIGS[sceneId];
    if (!config) {
      this.currentAmbientScene = sceneId;
      return; // No ambient for this scene
    }

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    // ── Dialogue muffle filter (lowpass on ambient bus) ──
    this.ambientMuffleFilter = ctx.createBiquadFilter();
    this.ambientMuffleFilter.type = 'lowpass';
    this.ambientMuffleFilter.frequency.value = this.muffleEnabled ? 800 : 22050;
    this.ambientMuffleFilter.Q.value = 1.0;

    // ── Ambient reverb (convolver with dry/wet mix) ──
    const reverbPreset = this.currentReverbPreset ?? this.getDefaultReverbPreset(sceneId);
    const reverbConfig = REVERB_PRESETS[reverbPreset] ?? REVERB_PRESETS['small_room'];

    this.ambientConvolver = ctx.createConvolver();
    this.ambientConvolver.buffer = this.createAmbientReverbImpulse(ctx, reverbConfig.decay);

    this.ambientReverbGain = ctx.createGain();
    this.ambientReverbGain.gain.value = reverbConfig.wetMix;

    this.ambientDryReverbGain = ctx.createGain();
    this.ambientDryReverbGain.gain.value = 1 - reverbConfig.wetMix;

    // Create a dedicated gain node for ambient volume control
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.6;

    // Routing: muffleFilter → (dry + reverb) → ambientGain → masterGain
    this.ambientMuffleFilter.connect(this.ambientDryReverbGain);
    this.ambientMuffleFilter.connect(this.ambientConvolver);
    this.ambientConvolver.connect(this.ambientReverbGain);

    this.ambientDryReverbGain.connect(this.ambientGain);
    this.ambientReverbGain.connect(this.ambientGain);

    this.ambientGain.connect(dest);

    // ── Drone oscillator layers ── (connect to muffle filter, not directly to gain)
    for (const layer of config.layers) {
      const nodes = this.createAmbientLayer(ctx, layer, this.ambientMuffleFilter);
      this.ambientNodes.push(nodes);

      // Legacy: support layer-level randomSound for backward compat
      if (layer.randomInterval > 0 && layer.randomSound) {
        const timer = this.createLegacyRandomTimer(layer.randomInterval, layer.randomSound);
        this.randomSoundTimers.push(timer);
      }
    }

    // ── Noise layers (rain, wind, steam hiss, etc.) ── (also route through muffle filter)
    if (config.noiseLayers) {
      for (const noiseDef of config.noiseLayers) {
        this.createNoiseLayer(ctx, noiseDef, this.ambientMuffleFilter);
      }
    }

    // ── Scene-level random sound events ── (route through muffle filter)
    if (config.randomSounds) {
      for (const soundDef of config.randomSounds) {
        const timer = this.createRandomSoundTimer(soundDef);
        this.randomSoundTimers.push(timer);
      }
    }

    this.currentAmbientScene = sceneId;
  }

  /** Create a single ambient layer (drone oscillator + optional harmonic + LFO) */
  private createAmbientLayer(
    ctx: AudioContext,
    layer: AmbientLayer,
    destination: GainNode,
  ): {
    osc: OscillatorNode;
    gain: GainNode;
    lfo?: OscillatorNode;
    lfoGain?: GainNode;
    harmonicOsc?: OscillatorNode;
    harmonicGain?: GainNode;
  } {
    const now = ctx.currentTime;

    // Main oscillator
    const osc = ctx.createOscillator();
    osc.type = layer.type;
    osc.frequency.setValueAtTime(layer.frequency, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(layer.gain, now);

    // LFO for frequency modulation (subtle wobble)
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

    // Harmonic layer (optional)
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

  /** Create a continuous noise layer (for rain, wind, steam, etc.) */
  private createNoiseLayer(
    ctx: AudioContext,
    noiseDef: NoiseLayerDef,
    destination: GainNode,
  ): void {
    const now = ctx.currentTime;

    // Create a looping white noise buffer (2 seconds, looping)
    const bufferSize = Math.ceil(ctx.sampleRate * 2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filter to shape the noise
    const filter = ctx.createBiquadFilter();
    filter.type = noiseDef.filterType;
    filter.frequency.setValueAtTime(noiseDef.filterFreq, now);
    filter.Q.value = noiseDef.filterQ;

    // Gain control
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(noiseDef.gain, now);

    // Optional LFO on filter frequency (for wind gusts, etc.)
    if (noiseDef.lfoFreq > 0) {
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(noiseDef.lfoFreq, now);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(noiseDef.lfoDepth, now);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      lfo.start(now);
      this.noiseLfoNodes.push(lfo);
    }

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(destination);
    source.start(now);

    this.noiseSourceNodes.push(source);
    this.noiseGainNodes.push(gainNode);
    this.noiseFilterNodes.push(filter);
  }

  /** Legacy random sound timer for layer-level randomSound (backward compat) */
  private createLegacyRandomTimer(
    interval: number,
    sound: NonNullable<AmbientLayer['randomSound']>,
  ): ReturnType<typeof setTimeout> {
    let timerId!: ReturnType<typeof setTimeout>;

    const playRandom = () => {
      if (this.disposed || !this.ctx || !this.ambientMuffleFilter) return;
      this.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = sound.type;
      osc.frequency.setValueAtTime(
        sound.frequency * (0.85 + Math.random() * 0.3), // ±15% pitch variation
        now,
      );

      const envGain = this.ctx.createGain();
      envGain.gain.setValueAtTime(sound.gain, now);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);

      osc.connect(envGain);
      envGain.connect(this.ambientMuffleFilter);

      osc.start(now);
      safeStop(osc, now + sound.duration + 0.01);
    };

    const scheduleNext = () => {
      const delay = interval * (0.8 + Math.random() * 0.4) * 1000; // ±20% timing variation
      timerId = setTimeout(() => {
        playRandom();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return timerId as unknown as ReturnType<typeof setTimeout>;
  }

  /** Create a timer for a scene-level random sound event */
  private createRandomSoundTimer(soundDef: RandomSoundDef): ReturnType<typeof setTimeout> {
    let timerId!: ReturnType<typeof setTimeout>;

    const playSound = () => {
      if (this.disposed || !this.ctx || !this.ambientMuffleFilter) return;
      this.resume();

      const ctx = this.ctx;
      const now = ctx.currentTime;

      if (soundDef.useNoise) {
        // Noise-based random sound (e.g., cooking sizzle, page turn, rustling)
        const duration = soundDef.duration;
        const bufferSize = Math.ceil(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          const t = i / bufferSize;
          const envelope = Math.exp(-t * 5);
          data[i] = (Math.random() * 2 - 1) * envelope;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = soundDef.noiseFilterFreq ?? soundDef.frequency;
        filter.Q.value = 1.0;

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(soundDef.gain, now);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Optional panning
        if (soundDef.panStart !== undefined && soundDef.panEnd !== undefined) {
          const panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(soundDef.panStart, now);
          panner.pan.linearRampToValueAtTime(soundDef.panEnd, now + duration);
          source.connect(filter);
          filter.connect(envGain);
          envGain.connect(panner);
          panner.connect(this.ambientMuffleFilter);
        } else {
          source.connect(filter);
          filter.connect(envGain);
          envGain.connect(this.ambientMuffleFilter);
        }

        source.start(now);
      } else {
        // Oscillator-based random sound
        const osc = ctx.createOscillator();
        osc.type = soundDef.type;
        const pitchVar = 0.8 + Math.random() * 0.4; // ±20% pitch variation
        osc.frequency.setValueAtTime(soundDef.frequency * pitchVar, now);

        // Optional frequency ramp (for sirens, sweeps)
        if (soundDef.frequencyRamp) {
          osc.frequency.exponentialRampToValueAtTime(
            soundDef.frequencyRamp * pitchVar,
            now + soundDef.duration,
          );
        }

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(soundDef.gain, now);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + soundDef.duration);

        // Optional panning (for car pass-by, etc.)
        if (soundDef.panStart !== undefined && soundDef.panEnd !== undefined) {
          const panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(soundDef.panStart, now);
          panner.pan.linearRampToValueAtTime(soundDef.panEnd, now + soundDef.duration);

          osc.connect(envGain);
          envGain.connect(panner);
          panner.connect(this.ambientMuffleFilter);
        } else {
          osc.connect(envGain);
          envGain.connect(this.ambientMuffleFilter);
        }

        osc.start(now);
        safeStop(osc, now + soundDef.duration + 0.01);
      }
    };

    const scheduleNext = () => {
      const { minInterval, maxInterval } = soundDef;
      // ±20% timing variation
      const baseInterval = minInterval + Math.random() * (maxInterval - minInterval);
      const variation = baseInterval * (0.8 + Math.random() * 0.4);
      const delay = variation * 1000;
      timerId = setTimeout(() => {
        playSound();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return timerId as unknown as ReturnType<typeof setTimeout>;
  }

  /** Stop all ambient sounds */
  stopAmbient(): void {
    // Clear all random sound timers
    for (const timer of this.randomSoundTimers) {
      clearTimeout(timer as unknown as number);
    }
    this.randomSoundTimers = [];

    // Stop noise layers
    for (const lfo of this.noiseLfoNodes) {
      try { lfo.stop(); } catch { /* already stopped */ }
    }
    this.noiseLfoNodes = [];
    for (const source of this.noiseSourceNodes) {
      try { source.stop(); } catch { /* already stopped */ }
    }
    this.noiseSourceNodes = [];
    for (const gain of this.noiseGainNodes) {
      try { gain.disconnect(); } catch { /* ignore */ }
    }
    this.noiseGainNodes = [];
    for (const filter of this.noiseFilterNodes) {
      try { filter.disconnect(); } catch { /* ignore */ }
    }
    this.noiseFilterNodes = [];

    // Fade out and stop all ambient nodes
    const ctx = this.ctx;
    if (ctx && this.ambientGain) {
      const now = ctx.currentTime;
      // Capture current nodes so the deferred cleanup doesn't kill newly-started ones
      const nodesToStop = [...this.ambientNodes];
      const gainToDisconnect = this.ambientGain;
      const muffleFilterToDisconnect = this.ambientMuffleFilter;
      const convolverToDisconnect = this.ambientConvolver;
      const reverbGainToDisconnect = this.ambientReverbGain;
      const dryReverbGainToDisconnect = this.ambientDryReverbGain;
      this.ambientNodes = [];
      this.ambientGain = null;
      this.ambientMuffleFilter = null;
      this.ambientConvolver = null;
      this.ambientReverbGain = null;
      this.ambientDryReverbGain = null;

      gainToDisconnect.gain.setValueAtTime(gainToDisconnect.gain.value, now);
      gainToDisconnect.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      // Stop nodes after fade
      setTimeout(() => {
        for (const node of nodesToStop) {
          try { node.osc.stop(); } catch { /* already stopped */ }
          try { node.lfo?.stop(); } catch { /* already stopped */ }
          try { node.harmonicOsc?.stop(); } catch { /* already stopped */ }
          try { node.gain.disconnect(); } catch { /* ignore */ }
          try { node.lfoGain?.disconnect(); } catch { /* ignore */ }
          try { node.harmonicGain?.disconnect(); } catch { /* ignore */ }
        }
        try { gainToDisconnect.disconnect(); } catch { /* ignore */ }
        try { muffleFilterToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { convolverToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { reverbGainToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { dryReverbGainToDisconnect?.disconnect(); } catch { /* ignore */ }
      }, 600);
    } else {
      this.ambientNodes = [];
      this.ambientGain = null;
      this.ambientMuffleFilter = null;
      this.ambientConvolver = null;
      this.ambientReverbGain = null;
      this.ambientDryReverbGain = null;
    }

    this.currentAmbientScene = null;
  }

  /* ─── Ambient Music System ─── */

  /**
   * Play procedural ambient music for a scene.
   * Creates evolving chord pads with LFO, filtering, and reverb.
   * Stops any currently playing music before starting new.
   * @param sceneId — the scene to play music for
   */
  playAmbientMusic(sceneId: SceneId): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // If same scene, do nothing
    if (this.currentMusicScene === sceneId) return;

    // Stop current music
    this.stopAmbientMusic();

    const config = AMBIENT_MUSIC_CONFIGS[sceneId];
    if (!config) {
      this.currentMusicScene = sceneId;
      return;
    }

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // ── Create convolver (reverb) ──
    this.musicConvolver = ctx.createConvolver();
    this.musicConvolver.buffer = this.createReverbImpulse(ctx, config.reverbDecay);

    // Wet (reverb) path
    this.musicConvolverGain = ctx.createGain();
    this.musicConvolverGain.gain.value = config.reverbMix;
    this.musicConvolver.connect(this.musicConvolverGain);

    // Dry path
    this.musicDryGain = ctx.createGain();
    this.musicDryGain.gain.value = 1 - config.reverbMix;

    // ── Music master gain ──
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0, now);
    this.musicGain.gain.linearRampToValueAtTime(config.gain, now + 2); // 2s fade-in

    // ── Filter for pad warmth ──
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = config.filterFreq;
    this.musicFilter.Q.value = config.filterQ;

    // ── LFO on filter cutoff for movement ──
    this.musicLfo = ctx.createOscillator();
    this.musicLfo.type = 'sine';
    this.musicLfo.frequency.setValueAtTime(config.lfoFreq, now);

    this.musicLfoGain = ctx.createGain();
    this.musicLfoGain.gain.setValueAtTime(config.lfoDepth, now);

    this.musicLfo.connect(this.musicLfoGain);
    this.musicLfoGain.connect(this.musicFilter.frequency);

    // ── Routing: pad oscs → filter → gain → (dry + wet) → master ──
    this.musicFilter.connect(this.musicGain);
    this.musicGain.connect(this.musicDryGain);
    this.musicGain.connect(this.musicConvolver);
    this.musicDryGain.connect(dest);
    this.musicConvolverGain.connect(dest);

    this.musicLfo.start(now);

    // ── Play first chord ──
    this.playMusicChord(config, 0, now);

    // ── Texture layer (detuned oscillator for richness) ──
    if (config.textureLayer) {
      const tl = config.textureLayer;
      this.textureOsc = ctx.createOscillator();
      this.textureOsc.type = tl.type;
      // Use root frequency from first chord × multiplier
      const rootFreq = config.chords[0].frequencies[0] * tl.freqMult;
      this.textureOsc.frequency.setValueAtTime(rootFreq, now);

      this.textureGain = ctx.createGain();
      this.textureGain.gain.setValueAtTime(tl.gain, now);

      // Texture LFO
      this.textureLfo = ctx.createOscillator();
      this.textureLfo.type = 'sine';
      this.textureLfo.frequency.setValueAtTime(tl.lfoFreq, now);

      this.textureLfoGain = ctx.createGain();
      this.textureLfoGain.gain.setValueAtTime(tl.lfoDepth, now);

      this.textureLfo.connect(this.textureLfoGain);
      this.textureLfoGain.connect(this.textureOsc.frequency);

      this.textureOsc.connect(this.textureGain);
      this.textureGain.connect(this.musicFilter);

      this.textureOsc.start(now);
      this.textureLfo.start(now);
    }

    this.currentMusicScene = sceneId;
  }

  /** Play a single chord from the progression and schedule the next */
  private playMusicChord(config: AmbientMusicConfig, chordIndex: number, startTime: number): void {
    if (this.disposed || !this.ctx || !this.musicFilter) return;

    const ctx = this.ctx;
    const chord = config.chords[chordIndex % config.chords.length];
    const now = startTime;

    // Create an oscillator for each voice in the chord
    for (const freq of chord.frequencies) {
      const osc = ctx.createOscillator();
      osc.type = config.padType;
      osc.frequency.setValueAtTime(freq, now);

      // Slight detuning per voice for richness (±3 cents)
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

      const voiceGain = ctx.createGain();
      // Gentle attack
      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.7 / chord.frequencies.length, now + 1.5);

      osc.connect(voiceGain);
      voiceGain.connect(this.musicFilter);

      osc.start(now);
      // Stop after chord duration + fade-out + buffer
      safeStop(osc, now + chord.duration + 1);

      this.musicNodes.push({ osc, gain: voiceGain });
    }

    // Schedule fade-out of current voices near end of chord
    const fadeTime = now + chord.duration - 1;
    for (const node of this.musicNodes) {
      try {
        node.gain.gain.setValueAtTime(node.gain.gain.value, fadeTime);
        node.gain.gain.linearRampToValueAtTime(0.001, fadeTime + 1);
      } catch { /* node may already be stopping */ }
    }

    // Schedule next chord
    this.musicChordTimer = setTimeout(() => {
      // Clean up finished oscillators
      this.musicNodes = this.musicNodes.filter((n) => {
        try {
          // If osc is still playing, stop it
          n.osc.stop();
        } catch { /* already stopped */ }
        return false;
      });

      // Schedule next chord
      const nextIndex = (chordIndex + 1) % config.chords.length;
      if (!this.disposed && this.currentMusicScene !== null) {
        this.playMusicChord(config, nextIndex, ctx.currentTime);
      }
    }, chord.duration * 1000) as unknown as ReturnType<typeof setTimeout>;
  }

  /** Create an artificial reverb impulse response */
  private createReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
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

  /** Stop all ambient music */
  stopAmbientMusic(): void {
    // Clear chord timer
    if (this.musicChordTimer) {
      clearTimeout(this.musicChordTimer as unknown as number);
      this.musicChordTimer = null;
    }

    const ctx = this.ctx;

    // Fade out music gain
    if (ctx && this.musicGain) {
      const now = ctx.currentTime;
      // Capture current nodes so the deferred cleanup doesn't kill newly-started ones
      const nodesToStop = [...this.musicNodes];
      const lfoToStop = this.musicLfo;
      const textureOscToStop = this.textureOsc;
      const textureLfoToStop = this.textureLfo;
      const gainToDisconnect = this.musicGain;
      const filterToDisconnect = this.musicFilter;
      const convolverToDisconnect = this.musicConvolver;
      const convolverGainToDisconnect = this.musicConvolverGain;
      const dryGainToDisconnect = this.musicDryGain;

      // Immediately clear instance refs so playAmbientMusic can set new ones
      this.musicNodes = [];
      this.musicGain = null;
      this.musicFilter = null;
      this.musicLfo = null;
      this.musicLfoGain = null;
      this.musicConvolver = null;
      this.musicConvolverGain = null;
      this.musicDryGain = null;
      this.textureOsc = null;
      this.textureGain = null;
      this.textureLfo = null;
      this.textureLfoGain = null;

      gainToDisconnect.gain.setValueAtTime(gainToDisconnect.gain.value, now);
      gainToDisconnect.gain.linearRampToValueAtTime(0, now + 1);

      setTimeout(() => {
        // Stop all music oscillators
        for (const node of nodesToStop) {
          try { node.osc.stop(); } catch { /* already stopped */ }
          try { node.gain.disconnect(); } catch { /* ignore */ }
        }

        try { lfoToStop?.stop(); } catch { /* already stopped */ }

        try { textureOscToStop?.stop(); } catch { /* already stopped */ }
        try { textureLfoToStop?.stop(); } catch { /* already stopped */ }

        try { gainToDisconnect.disconnect(); } catch { /* ignore */ }
        try { filterToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { convolverToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { convolverGainToDisconnect?.disconnect(); } catch { /* ignore */ }
        try { dryGainToDisconnect?.disconnect(); } catch { /* ignore */ }
      }, 1200);
    } else {
      this.musicNodes = [];
      this.musicGain = null;
      this.musicFilter = null;
      this.musicLfo = null;
      this.musicLfoGain = null;
      this.musicConvolver = null;
      this.musicConvolverGain = null;
      this.musicDryGain = null;
      this.textureOsc = null;
      this.textureGain = null;
      this.textureLfo = null;
      this.textureLfoGain = null;
    }

    this.currentMusicScene = null;
  }

  /* ─── Door Sounds ─── */

  /**
   * Play a door opening sound — metallic creak followed by thud.
   */
  playDoorOpen(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Metallic creak (ascending sawtooth)
    const creakOsc = ctx.createOscillator();
    creakOsc.type = 'sawtooth';
    creakOsc.frequency.setValueAtTime(120, now);
    creakOsc.frequency.exponentialRampToValueAtTime(350, now + 0.25);

    const creakGain = ctx.createGain();
    creakGain.gain.setValueAtTime(0.08, now);
    creakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    creakOsc.connect(creakGain);
    creakGain.connect(dest);
    creakOsc.start(now);
    safeStop(creakOsc, now + 0.35);

    // Thud / impact (low frequency noise burst)
    const thudSize = Math.ceil(ctx.sampleRate * 0.1);
    const thudBuffer = ctx.createBuffer(1, thudSize, ctx.sampleRate);
    const thudData = thudBuffer.getChannelData(0);
    for (let i = 0; i < thudSize; i++) {
      const t = i / thudSize;
      thudData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 20);
    }

    const thudSource = ctx.createBufferSource();
    thudSource.buffer = thudBuffer;

    const thudFilter = ctx.createBiquadFilter();
    thudFilter.type = 'lowpass';
    thudFilter.frequency.value = 200;

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.15, now + 0.15);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    thudSource.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(dest);
    thudSource.start(now + 0.15);
  }

  /**
   * Play a door closing sound — slam followed by click.
   */
  playDoorClose(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Slam (quick low burst)
    const slamSize = Math.ceil(ctx.sampleRate * 0.06);
    const slamBuffer = ctx.createBuffer(1, slamSize, ctx.sampleRate);
    const slamData = slamBuffer.getChannelData(0);
    for (let i = 0; i < slamSize; i++) {
      const t = i / slamSize;
      slamData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 30);
    }

    const slamSource = ctx.createBufferSource();
    slamSource.buffer = slamBuffer;

    const slamFilter = ctx.createBiquadFilter();
    slamFilter.type = 'lowpass';
    slamFilter.frequency.value = 150;

    const slamGain = ctx.createGain();
    slamGain.gain.setValueAtTime(0.2, now);
    slamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    slamSource.connect(slamFilter);
    slamFilter.connect(slamGain);
    slamGain.connect(dest);
    slamSource.start(now);

    // Latch click (sharp square blip)
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(900, now + 0.08);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.12, now + 0.08);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);
    clickOsc.start(now + 0.08);
    safeStop(clickOsc, now + 0.15);
  }

  /* ─── UI Sound Polish ─── */

  /** Play a level-up fanfare — ascending arpeggio with shimmer */
  playLevelUp(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const delay = i * 0.1;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now + delay);
      envGain.gain.linearRampToValueAtTime(0.18, now + delay + 0.03);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

      // Shimmer: add a quiet octave harmonic
      const shimmer = ctx.createOscillator();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(freq * 2, now + delay);

      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, now + delay);
      shimmerGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.05);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

      osc.connect(envGain);
      envGain.connect(dest);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(dest);

      osc.start(now + delay);
      safeStop(osc, now + delay + 0.6);
      shimmer.start(now + delay);
      safeStop(shimmer, now + delay + 0.5);
    });
  }

  /** Play a poem collection sound — ethereal chime with reverb tail */
  playPoemCollect(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Main chime — crystal sine at high frequency
    const chimeFreqs = [1318.5, 1567.98, 2093.0]; // E6, G6, C7

    // Simple reverb via delay feedback
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.15;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;

    reverbGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(dest);
    reverbGain.connect(dest);

    chimeFreqs.forEach((freq, i) => {
      const delayTime = i * 0.15;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delayTime);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now + delayTime);
      envGain.gain.linearRampToValueAtTime(0.15, now + delayTime + 0.02);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + delayTime + 1.2);

      osc.connect(envGain);
      envGain.connect(reverbGain);

      osc.start(now + delayTime);
      safeStop(osc, now + delayTime + 1.5);
    });

    // Clean up delay after 3 seconds
    setTimeout(() => {
      try { reverbGain.disconnect(); } catch { /* ignore */ }
      try { delay.disconnect(); } catch { /* ignore */ }
      try { feedback.disconnect(); } catch { /* ignore */ }
    }, 3000);
  }

  /** Play a quest complete sound — triumphant three-note fanfare */
  playQuestComplete(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Triumphant I-IV-V pattern
    const notes = [
      { freq: 261.63, time: 0, dur: 0.3 },    // C4
      { freq: 349.23, time: 0.2, dur: 0.3 },   // F4
      { freq: 392.0, time: 0.4, dur: 0.5 },    // G4
      { freq: 523.25, time: 0.5, dur: 0.6 },   // C5 (final)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Add triangle harmonic for warmth
      const harm = ctx.createOscillator();
      harm.type = 'triangle';
      harm.frequency.setValueAtTime(freq * 2, now + time);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now + time);
      envGain.gain.linearRampToValueAtTime(0.2, now + time + 0.02);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0, now + time);
      harmGain.gain.linearRampToValueAtTime(0.06, now + time + 0.02);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + time + dur * 0.8);

      osc.connect(envGain);
      envGain.connect(dest);
      harm.connect(harmGain);
      harmGain.connect(dest);

      osc.start(now + time);
      safeStop(osc, now + time + dur + 0.1);
      harm.start(now + time);
      safeStop(harm, now + time + dur + 0.1);
    });
  }

  /** Play a damage sound — harsh impact with low thud */
  playDamage(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Low thud (noise burst)
    const thudSize = Math.ceil(ctx.sampleRate * 0.08);
    const thudBuffer = ctx.createBuffer(1, thudSize, ctx.sampleRate);
    const thudData = thudBuffer.getChannelData(0);
    for (let i = 0; i < thudSize; i++) {
      const t = i / thudSize;
      thudData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 25);
    }

    const thudSource = ctx.createBufferSource();
    thudSource.buffer = thudBuffer;

    const thudFilter = ctx.createBiquadFilter();
    thudFilter.type = 'lowpass';
    thudFilter.frequency.value = 300;

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.25, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    thudSource.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(dest);
    thudSource.start(now);

    // Harsh high-frequency sting (descending sawtooth)
    const stingOsc = ctx.createOscillator();
    stingOsc.type = 'sawtooth';
    stingOsc.frequency.setValueAtTime(800, now);
    stingOsc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    const stingGain = ctx.createGain();
    stingGain.gain.setValueAtTime(0.1, now);
    stingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    stingOsc.connect(stingGain);
    stingGain.connect(dest);
    stingOsc.start(now);
    safeStop(stingOsc, now + 0.25);
  }

  /** Play a heal sound — gentle ascending shimmer with reverb */
  playHeal(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Gentle ascending sparkle
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major triad

    notes.forEach((freq, i) => {
      const delay = i * 0.12;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      const envGain = ctx.createGain();
      envGain.gain.setValueAtTime(0, now + delay);
      envGain.gain.linearRampToValueAtTime(0.12, now + delay + 0.05);
      envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

      // Gentle vibrato
      const vibrato = ctx.createOscillator();
      vibrato.type = 'sine';
      vibrato.frequency.setValueAtTime(5, now + delay);

      const vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 3;

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      osc.connect(envGain);
      envGain.connect(dest);

      osc.start(now + delay);
      safeStop(osc, now + delay + 1);
      vibrato.start(now + delay);
      safeStop(vibrato, now + delay + 1);
    });
  }

  /* ─── Spatial Audio ─── */

  /**
   * Play a spatial SFX at a 3D position using PannerNode.
   * Used for NPC barks, ambient sources, and positional audio cues.
   * @param type — SFX preset name
   * @param position — [x, y, z] world position of the sound source
   * @param options — optional panner configuration
   */
  playSpatialSfx(
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
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const preset = SFX_PRESETS[type] ?? SFX_PRESETS['click'];
    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Create PannerNode for 3D positioning
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.positionX.setValueAtTime(position[0], now);
    panner.positionY.setValueAtTime(position[1], now);
    panner.positionZ.setValueAtTime(position[2], now);
    panner.refDistance = options?.refDistance ?? 1;
    panner.maxDistance = options?.maxDistance ?? 30;
    panner.rolloffFactor = options?.rolloffFactor ?? 1;
    panner.coneInnerAngle = options?.coneInnerAngle ?? 360;
    panner.coneOuterAngle = options?.coneOuterAngle ?? 360;
    panner.coneOuterGain = options?.coneOuterGain ?? 0;

    panner.connect(dest);

    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.frequency, now);

    // Envelope gain
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(preset.gain, now);
    envGain.gain.exponentialRampToValueAtTime(0.001, now + preset.duration);

    osc.connect(envGain);
    envGain.connect(panner);

    osc.start(now);
    safeStop(osc, now + preset.duration + 0.01);
  }

  /**
   * Play a spatial NPC bark at a 3D position.
   * Creates a distinctive voice-like sound with formant filtering.
   * @param text — bark text (used to vary the sound subtly)
   * @param position — [x, y, z] world position of the NPC
   */
  playSpatialBark(text: string, position: [number, number, number]): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    // Create PannerNode for 3D positioning
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.positionX.setValueAtTime(position[0], now);
    panner.positionY.setValueAtTime(position[1], now);
    panner.positionZ.setValueAtTime(position[2], now);
    panner.refDistance = 2;
    panner.maxDistance = 20;
    panner.rolloffFactor = 1.5;

    panner.connect(dest);

    // Generate a brief voice-like tone — frequency varies with text hash
    const textHash = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const baseFreq = 150 + (textHash % 100); // 150–250 Hz range

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, now);

    // Formant filter to simulate vocal tract
    const formant1 = ctx.createBiquadFilter();
    formant1.type = 'bandpass';
    formant1.frequency.value = 800 + (textHash % 400); // Varies per character
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
    envGain.connect(panner);

    osc.connect(formant2);
    formant2.connect(formant2Gain);
    formant2Gain.connect(envGain);

    osc.start(now);
    safeStop(osc, now + 0.25);
  }

  /**
   * Create a spatial ambient source at a 3D position.
   * Returns a handle to stop the source later.
   * @param position — [x, y, z] world position
   * @param config — oscillator configuration
   */
  createSpatialAmbient(
    position: [number, number, number],
    config: {
      type: OscillatorType;
      frequency: number;
      gain: number;
      lfoFreq?: number;
      lfoDepth?: number;
    },
  ): { stop: () => void } {
    if (this.disposed) {
      return { stop: () => {} };
    }

    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return { stop: () => {} };

    const now = ctx.currentTime;

    // Panner for 3D position
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.positionX.setValueAtTime(position[0], now);
    panner.positionY.setValueAtTime(position[1], now);
    panner.positionZ.setValueAtTime(position[2], now);
    panner.refDistance = 1;
    panner.maxDistance = 25;
    panner.rolloffFactor = 1;
    panner.connect(dest);

    // Oscillator
    const osc = ctx.createOscillator();
    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(config.gain, now);

    // Optional LFO
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
    gainNode.connect(panner);
    osc.start(now);

    return {
      stop: () => {
        const stopNow = ctx.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, stopNow);
        gainNode.gain.linearRampToValueAtTime(0, stopNow + 0.5);
        setTimeout(() => {
          try { osc.stop(); } catch { /* already stopped */ }
          try { lfo?.stop(); } catch { /* already stopped */ }
          try { panner.disconnect(); } catch { /* ignore */ }
          try { gainNode.disconnect(); } catch { /* ignore */ }
          try { lfoGain?.disconnect(); } catch { /* ignore */ }
        }, 600);
      },
    };
  }

  /* ─── Stingers ─── */

  /**
   * Play a procedural music stinger for key game moments.
   * @param type — stinger type: tension, discovery, danger, emotional, mystery
   */
  playStinger(type: 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery'): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    const ctx = this.ctx;
    const dest = this.masterGain;
    if (!ctx || !dest) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'tension': {
        // Low rising sawtooth (80→200Hz over 2s) + filtered noise
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 2);

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
        envGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;

        // Filtered noise layer
        const noiseSize = Math.ceil(ctx.sampleRate * 2);
        const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseSize; i++) {
          noiseData[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 400;
        noiseFilter.Q.value = 1;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.04, now + 0.5);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 2);

        osc.connect(filter);
        filter.connect(envGain);
        envGain.connect(dest);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(dest);

        osc.start(now);
        safeStop(osc, now + 2.3);
        noiseSource.start(now);
        break;
      }
      case 'discovery': {
        // Bright ascending arpeggio (C5-E5-G5-C6 triangle waves, 150ms each)
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const delay = i * 0.15;
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + delay);

          const envGain = ctx.createGain();
          envGain.gain.setValueAtTime(0, now + delay);
          envGain.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
          envGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.8);

          // Octave shimmer
          const shimmer = ctx.createOscillator();
          shimmer.type = 'sine';
          shimmer.frequency.setValueAtTime(freq * 2, now + delay);

          const shimmerGain = ctx.createGain();
          shimmerGain.gain.setValueAtTime(0, now + delay);
          shimmerGain.gain.linearRampToValueAtTime(0.04, now + delay + 0.03);
          shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

          osc.connect(envGain);
          envGain.connect(dest);
          shimmer.connect(shimmerGain);
          shimmerGain.connect(dest);

          osc.start(now + delay);
          safeStop(osc, now + delay + 0.9);
          shimmer.start(now + delay);
          safeStop(shimmer, now + delay + 0.7);
        });
        break;
      }
      case 'danger': {
        // Harsh descending tone (400→100Hz over 1s) + noise burst
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 1);

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0.15, now);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(envGain);
        envGain.connect(dest);
        osc.start(now);
        safeStop(osc, now + 1.3);

        // Noise burst
        const burstSize = Math.ceil(ctx.sampleRate * 0.15);
        const burstBuffer = ctx.createBuffer(1, burstSize, ctx.sampleRate);
        const burstData = burstBuffer.getChannelData(0);
        for (let i = 0; i < burstSize; i++) {
          const t = i / burstSize;
          burstData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10);
        }
        const burstSource = ctx.createBufferSource();
        burstSource.buffer = burstBuffer;

        const burstFilter = ctx.createBiquadFilter();
        burstFilter.type = 'lowpass';
        burstFilter.frequency.value = 500;

        const burstGain = ctx.createGain();
        burstGain.gain.setValueAtTime(0.2, now);

        burstSource.connect(burstFilter);
        burstFilter.connect(burstGain);
        burstGain.connect(dest);
        burstSource.start(now);
        break;
      }
      case 'emotional': {
        // Soft sustained chord (A3-C#4-E4 sine waves, 3s fade in/out)
        const chordFreqs = [220, 277.18, 329.63]; // A3, C#4, E4
        chordFreqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

          const envGain = ctx.createGain();
          envGain.gain.setValueAtTime(0, now);
          envGain.gain.linearRampToValueAtTime(0.1, now + 1.5);
          envGain.gain.setValueAtTime(0.1, now + 2);
          envGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

          osc.connect(envGain);
          envGain.connect(dest);
          osc.start(now);
          safeStop(osc, now + 3.1);
        });
        break;
      }
      case 'mystery': {
        // Detuned pair (220Hz + 223Hz sine, beating effect, 2s)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(220, now);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(223, now);

        const envGain = ctx.createGain();
        envGain.gain.setValueAtTime(0, now);
        envGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
        envGain.gain.setValueAtTime(0.12, now + 1.5);
        envGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        osc1.connect(envGain);
        osc2.connect(envGain);
        envGain.connect(dest);

        osc1.start(now);
        osc2.start(now);
        safeStop(osc1, now + 2.3);
        safeStop(osc2, now + 2.3);
        break;
      }
    }
  }

  /* ─── Dialogue Muffle Filter ─── */

  /**
   * Enable dialogue muffle — smoothly ramp ambient lowpass filter down to 800Hz.
   * Creates a "behind the wall" effect so dialogue stands out.
   */
  enableDialogueMuffle(): void {
    if (this.disposed || !this.ambientMuffleFilter || !this.ctx) return;
    this.muffleEnabled = true;
    const now = this.ctx.currentTime;
    this.ambientMuffleFilter.frequency.setValueAtTime(this.ambientMuffleFilter.frequency.value, now);
    this.ambientMuffleFilter.frequency.linearRampToValueAtTime(800, now + 0.3);
  }

  /**
   * Disable dialogue muffle — smoothly ramp ambient lowpass filter back to full range.
   */
  disableDialogueMuffle(): void {
    if (this.disposed || !this.ambientMuffleFilter || !this.ctx) return;
    this.muffleEnabled = false;
    const now = this.ctx.currentTime;
    this.ambientMuffleFilter.frequency.setValueAtTime(this.ambientMuffleFilter.frequency.value, now);
    this.ambientMuffleFilter.frequency.linearRampToValueAtTime(22050, now + 0.5);
  }

  /* ─── Ambient Reverb Presets ─── */

  /**
   * Set the reverb preset for the ambient bus.
   * Takes effect on the next playAmbient() call, or immediately if ambient is playing.
   */
  setReverbPreset(preset: string): void {
    this.currentReverbPreset = preset;

    // If ambient is currently playing, apply the new reverb immediately
    if (!this.ambientConvolver || !this.ctx || !this.ambientReverbGain || !this.ambientDryReverbGain) return;

    const reverbConfig = REVERB_PRESETS[preset] ?? REVERB_PRESETS['small_room'];
    const now = this.ctx.currentTime;

    // Smoothly transition the wet/dry mix
    this.ambientReverbGain.gain.setValueAtTime(this.ambientReverbGain.gain.value, now);
    this.ambientReverbGain.gain.linearRampToValueAtTime(reverbConfig.wetMix, now + 0.5);
    this.ambientDryReverbGain.gain.setValueAtTime(this.ambientDryReverbGain.gain.value, now);
    this.ambientDryReverbGain.gain.linearRampToValueAtTime(1 - reverbConfig.wetMix, now + 0.5);
  }

  /** Get default reverb preset based on scene ID */
  private getDefaultReverbPreset(sceneId: SceneId): string {
    if (SCENE_REVERB_PRESETS[sceneId]) return SCENE_REVERB_PRESETS[sceneId];
    return 'small_room';
  }

  /** Create an impulse response buffer for ambient reverb */
  private createAmbientReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
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

  /* ─── Volume & Lifecycle ─── */

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  /** Stop all audio immediately */
  stop(): void {
    this.stopAmbient();
    this.stopAmbientMusic();
  }

  dispose(): void {
    this.disposed = true;
    this.stopAmbient();
    this.stopAmbientMusic();

    // Remove blur/focus handlers
    if (typeof window !== 'undefined' && this._onBlur) {
      window.removeEventListener('blur', this._onBlur);
      window.removeEventListener('focus', this._onFocus!);
      this._onBlur = null;
      this._onFocus = null;
    }

    if (this.ctx) {
      try { this.ctx.close(); } catch { /* ignore */ }
      this.ctx = null;
    }
    this.masterGain = null;
  }
}

/** Singleton audio engine instance */
export const audioEngine = new AudioEngine();
export default audioEngine;
