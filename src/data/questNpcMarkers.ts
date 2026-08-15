import type { SceneId } from '@/shared/types/game';

/** Which NPC should show a quest marker for each incomplete objective. */
export const QUEST_OBJECTIVE_NPC_HINTS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  night_city_call: {
    enter_cafe: 'cafe_barista',
  },
  maria_connection: {
    meet_maria: 'maria',
    accept_chip: 'maria',
  },
  cafe_street_whisper: {
    ask_barista_tip: 'cafe_barista',
    spot_alley_silhouette: 'maria',
  },
  chip_cafe_clearance: {
    return_cafe_with_chip: 'cafe_barista',
    barista_hears_echo: 'cafe_barista',
    receive_guild_summons: 'cafe_barista',
    reach_guild_lobby: 'office_alexander',
  },
  office_lobby_watch: {
    notice_colleague_watch: 'office_colleague',
  },
  code_poem_aftermath: {
    feel_guild_pressure: 'office_alexander',
    ask_colleague_politics: 'office_colleague',
    hear_vault_lead: 'office_colleague',
  },
  friday_spleen: {
    hear_albert_bridge: 'albert',
  },
  solnysh_comfort: {
    talk_solnysh: 'solnysh',
    comfort_solnysh: 'solnysh',
  },
  solnysh_roof_wine: {
    find_wine: 'lyonya',
    offer_wine: 'solnysh',
    roof_toast: 'solnysh',
  },
  solnysh_relocation: {
    discuss_move: 'solnysh',
    support_move: 'solnysh',
  },
  // ── Act 3 side quests ──
  factory_lost_engineer: {
    accept_factory_search: 'boris',
    enter_factory: 'boris',
    find_grigory_notes: 'grisha',
    descend_basement: 'grisha',
    rescue_grigory: 'grisha',
  },
  library_banned_book: {
    hear_banned_book_rumor: 'tamara',
    find_basement_entrance: 'tamara',
    bypass_security_lock: 'tamara',
    retrieve_banned_book: 'tamara',
    return_book_to_tamara: 'tamara',
  },
  factory_secret_blueprint: {
    find_blueprint_cache: 'boris',
    retrieve_blueprint: 'boris',
    decide_blueprint_fate: 'boris',
  },
  // ── Act 5 side quests ──
  dreamworld_lost_child: {
    meet_dream_child: 'maria',
    recover_first_memory: 'maria',
    recover_second_memory: 'maria',
    recover_third_memory: 'maria',
    guide_child_home: 'maria',
  },
  void_echo_poem: {
    hear_first_echo: 'street_poet',
    hear_second_echo: 'street_poet',
    hear_third_echo: 'street_poet',
    confront_void_poet: 'street_poet',
    claim_void_poem: 'street_poet',
  },
};

/** Scene waypoints for StoryGuidanceHUD / minimap when objective has no location_visited target. */
export const QUEST_OBJECTIVE_SCENE_HINTS: Readonly<
  Record<string, Readonly<Record<string, { sceneId: SceneId; position: [number, number, number] }>>>
