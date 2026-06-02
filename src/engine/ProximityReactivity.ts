/* ─── Volodka RPG – Proximity Reactive Environment System ───
 *  Tracks how the world reacts to the player's presence.
 *  Each ProximityEffect defines a reactive object in the world that
 *  changes its behavior when the player gets close.
 */

import type { SceneId } from '@/shared/types/game';

export interface ProximityEffect {
  /** Unique ID */
  id: string;
  /** Which scene this effect belongs to */
  sceneId: SceneId;
  /** World position of the reactive object */
  position: [number, number, number];
  /** Radius of effect (meters) */
  radius: number;
  /** Type of reaction */
  type: 'light_glow' | 'sound_trigger' | 'visual_disturb' | 'npc_attention';
  /** Configuration for the effect */
  config: Record<string, number | string>;
}

export const PROXIMITY_EFFECTS: ProximityEffect[] = [
  /* ─────────────── VOLODKA ROOM ─────────────── */
  // Monitor screen brightens when player approaches
  {
    id: 'room_monitor_glow',
    sceneId: 'volodka_room',
    position: [0, 1.2, -2.8],
    radius: 3,
    type: 'light_glow',
    config: { minIntensity: 0.3, maxIntensity: 1.0, speed: 2, color: '#00ff44', distance: 5 },
  },
  // Desk lamp warms up near player
  {
    id: 'room_desk_lamp',
    sceneId: 'volodka_room',
    position: [0.5, 1.0, -2.5],
    radius: 2.5,
    type: 'light_glow',
    config: { minIntensity: 0.1, maxIntensity: 0.6, speed: 3, color: '#ffaa44', distance: 4 },
  },

  /* ─────────────── STREET NIGHT ─────────────── */
  // Neon signs flicker more when near
  {
    id: 'street_neon_flicker',
    sceneId: 'street_night',
    position: [-4, 3, -8],
    radius: 5,
    type: 'visual_disturb',
    config: { intensity: 0.5, speed: 4 },
  },
  // Street lamp hum gets louder near player
  {
    id: 'street_lamp_hum',
    sceneId: 'street_night',
    position: [0, 3, 0],
    radius: 4,
    type: 'sound_trigger',
    config: { soundType: 'electric_hum', volume: 0.08 },
  },

  /* ─────────────── CAFE EVENING ─────────────── */
  // Bar light pulses when player approaches counter
  {
    id: 'cafe_bar_glow',
    sceneId: 'cafe_evening',
    position: [0, 1.5, -4.0],
    radius: 3,
    type: 'light_glow',
    config: { minIntensity: 0.5, maxIntensity: 1.5, speed: 2, color: '#4488ff', distance: 6 },
  },
  // Cafe ambient music shifts near the back table
  {
    id: 'cafe_backroom_ambient',
    sceneId: 'cafe_evening',
    position: [-3.0, 1, -2.5],
    radius: 4,
    type: 'sound_trigger',
    config: { soundType: 'cafe_music', volume: 0.05 },
  },

  /* ─────────────── OFFICE DAY ─────────────── */
  // Server room green glow intensifies near player
  {
    id: 'office_server_glow',
    sceneId: 'office_day',
    position: [-6, 1.5, -5],
    radius: 4,
    type: 'light_glow',
    config: { minIntensity: 0.2, maxIntensity: 0.8, speed: 1.5, color: '#00ff66', distance: 5 },
  },
  // Terminal screens glitch when player is near
  {
    id: 'office_terminal_disturb',
    sceneId: 'office_day',
    position: [-1.5, 0.8, -3.0],
    radius: 3,
    type: 'visual_disturb',
    config: { intensity: 0.3, speed: 5 },
  },

  /* ─────────────── LIBRARY DAY ─────────────── */
  // Reading lamp warms up near player
  {
    id: 'library_reading_lamp',
    sceneId: 'library_day',
    position: [-3, 1.0, -2],
    radius: 3,
    type: 'light_glow',
    config: { minIntensity: 0.2, maxIntensity: 0.7, speed: 2, color: '#ffcc66', distance: 4 },
  },

  /* ─────────────── ABANDONED FACTORY ─────────────── */
  // Industrial equipment sparks when player is near
  {
    id: 'factory_spark_disturb',
    sceneId: 'abandoned_factory',
    position: [-6, 1.0, -6],
    radius: 4,
    type: 'visual_disturb',
    config: { intensity: 0.6, speed: 6 },
  },
  // Dripping sound gets louder near the ceiling pipes
  {
    id: 'factory_drip_sound',
    sceneId: 'abandoned_factory',
    position: [0, 2.5, -5],
    radius: 5,
    type: 'sound_trigger',
    config: { soundType: 'water_drip', volume: 0.06 },
  },

  /* ─────────────── HOME EVENING ─────────────── */
  // Kitchen warm light brightens when player enters kitchen area
  {
    id: 'home_kitchen_warmth',
    sceneId: 'home_evening',
    position: [0, 2.0, 0],
    radius: 4,
    type: 'light_glow',
    config: { minIntensity: 0.3, maxIntensity: 0.8, speed: 2, color: '#ffaa44', distance: 5 },
  },
  // Radio static increases near the radio
  {
    id: 'home_radio_static',
    sceneId: 'home_evening',
    position: [-2.0, 0.8, -1.5],
    radius: 2,
    type: 'sound_trigger',
    config: { soundType: 'radio_static', volume: 0.04 },
  },

  /* ─────────────── ROOFTOP EDGE ─────────────── */
  // Wind howl increases near the edge
  {
    id: 'rooftop_edge_wind',
    sceneId: 'rooftop_edge',
    position: [0, 1, -4],
    radius: 5,
    type: 'sound_trigger',
    config: { soundType: 'wind_howl', volume: 0.1 },
  },
  // City lights shimmer near edge
  {
    id: 'rooftop_city_lights',
    sceneId: 'rooftop_edge',
    position: [0, 1, -3],
    radius: 4,
    type: 'visual_disturb',
    config: { intensity: 0.3, speed: 3 },
  },
];

/** Get all proximity effects for a given scene */
export function getProximityEffectsForScene(sceneId: SceneId): ProximityEffect[] {
  return PROXIMITY_EFFECTS.filter((e) => e.sceneId === sceneId);
}

/** Compute proximity factor (0 = at edge of radius, 1 = at center) */
export function computeProximityFactor(
  playerPos: [number, number, number],
  effectPos: [number, number, number],
  radius: number,
): number {
  const dx = playerPos[0] - effectPos[0];
  const dy = playerPos[1] - effectPos[1];
  const dz = playerPos[2] - effectPos[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dist >= radius) return 0;
  return 1 - dist / radius;
}
