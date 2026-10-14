import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { NARRATIVE_EXPANSION_TRIGGER_ZONES } from '@/data/narrativeExpansionTriggerZones';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';
import { STORY_NODE_ALIASES } from '@/data/goldenPath';
import type { StoryNode } from '@/shared/types/game';
import type { DialogueNode } from '@/shared/types/definitions/dialogue';

/**
 * Story reachability analysis (P2-7) — closes the gap between "no broken
 * next references" and "every authored node can actually be reached".
 *
 * Runtime delivery channels (mirrors the engine, not just the graph):
 *  1. choices.next chains — story graph + dialogue graph bridge
 *     (literal id first; STORY_NODE_ALIASES only as back-compat fallback
 *     for ids that no longer exist — the runtime resolves literally).
 *  2. visitStoryNode effects — story & dialogue choices/hooks continue the
 *     narrative through a story node (narrativeChoiceExecutor).
 *  3. Scene explore hubs — hub nodes entered via physical scene enter
 *     (promoted-to-hub from entryNodeIds) or via an explicit choice.
 *  4. Trigger zones — linkedStoryNodeId examination zones.
 *  5. Quest definitions — linkedStoryNodeId / linkedStoryNodeIds.
 *  6. Exploration dialogues — `explore_*` nodes opened by physical object
 *     inspection (EXPLORATION_DIALOGUE_NODES), which may then visitStoryNode.
 *
 * A story node is classified:
 *  - `core`        — reachable through the pure choices graph from the
 *                    story entry roots ('start' / skip-prologue);
 *  - `external`    — reachable ONLY via a delivery channel (hub / zone /
 *                    quest / exploration entry) — playable, but off the
 *                    pure choices graph;
 *  - `unreachable` — no delivery channel leads to it: dead content.
 *
 * Broken references (a channel pointing at an id that does not exist,
 * even after alias fallback) are reported separately — always bugs.
 */

export interface StoryReachabilityInput {
  readonly storyNodes: Record<string, StoryNode>;
  readonly dialogueNodes?: Record<string, DialogueNode>;
  readonly storyNodeAliases?: Readonly<Record<string, string>>;
}

export type ReachabilityClass = 'core' | 'external' | 'unreachable';

export interface ExternalEntry {
  /** Delivery channel id, e.g. `zone:room_mirror_zone`, `hub:explore_mode#0`. */
  readonly channelId: string;
  readonly kind: 'hub' | 'zone' | 'quest' | 'exploration';
  readonly targetNodeId: string;
}

export interface BrokenRef {
  readonly channelId: string;
  readonly kind:
    | 'story-choice'
    | 'dialogue-choice'
    | 'visit-effect'
    | 'hub'
    | 'zone'
    | 'quest'
    | 'exploration';
  readonly fromId: string;
  readonly target: string;
}

export interface StoryReachabilityReport {
  readonly totalStoryNodes: number;
  readonly coreReachable: readonly string[];
  readonly externalOnly: readonly string[];
  readonly unreachable: readonly string[];
  readonly brokenRefs: readonly BrokenRef[];
  readonly externalEntries: readonly ExternalEntry[];
}

const STORY_ENTRY_ROOTS: readonly string[] = ['start', 'skip_prologue_intro'];

/** Exploration dialogues are inspected physically in 3D scenes. */
const EXPLORATION_DIALOGUE_PREFIX = 'explore_';

function resolveTarget(
  raw: string,
  existingIds: ReadonlySet<string>,
  aliases: Readonly<Record<string, string>>,
): { resolved: string; ok: boolean } {
  if (existingIds.has(raw)) return { resolved: raw, ok: true };
  const aliased = aliases[raw] ?? raw;
  if (existingIds.has(aliased)) return { resolved: aliased, ok: true };
  return { resolved: aliased, ok: false };
}

