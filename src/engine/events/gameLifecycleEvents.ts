/** Save / load lifecycle — saveSlice, AutoSaveIndicator. */
export interface GameLifecycleEvents {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  /** Boot pipeline fatal error — distinct from in-game scene transition failures. */
  'boot:failed': { reason: string; errorCode?: string };
}
