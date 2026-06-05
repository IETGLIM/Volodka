/* ─── Volodka RPG – Player Slice (facade) ─── */
/* Composes focused player sub-slices into a single backward-compatible API. */

import type { StateCreator } from 'zustand';
import type { InventoryItem, TrainablePlayerSkill, EquipmentSlot } from '@/shared/types/game';
import type { PerkEffect } from '@/data/perks';
import type { GiftPreference } from '@/data/npcGifts';
import type { GameNotification } from '../shared';
import type { GameStoreState } from '../types';
import type { PlayerState } from '@/shared/types/game';

import { createPlayerCoreSlice } from './playerCoreSlice';
import { createPlayerInventorySlice } from './playerInventorySlice';
import { createPlayerProgressionSlice } from './playerProgressionSlice';
import { createPlayerEconomySlice } from './playerEconomySlice';
import { createPlayerQuestRewardsSlice } from './playerQuestRewardsSlice';

/* ─── Slice types (backward-compatible union) ─── */

export interface PlayerSliceState {
  playerState: PlayerState;
  notifications: GameNotification[];
  /** TTL-based active flags with expiry timestamps (survives save/load) */
  activeTTLFlags: Array<{ key: string; poemId: string; expiryTimestamp: number }>;
}

export interface PlayerSliceActions {
  visitNode: (id: string) => void;
  addSkill: (skill: TrainablePlayerSkill, amount: number) => void;
  addKarma: (amount: number) => void;
  addStress: (amount: number) => void;
  addEnergy: (amount: number) => void;
  setFlag: (key: string, value: boolean) => void;
  addItem: (item: InventoryItem) => boolean;
  removeItem: (itemId: string, quantity: number) => void;
  pushNotification: (type: GameNotification['type'], text: string) => void;
  dismissNotification: (id: string) => void;
  addXp: (amount: number) => void;
  unlockSkillTreeNode: (skillId: string) => void;
  canUnlockSkill: (nodeId: string) => boolean;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  restAtHome: () => void;
  autoRegenBetweenScenes: () => void;
  setActiveTTLFlags: (flags: Array<{ key: string; poemId: string; expiryTimestamp: number }>) => void;
  advanceAct: () => void;
  craftItem: (recipeId: string) => void;
  canCraft: (recipeId: string) => boolean;
  buyItem: (npcId: string, itemId: string) => void;
  sellItem: (npcId: string, itemId: string) => void;
  canBuyItem: (npcId: string, itemId: string) => boolean;
  canSellItem: (npcId: string, itemId: string) => boolean;
  addCredits: (amount: number) => void;
  acquirePerk: (perkId: string) => void;
  canAcquirePerk: (perkId: string) => boolean;
  getActivePerkEffects: () => PerkEffect[];
  giftItemToNPC: (itemId: string, npcId: string) => GiftPreference | null;
  completeQuestAndApplyRewards: (questId: string) => void;
}

export type PlayerSlice = PlayerSliceState & PlayerSliceActions;

/* ─── Slice creator ─── */

export const createPlayerSlice: StateCreator<
  GameStoreState,
  [],
  [],
  PlayerSlice
> = (...a) => ({
  ...createPlayerCoreSlice(...a),
  ...createPlayerInventorySlice(...a),
  ...createPlayerProgressionSlice(...a),
  ...createPlayerEconomySlice(...a),
  ...createPlayerQuestRewardsSlice(...a),
});
