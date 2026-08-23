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
  | 'mystery'
  | 'victory'
  | 'defeat';

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

  playDoorOpen(): void {
    audioEngine.playDoorOpen();
  }

  playDoorClose(): void {
    audioEngine.playDoorClose();
  }

  /** Route generic sound:play events to procedural SFX. */
  playNamedSound(type: string): void {
    switch (type) {
      case 'door_open':
        this.playDoorOpen();
        break;
      case 'door_close':
        this.playDoorClose();
        break;
      case 'item_use':
      case 'screenshot':
        this.playSfx(type);
        break;
      default:
        this.playSfx(type);
        break;
    }
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
