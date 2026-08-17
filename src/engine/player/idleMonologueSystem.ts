/* ─── Idle Monologue System — Volodka's introspective mutterings while standing still ───
 *
 * Fires a `volodka:thought` event when the player has provided no movement
 * input for 25–35 seconds in a scene. Adds Disco-Elysium-style introspective
 * depth without requiring any user action.
 *
 * Constraints (enforced by the caller in usePhysicsPlayerMovement.ts):
 *   - Never during cutscene / combat / dialogue / interaction-locked states.
 *   - Max 1 idle monologue per 60 s (global cooldown).
 *   - Idle timer resets on any movement input or scene change.
 *
 * The data pools live in `src/data/idleMonologues.ts` (per-scene, branched
 * by karma and stress). This module owns the cooldown bookkeeping and the
 * emit pipeline; the player movement hook owns the idle-time accumulation.
 */

import { eventBus } from '@/engine/EventBus';
import { dispatchStateAction, getGameSnapshot } from '@/engine/StateDispatcher';
import { pickIdleMonologue } from '@/data/idleMonologues';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';
import type { SceneId } from '@/shared/types/game';

/** Min idle time (ms) before an idle monologue may fire. */
export const IDLE_MONOLOGUE_THRESHOLD_MIN_MS = 25_000;

/** Max idle time (ms) — actual threshold is sampled randomly in [min, max]. */
export const IDLE_MONOLOGUE_THRESHOLD_MAX_MS = 35_000;

/** Global cooldown (ms) between idle monologues, regardless of scene. */
export const IDLE_MONOLOGUE_COOLDOWN_MS = 60_000;

/** Default visibility duration for an idle monologue bubble (ms). */
export const IDLE_MONOLOGUE_DURATION_MS = 5500;

/* ─── Cooldown bookkeeping ─── */

let _lastIdleMonologueTs = 0;

/**
 * Returns true if an idle monologue may be shown now (i.e. the 60 s global
 * cooldown has elapsed since the last one). DOES NOT mutate state — the
 * caller must call `markIdleMonologueShown()` after emitting.
 */
export function canShowIdleMonologue(now: number): boolean {
  return now - _lastIdleMonologueTs >= IDLE_MONOLOGUE_COOLDOWN_MS;
}

/** Record that an idle monologue was just shown (resets the cooldown). */
export function markIdleMonologueShown(now: number): void {
  _lastIdleMonologueTs = now;
}

/** Reset the cooldown (for tests / new game). */
export function resetIdleMonologueCooldown(): void {
  _lastIdleMonologueTs = 0;
}

registerHmrDispose(() => {
  _lastIdleMonologueTs = 0;
});

/* ─── Threshold sampling ─── */

/**
 * Sample a fresh idle threshold in [min, max] ms. Called once per idle cycle
 * (when the player starts being idle, or after a monologue has fired) so
 * the wait isn't predictable.
 */
export function sampleIdleMonologueThreshold(
  rng: () => number = Math.random,
): number {
  const span = IDLE_MONOLOGUE_THRESHOLD_MAX_MS - IDLE_MONOLOGUE_THRESHOLD_MIN_MS;
  return IDLE_MONOLOGUE_THRESHOLD_MIN_MS + rng() * span;
}

/* ─── Emission ─── */

/**
 * Build a ThoughtContext-like snapshot from the live store and try to emit
 * an idle monologue for the given scene. Returns true if a thought was
 * emitted, false otherwise (no pool defined, cooldown active, etc.).
 *
 * Phase guard: only fires during `exploration` (never combat / cutscene /
 * menu / intro). The interaction-locked guard is the caller's responsibility
 * since the player movement hook already short-circuits on `isLocked`.
 */
export function tryEmitIdleMonologue(
  sceneId: SceneId,
  now: number,
  rng: () => number = Math.random,
): boolean {
  if (!canShowIdleMonologue(now)) return false;

  const snap = getGameSnapshot();
  if (snap.mode !== 'exploration') return false;

  const { playerState } = snap;
  const text = pickIdleMonologue(
    sceneId,
    playerState.karma,
    playerState.stress,
    rng,
  );
  if (!text) return false;

  markIdleMonologueShown(now);
  eventBus.emit('volodka:thought', { text, duration: IDLE_MONOLOGUE_DURATION_MS });

  // Record in the persistent journal so the player can re-read later.
  try {
    dispatchStateAction({ type: 'journal/addThought', text, sceneId });
  } catch {
    /* store may not be ready during HMR */
  }
  return true;
}
