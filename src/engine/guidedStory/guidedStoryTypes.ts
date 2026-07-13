import type { QuestDefinition, QuestObjective } from '@/shared/types/game';
import type { ActTransition } from '@/data/goldenPath';

export interface GuidedStoryQuestState {
  questId: string;
  status: string;
  objectives: Record<string, boolean>;
}

/** Minimal store slice — inject in tests without gameStore. */
export interface GuidedStorySnapshot {
  visitedNodes: readonly string[];
  currentAct: number;
  flags: Readonly<Record<string, boolean>>;
  collectedPoems: readonly string[];
  quests: readonly GuidedStoryQuestState[];
  activeTTLFlagKeys: readonly string[];
}

export interface GuidedStoryPathConfig {
  readonly storySpine: readonly string[];
  readonly questSpine: readonly string[];
  readonly branchHints: Readonly<Record<string, string>>;
  readonly actTransitions: readonly ActTransition[];
  readonly actChapterTitles: Readonly<Record<number, string>>;
  readonly storyNodeToSceneLabel: Readonly<Record<string, string>>;
  readonly storyNodeObjectiveType: Readonly<Record<string, GuidedStoryObjectiveType>>;
  readonly storyFlagToNodeId: Readonly<Record<string, string>>;
  getNpcIdForStoryNode(nodeId: string): string | undefined;
}

export type GuidedStoryObjectiveType =
  'talk_to_npc' | 'visit_location' | 'complete_quest' | 'collect_item' | 'make_choice';

export interface GuidedStorySpineState {
  currentStepIndex: number;
  currentQuestSpineIndex: number;
  lastAdvancedToAct: number;
}

import type { SceneId } from '@/shared/types/game';

export interface GuidanceInfo {
  objectiveText: string;
  objectiveType: 'talk_to_npc' | 'visit_location' | 'complete_quest' | 'collect_item' | 'make_choice';
  targetId: string;
  urgency: 'optional' | 'recommended' | 'required';
  actNumber: number;
  chapterTitle: string;
  /** 3D scene the player should travel to for this objective (when known). */
  targetSceneId?: SceneId;
}

export interface GuidedStoryNpcLookup {
  findNpcById(id: string): { name: string } | undefined;
}

export interface GuidedStoryQuestRules {
  areDependenciesMet(questId: string): { met: boolean };
}

export interface GuidedStoryGraphAccess {
  findQuestForNode(
    nodeId: string,
    questSpineIndex: number,
  ): QuestDefinition | null;
  getQuestDefinitionById(questId: string): QuestDefinition | undefined;
}

export interface GuidedStoryActions {
  advanceAct(): void;
  activateQuest(questId: string): void;
}

export interface GuidedStoryEvents {
  emitActTransition(payload: { fromAct: number; toAct: number; chapterTitle: string }): void;
  emitGuidanceUpdate(guidance: GuidanceInfo): void;
  emitQuestAvailable(payload: {
    questId: string;
    questTitle: string;
    questType: QuestDefinition['questType'];
    npcId?: string;
  }): void;
  emitQuestChainUnlock(payload: {
    completedQuestId: string;
    completedQuestTitle: string;
    nextQuestId: string;
    nextQuestTitle: string;
    nextQuestType: QuestDefinition['questType'];
    npcId?: string;
    actNumber: number;
  }): void;
  emitPlayerLost(payload: { hint: string; actNumber: number }): void;
}

/** Injectable ports — defaults wire production store + EventBus. */
export interface GuidedStoryDeps {
  getSnapshot(): GuidedStorySnapshot;
  path: GuidedStoryPathConfig;
  npc: GuidedStoryNpcLookup;
  quests: GuidedStoryQuestRules;
  graph: GuidedStoryGraphAccess;
  actions: GuidedStoryActions;
  events: GuidedStoryEvents;
}

export type { QuestDefinition, QuestObjective };
