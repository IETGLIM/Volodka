import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

const {
  stopMusic,
  setPresentationDucked,
  fadeOutAll,
  setDialogueDucked,
  setCombatMuted,
  enableDialogueMuffle,
} = vi.hoisted(() => ({
  stopMusic: vi.fn(),
  setPresentationDucked: vi.fn(),
  fadeOutAll: vi.fn(),
  setDialogueDucked: vi.fn(),
  setCombatMuted: vi.fn(),
  enableDialogueMuffle: vi.fn(),
}));

vi.mock('../MusicEngine', () => ({
  musicEngine: {
    stopMusic,
    setPresentationDucked,
    playSceneMusic: vi.fn(),
  },
}));

vi.mock('./AmbientEngine', () => ({
  ambientEngine: {
    fadeOutAll,
    setDialogueDucked,
    setCombatMuted,
    play: vi.fn(),
    stopAll: vi.fn(),
    setReverbPreset: vi.fn(),
    setReducedMotion: vi.fn(),
    setPaused: vi.fn(),
  },
}));

vi.mock('./SfxEngine', () => ({
  sfxEngine: {
    enableDialogueMuffle,
    setReverbPreset: vi.fn(),
    playStinger: vi.fn(),
    playNamedSound: vi.fn(),
  },
}));

vi.mock('./AudioSettings', () => ({
  applyAudioSettings: vi.fn(),
}));

vi.mock('@/shared/weather/deriveSceneWeather', () => ({
  deriveSceneWeather: () => ({ type: 'clear' }),
}));

vi.mock('@/engine/accessibility/accessibilitySettings', () => ({
  isEffectiveReducedMotion: () => false,
}));

vi.mock('@/engine/frame/frameVisibility', () => ({
  isPageVisible: () => true,
}));

vi.mock('@/data/ambientSounds', () => ({
  resolveAmbienceForScene: () => null,
  getAmbienceAccessibilityText: () => null,
}));

import { SceneAudioController } from './SceneAudioController';

describe('SceneAudioController', () => {
  let controller: SceneAudioController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new SceneAudioController();
    controller.init();
  });

  afterEach(() => {
    controller.dispose();
  });

  it('onSceneUnload resets duck state and crossfades scene beds', () => {
    controller.onSceneUnload();

    expect(enableDialogueMuffle).toHaveBeenCalledWith(false);
    expect(setDialogueDucked).toHaveBeenCalledWith(false);
    expect(setCombatMuted).toHaveBeenCalledWith(false);
    expect(setPresentationDucked).toHaveBeenCalledWith(false);
    expect(stopMusic).toHaveBeenCalledWith(0.6);
    expect(fadeOutAll).toHaveBeenCalledWith(600);
  });

  it('onSceneUnload is a no-op after dispose', () => {
    controller.dispose();
    controller.onSceneUnload();

    expect(stopMusic).not.toHaveBeenCalled();
    expect(fadeOutAll).not.toHaveBeenCalled();
  });

  it('setDialogueState ducks music and ambient during story overlay', () => {
    controller.setDialogueState(true, 'exploration', 'dialogue');

    expect(setPresentationDucked).toHaveBeenCalledWith(true, 'dialogue');
    expect(enableDialogueMuffle).toHaveBeenCalledWith(true);
    expect(setDialogueDucked).toHaveBeenCalledWith(true, 'dialogue');
  });

  it('setDialogueState restores exploration bed when overlay closes', () => {
    controller.setDialogueState(true, 'exploration', 'dialogue');
    vi.clearAllMocks();

    controller.setDialogueState(false, 'exploration', null);

    expect(setPresentationDucked).toHaveBeenCalledWith(false, 'cinematic');
    expect(enableDialogueMuffle).toHaveBeenCalledWith(false);
    expect(setDialogueDucked).toHaveBeenCalledWith(false, 'cinematic');
  });
});
