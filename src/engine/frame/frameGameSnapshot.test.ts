import { describe, expect, it, beforeEach } from 'vitest';
import { createFrameGameSnapshot } from './frameGameSnapshot';
import {
  resetGltfPreloadOverlayGateForTests,
  setExamineOverlayAssetGate,
} from '@/engine/assets/gltfPreloadOverlayGate';
import {
  resetPlayerLocomotionGateForTests,
  setPanelStackLocomotionGate,
} from '@/engine/player/playerLocomotionGate';
import type { GameStoreSnapshot } from '@/shared/gameBridge/gameActionBridge';

function baseSnapshot(overrides: Partial<GameStoreSnapshot> = {}): GameStoreSnapshot {
  return {
    mode: 'exploration',
    currentNodeId: 'start',
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
    activeCutsceneId: null,
    triggeredCutscenes: [],
    lastUsedPoemId: null,
    lastUsedPoemTimestamp: null,
    pendingPoemReadingId: null,
    ...overrides,
  };
}

describe('createFrameGameSnapshot movementLocked', () => {
  beforeEach(() => {
    resetGltfPreloadOverlayGateForTests();
    resetPlayerLocomotionGateForTests();
  });

  it('locks locomotion while examine overlay is open', () => {
    setExamineOverlayAssetGate(true);
    const snapshot = createFrameGameSnapshot(baseSnapshot());
    expect(snapshot.movementLocked).toBe(true);
  });

  it('locks locomotion while inventory panel gate is active', () => {
    setPanelStackLocomotionGate(true);
    const snapshot = createFrameGameSnapshot(baseSnapshot());
    expect(snapshot.movementLocked).toBe(true);
  });

  it('locks locomotion during cutscene phase', () => {
    const snapshot = createFrameGameSnapshot({
      ...baseSnapshot(),
      mode: 'cutscene',
      activeCutsceneId: 'act1_prologue',
    });
    expect(snapshot.movementLocked).toBe(true);
  });
});
