/* ─── Shared narrative presentation (story + dialogue) ─── */

export interface NarrativeTextVariants {
  readonly highKarma?: string;
  readonly neutralKarma?: string;
  readonly lowKarma?: string;
}

export interface KarmaThresholds {
  readonly high: number;
  readonly low: number;
}

export type StoryMusicCue = 'tension' | 'discovery' | 'danger' | 'emotional' | 'mystery';
