/* ─── Volodka RPG – batched reward mutations (single set() pass) ─── */
/* Pure helpers that mirror individual slice actions without triggering
 * intermediate Zustand updates. Used by quest completion and daily rewards. */

import type {
  InventoryItem,
  PlayerState,
  TrainablePlayerSkill,
} from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';
import { applyXpGain, clamp, pushNotification, type GameNotification } from './shared';
import {
  addInventoryItem,
  getInventoryFullMessage,
} from './inventoryHelpers';

export interface RewardBatchDraft {
  playerState: PlayerState;
  notifications: GameNotification[];
}

export interface LevelUpEvent {
  newLevel: number;
  prevLevel: number;
  levelsGained: number;
  perkPointsGained: number;
  perkPointGained: boolean;
}

export interface RewardBatchSideEffects {
  karmaChanges: number[];
  levelUps: LevelUpEvent[];
}

export function createRewardBatchDraft(
  playerState: PlayerState,
  notifications: GameNotification[],
): RewardBatchDraft {
  return { playerState, notifications };
}

export function createRewardBatchSideEffects(): RewardBatchSideEffects {
  return { karmaChanges: [], levelUps: [] };
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

export function batchAddXp(
  draft: RewardBatchDraft,
  sideEffects: RewardBatchSideEffects,
  amount: number,
): void {
  const result = applyXpGain(draft.playerState.progression, amount);
  const { progression, prevLevel, levelsGained, perkPointsGained } = result;
  const newLevel = progression.level;

  if (levelsGained > 0) {
    const skillPart =
      levelsGained === 1 ? '+1 очко навыка' : `+${levelsGained} очков навыка`;
    const levelUpMessage =
      perkPointsGained === 0
        ? `Уровень ${newLevel}! ${skillPart}`
        : perkPointsGained === 1
          ? `Уровень ${newLevel}! ${skillPart} +1 очко черты!`
          : `Уровень ${newLevel}! ${skillPart} +${perkPointsGained} очков черты!`;

    draft.notifications = pushNotification(draft.notifications, 'skill', levelUpMessage);
    sideEffects.levelUps.push({
      newLevel,
      prevLevel,
      levelsGained,
      perkPointsGained,
      perkPointGained: perkPointsGained > 0,
    });
  }

  draft.playerState = {
    ...draft.playerState,
    progression,
  };
}

export function flushRewardBatchSideEffects(sideEffects: RewardBatchSideEffects): void {
  for (const karmaChange of sideEffects.karmaChanges) {
    queueMicrotask(() => {
      eventBus.emit('choice:made', { karmaChange });
    });
  }
  for (const levelUp of sideEffects.levelUps) {
    queueMicrotask(() => {
      eventBus.emit('player:levelup', levelUp);
    });
  }
}
