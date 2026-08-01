import { describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import {
  createDefaultPersistedState,
  createDefaultSessionState,
  createNewPlaythroughResetPatch,
  estimatePlayTimeSeconds,
  pickSavePayload,
  storePatchFromSave,
} from './persistedState';
import type { GameStoreState } from './types';

function buildValidSavePayload() {
  return {
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    ...createDefaultPersistedState(),
  };
}

function buildMinimalGameState(overrides: Partial<GameStoreState> = {}): GameStoreState {
  return {
    ...createDefaultPersistedState(),
    ...createDefaultSessionState(),
    resetGame: () => {},
    saveGame: () => {},
    loadGame: () => {},
    ...overrides,
  } as GameStoreState;
}

describe('pickSavePayload playTimeSeconds', () => {
  it('writes progress-based playTimeSeconds metadata', () => {
    const state = buildMinimalGameState({
      playerState: {
        ...createDefaultPersistedState().playerState,
        visitedNodes: ['a', 'b', 'c'],
        progression: {
          ...createDefaultPersistedState().playerState.progression,
          level: 2,
        },
      },
    });

    const payload = pickSavePayload(state);
    expect(payload.playTimeSeconds).toBe(estimatePlayTimeSeconds(state));
    expect(payload.playTimeSeconds).toBe(3 * 120 + 600);
  });
});

describe('createNewPlaythroughResetPatch', () => {
  it('carries achievements and game_completed while resetting quests', () => {
    const defaults = createDefaultPersistedState();
    const carry = {
      unlockedAchievements: [{ id: 'a1', unlockedAt: 1 }],
      achievementProgress: { ...defaults.achievementProgress, combatVictories: 4 },
      metaFlags: { game_completed: true as const },
    };
    const patch = createNewPlaythroughResetPatch(carry, { skipIntro: true });
    expect(patch.quests).toEqual([]);
    expect(patch.unlockedAchievements).toEqual(carry.unlockedAchievements);
    expect(patch.playerState?.flags?.game_completed).toBe(true);
    expect(patch.introSeen).toBe(true);
    expect(patch.introActive).toBe(false);
  });

  it('skips cold-boot matrix intro even without skipIntro option', () => {
    const patch = createNewPlaythroughResetPatch(null);
    expect(patch.introActive).toBe(false);
    expect(patch.introSeen).toBe(true);
    expect(patch.mainMenuOpen).toBe(false);
  });
});

describe('storePatchFromSave playTimeSeconds', () => {
  it('does not restore playTimeSeconds into game state', () => {
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      playTimeSeconds: 9999,
    });
    expect(patch).not.toHaveProperty('playTimeSeconds');
  });
});

describe('storePatchFromSave closed-overlay hubs', () => {
  it.each(['cafe_explore_mode', 'home_evening_explore_mode', 'park_explore_mode', 'chk_explore_mode'])(
    'forces overlay closed when resuming at closed-overlay hub %s',
    (hubId) => {
      const patch = storePatchFromSave({
        ...buildValidSavePayload(),
        currentNodeId: hubId,
        showStoryOverlay: true,
        narrativeKind: 'story',
      });
      expect(patch.showStoryOverlay).toBe(false);
      expect(patch.narrativeKind).toBeNull();
      expect(patch.currentNodeId).toBe(hubId);
    },
  );

  it('preserves overlay state for non-hub story nodes', () => {
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      currentNodeId: 'park_entrance',
      showStoryOverlay: true,
      narrativeKind: 'story',
    });
    expect(patch.showStoryOverlay).toBe(true);
    expect(patch.narrativeKind).toBe('story');
  });
});

describe('storePatchFromSave weather', () => {
  it('restores top-level weather fields on load', () => {
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      weatherEnabled: false,
      rainIntensity: 0.25,
    });
    expect(patch.weatherEnabled).toBe(false);
    expect(patch.rainIntensity).toBe(0.25);
  });
});

describe('storePatchFromSave session reset', () => {
  it('resets ephemeral session fields while preserving save metadata', () => {
    const savedAt = 1_700_000_000_000;
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      savedAt,
    });
    const sessionDefaults = createDefaultSessionState();

    expect(patch.lastUsedPoemId).toBe(sessionDefaults.lastUsedPoemId);
    expect(patch.activeCutsceneId).toBe(sessionDefaults.activeCutsceneId);
    expect(patch.matrixRainEnabled).toBe(sessionDefaults.matrixRainEnabled);
    expect(patch.noirMode).toBe(sessionDefaults.noirMode);
    expect(patch.journalOpen).toBe(sessionDefaults.journalOpen);
    expect(patch.notifications).toEqual(sessionDefaults.notifications);
    expect(patch.lastSaveTimestamp).toBe(savedAt);
  });
});
