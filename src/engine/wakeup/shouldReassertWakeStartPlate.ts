/**
 * v4.48.23 re-opens the wake «start» plate when the handoff drops it
 * (DOM removal ~38ms after mount, or hub promotion to explore_mode that
 * races the staging timer). That recovery must not rewind a choice the
 * player already made.
 *
 * The plate's typewriter is skippable (and instant under reduced motion),
 * so «Осмотреться по сторонам» → explore_mode can land well inside the
 * 800ms window. That path looks identical to the auto-promotion race
 * (currentNodeId === 'explore_mode', diegetic plate closed) except
 * executeStoryChoice records the choice in playerState.choiceLog first.
 */

export interface WakeStartPlateReassertState {
  currentNodeId: string | null;
  /** nodeId of the open diegetic plate, or null when the plate is closed. */
  diegeticNodeId: string | null;
  /** True while the intro_wakeup timeline is still the active cinematic. */
  timelineStillIntro: boolean;
  choiceLog: readonly string[] | null | undefined;
}

/** True when choiceLog contains a story choice made on `nodeId`. */
export function choiceLogContainsNode(
  choiceLog: readonly string[] | null | undefined,
  nodeId: string,
): boolean {
  if (!choiceLog || choiceLog.length === 0) return false;
  for (let i = choiceLog.length - 1; i >= 0; i--) {
    const raw = choiceLog[i];
    if (typeof raw !== 'string' || raw.length === 0) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed !== null
        && typeof parsed === 'object'
        && (parsed as { n?: unknown }).n === nodeId
      ) {
        return true;
      }
    } catch {
      // Corrupt row — skip. A bad entry must not block or force the re-assert.
    }
  }
  return false;
}

/**
 * Whether the one-shot wake re-assert should reopen the start plate.
 * A logged choice on `start` means the player already picked a branch;
 * reopening would set currentNodeId back to 'start' and undo that choice.
 */
export function shouldReassertWakeStartPlate(state: WakeStartPlateReassertState): boolean {
  if (state.diegeticNodeId === 'start') return false;
  if (state.timelineStillIntro) return false;
  if (state.currentNodeId !== 'start' && state.currentNodeId !== 'explore_mode') return false;
  if (choiceLogContainsNode(state.choiceLog, 'start')) return false;
  return true;
}
