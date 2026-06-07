import { isExploreHubNode } from '@/shared/exploreHubNodes';
import type {
  GuidedStoryDeps,
  GuidedStoryPathConfig,
  GuidedStorySnapshot,
  GuidedStorySpineState,
  GuidanceInfo,
  QuestDefinition,
  QuestObjective,
} from '@/engine/guidedStory/guidedStoryTypes';
import { getVisitedNodeSet } from '@/store/visitedNodesIndex';

export function getActForNode(nodeId: string, path: GuidedStoryPathConfig): number {
  const direct = path.actTransitions.find((t) => t.entryNodeId === nodeId);
  if (direct) return direct.act;

  const spineIdx = path.storySpine.indexOf(nodeId);
  if (spineIdx < 0) return 1;

  for (let i = path.actTransitions.length - 1; i >= 0; i--) {
    const transIdx = path.storySpine.indexOf(path.actTransitions[i].entryNodeId);
    if (transIdx >= 0 && spineIdx >= transIdx) return path.actTransitions[i].act;
  }
  return 1;
}

export function getActTransition(path: GuidedStoryPathConfig, act: number) {
  return path.actTransitions.find((t) => t.act === act);
}

export function syncSpineStateFromSnapshot(
  snapshot: GuidedStorySnapshot,
  path: GuidedStoryPathConfig,
): GuidedStorySpineState {
  const state: GuidedStorySpineState = {
    currentStepIndex: 0,
    currentQuestSpineIndex: 0,
    lastAdvancedToAct: snapshot.currentAct,
  };

  const visitedSet = getVisitedNodeSet(snapshot.visitedNodes);

  for (let i = path.storySpine.length - 1; i >= 0; i--) {
    if (visitedSet.has(path.storySpine[i])) {
      state.currentStepIndex = i + 1;
      break;
    }
  }

  for (let i = 0; i < path.questSpine.length; i++) {
    const questId = path.questSpine[i];
    const questState = snapshot.quests.find((q) => q.questId === questId);
    if (questState?.status === 'completed') {
      state.currentQuestSpineIndex = i + 1;
    } else if (questState?.status === 'active') {
      state.currentQuestSpineIndex = i;
      break;
    } else {
      break;
    }
  }

  return state;
}

/** Returns next step index, or null when spine should not advance. */
export function resolveStorySpineAdvance(
  visitedNodeId: string,
  currentStepIndex: number,
  path: GuidedStoryPathConfig,
): number | null {
  const nodeIndex = path.storySpine.indexOf(visitedNodeId);
  if (nodeIndex < 0) return null;
  if (nodeIndex < currentStepIndex) return null;
  if (isExploreHubNode(visitedNodeId) && nodeIndex + 1 <= currentStepIndex) return null;
  return nodeIndex + 1;
}

export function pickQuestFromSpine(
  candidates: readonly QuestDefinition[],
  currentQuestSpineIndex: number,
  snapshot: GuidedStorySnapshot,
  path: GuidedStoryPathConfig,
  getQuestDefinitionById: (id: string) => QuestDefinition | undefined,
): QuestDefinition | null {
  const candidateIds = new Set(candidates.map((d) => d.id));

  for (let i = currentQuestSpineIndex; i < path.questSpine.length; i++) {
    const questId = path.questSpine[i];
    if (!candidateIds.has(questId)) continue;

    const def = getQuestDefinitionById(questId);
    if (!def) continue;

    const questState = snapshot.quests.find((q) => q.questId === def.id);
    if (questState?.status === 'completed') continue;
    return def;
  }

  return null;
}

export function buildGuidanceFromObjective(
  obj: QuestObjective,
  questDef: QuestDefinition,
  act: number,
  path: GuidedStoryPathConfig,
  findNpcById: (id: string) => { name: string } | undefined,
): GuidanceInfo {
  let objectiveType: GuidanceInfo['objectiveType'] = 'complete_quest';
  let targetId = obj.target ?? obj.id;
  let objectiveText = obj.description;

  switch (obj.type) {
    case 'npc_talked': {
      objectiveType = 'talk_to_npc';
      const npc = obj.target ? findNpcById(obj.target) : undefined;
      if (npc) objectiveText = `Поговори с ${npc.name}`;
      break;
    }
    case 'location_visited':
      objectiveType = 'visit_location';
      break;
    case 'item_collected':
    case 'poem_collected':
      objectiveType = 'collect_item';
      break;
    default:
      objectiveType = 'complete_quest';
  }

  return {
    objectiveText,
    objectiveType,
    targetId,
    urgency: questDef.questType === 'main' ? 'required' : 'recommended',
    actNumber: act,
    chapterTitle: path.actChapterTitles[act] ?? `Акт ${act}`,
  };
}

