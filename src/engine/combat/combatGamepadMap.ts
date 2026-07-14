/* ─── Volodka RPG – Combat Gamepad Button Mapping ───
   Maps standard gamepad buttons to combat actions.
   Extensible: add new entries to COMBAT_GAMEPAD_MAP or COMBAT_SHOULDER_MAP
   without touching the hook or combat system.
*/

import { GAMEPAD } from '@/engine/input/gamepad';

/** Combat actions that can be triggered by gamepad face buttons. */
export type CombatGamepadAction =
  | 'attack'
  | 'defend'
  | 'flee'
  | 'poem_cycle_next';

/** Shoulder / trigger combat actions. */
export type CombatShoulderAction =
  | 'poem_cycle_prev'
  | 'poem_cycle_next'
  | 'poem_use_selected';

/** D-pad navigation directions within combat menus. */
export type CombatDpadDirection = 'up' | 'down' | 'left' | 'right';

/** Face button → combat action mapping.
 *  Standard mapping: A=South, B=East, X=West, Y=North. */
export const COMBAT_GAMEPAD_MAP: Readonly<Record<number, CombatGamepadAction>> = {
  [GAMEPAD.A]: 'attack',        // A (south) → Attack
  [GAMEPAD.B]: 'defend',        // B (east)  → Defend
  [GAMEPAD.X]: 'flee',          // X (west)  → Flee
  [GAMEPAD.Y]: 'poem_cycle_next', // Y (north) → Cycle poem selection
};

/** Shoulder button → combat action mapping. */
export const COMBAT_SHOULDER_MAP: Readonly<Record<number, CombatShoulderAction>> = {
  [GAMEPAD.LB]: 'poem_cycle_prev',   // LB → Cycle poem left
  [GAMEPAD.RB]: 'poem_cycle_next',   // RB → Cycle poem right
};

/** D-pad button indices (standard mapping). */
export const DPAD = {
  UP: 12,
  DOWN: 13,
  LEFT: 14,
  RIGHT: 15,
} as const;

/** D-pad index → navigation direction. */
export const COMBAT_DPAD_MAP: Readonly<Record<number, CombatDpadDirection>> = {
  [DPAD.UP]: 'up',
  [DPAD.DOWN]: 'down',
  [DPAD.LEFT]: 'left',
  [DPAD.RIGHT]: 'right',
};

/** LT trigger threshold to count as a "press" (0–1 analog range). */
export const TRIGGER_PRESS_THRESHOLD = 0.5;

/** Event names emitted on the eventBus by the combat gamepad hook. */
export const COMBAT_GAMEPAD_EVENTS = {
  ATTACK: 'combat:gamepad_attack',
  DEFEND: 'combat:gamepad_defend',
  FLEE: 'combat:gamepad_flee',
  POEM_CYCLE_PREV: 'combat:gamepad_poem_cycle_prev',
  POEM_CYCLE_NEXT: 'combat:gamepad_poem_cycle_next',
  POEM_USE_SELECTED: 'combat:gamepad_poem_use_selected',
  DPAD_NAV: 'combat:gamepad_dpad_nav',
} as const;

/** Button hint labels for UI display.
 *  Keyed by CombatGamepadAction | CombatShoulderAction. */
export const COMBAT_BUTTON_HINTS: Readonly<Record<string, string>> = {
  attack: 'A',
  defend: 'B',
  flee: 'X',
  poem_cycle_next: 'Y / RB',
  poem_cycle_prev: 'LB',
  poem_use_selected: 'LT',
};
