/* ─── Volodka RPG – Combat Gamepad Input Hook ───
   Polls gamepad during combat mode and emits combat events on the EventBus.
   Follows the same RAF-polling pattern as useGamepadInput but scoped to combat.

   Only active when the game is in combat mode and it's the player's turn.
   Emits edge-detected button presses (no auto-repeat for face/shoulder buttons).
   D-pad navigation supports repeat/hold for menu scrolling.
*/

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getGamePhase } from '@/shared/gamePhase';
import {
  GAMEPAD,
  pollGamepad,
  consumeButtonPress,
} from '@/engine/input/gamepad';
import { eventBus } from '@/engine/EventBus';
import { getCombatState } from '@/engine/CombatSystem';
import {
  COMBAT_GAMEPAD_MAP,
  COMBAT_SHOULDER_MAP,
  COMBAT_DPAD_MAP,
  TRIGGER_PRESS_THRESHOLD,
  COMBAT_GAMEPAD_EVENTS,
  type CombatGamepadAction,
  type CombatShoulderAction,
} from '@/engine/combat/combatGamepadMap';

/** Minimum interval (ms) between D-pad repeat events when holding. */
const DPAD_REPEAT_INITIAL_MS = 250;
const DPAD_REPEAT_SUBSEQUENT_MS = 120;

/** Maps a CombatGamepadAction to its eventBus event name. */
function actionToEvent(action: CombatGamepadAction): string {
  switch (action) {
    case 'attack': return COMBAT_GAMEPAD_EVENTS.ATTACK;
    case 'defend': return COMBAT_GAMEPAD_EVENTS.DEFEND;
    case 'flee': return COMBAT_GAMEPAD_EVENTS.FLEE;
    case 'poem_cycle_next': return COMBAT_GAMEPAD_EVENTS.POEM_CYCLE_NEXT;
  }
}

/** Maps a CombatShoulderAction to its eventBus event name. */
function shoulderActionToEvent(action: CombatShoulderAction): string {
  switch (action) {
    case 'poem_cycle_prev': return COMBAT_GAMEPAD_EVENTS.POEM_CYCLE_PREV;
    case 'poem_cycle_next': return COMBAT_GAMEPAD_EVENTS.POEM_CYCLE_NEXT;
    case 'poem_use_selected': return COMBAT_GAMEPAD_EVENTS.POEM_USE_SELECTED;
  }
}

/** Hook that polls the gamepad and emits combat events during combat mode. */
export function useCombatGamepad(): void {
  const previousButtonsRef = useRef<Map<number, boolean[]>>(new Map());
  const previousLtRef = useRef(false);
  const dpadRepeatTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const dpadLastFireRef = useRef<Map<number, number>>(new Map());
  const dpadFirstPressRef = useRef<Map<number, boolean>>(new Map());

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const frame = pollGamepad();
      const state = useGameStore.getState();
      const phase = getGamePhase({
        mainMenuOpen: state.mainMenuOpen,
        introActive: state.introActive,
        combatActive: state.combatActive,
        activeCutsceneId: state.activeCutsceneId,
      });

      // Only process combat gamepad input during combat mode
      if (phase !== 'combat') {
        previousButtonsRef.current.clear();
        previousLtRef.current = false;
        clearDpadTimers();
        rafId = requestAnimationFrame(tick);
        return;
      }

      const combatState = getCombatState();
      const isPlayerTurn = combatState?.isPlayerTurn === true && combatState?.status === 'active';

      if (frame.connected) {
        const padIdx = frame.index;

        // ── Face buttons (A/B/X/Y) ──
        for (const [btnIdx, action] of Object.entries(COMBAT_GAMEPAD_MAP)) {
          const idx = Number(btnIdx);
          const pressed = frame.buttons[idx] ?? false;
          if (consumeButtonPress(padIdx, idx, pressed, previousButtonsRef)) {
            if (isPlayerTurn) {
              const eventName = actionToEvent(action as CombatGamepadAction);
              eventBus.emit(eventName as never, {} as never);
            }
          }
        }

        // ── Shoulder buttons (LB/RB) ──
        for (const [btnIdx, action] of Object.entries(COMBAT_SHOULDER_MAP)) {
          const idx = Number(btnIdx);
          const pressed = frame.buttons[idx] ?? false;
          if (consumeButtonPress(padIdx, idx, pressed, previousButtonsRef)) {
            if (isPlayerTurn) {
              const eventName = shoulderActionToEvent(action as CombatShoulderAction);
              eventBus.emit(eventName as never, {} as never);
            }
          }
        }

        // ── Left trigger (LT) → Use selected poem power ──
        const ltPressed = frame.lt >= TRIGGER_PRESS_THRESHOLD;
        if (ltPressed && !previousLtRef.current) {
          if (isPlayerTurn) {
            eventBus.emit(COMBAT_GAMEPAD_EVENTS.POEM_USE_SELECTED as never, {} as never);
          }
        }
        previousLtRef.current = ltPressed;

        // ── D-pad navigation with repeat ──
        const now = Date.now();
        for (const [btnIdx, direction] of Object.entries(COMBAT_DPAD_MAP)) {
          const idx = Number(btnIdx);
          const pressed = frame.buttons[idx] ?? false;
          const wasPressed = previousButtonsRef.current.get(padIdx)?.[idx] ?? false;

          if (pressed && !wasPressed) {
            // First press — fire immediately
            eventBus.emit(COMBAT_GAMEPAD_EVENTS.DPAD_NAV as never, { direction } as never);
            dpadLastFireRef.current.set(idx, now);
            dpadFirstPressRef.current.set(idx, true);
          } else if (pressed && wasPressed) {
            // Held — repeat after delay
            const lastFire = dpadLastFireRef.current.get(idx) ?? 0;
            const isFirst = dpadFirstPressRef.current.get(idx) ?? false;
            const interval = isFirst ? DPAD_REPEAT_INITIAL_MS : DPAD_REPEAT_SUBSEQUENT_MS;
            if (now - lastFire >= interval) {
              eventBus.emit(COMBAT_GAMEPAD_EVENTS.DPAD_NAV as never, { direction } as never);
              dpadLastFireRef.current.set(idx, now);
              dpadFirstPressRef.current.set(idx, false);
            }
          } else {
            dpadFirstPressRef.current.delete(idx);
            dpadLastFireRef.current.delete(idx);
          }

          // Track button state for D-pad edge detection
          let prev = previousButtonsRef.current.get(padIdx);
          if (!prev) {
            prev = [];
            previousButtonsRef.current.set(padIdx, prev);
          }
          prev[idx] = pressed;
        }
      } else {
        // Gamepad disconnected — clear all state
        previousButtonsRef.current.clear();
        previousLtRef.current = false;
        clearDpadTimers();
      }

      rafId = requestAnimationFrame(tick);
    };

    function clearDpadTimers(): void {
      dpadRepeatTimersRef.current.forEach((timer) => clearTimeout(timer));
      dpadRepeatTimersRef.current.clear();
      dpadLastFireRef.current.clear();
      dpadFirstPressRef.current.clear();
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      clearDpadTimers();
    };
  }, []);
}
