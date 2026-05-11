/* ─── Volodka RPG – Ambient Sound Definitions ───
 *  Procedural ambient sound configurations for different scene types.
 *  Each sound type defines oscillator/noise parameters for the Web Audio API
 *  to generate scene-appropriate background ambience without audio files.
 *
 *  Part of the Ambient Sound System: data layer only (no playback logic).
 *  Playback is handled by AmbientSoundPlayer in useAudioOrchestrator.
 */

/* ─── Type Definitions ─── */

/** Available ambient sound types, each mapped to a procedural sound recipe */
export type AmbientSoundType =
  | 'cafe'
  | 'office'
  | 'park'
  | 'library'
  | 'street'
  | 'home'
  | 'factory'
  | 'rooftop'
  | 'corridor'
  | 'combat'
  | 'rain'
  | 'snow';

/** Defines how to generate a single procedural ambient sound */
export interface AmbientSoundDef {
  /** Which ambient type this definition is for */
  type: AmbientSoundType;
  /** Russian display label (for debug UI) */
  label: string;
  /** Russian description of the sound atmosphere */
  description: string;
  /** Base frequency for the primary oscillator drone (Hz) */
  baseFrequency: number;
  /** Low-pass filter cutoff frequency (Hz) — shapes the overall tonal warmth */
  filterFreq: number;
  /** Master gain level (0–1) — should be quiet, typically 0.02–0.08 */
  gain: number;
  /** Oscillator types to layer for the drone sound */
  oscillators: OscillatorType[];
  /** LFO rate in Hz — controls slow modulation of the filter or gain */
  lfoRate: number;
  /** LFO depth in Hz — how much the LFO modulates the target parameter */
  lfoDepth: number;
  /** Optional noise layer configuration */
  noise?: {
    /** Filter type for the noise layer */
    filterType: BiquadFilterType;
    /** Filter cutoff/center frequency (Hz) */
    filterFreq: number;
    /** Filter Q (resonance) */
    filterQ: number;
    /** Noise gain level (0–1) */
    gain: number;
    /** LFO rate for noise filter modulation (0 = no LFO) */
    lfoFreq: number;
    /** LFO depth for noise filter modulation (Hz) */
    lfoDepth: number;
  };
  /** Optional secondary harmonic oscillator */
  harmonic?: {
    /** Oscillator type for the harmonic */
    type: OscillatorType;
    /** Frequency multiplier relative to baseFrequency (e.g., 2.0 = octave) */
    freqMultiplier: number;
    /** Harmonic gain (0–1), typically much lower than main gain */
    gain: number;
  };
  /** Optional random sound events that play at irregular intervals */
  randomSounds?: {
    /** Oscillator type for the random sound */
    type: OscillatorType;
    /** Base frequency (Hz) */
    frequency: number;
    /** Duration in seconds */
    duration: number;
    /** Gain level */
    gain: number;
    /** Minimum interval between plays (seconds) */
    minInterval: number;
    /** Maximum interval between plays (seconds) */
    maxInterval: number;
    /** Optional frequency ramp target for sweeps */
    frequencyRamp?: number;
  }[];
}

/** Maps a scene pattern to day/night ambient sounds */
export interface SceneAmbience {
  /** Regex pattern for matching scene IDs (e.g., "cafe" matches cafe_evening) */
  scenePattern: string;
  /** Ambient sound to play during daytime (6:00–20:00) */
  daySound: AmbientSoundType;
  /** Ambient sound to play during nighttime (20:00–6:00) */
  nightSound: AmbientSoundType;
  /** Crossfade duration in ms when transitioning between day/night or scenes */
  transitionDuration: number;
}

/* ─── Ambient Sound Definitions ─── */

/**
 * Complete set of procedural ambient sound definitions.
 * Each type defines oscillator layers, noise layers, and optional random events
 * to create immersive scene-appropriate background sounds.
 */
