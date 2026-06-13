import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  reduceCameraState,
  initialCameraState,
  cleanupInFlightCameraTransitions,
  type CameraRuntimeRefs,
  type CameraState,
} from './cameraStateMachine';
import { createCutsceneController, createSceneTransitionState, startSceneTransition } from './cinematicCamera';

describe('cameraStateMachine', () => {
  it('starts in exploration mode', () => {
    expect(initialCameraState().mode).toBe('exploration');
  });

  it('transitions cinematic fadeOut to freeze and fadeIn back to exploration', () => {
    let state: CameraState = initialCameraState();
    state = reduceCameraState(state, {
      type: 'cinematic_fade_out',
      time: 1,
      params: { sceneId: 'home_evening', forceThirdPerson: true },
    });
    expect(state.mode).toBe('cinematic_freeze');
    state = reduceCameraState(state, { type: 'cinematic_fade_in' });
    expect(state.mode).toBe('exploration');
  });

  it('tracks cutscene and transition modes', () => {
    const controller = createCutsceneController([]);
    let state = reduceCameraState(initialCameraState(), {
      type: 'cutscene_start',
      controller,
      kind: 'story',
    });
    expect(state.mode).toBe('cutscene');

    const from = new THREE.Vector3(0, 1, 0);
    const to = new THREE.Vector3(1, 2, 3);
    state = reduceCameraState(state, { type: 'scene_transition_start', from, to });
    expect(state.mode).toBe('transition');
  });

  it('cleanupInFlightCameraTransitions cancels active scene transition', () => {
    const transition = createSceneTransitionState();
    startSceneTransition(
      transition,
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(1, 2, 1),
    );

    const runtime = {
      subsystems: {
        transition: { current: transition },
        cutscene: { current: null },
        npcCutscene: { current: null },
        cutsceneActive: { current: false },
        npcCutsceneActive: { current: false },
      },
      cameraState: {
        current: {
          mode: 'transition',
          from: new THREE.Vector3(),
          to: new THREE.Vector3(),
        },
      },
      prevSceneId: { current: 'volodka_room' as const },
    } as unknown as CameraRuntimeRefs;

    cleanupInFlightCameraTransitions(runtime, 'volodka_room');

    expect(transition.active).toBe(false);
    expect(runtime.cameraState.current.mode).toBe('exploration');
  });
});
