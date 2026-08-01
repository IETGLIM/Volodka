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
import { scheduleNpcGift, scheduleQuestRewardApplied } from '../storeEffects';
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
import { getWorldStore } from '../storeBindings';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
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
  /** Complete a quest and auto-apply its rewards (skills, karma, XP, items, flags). Idempotent. */
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
    const cross = pickPlayerQuestRewardsCrossActions();
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
      const xpResult = applyXpToProgression(progression, xpReward, {
        prevSkills: state.playerState.skills,
        prevKarma: state.playerState.karma,
      });
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

    scheduleNpcGift({
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

    const existingQuest = getWorldStore().quests.find((q) => q.questId === questId);
    if (existingQuest?.status === 'completed') return;

    const xpGained = getDefaultQuestXp(questDef.questType);
    const creditsGained = computeQuestCreditReward(questDef);
    const appliedRewards: string[] = [];
    const cross = pickPlayerQuestRewardsCrossActions();

    // ── Deferred cross-slice reward effects ──
    // These effect types require dispatching to other store slices
    // (world, exploration, UI) and cannot be applied inside the
    // Immer draft batch.  Collected during the reward loop and
    // flushed after the batch commits.
    const deferredNpcChanges: Array<{ npcId: string; relation: number }> = [];
    const deferredQuestTriggers: string[] = [];
    const deferredPoemCollects: string[] = [];
    const deferredLoreDiscovers: string[] = [];

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
          case 'npcChange':
            // Deferred — requires world store dispatch for NPC relations
            if (reward.npcId && reward.npcChange?.relation) {
              deferredNpcChanges.push({ npcId: reward.npcId, relation: reward.npcChange.relation });
              appliedRewards.push(`Отношение ${reward.npcId} ${reward.npcChange.relation > 0 ? '+' : ''}${reward.npcChange.relation}`);
            }
            break;
          case 'triggerQuest':
            // Deferred — requires world store dispatch for quest activation
            if (reward.questId) {
              deferredQuestTriggers.push(reward.questId);
              appliedRewards.push(`Задание: ${reward.questId}`);
            }
            break;
          case 'collectPoem':
            // Deferred — requires world store dispatch for poem collection
            if (reward.poemId) {
              deferredPoemCollects.push(reward.poemId);
              appliedRewards.push(`Стих: ${reward.poemId}`);
            }
            break;
          case 'discoverLore':
            // Deferred — requires UI store dispatch for lore discovery
            if (reward.loreId) {
              const loreIds = reward.loreId.split(',').map((s) => s.trim()).filter(Boolean);
              deferredLoreDiscovers.push(...loreIds);
              appliedRewards.push(`Лор: ${reward.loreId}`);
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

    // ── Flush deferred cross-slice effects ──
    const world = getWorldStore();
    for (const { npcId, relation } of deferredNpcChanges) {
      cross.setNpcRelation(npcId, relation);
    }
    for (const questId of deferredQuestTriggers) {
      world.activateQuest(questId);
    }
    for (const poemId of deferredPoemCollects) {
      world.collectPoem(poemId);
    }
    for (const loreId of deferredLoreDiscovers) {
      // lore/discover dispatched through applyGameAction to reach UI store
      dispatchGameAction({ type: 'lore/discover', entryId: loreId });
    }

    cross.completeQuest(questId);

    scheduleQuestRewardApplied({
      questId,
      questTitle: questDef.title,
      xpGained,
      rewards: appliedRewards,
    });
  },
});