function nodeToReadableText(
  nodeId: string,
  path: GuidedStoryPathConfig,
  findNpcById: (id: string) => { name: string } | undefined,
): string {
  const hint = path.branchHints[nodeId];
  if (hint) return hint;

  const mappedNpcId = path.getNpcIdForStoryNode(nodeId);
  if (mappedNpcId) {
    const npc = findNpcById(mappedNpcId);
    if (npc) return `Найди ${npc.name}`;
  }

  const sceneLabel = path.storyNodeToSceneLabel[nodeId];
  if (sceneLabel) return `Отправляйся в ${sceneLabel}`;

  return `Продолжай путь: ${nodeId.replace(/_/g, ' ')}`;
}

function inferObjectiveType(
  nodeId: string,
  path: GuidedStoryPathConfig,
): GuidanceInfo['objectiveType'] {
  if (path.getNpcIdForStoryNode(nodeId)) return 'talk_to_npc';
  return path.storyNodeObjectiveType[nodeId] ?? 'complete_quest';
}

export function deriveObjectiveFromStep(
  stepIndex: number,
  spineState: Pick<GuidedStorySpineState, 'currentQuestSpineIndex'>,
  deps: GuidedStoryDeps,
): GuidanceInfo | null {
  const { path } = deps;
  if (stepIndex >= path.storySpine.length) return null;

  const nodeId = path.storySpine[stepIndex];
  const act = getActForNode(nodeId, path);
  const hint = path.branchHints[nodeId];
  const snapshot = deps.getSnapshot();

  const questDef = deps.graph.findQuestForNode(nodeId, spineState.currentQuestSpineIndex);
  if (questDef) {
    const questState = snapshot.quests.find((q) => q.questId === questDef.id);

    if (questState?.status === 'active') {
      const nextObj = questDef.objectives.find((o) => !questState.objectives[o.id]);
      if (nextObj) {
        return buildGuidanceFromObjective(nextObj, questDef, act, path, deps.npc.findNpcById);
      }
    }

    return {
      objectiveText: hint ?? `Прими задание: ${questDef.title}`,
      objectiveType: 'complete_quest',
      targetId: questDef.id,
      urgency: questDef.questType === 'main' ? 'required' : 'recommended',
      actNumber: act,
      chapterTitle: path.actChapterTitles[act] ?? `Акт ${act}`,
    };
  }

  return {
    objectiveText: hint ?? nodeToReadableText(nodeId, path, deps.npc.findNpcById),
    objectiveType: inferObjectiveType(nodeId, path),
    targetId: nodeId,
    urgency: 'recommended',
    actNumber: act,
    chapterTitle: path.actChapterTitles[act] ?? `Акт ${act}`,
  };
}

export function getCurrentGuidance(
  spineState: GuidedStorySpineState,
  deps: GuidedStoryDeps,
): GuidanceInfo | null {
  const snapshot = deps.getSnapshot();
  const { path } = deps;

  for (let i = 0; i < path.questSpine.length; i++) {
    const questId = path.questSpine[i];
    const questState = snapshot.quests.find((q) => q.questId === questId);

    if (questState?.status === 'active') {
      const questDef = deps.graph.getQuestDefinitionById(questId);
      if (!questDef) continue;

      const nextObj = questDef.objectives.find((o) => !questState.objectives[o.id]);
      if (nextObj) {
        const act = questDef.act ?? getActForNode(path.storySpine[spineState.currentStepIndex] ?? '', path);
        return buildGuidanceFromObjective(nextObj, questDef, act, path, deps.npc.findNpcById);
      }
    }
  }

  return deriveObjectiveFromStep(spineState.currentStepIndex, spineState, deps);
}

export function canStartQuest(questId: string, deps: GuidedStoryDeps): boolean {
  const snapshot = deps.getSnapshot();
  const existing = snapshot.quests.find((q) => q.questId === questId);
  if (existing && existing.status !== 'inactive') return false;

  const def = deps.graph.getQuestDefinitionById(questId);
  if (!def) return false;

  if (def.requiresQuests) {
    for (const reqId of def.requiresQuests) {
      const reqQuest = snapshot.quests.find((q) => q.questId === reqId);
      if (!reqQuest || reqQuest.status !== 'completed') return false;
    }
  }

  if (def.requiredFlag && !snapshot.flags[def.requiredFlag]) return false;

  const questAct = def.act ?? 1;
  if (questAct > snapshot.currentAct) return false;

  return true;
}

export function findNpcForQuest(questDef: QuestDefinition): string | undefined {
  if (questDef.questGiverNpcId) return questDef.questGiverNpcId;
  const npcObj = questDef.objectives.find((o) => o.type === 'npc_talked');
  return npcObj?.target;
}
