/* ─── Volodka RPG – Ambient Sound Definitions ───
 *  Procedural ambient sound configurations for different scene types.
 *  Each sound type defines oscillator/noise parameters for the Web Audio API
 *  to generate scene-appropriate background ambience without audio files.
 *
 *  Part of the Ambient Sound System: data layer only (no playback logic).
 *  Playback is handled by AmbientSoundPlayer in SceneAudioController.
 */

import { SCENE_DEFINITIONS, type SceneId } from '@/config/sceneDefinitions';
import type {
  AmbientSoundType,
  SceneAmbienceConfig,
  SceneWeatherType,
} from '@/shared/types/ambientSound';

export type { AmbientSoundType, SceneAmbienceConfig, SceneWeatherType } from '@/shared/types/ambientSound';

/** Defines how to generate a single procedural ambient sound */
export interface AmbientSoundDef {
  type: AmbientSoundType;
  /** i18n key — display label */
  labelKey: string;
  /** i18n key — short atmosphere summary */
  descriptionKey: string;
  /** i18n key — accessibility subtitle for deaf/HoH players */
  accessibilityDescriptionKey: string;
  /** Russian fallback label (debug / until i18n layer) */
  label: string;
  /** Russian fallback description */
  description: string;
  /** Russian fallback accessibility subtitle */
  accessibilityDescription: string;
  baseFrequency: number;
  filterFreq: number;
  gain: number;
  oscillators: OscillatorType[];
  lfoRate: number;
  lfoDepth: number;
  /** When true, LFO / random events are skipped under reduced-motion accessibility */
  respectReducedMotion?: boolean;
  noise?: {
    filterType: BiquadFilterType;
    filterFreq: number;
    filterQ: number;
    gain: number;
    lfoFreq: number;
    lfoDepth: number;
  };
  harmonic?: {
    type: OscillatorType;
    freqMultiplier: number;
    gain: number;
  };
  randomSounds?: {
    type: OscillatorType;
    frequency: number;
    duration: number;
    gain: number;
    minInterval: number;
    maxInterval: number;
    frequencyRamp?: number;
  }[];
  spatial?: {
    position: [number, number, number];
    refDistance: number;
    maxDistance: number;
    rolloffFactor: number;
  };
}

/** @deprecated Legacy regex map — prefer SceneDefinition.ambience + SCENE_AMBIENCE_BY_ID */
export interface SceneAmbience {
  scenePattern: string;
  daySound: AmbientSoundType;
  nightSound: AmbientSoundType;
  transitionDuration: number;
}

export interface AmbienceResolveOptions {
  /** Story node override — takes priority over scene + weather */
  proceduralOverride?: AmbientSoundType | null;
  /** Active weather — may swap outdoor beds to rain/snow */
  weather?: SceneWeatherType;
}

export interface ResolvedSceneAmbience {
  sound: AmbientSoundType;
  transitionDuration: number;
  source: 'story' | 'weather' | 'scene';
}

const FILTER_FREQ_MIN = 20;
const FILTER_FREQ_MAX = 20_000;
const DEFAULT_TRANSITION_MS = 2000;

function ambientMeta(
  type: AmbientSoundType,
  label: string,
  description: string,
  accessibilityDescription: string,
): Pick<
  AmbientSoundDef,
  | 'label'
  | 'description'
  | 'accessibilityDescription'
  | 'labelKey'
  | 'descriptionKey'
  | 'accessibilityDescriptionKey'
> {
  return {
    label,
    description,
    accessibilityDescription,
    labelKey: `ambient.${type}.label`,
    descriptionKey: `ambient.${type}.description`,
    accessibilityDescriptionKey: `ambient.${type}.accessibility`,
  };
}

