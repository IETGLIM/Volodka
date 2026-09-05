/**
 * Quest reachability — static analysis of quest activation paths.
 *
 * Pure function, no engine/store imports (same policy as contentPipelineValidator).
 * Used by scripts/analyze-quest-reachability.ts (QA CLI) and by the regression
 * test that guards against dead quest packs (see questReachability.test.ts).
 *
 * Activation roots:
 *   - greeting/return dialogue nodes of SCHEDULED NPCs
 *   - relation-milestone dialogue nodes of NPCs
 *   - trigger-zone linked dialogue/story nodes
 *   - explore-hub nodes (hub StoryNodes are traversal roots)
 *   - the prologue node ('start')
 * Edges: choice.next across story/dialogue registries + visitStoryNode effects.
 * Activations: triggerQuest effects anywhere on a reachable path,
 *   zone.linkedQuestId, and hardcoded cinematic activations.
 */

export interface ReachabilityChoiceLike {
  next?: string | null;
  effects?: ReadonlyArray<{ type?: string; questId?: unknown; nodeId?: unknown }>;
}

export interface ReachabilityNodeLike {
  choices?: readonly ReachabilityChoiceLike[];
  /** Node-mount effects are applied by the renderer on visit — triggerQuest/visitStoryNode here are live edges. */
  effects?: ReadonlyArray<{ type?: string; questId?: unknown; nodeId?: unknown }>;
}

export interface ReachabilityZoneLike {
  linkedDialogueNodeId?: string;
  linkedStoryNodeId?: string;
  linkedQuestId?: string;
  /** Runtime TriggerZones apply effects on interaction — triggerQuest here IS an activation path. */
  effects?: ReadonlyArray<{ type?: string; questId?: unknown }>;
}

export interface ReachabilityNpcLike {
  id: string;
  dialogueNodeId?: string;
  returnDialogueNodeId?: string;
  relationMilestones?: readonly { value: number; dialogueNodeId: string }[];
}

export interface ReachabilityHubDefLike {
  hubId: string;
}

export interface QuestReachabilityDeps {
  quests: ReadonlyArray<{ id: string }>;
  storyNodes: Readonly<Record<string, ReachabilityNodeLike>>;
  dialogueNodes: Readonly<Record<string, ReachabilityNodeLike>>;
  zones: readonly ReachabilityZoneLike[];
  hubIds: readonly string[];
  npcDefinitions: readonly ReachabilityNpcLike[];
  scheduledNpcIds: ReadonlySet<string>;
  prologueNodeId?: string;
  /** Quests activated outside the narrative graph (e.g. CinematicTimelineRunner). */
  cinematicQuestIds?: readonly string[];
}

export interface QuestReachabilityReport {
  reachableIds: ReadonlySet<string>;
  unreachableIds: readonly string[];
}

function collectEdges(
  registry: Readonly<Record<string, ReachabilityNodeLike>>,
): Map<string, { nexts: string[]; triggersQuests: string[] }> {
  const map = new Map<string, { nexts: string[]; triggersQuests: string[] }>();
  for (const [id, node] of Object.entries(registry)) {
    const nexts: string[] = [];
    const triggersQuests: string[] = [];
    // Node-mount effects: StoryRenderer/DialogueRenderer apply node.effects on
    // visit, so triggerQuest + visitStoryNode there are live activation paths
    // (e.g. poetry_broadcast fires from act4_broadcast_execute node effects).
    if (node.effects) {
      for (const fx of node.effects) {
        if (fx.type === 'triggerQuest' && typeof fx.questId === 'string') {
          triggersQuests.push(fx.questId);
        }
        if (fx.type === 'visitStoryNode' && typeof fx.nodeId === 'string') {
          nexts.push(fx.nodeId);
        }
      }
    }
    for (const choice of node.choices ?? []) {
      if (choice.next) nexts.push(choice.next);
      for (const fx of choice.effects ?? []) {
        if (fx.type === 'triggerQuest' && typeof fx.questId === 'string') {
          triggersQuests.push(fx.questId);
        }
        if (fx.type === 'visitStoryNode' && typeof fx.nodeId === 'string') {
          nexts.push(fx.nodeId);
        }
      }
    }
    map.set(id, { nexts, triggersQuests });
  }
  return map;
}

export function computeQuestReachability(deps: QuestReachabilityDeps): QuestReachabilityReport {
  const {
    quests,
    storyNodes,
    dialogueNodes,
    zones,
    hubIds,
    npcDefinitions,
    scheduledNpcIds,
    prologueNodeId,
    cinematicQuestIds,
  } = deps;

  const storyEdges = collectEdges(storyNodes);
  const dialogueEdges = collectEdges(dialogueNodes);

  const roots: string[] = [];
  const zoneQuests = new Set<string>();

  for (const npc of npcDefinitions) {
    if (!scheduledNpcIds.has(npc.id)) continue;
    if (npc.dialogueNodeId && dialogueEdges.has(npc.dialogueNodeId)) {
      roots.push(npc.dialogueNodeId);
    }
    if (npc.returnDialogueNodeId && dialogueEdges.has(npc.returnDialogueNodeId)) {
      roots.push(npc.returnDialogueNodeId);
    }
    for (const milestone of npc.relationMilestones ?? []) {
      if (milestone.dialogueNodeId && dialogueEdges.has(milestone.dialogueNodeId)) {
        roots.push(milestone.dialogueNodeId);
      }
    }
  }

  for (const zone of zones) {
    if (zone.linkedDialogueNodeId && dialogueEdges.has(zone.linkedDialogueNodeId)) {
      roots.push(zone.linkedDialogueNodeId);
    }
    if (zone.linkedStoryNodeId && storyEdges.has(zone.linkedStoryNodeId)) {
      roots.push(zone.linkedStoryNodeId);
    }
    if (zone.linkedQuestId) zoneQuests.add(zone.linkedQuestId);
    // Runtime: TriggerZone interactions apply effects (applyEffects) —
    // triggerQuest in a zone's effects activates the quest on interaction
    // (e.g. solnysh_wine_closet → solnysh_roof_wine).
    for (const fx of zone.effects ?? []) {
      if (fx.type === 'triggerQuest' && typeof fx.questId === 'string') {
        zoneQuests.add(fx.questId);
      }
    }
  }

  for (const hubId of hubIds) {
    if (storyEdges.has(hubId)) roots.push(hubId);
  }
  if (prologueNodeId && storyEdges.has(prologueNodeId)) {
    roots.push(prologueNodeId);
  }

  const visited = new Set<string>();
  const queue = [...roots];
  const activatedQuests = new Set<string>();

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = storyEdges.get(id) ?? dialogueEdges.get(id);
    if (!node) continue;

    for (const questId of node.triggersQuests) activatedQuests.add(questId);
    queue.push(...node.nexts);
  }

  const cinematic = new Set(cinematicQuestIds ?? []);
  const unreachableIds = quests
    .filter((q) => !activatedQuests.has(q.id) && !zoneQuests.has(q.id) && !cinematic.has(q.id))
    .map((q) => q.id);

  return { reachableIds: activatedQuests, unreachableIds };
}
