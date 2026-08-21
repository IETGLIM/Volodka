/**
 * Lazy-loading bridge for the CombatSystem engine module.
 * The full combat engine (formulas, enemies, boss phases, AI behaviors, etc.)
 * is only imported when the first combat session actually starts, reducing
 * the initial JS bundle size.
 */

import type { ComponentType } from 'react';

type DisposeFn = () => void;
type ReviveFn = () => void;

let _disposeCombatSystem: DisposeFn | null = null;
let _reviveCombatSystem: ReviveFn | null = null;
let _loadPromise: Promise<void> | null = null;

function loadCombatSystem(): Promise<void> {
  if (_loadPromise) return _loadPromise;
  _loadPromise = import('@/engine/CombatSystem').then((mod) => {
    _disposeCombatSystem = mod.disposeCombatSystem;
    _reviveCombatSystem = mod.reviveCombatSystem;
  }).catch((err) => {
    console.error('[lazyCombatSystem] Failed to load CombatSystem:', err);
    _loadPromise = null; // Allow retry
  });
  return _loadPromise;
}

/** Preload the combat engine module (call when combat is about to start). */
export function preloadCombatSystem(): Promise<void> {
  return loadCombatSystem();
}

/** Dispose combat system. No-op if combat module was never loaded. */
export function disposeCombatSystemLazy(): void {
  _disposeCombatSystem?.();
}

/** Revive combat system. No-op if combat module was never loaded. */
export function reviveCombatSystemLazy(): void {
  _reviveCombatSystem?.();
}

/** Reset lazy cache (for HMR / tests). */
export function resetLazyCombatSystem(): void {
  _disposeCombatSystem = null;
  _reviveCombatSystem = null;
  _loadPromise = null;
}
