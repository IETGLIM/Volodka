/* ─── Volodka RPG – Player Slice (facade) ─── */
/* Composes focused player sub-slices into a single backward-compatible API. */

import type { StateCreator } from 'zustand';
import type { GameStoreState } from '../types';

import { createPlayerCoreSlice, type PlayerCoreSlice } from './playerCoreSlice';
import { createPlayerInventorySlice, type PlayerInventorySlice } from './playerInventorySlice';
import { createPlayerProgressionSlice, type PlayerProgressionSlice } from './playerProgressionSlice';
import { createPlayerEconomySlice, type PlayerEconomySlice } from './playerEconomySlice';
import { createPlayerQuestRewardsSlice, type PlayerQuestRewardsSlice } from './playerQuestRewardsSlice';

export type PlayerSliceState = Pick<
  PlayerCoreSlice,
  'playerState' | 'notifications' | 'activeTTLFlags'
>;

export type PlayerSliceActions =
  & Omit<PlayerCoreSlice, keyof PlayerSliceState>
  & PlayerInventorySlice
  & PlayerProgressionSlice
  & PlayerEconomySlice
  & PlayerQuestRewardsSlice;

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
