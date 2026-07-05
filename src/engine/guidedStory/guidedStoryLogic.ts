import { isExploreHubNode } from '@/shared/exploreHubNodes';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import type {
  GuidedStoryDeps,
  GuidedStoryPathConfig,
  GuidedStorySnapshot,
  GuidedStorySpineState,
  GuidanceInfo,
  QuestDefinition,
  QuestObjective,
} from '@/engine/guidedStory/guidedStoryTypes';
import { getVisitedNodeSet } from '@/shared/visitedNodesIndex';

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
  // Only the current spine step may complete — future nodes catch up via syncFromStore.
  if (nodeIndex !== currentStepIndex) return null;
  if (isExploreHubNode(visitedNodeId) && nodeIndex + 1 <= currentStepIndex) return null;
  return currentStepIndex + 1;
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
  const targetId = obj.target ?? obj.id;
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

  if (def.requiredPoem && !snapshot.collectedPoems.includes(def.requiredPoem)) return false;

  const questAct = def.act ?? 1;
  if (questAct > snapshot.currentAct) return false;

  return true;
}

export function findNpcForQuest(questDef: QuestDefinition): string | undefined {
  if (questDef.questGiverNpcId) return resolveCanonicalNpcId(questDef.questGiverNpcId);
  const npcObj = questDef.objectives.find((o) => o.type === 'npc_talked');
  return npcObj?.target ? resolveCanonicalNpcId(npcObj.target) : undefined;
}

/** Story nodes where network_initiation should be active even if triggerQuest was skipped. */
const NETWORK_INITIATION_ACTIVATION_NODES = new Set([
  'act2_maria_meeting_place',
  'act2_network_initiation',
  'act2_network_oath',
  'act2_network_hesitation',
]);

/** Progress flags that imply network_initiation should be tracked. */
const NETWORK_INITIATION_PROGRESS_FLAGS = [
  'recited_poem_initiation',
  'network_oath_taken',
  'network_joined',
] as const;

const DMITRY_DEFECTION_ACTIVATION_NODES = new Set([
  'act2_dmitry_contact',
  'act2_dmitry_office_meeting',
  'act2_safehouse_message',
]);

const DMITRY_DEFECTION_PROGRESS_FLAGS = [
  'dmitry_meeting_agreed',
  'contacted_dmitry_network',
] as const;

const CAFE_SAFEHOUSE_ACTIVATION_NODES = new Set([
  'act2_barista_revealed',
  'act2_safehouse_agreed',
  'act2_safehouse_terminal',
  'act2_safehouse_message',
  'act2_vault_revealed',
]);

const CAFE_SAFEHOUSE_PROGRESS_FLAGS = [
  'cafe_safehouse_agreed',
  'vault_protect_vowed',
  'safehouse_terminal_installed',
] as const;

const VAULT_KEY_FRAGMENTS_ACTIVATION_NODES = new Set([
  'act2_vault_revealed',
  'act2_safehouse_message',
  'act2_network_oath',
]);

const VAULT_KEY_FRAGMENTS_PROGRESS_FLAGS = [
  'vault_access_granted',
  'vault_protect_vowed',
  'guild_vault_fragment_found',
  'maria_vault_fragment_given',
  'neutral_vault_fragment_found',
] as const;

const POETRY_SMUGGLING_ACTIVATION_NODES = new Set([
  'street_bench',
  'act2_closing',
]);

const POETRY_SMUGGLING_PROGRESS_FLAGS = [
  'cafe_safehouse_established',
  'poetry_stash_retrieved',
  'poems_smuggled',
] as const;

interface SpineQuestReconcileRule {
  questId: string;
  activationNodes: ReadonlySet<string>;
  progressFlags: readonly string[];
}

const SPINE_QUEST_RECONCILE_RULES: SpineQuestReconcileRule[] = [
  {
    questId: 'network_initiation',
    activationNodes: NETWORK_INITIATION_ACTIVATION_NODES,
    progressFlags: NETWORK_INITIATION_PROGRESS_FLAGS,
  },
  {
    questId: 'dmitry_defection',
    activationNodes: DMITRY_DEFECTION_ACTIVATION_NODES,
    progressFlags: DMITRY_DEFECTION_PROGRESS_FLAGS,
  },
  {
    questId: 'cafe_safehouse',
    activationNodes: CAFE_SAFEHOUSE_ACTIVATION_NODES,
    progressFlags: CAFE_SAFEHOUSE_PROGRESS_FLAGS,
  },
  {
    questId: 'vault_key_fragments',
    activationNodes: VAULT_KEY_FRAGMENTS_ACTIVATION_NODES,
    progressFlags: VAULT_KEY_FRAGMENTS_PROGRESS_FLAGS,
  },
  {
    questId: 'poetry_smuggling',
    activationNodes: POETRY_SMUGGLING_ACTIVATION_NODES,
    progressFlags: POETRY_SMUGGLING_PROGRESS_FLAGS,
  },
];

function tryActivateSpineQuest(rule: SpineQuestReconcileRule, deps: GuidedStoryDeps): boolean {
  const snapshot = deps.getSnapshot();

  const existing = snapshot.quests.find((q) => q.questId === rule.questId);
  if (existing && existing.status !== 'inactive' && existing.status !== 'failed') {
    return false;
  }

  if (!canStartQuest(rule.questId, deps)) return false;

  const visitedSet = getVisitedNodeSet(snapshot.visitedNodes);
  const reachedActivationNode = [...rule.activationNodes].some((nodeId) => visitedSet.has(nodeId));
  const hasProgressFlag = rule.progressFlags.some((flag) => snapshot.flags[flag]);

  if (!reachedActivationNode && !hasProgressFlag) return false;

  deps.actions.activateQuest(rule.questId);

  const def = deps.graph.getQuestDefinitionById(rule.questId);
  if (def) {
    deps.events.emitQuestAvailable({
      questId: rule.questId,
      questTitle: def.title,
      questType: def.questType,
      npcId: findNpcForQuest(def),
    });
  }

  return true;
}

/**
 * Activate spine quests when story progress outpaced explicit triggerQuest effects
 * (e.g. cafe/barista shortcuts into act2_network_initiation).
 */
export function reconcileSpineQuestActivation(deps: GuidedStoryDeps): boolean {
  let activated = false;
  for (const rule of SPINE_QUEST_RECONCILE_RULES) {
    if (tryActivateSpineQuest(rule, deps)) {
      activated = true;
    }
  }
  return activated;
}
