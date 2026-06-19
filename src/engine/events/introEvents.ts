/** Intro wake-up 3D cutscene — CinematicTimelineRunner, IntroWakeOverlay. */
export interface IntroEvents {
  'intro:wakeup_sequence': Record<string, never>;
  'intro:wakeup_handoff': Record<string, never>;
  'intro:wakeup_skip': Record<string, never>;
  'intro:wakeup_complete': Record<string, never>;
}
