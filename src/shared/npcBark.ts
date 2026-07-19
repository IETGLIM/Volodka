/* ─── NPC proximity bark text resolution ─── */

/** Single line or a pool of variants — engine picks one at runtime. */
export type NPCBarkBand = string | readonly string[];

export interface NPCBarkTexts {
  readonly hostile: NPCBarkBand;
  readonly neutral: NPCBarkBand;
  readonly friendly: NPCBarkBand;
}

/**
 * Ambient barks — short overheard mutterings NPCs produce when the player is
 * NEAR them (within 4 m) but NOT interacting. Different from `barkTexts`
 * (which fire on approach): these are idle background chatter that makes a
 * scene feel inhabited.
 *
 * Each band is a pool of lines; the ambient bark system picks one at random
 * subject to a per-NPC cooldown (≥ 25 s between emissions for the same NPC).
 *
 * - `idle`     → default band, used when the NPC has no specific activity
 * - `working`  → used when the NPC is currently in a `working` animation
 *                (or any schedule-driven work activity)
 * - `pensive`  → rare band; the system rolls a 20 % chance per eligible tick
 *                to surface a more introspective line
 */
export interface NPCAmbientBarks {
  /** Default idle mutterings (used when no other band qualifies). */
  readonly idle?: NPCBarkBand;
  /** Lines muttered while performing a working animation/activity. */
  readonly working?: NPCBarkBand;
  /** Rare introspective lines — 20 % chance per eligible tick. */
  readonly pensive?: NPCBarkBand;
}

export function pickNpcBarkLine(band: NPCBarkBand): string {
  if (typeof band === 'string') return band;
  if (band.length === 0) return '';
  const index = Math.floor(Math.random() * band.length);
  return band[index] ?? band[0];
}

/** Relation bands: ≤30 hostile, ≥70 friendly, otherwise neutral. */
export function resolveNpcBarkForRelation(
  barkTexts: NPCBarkTexts,
  relationValue: number,
): string {
  if (relationValue <= 30) return pickNpcBarkLine(barkTexts.hostile);
  if (relationValue >= 70) return pickNpcBarkLine(barkTexts.friendly);
  return pickNpcBarkLine(barkTexts.neutral);
}

/**
 * Resolve an ambient bark line for an NPC given its current activity and a
 * random roll (0–1). Returns `null` if no ambient barks are defined or the
 * rolled band is missing.
 *
 * @param ambientBarks  NPC's ambient bark configuration (may be undefined)
 * @param isWorking     True when the NPC is in a `working` animation/activity
 * @param rng           0–1 random roll controlling pensive vs. idle selection
 */
export function resolveNpcAmbientBark(
  ambientBarks: NPCAmbientBarks | undefined,
  isWorking: boolean,
  rng: number = Math.random(),
): string | null {
  if (!ambientBarks) return null;

  // 20 % chance to surface a pensive line when one is defined.
  if (ambientBarks.pensive && rng < 0.2) {
    return pickNpcBarkLine(ambientBarks.pensive);
  }

  // Working band takes priority when the NPC is actively working.
  if (isWorking && ambientBarks.working) {
    return pickNpcBarkLine(ambientBarks.working);
  }

  // Default: idle band.
  if (ambientBarks.idle) {
    return pickNpcBarkLine(ambientBarks.idle);
  }

  // Fall back to working if idle is missing.
  if (ambientBarks.working) {
    return pickNpcBarkLine(ambientBarks.working);
  }

  return null;
}
