import { describe, expect, it, beforeEach } from 'vitest';
import {
  createStaminaState,
  tickStaminaState,
  isSprintAllowedByStamina,
  tickPlayerStamina,
  getPlayerStamina,
  isPlayerSprintDraining,
  restorePlayerStamina,
  resetPlayerStaminaForNewSession,
  STAMINA_EXHAUST_UNLOCK_BONUS,
  STAMINA_IDLE_REGEN_MULTIPLIER,
} from '@/engine/player/playerStamina';
import {
  STAMINA_DRAIN_RATE,
  STAMINA_REGEN_RATE,
  STAMINA_REGEN_DELAY,
  STAMINA_SPRINT_THRESHOLD,
  STAMINA_CROUCH_REGEN_RATE,
} from '@/engine/player/playerConstants';

describe('tickStaminaState (pure core)', () => {
  it('drains stamina at STAMINA_DRAIN_RATE while sprinting', () => {
    const state = createStaminaState();
    const result = tickStaminaState(state, { dt: 1, sprinting: true, moving: true, crouching: false });
    expect(result.current).toBeCloseTo(100 - STAMINA_DRAIN_RATE, 5);
    expect(result.exhausted).toBe(false);
  });

  it('clamps drain at zero and marks the player exhausted', () => {
    const state = createStaminaState();
    const result = tickStaminaState(state, { dt: 30, sprinting: true, moving: true, crouching: false });
    expect(result.current).toBe(0);
    expect(result.exhausted).toBe(true);
  });

  it('regenerates after STAMINA_REGEN_DELAY once sprinting stops', () => {
    const state = createStaminaState();
    tickStaminaState(state, { dt: 1, sprinting: true, moving: true, crouching: false });
    const afterSprint = state.current; // 82

    // Delay window: stamina holds, delay counts down.
    tickStaminaState(state, { dt: 0.5, sprinting: false, moving: true, crouching: false });
    expect(state.current).toBeCloseTo(afterSprint, 5);
    expect(state.regenDelay).toBeCloseTo(STAMINA_REGEN_DELAY - 0.5, 5);

    // Delay hits zero on this tick — regen starts on the next one.
    tickStaminaState(state, { dt: 0.5, sprinting: false, moving: true, crouching: false });
    expect(state.current).toBeCloseTo(afterSprint, 5);

    tickStaminaState(state, { dt: 1, sprinting: false, moving: true, crouching: false });
    expect(state.current).toBeCloseTo(afterSprint + STAMINA_REGEN_RATE, 5);
  });

  it('sprinting refreshes the regen delay every tick', () => {
    const state = createStaminaState();
    tickStaminaState(state, { dt: 1, sprinting: true, moving: true, crouching: false });
    tickStaminaState(state, { dt: 1, sprinting: true, moving: true, crouching: false });
    expect(state.regenDelay).toBeCloseTo(STAMINA_REGEN_DELAY, 5);
  });

  it('crouching regenerates at STAMINA_CROUCH_REGEN_RATE', () => {
    const crouchIdle = createStaminaState();
    crouchIdle.current = 50;
    tickStaminaState(crouchIdle, { dt: 1, sprinting: false, moving: false, crouching: true });
    // Crouch base rate × idle rest bonus.
    expect(crouchIdle.current).toBeCloseTo(
      50 + STAMINA_CROUCH_REGEN_RATE * STAMINA_IDLE_REGEN_MULTIPLIER,
      5,
    );

    const crouchMoving = createStaminaState();
    crouchMoving.current = 50;
    tickStaminaState(crouchMoving, { dt: 1, sprinting: false, moving: true, crouching: true });
    expect(crouchMoving.current).toBeCloseTo(50 + STAMINA_CROUCH_REGEN_RATE, 5);
  });

  it('standing still regenerates faster than walking (idle bonus)', () => {
    const idle = createStaminaState();
    idle.current = 50;
    tickStaminaState(idle, { dt: 1, sprinting: false, moving: false, crouching: false });

    const walking = createStaminaState();
    walking.current = 50;
    tickStaminaState(walking, { dt: 1, sprinting: false, moving: true, crouching: false });

    expect(idle.current).toBeCloseTo(50 + STAMINA_REGEN_RATE * STAMINA_IDLE_REGEN_MULTIPLIER, 5);
    expect(idle.current).toBeGreaterThan(walking.current);
  });

  it('clamps regen at max', () => {
    const state = createStaminaState();
    state.current = 99;
    const result = tickStaminaState(state, { dt: 5, sprinting: false, moving: false, crouching: false });
    expect(result.current).toBe(100);
    expect(result.ratio).toBe(1);
  });

  it('zero dt is a no-op', () => {
    const state = createStaminaState();
    state.current = 40;
    const result = tickStaminaState(state, { dt: 0, sprinting: true, moving: true, crouching: false });
    expect(result.current).toBe(40);
    expect(state.regenDelay).toBe(0);
  });
});