> = {
  night_city_call: {
    leave_home: { sceneId: 'volodka_corridor', position: [0, 0, 1.2] },
    reach_street: { sceneId: 'street_night', position: [0, 0.01, 0] },
    enter_cafe: { sceneId: 'cafe_evening', position: [0, 0, 1.0] },
    feel_city_pulse: { sceneId: 'street_night', position: [-2.5, 0.01, 3.0] },
  },
  maria_connection: {
    meet_maria: { sceneId: 'street_night', position: [-4.0, 0.01, -1.5] },
    accept_chip: { sceneId: 'street_night', position: [-4.0, 0.01, -1.5] },
    read_maria_poem: { sceneId: 'street_night', position: [-4.0, 0.01, -1.5] },
  },
  cafe_street_whisper: {
    ask_barista_tip: { sceneId: 'cafe_evening', position: [0, 0.5, -4.0] },
    spot_alley_silhouette: { sceneId: 'street_night', position: [-4.0, 0.01, -1.5] },
  },
  chip_cafe_clearance: {
    return_cafe_with_chip: { sceneId: 'cafe_evening', position: [0, 0, 1.0] },
    barista_hears_echo: { sceneId: 'cafe_evening', position: [0, 0.5, -4.0] },
    receive_guild_summons: { sceneId: 'cafe_evening', position: [0, 0.5, -4.0] },
    reach_guild_lobby: { sceneId: 'office_day', position: [0, 0, 2.0] },
  },
  office_lobby_watch: {
    feel_chip_warmth: { sceneId: 'office_day', position: [-1.5, 0.5, -3.0] },
    read_incident_bulletin: { sceneId: 'office_day', position: [0.5, 0.5, 2.5] },
    notice_colleague_watch: { sceneId: 'office_day', position: [1.0, 0, 0.5] },
  },
  code_poem_aftermath: {
    absorb_decoded_poem: { sceneId: 'office_day', position: [-1.5, 0.5, -3.0] },
    feel_guild_pressure: { sceneId: 'office_day', position: [3.0, 0, -2.0] },
    ask_colleague_politics: { sceneId: 'office_day', position: [1.0, 0, 0.5] },
    hear_vault_lead: { sceneId: 'office_day', position: [1.0, 0, 0.5] },
  },
  friday_spleen: {
    leave_office_dusk: { sceneId: 'office_day', position: [0, 0, 4.0] },
    stand_on_balcony: { sceneId: 'home_evening', position: [3.0, 1.0, -2.5] },
    write_friday_poem: { sceneId: 'volodka_room', position: [0, 0, 0] },
    hear_albert_bridge: { sceneId: 'cafe_evening', position: [-3.0, 0, -2.5] },
  },
  solnysh_comfort: {
    talk_solnysh: { sceneId: 'volodka_corridor', position: [0, 0, 1.5] },
    comfort_solnysh: { sceneId: 'volodka_corridor', position: [0, 0, 1.5] },
  },
  solnysh_roof_wine: {
    find_wine: { sceneId: 'solnysh_room', position: [-2.6, 0, 1.6] },
    offer_wine: { sceneId: 'solnysh_room', position: [1.0, 0, -1.0] },
    roof_toast: { sceneId: 'rooftop_edge', position: [0, 0.01, 0] },
  },
  solnysh_relocation: {
    discuss_move: { sceneId: 'solnysh_room', position: [1.0, 0, -1.0] },
    support_move: { sceneId: 'solnysh_room', position: [1.0, 0, -1.0] },
  },
  // ── Act 3 side quests ──
  factory_lost_engineer: {
    accept_factory_search: { sceneId: 'office_day', position: [1.5, 0, -0.5] },
    enter_factory: { sceneId: 'abandoned_factory', position: [0, 0, 2.0] },
    find_grigory_notes: { sceneId: 'abandoned_factory', position: [-3.0, 0, -2.5] },
    descend_basement: { sceneId: 'factory_basement', position: [0, 0, 1.5] },
    rescue_grigory: { sceneId: 'factory_basement', position: [2.5, 0, -3.0] },
  },
  library_banned_book: {
    hear_banned_book_rumor: { sceneId: 'library_day', position: [-1.2, 0, 0.8] },
    find_basement_entrance: { sceneId: 'library_basement', position: [0, 0, 2.0] },
    bypass_security_lock: { sceneId: 'library_basement', position: [-2.0, 0, -1.5] },
    retrieve_banned_book: { sceneId: 'library_basement', position: [3.0, 0, -2.5] },
    return_book_to_tamara: { sceneId: 'library_day', position: [-1.2, 0, 0.8] },
  },
  factory_secret_blueprint: {
    find_blueprint_cache: { sceneId: 'abandoned_factory', position: [4.0, 0, -4.5] },
    retrieve_blueprint: { sceneId: 'abandoned_factory', position: [4.0, 0, -4.5] },
    decide_blueprint_fate: { sceneId: 'abandoned_factory', position: [4.0, 0, -4.5] },
  },
  // ── Act 5 side quests ──
  dreamworld_lost_child: {
    meet_dream_child: { sceneId: 'sleep_dream', position: [0, 0, 3.0] },
    recover_first_memory: { sceneId: 'sleep_dream', position: [-3.0, 0, 2.0] },
    recover_second_memory: { sceneId: 'sleep_dream', position: [3.0, 0, 2.0] },
    recover_third_memory: { sceneId: 'sleep_dream', position: [0, 0, -3.0] },
    guide_child_home: { sceneId: 'sleep_dream', position: [0, 0, 5.0] },
  },
  void_echo_poem: {
    hear_first_echo: { sceneId: 'river_pier', position: [-1.8, 0, -2.9] },
    hear_second_echo: { sceneId: 'rooftop_edge', position: [0, 0.01, 0] },
    hear_third_echo: { sceneId: 'library_day', position: [-1.2, 0, 0.8] },
    confront_void_poet: { sceneId: 'sleep_dream', position: [0, 0, -5.0] },
    claim_void_poem: { sceneId: 'sleep_dream', position: [0, 0, -5.0] },
  },
};

export function getObjectiveNpcHint(questId: string, objectiveId: string): string | undefined {
  return QUEST_OBJECTIVE_NPC_HINTS[questId]?.[objectiveId];
}

export function getObjectiveSceneHint(
  questId: string,
  objectiveId: string,
): { sceneId: SceneId; position: [number, number, number] } | undefined {
  return QUEST_OBJECTIVE_SCENE_HINTS[questId]?.[objectiveId];
}
