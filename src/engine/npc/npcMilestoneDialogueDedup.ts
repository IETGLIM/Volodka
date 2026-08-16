/* ─── Volodka RPG – Relation milestone dialogue dedup ───
 * Prevents the same milestone from being auto-opened twice when multiple
 * listeners (DialogueRenderer + orchestrator) are mounted simultaneously.
 * A milestone is uniquely identified by `npcId:milestoneValue` and is
 * suppressed for `DEDUP_WINDOW_MS` after first consume.
 */

const DEDUP_WINDOW_MS = 5_000;

interface ConsumedSlot {
  readonly key: string;
  readonly expiresAt: number;
}

const consumedSlots: ConsumedSlot[] = [];

function now(): number {
  return Date.now();
}

function pruneExpired(): void {
  const t = now();
  for (let i = consumedSlots.length - 1; i >= 0; i--) {
    if (consumedSlots[i].expiresAt <= t) {
      consumedSlots.splice(i, 1);
    }
  }
}

/**
 * Returns `true` if this milestone hasn't been consumed recently (and marks
 * it as consumed for the next `DEDUP_WINDOW_MS`). Returns `false` if a
 * recent consume is still active — the caller should skip opening the
 * dialogue.
 *
 * Pure module state — no React lifecycle. Safe to call from event handlers,
 * useEffects, and orchestrator hooks alike.
 */
export function consumeMilestoneDialogue(
  npcId: string,
  milestoneValue: number,
): boolean {
  pruneExpired();
  const key = `${npcId}:${milestoneValue}`;
  if (consumedSlots.some((s) => s.key === key)) return false;
  consumedSlots.push({ key, expiresAt: now() + DEDUP_WINDOW_MS });
  return true;
}
