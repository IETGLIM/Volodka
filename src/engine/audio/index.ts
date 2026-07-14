/**
 * Unified audio subsystem exports.
 *
 * Architecture:
 *   AudioSettings          — volumes / persistence
 *   SceneAudioController   — scene & mode conductor
 *   MusicEngine            — procedural 3-layer music
 *   AmbientEngine          — scene ambient beds (ambientSounds data)
 *   SfxEngine              — one-shots & stingers (via AudioEngine)
 *   AudioEngine            — master bus, drones, spatial, reverb
 */

export { audioEngine } from './AudioEngine';
export { musicEngine } from '../MusicEngine';
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
export {
  ensureTransitionSounds,
  disposeTransitionSounds,
} from './transitionSound';
