/* ─── Volodka RPG – Player Quest Rewards Slice ─── */
/* NPC gifting and quest reward auto-application. */

import type { StateCreator } from 'zustand';
import type { GiftPreference } from '@/data/npcGifts';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getItemDefinition, createInventoryItem } from '@/data/items';
import { getItemPreference, getAffinityChange, getGiftXpReward, getGiftReactionText } from '@/data/npcGifts';
import { findNpcById } from '@/data/allNpcDefinitions';
import { eventBus } from '@/engine/EventBus';
import { applyXpGain, clamp, pushNotification } from '../shared';
import { applyFairmathRelation } from '@/shared/fairmath';
import {
  findInventoryItemIndex,
  removeInventoryItem,
} from '../inventoryHelpers';
import type { GameStoreState } from '../types';
import { pickPlayerQuestRewardsCrossActions, readPlayerFromWorld } from '../crossSliceReads';
import {
  batchAddCredits,
  batchAddEnergy,
  batchAddItem,
  batchAddKarma,
  batchAddSkill,
  batchAddStress,
  batchAddXp,
  batchSetFlag,
  createRewardBatchDraft,
  createRewardBatchSideEffects,
  flushRewardBatchSideEffects,
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
    const npcDef = findNpcById(npcId);
    if (!npcDef) {
      pickPlayerQuestRewardsCrossActions(get).pushNotification('stress', 'Персонаж не найден');
      return null;
    }

    const preference = getItemPreference(npcId, itemId);
    const affinityChange = getAffinityChange(preference);
    const xpReward = getGiftXpReward(preference);
    const relationDelta = Math.round(affinityChange * 0.5);
    const npcName = npcDef.name;
    const reactionText = getGiftReactionText(npcName, preference);

    let giftResult: GiftPreference | null = null;
    let levelUpInfo: { newLevel: number; prevLevel: number; perkPointGained: boolean } | null = null;

    set((state) => {
      const invIdx = findInventoryItemIndex(state.playerState.inventory, itemId);
      if (invIdx < 0) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'У вас нет этого предмета'),
        };
      }

      const invItem = state.playerState.inventory[invIdx];
      if (invItem.quantity < GIFT_QUANTITY) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Недостаточно предметов'),
        };
      }

      const itemDef = getItemDefinition(itemId);
      if (itemDef?.questRelated) {
        return {
          notifications: pushNotification(state.notifications, 'stress', 'Нельзя подарить сюжетный предмет'),
        };
      }

      const { inventory, removed } = removeInventoryItem(
        state.playerState.inventory,
        itemId,
        GIFT_QUANTITY,
      );
      if (!removed) {
        return state;
      }

      const { npcAffinity: worldAffinity, npcRelations: worldRelations } = readPlayerFromWorld(state);
      const currentAffinity = worldAffinity[npcId] ?? 0;
      const npcAffinity = {
        ...worldAffinity,
        [npcId]: clamp(currentAffinity + affinityChange, -100, 100),
      };

      let npcRelations = worldRelations;
      if (relationDelta !== 0) {
        const relations = [...worldRelations];
        const relIdx = relations.findIndex((r) => r.npcId === npcId);
        if (relIdx >= 0) {
          const updated = { ...relations[relIdx] };
          updated.value = clamp(applyFairmathRelation(updated.value, relationDelta), 0, 100);
          relations[relIdx] = updated;
        } else {
          relations.push({
            npcId,
            value: clamp(applyFairmathRelation(50, relationDelta), 0, 100),
          });
        }
        npcRelations = relations;
      }

      let notifications = pushNotification(state.notifications, 'skill', reactionText);
      let progression = state.playerState.progression;

      if (xpReward > 0) {
        const xpResult = applyXpGain(progression, xpReward);
        progression = xpResult.progression;
        if (xpResult.leveledUp) {
          levelUpInfo = {
            newLevel: xpResult.progression.level,
            prevLevel: xpResult.prevLevel,
            perkPointGained: xpResult.perkPointGained,
          };
          notifications = pushNotification(
            notifications,
            'skill',
            xpResult.perkPointGained
              ? `Уровень ${xpResult.progression.level}! +1 очко навыка +1 очко черты!`
              : `Уровень ${xpResult.progression.level}! +1 очко навыка`,
          );
        }
      }

      giftResult = preference;

      return {
        playerState: {
          ...state.playerState,
          inventory,
          progression,
        },
        npcAffinity,
        npcRelations,
        notifications,
      };
    });

    if (!giftResult) return null;

    eventBus.emit('npc:gift', {
      npcId,
      itemId,
      preference: giftResult,
      affinityChange,
    });

    if (levelUpInfo) {
      queueMicrotask(() => {
        eventBus.emit('player:levelup', levelUpInfo!);
      });
    }

    return giftResult;
  },

  completeQuestAndApplyRewards: (questId) => {
    const questDef = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!questDef) return;

    const xpGained = getDefaultQuestXp(questDef.questType);
    const creditsGained = computeQuestCreditReward(questDef);

    const appliedRewards: string[] = [];
    const sideEffects = createRewardBatchSideEffects();

    set((state) => {
      const draft = createRewardBatchDraft(state.playerState, state.notifications);

      const { quests: worldQuests } = readPlayerFromWorld(state);
      const quests = worldQuests.map((q) => {
        if (q.questId !== questId) return q;
        return {
          ...q,
          status: 'completed' as const,
          objectives: Object.fromEntries(
            Object.keys(q.objectives).map((k) => [k, true]),
          ),
        };
      });

      draft.notifications = pushNotification(
        draft.notifications,
        'quest',
        `Задание выполнено: ${questDef.title}`,
      );

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

      return {
        quests,
        playerState: draft.playerState,
        notifications: draft.notifications,
      };
    });

    eventBus.emit('quest:completed', { questId, npcId: questDef.questGiverNpcId });
    flushRewardBatchSideEffects(sideEffects);

    eventBus.emit('quest:reward_applied', {
      questId,
      questTitle: questDef.title,
      xpGained,
      rewards: appliedRewards,
    });
  },
});
