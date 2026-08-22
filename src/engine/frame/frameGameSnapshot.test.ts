import { describe, expect, it, beforeEach } from 'vitest';
import { createFrameGameSnapshot } from './frameGameSnapshot';
import {
  resetGltfPreloadOverlayGateForTests,
  setExamineOverlayAssetGate,
} from '@/engine/assets/gltfPreloadOverlayGate';
import {
  resetPlayerLocomotionGateForTests,
  setMinigameLocomotionGate,
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
      equippedThoughtIds: [],
      progression: {
        level: 1,
        currentAct: 1,
        skillPoints: 0,
        unlockedSkills: [],
        unlockedPerks: [],
        perkPoints: 0,
      },
      choiceLog: [],
      moralChoices: [],
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
    weatherEnabled: true,
    rainIntensity: 0,
    acquiredThoughtIds: [],
    difficultySettings: {
      difficulty: 'normal',
      enemyDamageMultiplier: 1,
      enemyHealthMultiplier: 1,
      playerDamageMultiplier: 1,
      xpMultiplier: 1,
      creditsMultiplier: 1,
      skillCheckThreshold: 0,
      stressAccumulationRate: 1,
      energyRegenRate: 1,
      combatFleeBaseChance: 0.3,
    },
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

  it('locks locomotion during minigame gate', () => {
    setMinigameLocomotionGate(true);
    const snapshot = createFrameGameSnapshot(baseSnapshot());
    expect(snapshot.movementLocked).toBe(true);
  });

  it('locks locomotion when story overlay is open', () => {
    const snapshot = createFrameGameSnapshot({
      ...baseSnapshot(),
      showStoryOverlay: true,
    });
    expect(snapshot.movementLocked).toBe(true);
  });

  it('locks locomotion during combat phase', () => {
    const snapshot = createFrameGameSnapshot({
      ...baseSnapshot(),
      mode: 'combat',
    });
    expect(snapshot.movementLocked).toBe(true);
  });

  it('exposes diegeticNarrative flag from store snapshot', () => {
    // Default: no diegetic narrative panel open.
    expect(createFrameGameSnapshot(baseSnapshot()).diegeticNarrative).toBe(false);

    // When a diegetic panel is open, the snapshot reflects it so consumers
    // (e.g. preparePlayerFrame stuck-lock watchdog) can suppress timeouts.
    const withDiegetic = createFrameGameSnapshot({
      ...baseSnapshot(),
      diegeticNarrative: { nodeId: 'act1_albert_intro', kind: 'dialogue' },
    });
    expect(withDiegetic.diegeticNarrative).toBe(true);
  });
});
