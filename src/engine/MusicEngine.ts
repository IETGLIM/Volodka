/* ─── Volodka RPG – AAA+ Procedural Ambient Music Engine ───
 *  Three-layer procedural music: Pad, Bass, Melody
 *  All generated with Web Audio API — zero audio files required
 *
 *  Architecture:
 *  - PAD LAYER:   Sustained chords using multiple detuned oscillators (warm pad)
 *  - BASS LAYER:  Slow root note pulses with gain envelope
 *  - MELODY LAYER: Occasional random melody notes from scale (sparse, ambient)
 *
 *  All layers shaped by gain envelopes (slow attack/release for smooth transitions)
 */

import type { SceneId } from '@/shared/types/game';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import { getSharedAudioContext, safeResume, whenAudioReady } from './SharedAudioContext';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { releaseConvolver } from './audio/AudioEngineCore';
import { tryCreateConvolver } from './audio/audioCapabilities';
import {
  subscribeMusicIntensityLayer,
  type MusicIntensityLayer,
} from './audio/musicIntensityLayers';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { ActMoodOverride } from '@/config/proceduralAudioCatalog';

/* ──────────────────── Helpers ──────────────────── */

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

/** Convert a MIDI note number to frequency in Hz */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Pick a random element from an array */
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ──────────────────── Scale Definitions ──────────────────── */

/**
 * Scales defined as arrays of MIDI semitone offsets from the root.
 * The root is specified per scene config.
 */
interface ScaleDef {
  /** Human-readable name */
  name: string;
  /** Semitone intervals from root (0 = root, always included) */
  intervals: number[];
}

