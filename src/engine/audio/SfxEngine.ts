/**
 * Thin facade for one-shot SFX, stingers, footsteps, spatial cues.
 * Delegates synthesis to AudioEngine — keeps call sites off the monolith.
 */

import { audioEngine, type PlayFootstepOptions } from './AudioEngine';

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

  playFootstep(material?: string, options?: PlayFootstepOptions): void {
    audioEngine.playFootstep(material, options);
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
