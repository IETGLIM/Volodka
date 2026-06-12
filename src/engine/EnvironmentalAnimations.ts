/* ─── Volodka RPG – Environmental Animation Definitions ─── */
/* Data-driven system that defines per-scene animated environmental effects */

import type { SceneId } from '@/shared/types/game';

// ─── Types ───

export type EnvAnimationType =
  | 'light_flicker'
  | 'monitor_scan'
  | 'curtain_sway'
  | 'steam_rise'
  | 'neon_pulse'
  | 'drip'
  | 'fan_spin'
  | 'neon_flicker'
  | 'crt_monitor'
  | 'lamp_sway'
  | 'radiator_steam';

export interface EnvAnimation {
  id: string;
  type: EnvAnimationType;
  position: [number, number, number];
  config: Record<string, number>;
}

// ─── Scene Animation Definitions ───

const SCENE_ENV_ANIMATIONS: Record<SceneId, EnvAnimation[]> = {
  // ─── Volodka's Room: monitor scan + desk lamp flicker + CRT + lamp sway ───
  volodka_room: [
    {
      id: 'monitor_flicker',
      type: 'monitor_scan',
      position: [0, 1.12, -2.68],
      config: { speed: 2, intensity: 0.3 },
    },
    {
      id: 'desk_lamp_flicker',
      type: 'light_flicker',
      position: [0.3, 1.5, -2.3],
      config: { minIntensity: 0.3, maxIntensity: 0.6, flickerRate: 0.02 },
    },
    {
      id: 'monitor_glow_pulse',
      type: 'neon_pulse',
      position: [0, 1.12, -2.68],
      config: { colorR: 0, colorG: 1, colorB: 0.27, speed: 1.2, minEmissive: 0.3, maxEmissive: 0.9 },
    },
    {
      id: 'crt_monitor_effect',
      type: 'crt_monitor',
      position: [0, 1.12, -2.68],
      config: { baseIntensity: 4.0, pulseAmp: 0.1, pulseSpeed: 60, flickerChance: 0.005 },
    },
    {
      id: 'hanging_lamp_sway',
      type: 'lamp_sway',
      position: [0, 2.8, -1.0],
      config: { amplitude: 0.02, frequency: 0.5 },
    },
  ],

  // ─── Corridor: fluorescent flicker + drip ───
  volodka_corridor: [
    {
      id: 'fluorescent_flicker',
      type: 'light_flicker',
      position: [0, 2.8, 0],
      config: { minIntensity: 0.15, maxIntensity: 0.5, flickerRate: 0.04 },
    },
    {
      id: 'pipe_drip',
      type: 'drip',
      position: [-1.92, 2.72, 2.0],
      config: { interval: 4.0, splashDuration: 0.6 },
    },
    {
      id: 'corridor_neon_hum',
      type: 'neon_pulse',
      position: [0, 2.5, -3.0],
      config: { colorR: 0.6, colorG: 0.6, colorB: 1.0, speed: 3.0, minEmissive: 0.1, maxEmissive: 0.4 },
    },
  ],

  // ─── Home Evening: kitchen steam + TV glow pulse ───
  home_evening: [
    {
      id: 'kitchen_steam',
      type: 'steam_rise',
      position: [0, 1.2, -3.5],
      config: { rate: 0.8, spread: 0.3 },
    },
    {
      id: 'tv_glow',
      type: 'neon_pulse',
      position: [2.0, 1.5, -3.0],
      config: { colorR: 0.3, colorG: 0.5, colorB: 0.8, speed: 0.5, minEmissive: 0.1, maxEmissive: 0.5 },
    },
    {
      id: 'stove_light',
      type: 'light_flicker',
      position: [-0.5, 1.5, -3.5],
      config: { minIntensity: 0.4, maxIntensity: 0.7, flickerRate: 0.01 },
    },
  ],

  // ─── Street Night: neon pulses + drip from awning + neon flicker ───
  street_night: [
    {
      id: 'bar_neon_1',
      type: 'neon_pulse',
      position: [-4, 3.0, -6],
      config: { colorR: 0.27, colorG: 0.53, colorB: 1.0, speed: 1.5, minEmissive: 0.4, maxEmissive: 1.0 },
    },
    {
      id: 'bar_neon_2',
      type: 'neon_pulse',
      position: [3, 3.0, -6],
      config: { colorR: 1.0, colorG: 0.2, colorB: 0.4, speed: 2.0, minEmissive: 0.3, maxEmissive: 0.8 },
    },
    {
      id: 'awning_drip',
      type: 'drip',
      position: [0, 3.0, 2.0],
      config: { interval: 2.5, splashDuration: 0.4 },
    },
    {
      id: 'sign_neon',
      type: 'neon_pulse',
      position: [0, 4.0, -8],
      config: { colorR: 0.0, colorG: 1.0, colorB: 0.6, speed: 1.0, minEmissive: 0.5, maxEmissive: 1.0 },
    },
    {
      id: 'cafe_neon_flicker',
      type: 'neon_flicker',
      position: [8, 4.0, -8],
      config: { colorR: 0.1, colorG: 0.29, colorB: 1.0, onProbability: 0.95, flickerSpeed: 8, onEmissive: 1.5, offEmissive: 0.05 },
    },
    {
      id: 'red_bar_flicker',
      type: 'neon_flicker',
      position: [-12, 8.0, -12],
      config: { colorR: 1.0, colorG: 0.1, colorB: 0.23, onProbability: 0.92, flickerSpeed: 10, onEmissive: 1.2, offEmissive: 0.03 },
    },
  ],

  // ─── Street Winter: wind sway + snow gusts ───
  street_winter: [
    {
      id: 'sign_sway',
      type: 'curtain_sway',
      position: [0, 3.5, -6],
      config: { amplitude: 0.08, frequency: 0.6, axis: 2 }, // axis: 2 = Z-axis rotation
    },
    {
      id: 'lamp_flicker_winter',
      type: 'light_flicker',
      position: [2, 4.0, 0],
      config: { minIntensity: 0.2, maxIntensity: 0.5, flickerRate: 0.03 },
    },
    {
      id: 'awning_sway',
      type: 'curtain_sway',
      position: [-3, 2.5, 3],
      config: { amplitude: 0.12, frequency: 0.4, axis: 0 }, // axis: 0 = X-axis rotation
    },
  ],

  // ─── Cafe Evening: bar neon pulse + kitchen steam + neon flicker ───
  cafe_evening: [
    {
      id: 'bar_neon_pulse',
      type: 'neon_pulse',
      position: [-3, 2.5, -4],
      config: { colorR: 0.27, colorG: 0.53, colorB: 1.0, speed: 1.5, minEmissive: 0.3, maxEmissive: 0.9 },
    },
    {
      id: 'kitchen_steam_cafe',
      type: 'steam_rise',
      position: [0, 1.2, -3.5],
      config: { rate: 0.5, spread: 0.2 },
    },
    {
      id: 'candle_flicker',
      type: 'light_flicker',
      position: [2, 1.0, 1],
      config: { minIntensity: 0.15, maxIntensity: 0.35, flickerRate: 0.05 },
    },
    {
      id: 'cafe_bar_neon_flicker',
      type: 'neon_flicker',
      position: [-4.85, 2.3, -1.0],
      config: { colorR: 1.0, colorG: 0.27, colorB: 0.0, onProbability: 0.96, flickerSpeed: 6, onEmissive: 3.0, offEmissive: 0.1 },
    },
    {
      id: 'coffee_machine_steam',
      type: 'radiator_steam',
      position: [-0.5, 1.35, -3.9],
      config: { rate: 1.0, spread: 0.1, riseSpeed: 0.5, maxPuffs: 8, puffLife: 3.0 },
    },
    {
      id: 'kitchen_warm_air',
      type: 'radiator_steam',
      position: [-0.5, 1.0, -4.5],
      config: { rate: 0.3, spread: 0.4, riseSpeed: 0.3, maxPuffs: 5, puffLife: 4.0 },
    },
  ],

  // ─── Office Day: fluorescent flicker + server fan spin ───
  office_day: [
    {
      id: 'fluorescent_flicker_office',
      type: 'light_flicker',
      position: [0, 3.5, 0],
      config: { minIntensity: 0.3, maxIntensity: 0.6, flickerRate: 0.015 },
    },
    {
      id: 'server_fan',
      type: 'fan_spin',
      position: [5, 3.0, -5],
      config: { speed: 4.0 },
    },
    {
      id: 'second_fluorescent',
      type: 'light_flicker',
      position: [-3, 3.5, 2],
      config: { minIntensity: 0.25, maxIntensity: 0.55, flickerRate: 0.02 },
    },
  ],

  // ─── Park Day: wind sway (trees) + leaf particles ───
  park_day: [
    {
      id: 'tree_sway_1',
      type: 'curtain_sway',
      position: [5, 4.0, -8],
      config: { amplitude: 0.06, frequency: 0.3, axis: 2 },
    },
    {
      id: 'tree_sway_2',
      type: 'curtain_sway',
      position: [-8, 5.0, 3],
      config: { amplitude: 0.08, frequency: 0.25, axis: 2 },
    },
    {
      id: 'lamp_glow',
      type: 'light_flicker',
      position: [0, 3.0, 0],
      config: { minIntensity: 0.1, maxIntensity: 0.3, flickerRate: 0.005 },
    },
  ],

  // ─── Library Day: light flicker + dust particles ───
  library_day: [
    {
      id: 'reading_lamp',
      type: 'light_flicker',
      position: [0, 2.0, -4],
      config: { minIntensity: 0.4, maxIntensity: 0.7, flickerRate: 0.008 },
    },
    {
      id: 'curtain_sway_library',
      type: 'curtain_sway',
      position: [6, 2.5, 0],
      config: { amplitude: 0.05, frequency: 0.2, axis: 0 },
    },
    {
      id: 'steam_rise_library',
      type: 'steam_rise',
      position: [3, 1.0, -5],
      config: { rate: 0.15, spread: 0.1 },
    },
  ],

  // ─── Battle: red alarm pulse + electric spark ───
  battle: [
    {
      id: 'alarm_pulse',
      type: 'neon_pulse',
      position: [0, 3.5, 0],
      config: { colorR: 1.0, colorG: 0.0, colorB: 0.0, speed: 2.0, minEmissive: 0.3, maxEmissive: 1.0 },
    },
    {
      id: 'broken_light',
      type: 'light_flicker',
      position: [2, 3.0, -2],
      config: { minIntensity: 0.0, maxIntensity: 0.8, flickerRate: 0.1 },
    },
    {
      id: 'vent_fan',
      type: 'fan_spin',
      position: [0, 3.5, 0],
      config: { speed: 6.0 },
    },
  ],

  // ─── Sleep Dream: ethereal glow pulse + floating particles ───
  sleep_dream: [
    {
      id: 'ethereal_glow',
      type: 'neon_pulse',
      position: [0, 5.0, 0],
      config: { colorR: 0.4, colorG: 0.2, colorB: 0.8, speed: 0.3, minEmissive: 0.1, maxEmissive: 0.6 },
    },
    {
      id: 'dream_steam',
      type: 'steam_rise',
      position: [0, 0, 0],
      config: { rate: 0.3, spread: 0.5 },
    },
    {
      id: 'dream_curtain',
      type: 'curtain_sway',
      position: [0, 3.0, -5],
      config: { amplitude: 0.15, frequency: 0.15, axis: 2 },
    },
  ],

  // ─── Rooftop Edge: wind sway (antenna) + city light flicker ───
  rooftop_edge: [
    {
      id: 'antenna_sway',
      type: 'curtain_sway',
      position: [0, 5.0, -3],
      config: { amplitude: 0.1, frequency: 0.5, axis: 0 },
    },
    {
      id: 'city_light_flicker',
      type: 'light_flicker',
      position: [0, 2.0, -6],
      config: { minIntensity: 0.2, maxIntensity: 0.5, flickerRate: 0.01 },
    },
    {
      id: 'neon_sign_roof',
      type: 'neon_pulse',
      position: [-3, 3.5, -4],
      config: { colorR: 1.0, colorG: 0.6, colorB: 0.0, speed: 1.0, minEmissive: 0.2, maxEmissive: 0.7 },
    },
  ],

  // ─── Abandoned Factory: industrial fan + drip + spark ───
  abandoned_factory: [
    {
      id: 'industrial_fan',
      type: 'fan_spin',
      position: [0, 5.0, 0],
      config: { speed: 3.0 },
    },
    {
      id: 'factory_drip',
      type: 'drip',
      position: [3, 5.0, 2],
      config: { interval: 3.0, splashDuration: 0.5 },
    },
    {
      id: 'sparking_light',
      type: 'light_flicker',
      position: [-4, 4.0, -3],
      config: { minIntensity: 0.0, maxIntensity: 0.6, flickerRate: 0.08 },
    },
    {
      id: 'factory_neon',
      type: 'neon_pulse',
      position: [0, 3.0, -8],
      config: { colorR: 0.8, colorG: 0.4, colorB: 0.0, speed: 0.8, minEmissive: 0.1, maxEmissive: 0.4 },
    },
  ],

  // ─── Zarema & Albert's Room: warm lamp flicker + curtain sway ───
  zarema_albert_room: [
    {
      id: 'warm_lamp',
      type: 'light_flicker',
      position: [0, 2.5, 0],
      config: { minIntensity: 0.4, maxIntensity: 0.7, flickerRate: 0.008 },
    },
    {
      id: 'curtain_sway_room',
      type: 'curtain_sway',
      position: [3, 2.0, 0],
      config: { amplitude: 0.04, frequency: 0.3, axis: 0 },
    },
    {
      id: 'tealight_flicker',
      type: 'light_flicker',
      position: [-1, 1.0, -2],
      config: { minIntensity: 0.1, maxIntensity: 0.25, flickerRate: 0.06 },
    },
  ],

  chk_forest_zorge: [
    {
      id: 'campfire_flicker',
      type: 'light_flicker',
      position: [0, 1.2, 0],
      config: { minIntensity: 0.5, maxIntensity: 1.2, flickerRate: 0.12 },
    },
    {
      id: 'forest_sway',
      type: 'curtain_sway',
      position: [-8, 4, -6],
      config: { amplitude: 0.07, frequency: 0.22, axis: 2 },
    },
  ],

  factory_basement: [
    {
      id: 'zarya_core_pulse',
      type: 'light_flicker',
      position: [0, 2.2, -5],
      config: { minIntensity: 1.8, maxIntensity: 3.0, flickerRate: 0.05 },
    },
    {
      id: 'basement_warning_left',
      type: 'light_flicker',
      position: [-4, 2.8, 2],
      config: { minIntensity: 0.2, maxIntensity: 1.0, flickerRate: 0.3 },
    },
  ],

  river_pier: [
    {
      id: 'barrel_fire_flicker',
      type: 'light_flicker',
      position: [0, 1.4, -2],
      config: { minIntensity: 1.8, maxIntensity: 3.2, flickerRate: 0.14 },
    },
    {
      id: 'string_lights_sway',
      type: 'curtain_sway',
      position: [0, 2.6, -4],
      config: { amplitude: 0.05, frequency: 0.3, axis: 0 },
    },
  ],
};

// ─── Public API ───

/** Get all environmental animations for a scene */
export function getSceneEnvAnimations(sceneId: SceneId): EnvAnimation[] {
  return SCENE_ENV_ANIMATIONS[sceneId] ?? [];
}

/** Get a specific animation by ID */
export function getEnvAnimationById(id: string): EnvAnimation | undefined {
  for (const animations of Object.values(SCENE_ENV_ANIMATIONS)) {
    const found = animations.find((a) => a.id === id);
    if (found) return found;
  }
  return undefined;
}

/** Get all unique animation types used across all scenes */
export function getAllAnimationTypes(): EnvAnimationType[] {
  const types = new Set<EnvAnimationType>();
  for (const animations of Object.values(SCENE_ENV_ANIMATIONS)) {
    for (const anim of animations) {
      types.add(anim.type);
    }
  }
  return Array.from(types);
}
