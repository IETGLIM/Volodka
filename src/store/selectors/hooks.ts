/* ─── Volodka RPG – shared selector hooks (default store subscriptions) ─── */
/*
 * Prefer these over raw useGameStore(selector) in React components:
 * - useGameSelector — shallow compare for objects/arrays
 * - useGamePrimitive — Object.is for numbers/strings/booleans
 *
 * Action-only subscriptions may still use useGameStore((s) => s.action).
 */

import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../gameStore';
import type { GameStoreState } from '../types';

export { createShallowSelectorHook, createPrimitiveSelectorHook } from './createSelectorHooks';

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
