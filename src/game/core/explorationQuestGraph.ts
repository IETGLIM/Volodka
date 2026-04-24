/**
 * Графовые побочные квесты обхода: узлы (состояния) и рёбра (триггеры + условия + действия).
 * Текущий узел — ровно один флаг `qg_<graphId>__<nodeId>` среди перечисленных в `graph.nodes`.
 */
import type { InteractionContext } from '@/core/interaction/interactionContext';
import { rememberExplorationQuestCompleted } from '@/core/memory/MemoryEngine';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/state/gameStore';

export type QuestGraphNodeId = string;

export type ExplorationQuestTrigger =
  | { kind: 'interaction'; interactionId: string }
  | { kind: 'wire_hack_result'; success: boolean };

export interface QuestGraphRuntimeApi {
  questId: string;
  graphId: string;
  ctx: InteractionContext;
  currentNode: QuestGraphNodeId;
  isQuestCompleted(): boolean;
  isQuestActive(): boolean;
  progress(objectiveId: string): number;
  objectiveTarget(objectiveId: string): number;
  activateQuest(): void;
  incrementObjective(objectiveId: string): void;
  completeQuest(): void;
  rememberCompletion(synopsis: string): void;
  emitUi(text: string): void;
}

function nodeFlag(graphId: string, node: QuestGraphNodeId): string {
  return `qg_${graphId}__${node}`;
}

export function readQuestGraphNode(graph: ExplorationQuestGraph): QuestGraphNodeId {
  const flags = useGameStore.getState().playerState.flags;
  for (const n of graph.nodes) {
    if (flags[nodeFlag(graph.id, n)]) return n;
  }
  return graph.initialNode;
}

export function persistQuestGraphNode(graph: ExplorationQuestGraph, node: QuestGraphNodeId): void {
  const { unsetFlag, setFlag } = useGameStore.getState();
  for (const n of graph.nodes) {
    unsetFlag(nodeFlag(graph.id, n));
  }
  setFlag(nodeFlag(graph.id, node));
}

export interface ExplorationQuestEdge {
  id: string;
  from: QuestGraphNodeId;
  to: QuestGraphNodeId;
  trigger: ExplorationQuestTrigger;
  when?: (api: QuestGraphRuntimeApi) => boolean;
  run: (api: QuestGraphRuntimeApi) => void;
}

export interface ExplorationQuestGraph {
  id: string;
  questId: string;
  initialNode: QuestGraphNodeId;
  /** Все узлы графа (для сброса флагов при смене состояния). */
  nodes: QuestGraphNodeId[];
  edges: ExplorationQuestEdge[];
}

function buildApi(graph: ExplorationQuestGraph, ctx: InteractionContext): QuestGraphRuntimeApi | null {
  const {
    activateQuest,
    incrementQuestObjective,
    completeQuest,
    getQuestProgress,
    isQuestActive,
    isQuestCompleted,
  } = ctx;
  if (!activateQuest || !incrementQuestObjective || !completeQuest || !getQuestProgress || !isQuestActive) {
    return null;
  }

  const questId = graph.questId;
  const currentNode = readQuestGraphNode(graph);

  return {
    questId,
    graphId: graph.id,
    ctx,
    currentNode,
    isQuestCompleted: () =>
      Boolean(isQuestCompleted?.(questId)) || useGameStore.getState().completedQuestIds.includes(questId),
    isQuestActive: () => isQuestActive(questId),
    progress: (objectiveId: string) => getQuestProgress(questId)[objectiveId] ?? 0,
    objectiveTarget: (objectiveId: string) => {
      const def = QUEST_DEFINITIONS[questId];
      const obj = def?.objectives.find((o) => o.id === objectiveId);
      return obj?.targetValue ?? 1;
    },
    activateQuest: () => {
      if (!isQuestActive(questId)) activateQuest(questId);
    },
    incrementObjective: (objectiveId: string) => {
      incrementQuestObjective(questId, objectiveId);
    },
    completeQuest: () => {
      completeQuest(questId);
    },
    rememberCompletion: (synopsis: string) => {
      const def = QUEST_DEFINITIONS[questId];
      rememberExplorationQuestCompleted(questId, def?.title ?? questId, synopsis);
    },
    emitUi: (text: string) => eventBus.emit('ui:exploration_message', { text }),
  };
}

function triggersEqual(a: ExplorationQuestTrigger, b: ExplorationQuestTrigger): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'interaction' && b.kind === 'interaction') {
    return a.interactionId === b.interactionId;
  }
  if (a.kind === 'wire_hack_result' && b.kind === 'wire_hack_result') {
    return a.success === b.success;
  }
  return false;
}

/**
 * Обрабатывает триггер: рёбра из текущего узла, порядок в массиве — приоритет.
 * @returns true если переход выполнен.
 */
export function dispatchExplorationQuestGraph(
  graph: ExplorationQuestGraph,
  trigger: ExplorationQuestTrigger,
  ctx: InteractionContext,
): boolean {
  const api = buildApi(graph, ctx);
  if (!api) return false;
  if (api.isQuestCompleted()) return false;

  const candidates = graph.edges.filter(
    (e) => e.from === api.currentNode && triggersEqual(e.trigger, trigger),
  );

  for (const edge of candidates) {
    if (edge.when && !edge.when(api)) continue;
    edge.run(api);
    persistQuestGraphNode(graph, edge.to);
    return true;
  }

  return false;
}
