import { beforeEach, describe, expect, it } from 'vitest';
import {
  isGameplayOverlayLocomotionLocked,
  resetPlayerLocomotionGateForTests,
  resolvePlayerMovementLockContract,
  resolvePlayerMovementLocked,
  setMinigameLocomotionGate,
  setPanelStackLocomotionGate,
} from './playerLocomotionGate';
import {
  addPlayerMovementLockReasons,
  shouldConsumeExternalVelocity,
} from '@/engine/player/playerMovementContract';
import {
  createIdleMovementScratch,
  syncMovementScratchFields,
  syncResolvedMovementScratch,
} from '@/engine/player/playerScratchSync';
import {
  resetGltfPreloadOverlayGateForTests,
  setExamineOverlayAssetGate,
} from '@/engine/assets/gltfPreloadOverlayGate';
import { resetCinematicPresentation } from '@/engine/camera/cinematicPresentation';
import { resetCinematicTimelineOrchestratorForTests } from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import type { PlayerMovementDeps } from '@/engine/player/playerFrameTypes';
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
    ...overrides,
  };
}

describe('playerLocomotionGate', () => {
  beforeEach(() => {
    resetPlayerLocomotionGateForTests();
    resetGltfPreloadOverlayGateForTests();
    resetCinematicPresentation();
    resetCinematicTimelineOrchestratorForTests();
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

  it('describes lock ownership reasons for store-driven gates', () => {
    expect(resolvePlayerMovementLockContract({
      ...baseStore(),
      showStoryOverlay: true,
      currentNodeId: 'dialogue_maria_intro',
    }).reasons).toContain('dialogue');

    expect(resolvePlayerMovementLockContract({
      ...baseStore(),
      diegeticNarrative: { nodeId: 'chalk_note', kind: 'story' },
    }).reasons).toContain('diegetic_narrative');
  });

  it('allows external velocity only for pure interaction approach locks', () => {
    const interactionOnly = addPlayerMovementLockReasons(
      resolvePlayerMovementLockContract(baseStore()),
      ['interaction_lock'],
      { interactionState: InteractionState.Approach },
    );
    expect(shouldConsumeExternalVelocity(interactionOnly, 'kcc_locked_movement', true)).toBe(true);
    expect(shouldConsumeExternalVelocity(interactionOnly, 'simple_locked_movement', true)).toBe(true);

    const dialogueInteraction = addPlayerMovementLockReasons(
      resolvePlayerMovementLockContract({ ...baseStore(), showStoryOverlay: true }),
      ['interaction_lock'],
      { interactionState: InteractionState.Approach },
    );
    expect(shouldConsumeExternalVelocity(dialogueInteraction, 'kcc_locked_movement', true)).toBe(false);
    expect(shouldConsumeExternalVelocity(dialogueInteraction, 'simple_locked_movement', true)).toBe(false);
  });

  it('keeps KCC and direct fallback scratch sync fields in parity', () => {
    const directScratch = createIdleMovementScratch();
    const kccScratch = { ...createIdleMovementScratch(), vel: { y: -4 } };
    const resolved = {
      isGroundedNow: false,
      onFlatGround: false,
      airborneIntent: true,
      isMoving: true,
      running: true,
      keyboardDrivesMove: false,
      blockedByWall: false,
      prevVelY: -4,
    };

    syncMovementScratchFields(directScratch, resolved);
    syncResolvedMovementScratch(
      { frameScratchRef: { current: kccScratch } } as unknown as PlayerMovementDeps,
      resolved,
    );

    expect(kccScratch).toMatchObject(directScratch);
  });
});
