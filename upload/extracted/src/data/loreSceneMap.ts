/* ─── Volodka RPG – Lore discovery map ───
 * Maps scenes and story nodes to lore entries that should be discovered.
 * This ensures all 43 lore points are reachable during gameplay.
 *
 * Two discovery methods:
 * 1. Scene entry: when the player enters a scene, associated lore is auto-discovered
 * 2. Story effects: discoverLore effects in story/dialogue node choices
 */

import type { SceneId } from '@/shared/types/game';

/**
 * LORE_SCENE_MAP — lore entries discovered automatically when entering a scene.
 * These are "ambient" lore that the player learns just by being in a location.
 */
export const LORE_SCENE_MAP: Partial<Record<SceneId, string[]>> = {
  volodka_room: [
    'lore_volodka_engineer',   // Engineering past discovered in own room
  ],
  volodka_corridor: [
    'lore_corridor_liminal',   // Liminal space discovered in the corridor
  ],
  home_evening: [
    'lore_zarema',             // Zarema's backstory discovered in kitchen
    'lore_home_evening_routine', // Evening ritual discovered in kitchen
    'lore_zarema_albert_backstory', // Cross-destinies discovered in kitchen
  ],
  street_night: [
    'lore_city_ufa',           // City overview from the street
    'lore_street_gangs',       // Street culture discovered at night
    'lore_ai_surveillance',    // Surveillance discovered on the street
    'lore_winter_phenomena',   // Winter phenomena discovered outside
  ],
  cafe_evening: [
    'lore_cafe_blue_hole',     // Cafe lore discovered by visiting
    'lore_cafe_history',       // Cafe history from spending time there
    'lore_network',            // Network lore from the cafe atmosphere
    'lore_poem_virus',         // Poem virus phenomenon discussed at cafe
    'lore_digital_resistance',  // Resistance discovered at cafe
  ],
  office_day: [
    'lore_it_guild',           // Guild lore discovered at the office
    'lore_incident_4729',      // Incident discovered at the office
    'lore_neurosys_corp',      // NeuroSys discovered at the office
    'lore_alexander_schemes',  // Alexander's schemes discovered at office
    'lore_colleague_double_life', // Colleague's double life discovered at office
    'lore_dmitry_project',     // Dmitry's project discovered at office
    'lore_neurosys_chips',     // Chip anatomy discovered at office
  ],
  park_day: [
    'lore_park_memorial',      // Memorial discovered in the park
    'lore_great_crash_2029',   // Great Crash lore from the memorial
  ],
  library_day: [
    'lore_forbidden_books',    // Forbidden books discovered in library
    'lore_18_poems',           // 18 Poems legend discovered in library
  ],
  rooftop_edge: [
    'lore_rooftop',            // Rooftop transition point discovered
    'lore_rooftop_community',  // Rooftop community discovered
  ],
  abandoned_factory: [
    'lore_factory',            // Factory discovered by visiting
    'lore_factory_workers',    // Workers' story discovered at factory
    'lore_quantum_computer',   // Quantum computer discovered at factory
  ],
  sleep_dream: [
    'lore_dreamworld',         // Dream world rules discovered in dream
    'lore_dream_rules',        // Dream rules discovered in dream
  ],
};

/**
 * LORE_STORY_NODE_MAP — lore entries discovered when reaching specific story nodes.
 * These are "narrative" lore tied to story progression.
 */
export const LORE_STORY_NODE_MAP: Record<string, string[]> = {
  // Act 1 — Prologue
  start: ['lore_vladimir'],
  kitchen_table: ['lore_maria_secret'],      // Maria's secret hinted through Zarema
  maria_curious: ['lore_maria'],             // Maria's lore discovered on meeting
  office_alexander: ['lore_dmitry'],         // Dmitry mentioned at the office
  balcony_thought: [],

  // Act 2 — Network
  act2_transition: ['lore_vladimir'],        // Reconfirm Vladimir's nature
  act2_albert_hint: ['lore_albert'],         // Albert's lore discovered through conversation
  act2_network_initiation: ['lore_network'], // Network details on joining
  act2_safehouse_agreed: ['lore_cafe_history'],
  act2_dmitry_office_meeting: ['lore_dmitry_project'],

  // Act 3 — War
  act3_transition: ['lore_alexander_schemes'],
  act3_zarema_arrest: ['lore_zarema_albert_backstory'],

  // Act 4 — Revolution
  act4_transition: ['lore_digital_resistance'],

  // Lore that requires specific conditions
  poem_virus_truth: ['lore_poem_virus'],
};

/**
 * Get all lore IDs that should be discovered when entering a scene.
 */
export function getLoreForScene(sceneId: SceneId): string[] {
  return LORE_SCENE_MAP[sceneId] ?? [];
}

/**
 * Get all lore IDs that should be discovered when reaching a story node.
 */
export function getLoreForStoryNode(storyNodeId: string): string[] {
  return LORE_STORY_NODE_MAP[storyNodeId] ?? [];
}