const SCALES: Record<string, ScaleDef> = {
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

/** Presentation duck profiles — dialogue keeps more bed than cinematic overlays. */
export type PresentationDuckProfile = 'none' | 'dialogue' | 'cinematic';

const PRESENTATION_DUCK_GAIN: Record<PresentationDuckProfile, number> = {
  none: 1,
  dialogue: 0.72,
  cinematic: 0.58,
};

const INTENSITY_TEMPO_MULTIPLIER: Record<MusicIntensityLayer, number> = {
  exploration: 1,
  tension: 1.14,
  combat: 1.28,
};

/* ──────────────────── v4.8.4: Lookahead-планировщик («A Tale of Two Clocks») ────────────────────
 * Раньше бас/мелодия шли через setInterval(beatMs), а аккорды — через цепочку setTimeout.
 * Проблемы: (1) дрожание таймера ±4мс+ размывало ритм; (2) в скрытом табе Chrome троттлит
 * setInterval до ≥1000мс — пульсы баса срывались, слои рассинхронизировались; (3) огибающие
 * стартовали «сейчас по колбэку», а не на точной сетке AudioContext.
 *
 * Решение: стенные часы тикают раз в LOOKAHEAD_TICK_MS и расписывают все события (пульсы
 * баса, ноты мелодии, смены аккордов) вперёд по точной сетке ctx.currentTime. В скрытом
 * табе горизонт расширяется (троттлинг 1с < LOOKAHEAD_AHEAD_HIDDEN), а «протухшая» сетка
 * реанкорится без взрывного доигрывания пропущенных событий. */
/** Частота тика планировщика (стенные часы). */
const LOOKAHEAD_TICK_MS = 100;
/** Горизонт планирования в видимом табе (сек). */
const LOOKAHEAD_AHEAD_VISIBLE = 0.4;
/** Горизонт в скрытом табе — должен покрывать троттлинг таймеров (≥1с) с запасом. */
const LOOKAHEAD_AHEAD_HIDDEN = 2.6;
/** Допуск «сетка протухла» — за ним включается реанкоринг (fast-forward без доигрывания). */
const GRID_STARVATION_EPSILON = 0.05;
/** Предохранитель циклов планирования от бесконечности при аномальных интервалах. */
const SCHEDULE_LOOP_GUARD_BEATS = 64;
const SCHEDULE_LOOP_GUARD_CHORDS = 8;

interface SceneMusicConfig {
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

/** Per-act harmonic/tempo identity — AAA mood tables (free, no paid stems) */
import { AAA_ACT_MOODS, SCENE_MOOD_OVERRIDE } from './audio/aaaProceduralMood';

const ACT_MUSIC_TINT: Record<number, { rootMidiDelta: number; tempoMult: number }> = {
  1: { rootMidiDelta: 0, tempoMult: 1 },
  2: { rootMidiDelta: 2, tempoMult: 1.02 },
  3: { rootMidiDelta: -1, tempoMult: 0.96 },
  4: { rootMidiDelta: 3, tempoMult: 1.05 },
  5: { rootMidiDelta: -2, tempoMult: 0.92 },
  6: { rootMidiDelta: 4, tempoMult: 1.08 },
  7: { rootMidiDelta: 1, tempoMult: 0.9 },
};

function applyActMusicTint(config: SceneMusicConfig, sceneId?: string | SceneId): SceneMusicConfig {
  let act = 1;
  try {
    act = getGameSnapshot().playerState.progression.currentAct ?? 1;
  } catch { /* snapshot may be unavailable during early boot */ }
  const legacyTint = ACT_MUSIC_TINT[act] ?? ACT_MUSIC_TINT[1];
  const mood = AAA_ACT_MOODS[act] ?? AAA_ACT_MOODS[1];
  const sid = sceneId as SceneId | undefined;
  const sceneOverride = sid ? SCENE_MOOD_OVERRIDE[sid] : undefined;

  const rootDelta = sceneOverride?.rootSemitoneDelta ?? mood.rootSemitoneDelta ?? legacyTint.rootMidiDelta;
  const tempoM = (sceneOverride?.tempoMult ?? mood.tempoMult ?? legacyTint.tempoMult);
  const filterM = sceneOverride?.padFilterMult ?? mood.padFilterMult ?? 1;
  const reverbM = sceneOverride?.reverbMult ?? mood.reverbMult ?? 1;
  const lfoM = sceneOverride?.lfoMult ?? mood.lfoMult ?? 1;

  return {
    ...config,
    rootMidi: config.rootMidi + rootDelta,
    tempo: Math.max(28, Math.round(config.tempo * tempoM)),
    padFilterFreq: Math.max(180, Math.round(config.padFilterFreq * filterM)),
    padReverbMix: Math.min(0.92, Math.max(0.15, config.padReverbMix * reverbM)),
    padReverbDecay: Math.max(1.2, config.padReverbDecay * reverbM),
    padLfoFreq: Math.max(0.02, config.padLfoFreq * lfoM),
    padLfoDepth: Math.max(18, Math.round(config.padLfoDepth * lfoM)),
  };
}

/**
 * Scene → music config mapping.
 * All 14 scenes are covered across 6 mood categories.
 */
const SCENE_MUSIC_CONFIGS: Partial<Record<SceneId, SceneMusicConfig>> = {
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
  solnysh_room: {
    scale: SCALES.minor_pentatonic,
    rootMidi: 48,
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
    // D1 (S12-D): natural_minor + D3 root matches street_night — the corridor
    // is the sonic bridge between volodka_room (C-minor pentatonic) and the
    // noir street bed (D natural minor). Was SCALES.major (Bb) which created
    // mood whiplash against the noir_street musicMood label + brighter than
    // either neighbor. masterGain nudged 0.025→0.022 so the transitional
    // corridor bed never outweighs the destination room/street beds.
    scale: SCALES.natural_minor,
    rootMidi: 50, // D3 — same key as street_night
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
    masterGain: 0.022,
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
  // Подвал завода — низкий фригийский дрон, редкие холодные ноты «Зари-М»
  factory_basement: {
    scale: SCALES.phrygian,
    rootMidi: 40, // E2 — sub-bass dread
    padType: 'sawtooth',
    padFilterFreq: 220,
    padFilterQ: 1.4,
    padLfoFreq: 0.03,
    padLfoDepth: 25,
    padReverbMix: 0.65,
    padReverbDecay: 7,
    chordChangeInterval: 14,
    chordVoices: 2,
    useSeventhChords: false,
    useOpenFifths: true,
    bassType: 'sine',
    bassGain: 0.014,
    melodyType: 'square',
    melodyGain: 0.003,
    melodyChance: 0.02,
    tempo: 40,
    masterGain: 0.03,
  },
  // Пирс у реки — тёплая пентатоника, неторопливые «гитарные» ноты у воды
  river_pier: {
    scale: SCALES.minor_pentatonic,
    rootMidi: 48, // C3
    padType: 'triangle',
    padFilterFreq: 520,
    padFilterQ: 0.8,
    padLfoFreq: 0.05,
    padLfoDepth: 40,
    padReverbMix: 0.5,
    padReverbDecay: 4.5,
    chordChangeInterval: 9,
    chordVoices: 3,
    useSeventhChords: true,
    useOpenFifths: false,
    bassType: 'triangle',
    bassGain: 0.01,
    melodyType: 'triangle',
    melodyGain: 0.006,
    melodyChance: 0.06,
    tempo: 56,
    masterGain: 0.03,
  },
};

/* ──────────────────── Menu Music ──────────────────── */

// FIX S13-21: Menu music config. Melancholic C-minor pentatonic, slower tempo
// (52 BPM), warmer pad, sparser melody — sets the noir-cyberpunk tone before
// the player starts the game. Same root as volodka_room (C3) for continuity
// when transitioning menu → New Game → volodka_room.
const MENU_MUSIC_CONFIG: SceneMusicConfig = {
  scale: SCALES.minor_pentatonic,
  rootMidi: 48, // C3 — matches volodka_room for seamless menu→game transition
  padType: 'triangle',
  padFilterFreq: 420, // slightly darker than volodka_room (500) — more intimate
  padFilterQ: 0.9,
  padLfoFreq: 0.06, // slower LFO — dreamier
  padLfoDepth: 35,
  padReverbMix: 0.45, // more reverb — spacious, empty-city feel
  padReverbDecay: 4,
  chordChangeInterval: 10, // slower chord changes — contemplative
  chordVoices: 3,
  useSeventhChords: false,
  useOpenFifths: true, // open fifths — unresolved, longing
  bassType: 'sine',
  bassGain: 0.012,
  melodyType: 'triangle',
  melodyGain: 0.006,
  melodyChance: 0.03, // sparser melody — almost silent, occasional notes
  tempo: 52,
  masterGain: 0.035,
};

const MENU_MUSIC_SCENE_ID = '__menu__';

/* ──────────────────── Chord Generation ──────────────────── */

/**
 * Build a chord from a scale by stacking thirds.
 * Returns an array of MIDI note numbers.
 */
function buildChord(
  scale: ScaleDef,
  rootMidi: number,
  degree: number, // 0-based scale degree
  voices: number,
  useSeventh: boolean,
  useOpenFifths: boolean,
): number[] {
  const notes: number[] = [];
  const numScaleNotes = scale.intervals.length;

  if (useOpenFifths) {
    // Root and fifth only
    const rootInterval = scale.intervals[degree % numScaleNotes];
    // Fifth is typically 4 scale degrees up
    const fifthInterval = scale.intervals[(degree + 4) % numScaleNotes];
    const octaveShift = Math.floor((degree + 4) / numScaleNotes);

    notes.push(rootMidi + rootInterval);
    notes.push(rootMidi + fifthInterval + octaveShift * 12);
    return notes;
  }

  // Stack thirds: root (degree), 3rd (degree+2), 5th (degree+4), 7th (degree+6)
  const totalVoices = useSeventh ? Math.max(voices, 4) : voices;

  for (let v = 0; v < totalVoices; v++) {
    const scaleStep = degree + v * 2; // Stack in thirds
    const octaveShift = Math.floor(scaleStep / numScaleNotes);
    const intervalIndex = ((scaleStep % numScaleNotes) + numScaleNotes) % numScaleNotes;
    const midiNote = rootMidi + scale.intervals[intervalIndex] + octaveShift * 12;
    notes.push(midiNote);
  }

  return notes;
}

/* ──────────────────── Music Engine Class ──────────────────── */

/**
 * AAA+ procedural ambient music engine.
 * Generates three-layer ambient music (pad, bass, melody) using Web Audio API.
 * Each scene type has its own scale, mood, and tempo configuration.
 */
class MusicEngine {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private musicVolume = 0.5; // 0-1 user-facing volume
  private presentationDuckProfile: PresentationDuckProfile = 'none';
  /** Additional duck factor from cinematic timelines (1 = no duck, 0.3 = ducked to 30%). */
  private cinematicTimelineDuckFactor = 1;
  private intensityLayer: MusicIntensityLayer = 'exploration';
  private disposed = false;
  private sceneGeneration = 0;
  /** Most recently applied ActMoodOverride mood (or null when no override is layered). */
  private actMoodOverrideActive: string | null = null;
  /**
   * Most recently requested act-mood override. Stored so it can be re-applied
   * when the next scene bed finishes starting (playSceneMusic defers bed start
   * by ~1.1s for crossfade — applyActMoodOverride may fire on the dying bed).
   * Cleared in stopMusic so a new scene starts with a clean slate unless the
   * controller re-applies an override on enter.
   */
  private pendingActMoodOverride: ActMoodOverride | null = null;

  // Current state
  private currentScene: string | null = null;
  private currentConfig: SceneMusicConfig | null = null;

  // Pad layer state
  // v4.8.4: голос хранит параметры своей атаки — при lookahead-планировании смены
  // аккорда фейд retiring-голоса считается по ТАЙМЛАЙНУ (а не по мгновенному
  // .gain.value в момент планирования, когда атака ещё не доиграна).
  private padOscillators: Array<{
    osc: OscillatorNode;
    gain: GainNode;
    /** Абсолютное время старта голоса (ctx). */
    start: number;
    /** Целевой уровень после атаки. */
    level: number;
    /** Абсолютное время конца атаки (ctx). */
    attackEnd: number;
  }> = [];
  private padGain: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padLfo: OscillatorNode | null = null;
  private padLfoGain: GainNode | null = null;
  private padConvolver: ConvolverNode | null = null;
  private padConvolverGain: GainNode | null = null;
  private padDryGain: GainNode | null = null;
  /** Current chord degree (index into scale) */
  private currentChordDegree = 0;
  /** Pad voices scheduled for crossfade retirement (each batch keeps its own timer) */
  private pendingPadRetirements: Array<{
    voices: Array<{ osc: OscillatorNode; gain: GainNode }>;
    timer: ReturnType<typeof setTimeout>;
  }> = [];

  // Bass layer state
  private bassOsc: OscillatorNode | null = null;
  private bassGain: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;

  // Melody layer state
  // v4.8.4: melodyTimer удалён — мелодия живёт в lookahead-планировщике

  // Timers
  // v4.8.4: chordTimer/bassTimer удалены — единый lookahead-планировщик ведёт
  // бас, мелодию и смены аккордов на точной сетке AudioContext.currentTime.
  private schedulerTimer: ReturnType<typeof setInterval> | null = null;
  /** Абсолютное время (ctx) следующего басового бита. */
  private nextBeatTime = 0;
  /** Счётчик басовых битов (позиция в такте — пульс на 1-й и 3-й доле). */
  private beatCounter = 0;
  /** Абсолютное время (ctx) следующего шанса мелодии (без множителя интенсивности — как раньше). */
  private nextMelodyTime = 0;
  /** Абсолютное время (ctx) следующей смены аккорда. */
  private nextChordTime = 0;
  /** visibilitychange-обработчик планировщика (расширяет горизонт в скрытом табе). */
  private schedulerVisibilityHandler: (() => void) | null = null;
  private schedulerDocHidden = false;
  private pendingStopCleanupTimer: ReturnType<typeof setTimeout> | null = null;

  // Blur/focus handlers for audio context suspend/resume
  // (P1-3.5 FIX: individual handlers removed — managed centrally by SharedAudioContext.
  // Fields intentionally omitted to avoid dead state.)

  constructor() {
    // P1-3.5 FIX: No longer creating a separate AudioContext.
    // SharedAudioContext module manages the singleton context + blur/focus.
    // Individual blur/focus handlers removed — managed centrally.
  }

  /** Lazily get the shared AudioContext (P1-3.5 FIX) */
  private initContext(): void {
    // Drop stale references to a closed context (can happen after HMR dispose
    // of SharedAudioContext, or if the browser closed the context under memory
    // pressure). Without this, this.ctx stays non-null but ctx.currentTime /
    // createGain() throw InvalidStateError → silent music with no error surfaced.
    if (this.ctx && this.ctx.state === 'closed') {
      this.ctx = null;
      this.masterGainNode = null;
    }
    if (this.ctx) return;
    this.ctx = getSharedAudioContext();
    if (this.ctx) {
      this.masterGainNode = this.ctx.createGain();
      this.masterGainNode.gain.value = 0; // Start silent, fade in
      this.masterGainNode.connect(this.ctx.destination);
    }
  }

  /** Ensure context is running (browsers require user gesture) */
  private resume(): void {
    void safeResume();
  }

  /** Lower music during VN overlays without stopping the bed. */
  setPresentationDucked(ducked: boolean, profile: PresentationDuckProfile = 'cinematic'): void {
    this.presentationDuckProfile = ducked ? profile : 'none';
    this.applyVolume();
  }

  /**
   * Explicit cinematic-timeline duck factor (0–1).
   *
   * Multiplied on top of the presentation-duck gain. Use 1.0 to restore.
   * The ramp duration is configurable so cinematic starts can duck fast
   * (0.5s) and completions can restore slowly (1.0s) for a smooth handoff.
   *
   * Default ramp is 0.45s to match applyVolume's historical behavior.
   */
  setMusicDuckFactor(factor: number, rampSec = 0.45): void {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(factor) ? factor : 1));
    if (clamped === this.cinematicTimelineDuckFactor) return;
    this.cinematicTimelineDuckFactor = clamped;
    this.applyVolume(Math.max(0.05, rampSec));
  }

  /** Adaptive tempo / chord pacing from exploration → tension → combat. */
  setIntensityLayer(layer: MusicIntensityLayer): void {
    if (this.intensityLayer === layer) return;
    this.intensityLayer = layer;
    // v4.8.4: сетку не перестраиваем — планировщик читает актуальный темп
    // (beat/chordDurationSec) на каждом тике, поэтому смена интенсивности
    // подхватывается со следующего планируемого события без рассинхрона.
  }

  /**
   * Apply a per-act mood override on top of the currently playing scene bed.
   * Smoothly ramps the pad low-pass filter cutoff and reverb wet/dry mix over
   * ~1.5s so the same scene sounds subtly different as the story darkens.
   *
   * Stores the override on `pendingActMoodOverride` so it can be re-applied
   * when the next scene bed finishes starting (playSceneMusic defers bed start
   * by ~1.1s for crossfade — this call may land on the dying previous bed).
   *
   * No-op when the AudioContext is unavailable. Safe to call repeatedly.
   */
  applyActMoodOverride(override: ActMoodOverride): void {
    if (this.disposed) return;
    // Always remember the latest override so the next bed start re-applies it.
    this.pendingActMoodOverride = override;
    this.actMoodOverrideActive = override.mood ?? null;

    const ctx = this.ctx;
    const filter = this.padFilter;
    const convolverGain = this.padConvolverGain;
    const dryGain = this.padDryGain;
    if (!ctx || !filter || !convolverGain || !dryGain) return;

    const now = ctx.currentTime;
    // setTargetAtTime reaches ~63% of the delta in one timeConstant.
    // 0.5s timeConstant ≈ 1.5s to settle within ~5% of target — matches the
    // 1.5s ramp duration used by other mood transitions in this engine.
    const RAMP_TAU = 0.5;

    try {
      // Clamp to a safe positive cutoff (BiquadFilter frequency must be > 0).
      const targetCutoff = Number.isFinite(override.filterCutoff) && override.filterCutoff > 0
        ? override.filterCutoff
        : filter.frequency.value;
      filter.frequency.setTargetAtTime(targetCutoff, now, RAMP_TAU);
    } catch {
      /* AudioParam may be invalidated mid-stop */
    }

    const clampedMix = Math.max(0, Math.min(1,
      Number.isFinite(override.reverbMix) ? override.reverbMix : convolverGain.gain.value));
    try {
      convolverGain.gain.setTargetAtTime(clampedMix, now, RAMP_TAU);
    } catch { /* ignore */ }
    try {
      dryGain.gain.setTargetAtTime(1 - clampedMix, now, RAMP_TAU);
    } catch { /* ignore */ }
  }

  /** Returns the most recently applied act-mood override mood, if any. */
  getActMoodOverrideMood(): string | null {
    return this.actMoodOverrideActive;
  }

  /* ═══════════════════ PUBLIC API ═══════════════════ */

  /**
   * Play procedural ambient music for a scene.
   * Creates evolving pad chords, bass pulses, and sparse melody.
   * Smoothly transitions if changing scenes.
   */
  playSceneMusic(sceneId: string): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // Chrome autoplay policy: AudioContext can't start without a user gesture.
    // If the context isn't ready yet (playSceneMusic is called from a scene
    // transition triggered by a React click handler — which fires BEFORE the
    // window-level resumeOnce gesture handler), defer via whenAudioReady so the
    // scene's music bed starts once the context is actually running. Without
    // this, startMusicForScene would early-return on null ctx → silent music.
    if (!this.ctx) {
      whenAudioReady(() => {
        if (this.disposed) return;
        // Re-check scene — user may have transitioned again before the gesture
        this.playSceneMusic(sceneId);
      });
      return;
    }

    // Same scene — no change needed
    if (this.currentScene === sceneId) return;

    const config = SCENE_MUSIC_CONFIGS[resolveDerivedSceneId(sceneId as SceneId)];
    if (!config) {
      // No music config for this scene — stop current music
      this.stopMusic();
      this.currentScene = sceneId;
      return;
    }

    // Increment generation to invalidate any pending callbacks from previous scene
    const myGeneration = ++this.sceneGeneration;

    // Stop current music (with fade out)
    this.stopMusic(1);

    // Small delay to let fade-out complete, then start new.
    // D5 (S12-D): startDelay = fadeOutMs - 100 = 1000 - 100 = 900ms. The new
    // bed starts fading in 100ms BEFORE the old bed's 1s fade-out reaches zero,
    // creating a true 100ms crossfade overlap instead of a 100ms silence gap
    // (previous value was 1100ms = 100ms AFTER fade-out completed).
    const startDelay = this.currentScene !== null ? 900 : 0;

    setTimeout(() => {
      // Guard: if another scene change happened since we started, abort
      if (this.disposed || this.sceneGeneration !== myGeneration) return;
      this.startMusicForScene(sceneId, applyActMusicTint(config, sceneId));
    }, startDelay);
  }

  /**
   * FIX S13-21: Play menu music. Uses a dedicated MENU_MUSIC_CONFIG (melancholic
   * C-minor pentatonic, slow tempo). Deferred via whenAudioReady so it starts
   * after the first user gesture (Chrome autoplay policy: AudioContext can't
   * start without a gesture). When the user clicks anywhere on the menu, the
   * gesture handler in SharedAudioContext creates + resumes the context, then
   * flushes the pending queue — this callback fires and music starts.
   */
  playMenuMusic(): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();

    // Already playing menu music — no change
    if (this.currentScene === MENU_MUSIC_SCENE_ID) return;

    // If AudioContext isn't ready yet (no user gesture), defer via whenAudioReady.
    // The queue flushes on the first click/keydown/touchstart (resumeOnce handler).
    if (!this.ctx) {
      whenAudioReady(() => {
        if (this.disposed) return;
        // Re-check: user may have started a game before the gesture fired
        if (this.currentScene === MENU_MUSIC_SCENE_ID) return;
        this.playMenuMusic();
      });
      return;
    }

    const myGeneration = ++this.sceneGeneration;

    // Stop current music (with fade out)
    this.stopMusic(1);

    const startDelay = this.currentScene !== null ? 900 : 0;

    setTimeout(() => {
      if (this.disposed || this.sceneGeneration !== myGeneration) return;
      this.startMusicForScene(MENU_MUSIC_SCENE_ID, MENU_MUSIC_CONFIG);
    }, startDelay);
  }

  /**
   * Ensure scene bed is audible after same-scene phase changes (e.g. cutscene → exploration).
   * Restarts the bed when it was stopped; otherwise restores duck/volume only.
   */
  resumeSceneMusic(sceneId: string): void {
    if (this.disposed) return;
    this.initContext();
    this.resume();
    this.setPresentationDucked(false);

    const config = SCENE_MUSIC_CONFIGS[resolveDerivedSceneId(sceneId as SceneId)];
    if (!config) {
      this.stopMusic();
      this.currentScene = sceneId;
      return;
    }

    const hasActiveBed =
      this.currentScene === sceneId &&
      this.currentConfig != null &&
      this.padOscillators.length > 0;

    if (hasActiveBed) {
      this.applyVolume();
      return;
    }

    this.playSceneMusic(sceneId);
  }

  /**
   * Stop all music with optional fade duration.
   * @param fadeDuration — seconds to fade out (default 2)
   */
  stopMusic(fadeDuration = 2): void {
    this.sceneGeneration++; // Invalidate any pending callbacks

    if (this.pendingStopCleanupTimer) {
      clearTimeout(this.pendingStopCleanupTimer);
      this.pendingStopCleanupTimer = null;
    }
    // v4.8.4: единый планировщик вместо трёх независимых таймеров
    this.stopScheduler();

    const ctx = this.ctx;
    const shouldFade =
      !this.disposed &&
      fadeDuration > 0 &&
      ctx &&
      this.masterGainNode &&
      this.currentScene !== null;

    if (shouldFade) {
      const now = ctx.currentTime;
      // Fade out master gain
      this.masterGainNode!.gain.setValueAtTime(this.masterGainNode!.gain.value, now);
      this.masterGainNode!.gain.linearRampToValueAtTime(0, now + fadeDuration);

      // Schedule cleanup after fade
      this.pendingStopCleanupTimer = setTimeout(() => {
        this.pendingStopCleanupTimer = null;
        if (this.disposed) return;
        this.cleanupAllNodes();
      }, (fadeDuration + 0.5) * 1000);
    } else {
      this.cleanupAllNodes();
    }

    this.currentScene = null;
    this.currentConfig = null;
    this.currentChordDegree = 0;
    // Clear any act-mood override so the next scene bed starts un-tinted.
    // SceneAudioController.onSceneEnter re-applies the appropriate override.
    this.actMoodOverrideActive = null;
    this.pendingActMoodOverride = null;
  }

  /**
   * Set the music volume (0-1).
   * This is the user-facing volume control.
   */
  setVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.applyVolume();
  }

  /** Get the current music volume */
  getVolume(): number {
    return this.musicVolume;
  }

  /** Get the currently playing scene ID */
  getCurrentScene(): string | null {
    return this.currentScene;
  }

  /** Dispose of all resources — P1-3.5: does NOT close shared AudioContext */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopMusic(0);

    // P1-3.5 FIX: No longer removing blur/focus handlers — managed by SharedAudioContext
    // No longer closing AudioContext — it's shared with AudioEngine

    // Disconnect master gain from shared context destination
    if (this.masterGainNode) {
      try { this.masterGainNode.disconnect(); } catch { /* ignore */ }
      this.masterGainNode = null;
    }
    this.ctx = null; // Release reference to shared context (don't close it)
  }

  /** Re-arm after orchestrator remount (React StrictMode). */
  revive(): void {
    this.disposed = false;
  }

  /* ═══════════════════ PRIVATE: MUSIC START ═══════════════════ */

  private startMusicForScene(sceneId: string, config: SceneMusicConfig): void {
    const ctx = this.ctx;
    const dest = this.masterGainNode;
    if (!ctx || !dest) return;

    this.currentConfig = config;
    this.currentChordDegree = Math.floor(Math.random() * config.scale.intervals.length);

    const now = ctx.currentTime;

    // ── Reverb convolver (dry-only fallback when unsupported) ──
    this.padConvolver = tryCreateConvolver(ctx, this.createReverbImpulse(ctx, config.padReverbDecay));

    this.padConvolverGain = ctx.createGain();
    this.padDryGain = ctx.createGain();

    if (this.padConvolver) {
      this.padConvolverGain.gain.value = config.padReverbMix;
      this.padDryGain.gain.value = 1 - config.padReverbMix;
      this.padConvolver.connect(this.padConvolverGain);
    } else {
      this.padConvolverGain.gain.value = 0;
      this.padDryGain.gain.value = 1;
    }

    // ── Pad filter ──
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = config.padFilterFreq;
    this.padFilter.Q.value = config.padFilterQ;

    // ── Re-apply any pending act-mood override on the fresh nodes ──
    // (SceneAudioController.onSceneEnter calls applyActMoodOverride immediately
    // after playSceneMusic, but playSceneMusic defers bed start by ~1.1s for
    // crossfade. The override is stored on `pendingActMoodOverride` and applied
    // here once the new bed's filter + gains exist. Initial config values
    // become the from-value of the 1.5s setTargetAtTime ramp — inaudible
    // because the master gain is simultaneously fading in from 0.)
    if (this.pendingActMoodOverride) {
      const o = this.pendingActMoodOverride;
      try {
        const cutoff = Number.isFinite(o.filterCutoff) && o.filterCutoff > 0
          ? o.filterCutoff
          : config.padFilterFreq;
        this.padFilter.frequency.setTargetAtTime(cutoff, now, 0.5);
      } catch { /* ignore */ }
      const mix = Math.max(0, Math.min(1,
        Number.isFinite(o.reverbMix) ? o.reverbMix : config.padReverbMix));
      try { this.padConvolverGain.gain.setTargetAtTime(mix, now, 0.5); } catch { /* ignore */ }
      try { this.padDryGain.gain.setTargetAtTime(1 - mix, now, 0.5); } catch { /* ignore */ }
    }

    // ── Pad LFO on filter ──
    this.padLfo = ctx.createOscillator();
    this.padLfo.type = 'sine';
    this.padLfo.frequency.setValueAtTime(config.padLfoFreq, now);

    this.padLfoGain = ctx.createGain();
    this.padLfoGain.gain.setValueAtTime(config.padLfoDepth, now);

    this.padLfo.connect(this.padLfoGain);
    this.padLfoGain.connect(this.padFilter.frequency);

    // ── Pad gain ──
    this.padGain = ctx.createGain();
    this.padGain.gain.setValueAtTime(0, now);

    // ── Routing: pad oscs → pad filter → pad gain → (dry [+ wet]) → master ──
    this.padFilter.connect(this.padGain);
    this.padGain.connect(this.padDryGain);
    if (this.padConvolver) {
      this.padGain.connect(this.padConvolver);
    }
    this.padDryGain.connect(dest);
    if (this.padConvolver) {
      this.padConvolverGain.connect(dest);
    }

    this.padLfo.start(now);

    // ── Fade in master gain over 2 seconds ──
    const effectiveGain =
      config.masterGain * this.musicVolume * PRESENTATION_DUCK_GAIN[this.presentationDuckProfile] * this.cinematicTimelineDuckFactor;
    dest.gain.setValueAtTime(0, now);
    dest.gain.linearRampToValueAtTime(effectiveGain, now + 2);

    // ── Start pad layer ──
    this.playPadChord(config, now);

    // ── Start bass layer (цепочка осцилляторов; пульсы ведёт планировщик) ──
    this.startBassLayer(config, now);

    // ── v4.8.4: единый lookahead-планировщик баса/мелодии/аккордов ──
    this.startScheduler(config, now);

    this.currentScene = sceneId;
  }

  /* ═══════════════════ PAD LAYER ═══════════════════ */

  /** Play a pad chord using the current chord degree */
  private playPadChord(config: SceneMusicConfig, startTime: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.padFilter) return;

    const now = startTime;

    const outgoing = this.padOscillators;
    this.padOscillators = [];
    if (outgoing.length > 0) {
      this.retirePadVoices(outgoing, now, 2);
    }
    // Build chord from scale
    const chordMidi = buildChord(
      config.scale,
      config.rootMidi,
      this.currentChordDegree,
      config.chordVoices,
      config.useSeventhChords,
      config.useOpenFifths,
    );

    // Create oscillators for each chord voice
    for (const midiNote of chordMidi) {
      const freq = midiToFreq(midiNote);

      // Main voice
      const osc = ctx.createOscillator();
      osc.type = config.padType;
      osc.frequency.setValueAtTime(freq, now);
      // Slight detune for warmth (±5 cents per voice)
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, now);

      const voiceGain = ctx.createGain();
      // Slow attack for pad smoothness
      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(
        0.5 / chordMidi.length, // Distribute gain across voices
        now + 2,
      );

      osc.connect(voiceGain);
      voiceGain.connect(this.padFilter);

      osc.start(now);
      this.padOscillators.push({ osc, gain: voiceGain, start: now, level: 0.5 / chordMidi.length, attackEnd: now + 2 });

      // Detuned chorus voice (+7 cents for richness)
      const chorusOsc = ctx.createOscillator();
      chorusOsc.type = config.padType;
      chorusOsc.frequency.setValueAtTime(freq, now);
      chorusOsc.detune.setValueAtTime(7 + (Math.random() - 0.5) * 4, now);

      const chorusGain = ctx.createGain();
      chorusGain.gain.setValueAtTime(0.001, now);
      chorusGain.gain.linearRampToValueAtTime(
        0.25 / chordMidi.length,
        now + 2.5,
      );

      chorusOsc.connect(chorusGain);
      chorusGain.connect(this.padFilter);

      chorusOsc.start(now);
      this.padOscillators.push({ osc: chorusOsc, gain: chorusGain, start: now, level: 0.25 / chordMidi.length, attackEnd: now + 2.5 });
    }
  }

  /** Fade out and stop a batch of pad voices — each call owns its voice list (no shared prev slot). */
  private retirePadVoices(
    voices: Array<{
      osc: OscillatorNode;
      gain: GainNode;
      start?: number;
      level?: number;
      attackEnd?: number;
    }>,
    startTime: number,
    durationSec: number,
  ): void {
    if (voices.length === 0) return;

    for (const voice of voices) {
      try {
        // v4.8.4: значение на момент startTime берём из ТАЙМЛАЙНА атаки голоса,
        // а не из мгновенного .gain.value (при lookahead-планировании фейд
        // может быть расписан раньше, чем доиграется атака уходящего аккорда).
        const attackSpan = voice.attackEnd !== undefined && voice.start !== undefined
          ? Math.max(0.001, voice.attackEnd - voice.start)
          : 0;
        const target = voice.level ?? voice.gain.gain.value;
        const progress = attackSpan > 0 && voice.start !== undefined
          ? Math.min(1, Math.max(0, (startTime - voice.start) / attackSpan))
          : 1;
        const valueAtStart = 0.001 + (target - 0.001) * progress;
        voice.gain.gain.setValueAtTime(valueAtStart, startTime);
        voice.gain.gain.linearRampToValueAtTime(0.001, startTime + durationSec);
      } catch {
        // node may already be stopping
      }
    }

    const timer = setTimeout(() => {
      if (this.disposed) {
        for (const voice of voices) {
          try { voice.osc.stop(); } catch { /* already stopped */ }
          try { voice.gain.disconnect(); } catch { /* ignore */ }
        }
        return;
      }

      const idx = this.pendingPadRetirements.findIndex((entry) => entry.timer === timer);
      if (idx !== -1) this.pendingPadRetirements.splice(idx, 1);

      for (const voice of voices) {
        try { voice.osc.stop(); } catch { /* already stopped */ }
        try { voice.gain.disconnect(); } catch { /* ignore */ }
      }
    }, (durationSec + 0.5) * 1000);

    this.pendingPadRetirements.push({ voices, timer });
  }

  private cancelPendingPadRetirements(): void {
    for (const entry of this.pendingPadRetirements) {
      clearTimeout(entry.timer);
      for (const voice of entry.voices) {
        try { voice.osc.stop(); } catch { /* already stopped */ }
        try { voice.gain.disconnect(); } catch { /* ignore */ }
      }
    }
    this.pendingPadRetirements = [];
  }

  /* ═══════════════════ LOOKAHEAD SCHEDULER (v4.8.4) ═══════════════════ */

  /** Длительность басового бита (сек) — с множителем интенсивности, как раньше. */
  private beatDurationSec(config: SceneMusicConfig): number {
    return 60 / (config.tempo * INTENSITY_TEMPO_MULTIPLIER[this.intensityLayer]);
  }

  /** Длительность шага мелодии (сек) — БЕЗ множителя интенсивности (сохранено прежнее поведение). */
  private melodyStepSec(config: SceneMusicConfig): number {
    return 60 / config.tempo;
  }

  /** Интервал смены аккорда (сек) — с множителем интенсивности. */
  private chordIntervalSec(config: SceneMusicConfig): number {
    return config.chordChangeInterval / INTENSITY_TEMPO_MULTIPLIER[this.intensityLayer];
  }

  /**
   * Запустить lookahead-планировщик для новой сцены. Первый аккорд уже
   * сыгран startMusicForScene → следующая смена аккорда через один интервал.
   */
  private startScheduler(config: SceneMusicConfig, startTime: number): void {
    this.stopScheduler();

    this.nextBeatTime = startTime;
    this.beatCounter = 0;
    this.nextMelodyTime = startTime;
    this.nextChordTime = startTime + this.chordIntervalSec(config);
    this.schedulerDocHidden = typeof document !== 'undefined' ? document.hidden : false;

    if (typeof document !== 'undefined') {
      this.schedulerVisibilityHandler = () => {
        this.schedulerDocHidden = document.hidden;
      };
      document.addEventListener('visibilitychange', this.schedulerVisibilityHandler);
    }

    this.schedulerTimer = setInterval(() => this.schedulerTick(), LOOKAHEAD_TICK_MS);
  }

  /** Полностью остановить планировщик (таймер + visibility-обработчик). */
  private stopScheduler(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer as unknown as number);
      this.schedulerTimer = null;
    }
    if (this.schedulerVisibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.schedulerVisibilityHandler);
    }
    this.schedulerVisibilityHandler = null;
  }

  /**
   * Тик планировщика: расписать все события баса/мелодии/аккордов в пределах
   * горизонта вперёд по точной сетке ctx.currentTime.
   */
  private schedulerTick(): void {
    const ctx = this.ctx;
    const config = this.currentConfig;
    if (!ctx || !config || this.disposed || this.currentScene === null) return;

    const now = ctx.currentTime;
    const ahead = this.schedulerDocHidden ? LOOKAHEAD_AHEAD_HIDDEN : LOOKAHEAD_AHEAD_VISIBLE;

    // Скрытый таб троттлит тики — если сетка «протухла», реанкорим её
    // (fast-forward без взрывного доигрывания пропущенных событий).
    if (this.nextBeatTime < now - GRID_STARVATION_EPSILON) {
      this.reanchorBeatGrid(config, now);
    }
    if (this.nextMelodyTime < now - GRID_STARVATION_EPSILON) {
      this.reanchorMelodyGrid(config, now);
    }
    if (this.nextChordTime < now - GRID_STARVATION_EPSILON) {
      this.reanchorChordGrid(config, now);
    }

    let guard = 0;
    while (this.nextBeatTime < now + ahead && guard++ < SCHEDULE_LOOP_GUARD_BEATS) {
      this.scheduleBassPulse(config, this.nextBeatTime, this.beatCounter);
      this.beatCounter++;
      this.nextBeatTime += this.beatDurationSec(config);
    }

    guard = 0;
    while (this.nextMelodyTime < now + ahead && guard++ < SCHEDULE_LOOP_GUARD_BEATS) {
      // Решение о ноте принимается в момент планирования — то же распределение,
      // что раньше, но огибающая стартует точно на сетке.
      if (this.masterGainNode && Math.random() <= config.melodyChance) {
        this.playMelodyNote(config, this.nextMelodyTime);
      }
      this.nextMelodyTime += this.melodyStepSec(config);
    }

    guard = 0;
    while (this.nextChordTime < now + ahead && guard++ < SCHEDULE_LOOP_GUARD_CHORDS) {
      this.advanceChordDegree(config);
      this.playPadChord(config, this.nextChordTime);
      this.nextChordTime += this.chordIntervalSec(config);
    }
  }

  /** Пульс баса на точной сетке: атака 0.1с → спад до 30% → релиз к концу бита. */
  private scheduleBassPulse(config: SceneMusicConfig, t: number, beatIndex: number): void {
    const bassGain = this.bassGain;
    if (!bassGain) return;

    // Пульс на 1-й и 3-й доле такта (как в прежнем setInterval-варианте)
    const beatInBar = beatIndex % 4;
    if (beatInBar !== 0 && beatInBar !== 2) return;

    const beatDur = this.beatDurationSec(config);
    const bassLevel = config.bassGain * this.musicVolume;
    try {
      bassGain.gain.setValueAtTime(0.001, t);
      bassGain.gain.linearRampToValueAtTime(bassLevel, t + 0.1);
      bassGain.gain.linearRampToValueAtTime(bassLevel * 0.3, t + beatDur / 2);
      bassGain.gain.linearRampToValueAtTime(0.001, t + beatDur);
    } catch {
      /* узел мог быть остановлен — пропуск пульса безопасен */
    }
  }

  /** Случайное блуждание по ступеням лада со смещением к I/IV/V (общее для всех сеток). */
  private advanceChordDegree(config: SceneMusicConfig): void {
    const numDegrees = config.scale.intervals.length;
    const commonDegrees = [0, 3, 4]; // I, IV, V в ступенях лада
    if (Math.random() < 0.4) {
      // 40% шанс прыжка на «общую» ступень
      this.currentChordDegree = pickRandom(commonDegrees) % numDegrees;
    } else {
      // Шаг на 1-2 ступени
      const step = Math.random() < 0.6 ? 1 : 2;
      this.currentChordDegree = (this.currentChordDegree + step) % numDegrees;
    }
  }

  /** Реанкоринг басовой сетки: fast-forward на целое число битов без доигрывания. */
  private reanchorBeatGrid(config: SceneMusicConfig, now: number): void {
    const beatDur = this.beatDurationSec(config);
    const missed = Math.max(1, Math.ceil((now - this.nextBeatTime) / beatDur));
    this.beatCounter += missed;
    this.nextBeatTime += missed * beatDur;
  }

  /** Реанкоринг мелодической сетки (без множителя интенсивности). */
  private reanchorMelodyGrid(config: SceneMusicConfig, now: number): void {
    const step = this.melodyStepSec(config);
    const missed = Math.max(1, Math.ceil((now - this.nextMelodyTime) / step));
    this.nextMelodyTime += missed * step;
  }

  /** Реанкоринг аккордовой сетки: пропущенные интервалы проходят тем же блужданием. */
  private reanchorChordGrid(config: SceneMusicConfig, now: number): void {
    const interval = this.chordIntervalSec(config);
    let missed = 0;
    while (this.nextChordTime < now - GRID_STARVATION_EPSILON && missed < SCHEDULE_LOOP_GUARD_CHORDS) {
      this.nextChordTime += interval;
      missed++;
    }
    for (let i = 0; i < missed; i++) {
      this.advanceChordDegree(config);
    }
  }

  /* ═══════════════════ BASS LAYER ═══════════════════ */

  /** Start the bass layer — root note pulses */
  private startBassLayer(config: SceneMusicConfig, startTime: number): void {
    const ctx = this.ctx;
    const dest = this.masterGainNode;
    if (!ctx || !dest) return;

    const now = startTime;

    // Bass oscillator — root note
    const rootFreq = midiToFreq(config.rootMidi);

    this.bassOsc = ctx.createOscillator();
    this.bassOsc.type = config.bassType;
    this.bassOsc.frequency.setValueAtTime(rootFreq, now);

    // Bass filter (lowpass to keep it sub-bass)
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 200;
    this.bassFilter.Q.value = 0.7;

    // Bass gain with pulse envelope
    this.bassGain = ctx.createGain();
    this.bassGain.gain.setValueAtTime(0, now);

    this.bassOsc.connect(this.bassFilter);
    this.bassFilter.connect(this.bassGain);
    this.bassGain.connect(dest);

    this.bassOsc.start(now);

    // Start bass pulse pattern
    // v4.8.4: пульсы ведёт lookahead-планировщик (startScheduler),
    // setInterval-вариант удалён — ритм больше не зависит от дрожания таймеров.
  }

  /* ═══════════════════ MELODY LAYER ═══════════════════ */

  /** Play a single melody note from the scale */
  private playMelodyNote(config: SceneMusicConfig, startTime?: number): void {
    const ctx = this.ctx;
    const dest = this.masterGainNode;
    if (!ctx || !dest) return;

    const myGeneration = this.sceneGeneration;
    // v4.8.4: startTime — точная сетка планировщика; фолбэк «сейчас» сохранён
    // для прямых вызовов (тесты), где горизонт планирования не задан.
    const now = typeof startTime === 'number' && Number.isFinite(startTime) ? startTime : ctx.currentTime;

    // Pick a random scale degree
    const degree = Math.floor(Math.random() * config.scale.intervals.length);
    const interval = config.scale.intervals[degree];

    // Octave range: C3 (48) to C5 (72) → pick random octave
    const octaveRange = [0, 12, 24]; // Root octave, +1, +2
    const octaveShift = pickRandom(octaveRange);
    const midiNote = config.rootMidi + interval + octaveShift;
    const freq = midiToFreq(midiNote);

    // Create oscillator
    const osc = ctx.createOscillator();
    osc.type = config.melodyType;
    osc.frequency.setValueAtTime(freq, now);
    // Gentle vibrato
    osc.detune.setValueAtTime((Math.random() - 0.5) * 8, now);

    // Melody envelope: slow attack, sustain, slow release
    const noteDuration = 1.5 + Math.random() * 2; // 1.5 - 3.5 seconds
    const melodyLevel = config.melodyGain * this.musicVolume;

    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(0.001, now);
    envGain.gain.linearRampToValueAtTime(melodyLevel, now + 0.3); // 300ms attack
    envGain.gain.setValueAtTime(melodyLevel, now + noteDuration - 0.8); // sustain
    envGain.gain.linearRampToValueAtTime(0.001, now + noteDuration); // 800ms release

    // Gentle filter for the melody
    const melodyFilter = ctx.createBiquadFilter();
    melodyFilter.type = 'lowpass';
    melodyFilter.frequency.value = 2000;
    melodyFilter.Q.value = 0.5;

    osc.connect(melodyFilter);
    melodyFilter.connect(envGain);
    envGain.connect(dest);

    osc.start(now);
    safeStop(osc, now + noteDuration + 0.1);

    // Clean up filter/gain after note ends.
    // v4.8.4: с lookahead нота может стартовать позже «сейчас» — отсчитываем
    // очистку от реального времени старта ноты, а не от момента планирования,
    // иначе узлы отключаются до того, как нота доиграет.
    const startDelaySec = Math.max(0, now - ctx.currentTime);
    setTimeout(() => {
      if (this.disposed || this.sceneGeneration !== myGeneration) {
        try { melodyFilter.disconnect(); } catch { /* ignore */ }
        try { envGain.disconnect(); } catch { /* ignore */ }
        return;
      }
      try { melodyFilter.disconnect(); } catch { /* ignore */ }
      try { envGain.disconnect(); } catch { /* ignore */ }
    }, (startDelaySec + noteDuration + 0.5) * 1000);
  }

  /* ═══════════════════ UTILITIES ═══════════════════ */

  /** Create an artificial reverb impulse response */
  private createReverbImpulse(ctx: AudioContext, decaySeconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.ceil(sampleRate * decaySeconds);
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        // Exponential decay with random noise, stereo variation
        const stereoVar = channel === 0 ? 1.0 : 0.95;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4 / decaySeconds) * stereoVar;
      }
    }

    return buffer;
  }

  /** Apply the current volume setting to the master gain */
  private applyVolume(rampSec = 0.45): void {
    if (!this.masterGainNode || !this.ctx) return;

    const duckMul = PRESENTATION_DUCK_GAIN[this.presentationDuckProfile] * this.cinematicTimelineDuckFactor;
    const effectiveGain = (this.currentConfig?.masterGain ?? 0.04) * this.musicVolume * duckMul;
    const now = this.ctx.currentTime;
    const safeRamp = Number.isFinite(rampSec) && rampSec > 0 ? rampSec : 0.45;
    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
    this.masterGainNode.gain.linearRampToValueAtTime(effectiveGain, now + safeRamp);
  }

  /** Clean up all audio nodes */
  private cleanupAllNodes(): void {
    this.cancelPendingPadRetirements();

    // Pad oscillators
    for (const node of this.padOscillators) {
      try { node.osc.stop(); } catch { /* already stopped */ }
      try { node.gain.disconnect(); } catch { /* ignore */ }
    }
    this.padOscillators = [];

    // Pad infrastructure
    try { this.padLfo?.stop(); } catch { /* already stopped */ }
    try { this.padLfoGain?.disconnect(); } catch { /* ignore */ }
    try { this.padLfo?.disconnect(); } catch { /* ignore */ }
    this.padLfo = null;
    this.padLfoGain = null;

    try { this.padGain?.disconnect(); } catch { /* ignore */ }
    this.padGain = null;

    try { this.padFilter?.disconnect(); } catch { /* ignore */ }
    this.padFilter = null;

    if (this.padConvolver) releaseConvolver(this.padConvolver);
    this.padConvolver = null;

    try { this.padConvolverGain?.disconnect(); } catch { /* ignore */ }
    this.padConvolverGain = null;

    try { this.padDryGain?.disconnect(); } catch { /* ignore */ }
    this.padDryGain = null;

    // Bass
    try { this.bassOsc?.stop(); } catch { /* already stopped */ }
    this.bassOsc = null;
    try { this.bassGain?.disconnect(); } catch { /* ignore */ }
    this.bassGain = null;
    try { this.bassFilter?.disconnect(); } catch { /* ignore */ }
    this.bassFilter = null;
  }
}

/** Singleton music engine instance */
export const musicEngine = new MusicEngine();
export default musicEngine;

subscribeMusicIntensityLayer((layer) => musicEngine.setIntensityLayer(layer));

export function disposeMusicEngine(): void {
  musicEngine.dispose();
}

export function reviveMusicEngine(): void {
  musicEngine.revive();
}

registerHmrDispose(disposeMusicEngine);
