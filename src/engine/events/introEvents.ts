/** Intro wake-up 3D cutscene — CinematicTimelineRunner, IntroWakeOverlay. */
export interface IntroEvents {
  'intro:wakeup_sequence': Record<string, never>;
  'intro:wakeup_skip': Record<string, never>;
  // Session 12-B: removed the orphaned `intro:wakeup_handoff` and
  // `intro:wakeup_complete` event declarations — grep confirmed zero
  // subscribers across the codebase. The emits in CinematicTimelineRunner
  // were also removed. The handoff/complete semantics are covered by
  // `cinematic:timeline_phase` (phaseId) and `cinematic:timeline_complete`.
}
