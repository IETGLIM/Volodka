/* ─── Volodka RPG – memoized selector hook factories ─── */
/* Module-level selector fns + shallow/primitive hooks — stable references for Zustand. */

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../gameStore';
import type { GameStoreState } from '../types';

/** Shallow-stable hook for object/array selector results. */
export function createShallowSelectorHook<T>(
  selector: (state: GameStoreState) => T,
): () => T {
  return function useSelected() {
    return useGameStore(useShallow(selector));
  };
}

/** Hook for primitive selector results (Object.is equality). */
export function createPrimitiveSelectorHook<
  T extends string | number | boolean | null | undefined,
>(selector: (state: GameStoreState) => T): () => T {
  return function useSelected() {
    return useGameStore(selector);
  };
}
