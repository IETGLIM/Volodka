/* ─── Volodka RPG – Player Quest Rewards Slice ─── */
/* NPC gifting and quest reward auto-application. */

import type { StateCreator } from 'zustand';
import type { QuestType } from '@/shared/types/game';
import type { GiftPreference } from '@/data/npcGifts';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getItemDefinition, createInventoryItem } from '@/data/items';
import { getItemPreference, getAffinityChange, getGiftXpReward, getGiftReactionText } from '@/data/npcGifts';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { eventBus } from '@/engine/EventBus';
import { clamp, pushNotification } from '../shared';
import type { GameStoreState } from '../types';
import type { PlayerProgression } from '@/shared/types/game';

const GIFT_QUANTITY = 1;

function applyFairmathRelation(current: number, change: number): number {
  if (change === 0) return current;
  if (change >= 0) {
    const gain = Math.round(change * (100 - current) / 100);
    return Math.min(100, current + Math.max(gain, 1));
  }
  const loss = Math.round(Math.abs(change) * current / 100);
  return Math.max(0, current - Math.max(loss, 1));
}

function applyGiftXp(
  prog: PlayerProgression,
  amount: number,
): { progression: PlayerProgression; leveledUp: boolean; perkPointGained: boolean; prevLevel: number } {
  let newXp = prog.xp + amount;
  let newLevel = prog.level;
  let newXpToNext = prog.xpToNextLevel;
  let newSkillPoints = prog.skillPoints;
  let newPerkPoints = prog.perkPoints;
  let perkPointGained = false;
  const prevLevel = prog.level;

  while (newXp >= newXpToNext) {
    newXp -= newXpToNext;
    newLevel += 1;
    newSkillPoints += 1;
    if (newLevel % 3 === 0) {
      newPerkPoints += 1;
      perkPointGained = true;
    }
    newXpToNext = Math.floor(100 * Math.pow(1.25, newLevel - 1));
  }

  return {
    progression: {
      ...prog,
      level: newLevel,
      xp: newXp,
      xpToNextLevel: newXpToNext,
      skillPoints: newSkillPoints,
      perkPoints: newPerkPoints,
    },
    leveledUp: newLevel > prevLevel,
    perkPointGained,
    prevLevel,
  };
}

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
    const npcDef = NPC_DEFINITIONS.find((n) => n.id === npcId);
    if (!npcDef) {
      get().pushNotification('stress', 'Персонаж не найден');
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
      const invIdx = state.playerState.inventory.findIndex((i) => i.id === itemId);
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

      const inventory = [...state.playerState.inventory];
      const item = { ...inventory[invIdx] };
      item.quantity -= GIFT_QUANTITY;
      if (item.quantity <= 0) {
        inventory.splice(invIdx, 1);
      } else {
        inventory[invIdx] = item;
      }

      const currentAffinity = state.npcAffinity[npcId] ?? 0;
      const npcAffinity = {
        ...state.npcAffinity,
        [npcId]: clamp(currentAffinity + affinityChange, -100, 100),
      };

      let npcRelations = state.npcRelations;
      if (relationDelta !== 0) {
        const relations = [...state.npcRelations];
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
        const xpResult = applyGiftXp(progression, xpReward);
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
    const store = get();

    const questDef = QUEST_DEFINITIONS.find((d) => d.id === questId);
    if (!questDef) return;

    store.completeQuest(questId);

    const appliedRewards: string[] = [];

    const rewards = questDef.rewards ?? [];
    for (const reward of rewards) {
      switch (reward.type) {
        case 'addSkill':
          if (reward.skill && reward.value) {
            store.addSkill(reward.skill, reward.value);
            appliedRewards.push(`${reward.skill} +${reward.value}`);
          }
          break;
        case 'addKarma':
          if (reward.value) {
            store.addKarma(reward.value);
            appliedRewards.push(`Карма +${reward.value}`);
          }
          break;
        case 'addXp':
          if (reward.value) {
            store.addXp(reward.value);
            appliedRewards.push(`Опыт +${reward.value}`);
          }
          break;
        case 'addStat':
          if (reward.stat === 'energy' && reward.value) {
            store.addEnergy(reward.value);
            appliedRewards.push(`Энергия +${reward.value}`);
          } else if (reward.stat === 'stress' && reward.value) {
            store.addStress(reward.value);
            appliedRewards.push(`Стресс +${reward.value}`);
          }
          break;
        case 'addItem':
          if (reward.itemId && reward.value) {
            const added = store.addItem(createInventoryItem(reward.itemId, reward.value));
            if (added) {
              const itemDef = getItemDefinition(reward.itemId);
              appliedRewards.push(`${itemDef?.name ?? reward.itemId} x${reward.value}`);
            }
          }
          break;
        case 'setFlag':
          if (reward.flag) {
            store.setFlag(reward.flag, reward.flagValue ?? true);
            appliedRewards.push(`Флаг: ${reward.flag}`);
          }
          break;
        default:
          break;
      }
    }

    const questTypeXp: Record<QuestType, number> = {
      main: 50,
      side: 25,
      hidden: 75,
      daily: 15,
    };
    const xpGained = questTypeXp[questDef.questType] ?? 25;
    store.addXp(xpGained);
    appliedRewards.push(`Опыт за задание +${xpGained}`);

    eventBus.emit('quest:reward_applied', {
      questId,
      questTitle: questDef.title,
      xpGained,
      rewards: appliedRewards,
    });
  },
});
