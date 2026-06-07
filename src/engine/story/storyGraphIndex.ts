/* ─── Story graph + quest linkage indices (lazy build, incremental pack sync) ─── */

import { buildStorySpineIndex } from '@/engine/story/deriveGoldenPath';
import {
  invalidateGuidedStoryPathConfig,
  getResolvedQuestSpine,
  getResolvedStorySpine,
} from '@/engine/guidedStory/guidedStoryPath';
import { getStoryNodes, getQuestDefinitions } from '@/data/gameDataLoader';
import type { QuestDefinition } from '@/shared/types/game';
import {
  isStoryGraphEdge,
  STORY_GRAPH_TRAVERSAL_MAX_HOPS,
} from '@/engine/story/storyGraphTraversal';

const EMPTY_SET: ReadonlySet<string> = new Set();
const EMPTY_QUEST_LIST: readonly QuestDefinition[] = [];
const EMPTY_NODE_LIST: readonly string[] = [];

export interface StoryGraphIndex {
  readonly parents: ReadonlyMap<string, readonly string[]>;
  readonly descendants: ReadonlyMap<string, ReadonlySet<string>>;
  readonly questsByLinkedNode: ReadonlyMap<string, readonly QuestDefinition[]>;
  readonly questById: ReadonlyMap<string, QuestDefinition>;
  readonly questLinkedNodes: ReadonlyMap<string, readonly string[]>;
  readonly spineQuestIds: ReadonlySet<string>;
  readonly storySpineIndex: ReadonlyMap<string, number>;
  readonly questSpineIndex: ReadonlyMap<string, number>;
}

type StoryGraphIndexMutable = {
  parents: Map<string, readonly string[]>;
  descendants: Map<string, ReadonlySet<string>>;
  questsByLinkedNode: Map<string, QuestDefinition[]>;
  questById: Map<string, QuestDefinition>;
  questLinkedNodes: Map<string, readonly string[]>;
  spineQuestIds: Set<string>;
  storySpineIndex: Map<string, number>;
  questSpineIndex: Map<string, number>;
};

type StoryNodeLike = { choices?: { next?: string | null }[] };

let cachedIndex: StoryGraphIndexMutable | null = null;
/** Node ids already merged into cachedIndex (subset of getStoryNodes() keys). */
let indexedStoryNodeIds = new Set<string>();
/** Outgoing edges — maintained for incremental descendant updates. */
let childrenByNode = new Map<string, readonly string[]>();

function collectQuestLinkedNodes(def: QuestDefinition): readonly string[] {
  const nodes: string[] = [];
  if (def.linkedStoryNodeId) nodes.push(def.linkedStoryNodeId);
  if (def.linkedStoryNodeIds) nodes.push(...def.linkedStoryNodeIds);
  return nodes;
}

function appendUnique(list: readonly string[] | undefined, value: string): readonly string[] {
  if (list?.includes(value)) return list;
  return list ? [...list, value] : [value];
}

function addStoryGraphEdge(
  parentId: string,
  childId: string,
  parents: Map<string, readonly string[]>,
  children: Map<string, readonly string[]>,
): void {
  parents.set(childId, appendUnique(parents.get(childId), parentId));
  children.set(parentId, appendUnique(children.get(parentId), childId));
  if (!children.has(childId)) children.set(childId, []);
}

function ingestNodeEdges(
  nodeId: string,
  node: StoryNodeLike,
  parents: Map<string, readonly string[]>,
  children: Map<string, readonly string[]>,
): void {
  if (!children.has(nodeId)) children.set(nodeId, []);

  for (const choice of node.choices ?? []) {
    const next = choice.next;
    if (!next || !isStoryGraphEdge(nodeId, next)) continue;
    addStoryGraphEdge(nodeId, next, parents, children);
  }
}

function buildChildrenAndParents(storyNodes: Record<string, StoryNodeLike>): {
  parents: Map<string, readonly string[]>;
  children: Map<string, readonly string[]>;
} {
  const parents = new Map<string, readonly string[]>();
  const children = new Map<string, readonly string[]>();

  for (const [nodeId, node] of Object.entries(storyNodes)) {
    ingestNodeEdges(nodeId, node, parents, children);
  }

  return { parents, children };
}

