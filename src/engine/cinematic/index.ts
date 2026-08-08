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
export {
  cutsceneDefToTimeline,
  estimateCutsceneDisplayDurationMs,
} from './cutsceneToTimeline';
export { waypointsToTimelinePhases } from './cinematicWaypointPhases';
export {
  getCinematicCameraPreset,
  getPresetEase,
  CINEMATIC_CAMERA_PRESETS,
  ESTABLISHING_WIDE,
  OVER_SHOULDER,
  CLOSE_UP_EMOTIONAL,
  LOW_ANGLE_POWER,
  DUTCH_ANGLE,
  TRACKING_LATERAL,
  CRANE_RISING,
} from './cinematicCameraPresets';
export type { CinematicCameraPreset } from './cinematicCameraPresets';
export {
  CUTSCENE_ROOM_AWAKENING,
  CUTSCENE_STREET_FIRST_STEPS,
  CUTSCENE_GUILD_ARRIVAL,
  CUTSCENE_RAIN_MOMENT,
  PRESET_CUTSCENES,
  getPresetCutscene,
  presetCutsceneToTimeline,
} from './cutsceneDefinitions';
export type { PresetCutsceneDef, CutsceneShotDef } from './cutsceneDefinitions';
