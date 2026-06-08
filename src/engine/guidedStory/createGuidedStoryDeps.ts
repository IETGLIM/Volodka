import { findNpcById, getStoryNodes } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import {
  dispatchGameAction,
  getGameSnapshot,
  type GameStoreSnapshot,
} from '@/engine/GameActionDispatcher';
import { areDependenciesMet } from '@/store/questStore';
import { getGuidedStoryPathConfig } from '@/engine/guidedStory/guidedStoryPath';
import { createSnapshotStoryGraphAccess } from '@/engine/guidedStory/guidedStoryQuestGraph';
import type {
  GuidedStoryDeps,
  GuidedStorySnapshot,
} from '@/engine/guidedStory/guidedStoryTypes';
import { STORY_FLAG_TO_NODE_ID } from '@/data/goldenPath';
import type { SavePayload } from '@/shared/validation/saveSchema';

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

/** Build a guided-story snapshot from validated save data (before store patch). */
export function guidedStorySnapshotFromSavePayload(payload: SavePayload): GuidedStorySnapshot {
  return {
    visitedNodes: payload.playerState.visitedNodes,
    currentAct: payload.playerState.progression.currentAct ?? 1,
    flags: payload.playerState.flags,
    quests: payload.quests.map((q) => ({
      questId: q.questId,
      status: q.status,
      objectives: q.objectives,
    })),
    activeTTLFlagKeys: Object.keys(payload.activeTTLFlags)
      .filter((key) => key in STORY_FLAG_TO_NODE_ID)
      .sort(),
  };
}

export function createDefaultGuidedStoryDeps(): GuidedStoryDeps {
  const getSnapshot = () => toGuidedStorySnapshot(getGameSnapshot());

  return {
    getSnapshot,
    path: getGuidedStoryPathConfig(),
    npc: { findNpcById },
    quests: { areDependenciesMet },
    graph: createSnapshotStoryGraphAccess(getSnapshot),
    actions: {
      advanceAct: () => dispatchGameAction({ type: 'story/advanceAct' }),
      activateQuest: (questId) => dispatchGameAction({ type: 'quest/activate', questId }),
    },
    events: {
      emitActTransition: (payload) => eventBus.emit('story:act_transition', payload),
      emitGuidanceUpdate: (guidance) => eventBus.emit('story:guidance_update', guidance),
      emitQuestAvailable: (payload) => eventBus.emit('story:quest_available', payload),
      emitQuestChainUnlock: (payload) => eventBus.emit('story:quest_chain_unlock', payload),
    },
  };
}

export function getStoryNodeSceneId(nodeId: string): string | undefined {
  return getStoryNodes()[nodeId]?.sceneId;
}
