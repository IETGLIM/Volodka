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
  // ── FIX (v4.9.0): маркеры оживлённых квестов — AAA-пак и одиночные гиверы ──
  /* ── AAA-пак ── */
  aaa_maria_lost_diary: {
    accept_lost_diary: 'maria',
    return_diary_to_maria: 'maria',
  },
  aaa_sewer_echo: {
    hear_trofim_whisper: 'fisherman_trofim',
    meet_marat_echo: 'marat_echo',
  },
  aaa_boris_poem_smuggling: {
    accept_smuggling_brief: 'boris',
  },
  aaa_library_old_photo: {
    hear_photo_rumor: 'tamara',
    return_photo_to_tamara: 'tamara',
  },
  aaa_factory_broken_mechanism: {
    accept_mechanism_repair: 'baba_zina',
  },
  aaa_trofim_night_philosophy: {
    meet_trofim_late_night: 'fisherman_trofim',
  },
  aaa_chk_campfire_legends: {
    accept_campfire_duty: 'chk_based',
  },
  aaa_epilogue_last_letter: {
    receive_letter_from_albert: 'albert',
  },
  /* ── Одиночные квесты (гиверы-заглушки, v4.9.0) ── */
  lost_shipment: {
    return_to_boris: 'merchant_boris',
  },
  blacksmith_special: {
    return_to_smith: 'blacksmith_ignat',
  },
  guard_bribe_evidence: {
    talk_to_informant: 'informant_seryozha',
    confront_captain: 'captain_garold',
  },
  last_wish: {
    deliver_letter: 'marina',
  },
  poetry_duelist: {
    accept_challenge: 'rival_poet_max',
  },
  forgotten_archive: {
    gain_librarian_trust: 'old_librarian_fyodor',
    return_to_librarian: 'old_librarian_fyodor',
  },
  bunker_signal: {
    report_findings: 'radio_operator_katya',
  },
  trade_route: {
    talk_to_buyer: 'community_buyer',
    talk_to_supplier: 'union_supplier',
    collect_payment: 'smuggler_grisha',
  },
  watchers_shadow: {
    report_to_surveillance_contact: 'surveillance_contact',
  },
  catacombs_shadows: {
    // цели — зоны и предметы; гивер остаётся точкой отсчёта
  },
  whisper_of_walls: {
    // цели — зоны и предметы; подсказка гивера — через сцену библиотеки
  },
  catastrophe_echo: {
    // цели — зоны и флаги дата-центра; Лена — точка входа
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
  /* ── FIX (v4.9.0): сцены-подсказки для флаговых/предметных целей
     оживлённых квестов — чтобы StoryGuidanceHUD и миникарта вели игрока ── */
  /* ── AAA-пак ── */
  aaa_maria_lost_diary: {
    find_poet_diary: { sceneId: 'office_day', position: [-2.0, 0.5, -1.0] },
  },
  aaa_sewer_echo: {
    follow_poem_sound: { sceneId: 'factory_basement', position: [-1.5, 0, -2.0] },
    record_echo_phrase: { sceneId: 'factory_basement', position: [2.0, 0, -3.0] },
  },
  aaa_boris_poem_smuggling: {
    collect_poem_tape: { sceneId: 'abandoned_factory', position: [-2.5, 0, 1.5] },
    distract_patrol: { sceneId: 'street_night', position: [-2.0, 0.01, 2.0] },
    hand_off_to_contact: { sceneId: 'street_night', position: [2.5, 0.01, -1.0] },
  },
  aaa_library_old_photo: {
    find_old_photo: { sceneId: 'library_day', position: [2.0, 0, -1.5] },
    study_poets_history: { sceneId: 'library_day', position: [-1.2, 0, 0.8] },
  },
  aaa_factory_broken_mechanism: {
    repair_mechanism_minigame: { sceneId: 'abandoned_factory', position: [3.0, 0, -1.5] },
    hear_zarya_secret_verse: { sceneId: 'abandoned_factory', position: [3.0, 0, -1.5] },
  },
  aaa_trofim_night_philosophy: {
    sit_with_rod_in_silence: { sceneId: 'river_pier', position: [1.0, 0, -2.0] },
    hear_trofim_legend: { sceneId: 'river_pier', position: [1.0, 0, -2.0] },
    share_one_truth: { sceneId: 'river_pier', position: [1.0, 0, -2.0] },
    wait_for_dawn: { sceneId: 'river_pier', position: [0, 0, -1.0] },
  },
  aaa_chk_campfire_legends: {
    gather_kindling_perimeter: { sceneId: 'abandoned_factory', position: [1.5, 0, 2.5] },
    light_third_fire: { sceneId: 'abandoned_factory', position: [-1.5, 0, 2.0] },
    sit_in_circle: { sceneId: 'abandoned_factory', position: [-1.0, 0, 1.0] },
    hear_three_legends: { sceneId: 'abandoned_factory', position: [-1.0, 0, 1.0] },
  },
  aaa_epilogue_last_letter: {
    read_letter_aloud: { sceneId: 'library_day', position: [-1.2, 0, 0.8] },
    hold_silence: { sceneId: 'library_day', position: [-1.2, 0, 0.8] },
  },
  /* ── Одиночные квесты ── */
  lost_shipment: {
    find_shipment_crate: { sceneId: 'forest_clearing', position: [3.0, 0, -2.0] },
  },
  blacksmith_special: {
    collect_iron_ore: { sceneId: 'abandoned_factory', position: [4.0, 0, -3.0] },
    collect_crystal_shard: { sceneId: 'park_day', position: [-4.5, 0, -3.5] },
    collect_dragon_scale: { sceneId: 'river_pier', position: [3.5, 0, -4.0] },
  },
  guard_bribe_evidence: {
    find_document_1: { sceneId: 'office_day', position: [-3.0, 0.5, -2.5] },
    find_document_2: { sceneId: 'office_day', position: [3.5, 0.5, -3.0] },
  },
  last_wish: {
    travel_to_marina: { sceneId: 'home_evening', position: [0, 0, 1.0] },
  },
  poetry_duelist: {
    write_poem_1: { sceneId: 'street_night', position: [0, 0.01, 2.0] },
    write_poem_2: { sceneId: 'street_night', position: [0, 0.01, 2.0] },
    write_poem_3: { sceneId: 'street_night', position: [0, 0.01, 2.0] },
    perform_at_square: { sceneId: 'street_night', position: [0, 0.01, 2.0] },
  },
  forgotten_archive: {
    solve_archive_puzzle: { sceneId: 'library_day', position: [2.5, 0, -2.0] },
    retrieve_banned_book_1: { sceneId: 'library_day', position: [2.5, 0, -2.0] },
    retrieve_banned_book_2: { sceneId: 'library_day', position: [2.5, 0, -2.0] },
    retrieve_banned_book_3: { sceneId: 'library_day', position: [2.5, 0, -2.0] },
  },
  bunker_signal: {
    decode_message: { sceneId: 'cafe_evening', position: [-1.5, 0, 2.0] },
    find_sender: { sceneId: 'cafe_evening', position: [-1.5, 0, 2.0] },
  },
  trade_route: {
    transport_goods: { sceneId: 'street_night', position: [0, 0.01, 0] },
    avoid_patrol: { sceneId: 'street_night', position: [0, 0.01, 0] },
  },
  watchers_shadow: {
    hack_surveillance_node: { sceneId: 'street_night', position: [4.0, 0.01, -3.0] },
    retrieve_surveillance_data: { sceneId: 'street_night', position: [4.0, 0.01, -3.0] },
  },
  catacombs_shadows: {
    find_catacomb_notes_1: { sceneId: 'factory_basement', position: [0, 0, 2.0] },
    find_catacomb_notes_2: { sceneId: 'factory_basement', position: [-2.0, 0, -1.5] },
    find_catacomb_notes_3: { sceneId: 'factory_basement', position: [2.0, 0, -2.0] },
    kill_dark_mage: { sceneId: 'factory_basement', position: [0, 0, -3.5] },
  },
  whisper_of_walls: {
    find_recording_device: { sceneId: 'factory_basement', position: [1.0, 0, 1.0] },
    listen_to_recordings: { sceneId: 'factory_basement', position: [1.0, 0, 1.0] },
  },
  catastrophe_echo: {
    navigate_corridors: { sceneId: 'factory_basement', position: [-1.0, 0, -2.5] },
    locate_core_terminal: { sceneId: 'factory_basement', position: [2.5, 0, -1.0] },
    extract_memory_fragment: { sceneId: 'factory_basement', position: [2.5, 0, -1.0] },
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
