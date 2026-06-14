import { describe, expect, it, beforeEach } from 'vitest';
import { resetEngineModuleRuntimeState } from './engineRuntimeReset';
import { getCameraShakeIntensity, resetCameraShake, triggerCameraShake } from './camera/cameraShake';
import { getGlobalTimeScale, resetGlobalTimeScale, setGlobalTimeScale } from './camera/cinematicCamera';
import {
  getCinematicPresentationMode,
  resetCinematicPresentation,
  setCinematicPresentationMode,
} from './camera/cinematicPresentation';
import { isSceneTransitionInProgress, resetSceneTransitionGuard, setSceneTransitionInProgress } from './core/sceneTransitionGuard';
import { resetSceneTransitionDedupe } from './scene/sceneTransition';

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
});
