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
import { triggerXpGain } from '@/engine/fx/screenFxTriggers';
import type { GameStoreState } from './types';

let pendingXpAmount = 0;
let flushScheduled = false;
let batchGeneration = 0;

/** Drop queued XP and invalidate any pending microtask flush (resetGame / load / dispose). */
export function resetPlayerXpBatch(): void {
  pendingXpAmount = 0;
  flushScheduled = false;
  batchGeneration += 1;
}

/** @deprecated Use resetPlayerXpBatch — kept for existing test imports. */
export function resetPlayerXpBatchForTests(): void {
  resetPlayerXpBatch();
}

export function queuePlayerXp(
  amount: number,
  set: StoreApi<GameStoreState>['setState'],
): void {
  if (amount <= 0) return;

  pendingXpAmount += amount;
  if (flushScheduled) return;

  flushScheduled = true;
  const capturedGeneration = batchGeneration;
  queueMicrotask(() => {
    flushScheduled = false;
    if (capturedGeneration !== batchGeneration) return;
    const total = pendingXpAmount;
    pendingXpAmount = 0;
    if (total <= 0) return;

    let levelUpToEmit: ReturnType<typeof applyXpToProgression>['levelUp'] = null;

    set((state) => {
      const { progression, levelUp } = applyXpToProgression(
        state.playerState.progression,
        total,
        {
          prevSkills: state.playerState.skills,
          prevKarma: state.playerState.karma,
        },
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

    // Emit fx:xp_gain so UI components (LevelUpNotification) can show "+X XP" toast.
    triggerXpGain(total);
  });
}