/** BFS descendants from a single node using pre-built children adjacency. */
function computeDescendantsForNode(
  startId: string,
  children: ReadonlyMap<string, readonly string[]>,
): ReadonlySet<string> {
  const reachable = new Set<string>();
  const queue = [...(children.get(startId) ?? [])];
  let head = 0;

  while (head < queue.length && reachable.size < STORY_GRAPH_TRAVERSAL_MAX_HOPS) {
    const current = queue[head++]!;
    if (current === startId || reachable.has(current)) continue;
    reachable.add(current);
    const nextChildren = children.get(current);
    if (nextChildren) queue.push(...nextChildren);
  }

  return reachable;
}

/** BFS descendants from each node using pre-built children adjacency. */
function buildDescendantsIndex(
  nodeIds: readonly string[],
  children: ReadonlyMap<string, readonly string[]>,
): Map<string, ReadonlySet<string>> {
  const descendants = new Map<string, ReadonlySet<string>>();

  for (const startId of nodeIds) {
    descendants.set(startId, computeDescendantsForNode(startId, children));
  }

  return descendants;
}

function collectAncestors(
  startIds: Iterable<string>,
  parents: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const ancestors = new Set<string>();

  for (const startId of startIds) {
    let frontier = [startId];
    let depth = 0;

    while (frontier.length > 0 && depth < STORY_GRAPH_TRAVERSAL_MAX_HOPS) {
      const nextFrontier: string[] = [];
      for (const current of frontier) {
        for (const parent of parents.get(current) ?? []) {
          if (ancestors.has(parent)) continue;
          ancestors.add(parent);
          nextFrontier.push(parent);
        }
      }
      frontier = nextFrontier;
      depth += 1;
    }
  }

  return ancestors;
}

function refreshSpineIndices(index: StoryGraphIndexMutable): void {
  index.storySpineIndex = new Map(buildStorySpineIndex(getResolvedStorySpine()));

  const questSpine = getResolvedQuestSpine();
  const questSpineIndex = new Map<string, number>();
  for (let i = 0; i < questSpine.length; i++) {
    questSpineIndex.set(questSpine[i], i);
  }
  index.questSpineIndex = questSpineIndex;
  index.spineQuestIds = new Set(questSpine);
}

function buildQuestIndices(): Pick<
  StoryGraphIndexMutable,
  'questsByLinkedNode' | 'questById' | 'questLinkedNodes' | 'spineQuestIds' | 'questSpineIndex'
> {
  const questsByLinkedNode = new Map<string, QuestDefinition[]>();
  const questById = new Map<string, QuestDefinition>();
  const questLinkedNodes = new Map<string, readonly string[]>();
  const spineQuestIds = new Set<string>(getResolvedQuestSpine());
  const questSpineIndex = new Map<string, number>();

  for (let i = 0; i < getResolvedQuestSpine().length; i++) {
    questSpineIndex.set(getResolvedQuestSpine()[i], i);
  }

  for (const def of getQuestDefinitions()) {
    questById.set(def.id, def);
    const linked = collectQuestLinkedNodes(def);
    questLinkedNodes.set(def.id, linked);
    for (const nodeId of linked) {
      const list = questsByLinkedNode.get(nodeId) ?? [];
      list.push(def);
      questsByLinkedNode.set(nodeId, list);
    }
  }

  return {
    questsByLinkedNode,
    questById,
    questLinkedNodes,
    spineQuestIds,
    questSpineIndex,
  };
}

function buildStoryGraphIndex(): StoryGraphIndexMutable {
  const storyNodes = getStoryNodes();
  const nodeIds = Object.keys(storyNodes);
  const { parents, children } = buildChildrenAndParents(storyNodes);
  const descendants = buildDescendantsIndex(nodeIds, children);
  const questIndices = buildQuestIndices();

  indexedStoryNodeIds = new Set(nodeIds);
  childrenByNode = children;

  const storySpineIndex = new Map(buildStorySpineIndex(getResolvedStorySpine()));

  return {
    parents,
    descendants,
    ...questIndices,
    storySpineIndex,
  };
}

