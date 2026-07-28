/* ─── Scene music configs — MusicEngine 3-layer procedural beds ─── */

import type { SceneId } from '@/shared/types/game';
import type { ScaleDef } from './musicTheory';

export type { ScaleDef };

export interface SceneMusicConfig {
  /** Scale to use for melody and chord generation */
  scale: ScaleDef;
  /** Root MIDI note (e.g., 48 = C3, 50 = D3) */
  rootMidi: number;
  /** Pad oscillator type */
  padType: OscillatorType;
  /** Pad filter cutoff frequency in Hz */
  padFilterFreq: number;
  /** Pad filter Q */
  padFilterQ: number;
  /** Pad LFO frequency (Hz) for filter modulation */
  padLfoFreq: number;
  /** Pad LFO depth (Hz) for filter modulation */
  padLfoDepth: number;
  /** Pad reverb wet mix (0-1) */
  padReverbMix: number;
  /** Pad reverb decay in seconds */
  padReverbDecay: number;
  /** Chord change interval in seconds */
  chordChangeInterval: number;
  /** Number of voices per chord (3=triad, 4=7th, etc.) */
  chordVoices: number;
  /** Whether to use 7th chords (adds 4th voice) */
  useSeventhChords: boolean;
  /** Whether to use open fifths instead of full chords */
  useOpenFifths: boolean;
  /** Bass oscillator type */
  bassType: OscillatorType;
  /** Bass gain (0-1) */
  bassGain: number;
  /** Melody oscillator type */
  melodyType: OscillatorType;
  /** Melody gain (0-1) */
  melodyGain: number;
  /** Chance per beat to play a melody note (0-1) */
  melodyChance: number;
  /** Tempo in BPM (controls beat timing for bass and melody) */
  tempo: number;
  /** Master gain for the entire music layer (0.03-0.06 recommended) */
  masterGain: number;
}

