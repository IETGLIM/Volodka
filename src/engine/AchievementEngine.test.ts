import { beforeEach, describe, expect, it, vi } from 'vitest';

const dispatchGameAction = vi.fn();
const getGameSnapshot = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
  getGameSnapshot: () => getGameSnapshot(),
}));

vi.mock('@/data/achievements', () => ({
  ACHIEVEMENT_MAP: {},
  TOTAL_ACHIEVEMENTS: 0,
}));

import {
  checkAchievements,
  resetAchievementTracking,
  type AchievementCheckState,
} from './AchievementEngine';

const defaultProgress = {
  visitedScenes: [] as string[],
  combatVictories: 0,
  consecutiveVictories: 0,
  maxComboAchieved: 0,
  hasCriticalHit: false,
  defeatedEnemyTypes: [] as string[],
  nightTimeHours: 0,
  poemPowerUsedInCombat: false,
};

function makeCheckState(overrides: Partial<AchievementCheckState> = {}): AchievementCheckState {
  return {
    mode: 'exploration',
    currentSceneId: 'volodka_room',
    collectedPoems: [],
    karma: 0,
    energy: 100,
    stress: 0,
    npcRelations: [],
    flags: {},
    timeOfDay: 12,
    unlockedAchievements: [],
    ...overrides,
  };
}

function progressTrackingDispatches(): Array<{ type: string }> {
  return dispatchGameAction.mock.calls
    .map(([action]) => action as { type: string })
    .filter(
      (action) =>
        action.type === 'achievement/batchCheckProgress' ||
        action.type === 'achievement/trackSceneVisit' ||
        action.type === 'achievement/trackNightHour',
    );
}

describe('checkAchievements progress tracking', () => {
  beforeEach(() => {
    dispatchGameAction.mockClear();
    getGameSnapshot.mockReset();
    resetAchievementTracking();
    getGameSnapshot.mockReturnValue({
      unlockedAchievements: [],
      achievementProgress: { ...defaultProgress },
    });
  });

  it('dispatches one batched progress action for scene visit and night hour', () => {
    checkAchievements(
      makeCheckState({
        currentSceneId: 'street_night',
        timeOfDay: 23,
      }),
    );

    expect(progressTrackingDispatches()).toEqual([
      {
        type: 'achievement/batchCheckProgress',
        sceneVisit: 'street_night',
        trackNightHour: true,
      },
    ]);
  });

  it('dispatches only night-hour tracking when the scene was already visited', () => {
    getGameSnapshot.mockReturnValue({
      unlockedAchievements: [],
      achievementProgress: {
        ...defaultProgress,
        visitedScenes: ['street_night'],
      },
    });

    checkAchievements(
      makeCheckState({
        currentSceneId: 'street_night',
        timeOfDay: 2,
      }),
    );

    expect(progressTrackingDispatches()).toEqual([
      {
        type: 'achievement/batchCheckProgress',
        trackNightHour: true,
      },
    ]);
  });

  it('skips progress dispatch when there is nothing to track', () => {
    getGameSnapshot.mockReturnValue({
      unlockedAchievements: [],
      achievementProgress: {
        ...defaultProgress,
        visitedScenes: ['volodka_room'],
      },
    });

    checkAchievements(makeCheckState({ timeOfDay: 12 }));

    expect(progressTrackingDispatches()).toEqual([]);
  });

  it('does not use legacy single-action progress dispatches', () => {
    checkAchievements(
      makeCheckState({
        currentSceneId: 'cafe_evening',
        timeOfDay: 23,
      }),
    );

    expect(dispatchGameAction).not.toHaveBeenCalledWith({
      type: 'achievement/trackSceneVisit',
      sceneId: 'cafe_evening',
    });
    expect(dispatchGameAction).not.toHaveBeenCalledWith({
      type: 'achievement/trackNightHour',
    });
  });
});
