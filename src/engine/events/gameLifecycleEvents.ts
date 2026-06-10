/** Save / load lifecycle — saveSlice, AutoSaveIndicator. */
export interface GameLifecycleEvents {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
}
