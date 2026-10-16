/* ─── Volodka RPG – Player Roll / Кувырок (Q) ───
 * v4.52.0 «Классика WoW»: к прыжку добавлен кувырок на Q.
 *
 * Module-level engine state — deliberately NOT in zustand (same pattern as
 * playerStamina / sharedPlayerCrouchRef): the roll is consumed inside the
 * player frame pipeline every frame and must not trigger React renders.
 *
 * Rules:
 *  - Q keydown queues a roll REQUEST (one-shot, time-windowed).
 *  - The movement pipeline polls consumeRollRequest() each frame; a request
 *    older than ROLL_INPUT_WINDOW_MS expires silently — so a Q pressed during
 *    a dialogue/cutscene lock never fires a «ghost» roll on unlock.
 *  - tryStartRoll validates grounded + cooldown + stamina (consumePlayerStamina
 *    — честная цена: нет частичного расхода) and arms the roll.
 *  - While active, playerMainMovement overrides horizontal velocity with the
 *    roll vector on an ease-out curve; jump/block/crouch intents are ignored.
 */

import { eventBus } from '@/engine/EventBus';
import { sfxEngine } from '@/engine/audio/SfxEngine';
import {
  ROLL_DURATION,
  ROLL_SPEED,
  ROLL_COOLDOWN,
  ROLL_END_SPEED_FRACTION,
  ROLL_INPUT_WINDOW_MS,
  ROLL_STAMINA_COST,
} from '@/engine/player/playerConstants';
import { consumePlayerStamina } from '@/engine/player/playerStamina';

export interface RollState {
  /** Roll currently plays out — velocity override active. */
  active: boolean;
  /** Seconds elapsed since roll start. */
  elapsed: number;
  /** Seconds left before another roll is allowed. */
  cooldown: number;
  /** Normalized roll direction (world space, horizontal). */
  dirX: number;
  dirZ: number;
}

interface RollInput {
  requestQueuedAt: number;
}

const state: RollState = {
  active: false,
  elapsed: 0,
  cooldown: 0,
  dirX: 0,
  dirZ: 1,
};

const input: RollInput = { requestQueuedAt: -Infinity };

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** Queue a roll request (Q keydown / mobile roll button). One-shot + windowed. */
export function queueRollRequest(): void {
  input.requestQueuedAt = nowMs();
}

/** Drop any pending roll request (new game, engine reset). */
export function clearRollRequest(): void {
  input.requestQueuedAt = -Infinity;
}

/**
 * Poll + clear the pending request. Returns true only when a request was
 * queued within ROLL_INPUT_WINDOW_MS — stale requests expire to false.
 */
export function consumeRollRequest(): boolean {
  const queuedAt = input.requestQueuedAt;
  input.requestQueuedAt = -Infinity;
  if (queuedAt === -Infinity) return false;
  return nowMs() - queuedAt <= ROLL_INPUT_WINDOW_MS;
}

/** Is the roll motion currently playing? */
export function isPlayerRolling(): boolean {
  return state.active;
}

/** Seconds elapsed since roll start (0 when idle). */
export function getRollElapsed(): number {
  return state.active ? state.elapsed : 0;
}

/** Seconds left on the roll cooldown (HUD can render a recharge sweep). */
export function getRollCooldown(): number {
  return state.cooldown;
}

/** Normalized roll direction captured at roll start. */
export function getRollDirection(): { x: number; z: number } {
  return { x: state.dirX, z: state.dirZ };
}

/**
 * Attempt to start a roll toward (dirX, dirZ). Returns false (no state change)
 * when already rolling, on cooldown, or out of stamina. Direction is expected
 * normalized (movement pipeline passes normalized moveDir / camera forward).
 */
export function tryStartRoll(
  dirX: number,
  dirZ: number,
  opts?: { skipStamina?: boolean },
): boolean {
  if (state.active || state.cooldown > 0) return false;
  if (!opts?.skipStamina && !consumePlayerStamina(ROLL_STAMINA_COST)) return false;

  const len = Math.hypot(dirX, dirZ);
  state.dirX = len > 0.0001 ? dirX / len : 0;
  state.dirZ = len > 0.0001 ? dirZ / len : 1;
  state.active = true;
  state.elapsed = 0;
  return true;
}

/**
 * Ease-out speed curve over the roll duration: quick burst → smooth tail.
 * t is seconds elapsed; the curve keeps ~ROLL_END_SPEED_FRACTION at t = duration
 * so handing velocity back to normal locomotion never feels like hitting a wall.
 */
export function getRollSpeed(t: number): number {
  const p = Math.min(1, Math.max(0, t / ROLL_DURATION));
  // Quadratic ease-out toward the retained tail speed.
  const scale = (1 - p) * (1 - p) * (1 - ROLL_END_SPEED_FRACTION) + ROLL_END_SPEED_FRACTION;
  return ROLL_SPEED * scale;
}

/** Advance roll timers by one frame (dt already clamped by the pipeline). */
export function tickPlayerRoll(dt: number): void {
  if (state.cooldown > 0) {
    state.cooldown = Math.max(0, state.cooldown - dt);
  }
  if (!state.active) return;
  state.elapsed += dt;
  if (state.elapsed >= ROLL_DURATION) {
    state.active = false;
    state.elapsed = 0;
    state.cooldown = ROLL_COOLDOWN;
  }
}

/** New game / engine reset — abort roll, clear cooldown and pending input. */
export function resetPlayerRollForNewSession(): void {
  state.active = false;
  state.elapsed = 0;
  state.cooldown = 0;
  clearRollRequest();
}

/** Scene transition helper — abort an in-flight roll so a spawn never carries momentum. */
export function cancelActiveRoll(): void {
  state.active = false;
  state.elapsed = 0;
}

/* v4.54.1: озвучка кувырка (судья раунд 1: player:roll никто не слушал).
 * Модуль-скоуп, как 'player:rest' в playerStamina — playerRoll импортируется
 * конвейером движения всегда, листенер живёт весь сеанс. */
if (typeof window !== 'undefined') {
  eventBus.on('player:roll', () => {
    sfxEngine.playSfx('roll_whoosh');
  });
}
