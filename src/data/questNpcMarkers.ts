import type { SceneId } from '@/shared/types/game';

/** Which NPC should show a quest marker for each incomplete objective. */
export const QUEST_OBJECTIVE_NPC_HINTS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  solnysh_comfort: {
    talk_solnysh: 'vera',
    comfort_solnysh: 'vera',
  },
  solnysh_roof_wine: {
    find_wine: 'lyonya',
    offer_wine: 'vera',
    roof_toast: 'vera',
  },
  solnysh_relocation: {
    discuss_move: 'vera',
    support_move: 'vera',
  },
};

/** Scene waypoints for StoryGuidanceHUD / minimap when objective has no location_visited target. */
export const QUEST_OBJECTIVE_SCENE_HINTS: Readonly<
  Record<string, Readonly<Record<string, { sceneId: SceneId; position: [number, number, number] }>>>
> = {
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