export const AMBIENT_SOUNDS: Record<AmbientSoundType, AmbientSoundDef> = {
  /* ─── Cafe: Warm ambient drone + clinking + chatter murmur ─── */
  cafe: {
    type: 'cafe',
    label: 'Кафе',
    description: 'Тёплый гул кафе, звон посуды, приглушённый разговор',
    baseFrequency: 165,
    filterFreq: 600,
    gain: 0.04,
    oscillators: ['sine', 'triangle'],
    lfoRate: 0.15,
    lfoDepth: 5,
    noise: {
      filterType: 'bandpass',
      filterFreq: 800,
      filterQ: 0.4,
      gain: 0.015,
      lfoFreq: 0.1,
      lfoDepth: 200,
    },
    harmonic: {
      type: 'triangle',
      freqMultiplier: 2.0,
      gain: 0.012,
    },
    randomSounds: [
      { type: 'sine', frequency: 2500, duration: 0.015, gain: 0.035, minInterval: 2, maxInterval: 5 },
      { type: 'sawtooth', frequency: 200, duration: 0.5, gain: 0.01, minInterval: 3, maxInterval: 8 },
    ],
  },

  /* ─── Office: Server hum + AC drone + keyboard clicks ─── */
  office: {
    type: 'office',
    label: 'Офис',
    description: 'Гул серверов, кондиционер, щелчки клавиатуры',
    baseFrequency: 60,
    filterFreq: 300,
    gain: 0.035,
    oscillators: ['sawtooth', 'sine'],
    lfoRate: 0.08,
    lfoDepth: 2,
    noise: {
      filterType: 'lowpass',
      filterFreq: 400,
      filterQ: 0.3,
      gain: 0.012,
      lfoFreq: 0.05,
      lfoDepth: 50,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.015,
    },
    randomSounds: [
      { type: 'square', frequency: 1800, duration: 0.02, gain: 0.025, minInterval: 0.5, maxInterval: 3 },
      { type: 'sine', frequency: 440, duration: 0.8, gain: 0.02, minInterval: 20, maxInterval: 50, frequencyRamp: 520 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Park: Wind through trees + birds + distant water ─── */
  park: {
    type: 'park',
    label: 'Парк',
    description: 'Шум ветра, пение птиц, плеск воды',
    baseFrequency: 90,
    filterFreq: 800,
    gain: 0.03,
    oscillators: ['sine'],
    lfoRate: 0.06,
    lfoDepth: 4,
    noise: {
      filterType: 'bandpass',
      filterFreq: 600,
      filterQ: 0.4,
      gain: 0.02,
      lfoFreq: 0.15,
      lfoDepth: 300,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.01,
    },
    randomSounds: [
      { type: 'sine', frequency: 3200, duration: 0.06, gain: 0.02, minInterval: 2, maxInterval: 6, frequencyRamp: 3800 },
      { type: 'sine', frequency: 4500, duration: 0.04, gain: 0.015, minInterval: 3, maxInterval: 8, frequencyRamp: 5200 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Library: Deep silence + clock ticking + page turns ─── */
  library: {
    type: 'library',
    label: 'Библиотека',
    description: 'Тишина, тиканье часов, шорох страниц',
    baseFrequency: 40,
    filterFreq: 200,
    gain: 0.01,
    oscillators: ['sine'],
    lfoRate: 0.02,
    lfoDepth: 1,
    randomSounds: [
      { type: 'square', frequency: 800, duration: 0.01, gain: 0.015, minInterval: 0.45, maxInterval: 0.55 },
      { type: 'sine', frequency: 300, duration: 0.12, gain: 0.018, minInterval: 6, maxInterval: 15 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Street: Urban drone + sirens + car pass-by ─── */
  street: {
    type: 'street',
    label: 'Улица',
    description: 'Городской шум, сирены, проезжающие машины',
    baseFrequency: 80,
    filterFreq: 350,
    gain: 0.035,
    oscillators: ['sawtooth'],
    lfoRate: 0.05,
    lfoDepth: 8,
    noise: {
      filterType: 'bandpass',
      filterFreq: 3000,
      filterQ: 0.5,
      gain: 0.02,
      lfoFreq: 0.08,
      lfoDepth: 500,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.5,
      gain: 0.015,
    },
    randomSounds: [
      { type: 'sine', frequency: 400, duration: 2.5, gain: 0.015, minInterval: 12, maxInterval: 30, frequencyRamp: 800 },
      { type: 'sawtooth', frequency: 150, duration: 3.0, gain: 0.012, minInterval: 10, maxInterval: 25, frequencyRamp: 120 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Home: Warm drone + soft clicks + domestic sounds ─── */
  home: {
    type: 'home',
    label: 'Дом',
    description: 'Тёплый домашний гул, мягкие звуки быта',
    baseFrequency: 100,
    filterFreq: 600,
    gain: 0.03,
    oscillators: ['sine', 'triangle'],
    lfoRate: 0.08,
    lfoDepth: 2,
    harmonic: {
      type: 'triangle',
      freqMultiplier: 2.0,
      gain: 0.01,
    },
    randomSounds: [
      { type: 'sine', frequency: 1500, duration: 0.02, gain: 0.02, minInterval: 4, maxInterval: 10 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Factory: Industrial hum + dripping + metal creaks ─── */
  factory: {
    type: 'factory',
    label: 'Завод',
    description: 'Индустриальный гул, капли, скрежет металла',
    baseFrequency: 45,
    filterFreq: 250,
    gain: 0.04,
    oscillators: ['sawtooth', 'square'],
    lfoRate: 0.07,
    lfoDepth: 5,
    noise: {
      filterType: 'highpass',
      filterFreq: 3000,
      filterQ: 0.5,
      gain: 0.018,
      lfoFreq: 0.06,
      lfoDepth: 600,
    },
    harmonic: {
      type: 'square',
      freqMultiplier: 2.0,
      gain: 0.01,
    },
    randomSounds: [
      { type: 'sine', frequency: 2200, duration: 0.04, gain: 0.025, minInterval: 2, maxInterval: 7 },
      { type: 'sawtooth', frequency: 150, duration: 0.5, gain: 0.018, minInterval: 5, maxInterval: 14, frequencyRamp: 300 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Rooftop: Strong wind + city drone below + antenna creak ─── */
  rooftop: {
    type: 'rooftop',
    label: 'Крыша',
    description: 'Ветер на высоте, далёкий город, скрип антенны',
    baseFrequency: 70,
    filterFreq: 350,
    gain: 0.03,
    oscillators: ['sawtooth'],
    lfoRate: 0.12,
    lfoDepth: 6,
    noise: {
      filterType: 'bandpass',
      filterFreq: 500,
      filterQ: 0.3,
      gain: 0.035,
      lfoFreq: 0.18,
      lfoDepth: 400,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.012,
    },
    randomSounds: [
      { type: 'sawtooth', frequency: 200, duration: 0.4, gain: 0.018, minInterval: 6, maxInterval: 15, frequencyRamp: 350 },
      { type: 'sine', frequency: 500, duration: 0.2, gain: 0.015, minInterval: 8, maxInterval: 20, frequencyRamp: 400 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Corridor: Echoing hallway hum + fluorescent buzz + distant door slams ─── */
  corridor: {
    type: 'corridor',
    label: 'Коридор',
    description: 'Гулкий коридор, жужжание ламп, далёкие шаги',
    baseFrequency: 65,
    filterFreq: 300,
    gain: 0.035,
    oscillators: ['sawtooth', 'square'],
    lfoRate: 0.04,
    lfoDepth: 4,
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.012,
    },
    randomSounds: [
      { type: 'sine', frequency: 80, duration: 0.15, gain: 0.035, minInterval: 6, maxInterval: 14 },
      { type: 'sine', frequency: 1800, duration: 0.06, gain: 0.015, minInterval: 10, maxInterval: 20 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Combat: Ominous drone + electrical crackling + heartbeat ─── */
  combat: {
    type: 'combat',
    label: 'Бой',
    description: 'Зловещий гул, электрические разряды, пульс',
    baseFrequency: 100,
    filterFreq: 500,
    gain: 0.05,
    oscillators: ['sawtooth', 'square'],
    lfoRate: 0.2,
    lfoDepth: 10,
    noise: {
      filterType: 'bandpass',
      filterFreq: 2500,
      filterQ: 3.0,
      gain: 0.015,
      lfoFreq: 0.4,
      lfoDepth: 800,
    },
    harmonic: {
      type: 'square',
      freqMultiplier: 2.0,
      gain: 0.02,
    },
    randomSounds: [
      { type: 'sawtooth', frequency: 800, duration: 0.05, gain: 0.035, minInterval: 1, maxInterval: 4 },
      { type: 'square', frequency: 600, duration: 0.08, gain: 0.025, minInterval: 2, maxInterval: 6 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Rain: Rain patter on surfaces + distant thunder ─── */
  rain: {
    type: 'rain',
    label: 'Дождь',
    description: 'Шум дождя, отдалённые раскаты грома',
    baseFrequency: 55,
    filterFreq: 300,
    gain: 0.03,
    oscillators: ['sine'],
    lfoRate: 0.03,
    lfoDepth: 3,
    noise: {
      filterType: 'bandpass',
      filterFreq: 3000,
      filterQ: 0.5,
      gain: 0.03,
      lfoFreq: 0.08,
      lfoDepth: 500,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.01,
    },
    randomSounds: [
      { type: 'sine', frequency: 60, duration: 0.8, gain: 0.02, minInterval: 15, maxInterval: 40 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Snow: Wind howl + snow crunch + distant bells ─── */
  snow: {
    type: 'snow',
    label: 'Снег',
    description: 'Завывание ветра, хруст снега, далёкие колокола',
    baseFrequency: 50,
    filterFreq: 280,
    gain: 0.03,
    oscillators: ['sawtooth', 'triangle'],
    lfoRate: 0.06,
    lfoDepth: 6,
    noise: {
      filterType: 'bandpass',
      filterFreq: 400,
      filterQ: 0.3,
      gain: 0.03,
      lfoFreq: 0.15,
      lfoDepth: 500,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.012,
    },
    randomSounds: [
      { type: 'sine', frequency: 100, duration: 0.1, gain: 0.025, minInterval: 1, maxInterval: 4 },
      { type: 'sine', frequency: 700, duration: 0.6, gain: 0.012, minInterval: 10, maxInterval: 25, frequencyRamp: 680 },
    ] as AmbientSoundDef['randomSounds'],
  },
};

/* ─── Scene → Ambient Sound Mapping ─── */

/**
 * Maps scene ID patterns to appropriate day/night ambient sounds.
 * Patterns are matched using RegExp against the scene ID string.
 * First matching pattern wins, so order matters (more specific first).
 */
export const SCENE_AMBIENCE_MAP: SceneAmbience[] = [
  // Indoor / cozy
  {
    scenePattern: '^volodka_room$',
    daySound: 'home',
    nightSound: 'home',
    transitionDuration: 2000,
  },
  {
    scenePattern: '^home_evening$',
    daySound: 'home',
    nightSound: 'home',
    transitionDuration: 2000,
  },
  {
    scenePattern: '^zarema_albert_room$',
    daySound: 'home',
    nightSound: 'home',
    transitionDuration: 2000,
  },

  // Corridor
  {
    scenePattern: '^volodka_corridor$',
    daySound: 'corridor',
    nightSound: 'corridor',
    transitionDuration: 2000,
  },

  // Cafe
  {
    scenePattern: '^cafe_evening$',
    daySound: 'cafe',
    nightSound: 'cafe',
    transitionDuration: 2000,
  },

  // Office
  {
    scenePattern: '^office_day$',
    daySound: 'office',
    nightSound: 'corridor', // Office at night = empty corridor feel
    transitionDuration: 2000,
  },

  // Park
  {
    scenePattern: '^park_day$',
    daySound: 'park',
    nightSound: 'park', // Park at night is quieter but same type
    transitionDuration: 2000,
  },

  // Library
  {
    scenePattern: '^library_day$',
    daySound: 'library',
    nightSound: 'library',
    transitionDuration: 2000,
  },

  // Street scenes
  {
    scenePattern: '^street_night$',
    daySound: 'street',
    nightSound: 'street',
    transitionDuration: 2000,
  },
  {
    scenePattern: '^street_winter$',
    daySound: 'snow',
    nightSound: 'snow',
    transitionDuration: 2000,
  },

  // Rooftop
  {
    scenePattern: '^rooftop_edge$',
    daySound: 'rooftop',
    nightSound: 'rooftop',
    transitionDuration: 2000,
  },

  // Factory
  {
    scenePattern: '^abandoned_factory$',
    daySound: 'factory',
    nightSound: 'factory',
    transitionDuration: 2000,
  },

  // Battle
  {
    scenePattern: '^battle$',
    daySound: 'combat',
    nightSound: 'combat',
    transitionDuration: 1500, // Faster transition into combat
  },

  // Dream
  {
    scenePattern: '^sleep_dream$',
    daySound: 'rain', // Rain works well for dream atmosphere
    nightSound: 'rain',
    transitionDuration: 3000, // Slow transition for dreams
  },
];

/* ─── Helper Function ─── */

/**
 * Determine the appropriate ambient sound type for a given scene and time of day.
 *
 * @param sceneId — The current scene ID (e.g., 'cafe_evening', 'street_night')
 * @param timeOfDay — Current in-game hour (0–24)
 * @returns The AmbientSoundType to play, or null if no mapping exists
 */
export function getAmbienceForScene(sceneId: string, timeOfDay: number): AmbientSoundType | null {
  // Find the first matching scene pattern
  for (const mapping of SCENE_AMBIENCE_MAP) {
    const regex = new RegExp(mapping.scenePattern);
    if (regex.test(sceneId)) {
      // Daytime: 6:00 to 20:00, Nighttime: 20:00 to 6:00
      const isDay = timeOfDay >= 6 && timeOfDay < 20;
      return isDay ? mapping.daySound : mapping.nightSound;
    }
  }
  return null;
}

/**
 * Get the transition duration for a scene's ambient sound.
 *
 * @param sceneId — The current scene ID
 * @returns Crossfade duration in ms, or 2000 as default
 */
export function getAmbientTransitionDuration(sceneId: string): number {
  for (const mapping of SCENE_AMBIENCE_MAP) {
    const regex = new RegExp(mapping.scenePattern);
    if (regex.test(sceneId)) {
      return mapping.transitionDuration;
    }
  }
  return 2000;
}