/* ─── Ambient Sound Definitions ─── */export const AMBIENT_SOUNDS: Record<AmbientSoundType, AmbientSoundDef> = {
  /* ─── Cafe: Warm ambient drone + clinking + chatter murmur ─── */
  cafe: {
    type: 'cafe',
    ...ambientMeta(
      'cafe',
      'Кафе',
      'Тёплый гул кафе, звон посуды, приглушённый разговор',
      'Слышен тёплый гул кафе, звон посуды и приглушённые разговоры',
    ),
    respectReducedMotion: true,    baseFrequency: 165,
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
    spatial: {
      position: [-2, 0, -1],
      refDistance: 1,
      maxDistance: 8,
      rolloffFactor: 1,
    },
  },
  /* ─── Office: Server hum + AC drone + keyboard clicks ─── */
  office: {
    type: 'office',
    ...ambientMeta(
      'office',
      'Офис',
      'Гул серверов, кондиционер, щелчки клавиатуры',
      'Слышен гул серверов и кондиционера, периодические щелчки клавиатуры',
    ),
    respectReducedMotion: true,    baseFrequency: 60,
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
    ...ambientMeta(
      'park',
      'Парк',
      'Шум ветра, пение птиц, плеск воды',
      'Слышен шум ветра в деревьях, пение птиц и плеск воды',
    ),
    respectReducedMotion: true,    baseFrequency: 90,
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
    ...ambientMeta(
      'library',
      'Библиотека',
      'Тишина, тиканье часов, шорох страниц',
      'Тихая атмосфера: тиканье часов и шорох перелистываемых страниц',
    ),
    respectReducedMotion: true,    baseFrequency: 40,
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
    ...ambientMeta(
      'street',
      'Улица',
      'Городской шум, сирены, проезжающие машины',
      'Слышен городской шум, далёкие сирены и проезжающие машины',
    ),
    respectReducedMotion: true,    baseFrequency: 80,
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
    ...ambientMeta(
      'home',
      'Дом',
      'Тёплый домашний гул, мягкие звуки быта',
      'Слышен тёплый домашний гул и мягкие бытовые звуки',
    ),
    respectReducedMotion: true,    baseFrequency: 100,
    filterFreq: 600,
    gain: 0.03,
    oscillators: ['sine', 'triangle'],
    lfoRate: 0.08,
    lfoDepth: 2,
    // D2 (S12-D): rain against the window — the opening narration explicitly
    // mentions "За окном моросит дождь". Same bandpass noise pattern as the
    // street rain bed (3000Hz center, 0.08Hz LFO swell) so the sonic texture
    // is consistent when the player eventually steps outside.
    noise: {
      filterType: 'bandpass',
      filterFreq: 3000,
      filterQ: 0.5,
      gain: 0.02,
      lfoFreq: 0.08,
      lfoDepth: 500,
    },
    // D2 (S12-D): fridge hum — 50Hz mains fundamental (was 200Hz triangle
    // warmth). The 100Hz 2nd harmonic is already present from the base
    // oscillators (baseFrequency 100), giving the classic 50+100Hz mains
    // pair. Total continuous gain: 0.03 (osc) + 0.015 (fridge) + 0.02 (rain)
    // = 0.065, well under 1.0.
    harmonic: {
      type: 'sine',
      freqMultiplier: 0.5, // 100 × 0.5 = 50Hz mains hum
      gain: 0.015,
    },
    randomSounds: [
      { type: 'sine', frequency: 1500, duration: 0.02, gain: 0.02, minInterval: 4, maxInterval: 10 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Factory: Industrial hum + dripping + metal creaks ─── */
  factory: {
    type: 'factory',
    ...ambientMeta(
      'factory',
      'Завод',
      'Индустриальный гул, капли, скрежет металла',
      'Слышен индустриальный гул, капли и скрежет металла',
    ),
    respectReducedMotion: true,    baseFrequency: 45,
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
    ...ambientMeta(
      'rooftop',
      'Крыша',
      'Ветер на высоте, далёкий город, скрип антенны',
      'Слышен сильный ветер на высоте, далёкий город и скрип антенны',
    ),
    respectReducedMotion: true,    baseFrequency: 70,
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
    ...ambientMeta(
      'corridor',
      'Коридор',
      'Гулкий коридор, жужжание ламп, далёкие шаги',
      'Слышен гулкий коридор, жужжание ламп и далёкие шаги',
    ),
    respectReducedMotion: true,    baseFrequency: 65,
    filterFreq: 300,
    gain: 0.035,
    oscillators: ['sawtooth', 'square'],
    lfoRate: 0.04,
    lfoDepth: 4,
    // D3 (S12-D): fluorescent buzz — 120Hz square wave (was 130Hz sine warmth).
    // 120Hz is the distinctive fluorescent-fixture buzz frequency; the 65Hz
    // sawtooth drone already covers the mains hum fundamental. freqMultiplier
    // 120/65 ≈ 1.8462 produces exactly 120Hz from the 65Hz base. Gain 0.008
    // keeps the buzz subtle — audible as a signature corridor texture without
    // drawing attention.
    harmonic: {
      type: 'square',
      freqMultiplier: 1.8462, // 65 × 1.8462 ≈ 120Hz fluorescent buzz
      gain: 0.008,
    },
    randomSounds: [
      { type: 'sine', frequency: 80, duration: 0.15, gain: 0.035, minInterval: 6, maxInterval: 14 },
      { type: 'sine', frequency: 1800, duration: 0.06, gain: 0.015, minInterval: 10, maxInterval: 20 },
      // D3 (S12-D): muffled voices through apartment walls — a communal
      // hallway at 6 AM has distant neighbors. Mid-range sawtooth wobble
      // (500→700Hz) approximates syllabic inflection; very low gain (0.01)
      // and 15-30s spacing keep it subliminal.
      { type: 'sawtooth', frequency: 500, duration: 1.2, gain: 0.01, minInterval: 15, maxInterval: 30, frequencyRamp: 700 },
    ] as AmbientSoundDef['randomSounds'],
  },

  /* ─── Combat: Ominous drone + electrical crackling + heartbeat ─── */
  combat: {
    type: 'combat',
    ...ambientMeta(
      'combat',
      'Бой',
      'Зловещий гул, электрические разряды, пульс',
      'Слышен зловещий пульсирующий гул, электрические разряды и учащённый пульс',
    ),
    respectReducedMotion: true,    baseFrequency: 100,
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
    ...ambientMeta(
      'rain',
      'Дождь',
      'Шум дождя, отдалённые раскаты грома',
      'Слышен шум дождя и отдалённые раскаты грома',
    ),
    respectReducedMotion: true,    baseFrequency: 55,
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
    ...ambientMeta(
      'snow',
      'Снег',
      'Завывание ветра, хруст снега, далёкие колокола',
      'Слышно завывание ветра, хруст снега и далёкие колокола',
    ),
    respectReducedMotion: true,    baseFrequency: 50,
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

  /* ─── Pier: Water lap + gulls + wooden creaks ─── */
  pier: {
    type: 'pier',
    ...ambientMeta(
      'pier',
      'Пирс',
      'Плеск воды, крики чаек, скрип дерева',
      'Слышен плеск воды у пирса, крики чаек и скрип деревянных настилов',
    ),
    respectReducedMotion: true,
    baseFrequency: 85,
    filterFreq: 500,
    gain: 0.03,
    oscillators: ['sine'],
    lfoRate: 0.08,
    lfoDepth: 4,
    noise: {
      filterType: 'bandpass',
      filterFreq: 600,
      filterQ: 0.3,
      gain: 0.02,
      lfoFreq: 0.12,
      lfoDepth: 300,
    },
    randomSounds: [
      { type: 'sine', frequency: 200, duration: 0.3, gain: 0.015, minInterval: 2, maxInterval: 6 },
      { type: 'sine', frequency: 1200, duration: 0.1, gain: 0.012, minInterval: 4, maxInterval: 10 },
    ],
  },

  /* ─── Basement: Zarya-M 50 Hz relic hum (lore) ─── */
  basement: {
    type: 'basement',
    ...ambientMeta(
      'basement',
      'Подвал «Заря-М»',
      'Низкий гул 50 Гц от реликвии, гул серверов',
      'Слышен низкий гул 50 герц от «Заря-М» и гул подвальных серверов',
    ),
    respectReducedMotion: true,
    baseFrequency: 50,
    filterFreq: 180,
    gain: 0.045,
    oscillators: ['sine', 'triangle'],
    lfoRate: 0.04,
    lfoDepth: 2,
    noise: {
      filterType: 'lowpass',
      filterFreq: 220,
      filterQ: 0.6,
      gain: 0.018,
      lfoFreq: 0.03,
      lfoDepth: 40,
    },
    harmonic: {
      type: 'sine',
      freqMultiplier: 2.0,
      gain: 0.02,
    },
    randomSounds: [
      { type: 'sine', frequency: 120, duration: 0.2, gain: 0.02, minInterval: 8, maxInterval: 20 },
    ] as AmbientSoundDef['randomSounds'],
  },
};
/* ─── Scene → Ambient Sound Mapping (O(1) via SceneDefinition.ambience) ─── */

const SCENE_AMBIENCE_BY_ID = new Map<SceneId, SceneAmbienceConfig>(
  Object.entries(SCENE_DEFINITIONS)
    .filter((entry): entry is [SceneId, (typeof SCENE_DEFINITIONS)[SceneId]] => {
      return Boolean(entry[1].ambience);
    })
    .map(([sceneId, def]) => [sceneId, def.ambience!]),
);

const OUTDOOR_SCENES = new Set<SceneId>([
  'street_night',
  'street_winter',
  'park_day',
  'rooftop_edge',
  'river_pier',
  'chk_forest_zorge',
  'chk_campfire_night',
  'pier_evening',
  'factory_roof',
  'city_square',
  'procedural_aaa',
]);

/** Weather-driven ambient overrides for outdoor exploration scenes */
const WEATHER_AMBIENT_OVERRIDE: Partial<Record<SceneWeatherType, AmbientSoundType>> = {
  rain: 'rain',
  storm: 'rain',
  snow: 'snow',
};

function isDaytime(timeOfDay: number): boolean {
  return timeOfDay >= 6 && timeOfDay < 20;
}

function baseAmbienceForScene(sceneId: SceneId, timeOfDay: number): {
  sound: AmbientSoundType;
  transitionDuration: number;
} | null {
  const config = SCENE_AMBIENCE_BY_ID.get(sceneId);
  if (!config) return null;
  const sound = isDaytime(timeOfDay) ? config.daySound : config.nightSound;
  return {
    sound,
    transitionDuration: config.transitionDuration ?? DEFAULT_TRANSITION_MS,
  };
}

/** Apply weather layer on top of scene bed (outdoor scenes only). */
export function applyWeatherAmbienceOverride(
  sceneId: SceneId,
  baseSound: AmbientSoundType,
  weather?: SceneWeatherType,
): { sound: AmbientSoundType; weatherApplied: boolean } {
  if (!weather || weather === 'clear' || weather === 'fog') {
    return { sound: baseSound, weatherApplied: false };
  }
  if (!OUTDOOR_SCENES.has(sceneId)) {
    return { sound: baseSound, weatherApplied: false };
  }
  const override = WEATHER_AMBIENT_OVERRIDE[weather];
  if (!override || override === baseSound) {
    return { sound: baseSound, weatherApplied: false };
  }
  return { sound: override, weatherApplied: true };
}

/**
 * Resolve procedural ambient for a scene with optional story + weather overrides.
 */
export function resolveAmbienceForScene(
  sceneId: SceneId,
  timeOfDay: number,
  options: AmbienceResolveOptions = {},
): ResolvedSceneAmbience | null {
  if (options.proceduralOverride) {
    const base = baseAmbienceForScene(sceneId, timeOfDay);
    return {
      sound: options.proceduralOverride,
      transitionDuration: base?.transitionDuration ?? DEFAULT_TRANSITION_MS,
      source: 'story',
    };
  }

  const base = baseAmbienceForScene(sceneId, timeOfDay);
  if (!base) return null;

  const weatherResult = applyWeatherAmbienceOverride(sceneId, base.sound, options.weather);
  if (weatherResult.weatherApplied) {
    return {
      sound: weatherResult.sound,
      transitionDuration: base.transitionDuration,
      source: 'weather',
    };
  }

  return {
    sound: base.sound,
    transitionDuration: base.transitionDuration,
    source: 'scene',
  };
}

/** @deprecated Use resolveAmbienceForScene — kept for callers without weather/story context */
export function getAmbienceForScene(
  sceneId: string,
  timeOfDay: number,
  options?: AmbienceResolveOptions,
): AmbientSoundType | null {
  const resolved = resolveAmbienceForScene(sceneId as SceneId, timeOfDay, options);
  return resolved?.sound ?? null;
}

export function getAmbientTransitionDuration(
  sceneId: string,
  timeOfDay = 12,
  options?: AmbienceResolveOptions,
): number {
  const resolved = resolveAmbienceForScene(sceneId as SceneId, timeOfDay, options);
  return resolved?.transitionDuration ?? DEFAULT_TRANSITION_MS;
}

export function getAmbientSoundDef(type: AmbientSoundType): AmbientSoundDef {
  return AMBIENT_SOUNDS[type];
}

export function getAmbienceAccessibilityText(type: AmbientSoundType | null): string | null {
  if (!type) return null;
  return AMBIENT_SOUNDS[type].accessibilityDescription;
}

/** Playback-safe copy — strips vestibular layers when reduced motion is active */
export function getPlaybackAmbientDef(
  type: AmbientSoundType,
  reducedMotion: boolean,
): AmbientSoundDef {
  const def = AMBIENT_SOUNDS[type];
  if (!reducedMotion || def.respectReducedMotion === false) {
    return def;
  }

  const safeNoise = def.noise
    ? { ...def.noise, lfoFreq: 0, lfoDepth: 0 }
    : undefined;

  return {
    ...def,
    lfoRate: 0,
    lfoDepth: 0,
    noise: safeNoise,
    randomSounds: undefined,
  };
}

export interface AmbientValidationIssue {
  path: string;
  message: string;
}

/** Validate oscillator parameters at content load time */
export function validateAmbientSoundDefs(): AmbientValidationIssue[] {
  const issues: AmbientValidationIssue[] = [];

  for (const def of Object.values(AMBIENT_SOUNDS)) {
    const prefix = `ambient.${def.type}`;

    if (def.gain < 0 || def.gain > 1) {
      issues.push({ path: prefix, message: `gain must be 0–1 (got ${def.gain})` });
    }
    if (def.filterFreq < FILTER_FREQ_MIN || def.filterFreq > FILTER_FREQ_MAX) {
      issues.push({
        path: prefix,
        message: `filterFreq out of range ${FILTER_FREQ_MIN}–${FILTER_FREQ_MAX}`,
      });
    }
    if (def.lfoRate < 0) {
      issues.push({ path: prefix, message: `lfoRate must be >= 0 (got ${def.lfoRate})` });
    }
    if (def.noise) {
      if (def.noise.gain < 0 || def.noise.gain > 1) {
        issues.push({ path: `${prefix}.noise`, message: 'noise gain must be 0–1' });
      }
      if (def.noise.filterFreq < FILTER_FREQ_MIN || def.noise.filterFreq > FILTER_FREQ_MAX) {
        issues.push({ path: `${prefix}.noise`, message: 'noise filterFreq out of range' });
      }
    }
    for (const rs of def.randomSounds ?? []) {
      if (rs.gain < 0 || rs.gain > 1) {
        issues.push({ path: `${prefix}.randomSounds`, message: 'random sound gain must be 0–1' });
      }
      if (rs.minInterval > rs.maxInterval) {
        issues.push({ path: `${prefix}.randomSounds`, message: 'minInterval > maxInterval' });
      }
    }
  }

  return issues;
}

/** Ensure every registered scene has an ambience profile */
export function validateSceneAmbienceCoverage(): AmbientValidationIssue[] {
  const issues: AmbientValidationIssue[] = [];
  for (const sceneId of Object.keys(SCENE_DEFINITIONS) as SceneId[]) {
    if (!SCENE_AMBIENCE_BY_ID.has(sceneId)) {
      issues.push({
        path: `scene.${sceneId}`,
        message: 'missing SceneDefinition.ambience — no procedural ambient profile',
      });
    }
  }
  return issues;
}

if (import.meta.env?.DEV) {
  const devIssues = [...validateAmbientSoundDefs(), ...validateSceneAmbienceCoverage()];
  if (devIssues.length > 0) {
    console.warn('[ambientSounds] validation issues:', devIssues);
  }
}