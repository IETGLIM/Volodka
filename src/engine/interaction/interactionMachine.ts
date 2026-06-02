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

/** NPC animation states driven by interaction */
export type NPCAnimationState = 'idle' | 'talk' | 'listen' | 'gesture';

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
