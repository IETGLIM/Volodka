/* ─── Volodka RPG – microtask-batched standalone addXp ─── */
/* Coalesces rapid addXp() calls (e.g. applyEffects loops) into one set()
 * and one player:levelup event per synchronous turn. */

import type { StoreApi } from 'zustand';
import { pushNotification } from './shared';
import {
  applyXpToProgression,
  formatLevelUpMessage,
  scheduleLevelUpEmit,
} from './levelUpHelpers';
import type { GameStoreState } from './types';

let pendingXpAmount = 0;
let flushScheduled = false;

export function queuePlayerXp(
  amount: number,
  set: StoreApi<GameStoreState>['setState'],
): void {
  if (amount <= 0) return;

  pendingXpAmount += amount;
  if (flushScheduled) return;

  flushScheduled = true;
  queueMicrotask(() => {
    flushScheduled = false;
    const total = pendingXpAmount;
    pendingXpAmount = 0;
    if (total <= 0) return;

    let levelUpToEmit: ReturnType<typeof applyXpToProgression>['levelUp'] = null;

    set((state) => {
      const { progression, levelUp } = applyXpToProgression(
        state.playerState.progression,
        total,
      );
      levelUpToEmit = levelUp;

      return {
        playerState: {
          ...state.playerState,
          progression,
        },
        notifications: levelUp
          ? pushNotification(
              state.notifications,
              'skill',
              formatLevelUpMessage(
                levelUp.newLevel,
                levelUp.levelsGained,
                levelUp.perkPointsGained,
              ),
            )
          : state.notifications,
      };
    });

    if (levelUpToEmit) {
      scheduleLevelUpEmit(levelUpToEmit);
    }
  });
}

/** Test-only reset for pending XP queue state. */
export function resetPlayerXpBatchForTests(): void {
  pendingXpAmount = 0;
  flushScheduled = false;
}
