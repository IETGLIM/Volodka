/* ─── Volodka RPG – Thought Cabinet Slice ─── */
/* Disco Elysium-inspired inner voices: acquire, equip (max 3), mutual exclusivity. */

import type { StateCreator } from 'zustand';
import { THOUGHT_CABINET_MAP, MAX_EQUIPPED_THOUGHTS } from '@/data/thoughtCabinet';
import type { GameStoreState } from '../types';
import { pickThoughtCabinetCrossActions } from '../crossSliceReads';

/* ─── Slice types ─── */

export interface ThoughtCabinetSliceState {
  acquiredThoughtIds: string[];
  equippedThoughtIds: string[];
}

export interface ThoughtCabinetSliceActions {
  acquireThought: (id: string) => void;
  equipThought: (id: string) => void;
  unequipThought: (id: string) => void;
  isThoughtAcquired: (id: string) => boolean;
  getEquippedThoughtEffects: () => ThoughtCabinetEffect[];
}

export type ThoughtCabinetSlice = ThoughtCabinetSliceState & ThoughtCabinetSliceActions;

/* ─── Slice creator ─── */

export const createThoughtCabinetSlice: StateCreator<
  GameStoreState,
  [],
  [],
  ThoughtCabinetSlice
> = (set, get) => ({
  acquiredThoughtIds: [],
  equippedThoughtIds: [],

  acquireThought: (id) => {
    const thoughtDef = THOUGHT_CABINET_MAP[id];
    if (!thoughtDef) return;
    const countBefore = get().acquiredThoughtIds.length;

    set((state) => {
      if (state.acquiredThoughtIds.includes(id)) return state;

      // If this thought is mutually exclusive with an already-acquired thought,
      // do not acquire it.
      if (thoughtDef.mutuallyExclusive) {
        const hasConflict = thoughtDef.mutuallyExclusive.some((exId) =>
          state.acquiredThoughtIds.includes(exId),
        );
        if (hasConflict) return state;
      }

      return {
        acquiredThoughtIds: [...state.acquiredThoughtIds, id],
      };
    });

    // Cross-slice notification (outside set() — no cross-slice read/write)
    if (get().acquiredThoughtIds.length > countBefore) {
      pickThoughtCabinetCrossActions().pushNotification(
        'skill',
        `Мысль получена: ${thoughtDef.name}`,
      );
    }
  },

  equipThought: (id) => {
    const thoughtDef = THOUGHT_CABINET_MAP[id];
    if (!thoughtDef) return;
    const equippedBefore = get().equippedThoughtIds;

    set((state) => {
      if (!state.acquiredThoughtIds.includes(id)) return state;
      if (state.equippedThoughtIds.includes(id)) return state;
      if (state.equippedThoughtIds.length >= MAX_EQUIPPED_THOUGHTS) return state;

      // Remove any mutually exclusive equipped thoughts
      let newEquipped = [...state.equippedThoughtIds];
      if (thoughtDef.mutuallyExclusive) {
        newEquipped = newEquipped.filter(
          (eqId) => !thoughtDef.mutuallyExclusive!.includes(eqId),
        );
      }

      // Check limit after potential removals
      if (newEquipped.length >= MAX_EQUIPPED_THOUGHTS) return state;

      return {
        equippedThoughtIds: [...newEquipped, id],
      };
    });

    // Cross-slice notification (outside set() — no cross-slice read/write)
    if (!equippedBefore.includes(id) && get().equippedThoughtIds.includes(id)) {
      pickThoughtCabinetCrossActions().pushNotification(
        'skill',
        `Мысль активирована: ${thoughtDef.name}`,
      );
    }
  },

  unequipThought: (id) =>
    set((state) => {
      if (!state.equippedThoughtIds.includes(id)) return state;
      return {
        equippedThoughtIds: state.equippedThoughtIds.filter((eqId) => eqId !== id),
      };
    }),

  isThoughtAcquired: (id) => {
    return get().acquiredThoughtIds.includes(id);
  },

  getEquippedThoughtEffects: () => {
    const state = get();
    const effects: ThoughtCabinetEffect[] = [];
    for (const eqId of state.equippedThoughtIds) {
      const def = THOUGHT_CABINET_MAP[eqId];
      if (def) {
        effects.push(...def.effects);
      }
    }
    return effects;
  },
});