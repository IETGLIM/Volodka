/**
 * When to show third-person avatar vs first-person exploration.
 * Third-person orbit + full-body avatar is the default for exploration and cinematics.
 */

import { useSyncExternalStore } from 'react';
import type { GamePhase } from '@/shared/gamePhase';
import { eventBus } from '@/engine/EventBus';

export type CinematicPresentationMode = 'first_person' | 'third_person';

export interface SetCinematicPresentationOptions {
  /**
   * When set on a `'third_person'` mode change, emits `camera:ease_back`
   * with `{ durationMs }` so the FollowCamera can lerp from its current
   * pose to the exploration strategy target over `easeMs` milliseconds
   * using a cubic-bezier (0.4, 0, 0.2, 1) curve. Smooths the hard cut
   * produced by ESC-skip on cutscenes. No-op for `'first_person'`.
   */
  easeMs?: number;
}

let presentationMode: CinematicPresentationMode = 'third_person';
let cinematicHoldActive = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function setCinematicPresentationMode(
  mode: CinematicPresentationMode,
  options?: SetCinematicPresentationOptions,
): void {
  // Emit the ease-back event BEFORE the early-return so a skip path that calls
  // `setCinematicPresentationMode('third_person', { easeMs: 600 })` still
  // triggers the camera blend even when the presentation mode was already
  // 'third_person' (the timeline may have flipped it via an earlier step).
  const easeMs = options?.easeMs;
  if (easeMs && easeMs > 0 && mode === 'third_person') {
    eventBus.emit('camera:ease_back', { durationMs: easeMs });
  }
  if (presentationMode === mode) return;
  presentationMode = mode;
  notify();
}

export function getCinematicPresentationMode(): CinematicPresentationMode {
  return presentationMode;
}

export function setCinematicHoldActive(active: boolean): void {
  if (cinematicHoldActive === active) return;
  cinematicHoldActive = active;
  notify();
}

/** Call on resetGame / load — module state survives Zustand resets. */
export function resetCinematicPresentation(): void {
  presentationMode = 'third_person';
  cinematicHoldActive = false;
  notify();
}

export function isCinematicHoldActive(): boolean {
  return cinematicHoldActive;
}

export function useCinematicPresentationMode(): CinematicPresentationMode {
  return useSyncExternalStore(subscribe, getCinematicPresentationMode, () => 'third_person');
}

export function useCinematicHoldActive(): boolean {
  return useSyncExternalStore(subscribe, () => cinematicHoldActive, () => false);
}

export function isIntroWakeupCutscene(cutsceneId: string | null): boolean {
  return cutsceneId === 'intro_wakeup';
}

/** Story / wake cutscenes that should show a full-body avatar (not FP arms). */
export function shouldShowThirdPersonAvatar(
  gameMode: GamePhase,
  activeCutsceneId: string | null,
): boolean {
  if (presentationMode === 'third_person') return true;
  if (cinematicHoldActive) return true;
  if (gameMode === 'cutscene' && activeCutsceneId) return true;
  return false;
}

/** FP exploration camera + arms — inverse of cinematic third-person beats. */
export function shouldUseFirstPersonExploration(
  gameMode: GamePhase,
  activeCutsceneId: string | null,
): boolean {
  if (gameMode !== 'exploration') return false;
  if (activeCutsceneId) return false;
  if (cinematicHoldActive) return false;
  if (presentationMode === 'third_person') return false;
  return true;
}

/** FP arms during exploration and street turn-based combat. */
export function shouldUseFirstPersonHands(
  gameMode: GamePhase,
  activeCutsceneId: string | null,
): boolean {
  if (gameMode === 'combat') return true;
  return shouldUseFirstPersonExploration(gameMode, activeCutsceneId);
}