describe('exhaustion threshold + hysteresis', () => {
  it('locks sprint at the threshold and unlocks only above threshold + hysteresis', () => {
    const state = createStaminaState();
    state.current = STAMINA_SPRINT_THRESHOLD + 0.5; // just above the threshold

    // Drain past the threshold → exhausted.
    tickStaminaState(state, { dt: 0.1, sprinting: true, moving: true, crouching: false });
    expect(state.exhausted).toBe(true);

    // Recover just below the unlock point — still locked.
    state.current = STAMINA_SPRINT_THRESHOLD + STAMINA_EXHAUST_UNLOCK_BONUS - 0.01;
    tickStaminaState(state, { dt: 0.016, sprinting: false, moving: true, crouching: false });
    expect(state.exhausted).toBe(true);

    // Cross the unlock point — sprint allowed again.
    state.current = STAMINA_SPRINT_THRESHOLD + STAMINA_EXHAUST_UNLOCK_BONUS;
    tickStaminaState(state, { dt: 0.016, sprinting: false, moving: true, crouching: false });
    expect(state.exhausted).toBe(false);
  });

  it('full recovery from zero exhaust takes the hysteresis into account', () => {
    const state = createStaminaState();
    // Sprint to full exhaustion.
    while (state.current > 0) {
      tickStaminaState(state, { dt: 0.5, sprinting: true, moving: true, crouching: false });
    }
    expect(state.exhausted).toBe(true);

    // Walk-regen 2s → 24 — still locked (unlock at 25).
    tickStaminaState(state, { dt: STAMINA_REGEN_DELAY, sprinting: false, moving: true, crouching: false });
    tickStaminaState(state, { dt: 2, sprinting: false, moving: true, crouching: false });
    expect(state.current).toBeCloseTo(2 * STAMINA_REGEN_RATE, 5);
    expect(state.exhausted).toBe(true);

    tickStaminaState(state, { dt: 1, sprinting: false, moving: true, crouching: false });
    expect(state.exhausted).toBe(false);
  });
});

describe('shared stamina singleton', () => {
  beforeEach(() => {
    restorePlayerStamina();
  });

  it('tickPlayerStamina drives the shared snapshot and the drain flag', () => {
    tickPlayerStamina({ dt: 1, sprinting: true, moving: true, crouching: false });
    const snap = getPlayerStamina();
    expect(snap.current).toBeCloseTo(100 - STAMINA_DRAIN_RATE, 5);
    expect(snap.sprintDraining).toBe(true);
    expect(isPlayerSprintDraining()).toBe(true);

    tickPlayerStamina({ dt: 0.016, sprinting: false, moving: false, crouching: false });
    expect(isPlayerSprintDraining()).toBe(false);
    expect(getPlayerStamina().sprintDraining).toBe(false);
  });

  it('isSprintAllowedByStamina blocks sprint while the shared state is exhausted', () => {
    expect(isSprintAllowedByStamina()).toBe(true);
    // Drain the shared state to exhaustion.
    while (getPlayerStamina().current > 0) {
      tickPlayerStamina({ dt: 0.5, sprinting: true, moving: true, crouching: false });
    }
    expect(isSprintAllowedByStamina()).toBe(false);

    restorePlayerStamina();
    expect(isSprintAllowedByStamina()).toBe(true);
    expect(getPlayerStamina().ratio).toBe(1);
  });

  it('resetPlayerStaminaForNewSession fully restores state', () => {
    while (getPlayerStamina().current > 0) {
      tickPlayerStamina({ dt: 0.5, sprinting: true, moving: true, crouching: false });
    }
    resetPlayerStaminaForNewSession();
    const snap = getPlayerStamina();
    expect(snap.current).toBe(snap.max);
    expect(snap.exhausted).toBe(false);
    expect(snap.sprintDraining).toBe(false);
  });
});
