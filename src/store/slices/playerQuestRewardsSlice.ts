/* ─── Volodka RPG – Player Quest Rewards Slice ─── */
/* NPC gifting and quest reward auto-application. */

import type { StateCreator } from 'zustand';
import type { GiftPreference } from '@/data/npcGifts';
import {
  getQuestDefinitions,
  getItemDefinition,
  createInventoryItem,
  findNpcById,
  getItemPreference,
  getAffinityChange,
  getGiftXpReward,
  getGiftReactionText,
} from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import {
  applyXpToProgression,
  formatLevelUpMessage,
  scheduleLevelUpEmit,
  type LevelUpEvent,
} from '../levelUpHelpers';
import {
  findInventoryItemIndex,
  removeInventoryItem,
} from '../inventoryHelpers';
import type { GameStoreState } from '../types';
import { pickPlayerQuestRewardsCrossActions } from '../crossSliceReads';
import {
  batchAddCredits,
  batchAddEnergy,
  batchAddItem,
  batchAddKarma,
  batchAddSkill,
  batchAddStress,
  batchAddXp,
  batchSetFlag,
} from '../rewardBatchHelpers';
import {
  computeQuestCreditReward,
  getDefaultQuestXp,
} from '@/shared/utils/questRewards';

const GIFT_QUANTITY = 1;

/* ─── Slice types ─── */

export interface PlayerQuestRewardsSliceActions {
  /** Gift an item to an NPC. Determines preference, adjusts affinity, removes item, emits event. */
  giftItemToNPC: (itemId: string, npcId: string) => GiftPreference | null;
  /** Complete a quest and auto-apply its rewards (skills, karma, XP, items, flags). */
  completeQuestAndApplyRewards: (questId: string) => void;
}

export type PlayerQuestRewardsSlice = PlayerQuestRewardsSliceActions;

/* ─── Slice creator ─── */

export const createPlayerQuestRewardsSlice: StateCreator<
  GameStoreState,
  [],
  [],
  PlayerQuestRewardsSlice
> = (set, get) => ({
  giftItemToNPC: (itemId, npcId) => {
    const cross = pickPlayerQuestRewardsCrossActions(get);
    const npcDef = findNpcById(npcId);
    if (!npcDef) {
      cross.pushNotification('stress', 'Персонаж не найден');
      return null;
    }

    const preference = getItemPreference(npcId, itemId);
    const affinityChange = getAffinityChange(preference);
    const xpReward = getGiftXpReward(preference);
    const relationDelta = Math.round(affinityChange * 0.5);
    const npcName = npcDef.name;
    const reactionText = getGiftReactionText(npcName, preference);

    const state = get();
    const invIdx = findInventoryItemIndex(state.playerState.inventory, itemId);
    if (invIdx < 0) {
      cross.pushNotification('stress', 'У вас нет этого предмета');
      return null;
    }

    const invItem = state.playerState.inventory[invIdx];
    if (invItem.quantity < GIFT_QUANTITY) {
      cross.pushNotification('stress', 'Недостаточно предметов');
      return null;
    }

    const itemDef = getItemDefinition(itemId);
    if (itemDef?.questRelated) {
      cross.pushNotification('stress', 'Нельзя подарить сюжетный предмет');
      return null;
    }

    const { inventory, removed } = removeInventoryItem(
      state.playerState.inventory,
      itemId,
      GIFT_QUANTITY,
    );
    if (!removed) {
      return null;
    }

    let progression = state.playerState.progression;
    let levelUpInfo: LevelUpEvent | null = null;

    if (xpReward > 0) {
      const xpResult = applyXpToProgression(progression, xpReward);
      progression = xpResult.progression;
      if (xpResult.levelUp) {
        levelUpInfo = xpResult.levelUp;
      }
    }

    set({
      playerState: {
        ...state.playerState,
        inventory,
        progression,
      },
    });

    if (relationDelta !== 0) {
      cross.setNpcRelation(npcId, relationDelta);
    }
    cross.adjustNpcAffinity(npcId, affinityChange);
    cross.pushNotification('skill', reactionText);

    if (levelUpInfo) {
      cross.pushNotification(
        'skill',
        formatLevelUpMessage(
          levelUpInfo.newLevel,
          levelUpInfo.levelsGained,
          levelUpInfo.perkPointsGained,
        ),
      );
      scheduleLevelUpEmit(levelUpInfo);
    }

    eventBus.emit('npc:gift', {
      npcId,
      itemId,
      preference,
      affinityChange,
    });

    return preference;
  },

  completeQuestAndApplyRewards: (questId) => {
    const questDef = getQuestDefinitions().find((d) => d.id === questId);
    if (!questDef) return;

    const xpGained = getDefaultQuestXp(questDef.questType);
    const creditsGained = computeQuestCreditReward(questDef);
    const appliedRewards: string[] = [];
    const cross = pickPlayerQuestRewardsCrossActions(get);

    get().applyPlayerRewardBatch((draft, sideEffects) => {
      const rewards = questDef.rewards ?? [];
      for (const reward of rewards) {
        switch (reward.type) {
          case 'addSkill':
            if (reward.skill && reward.value) {
              batchAddSkill(draft, reward.skill, reward.value);
              appliedRewards.push(`${reward.skill} +${reward.value}`);
            }
            break;
          case 'addKarma':
            if (reward.value) {
              batchAddKarma(draft, sideEffects, reward.value);
              appliedRewards.push(`Карма +${reward.value}`);
            }
            break;
          case 'addXp':
            if (reward.value) {
              batchAddXp(draft, sideEffects, reward.value);
              appliedRewards.push(`Опыт +${reward.value}`);
            }
            break;
          case 'addCredits':
            if (reward.value) {
              batchAddCredits(draft, reward.value);
              appliedRewards.push(`Кредиты +${reward.value}`);
            }
            break;
          case 'addStat':
            if (reward.stat === 'energy' && reward.value) {
              batchAddEnergy(draft, reward.value);
              appliedRewards.push(`Энергия +${reward.value}`);
            } else if (reward.stat === 'stress' && reward.value) {
              batchAddStress(draft, reward.value);
              appliedRewards.push(`Стресс +${reward.value}`);
            }
            break;
          case 'addItem':
            if (reward.itemId && reward.value) {
              const item = createInventoryItem(reward.itemId, reward.value);
              const added = batchAddItem(draft, item);
              if (added) {
                const itemDef = getItemDefinition(reward.itemId);
                appliedRewards.push(`${itemDef?.name ?? reward.itemId} x${reward.value}`);
              }
            }
            break;
          case 'setFlag':
            if (reward.flag) {
              batchSetFlag(draft, reward.flag, reward.flagValue ?? true);
              appliedRewards.push(`Флаг: ${reward.flag}`);
            }
            break;
          default:
            break;
        }
      }

      batchAddXp(draft, sideEffects, xpGained);
      appliedRewards.push(`Опыт за задание +${xpGained}`);

      batchAddCredits(draft, creditsGained);
      appliedRewards.push(`Кредиты за задание +${creditsGained}`);
    });

    cross.completeQuest(questId);

    eventBus.emit('quest:reward_applied', {
      questId,
      questTitle: questDef.title,
      xpGained,
      rewards: appliedRewards,
    });
  },
});
