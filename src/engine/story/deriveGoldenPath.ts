/* ─── Derive golden-path spine + guidance from story node graph ─── */

import type { QuestDefinition, StoryNode } from '@/shared/types/game';
import type { GuidedStoryObjectiveType } from '@/engine/guidedStory/guidedStoryTypes';
import { isStoryGraphEdge } from '@/engine/story/storyGraphTraversal';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';

export interface DeriveGoldenPathOptions {
  /** Spine start node (default: `start`). */
  startNodeId?: string;
  /** Fallback spine when `goldenPath` markers are incomplete (migration). */
  fallbackStorySpine?: readonly string[];
  /** Fallback hints keyed by node id. */
  fallbackBranchHints?: Readonly<Record<string, string>>;
  fallbackNpcMap?: Readonly<Record<string, string>>;
  fallbackSceneLabels?: Readonly<Record<string, string>>;
  fallbackObjectiveTypes?: Readonly<Record<string, GuidedStoryObjectiveType>>;
}

export interface AmbiguousGoldenPathNode {
  readonly nodeId: string;
  readonly targets: readonly string[];
}

export interface DerivedGoldenPath {
  storySpine: readonly string[];
  branchHints: Readonly<Record<string, string>>;
  npcByNodeId: Readonly<Record<string, string>>;
  sceneLabelByNodeId: Readonly<Record<string, string>>;
  objectiveTypeByNodeId: Readonly<Record<string, GuidedStoryObjectiveType>>;
  /** Node ids where spine used fallback instead of a goldenPath choice. */
  fallbackSpineSteps: readonly string[];
  /** Nodes on fallback spine with no valid goldenPath outgoing edge (terminal spine end excluded). */
  missingGoldenPathMarkers: readonly string[];
  /** Nodes with 2+ valid goldenPath choices — spine cannot auto-pick. */
  ambiguousGoldenPathNodes: readonly AmbiguousGoldenPathNode[];
}

const DEFAULT_START = 'start';
const MAX_SPINE_HOPS = 512;

type GoldenNextResolution =
  | { kind: 'next'; next: string }
  | { kind: 'none' }
  | { kind: 'ambiguous'; targets: readonly string[] };

const loggedAmbiguousGoldenPath = new Set<string>();

/** Test hook — clear deduped runtime warnings between cases. */
export function resetGoldenPathDerivationWarningsForTests(): void {
  loggedAmbiguousGoldenPath.clear();
}

function resolveGoldenNext(nodeId: string, node: StoryNode): GoldenNextResolution {
  const golden = node.choices.filter(
    (c) => c.goldenPath === true && c.next && isStoryGraphEdge(nodeId, c.next),
  );
  if (golden.length === 1) return { kind: 'next', next: golden[0].next! };
  if (golden.length === 0) return { kind: 'none' };
  return { kind: 'ambiguous', targets: golden.map((c) => c.next!) };
}

export function collectAmbiguousGoldenPathNodes(
  nodes: Record<string, StoryNode>,
): AmbiguousGoldenPathNode[] {
  const ambiguous: AmbiguousGoldenPathNode[] = [];

  for (const [nodeId, node] of Object.entries(nodes)) {
    const resolved = resolveGoldenNext(nodeId, node);
    if (resolved.kind === 'ambiguous') {
      ambiguous.push({ nodeId, targets: resolved.targets });
    }
  }

  return ambiguous;
}

function warnAmbiguousGoldenPathNodes(nodes: readonly AmbiguousGoldenPathNode[]): void {
  if (!import.meta.env?.DEV) return;

  for (const { nodeId, targets } of nodes) {
    if (loggedAmbiguousGoldenPath.has(nodeId)) continue;
    loggedAmbiguousGoldenPath.add(nodeId);
    const targetList = targets.map((target) => `"${target}"`).join(', ');
    console.warn(
      `[deriveGoldenPath] story node "${nodeId}" has ${targets.length} choices marked goldenPath (→ ${targetList}) — spine cannot pick automatically; fix content or rely on fallback spine`,
    );
  }
}

/**
 * Walk story nodes following `choice.goldenPath` edges.
 * Falls back to the next id in `fallbackStorySpine` when a step is unmarked.
 */
export function deriveStorySpine(
  nodes: Record<string, StoryNode>,
  options: DeriveGoldenPathOptions = {},
): { spine: string[]; fallbackSteps: string[]; missingMarkers: string[] } {
  const startId = options.startNodeId ?? DEFAULT_START;
  const fallback = options.fallbackStorySpine ?? [];
  const spine: string[] = [];
  const fallbackSteps: string[] = [];
  const missingMarkers: string[] = [];
  const seen = new Set<string>();

  let current: string | null = startId;

  while (current && !seen.has(current) && spine.length < MAX_SPINE_HOPS) {
    seen.add(current);
    spine.push(current);

    const node = nodes[current];
    if (!node) break;

    const goldenNext = resolveGoldenNext(current, node);
    if (goldenNext.kind === 'next') {
      current = goldenNext.next;
      continue;
    }

    const nodeId = current;
    const hasForwardEdge = node.choices.some((c) => {
      const next = c.next;
      return next != null && isStoryGraphEdge(nodeId, next);
    });
    const manualIdx = fallback.indexOf(current);
    const canFallbackAdvance = manualIdx >= 0 && manualIdx + 1 < fallback.length;
    if (!hasForwardEdge && !canFallbackAdvance) break;

    if (goldenNext.kind === 'none' && canFallbackAdvance) {
      missingMarkers.push(current);
    }
    if (canFallbackAdvance) {
      fallbackSteps.push(current);
      current = fallback[manualIdx + 1]!;
    } else {
      break;
    }
  }

  return { spine, fallbackSteps, missingMarkers };
}

