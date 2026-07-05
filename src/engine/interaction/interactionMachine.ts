/* ─── Volodka RPG – Interaction State Machine ─── */

/**
 * Staged interaction flow for NPC conversations.
 *
 * Flow: Idle → Approach → Cutscene → Align → Lock → Dialogue → Exit → Idle
 *
 * - Idle:     No active interaction
 * - Approach: Player auto-walks toward NPC
 * - Cutscene: Cinematic camera animation before dialogue (NEW)
 * - Align:    Player and NPC smoothly rotate to face each other
 * - Lock:     Player controls are disabled
 * - Dialogue: Conversation is open
 * - Exit:     Controls re-enabled, transition back to Idle
 */
export enum InteractionState {
  Idle = 0,
  Approach,
  Cutscene,  // NEW: Cinematic camera intro before dialogue
  Align,
  Lock,
  Dialogue,
  Exit,
}

/** Human-readable labels for debugging */
export const INTERACTION_STATE_LABELS: Record<InteractionState, string> = {
  [InteractionState.Idle]: 'Idle',
  [InteractionState.Approach]: 'Approach',
  [InteractionState.Cutscene]: 'Cutscene',
  [InteractionState.Align]: 'Align',
  [InteractionState.Lock]: 'Lock',
  [InteractionState.Dialogue]: 'Dialogue',
  [InteractionState.Exit]: 'Exit',
};

/** Allowed FSM edges — enforced by interactionSession.writeInteractionSession. */
export const VALID_INTERACTION_TRANSITIONS: Record<InteractionState, readonly InteractionState[]> = {
  [InteractionState.Idle]: [InteractionState.Approach],
  [InteractionState.Approach]: [
    InteractionState.Cutscene,
    InteractionState.Exit,
    InteractionState.Idle,
  ],
  [InteractionState.Cutscene]: [
    InteractionState.Align,
    InteractionState.Exit,
    InteractionState.Idle,
  ],
  [InteractionState.Align]: [
    InteractionState.Lock,
    InteractionState.Exit,
    InteractionState.Idle,
  ],
  [InteractionState.Lock]: [
    InteractionState.Dialogue,
    InteractionState.Exit,
    InteractionState.Idle,
  ],
  [InteractionState.Dialogue]: [InteractionState.Exit, InteractionState.Idle],
  [InteractionState.Exit]: [InteractionState.Idle],
};

export function isValidInteractionTransition(
  from: InteractionState,
  to: InteractionState,
): boolean {
  if (from === to) return true;
  return VALID_INTERACTION_TRANSITIONS[from].includes(to);
}

/** Alias for readability at call sites expecting validateTransition(from, to). */
export const validateInteractionTransition = isValidInteractionTransition;

/** NPC animation states driven by interaction and schedule activity */
export type NPCAnimationState = 'idle' | 'walk' | 'talk' | 'sit' | 'listen' | 'gesture';

/** Distance threshold for considering player "arrived" at NPC during Approach */
export const APPROACH_ARRIVAL_DISTANCE = 1.5;

/** Default duration of the Cutscene phase (seconds) - can be overridden per NPC */
export const DEFAULT_CUTSCENE_DURATION = 1.8;

/** Duration of the Align phase (seconds) */
export const ALIGN_DURATION = 0.5;

/** Duration of the Lock phase before Dialogue opens (seconds) */
export const LOCK_DURATION = 0.2;

/** Duration of the Exit phase before returning to Idle (seconds) */
export const EXIT_DURATION = 0.3;
