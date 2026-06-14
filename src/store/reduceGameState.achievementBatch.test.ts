import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { useGameStore } from './gameStore';

vi.mock('./storeEffects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./storeEffects')>();
  return {
    ...actual,
    runAfterStoreCommit: (fn: () => void) => fn(),
  };
});

describe('achievement/batchCheckProgress', () => {
  beforeEach(() => {
    useGameStore.setState({
      achievementProgress: {
        visitedScenes: ['volodka_room'],
        combatVictories: 0,
        consecutiveVictories: 0,
        maxComboAchieved: 0,
        hasCriticalHit: false,
        defeatedEnemyTypes: [],
        nightTimeHours: 1.99,
        poemPowerUsedInCombat: false,
      },
    });
  });

  it('applies scene visit and night-hour updates in one dispatch', () => {
    const listener = vi.fn();
    const unsub = useGameStore.subscribe(listener);

    dispatchGameAction({
      type: 'achievement/batchCheckProgress',
      sceneVisit: 'street_night',
      trackNightHour: true,
    });

    expect(useGameStore.getState().achievementProgress).toEqual({
      visitedScenes: ['volodka_room', 'street_night'],
      combatVictories: 0,
      consecutiveVictories: 0,
      maxComboAchieved: 0,
      hasCriticalHit: false,
      defeatedEnemyTypes: [],
      nightTimeHours: 2,
      poemPowerUsedInCombat: false,
    });
    expect(listener).toHaveBeenCalledTimes(1);
    unsub();
  });
});