/** Collect all delivery-channel entry points into the story graph. */
export function collectExternalEntries(
  storyNodeIds: ReadonlySet<string>,
  dialogueNodeIds: ReadonlySet<string>,
): { entries: ExternalEntry[]; broken: BrokenRef[] } {
  const entries: ExternalEntry[] = [];
  const broken: BrokenRef[] = [];

  const pushEntry = (
    channelId: string,
    kind: ExternalEntry['kind'],
    targetNodeId: string,
  ): void => {
    const { resolved, ok } = resolveTarget(targetNodeId, storyNodeIds, STORY_NODE_ALIASES);
    if (!ok) {
      broken.push({ channelId, kind, fromId: channelId, target: targetNodeId });
      return;
    }
    entries.push({ channelId, kind, targetNodeId: resolved });
  };

  // 1. Trigger zones — examination zones wired to story nodes.
  const zones = [...TRIGGER_ZONES, ...NARRATIVE_EXPANSION_TRIGGER_ZONES];
  for (const zone of zones) {
    const linked = (zone as { linkedStoryNodeId?: string }).linkedStoryNodeId;
    if (linked) pushEntry(`zone:${zone.id}`, 'zone', linked);
  }

  // 2. Quests — linked story nodes.
  for (const quest of QUEST_DEFINITIONS) {
    if (quest.linkedStoryNodeId) {
      pushEntry(`quest:${quest.id}`, 'quest', quest.linkedStoryNodeId);
    }
    quest.linkedStoryNodeIds?.forEach((nodeId, i) =>
      pushEntry(`quest:${quest.id}#${i}`, 'quest', nodeId),
    );
  }

  // 3. Exploration dialogues — physically inspected in 3D scenes.
  for (const id of dialogueNodeIds) {
    if (id.startsWith(EXPLORATION_DIALOGUE_PREFIX)) {
      entries.push({ channelId: `exploration:${id}`, kind: 'exploration', targetNodeId: id });
    }
  }

  return { entries, broken };
}

