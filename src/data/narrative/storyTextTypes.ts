/* ─── Narrative text blobs (data-driven story prose) ─── */

import type { NarrativeTextVariants } from '@/shared/types/definitions/narrative';

/** Prose and UI strings for one story node — structure lives in act*.structure.ts */
export interface StoryNodeTextBlob {
  readonly text: string;
  readonly textVariants?: NarrativeTextVariants;
  readonly contextNote?: string;
  readonly accessibilityAnnounce?: string;
  readonly guidanceHint?: string;
  readonly guidanceSceneLabel?: string;
  readonly freeRoamLabel?: string;
  /** Choice labels in the same order as structure choices (excludes generated free-roam). */
  readonly choices?: readonly string[];
}

export type ActStoryTexts = Readonly<Record<string, StoryNodeTextBlob>>;
