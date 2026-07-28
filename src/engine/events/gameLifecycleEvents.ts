/** Save / load / reset lifecycle — saveSlice, AutoSaveIndicator, GuidedStory. */
export interface GameLifecycleEvents {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  /** New game / hard reset — store replaced with defaults (not a load). */
  'game:reset': Record<string, never>;
}
