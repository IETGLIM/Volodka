/**
 * Thin facade for one-shot SFX, stingers, footsteps, spatial cues.
 * Delegates synthesis to AudioEngine — keeps call sites off the monolith.
 */

import { audioEngine } from './AudioEngine';

export type StingerId =
  | 'tension'
  | 'discovery'
  | 'danger'
  | 'emotional'
  | 'mystery';

class SfxEngineImpl {
  setVolume(scale: number): void {
    audioEngine.setVolume(scale);
  }

  playSfx(type: string): void {
    audioEngine.playSfx(type);
  }

  /** Play a one-shot SFX with stereo/HRTF spatial pan (-1 left … +1 right). */
  playSpatialSfx(type: string, pan = 0): void {
    audioEngine.playSpatialSfx(type, pan);
  }

  playFootstep(material?: string): void {
    audioEngine.playFootstep(material);
  }

  playStinger(id: StingerId): void {
    audioEngine.playStinger(id);
  }

  setReverbPreset(preset: string): void {
    audioEngine.setReverbPreset(preset);
  }

  enableDialogueMuffle(enabled: boolean): void {
    if (enabled) audioEngine.enableDialogueMuffle();
    else audioEngine.disableDialogueMuffle();
  }
}

export const sfxEngine = new SfxEngineImpl();
