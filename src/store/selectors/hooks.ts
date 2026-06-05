/* ─── Volodka RPG – shared selector hooks ─── */

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../gameStore';
import type { GameStoreState } from '../types';

/**
 * Subscribe with shallow equality — use for selectors returning objects or arrays.
 * Prevents re-renders when a selector constructs a new reference but values are unchanged.
 */
export function useGameSelector<T>(selector: (state: GameStoreState) => T): T {
  return useGameStore(useShallow(selector));
}

/**
 * Subscribe to a primitive (string, number, boolean, null, undefined).
 * Plain Object.is equality — no useShallow overhead needed.
 */
export function useGamePrimitive<T extends string | number | boolean | null | undefined>(
  selector: (state: GameStoreState) => T,
): T {
  return useGameStore(selector);
}
