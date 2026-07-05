/** Save / load lifecycle — saveSlice, AutoSaveIndicator. */
export interface GameLifecycleEvents {
  'game:saved': { timestamp: number; source: 'auto' | 'manual' };
  'game:loaded': Record<string, never>;
  /** Save/load/system feedback for dedicated UI toasts. */
  'game:system_alert': {
    kind: 'save_failed' | 'load_failed' | 'load_recovered';
    message: string;
  };
  /** Boot pipeline fatal error — distinct from in-game scene transition failures. */
  'boot:failed': { reason: string; errorCode?: string };
}
