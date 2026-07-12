export type {
  CinematicActorMotion,
  CinematicCameraMotion,
  CinematicClipId,
  CinematicOverlayConfig,
  CinematicTimelineAnchor,
  CinematicTimelineDef,
  CinematicTimelinePhase,
  CinematicTimelineRuntimeOptions,
} from './cinematicTimelineTypes';

export {
  createCinematicTimelineState,
  getCinematicTimelineTotalDuration,
  setCinematicTimelineAnchor,
  skipCinematicTimelineState,
  startCinematicTimelineState,
  updateCinematicTimelineState,
} from './cinematicTimelineController';

export {
  completeCinematicTimeline,
  getActiveCinematicTimelineId,
  isCinematicTimelineActive,
  resetCinematicTimelineOrchestratorForTests,
  skipCinematicTimeline,
  startCinematicTimeline,
  stopCinematicTimeline,
  subscribeCinematicTimeline,
} from './cinematicTimelineOrchestrator';

export { INTRO_WAKE_TIMELINE } from './introWakeTimeline';
export { resolvedSplashToTimeline, splashPresetToTimeline } from './splashToTimeline';
