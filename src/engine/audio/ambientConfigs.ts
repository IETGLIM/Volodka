/* ─── Volodka RPG – Scene ambient sound configurations (14 scenes) ─── */

import type { SceneId } from '@/shared/types/game';
import type { AmbientConfig, AmbientMusicConfig, ReverbPresetConfig } from './types';

/* ─── Ambient Drone Configs ─── */

const AMBIENT_CONFIGS: Partial<Record<SceneId, AmbientConfig>> = {
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

  solnysh_room: {
    layers: [
      {
        type: 'sine',
        frequency: 130,
        gain: 0.02,
        lfoFreq: 0.1,
        lfoDepth: 3,
        harmonic: { type: 'triangle', frequency: 260, gain: 0.008 },
        randomInterval: 0,
      },
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
      { filterType: 'bandpass', filterFreq: 800, filterQ: 0.4, gain: 0.01, lfoFreq: 0.1, lfoDepth: 200 },
    ],
    randomSounds: [
      { type: 'sawtooth', frequency: 200, duration: 0.5, gain: 0.012, minInterval: 3, maxInterval: 8, useNoise: true, noiseFilterFreq: 800 },
      { type: 'sine', frequency: 2800, duration: 0.8, gain: 0.015, minInterval: 20, maxInterval: 40, frequencyRamp: 3200 },
      { type: 'sawtooth', frequency: 500, duration: 0.3, gain: 0.012, minInterval: 8, maxInterval: 18, useNoise: true, noiseFilterFreq: 3500 },
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

  /* ─── 15. chk_forest_zorge — Night forest, campfire crackle, distant metal ─── */
  chk_forest_zorge: {
    layers: [
      {
        type: 'sine',
        frequency: 70,
        gain: 0.025,
        lfoFreq: 0.08,
        lfoDepth: 5,
        harmonic: { type: 'sine', frequency: 140, gain: 0.012 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      { filterType: 'bandpass', filterFreq: 500, filterQ: 0.5, gain: 0.025, lfoFreq: 0.12, lfoDepth: 250 },
    ],
    randomSounds: [
      { type: 'sawtooth', frequency: 120, duration: 0.15, gain: 0.02, minInterval: 0.4, maxInterval: 1.2, useNoise: true, noiseFilterFreq: 900 },
      { type: 'sine', frequency: 80, duration: 0.6, gain: 0.015, minInterval: 8, maxInterval: 20, frequencyRamp: 65 },
    ],
  },

  /* ─── 16. factory_basement — Server hum, drips, «Заря-М» pulse ─── */
  factory_basement: {
    layers: [
      {
        type: 'sawtooth',
        frequency: 55,
        gain: 0.03,
        lfoFreq: 0.05,
        lfoDepth: 3,
        harmonic: { type: 'sine', frequency: 110, gain: 0.015 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      { filterType: 'lowpass', filterFreq: 300, filterQ: 0.8, gain: 0.02, lfoFreq: 0.07, lfoDepth: 120 },
    ],
    randomSounds: [
      // Water drips off the pipes
      { type: 'sine', frequency: 1200, duration: 0.06, gain: 0.018, minInterval: 2.5, maxInterval: 8, frequencyRamp: 700 },
      // Deep machine pulse of «Заря-М»
      { type: 'sine', frequency: 48, duration: 1.2, gain: 0.02, minInterval: 6, maxInterval: 14, frequencyRamp: 42 },
    ],
  },

  /* ─── 17. river_pier — Water lapping, fire crackle, night birds ─── */
  river_pier: {
    layers: [
      {
        type: 'sine',
        frequency: 65,
        gain: 0.02,
        lfoFreq: 0.1,
        lfoDepth: 6,
        harmonic: { type: 'sine', frequency: 130, gain: 0.01 },
        randomInterval: 0,
      },
    ],
    noiseLayers: [
      // Slow water wash against the pilings
      { filterType: 'lowpass', filterFreq: 420, filterQ: 0.6, gain: 0.03, lfoFreq: 0.18, lfoDepth: 200 },
    ],
    randomSounds: [
      // Fire crackle in the barrel
      { type: 'sawtooth', frequency: 130, duration: 0.12, gain: 0.018, minInterval: 0.5, maxInterval: 1.4, useNoise: true, noiseFilterFreq: 1000 },
      // Distant night bird over the water
      { type: 'sine', frequency: 880, duration: 0.4, gain: 0.008, minInterval: 12, maxInterval: 30, frequencyRamp: 660 },
    ],
  },
};

/* ─── Ambient Music Configurations ─── */

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
  solnysh_room: {
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

const REVERB_PRESETS: Record<string, ReverbPresetConfig> = {
  small_room: { decay: 0.5, wetMix: 0.15 },
  corridor: { decay: 1.0, wetMix: 0.3 },
  nature: { decay: 1.4, wetMix: 0.28 },
  large_space: { decay: 2.0, wetMix: 0.45 },
  dream: { decay: 3.0, wetMix: 0.6 },
};

/** Map each scene to its default reverb preset */
const SCENE_REVERB_PRESETS: Partial<Record<SceneId, string>> = {
  volodka_room: 'small_room',
  zarema_albert_room: 'small_room',
  solnysh_room: 'small_room',
  home_evening: 'small_room',
  volodka_corridor: 'corridor',
  office_day: 'corridor',
  cafe_evening: 'corridor',
  library_day: 'corridor',
  street_night: 'large_space',
  park_day: 'large_space',
  chk_forest_zorge: 'nature',
  street_winter: 'large_space',
  rooftop_edge: 'large_space',
  abandoned_factory: 'corridor',
  river_pier: 'large_space',
  battle: 'corridor',
  sleep_dream: 'dream',
};

export {
  AMBIENT_CONFIGS,
  AMBIENT_MUSIC_CONFIGS,
  REVERB_PRESETS,
  SCENE_REVERB_PRESETS,
};
