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
    /** Fade-in duration in ms (default 300). */
    fadeInMs?: number;
    /** Fade-out duration in ms (default 500). */
    fadeOutMs?: number;
  };
  'cutscene:overlay_end': Record<string, never>;
  /** Trigger camera shake during cutscenes (e.g. hostile NPC encounters). */
  'cutscene:camera_shake': {
    intensity: number;
    frequency?: number;
  };
}