export function deriveBranchHints(
  nodes: Record<string, StoryNode>,
  spine: readonly string[],
  fallback: Readonly<Record<string, string>> = {},
): Record<string, string> {
  const hints: Record<string, string> = { ...fallback };
  for (const nodeId of spine) {
    const hint = nodes[nodeId]?.guidanceHint;
    if (hint) hints[nodeId] = hint;
  }
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.guidanceHint) hints[nodeId] = node.guidanceHint;
  }
  return hints;
}

export function deriveGuidanceMaps(
  nodes: Record<string, StoryNode>,
  fallbackNpc: Readonly<Record<string, string>> = {},
  fallbackSceneLabels: Readonly<Record<string, string>> = {},
  fallbackObjectiveTypes: Readonly<Record<string, GuidedStoryObjectiveType>> = {},
): Pick<DerivedGoldenPath, 'npcByNodeId' | 'sceneLabelByNodeId' | 'objectiveTypeByNodeId'> {
  const npcByNodeId: Record<string, string> = { ...fallbackNpc };
  const sceneLabelByNodeId: Record<string, string> = { ...fallbackSceneLabels };
  const objectiveTypeByNodeId: Record<string, GuidedStoryObjectiveType> = {
    ...fallbackObjectiveTypes,
  };

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.guidanceNpcId) {
      npcByNodeId[nodeId] = resolveCanonicalNpcId(node.guidanceNpcId);
    }
    if (node.guidanceSceneLabel) sceneLabelByNodeId[nodeId] = node.guidanceSceneLabel;
    if (node.guidanceObjectiveType) objectiveTypeByNodeId[nodeId] = node.guidanceObjectiveType;
  }

  return { npcByNodeId, sceneLabelByNodeId, objectiveTypeByNodeId };
}

/** Derive main-quest spine order from `spineOrder` or earliest linked story node index. */
export function deriveQuestSpine(
  quests: readonly QuestDefinition[],
  storySpineIndex: ReadonlyMap<string, number>,
  fallback: readonly string[] = [],
): string[] {
  const mainQuests = quests.filter((q) => q.questType === 'main');
  const withExplicitOrder = mainQuests.filter((q) => q.spineOrder != null);
  if (withExplicitOrder.length > 0) {
    return [...withExplicitOrder]
      .sort((a, b) => (a.spineOrder ?? 999) - (b.spineOrder ?? 999))
      .map((q) => q.id);
  }

  const scored = mainQuests
    .map((q) => {
      const linked = [
        q.linkedStoryNodeId,
        ...(q.linkedStoryNodeIds ?? []),
      ].filter((id): id is string => !!id);
      const indices = linked.map((id) => storySpineIndex.get(id) ?? Number.POSITIVE_INFINITY);
      const idx = indices.length > 0 ? Math.min(...indices) : Number.POSITIVE_INFINITY;
      return { id: q.id, idx };
    })
    .filter((row) => Number.isFinite(row.idx))
    .sort((a, b) => a.idx - b.idx || a.id.localeCompare(b.id));

  if (scored.length > 0) return scored.map((row) => row.id);
  return [...fallback];
}

export function deriveGoldenPath(
  nodes: Record<string, StoryNode>,
  options: DeriveGoldenPathOptions = {},
): DerivedGoldenPath {
  const { spine, fallbackSteps, missingMarkers } = deriveStorySpine(nodes, options);
  const ambiguousGoldenPathNodes = collectAmbiguousGoldenPathNodes(nodes);
  warnAmbiguousGoldenPathNodes(ambiguousGoldenPathNodes);

  const branchHints = deriveBranchHints(nodes, spine, options.fallbackBranchHints);
  const maps = deriveGuidanceMaps(
    nodes,
    options.fallbackNpcMap,
    options.fallbackSceneLabels,
    options.fallbackObjectiveTypes,
  );

  return {
    storySpine: spine,
    branchHints,
    ...maps,
    fallbackSpineSteps: fallbackSteps,
    missingGoldenPathMarkers: missingMarkers,
    ambiguousGoldenPathNodes,
  };
}

export function buildStorySpineIndex(spine: readonly string[]): ReadonlyMap<string, number> {
  const index = new Map<string, number>();
  for (let i = 0; i < spine.length; i++) index.set(spine[i], i);
  return index;
}
