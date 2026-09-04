/* ─── Volodka RPG – Stamina (sprint energy) ───
 * Module-level engine state — deliberately NOT in zustand: the tick runs in
 * the player frame pipeline every frame and must not trigger React renders
 * (same pattern as sharedPlayerCrouchRef / sharedVirtualControlsRef).
 * UI reads it via polling + direct DOM writes (FootstepPedometer pattern).
 *
 * Rules (audit 2-b P1 — stamina was dead, constants unused):
 *  - Sprint (run held + actually moving) drains STAMINA_DRAIN_RATE per second.
 *  - Walk / stand regenerates STAMINA_REGEN_RATE per second after a short
 *    delay (STAMINA_REGEN_DELAY) once sprinting stops; crouching and full
 *    rest recover faster.
 *  - Hitting the sprint threshold locks sprint out until stamina recovers
 *    above threshold + hysteresis (prevents on/off flicker near the bar's
 *    low end).
 */

import { eventBus } from '@/engine/EventBus';
import {
  STAMINA_MAX,
  STAMINA_DRAIN_RATE,
  STAMINA_REGEN_RATE,
  STAMINA_REGEN_DELAY,
  STAMINA_SPRINT_THRESHOLD,
  STAMINA_CROUCH_REGEN_RATE,
} from '@/engine/player/playerConstants';

/** Hysteresis: once exhausted, sprint re-locks until stamina climbs this far
 *  above STAMINA_SPRINT_THRESHOLD. */
export const STAMINA_EXHAUST_UNLOCK_BONUS = 15;

/** Standing still recovers faster than walking (full rest bonus). */
export const STAMINA_IDLE_REGEN_MULTIPLIER = 1.25;

export interface StaminaState {
  current: number;
  max: number;
  /** Sprint is locked out until stamina recovers above threshold + hysteresis. */
  exhausted: boolean;
  /** Seconds left before regen resumes after sprinting stopped. */
  regenDelay: number;
}

export interface StaminaTickInput {
  dt: number;
  /** Sprint is really happening this frame (run held + moving + allowed). */
  sprinting: boolean;
  moving: boolean;
  crouching: boolean;
}

export interface StaminaTickResult {
  current: number;
  ratio: number;
  exhausted: boolean;
}

export interface StaminaSnapshot extends StaminaTickResult {
  max: number;
  /** Sprint was actively draining stamina on the last tick. */
  sprintDraining: boolean;
}

export function createStaminaState(max: number = STAMINA_MAX): StaminaState {
  return { current: max, max, exhausted: false, regenDelay: 0 };
}

function snapshotOf(state: StaminaState): StaminaTickResult {
  return {
    current: state.current,
    ratio: state.max > 0 ? state.current / state.max : 1,
    exhausted: state.exhausted,
  };
}

/**
 * Pure per-frame tick (mutates `state`, returns a snapshot for callers).
 * dt is already clamped by the frame pipeline (SIM_DELTA_MAX) — defensive
 * clamping here only guards direct unit-test usage.
 */
export function tickStaminaState(
  state: StaminaState,
  input: StaminaTickInput,
): StaminaTickResult {
  const dt = input.dt;
  if (dt > 0) {
    if (input.sprinting) {
      state.current = Math.max(0, state.current - STAMINA_DRAIN_RATE * dt);
      state.regenDelay = STAMINA_REGEN_DELAY;
      if (state.current <= STAMINA_SPRINT_THRESHOLD) state.exhausted = true;
    } else if (state.regenDelay > 0) {
      state.regenDelay = Math.max(0, state.regenDelay - dt);
    } else {
      const base = input.crouching ? STAMINA_CROUCH_REGEN_RATE : STAMINA_REGEN_RATE;
      const restBonus = input.moving ? 1 : STAMINA_IDLE_REGEN_MULTIPLIER;
      state.current = Math.min(state.max, state.current + base * restBonus * dt);
    }
    if (
      state.exhausted
      && state.current >= STAMINA_SPRINT_THRESHOLD + STAMINA_EXHAUST_UNLOCK_BONUS
    ) {
      state.exhausted = false;
    }
  }
  return snapshotOf(state);
}

// ── Module singleton (single player — mirrors the sharedPlayer*Ref pattern) ──
const sharedStamina = createStaminaState();
let sprintDrainingLastTick = false;

/** Can the player start / keep sprinting right now? */
export function isSprintAllowedByStamina(): boolean {
  return !sharedStamina.exhausted && sharedStamina.current > STAMINA_SPRINT_THRESHOLD;
}

/** Advance the shared stamina state by one frame (player frame pipeline). */
export function tickPlayerStamina(input: StaminaTickInput): StaminaTickResult {
  sprintDrainingLastTick = input.sprinting && input.dt > 0;
  return tickStaminaState(sharedStamina, input);
}

/** Snapshot for HUD polling — no subscription churn, no re-renders. */
export function getPlayerStamina(): StaminaSnapshot {
  return {
    current: sharedStamina.current,
    max: sharedStamina.max,
    ratio: sharedStamina.max > 0 ? sharedStamina.current / sharedStamina.max : 1,
    exhausted: sharedStamina.exhausted,
    sprintDraining: sprintDrainingLastTick,
  };
}

/** True while sprint is actively draining stamina (drives SprintDrainOverlay). */
export function isPlayerSprintDraining(): boolean {
  return sprintDrainingLastTick;
}

/** Full restore — rest / sleep (restAtHome emits 'player:rest'). */
export function restorePlayerStamina(): void {
  sharedStamina.current = sharedStamina.max;
  sharedStamina.exhausted = false;
  sharedStamina.regenDelay = 0;
}

/**
 * Разовое расходование выносливости вне спринта (v4.8.7 «Опережающий удар»).
 * Возвращает false, если выносливости меньше нужного — списания нет
 * (никаких частичных расходов). После списания действует та же задержка
 * регенерации, что и после спринта — честная цена за действие.
 */
export function consumePlayerStamina(amount: number): boolean {
  if (!Number.isFinite(amount) || amount <= 0) return false;
  if (sharedStamina.current < amount) return false;
  sharedStamina.current -= amount;
  sharedStamina.regenDelay = Math.max(sharedStamina.regenDelay, STAMINA_REGEN_DELAY);
  return true;
}

/** New game / engine reset — full restore + clears the drain flag. */
export function resetPlayerStaminaForNewSession(): void {
  restorePlayerStamina();
  sprintDrainingLastTick = false;
}

// Rest at home (playerCoreSlice.restAtHome → storeEffects.schedulePlayerRested
// → app event bus) fully restores stamina. Registered at module scope the same
// way explorationStrategy arms its 'player:sprint_start' listener.
if (typeof window !== 'undefined') {
  eventBus.on('player:rest', () => {
    restorePlayerStamina();
  });
}
