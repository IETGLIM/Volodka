/* ─── Volodka RPG – Lore discovery map ───
 * Maps scenes and story nodes to lore entries that should be discovered.
 * Ambient lore is reachable via scene entry and story effects.
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
    'lore_volodka_night_ritual', // Night ritual in the engineer's room
    'lore_volodka_thirty_three', // The thirty-three mystery
  ],
  volodka_corridor: [
    'lore_corridor_liminal',   // Liminal space discovered in the corridor
  ],
  home_evening: [
    'lore_zarema',             // Zarema's backstory discovered in kitchen
    'lore_home_evening_routine', // Evening ritual discovered in kitchen
    'lore_zarema_albert_backstory', // Cross-destinies discovered in kitchen
    'lore_communal_radio',     // Kitchen radio — shortwave freedom
    'lore_volodka_ufa_relationship', // Volodka's Ufa relationship echoes
  ],
  solnysh_room: [
    'lore_solnysh_studio',     // Solnysh's art studio atmosphere
  ],
  zarema_albert_room: [
    'lore_zarema_albert_home', // Neighbors' cozy shared room
    'lore_zarema_past',        // Zarema's past surfacing in the shared room
  ],
  street_night: [
    'lore_city_ufa',           // City overview from the street
    'lore_street_gangs',       // Street culture discovered at night
    'lore_ai_surveillance',    // Surveillance discovered on the street
    'lore_winter_phenomena',   // Winter phenomena discovered outside
  ],
  street_winter: [
    'lore_winter_phenomena',   // Winter phenomena on the frozen street
    'lore_city_ufa',           // City overview — winter perspective
    'lore_ai_surveillance',    // Surveillance still active in winter
    'lore_weather_control',    // Weather control infrastructure glimpsed in winter sky
    'lore_metro_rumors',       // Metro rumors heard on the winter street
    'lore_winter_code',        // Winter code patterns in the frost
  ],
  cafe_evening: [
    'lore_cafe_blue_hole',     // Cafe lore discovered by visiting
    'lore_cafe_history',       // Cafe history from spending time there
    'lore_network',            // Network lore from the cafe atmosphere
    'lore_poem_virus',         // Poem virus phenomenon discussed at cafe
    'lore_digital_resistance',  // Resistance discovered at cafe
    'lore_cafe_backroom',      // Hidden backroom behind the bar
    'lore_barista_arm',        // Barista cyber-arm guarantee at the espresso bar
  ],
  office_day: [
    'lore_it_guild',           // Guild lore discovered at the office
    'lore_incident_4729',      // Incident discovered at the office
    'lore_neurosys_corp',      // NeuroSys discovered at the office
    'lore_alexander_schemes',  // Alexander's schemes discovered at office
    'lore_colleague_double_life', // Colleague's double life discovered at office
    'lore_dmitry_project',     // Dmitry's project discovered at office
    'lore_neurosys_chips',     // Chip anatomy discovered at office
    'lore_office_server_hum',  // Server room 50 Hz pulse
    'lore_volodka_ufa_technoservis', // Volodka's Ufa Technoservis past
    'lore_neurosis_project',   // Neurosis project files glimpsed
    'lore_dmitry_secret',      // Dmitry's secret uncovered at the office
    'lore_coding_guide',       // Coding guide notes on a workstation
  ],
  park_day: [
    'lore_park_memorial',      // Memorial discovered in the park
    'lore_great_crash_2029',   // Great Crash lore from the memorial
    'lore_park_autumn_bench',  // Bench pause between battles
  ],
  chk_forest_zorge: [
    'lore_tolpa_chk',          // TOLPA / Black Room discovered at campfire
    'lore_chk_moonlight',      // Moonlight on the forest clearing
    'lore_chk_port_wine_777',  // Port wine ritual on the clearing
    'lore_chk_network_role',   // CHK as offline mesh support node
  ],
  abandoned_factory: [
    'lore_factory',            // Factory discovered by visiting
    'lore_factory_workers',    // Workers' story discovered at factory
    'lore_quantum_computer',   // Quantum computer discovered at factory
    'lore_resistance_fragment', // Resistance fragment found in the factory
    'lore_zarya_poetry',       // Zarya-M machine poetry in the hum
  ],
  library_day: [
    'lore_forbidden_books',    // Forbidden books discovered in library
    'lore_18_poems',           // 18 Poems legend discovered in library
    'lore_library_index',      // Paper card catalog memory
  ],
  rooftop_edge: [
    'lore_rooftop',            // Rooftop transition point discovered
    'lore_rooftop_community',  // Rooftop community discovered
    'lore_rooftop_poets',      // Rooftop poets' gatherings
  ],
  factory_basement: [
    'lore_factory_progress7',  // Secret sublevel discovered by descending
    'lore_zarya_project_early', // Early Zarya project context in the basement
    'lore_basement_ozone',     // Ozone breath of the machine
  ],
  river_pier: [
    'lore_pier_three',         // Pier history discovered by visiting
    'lore_watchman_trofim',    // Trofim's watchman history at the pier
    'lore_river_remembers',    // River phantom signals / factory hum echo
    'lore_pier_string_lights', // Solar string lights failover hangout
    'lore_factory_underwater', // Factory cooling loop under the pier
    'lore_frequency_poem',     // Frequency poems heard at the water
  ],
  sleep_dream: [
    'lore_dreamworld',         // Dream world rules discovered in dream
    'lore_dream_rules',        // Dream rules discovered in dream
    'lore_dream_echo',         // Short dream echo — unwritten line
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
  chk_tolpa_poem: ['lore_tolpa_chk'],
  chk_act3_sanctuary: ['lore_tolpa_chk'],

  // Act 3 — War
  act3_transition: ['lore_alexander_schemes'],
  act3_zarema_arrest: ['lore_zarema_albert_backstory'],

  // Act 4 — Revolution
  act4_transition: ['lore_digital_resistance'],
  act4_core_server: ['lore_poem_virus'],

  // Act 5 — Finale
  act5_dawn: ['lore_digital_resistance'],
  chk_act5_campfire_dawn: ['lore_tolpa_chk'],

  // Pier / basement payoff nodes
  pier_arrival: ['lore_pier_three'],
  act3_exp_pier_relay_after_arrest: ['lore_hub_relay_network'],
  act3_exp_library_relay_echo: ['lore_frequency_poem'],
  act3_exp_cafe_relay_ack: ['lore_hub_relay_network'],
  act3_exp_office_relay_ack: ['lore_hub_relay_network'],
  act3_exp_guild_relay_ack: ['lore_hub_relay_network'],
  act3_exp_factory_relay_ack: ['lore_hub_relay_network', 'lore_zarya_poetry'],
  act3_exp_basement_relay_epilogue: ['lore_hub_relay_network', 'lore_zarya_project_early'],
  factory_basement_familiar: ['lore_zarya_project_early'],
  machine_confession_scene_thread: ['lore_great_crash_2029', 'lore_incident_4729'],

  // Act 6 — post-finale factory line
  act6_bridge: ['lore_factory_ghosts'],

  // Act 7 — legacy
  act7_legacy_walk: ['lore_volodka_legacy'],
  act7_poet_legacy_mirror: ['lore_volodka_legacy'],

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