/** Pure BFS over adjacency, seeded with the given roots. */
function bfs(
  adjacency: ReadonlyMap<string, readonly string[]>,
  roots: readonly string[],
  seen: Set<string>,
): void {
  const queue = [...roots];
  for (const root of queue) seen.add(root);
  while (queue.length > 0) {
    const id = queue.pop() as string;
    for (const next of adjacency.get(id) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
}

/** visitStoryNode effect ids from an effects list (hooks with next:null). */
function collectVisitTargets(
  effects: readonly { type?: string; nodeId?: string }[] | undefined,
  out: string[],
): void {
  if (!effects) return;
  for (const fx of effects) {
    if (fx.type === 'visitStoryNode' && typeof fx.nodeId === 'string' && fx.nodeId) {
      out.push(fx.nodeId);
    }
  }
}

function pushVisitEdges(
  fromId: string,
  effects: readonly { type?: string; nodeId?: string }[] | undefined,
  edges: string[],
  pushEdge: (from: string, to: string, kind: BrokenRef['kind']) => void,
): void {
  if (!effects) return;
  const targets: string[] = [];
  collectVisitTargets(effects, targets);
  for (const target of targets) {
    pushEdge(fromId, target, 'visit-effect');
    edges.push(target);
  }
}

/**
 * BFS over story + dialogue choice graphs (+ visitStoryNode effect edges).
 * Returns per-id reachability classes for every story node plus broken refs.
 */
export function computeStoryReachability(
  input: StoryReachabilityInput,
): StoryReachabilityReport {
  const { storyNodes } = input;
  const dialogueNodes = input.dialogueNodes ?? DIALOGUE_NODES;
  const aliases = input.storyNodeAliases ?? STORY_NODE_ALIASES;

  const storyIds = new Set(Object.keys(storyNodes));
  const dialogueIds = new Set(Object.keys(dialogueNodes));
  const existingIds = new Set([...storyIds, ...dialogueIds]);

  const broken: BrokenRef[] = [];
  const adjacency = new Map<string, string[]>();

  const pushEdge = (
    from: string,
    to: string,
    kind: BrokenRef['kind'],
    channelId = 'graph',
  ): void => {
    const { resolved, ok } = resolveTarget(to, existingIds, aliases);
    if (ok) {
      const list = adjacency.get(from);
      if (list) list.push(resolved);
      else adjacency.set(from, [resolved]);
    } else {
      broken.push({ channelId, kind, fromId: from, target: to });
    }
  };

  const ensureList = (from: string): string[] => {
    const list = adjacency.get(from);
    if (list) return list;
    const fresh: string[] = [];
    adjacency.set(from, fresh);
    return fresh;
  };

  for (const [id, node] of Object.entries(storyNodes)) {
    const edges = ensureList(id);
    for (const choice of node.choices) {
      if (choice.next !== null) {
        pushEdge(id, choice.next, 'story-choice');
      }
      pushVisitEdges(id, choice.effects as typeof choice.effects, edges, pushEdge);
    }
  }

  for (const [id, node] of Object.entries(dialogueNodes)) {
    const edges = ensureList(id);
    for (const choice of node.choices) {
      if (choice.next !== null) {
        pushEdge(id, choice.next, 'dialogue-choice');
      }
      pushVisitEdges(id, choice.effects, edges, pushEdge);
    }
  }

  const { entries, broken: brokenEntries } = collectExternalEntries(storyIds, dialogueIds);
  broken.push(...brokenEntries);

  // 1) Core — pure story-graph reachability from the entry roots.
  const coreSet = new Set<string>();
  bfs(adjacency, STORY_ENTRY_ROOTS.filter((r) => storyIds.has(r)), coreSet);

  // 2) External seeds — hub entries (entryNodeIds), zones, quests,
  //    exploration dialogues.
  const seeds: string[] = [];
  for (const hub of SCENE_EXPLORE_HUB_DEFS) {
    hub.entryNodeIds.forEach((nodeId, i) => {
      const { resolved, ok } = resolveTarget(nodeId, storyIds, aliases);
      if (ok) seeds.push(resolved);
      else broken.push({ channelId: `hub:${hub.hubId}#${i}`, kind: 'hub', fromId: hub.hubId, target: nodeId });
    });
  }
  for (const entry of entries) {
    // Exploration dialogues seed the DIALOGUE graph, not the story graph.
    if (entry.kind === 'exploration') {
      if (dialogueIds.has(entry.targetNodeId)) {
        adjacency.set(entry.targetNodeId, adjacency.get(entry.targetNodeId) ?? []);
        seeds.push(entry.targetNodeId);
      }
      continue;
    }
    seeds.push(entry.targetNodeId);
  }
  const externalSeeds = [...new Set(seeds)].filter((id) => !coreSet.has(id));
  const fullSet = new Set(coreSet);
  bfs(adjacency, externalSeeds, fullSet);

  // 3) Hub-entry promotion — a hub node is reachable when ANY of its
  //    entryNodeIds is reachable (physical scene enter promotes to hub).
  const promoted: string[] = [];
  for (const hub of SCENE_EXPLORE_HUB_DEFS) {
    if (fullSet.has(hub.hubId) || !storyIds.has(hub.hubId)) continue;
    const reachableEntry = hub.entryNodeIds.some((nodeId) => {
      const { resolved, ok } = resolveTarget(nodeId, storyIds, aliases);
      return ok && fullSet.has(resolved);
    });
    if (reachableEntry) promoted.push(hub.hubId);
  }
  if (promoted.length > 0) {
    bfs(adjacency, promoted.filter((id) => !fullSet.has(id)), fullSet);
  }

  const coreReachable: string[] = [];
  const externalOnly: string[] = [];
  const unreachable: string[] = [];
  for (const id of storyIds) {
    if (coreSet.has(id)) coreReachable.push(id);
    else if (fullSet.has(id)) externalOnly.push(id);
    else unreachable.push(id);
  }

  return {
    totalStoryNodes: storyIds.size,
    coreReachable: coreReachable.sort(),
    externalOnly: externalOnly.sort(),
    unreachable: unreachable.sort(),
    brokenRefs: broken,
    externalEntries: entries,
  };
}
