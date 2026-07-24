/* ─── Shared narrative presentation (story + dialogue) ─── */

export interface NarrativeTextVariants {
  readonly highKarma?: string;
  readonly neutralKarma?: string;
  readonly lowKarma?: string;
  /** Shown when player has high relation (≥ 60) with the dialogue's NPC. */
  readonly highRelation?: string;
  /** Shown when player has low relation (≤ 30) with the dialogue's NPC. */
  readonly lowRelation?: string;
}

export interface KarmaThresholds {
  readonly high: number;
  readonly low: number;
}

export type StoryMusicCue = 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery';
