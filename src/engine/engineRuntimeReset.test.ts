import { describe, expect, it, beforeEach } from 'vitest';
import { resetEngineModuleRuntimeState } from './engineRuntimeReset';
import { getCameraShakeIntensity, triggerCameraShake } from './camera/cameraShake';
import { getGlobalTimeScale, setGlobalTimeScale } from './camera/cinematicCamera';
import {
  getCinematicPresentationMode,
  setCinematicPresentationMode,
} from './camera/cinematicPresentation';
import { isSceneTransitionInProgress, setSceneTransitionInProgress } from './core/sceneTransitionGuard';
import { resetSceneTransitionDedupe } from './scene/sceneTransition';
import { markGameDataReady, resetLoadingTimelineForSession } from './performance/LoadingTimeline';
import { invalidateStoryGraphIndex } from './story/storyGraphIndex';
import { resetKeyboardInputState } from './keyboardInputState';

describe('resetEngineModuleRuntimeState', () => {
  beforeEach(() => {
    resetEngineModuleRuntimeState();
  });

  it('resets camera shake, time scale, cinematic presentation, and transition guard', () => {
    triggerCameraShake(0.5, 5);
    setGlobalTimeScale(0.25);
    setCinematicPresentationMode('third_person');
    setSceneTransitionInProgress(true);

    resetEngineModuleRuntimeState();

    expect(getCameraShakeIntensity()).toBe(0);
    expect(getGlobalTimeScale()).toBe(1);
    expect(getCinematicPresentationMode()).toBe('first_person');
    expect(isSceneTransitionInProgress()).toBe(false);
  });

  it('resetSceneTransitionDedupe is safe to call repeatedly', () => {
    resetSceneTransitionDedupe();
    expect(() => resetSceneTransitionDedupe()).not.toThrow();
  });

  it('resets loading timeline session flag so gameDataReady can fire again', () => {
    markGameDataReady();
    resetLoadingTimelineForSession();
    expect(() => markGameDataReady()).not.toThrow();
  });

  it('invalidates story graph index without throwing', () => {
    expect(() => invalidateStoryGraphIndex()).not.toThrow();
    expect(() => resetEngineModuleRuntimeState()).not.toThrow();
  });

  it('clears keyboard input state without throwing', () => {
    resetKeyboardInputState();
    expect(() => resetEngineModuleRuntimeState()).not.toThrow();
  });
});