export const SCALES: Record<string, ScaleDef> = {
  // C minor pentatonic: C, Eb, F, G, Bb
  minor_pentatonic: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
  },
  // D natural minor: D, E, F, G, A, Bb, C
  natural_minor: {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  // E phrygian: E, F, G, A, B, C, D
  phrygian: {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },
  // F lydian: F, G, A, B, C, D, E
  lydian: {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },
  // G minor: G, A, Bb, C, D, Eb, F (harmonic minor variant: Db instead of Eb)
  g_minor_exotic: {
    name: 'G Minor Exotic',
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  // Bb major: Bb, C, D, Eb, F, G, A
  major: {
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
};

/**
 * Scene → music config mapping.
 * All 14 scenes are covered across 6 mood categories.
 */
export const SCENE_MUSIC_CONFIGS: Record<SceneId, SceneMusicConfig> = {
  /* ─── 1. INDOOR/COZY ─── */
  volodka_room: {
    scale: SCALES.minor_pentatonic,
    rootMidi: 48, // C3
    padType: 'triangle',
    padFilterFreq: 500,
    padFilterQ: 0.8,
    padLfoFreq: 0.08,
    padLfoDepth: 40,
    padReverbMix: 0.4,
    padReverbDecay: 3,
    chordChangeInterval: 8,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sine',
    bassGain: 0.015,
    melodyType: 'triangle',
    melodyGain: 0.008,
    melodyChance: 0.05,
    tempo: 60,
    masterGain: 0.04,
  },
  home_evening: {
    scale: SCALES.minor_pentatonic,
    rootMidi: 48, // C3
    padType: 'triangle',
    padFilterFreq: 550,
    padFilterQ: 0.7,
    padLfoFreq: 0.07,
    padLfoDepth: 30,
    padReverbMix: 0.35,
    padReverbDecay: 2.5,
    chordChangeInterval: 8,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sine',
    bassGain: 0.012,
    melodyType: 'sine',
    melodyGain: 0.006,
    melodyChance: 0.04,
    tempo: 60,
    masterGain: 0.035,
  },
  zarema_albert_room: {
    scale: SCALES.minor_pentatonic,
    rootMidi: 48, // C3
    padType: 'triangle',
    padFilterFreq: 520,
    padFilterQ: 0.6,
    padLfoFreq: 0.09,
    padLfoDepth: 35,
    padReverbMix: 0.3,
    padReverbDecay: 2,
    chordChangeInterval: 8,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sine',
    bassGain: 0.012,
    melodyType: 'sine',
    melodyGain: 0.007,
    melodyChance: 0.04,
    tempo: 60,
    masterGain: 0.035,
  },

  /* ─── 2. NOIR/STREET ─── */
  street_night: {
    scale: SCALES.natural_minor,
    rootMidi: 50, // D3
    padType: 'sawtooth',
    padFilterFreq: 350,
    padFilterQ: 2.0,
    padLfoFreq: 0.04,
    padLfoDepth: 60,
    padReverbMix: 0.6,
    padReverbDecay: 5,
    chordChangeInterval: 6,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sawtooth',
    bassGain: 0.018,
    melodyType: 'sine',
    melodyGain: 0.005,
    melodyChance: 0.03,
    tempo: 50,
    masterGain: 0.03,
  },
  street_winter: {
    scale: SCALES.natural_minor,
    rootMidi: 50, // D3
    padType: 'sawtooth',
    padFilterFreq: 280,
    padFilterQ: 1.5,
    padLfoFreq: 0.05,
    padLfoDepth: 50,
    padReverbMix: 0.55,
    padReverbDecay: 5,
    chordChangeInterval: 6,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sawtooth',
    bassGain: 0.015,
    melodyType: 'triangle',
    melodyGain: 0.004,
    melodyChance: 0.03,
    tempo: 50,
    masterGain: 0.028,
  },

  /* ─── 3. TENSE/ACTION ─── */
  battle: {
    scale: SCALES.phrygian,
    rootMidi: 40, // E2
    padType: 'square',
    padFilterFreq: 500,
    padFilterQ: 4.0,
    padLfoFreq: 0.25,
    padLfoDepth: 150,
    padReverbMix: 0.3,
    padReverbDecay: 1.5,
    chordChangeInterval: 4,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: true,
    bassType: 'sawtooth',
    bassGain: 0.025,
    melodyType: 'square',
    melodyGain: 0.008,
    melodyChance: 0.06,
    tempo: 80,
    masterGain: 0.05,
  },
  office_day: {
    scale: SCALES.phrygian,
    rootMidi: 40, // E2
    padType: 'sawtooth',
    padFilterFreq: 300,
    padFilterQ: 3.0,
    padLfoFreq: 0.15,
    padLfoDepth: 80,
    padReverbMix: 0.2,
    padReverbDecay: 1.5,
    chordChangeInterval: 4,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sawtooth',
    bassGain: 0.015,
    melodyType: 'sine',
    melodyGain: 0.004,
    melodyChance: 0.03,
    tempo: 80,
    masterGain: 0.025,
  },

  /* ─── 4. DREAMY ─── */
  sleep_dream: {
    scale: SCALES.lydian,
    rootMidi: 53, // F3
    padType: 'sine',
    padFilterFreq: 500,
    padFilterQ: 0.6,
    padLfoFreq: 0.03,
    padLfoDepth: 60,
    padReverbMix: 0.8,
    padReverbDecay: 8,
    chordChangeInterval: 12,
    chordVoices: 4,
    useSeventhChords: true,
    useOpenFifths: false,
    bassType: 'sine',
    bassGain: 0.01,
    melodyType: 'sine',
    melodyGain: 0.006,
    melodyChance: 0.04,
    tempo: 40,
    masterGain: 0.03,
  },
  library_day: {
    scale: SCALES.lydian,
    rootMidi: 53, // F3
    padType: 'sine',
    padFilterFreq: 400,
    padFilterQ: 0.4,
    padLfoFreq: 0.02,
    padLfoDepth: 30,
    padReverbMix: 0.7,
    padReverbDecay: 6,
    chordChangeInterval: 12,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sine',
    bassGain: 0.006,
    melodyType: 'sine',
    melodyGain: 0.003,
    melodyChance: 0.02,
    tempo: 40,
    masterGain: 0.02,
  },

  /* ─── 5. OUTDOOR ─── */
  park_day: {
    scale: SCALES.g_minor_exotic,
    rootMidi: 55, // G3
    padType: 'triangle',
    padFilterFreq: 600,
    padFilterQ: 0.5,
    padLfoFreq: 0.05,
    padLfoDepth: 40,
    padReverbMix: 0.5,
    padReverbDecay: 4,
    chordChangeInterval: 8,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: true,
    bassType: 'sine',
    bassGain: 0.01,
    melodyType: 'sine',
    melodyGain: 0.006,
    melodyChance: 0.05,
    tempo: 55,
    masterGain: 0.03,
  },
  rooftop_edge: {
    scale: SCALES.g_minor_exotic,
    rootMidi: 55, // G3
    padType: 'sawtooth',
    padFilterFreq: 350,
    padFilterQ: 1.2,
    padLfoFreq: 0.08,
    padLfoDepth: 50,
    padReverbMix: 0.6,
    padReverbDecay: 6,
    chordChangeInterval: 8,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: true,
    bassType: 'sawtooth',
    bassGain: 0.012,
    melodyType: 'sine',
    melodyGain: 0.005,
    melodyChance: 0.04,
    tempo: 55,
    masterGain: 0.025,
  },
  abandoned_factory: {
    scale: SCALES.g_minor_exotic,
    rootMidi: 55, // G3
    padType: 'sawtooth',
    padFilterFreq: 250,
    padFilterQ: 2.0,
    padLfoFreq: 0.1,
    padLfoDepth: 40,
    padReverbMix: 0.4,
    padReverbDecay: 3,
    chordChangeInterval: 8,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: true,
    bassType: 'sawtooth',
    bassGain: 0.018,
    melodyType: 'triangle',
    melodyGain: 0.005,
    melodyChance: 0.04,
    tempo: 55,
    masterGain: 0.035,
  },

  /* ─── 6. CAFE ─── */
  cafe_evening: {
    scale: SCALES.major,
    rootMidi: 58, // Bb3 (A#3)
    padType: 'triangle',
    padFilterFreq: 600,
    padFilterQ: 0.8,
    padLfoFreq: 0.1,
    padLfoDepth: 30,
    padReverbMix: 0.35,
    padReverbDecay: 2.5,
    chordChangeInterval: 6,
    chordVoices: 4,
    useSeventhChords: true,
    useOpenFifths: false,
    bassType: 'triangle',
    bassGain: 0.015,
    melodyType: 'sine',
    melodyGain: 0.007,
    melodyChance: 0.05,
    tempo: 65,
    masterGain: 0.035,
  },
  volodka_corridor: {
    scale: SCALES.major,
    rootMidi: 58, // Bb3
    padType: 'triangle',
    padFilterFreq: 450,
    padFilterQ: 1.0,
    padLfoFreq: 0.06,
    padLfoDepth: 30,
    padReverbMix: 0.5,
    padReverbDecay: 4,
    chordChangeInterval: 6,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: false,
    bassType: 'sine',
    bassGain: 0.01,
    melodyType: 'sine',
    melodyGain: 0.004,
    melodyChance: 0.03,
    tempo: 65,
    masterGain: 0.025,
  },
  chk_forest_zorge: {
    scale: SCALES.g_minor_exotic,
    rootMidi: 50,
    padType: 'triangle',
    padFilterFreq: 450,
    padFilterQ: 0.7,
    padLfoFreq: 0.04,
    padLfoDepth: 35,
    padReverbMix: 0.55,
    padReverbDecay: 5,
    chordChangeInterval: 10,
    chordVoices: 3,
    useSeventhChords: false,
    useOpenFifths: true,
    bassType: 'sine',
    bassGain: 0.008,
    melodyType: 'sine',
    melodyGain: 0.004,
    melodyChance: 0.03,
    tempo: 48,
    masterGain: 0.028,
  },
};

export function getSceneMusicConfig(sceneId: string): SceneMusicConfig | undefined {
  return SCENE_MUSIC_CONFIGS[sceneId as SceneId];
}
