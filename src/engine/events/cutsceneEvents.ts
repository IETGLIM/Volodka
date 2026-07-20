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
    /**
     * When true, the overlay is part of a longer cinematic timeline
     * (CinematicTimelineRunner). The CutsceneOverlay must NOT auto-clear
     * the active cutscene / game phase when this overlay's duration ends —
     * the timeline manages its own lifecycle via finishIntroWake /
     * finishGenericTimeline. Without this flag, the overlay's auto-dismiss
     * timer would clear activeCutsceneId after the FIRST phase's duration,
     * killing the entire 29-second wake-up cinematic after ~4 seconds.
     */
    managedByTimeline?: boolean;
  };
  'cutscene:overlay_end': Record<string, never>;
  /** Trigger camera shake during cutscenes (e.g. hostile NPC encounters). */
  'cutscene:camera_shake': {
    intensity: number;
    /** Decay rate (per second). If provided, takes precedence over `duration`. */
    frequency?: number;
    /** Target duration in ms — converted to a decay rate that brings intensity to ~1% by the end. */
    duration?: number;
  };
}
