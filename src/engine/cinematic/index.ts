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
export { STREET_ARRIVAL_TIMELINE } from './streetArrivalTimeline';
export { CITY_SQUARE_ARRIVAL_TIMELINE } from './citySquareArrivalTimeline';
export { PROCEDURAL_AAA_ARRIVAL_TIMELINE } from './proceduralAaaArrivalTimeline';
export {
  setCinematicLightCue,
  getCinematicLightCue,
  getCinematicNeonIntensityScale,
  clearCinematicLightCue,
} from './cinematicLightStaging';
export { resolvedSplashToTimeline, splashPresetToTimeline } from './splashToTimeline';
