/**
 * When to show third-person avatar vs first-person exploration.
 * Cinematic beats (wake-up, story cutscenes, scene-transition hold) use third person;
 * normal exploration uses FP camera + GLB arms.
 */

import { useSyncExternalStore } from 'react';
import type { GamePhase } from '@/shared/gamePhase';

export type CinematicPresentationMode = 'first_person' | 'third_person';

let presentationMode: CinematicPresentationMode = 'first_person';
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

export function isCinematicHoldActive(): boolean {
  return cinematicHoldActive;
}

export function useCinematicPresentationMode(): CinematicPresentationMode {
  return useSyncExternalStore(subscribe, getCinematicPresentationMode, () => 'first_person');
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
