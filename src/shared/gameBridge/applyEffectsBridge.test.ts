import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerStateDispatcher, resetStateDispatcherForTests } from './stateDispatcher';
import { bindSceneTransitionBridge, resetSceneTransitionBridgeForTests } from './sceneTransitionBridge';
import { applyEffects } from '@/shared/utils/applyEffects';
import { createInventoryItem } from '@/data/items';

describe('applyEffects via bridges', () => {
  const dispatch = vi.fn();
  const requestSceneTransition = vi.fn();

  beforeEach(() => {
    resetStateDispatcherForTests();
    resetSceneTransitionBridgeForTests();
    dispatch.mockClear();
    requestSceneTransition.mockClear();

    registerStateDispatcher({
      dispatch,
      getSnapshot: () => ({
        mode: 'exploration',
        currentNodeId: null,
        showStoryOverlay: false,
        exploration: {
          currentSceneId: 'volodka_room',
          playerPosition: [0, 0, 0],
          timeOfDay: 12,
          interactiveObjectStates: {},
        },
        playerState: {
          flags: {},
          inventory: [],
          skills: {} as never,
          energy: 100,
          karma: 0,
          stress: 0,
          visitedNodes: [],
          progression: { level: 1, currentAct: 1, skillPoints: 0, unlockedSkills: [], unlockedPerks: [], perkPoints: 0 },
        },
        collectedPoems: [],
        quests: [],
        activeTTLFlags: {},
        poemPowers: {},
        npcRelations: [],
        unlockedAchievements: [],
        achievementProgress: {
          visitedScenes: [],
          combatVictories: 0,
          consecutiveVictories: 0,
          maxComboAchieved: 0,
          hasCriticalHit: false,
          defeatedEnemyTypes: [],
          nightTimeHours: 0,
          poemPowerUsedInCombat: false,
          goodKarmaStreak: 0,
          badKarmaStreak: 0,
        },
        diegeticNarrative: null,
        activeCutsceneId: null,
        triggeredCutscenes: [],
        lastUsedPoemId: null,
        lastUsedPoemTimestamp: null,
        pendingPoemReadingId: null,
      }),
      subscribe: () => () => undefined,
      tryAddItem: () => true,
      tryActivatePoemPower: () => true,
    });

    bindSceneTransitionBridge(requestSceneTransition);
  });

  it('dispatches player and story actions without store import', () => {
    applyEffects([
      { type: 'addKarma', value: 3 },
      { type: 'visitStoryNode', nodeId: 'room_table' },
    ]);

    expect(dispatch).toHaveBeenCalledWith({ type: 'player/addKarma', amount: 3 });
    expect(dispatch).toHaveBeenCalledWith({ type: 'story/visitNode', nodeId: 'room_table' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'story/setCurrentNodeId', nodeId: 'room_table' });
  });

  it('routes transitionScene through sceneTransitionBridge', () => {
    applyEffects([{ type: 'transitionScene', sceneId: 'home_evening' }]);
    expect(requestSceneTransition).toHaveBeenCalledWith('home_evening', undefined);
  });

  it('uses tryAddItem for addItem effects', () => {
    const tryAddItem = vi.fn(() => true);
    registerStateDispatcher({
      dispatch,
      getSnapshot: () => ({}) as never,
      subscribe: () => () => undefined,
      tryAddItem,
      tryActivatePoemPower: () => true,
    });

    applyEffects([{ type: 'addItem', itemId: 'vodka_bottle', value: 1 }]);
    expect(tryAddItem).toHaveBeenCalledWith(createInventoryItem('vodka_bottle', 1));
  });
});
