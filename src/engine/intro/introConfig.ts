import { FIRST_READING_POEM_ID } from '@/engine/quest/firstReadingCelebrationContent';

/** Opening cinematic poem — configurable without hardcoding in the component. */
export const INTRO_POEM_ID = FIRST_READING_POEM_ID;

export const INTRO_LEAD =
  'История про Володьку — уставшего инженера, что искал стихи, спрятанные в коде.';

/** Failsafe if poem assembly never completes (animation hang, weak hardware). */
export const INTRO_MAX_DURATION_MS = 30_000;

/** Hand off to menu when the intro poem asset is missing. */
export const INTRO_MISSING_POEM_DELAY_MS = 500;
