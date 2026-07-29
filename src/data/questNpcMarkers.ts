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
