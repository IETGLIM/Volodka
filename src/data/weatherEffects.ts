/* ─── Volodka RPG – Weather gameplay effects ─── */
/* Defines how each weather type modifies gameplay: energy, stress,
 * visibility, movement, combat, and skill bonuses. */

/* ─── Weather Effect Definition ─── */

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'storm';

export interface WeatherEffect {
  weatherType: WeatherType;
  // Gameplay modifiers
  /** Energy regeneration rate multiplier (1.0 = normal, 0.5 = half) */
  energyRegenRate: number;
  /** Stress gain rate multiplier (1.0 = normal, 1.5 = 50% more stress) */
  stressRate: number;
  /** Visibility range as percentage (100 = full, 50 = half) */
  visibilityRange: number;
  /** Movement speed multiplier (1.0 = normal, 0.7 = slow) */
  movementSpeed: number;
  /** Flat defense bonus/penalty in combat */
  combatDefenseBonus: number;
  /** Flat attack bonus/penalty in combat */
  combatAttackBonus: number;
  /** Skill-specific bonuses (skill name → bonus value) */
  skillBonus: Partial<Record<string, number>>;
  /** In-game description of the weather effect */
  description: string;
  /** Lucide icon name for UI display */
  icon: string;
  /** Accent color for UI theming (Tailwind-compatible) */
  color: string;
}

/* ─── Weather Effect Definitions ─── */

/** Clear weather — baseline, no modifiers */
export const WEATHER_EFFECT_CLEAR: WeatherEffect = {
  weatherType: 'clear',
  energyRegenRate: 1.0,
  stressRate: 1.0,
  visibilityRange: 100,
  movementSpeed: 1.0,
  combatDefenseBonus: 0,
  combatAttackBonus: 0,
  skillBonus: {},
  description: 'Ясная погода. Идеальные условия для работы и прогулок.',
  icon: 'Sun',
  color: '#f0c040',
};

/** Rain — reduced energy regen, +empathy, reduced visibility */
export const WEATHER_EFFECT_RAIN: WeatherEffect = {
  weatherType: 'rain',
  energyRegenRate: 0.85,
  stressRate: 1.15,
  visibilityRange: 70,
  movementSpeed: 0.9,
  combatDefenseBonus: -1,
  combatAttackBonus: 0,
  skillBonus: {
    empathy: 1,    // Rain heightens emotional sensitivity
    writing: 1,    // Melancholy inspires poetry
  },
  description: 'Дождь. Мир звучит тише, но чувства обостряются. Эмпатия и письмо растут, но энергия убывает.',
  icon: 'CloudRain',
  color: '#5588bb',
};

/** Snow — slow movement, +intuition, reduced visibility */
export const WEATHER_EFFECT_SNOW: WeatherEffect = {
  weatherType: 'snow',
  energyRegenRate: 0.75,
  stressRate: 0.9,
  visibilityRange: 55,
  movementSpeed: 0.7,
  combatDefenseBonus: 1,
  combatAttackBonus: -1,
  skillBonus: {
    intuition: 1,  // Snow silences the noise, sharpening inner sight
    coding: 1,     // Staying indoors means more focus on code
  },
  description: 'Снегопад. Город замедляется, но тишина обостряет интуицию. Код пишется лучше в тепле.',
  icon: 'Snowflake',
  color: '#c8d8f0',
};

/** Fog — heavily reduced visibility, +intuition, +persuasion (mystery) */
export const WEATHER_EFFECT_FOG: WeatherEffect = {
  weatherType: 'fog',
  energyRegenRate: 0.9,
  stressRate: 1.2,
  visibilityRange: 40,
  movementSpeed: 0.8,
  combatDefenseBonus: -2,
  combatAttackBonus: -2,
  skillBonus: {
    intuition: 1,     // Fog sharpens instincts when sight fails
    persuasion: 1,    // Mystery makes words more persuasive
  },
  description: 'Туман. Видимость почти нулевая, но интуиция и убеждение усиливаются. Бой опасен.',
  icon: 'CloudFog',
  color: '#a0a8b8',
};

/** Storm — heavy penalties to combat and movement, +coding indoors */
export const WEATHER_EFFECT_STORM: WeatherEffect = {
  weatherType: 'storm',
  energyRegenRate: 0.5,
  stressRate: 1.5,
  visibilityRange: 30,
  movementSpeed: 0.6,
  combatDefenseBonus: -3,
  combatAttackBonus: -3,
  skillBonus: {
    coding: 2,     // Storm forces you indoors — perfect for deep coding
    logic: 1,      // Adrenaline sharpens analytical thinking
  },
  description: 'Гроза. Энергия убывает быстро, стресс растёт. Но код и логика прорастают в буре. На улице лучше не сражаться.',
  icon: 'CloudLightning',
  color: '#cc4444',
};

