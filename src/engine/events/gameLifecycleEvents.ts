/** Save / load lifecycle — saveSlice, AutoSaveIndicator. */
export interface GameLifecycleEvents {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  /** E2E bridge only — clears quest/matrix overlays blocking Playwright clicks. */
  'e2e:dismiss_overlays': Record<string, never>;
}
