/**
 * Poem power activation — exploration rituals route through unified poemReveal.
 * Combat / skip conditions activate immediately (no reveal UI).
 */

import { eventBus } from '@/engine/EventBus';
import { getAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import { isMainPoemId } from '@/data/poemCollectionMeta';
import {
  activatePoemPowerById,
  canUsePower,
  getPoemPower,
} from '@/engine/PoemPowerSystem';
import { dispatchGameAction, getGameSnapshot } from '@/engine/GameActionDispatcher';
import {
  cancelPoemReveal,
  cancelPoemRevealMode,
  getActivePoemReveal,
  hasSeenPoemRitualThisSession,
  isPoemRevealBusy,
  isPoemRevealUiActive,
  markPoemRitualSeen,
  requestPoemReveal,
  setPoemRevealUiActive,
} from '@/engine/poemReveal/poemRevealOrchestrator';

export type PoemPowerActivationContext = 'exploration' | 'combat';

export type PoemPowerActivationResult =
  | { status: 'activated' }
  | { status: 'cutscene_pending' }
  | { status: 'failed'; reason: 'unavailable' | 'unknown' | 'cutscene_busy' };

function readPendingPoemId(): string | null {
  return getGameSnapshot().pendingPoemReadingId;
}

function writePendingPoemId(poemId: string | null): void {
  dispatchGameAction({ type: 'poem/setPendingReading', poemId });
}

export function resetPoemReadingSession(): void {
  writePendingPoemId(null);
}

/** @deprecated Prefer setPoemRevealUiActive — kept for interstitial tests. */
export function setPoemReadingCutsceneUiActive(poemId: string | null): void {
  setPoemRevealUiActive(poemId);
}

export function isPoemReadingCutsceneUiActive(): boolean {
  const active = getActivePoemReveal();
  return isPoemRevealUiActive() && active?.mode === 'power_ritual';
}

/** Abort an in-flight ritual when panels dismiss or scene/combat interrupts. */
export function abortPoemReadingIfPending(): void {
  if (!readPendingPoemId() && getActivePoemReveal()?.mode !== 'power_ritual') return;
  cancelPoemReadingCutscene();
}

export function getPendingPoemReadingId(): string | null {
  const active = getActivePoemReveal();
  if (active?.mode === 'power_ritual') return active.poemId;
  return readPendingPoemId();
}

export function hasReadPoemThisSession(poemId: string): boolean {
  return hasSeenPoemRitualThisSession(poemId);
}

/** Whether the excerpt ritual should be skipped for this poem. */
export function shouldSkipPoemReadingCutscene(poemId: string): boolean {
  if (getAccessibilitySettings().skipPoemCutscenes) return true;
  if (hasSeenPoemRitualThisSession(poemId)) return true;
  if (!isMainPoemId(poemId)) return true;
  return false;
}

function activateDirect(poemId: string): PoemPowerActivationResult {
  const ok = activatePoemPowerById(poemId);
  if (!ok) {
    return { status: 'failed', reason: 'unavailable' };
  }
  markPoemRitualSeen(poemId);
  return { status: 'activated' };
}

/**
 * Request poem power activation — main story poems play the unified
 * power_ritual reveal (excerpt shell) first. Combat and skip conditions
 * apply the power immediately.
 */
export function requestPoemPowerActivation(
  poemId: string,
  context: PoemPowerActivationContext = 'exploration',
): PoemPowerActivationResult {
  const power = getPoemPower(poemId);
  if (!power) {
    return { status: 'failed', reason: 'unknown' };
  }
  if (!canUsePower(poemId)) {
    return { status: 'failed', reason: 'unavailable' };
  }

  if (context === 'combat' || shouldSkipPoemReadingCutscene(poemId)) {
    return activateDirect(poemId);
  }

  const active = getActivePoemReveal();
  if (active?.mode === 'power_ritual' && isPoemRevealUiActive()) {
    return { status: 'failed', reason: 'cutscene_busy' };
  }

  if (active?.mode === 'power_ritual' && !isPoemRevealUiActive()) {
    cancelPoemRevealMode('power_ritual');
  }

  writePendingPoemId(poemId);
  const accepted = requestPoemReveal(poemId, 'power_ritual');
  if (!accepted) {
    writePendingPoemId(null);
    return { status: 'failed', reason: isPoemRevealBusy() ? 'cutscene_busy' : 'unknown' };
  }
  return { status: 'cutscene_pending' };
}

/**
 * Called when the power_ritual reveal finishes — applies power.
 * PoemRevealHost should call completePoemReveal after this (or this calls it).
 */
export function completePoemReadingCutscene(poemId: string): boolean {
  writePendingPoemId(null);
  markPoemRitualSeen(poemId);
  eventBus.emit('camera:poem_reading_end', {});
  return activatePoemPowerById(poemId);
}

/** Abort an in-flight reading ritual without activating the power. */
export function cancelPoemReadingCutscene(): void {
  writePendingPoemId(null);
  cancelPoemRevealMode('power_ritual');
}

let unsubPoemReadingLifecycle: (() => void) | null = null;

/** Re-bind after EventBus dispose (StrictMode / HMR). */
export function bindPoemReadingCutsceneLifecycleListeners(): void {
  unbindPoemReadingCutsceneLifecycleListeners();
  const unsubs = [
    eventBus.on('scene:transition_start', () => {
      writePendingPoemId(null);
    }),
    eventBus.on('combat:start', () => {
      writePendingPoemId(null);
    }),
  ];
  unsubPoemReadingLifecycle = () => {
    for (const unsub of unsubs) unsub();
  };
}

export function unbindPoemReadingCutsceneLifecycleListeners(): void {
  unsubPoemReadingLifecycle?.();
  unsubPoemReadingLifecycle = null;
}

bindPoemReadingCutsceneLifecycleListeners();

/** @deprecated Prefer cancelPoemReveal */
export function cancelAllPoemReveals(): void {
  cancelPoemReveal();
}
