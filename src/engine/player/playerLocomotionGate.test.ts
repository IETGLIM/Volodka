import { beforeEach, describe, expect, it } from 'vitest';
import {
  isGameplayOverlayLocomotionLocked,
  resetPlayerLocomotionGateForTests,
  resolvePlayerMovementLocked,
  setMinigameLocomotionGate,
  setPanelStackLocomotionGate,
} from './playerLocomotionGate';
import {
  resetGltfPreloadOverlayGateForTests,
  setExamineOverlayAssetGate,
} from '@/engine/assets/gltfPreloadOverlayGate';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';

function baseStore(overrides: Partial<GameStoreSnapshot> = {}): GameStoreSnapshot {
  return {
    mode: 'exploration',
    currentNodeId: 'explore_mode',
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
      skills: {} as GameStoreSnapshot['playerState']['skills'],
      energy: 100,
      karma: 0,
      stress: 0,
      visitedNodes: [],
      progression: {
        level: 1,
        currentAct: 1,
        skillPoints: 0,
        unlockedSkills: [],
        unlockedPerks: [],
        perkPoints: 0,
      },
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
    ...overrides,
  };
}

describe('playerLocomotionGate', () => {
  beforeEach(() => {
    resetPlayerLocomotionGateForTests();
    resetGltfPreloadOverlayGateForTests();
  });

  it('resolvePlayerMovementLocked mirrors overlay gates', () => {
    setExamineOverlayAssetGate(true);
    expect(resolvePlayerMovementLocked(baseStore())).toBe(true);
    expect(isGameplayOverlayLocomotionLocked()).toBe(true);
  });

  it('resolvePlayerMovementLocked includes minigame and panel stack', () => {
    setMinigameLocomotionGate(true);
    expect(resolvePlayerMovementLocked(baseStore())).toBe(true);
    resetPlayerLocomotionGateForTests();
    setPanelStackLocomotionGate(true);
    expect(resolvePlayerMovementLocked(baseStore())).toBe(true);
  });

  it('resolvePlayerMovementLocked includes story overlay and combat', () => {
    expect(resolvePlayerMovementLocked({ ...baseStore(), showStoryOverlay: true })).toBe(true);
    expect(resolvePlayerMovementLocked({ ...baseStore(), mode: 'combat' })).toBe(true);
  });
});