function syncNewStoryNodesIntoIndex(): void {
  if (!cachedIndex) return;

  const storyNodes = getStoryNodes();
  const newNodeIds: string[] = [];
  for (const nodeId of Object.keys(storyNodes)) {
    if (!indexedStoryNodeIds.has(nodeId)) newNodeIds.push(nodeId);
  }

  if (newNodeIds.length === 0) {
    refreshSpineIndices(cachedIndex);
    return;
  }

  const { parents, descendants } = cachedIndex;

  for (const nodeId of newNodeIds) {
    indexedStoryNodeIds.add(nodeId);
    const node = storyNodes[nodeId];
    if (node) ingestNodeEdges(nodeId, node, parents, childrenByNode);
  }

  const affected = new Set<string>(newNodeIds);
  for (const ancestor of collectAncestors(newNodeIds, parents)) {
    affected.add(ancestor);
  }

  for (const startId of affected) {
    descendants.set(startId, computeDescendantsForNode(startId, childrenByNode));
  }

  refreshSpineIndices(cachedIndex);
}

/**
 * Called when narrative packs merge new story nodes — extends the cached index in place
 * instead of discarding it. No-op until the first {@link getStoryGraphIndex} build.
 */
export function syncStoryGraphIndexAfterNarrativeChange(): void {
  syncNewStoryNodesIntoIndex();
}

/** Lazily built once per session; extended incrementally as acts load. */
export function getStoryGraphIndex(): StoryGraphIndex {
  if (!cachedIndex) cachedIndex = buildStoryGraphIndex();
  else syncNewStoryNodesIntoIndex();
  return cachedIndex;
}

/** Full reset — HMR, session reset, or tests. Quest indices rebuilt on next access. */
export function invalidateStoryGraphIndex(): void {
  cachedIndex = null;
  indexedStoryNodeIds = new Set();
  childrenByNode = new Map();
  invalidateGuidedStoryPathConfig();
}

/** Direct parent node ids for a story node (built from choice graph — no manual cache). */
export function getStoryNodeParents(nodeId: string): readonly string[] {
  return getStoryGraphIndex().parents.get(nodeId) ?? [];
}

/** Ancestor node ids up to `maxDepth` hops (breadth-first, no array shift). */
export function getStoryAncestorIds(nodeId: string, maxDepth = 8): readonly string[] {
  const { parents } = getStoryGraphIndex();
  const ancestors: string[] = [];
  const seen = new Set<string>();
  let frontier = [nodeId];
  let depth = 0;

  while (frontier.length > 0 && depth < maxDepth) {
    const nextFrontier: string[] = [];
    for (const current of frontier) {
      for (const parent of parents.get(current) ?? []) {
        if (seen.has(parent)) continue;
        if (ancestors.length >= STORY_GRAPH_TRAVERSAL_MAX_HOPS) break;
        seen.add(parent);
        ancestors.push(parent);
        nextFrontier.push(parent);
      }
    }
    frontier = nextFrontier;
    depth += 1;
  }

  return ancestors;
}

export function getStoryDescendants(nodeId: string): ReadonlySet<string> {
  return getStoryGraphIndex().descendants.get(nodeId) ?? EMPTY_SET;
}

export function getQuestsForLinkedStoryNode(nodeId: string): readonly QuestDefinition[] {
  return getStoryGraphIndex().questsByLinkedNode.get(nodeId) ?? EMPTY_QUEST_LIST;
}

export function getQuestDefinitionById(questId: string): QuestDefinition | undefined {
  return getStoryGraphIndex().questById.get(questId);
}

export function getQuestLinkedStoryNodes(questId: string): readonly string[] {
  return getStoryGraphIndex().questLinkedNodes.get(questId) ?? EMPTY_NODE_LIST;
}

export function questLinksStoryNode(def: QuestDefinition, nodeId: string): boolean {
  if (def.linkedStoryNodeId === nodeId) return true;
  return def.linkedStoryNodeIds?.includes(nodeId) ?? false;
}
