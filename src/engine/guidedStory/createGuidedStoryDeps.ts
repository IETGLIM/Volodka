import { findNpcById, getQuestDefinitions, getStoryNodes, isNarrativeGameDataLoaded } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  getGameSnapshot,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher';
import { areQuestDependenciesMet } from '@/shared/quest/questDependencies';
import type { QuestStatus } from '@/shared/types/state/quest';
import { getGuidedStoryPathConfig } from '@/engine/guidedStory/guidedStoryPath';
import { createSnapshotStoryGraphAccess } from '@/engine/guidedStory/guidedStoryQuestGraph';
import type {
  GuidedStoryDeps,
  GuidedStorySnapshot,
  GuidanceInfo,
} from '@/engine/guidedStory/guidedStoryTypes';
import { STORY_FLAG_TO_NODE_ID } from '@/data/goldenPath';
import type { QuestDefinition } from '@/shared/types/game';
import { getStoryNodeSceneId as getStoryNodeSceneIdFromShared } from '@/shared/story/getStoryNodeSceneId';

export function toGuidedStorySnapshot(store: GameStoreSnapshot): GuidedStorySnapshot {
  return {
    visitedNodes: store.playerState.visitedNodes,
    currentAct: store.playerState.progression.currentAct,
    flags: store.playerState.flags,
    quests: store.quests.map((q) => ({
      questId: q.questId,
      status: q.status,
      objectives: q.objectives,
    })),
    activeTTLFlagKeys: Object.keys(store.activeTTLFlags)
      .filter((key) => key in STORY_FLAG_TO_NODE_ID)
      .sort(),
  };
}

/** Live snapshot for GuidedStoryManager (top-level to avoid tsx __name injection). */
export function readGuidedStorySnapshot(): GuidedStorySnapshot {
  return toGuidedStorySnapshot(getGameSnapshot());
}

function advanceStoryAct(): void {
  dispatchGameAction({ type: 'story/advanceAct' });
}

function activateStoryQuest(questId: string): void {
  dispatchGameAction({ type: 'quest/activate', questId });
}

function emitStoryActTransition(payload: {
  fromAct: number;
  toAct: number;
  chapterTitle: string;
}): void {
  eventBus.emit('story:act_transition', payload);
}

function emitStoryGuidanceUpdate(guidance: GuidanceInfo): void {
  eventBus.emit('story:guidance_update', guidance);
}

function emitStoryQuestAvailable(payload: {
  questId: string;
  questTitle: string;
  questType: QuestDefinition['questType'];
  npcId?: string;
}): void {
  eventBus.emit('story:quest_available', payload);
}

function emitStoryQuestChainUnlock(payload: {
  completedQuestId: string;
  completedQuestTitle: string;
  nextQuestId: string;
  nextQuestTitle: string;
  nextQuestType: QuestDefinition['questType'];
  npcId?: string;
  actNumber: number;
}): void {
  eventBus.emit('story:quest_chain_unlock', payload);
}

export function createDefaultGuidedStoryDeps(): GuidedStoryDeps {
  return {
    getSnapshot: readGuidedStorySnapshot,
    path: getGuidedStoryPathConfig(),
    npc: { findNpcById },
    quests: {
      areDependenciesMet: (questId) => {
        const snapshot = readGuidedStorySnapshot();
        const result = areQuestDependenciesMet(
          questId,
          snapshot.quests.map((q) => ({
            questId: q.questId,
            status: q.status as QuestStatus,
            objectives: q.objectives,
            startedAtTime: 0,
          })),
          (id) => getQuestDefinitions().find((d) => d.id === id),
        );
        return { met: result.met };
      },
    },
    graph: createSnapshotStoryGraphAccess(readGuidedStorySnapshot),
    actions: {
      advanceAct: advanceStoryAct,
      activateQuest: activateStoryQuest,
    },
    events: {
      emitActTransition: emitStoryActTransition,
      emitGuidanceUpdate: emitStoryGuidanceUpdate,
      emitQuestAvailable: emitStoryQuestAvailable,
      emitQuestChainUnlock: emitStoryQuestChainUnlock,
    },
  };
}

export { getStoryNodeSceneIdFromShared as getStoryNodeSceneId };
