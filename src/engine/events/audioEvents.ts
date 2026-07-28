/** Audio / SFX events — consumed by useAudioOrchestrator, QuickUseBar. */
export interface AudioEvents {
  'sound:play': { type: string };
  /** UI slice → MusicEngine (store stays state-only). */
  'music:set_volume': { volume: number };
  /** Toggle procedural scene music on/off. */
  'music:set_enabled': { enabled: boolean; sceneId: string };
}
