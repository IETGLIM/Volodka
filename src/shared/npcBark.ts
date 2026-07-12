/* ─── NPC proximity bark text resolution ─── */

/** Single line or a pool of variants — engine picks one at runtime. */
export type NPCBarkBand = string | readonly string[];

export interface NPCBarkTexts {
  readonly hostile: NPCBarkBand;
  readonly neutral: NPCBarkBand;
  readonly friendly: NPCBarkBand;
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
