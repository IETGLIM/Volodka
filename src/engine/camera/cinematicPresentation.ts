/**
 * When to show third-person avatar vs first-person exploration.
 * Third-person orbit + full-body avatar is the default for exploration and cinematics.
 */

import { useSyncExternalStore } from 'react';
import type { GamePhase } from '@/shared/gamePhase';

export type CinematicPresentationMode = 'first_person' | 'third_person';

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

export function setCinematicPresentationMode(mode: CinematicPresentationMode): void {
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
