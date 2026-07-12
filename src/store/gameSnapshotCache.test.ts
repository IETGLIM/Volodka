import { describe, expect, it } from 'vitest';
import type { GameStoreState } from './types';
import { getCachedGameSnapshot, resetGameSnapshotCacheForTests } from './gameSnapshotCache';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';

function minimalState(overrides: Partial<GameStoreState> = {}): GameStoreState {
  return {
    mainMenuOpen: false,
    introActive: false,
    combatActive: false,
    activeCutsceneId: null,
    currentNodeId: 'node_a',
    showStoryOverlay: false,
    exploration: {
      currentSceneId: 'apartment',
      playerPosition: [0, 0, 0],
      timeOfDay: 12,
    },
    interactiveObjectStates: {},
    playerState: {
      flags: {},
      inventory: [],
      skills: { coding: 1, logic: 1, empathy: 1, writing: 1 },
      energy: 50,
      karma: 0,
      stress: 0,
      visitedNodes: [],
      progression: { level: 1, currentAct: 1, skillPoints: 0, unlockedSkills: [] },
    },
    collectedPoems: [],
    quests: [],
    activeTTLFlags: {},
    poemPowers: {},
    npcRelations: [],
    unlockedAchievements: [],
    achievementProgress: {},
    triggeredCutscenes: [],
    lastUsedPoemId: null,
    lastUsedPoemTimestamp: null,
    pendingPoemReadingId: null,
    ...overrides,
  } as GameStoreState;
}

function buildSnapshot(state: GameStoreState): GameStoreSnapshot {
  return {
    mode: 'exploration',
    currentNodeId: state.currentNodeId,
    showStoryOverlay: state.showStoryOverlay,
    exploration: {
      currentSceneId: state.exploration.currentSceneId,
      playerPosition: state.exploration.playerPosition,
      timeOfDay: state.exploration.timeOfDay,
      interactiveObjectStates: state.interactiveObjectStates,
    },
    playerState: {
      flags: state.playerState.flags,
      inventory: state.playerState.inventory,
      skills: state.playerState.skills,
      energy: state.playerState.energy,
      karma: state.playerState.karma,
      stress: state.playerState.stress,
      visitedNodes: state.playerState.visitedNodes,
      progression: state.playerState.progression,
    },
    collectedPoems: state.collectedPoems,
    quests: state.quests,
    activeTTLFlags: state.activeTTLFlags,
    poemPowers: state.poemPowers,
    npcRelations: state.npcRelations,
    unlockedAchievements: state.unlockedAchievements,
    achievementProgress: state.achievementProgress,
    activeCutsceneId: state.activeCutsceneId,
    triggeredCutscenes: state.triggeredCutscenes,
    lastUsedPoemId: state.lastUsedPoemId,
    lastUsedPoemTimestamp: state.lastUsedPoemTimestamp,
    pendingPoemReadingId: state.pendingPoemReadingId,
  };
}

describe('gameSnapshotCache', () => {
  it('reuses snapshot when inputs match but state object identity differs', () => {
    resetGameSnapshotCacheForTests();
    const flags = { quest_done: true };
    const stateA = minimalState({ playerState: { ...minimalState().playerState, flags } });
    const stateB = { ...stateA, playerState: { ...stateA.playerState, flags } };

    const first = getCachedGameSnapshot(stateA, buildSnapshot);
    const second = getCachedGameSnapshot(stateB, buildSnapshot);
    expect(second).toBe(first);
  });

  it('rebuilds snapshot when a snapshot input changes', () => {
    resetGameSnapshotCacheForTests();
    const first = getCachedGameSnapshot(minimalState(), buildSnapshot);
    const second = getCachedGameSnapshot(minimalState({ currentNodeId: 'node_b' }), buildSnapshot);
    expect(second).not.toBe(first);
    expect(second.currentNodeId).toBe('node_b');
  });
});
