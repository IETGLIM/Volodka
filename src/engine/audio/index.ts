/**
 * Unified audio subsystem exports.
 *
 * Architecture:
 *   AudioSettings          — volumes / persistence
 *   SceneAudioController   — scene & mode conductor
 *   MusicEngine            — thin facade: 3-layer music lifecycle + bus
 *   musicConfigs / musicTheory / proceduralMusic — scene beds + synthesis
 *   AmbientEngine          — scene ambient beds (ambientSounds data)
 *   SfxEngine              — one-shots & stingers (via AudioEngine)
 *   AudioEngine            — thin facade: master bus, lifecycle, ambient state
 *   proceduralSfx / Ambient / AmbientMusic / Spatial — synthesis helpers
 *   audioCapabilities      — Web Audio feature probes + spatial routing
 *   AudioEngineCore        — shared context + IR / release helpers
 */

export { audioEngine } from './AudioEngine';
export { musicEngine } from './MusicEngine';
export { ambientEngine } from './AmbientEngine';
export { sfxEngine } from './SfxEngine';
export {
  readAudioSettings,
  applyAudioSettings,
  persistAndApplyVolume,
  AUDIO_SETTINGS_CHANGED,
  type AudioSettingsSnapshot,
} from './AudioSettings';
export {
  SceneAudioController,
  getSceneAudioController,
} from './SceneAudioController';
export {
  probeAudioCapabilities,
  resetAudioCapabilitiesCache,
  type AudioCapabilities,
} from './audioCapabilities';
