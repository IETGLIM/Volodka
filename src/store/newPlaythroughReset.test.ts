import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { useGameStore } from './gameStore';
import { applyCombinedPatch } from './patchState';
import { getWorldStoreState, getSaveStoreState } from './stores';
import {
  createDefaultPersistedState,
  createDefaultSessionState,
  captureNewPlaythroughCarry,
  createNewPlaythroughResetPatch,
} from './persistedState';
import { resetGuidedStoryFromStore, resetEngineRuntimeFromStore, resetSceneLoadedGateFromStore } from './storeEngineHost';
import { resetSliceMutationSchedulerForTests } from './combinedState';
import { emitPlaythroughReset } from './storeEffects';

vi.mock('./storeEffects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storeEffects')>();
  return {
    ...actual,
    runAfterStoreCommit: (fn: () => void) => fn(),
    scheduleQuestObjectiveUpdated: vi.fn(),
    emitPoemResetAllEffects: vi.fn(),
    emitPlaythroughReset: vi.fn(),
  };
});

vi.mock('./storeEngineHost', () => ({
  resetGuidedStoryFromStore: vi.fn(),
  resetEngineRuntimeFromStore: vi.fn(),
  resetSceneLoadedGateFromStore: vi.fn(),
}));

function seedCompletedRunState(): void {
  const defaults = createDefaultPersistedState();
  applyCombinedPatch({
    ...defaults,
    ...createDefaultSessionState(),
    currentNodeId: 'act7_true_end',
    showStoryOverlay: true,
    narrativeKind: 'story',
    quests: [
      {
        questId: 'morning_ritual',
        status: 'completed',
        objectives: { wake: true },
        startedAtTime: 8,
      },
    ],
    collectedPoems: ['poem_1', 'poem_2'],
    notifications: [{ id: 'quest-1', type: 'quest', text: 'Новый квест', timestamp: 1 }],
    unlockedAchievements: [{ id: 'story_game_completed', unlockedAt: 42 }],
    achievementProgress: {
      ...defaults.achievementProgress,
      combatVictories: 9,
    },
    playerState: {
      ...defaults.playerState,
      visitedNodes: ['start', 'explore_mode', 'act7_true_end'],
      flags: { game_completed: true, woke_up: true },
      progression: {
        ...defaults.playerState.progression,
        level: 12,
        currentAct: 7,
      },
    },
  });
}

function readFreshStore() {
  useGameStore.setState({});
  return useGameStore.getState();
}

describe('new playthrough reset', () => {
  beforeEach(() => {
    resetSliceMutationSchedulerForTests();
    vi.clearAllMocks();
    seedCompletedRunState();
  });

  it('createNewPlaythroughResetPatch clears world and player progress', () => {
    const carry = captureNewPlaythroughCarry(readFreshStore(), { preserveAchievements: true });
    applyCombinedPatch(createNewPlaythroughResetPatch(carry, { skipIntro: true }));

    expect(getWorldStoreState().quests).toEqual([]);
    expect(getWorldStoreState().collectedPoems).toEqual([]);
    expect(readFreshStore().playerState.visitedNodes).toEqual([]);
  });

  it('resetForNewPlaythrough clears progress and preserves achievements', () => {
    getSaveStoreState().resetForNewPlaythrough({ preserveAchievements: true, skipIntro: true });
    const state = readFreshStore();

    expect(getWorldStoreState().quests).toEqual([]);
    expect(state.collectedPoems).toEqual([]);
    expect(state.playerState.visitedNodes).toEqual([]);
    expect(state.notifications).toEqual([]);
    expect(state.playerState.progression.level).toBe(1);
    expect(state.unlockedAchievements).toEqual([{ id: 'story_game_completed', unlockedAt: 42 }]);
    expect(state.playerState.flags.game_completed).toBe(true);
    expect(state.introSeen).toBe(true);
    expect(state.introActive).toBe(false);
    expect(resetGuidedStoryFromStore).toHaveBeenCalled();
    expect(resetEngineRuntimeFromStore).toHaveBeenCalled();
    expect(resetSceneLoadedGateFromStore).toHaveBeenCalled();
    expect(emitPlaythroughReset).toHaveBeenCalled();
  });

  it('resetGame shares the new-playthrough reset path', () => {
    getSaveStoreState().resetGame();
    const state = readFreshStore();

    expect(getWorldStoreState().quests).toEqual([]);
    expect(state.playerState.visitedNodes).toEqual([]);
    expect(state.unlockedAchievements).toEqual([{ id: 'story_game_completed', unlockedAt: 42 }]);
  });

  it('simulates act7_true_end choice effects then story restart', () => {
    dispatchGameAction({ type: 'player/setFlag', key: 'game_completed', value: true });
    dispatchGameAction({ type: 'player/addKarma', amount: 10 });

    getSaveStoreState().resetForNewPlaythrough({ preserveAchievements: true, skipIntro: true });
    useGameStore.setState({
      currentNodeId: 'start',
      showStoryOverlay: true,
      narrativeKind: 'story',
    });

    const state = readFreshStore();
    expect(state.quests).toEqual([]);
    expect(state.playerState.visitedNodes).toEqual([]);
    expect(state.notifications).toEqual([]);
    expect(state.playerState.karma).toBe(createDefaultPersistedState().playerState.karma);
    expect(state.playerState.flags.game_completed).toBe(true);
  });
});
