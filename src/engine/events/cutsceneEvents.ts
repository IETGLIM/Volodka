/** Letterbox cutscene overlays — CutsceneOverlay, GameOrchestrator. */
export interface CutsceneEvents {
  'cutscene:overlay': {
    text: string;
    subtitle?: string;
    accentColor: string;
    durationMs: number;
    type?: 'act_transition' | 'character_intro' | 'story_moment' | 'revelation';
    letterboxStyle?: 'full' | 'thin' | 'none';
    showEmbers?: boolean;
    glitchIntensity?: number;
  };
  'cutscene:overlay_end': Record<string, never>;
}
