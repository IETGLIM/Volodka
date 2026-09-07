/* ─── Volodka RPG – Thought Cabinet selectors ─── */

import type { ThoughtCabinetItem, TrainablePlayerSkill } from '@/shared/types/game';
import { THOUGHT_CABINET_ITEMS, THOUGHT_CABINET_MAP } from '@/data/thoughtCabinet';
import {
  scaledThoughtEffects,
  thoughtProgressFraction,
  formatThoughtProgressPercent,
} from '@/shared/thoughts/thoughtInternalization';
import { useGameSelector, useGamePrimitive } from './hooks';

/* ─── React hooks ─── */

/** All acquired thought definitions (not just IDs). */
export function useAcquiredThoughts(): ThoughtCabinetItem[] {
  return useGameSelector((s) => {
    const acquired: ThoughtCabinetItem[] = [];
    for (const id of s.acquiredThoughtIds) {
      const def = THOUGHT_CABINET_MAP[id];
      if (def) acquired.push(def);
    }
    return acquired;
  });
}

/** Currently equipped thought definitions. */
export function useEquippedThoughts(): ThoughtCabinetItem[] {
  return useGameSelector((s) => {
    const equipped: ThoughtCabinetItem[] = [];
    for (const id of s.equippedThoughtIds) {
      const def = THOUGHT_CABINET_MAP[id];
      if (def) equipped.push(def);
    }
    return equipped;
  });
}

/** Thoughts that have been acquired and are not blocked by mutual exclusivity. */
export function useAvailableThoughts(): ThoughtCabinetItem[] {
  return useGameSelector((s) => {
    const equippedSet = new Set(s.equippedThoughtIds);
    const available: ThoughtCabinetItem[] = [];
    for (const id of s.acquiredThoughtIds) {
      const def = THOUGHT_CABINET_MAP[id];
      if (!def) continue;
      // Skip already equipped (they're not "available" to equip again)
      if (equippedSet.has(id)) continue;
      // Skip if an equipped thought excludes this one
      if (def.mutuallyExclusive) {
        const isBlocked = def.mutuallyExclusive.some((exId) => equippedSet.has(exId));
        if (isBlocked) continue;
      }
      available.push(def);
    }
    return available;
  });
}

/** Combined skill modifiers from all equipped thoughts, keyed by skill.
 * v4.16: для мыслей с аркой модификаторы масштабируются прогрессом проработки. */
export function useThoughtSkillModifiers(): Record<TrainablePlayerSkill, number> {
  return useGameSelector((s) => {
    const modifiers: Record<TrainablePlayerSkill, number> = {
      logic: 0,
      coding: 0,
      empathy: 0,
      persuasion: 0,
      intuition: 0,
      writing: 0,
      rhythm: 0,
    };
    for (const id of s.equippedThoughtIds) {
      const def = THOUGHT_CABINET_MAP[id];
      if (!def) continue;
      for (const effect of scaledThoughtEffects(def, s.thoughtInternalizationPoints?.[id])) {
        modifiers[effect.skill] += effect.modifier;
      }
    }
    return modifiers;
  });
}

/** Доля проработки мысли 0..1 (без арки — 1). */
export function useThoughtInternalizationFraction(id: string): number {
  return useGamePrimitive(
    (s) => THOUGHT_CABINET_MAP[id]?.internalization
      ? Math.min(
          (s.thoughtInternalizationPoints?.[id] ?? 0) / THOUGHT_CABINET_MAP[id].internalization!.requiredPoints,
          1,
        )
      : 1,
  );
}

/** Экипированные мысли с аркой, ещё не проработанные до конца. */
export function useInternalizingThoughts(): ThoughtCabinetItem[] {
  return useGameSelector((s) => {
    const inProgress: ThoughtCabinetItem[] = [];
    for (const id of s.equippedThoughtIds) {
      const def = THOUGHT_CABINET_MAP[id];
      if (!def?.internalization) continue;
      if (thoughtProgressFraction(def, s.thoughtInternalizationPoints?.[id]) < 1) {
        inProgress.push(def);
      }
    }
    return inProgress;
  });
}

/** Русская строка прогресса для UI («42%"). */
export function useThoughtInternalizationPercent(id: string): string {
  return formatThoughtProgressPercent(useThoughtInternalizationFraction(id));
}

/** Whether the thought cabinet slot is full (3 equipped). */
export function useThoughtCabinetFull(): boolean {
  return useGamePrimitive((s) => s.equippedThoughtIds.length >= 3);
}

/** All thought cabinet item definitions (for listing in UI). */
export function useAllThoughtCabinetItems(): ThoughtCabinetItem[] {
  // THOUGHT_CABINET_ITEMS is a static module-level const — safe to return directly.
  // The hook wrapper keeps the API consistent with other selectors.
  return THOUGHT_CABINET_ITEMS;
}