/* ─── Weather Effect Map ─── */

/** All weather effects keyed by type */
export const WEATHER_EFFECTS: Record<WeatherType, WeatherEffect> = {
  clear: WEATHER_EFFECT_CLEAR,
  rain: WEATHER_EFFECT_RAIN,
  snow: WEATHER_EFFECT_SNOW,
  fog: WEATHER_EFFECT_FOG,
  storm: WEATHER_EFFECT_STORM,
};

/* ─── Helper: Determine weather type from conditions ─── */

/** Outdoor scenes where weather has full impact */
const OUTDOOR_SCENES = new Set([
  'street_night',
  'street_winter',
  'park_day',
  'rooftop_edge',
  'chk_forest_zorge',
  // Динамическая погода (режиссёр, engine/world/weatherDirector.ts): варианты
  // дождливых сцен и сухие уличные сцены, где rainIntensity теперь меняется в
  // рантайме. Без outdoor-классификации determineWeatherType считал бы их
  // «помещением» и дёргал бы 'rain'↔'clear' на каждом колебании синусоиды
  // (порог 0.3 в indoor-ветке) — карточки погоды сыпались бы каждые 60–100 с.
  'river_pier',
  'pier_evening',
  'factory_roof',
  'city_square',
  'procedural_aaa',
]);

/** Indoor scenes with large windows — reduced weather impact */
const SEMI_OUTDOOR_SCENES = new Set([
  'cafe_evening',
  'library_day',
]);

/**
 * Determine the active weather type based on current conditions.
 *
 * Logic:
 *  - If weather is disabled → clear
 *  - If snow is active → snow
 *  - If rain intensity > 0.75 and outdoor → storm
 *  - If rain intensity > 0 → rain
 *  - If outdoor and fog conditions met → fog
 *  - Otherwise → clear
 *
 * @param weatherEnabled — whether the weather system is active
 * @param rainIntensity — current rain intensity (0–1)
 * @param snowActive — whether snow is currently falling
 * @param currentSceneId — the player's current scene
 * @param timeOfDay — current hour (0–24), used for fog probability
 */
export function determineWeatherType(
  weatherEnabled: boolean,
  rainIntensity: number,
  snowActive: boolean,
  currentSceneId: string,
  timeOfDay: number,
): WeatherType {
  if (!weatherEnabled) return 'clear';

  const isOutdoor = OUTDOOR_SCENES.has(currentSceneId);
  const isSemiOutdoor = SEMI_OUTDOOR_SCENES.has(currentSceneId);
  const isIndoor = !isOutdoor && !isSemiOutdoor;

  // Indoor scenes: weather effects are muted but not absent
  if (isIndoor) {
    // Indoor scenes still feel storm effects (energy drain, stress)
    if (snowActive) return 'snow';
    if (rainIntensity > 0.75) return 'storm'; // Storm rattles even indoors
    if (rainIntensity > 0.3) return 'rain';   // Can hear rain on the roof
    return 'clear';
  }

  // Snow takes priority
  if (snowActive) return 'snow';

  // Storm = heavy rain outdoors
  if (rainIntensity > 0.75 && isOutdoor) return 'storm';

  // Regular rain
  if (rainIntensity > 0) return 'rain';

  // Fog: more likely at dawn (4–7) and dusk (18–21) in outdoor/semi-outdoor
  if ((isOutdoor || isSemiOutdoor) && isFogTime(timeOfDay)) {
    return 'fog';
  }

  return 'clear';
}

/**
 * Check if the current time of day is fog-prone.
 * Fog is most common at dawn and dusk.
 */
function isFogTime(hour: number): boolean {
  // Dawn fog: 4:00 – 7:30
  if (hour >= 4 && hour < 7.5) return true;
  // Dusk fog: 18:00 – 21:00
  if (hour >= 18 && hour < 21) return true;
  return false;
}

/**
 * Get the weather effect for a given weather type.
 * Falls back to clear if the type is unknown.
 */
export function getWeatherEffect(type: WeatherType): WeatherEffect {
  return WEATHER_EFFECTS[type] ?? WEATHER_EFFECT_CLEAR;
}
