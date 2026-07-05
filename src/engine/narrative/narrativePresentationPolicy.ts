import { GOLDEN_PATH_STORY_SPINE } from '@/data/goldenPath';
import type { NarrativeKind } from '@/shared/types/narrativeKind';
import type { SceneId } from '@/shared/types/game';
import {
  isClosedOverlayExploreHub,
  SCENE_ENTRY_NODE_TO_HUB,
  getExploreHubDef,
} from '@/shared/sceneExploreHubRegistry';
import { getCutsceneForNode } from '@/data/cutscenes';

/** Act 1 scenes using diegetic presentation (no fullscreen VN overlay). */
export const ACT1_DIEGETIC_SCENE_IDS: ReadonlySet<SceneId> = new Set([
  'volodka_room',
  'volodka_corridor',
  'home_evening',
  'cafe_evening',
  'street_night',
  'office_day',
]);

const ACT1_SPINE_END = GOLDEN_PATH_STORY_SPINE.indexOf('friday_arrives');

const ACT1_SPINE_NODES: ReadonlySet<string> = new Set(
  ACT1_SPINE_END >= 0
    ? GOLDEN_PATH_STORY_SPINE.slice(0, ACT1_SPINE_END + 1)
    : GOLDEN_PATH_STORY_SPINE.slice(0, 20),
);

export type NarrativePresentationMode = 'hub' | 'hud' | 'legacy_overlay';

export function isAct1DiegeticScene(sceneId: SceneId | undefined): boolean {
  return sceneId != null && ACT1_DIEGETIC_SCENE_IDS.has(sceneId);
}

/** True when node belongs to Act 1 diegetic migration scope. */
export function isAct1DiegeticStoryNode(nodeId: string): boolean {
  if (isClosedOverlayExploreHub(nodeId)) return true;
  if (nodeId.startsWith('explore_')) return true;
  if (ACT1_SPINE_NODES.has(nodeId)) return true;
  if (SCENE_ENTRY_NODE_TO_HUB[nodeId] != null) {
    const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
    const hubDef = hubId ? getExploreHubDef(hubId) : undefined;
    if (hubDef && isAct1DiegeticScene(hubDef.sceneId)) return true;
  }
  return false;
}

export function resolveNarrativePresentation(
  nodeId: string,
  _kind: NarrativeKind,
): NarrativePresentationMode {
  if (isClosedOverlayExploreHub(nodeId)) return 'hub';
  if (!isAct1DiegeticStoryNode(nodeId)) return 'legacy_overlay';
  return 'hud';
}

/** Act 1 entry beats: cutscene text only, then hub — no post-cutscene VN. */
export function shouldUseDiegeticPostCutsceneFlow(nodeId: string): boolean {
  if (!isAct1DiegeticStoryNode(nodeId)) return false;
  if (shouldShowEntryStoryAfterCutscene(nodeId)) return true;
  return getCutsceneForNode(nodeId) != null;
}

export function shouldShowEntryStoryAfterCutscene(nodeId: string): boolean {
  const hubId = SCENE_ENTRY_NODE_TO_HUB[nodeId];
  return hubId != null && hubId !== nodeId;
}
