import { getSceneConfig } from '@/config/scenes';
import { STORY_NODE_TO_NPC_ID } from '@/data/goldenPath';
import { getStoryNodeSceneId } from '@/engine/guidedStory/createGuidedStoryDeps';
import type { GuidanceInfo } from '@/engine/guidedStory/guidedStoryTypes';
import { getNPCLocationForTime } from '@/shared/schedule/ScheduleEngine';
import type { ScheduleContext } from '@/shared/scheduleContext';
import type { SceneId } from '@/shared/types/game';

/** Resolve the 3D scene where the player should go for this guidance step. */
export function resolveGuidanceTargetScene(
  guidance: Pick<GuidanceInfo, 'targetId' | 'objectiveType'>,
  getNpcIdForStoryNode: (nodeId: string) => string | undefined,
): SceneId | undefined {
  const fromNode = getStoryNodeSceneId(guidance.targetId);
  if (fromNode) return fromNode as SceneId;

  if (guidance.objectiveType === 'talk_to_npc') {
    const npcId = getNpcIdForStoryNode(guidance.targetId);
    if (npcId) {
      return findSceneForNpc(npcId);
    }
  }

  return undefined;
}

function findSceneForNpc(npcId: string): SceneId | undefined {
  for (const [nodeId, mappedNpc] of Object.entries(STORY_NODE_TO_NPC_ID)) {
    if (mappedNpc !== npcId) continue;
    const scene = getStoryNodeSceneId(nodeId);
    if (scene) return scene as SceneId;
  }
  return undefined;
}

export function buildGuidanceDirectionHint(
  targetSceneId: SceneId | undefined,
  currentSceneId: SceneId,
): string | null {
  if (!targetSceneId) return null;
  if (targetSceneId === currentSceneId) {
    return 'Цель в этой локации — ищите метку';
  }
  const sceneConfig = getSceneConfig(targetSceneId);
  return `Перейдите: ${sceneConfig.name}`;
}

/** Scene where an available quest's giver currently is (schedule-aware). */
export function resolveAvailableQuestTargetScene(
  questGiverNpcId: string | undefined,
  hour: number,
  ctx: ScheduleContext,
): SceneId | undefined {
  if (!questGiverNpcId) return undefined;
  return getNPCLocationForTime(questGiverNpcId, hour, ctx)?.sceneId;
}

export function enrichGuidanceWithLocation(
  guidance: GuidanceInfo,
  getNpcIdForStoryNode: (nodeId: string) => string | undefined,
): GuidanceInfo {
  const targetSceneId = resolveGuidanceTargetScene(guidance, getNpcIdForStoryNode);
  if (!targetSceneId || targetSceneId === guidance.targetSceneId) {
    return targetSceneId ? { ...guidance, targetSceneId } : guidance;
  }
  return { ...guidance, targetSceneId };
}
