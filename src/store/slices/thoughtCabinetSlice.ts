/* ─── Volodka RPG – Thought Cabinet Slice ─── */
/* Disco Elysium-inspired inner voices: acquire, equip (max 3), mutual exclusivity.
 * v4.16: арки проработки (internalization) — экипированная мысль с аркой
 * копит очки прозрения за игровые события; эффекты растут с прогрессом. */

import type { StateCreator } from 'zustand';
import { THOUGHT_CABINET_MAP, MAX_EQUIPPED_THOUGHTS } from '@/data/thoughtCabinet';
import type { ThoughtCabinetEffect } from '@/shared/types/definitions/thoughtCabinet';
import { scaledThoughtEffects } from '@/shared/thoughts/thoughtInternalization';
import type { ThoughtInsightEventKind } from '@/shared/thoughts/thoughtInternalization';
import { thoughtInsightPoints, advanceInternalizationPoints } from '@/shared/thoughts/thoughtInternalization';
import type { GameStoreState } from '../types';
import { pickThoughtCabinetCrossActions } from '../crossSliceReads';

/* ─── Slice types ─── */

export interface ThoughtCabinetSliceState {
  acquiredThoughtIds: string[];
  equippedThoughtIds: string[];
  /** Очки прозрения по id мысли (только мысли с аркой internalization). */
  thoughtInternalizationPoints: Record<string, number>;
}

export interface ThoughtCabinetSliceActions {
  acquireThought: (id: string) => void;
  equipThought: (id: string) => void;
  unequipThought: (id: string) => void;
  isThoughtAcquired: (id: string) => boolean;
  getEquippedThoughtEffects: () => ThoughtCabinetEffect[];
  /** Продвинуть проработку экипированных мыслей за игровое событие. */
  advanceThoughtInternalization: (event: ThoughtInsightEventKind) => void;
  /** Доля проработки мысли 0..1 (без арки — 1). */
  getThoughtInternalizationFraction: (id: string) => number;
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
  thoughtInternalizationPoints: {},

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
        effects.push(...scaledThoughtEffects(def, state.thoughtInternalizationPoints[eqId]));
      }
    }
    return effects;
  },

  advanceThoughtInternalization: (event) => {
    const points = thoughtInsightPoints(event);
    const state = get();
    const result = advanceInternalizationPoints(
      state.thoughtInternalizationPoints,
      state.equippedThoughtIds,
      points,
    );
    if (result.advanced.length === 0) return;

    set({ thoughtInternalizationPoints: result.next });

    // Кросс-слайс побочные эффекты — вне set() (паттерн среза).
    const { pushNotification } = pickThoughtCabinetCrossActions();
    for (const { thought, milestone } of result.crossedMilestones) {
      pushNotification('skill', `${thought.name}: ${milestone.text}`);
    }
    for (const id of result.completed) {
      const def = THOUGHT_CABINET_MAP[id];
      if (!def) continue;
      const completion = def.internalization?.completionText;
      pushNotification(
        'skill',
        completion
          ? `Мысль проработана: ${def.name}. ${completion}`
          : `Мысль проработана: ${def.name}`,
      );
    }
  },

  getThoughtInternalizationFraction: (id) => {
    const state = get();
    const def = THOUGHT_CABINET_MAP[id];
    if (!def || !def.internalization) return 1;
    const { requiredPoints } = def.internalization;
    if (requiredPoints <= 0) return 1;
    const points = Math.min(state.thoughtInternalizationPoints[id] ?? 0, requiredPoints);
    return points / requiredPoints;
  },
});