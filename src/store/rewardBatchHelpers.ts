/* ─── Volodka RPG – batched reward mutations (single set() pass) ─── */
/* Pure helpers that mirror individual slice actions without triggering
 * intermediate Zustand updates. Used by quest completion and daily rewards. */

import type {
  InventoryItem,
  PlayerState,
  TrainablePlayerSkill,
} from '@/shared/types/game';
import { scheduleChoiceMade } from './storeEffects';
import { clamp, pushNotification, type GameNotification } from './shared';
import {
  addInventoryItem,
  getInventoryFullMessage,
} from './inventoryHelpers';
import {
  applyXpToProgression,
  formatLevelUpMessage,
  scheduleLevelUpEmit,
  type LevelUpEvent,
} from './levelUpHelpers';

export type { LevelUpEvent };

export interface RewardBatchDraft {
  playerState: PlayerState;
  notifications: GameNotification[];
}

export interface RewardBatchSideEffects {
  karmaChanges: number[];
  /** XP accumulated across multiple batchAddXp calls — applied in finalizeRewardBatch. */
  pendingXp: number;
  levelUp: LevelUpEvent | null;
}

export function createRewardBatchDraft(
  playerState: PlayerState,
  notifications: GameNotification[],
): RewardBatchDraft {
  return { playerState, notifications };
}

export function createRewardBatchSideEffects(): RewardBatchSideEffects {
  return { karmaChanges: [], pendingXp: 0, levelUp: null };
}

export function batchAddSkill(draft: RewardBatchDraft, skill: TrainablePlayerSkill, amount: number): void {
  const newSkillValue = Math.max(0, draft.playerState.skills[skill] + amount);
  draft.playerState = {
    ...draft.playerState,
    skills: {
      ...draft.playerState.skills,
      [skill]: newSkillValue,
    },
  };
  if (amount > 0) {
    draft.notifications = pushNotification(
      draft.notifications,
      'skill',
      `Способность разблокирована: ${skill} +${amount}`,
    );
  }
}

export function batchAddKarma(
  draft: RewardBatchDraft,
  sideEffects: RewardBatchSideEffects,
  amount: number,
): void {
  draft.playerState = {
    ...draft.playerState,
    karma: clamp(draft.playerState.karma + amount, 0, 100),
  };
  draft.notifications = pushNotification(
    draft.notifications,
    'karma',
    `${amount > 0 ? '+' : ''}${amount} Карма`,
  );
  if (Math.abs(amount) >= 5) {
    sideEffects.karmaChanges.push(amount);
  }
}

export function batchAddStress(draft: RewardBatchDraft, amount: number): void {
  draft.playerState = {
    ...draft.playerState,
    stress: clamp(draft.playerState.stress + amount, 0, 100),
  };
  if (amount !== 0) {
    draft.notifications = pushNotification(
      draft.notifications,
      'stress',
      `${amount > 0 ? '+' : ''}${amount} Стресс`,
    );
  }
}

export function batchAddEnergy(draft: RewardBatchDraft, amount: number): void {
  draft.playerState = {
    ...draft.playerState,
    energy: clamp(draft.playerState.energy + amount, 0, 100),
  };
  if (amount !== 0) {
    draft.notifications = pushNotification(
      draft.notifications,
      'energy',
      `${amount > 0 ? '+' : ''}${amount} Энергия`,
    );
  }
}

export function batchSetFlag(draft: RewardBatchDraft, key: string, value: boolean): void {
  draft.playerState = {
    ...draft.playerState,
    flags: { ...draft.playerState.flags, [key]: value },
  };
}

/** Returns false when inventory is full and the item could not be added. */
export function batchAddItem(draft: RewardBatchDraft, item: InventoryItem): boolean {
  const result = addInventoryItem(draft.playerState.inventory, item);
  if (result.ok) {
    draft.playerState = { ...draft.playerState, inventory: result.inventory };
    return true;
  }

  draft.notifications = pushNotification(
    draft.notifications,
    'stress',
    getInventoryFullMessage(result.itemName),
  );
  return false;
}

export function batchAddCredits(draft: RewardBatchDraft, amount: number): void {
  draft.playerState = {
    ...draft.playerState,
    credits: Math.max(0, draft.playerState.credits + amount),
  };
  if (amount !== 0) {
    draft.notifications = pushNotification(
      draft.notifications,
      'skill',
      `${amount > 0 ? '+' : ''}${amount} кредитов`,
    );
  }
}

/** Accumulates XP; call finalizeRewardBatch before returning from set(). */
export function batchAddXp(
  _draft: RewardBatchDraft,
  sideEffects: RewardBatchSideEffects,
  amount: number,
): void {
  if (amount > 0) {
    sideEffects.pendingXp += amount;
  }
}

/** Apply accumulated XP once and attach a single level-up side effect. */
export function finalizeRewardBatch(
  draft: RewardBatchDraft,
  sideEffects: RewardBatchSideEffects,
): void {
  if (sideEffects.pendingXp <= 0) return;

  const amount = sideEffects.pendingXp;
  sideEffects.pendingXp = 0;

  const { progression, levelUp } = applyXpToProgression(
    draft.playerState.progression,
    amount,
    {
      prevSkills: draft.playerState.skills,
      prevKarma: draft.playerState.karma,
    },
  );

  draft.playerState = {
    ...draft.playerState,
    progression,
  };

  if (levelUp) {
    draft.notifications = pushNotification(
      draft.notifications,
      'skill',
      formatLevelUpMessage(
        levelUp.newLevel,
        levelUp.levelsGained,
        levelUp.perkPointsGained,
      ),
    );
    sideEffects.levelUp = levelUp;
  }
}

export function flushRewardBatchSideEffects(sideEffects: RewardBatchSideEffects): void {
  for (const karmaChange of sideEffects.karmaChanges) {
    scheduleChoiceMade({ karmaChange });
  }
  if (sideEffects.levelUp) {
    scheduleLevelUpEmit(sideEffects.levelUp);
  }
}
