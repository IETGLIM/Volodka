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
import { getSharedAudioContext, safeResume } from './SharedAudioContext';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import { releaseConvolver } from './audio/AudioEngineCore';
import { tryCreateConvolver } from './audio/audioCapabilities';

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

/* ──────────────────── Scene Music Configs ──────────────────── */

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

/**
 * Scene → music config mapping.
 * All 14 scenes are covered across 6 mood categories.
 */
const SCENE_MUSIC_CONFIGS: Record<SceneId, SceneMusicConfig> = {
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
  private presentationDucked = false;
  private disposed = false;
  private sceneGeneration = 0;

  // Current state
  private currentScene: string | null = null;
  private currentConfig: SceneMusicConfig | null = null;

  // Pad layer state
  private padOscillators: Array<{
    osc: OscillatorNode;
    gain: GainNode;
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
  private melodyTimer: ReturnType<typeof setInterval> | null = null;

  // Timers
  private chordTimer: ReturnType<typeof setTimeout> | null = null;
  private bassTimer: ReturnType<typeof setInterval> | null = null;

  // Blur/focus handlers for audio context suspend/resume
  private _onBlur: (() => void) | null = null;
  private _onFocus: (() => void) | null = null;

  constructor() {
    // P1-3.5 FIX: No longer creating a separate AudioContext.
    // SharedAudioContext module manages the singleton context + blur/focus.
    // Individual blur/focus handlers removed — managed centrally.
  }

  /** Lazily get the shared AudioContext (P1-3.5 FIX) */
  private initContext(): void {
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
  setPresentationDucked(ducked: boolean): void {
    this.presentationDucked = ducked;
    this.applyVolume();
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

    // Same scene — no change needed
    if (this.currentScene === sceneId) return;

    const config = SCENE_MUSIC_CONFIGS[sceneId as SceneId];
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

    // Small delay to let fade-out complete, then start new
    const startDelay = this.currentScene !== null ? 1100 : 0;

    setTimeout(() => {
      // Guard: if another scene change happened since we started, abort
      if (this.disposed || this.sceneGeneration !== myGeneration) return;
      this.startMusicForScene(sceneId, config);
    }, startDelay);
  }

  /**
   * Stop all music with optional fade duration.
   * @param fadeDuration — seconds to fade out (default 2)
   */
  stopMusic(fadeDuration = 2): void {
    this.sceneGeneration++; // Invalidate any pending callbacks

    if (this.chordTimer) {
      clearTimeout(this.chordTimer as unknown as number);
      this.chordTimer = null;
    }
    if (this.bassTimer) {
      clearInterval(this.bassTimer as unknown as number);
      this.bassTimer = null;
    }
    if (this.melodyTimer) {
      clearInterval(this.melodyTimer as unknown as number);
      this.melodyTimer = null;
    }

    const ctx = this.ctx;
    if (ctx && this.masterGainNode && this.currentScene !== null) {
      const now = ctx.currentTime;
      // Fade out master gain
      this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
      this.masterGainNode.gain.linearRampToValueAtTime(0, now + fadeDuration);

      // Schedule cleanup after fade
      setTimeout(() => {
        this.cleanupAllNodes();
      }, (fadeDuration + 0.5) * 1000);
    } else {
      this.cleanupAllNodes();
    }

    this.currentScene = null;
    this.currentConfig = null;
    this.currentChordDegree = 0;
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
    const effectiveGain = config.masterGain * this.musicVolume * (this.presentationDucked ? 0.55 : 1);
    dest.gain.setValueAtTime(0, now);
    dest.gain.linearRampToValueAtTime(effectiveGain, now + 2);

    // ── Start pad layer ──
    this.playPadChord(config, now);

    // ── Start bass layer ──
    this.startBassLayer(config, now);

    // ── Start melody layer ──
    this.startMelodyLayer(config);

    // ── Schedule chord changes ──
    this.scheduleChordChange(config);

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
      this.padOscillators.push({ osc, gain: voiceGain });

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
      this.padOscillators.push({ osc: chorusOsc, gain: chorusGain });
    }
  }

  /** Fade out and stop a batch of pad voices — each call owns its voice list (no shared prev slot). */
  private retirePadVoices(
    voices: Array<{ osc: OscillatorNode; gain: GainNode }>,
    startTime: number,
    durationSec: number,
  ): void {
    if (voices.length === 0) return;

    for (const voice of voices) {
      try {
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, startTime);
        voice.gain.gain.linearRampToValueAtTime(0.001, startTime + durationSec);
      } catch {
        // node may already be stopping
      }
    }

    const timer = setTimeout(() => {
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

  /** Schedule the next chord change */
  private scheduleChordChange(config: SceneMusicConfig): void {
    if (this.chordTimer) {
      clearTimeout(this.chordTimer as unknown as number);
    }

    const myGeneration = this.sceneGeneration;

    this.chordTimer = setTimeout(() => {
      if (this.disposed || !this.currentConfig || this.currentScene === null) return;
      if (this.sceneGeneration !== myGeneration) return; // Stale callback

      // Advance chord degree (random walk through scale, with bias toward I, IV, V)
      const numDegrees = config.scale.intervals.length;
      const commonDegrees = [0, 3, 4]; // I, IV, V in scale degrees
      if (Math.random() < 0.4) {
        // 40% chance to jump to a common degree
        this.currentChordDegree = pickRandom(commonDegrees) % numDegrees;
      } else {
        // Step by 1-2 degrees
        const step = Math.random() < 0.6 ? 1 : 2;
        this.currentChordDegree = (this.currentChordDegree + step) % numDegrees;
      }

      const ctx = this.ctx;
      if (ctx) {
        this.playPadChord(config, ctx.currentTime);
      }

      // Schedule next
      this.scheduleChordChange(config);
    }, config.chordChangeInterval * 1000) as unknown as ReturnType<typeof setTimeout>;
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
    this.startBassPulse(config);
  }

  /** Pulse the bass gain on the beat */
  private startBassPulse(config: SceneMusicConfig): void {
    if (this.bassTimer) {
      clearInterval(this.bassTimer as unknown as number);
    }

    const beatMs = (60 / config.tempo) * 1000; // ms per beat
    const beatCount = { value: 0 };

    this.bassTimer = setInterval(() => {
      if (this.disposed || !this.bassGain || !this.ctx) return;

      const now = this.ctx.currentTime;
      beatCount.value++;

      // Play bass on beats 1 and 3 of a 4-beat bar (half-note pulse)
      const beatInBar = beatCount.value % 4;
      if (beatInBar === 0 || beatInBar === 2) {
        // Pulse: quick attack, slow release
        const bassLevel = config.bassGain * this.musicVolume;
        this.bassGain.gain.setValueAtTime(0.001, now);
        this.bassGain.gain.linearRampToValueAtTime(bassLevel, now + 0.1);
        this.bassGain.gain.linearRampToValueAtTime(bassLevel * 0.3, now + beatMs / 2000);
        this.bassGain.gain.linearRampToValueAtTime(0.001, now + beatMs / 1000);
      }
    }, beatMs) as unknown as ReturnType<typeof setInterval>;
  }

  /* ═══════════════════ MELODY LAYER ═══════════════════ */

  /** Start the melody layer — sparse random notes from the scale */
  private startMelodyLayer(config: SceneMusicConfig): void {
    if (this.melodyTimer) {
      clearInterval(this.melodyTimer as unknown as number);
    }

    const beatMs = (60 / config.tempo) * 1000;

    this.melodyTimer = setInterval(() => {
      if (this.disposed || !this.ctx || !this.masterGainNode) return;

      // Only play melody note based on chance
      if (Math.random() > config.melodyChance) return;

      this.playMelodyNote(config);
    }, beatMs) as unknown as ReturnType<typeof setInterval>;
  }

  /** Play a single melody note from the scale */
  private playMelodyNote(config: SceneMusicConfig): void {
    const ctx = this.ctx;
    const dest = this.masterGainNode;
    if (!ctx || !dest) return;

    const myGeneration = this.sceneGeneration;
    const now = ctx.currentTime;

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

    // Clean up filter/gain after note ends
    setTimeout(() => {
      if (this.sceneGeneration !== myGeneration) return;
      try { melodyFilter.disconnect(); } catch { /* ignore */ }
      try { envGain.disconnect(); } catch { /* ignore */ }
    }, (noteDuration + 0.5) * 1000);
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
  private applyVolume(): void {
    if (!this.masterGainNode || !this.ctx) return;

    const duckMul = this.presentationDucked ? 0.55 : 1;
    const effectiveGain = (this.currentConfig?.masterGain ?? 0.04) * this.musicVolume * duckMul;
    const now = this.ctx.currentTime;
    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
    this.masterGainNode.gain.linearRampToValueAtTime(effectiveGain, now + 0.3);
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

export function disposeMusicEngine(): void {
  musicEngine.dispose();
}

export function reviveMusicEngine(): void {
  musicEngine.revive();
}

registerHmrDispose(disposeMusicEngine);
