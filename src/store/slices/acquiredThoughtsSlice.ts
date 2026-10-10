/* ─── Volodka RPG – Acquired Thoughts Slice ─── */
/* v4.44: Кабинет мыслей (экипировка/проработка/бонусы) вырезан целиком.
 * Осталась только коллекция: story-эффекты продолжают выдавать мысли,
 * журнал показывает их список («Мысли»), трофей thoughts_acquired работает.
 * Никаких пассивных модификаторов, интерьекций и HUD-бейджей. */

import type { StateCreator } from 'zustand';
import { THOUGHT_NAMES_MAP } from '@/data/thoughtNames';
import type { GameStoreState } from '../types';
import { pickThoughtCabinetCrossActions } from '../crossSliceReads';

/* ─── Slice types ─── */

export interface AcquiredThoughtsSliceState {
  acquiredThoughtIds: string[];
}

export interface AcquiredThoughtsSliceActions {
  acquireThought: (id: string) => void;
  isThoughtAcquired: (id: string) => boolean;
}

export type AcquiredThoughtsSlice = AcquiredThoughtsSliceState & AcquiredThoughtsSliceActions;

/* ─── Slice creator ─── */

export const createAcquiredThoughtsSlice: StateCreator<
  GameStoreState,
  [],
  [],
  AcquiredThoughtsSlice
> = (set, get) => ({
  acquiredThoughtIds: [],

  acquireThought: (id) => {
    const thoughtName = THOUGHT_NAMES_MAP[id];
    if (!thoughtName) return;
    const countBefore = get().acquiredThoughtIds.length;

    set((state) => {
      if (state.acquiredThoughtIds.includes(id)) return state;
      return {
        acquiredThoughtIds: [...state.acquiredThoughtIds, id],
      };
    });

    // Cross-slice notification (outside set() — no cross-slice read/write)
    if (get().acquiredThoughtIds.length > countBefore) {
      pickThoughtCabinetCrossActions().pushNotification(
        'skill',
        `Мысль получена: ${thoughtName}`,
      );
    }
  },

  isThoughtAcquired: (id) => {
    return get().acquiredThoughtIds.includes(id);
  },
});
