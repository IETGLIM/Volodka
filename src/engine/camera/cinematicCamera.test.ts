import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createCutsceneController,
  createSpringCameraState,
  startCutscene,
  updateCutsceneController,
  updateSpringCamera,
} from './cinematicCamera';

function makeWaypoint(
  x: number,
  duration: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3; fov: number; duration: number } {
  return {
    position: new THREE.Vector3(x, 2, 5),
    lookAt: new THREE.Vector3(0, 1, 0),
    fov: 75,
    duration,
  };
}

function simulateSpringToward(
  start: THREE.Vector3,
  target: THREE.Vector3,
  duration: number,
  step: number,
  stiffness = 16,
  damping = 0.85,
): THREE.Vector3 {
  const lookAt = new THREE.Vector3();
  const state = createSpringCameraState(start, lookAt);
  let elapsed = 0;
  while (elapsed < duration) {
    const dt = Math.min(step, duration - elapsed);
    updateSpringCamera(state, target, lookAt, 75, dt, 0, stiffness, damping);
    elapsed += dt;
  }
  return state.position.clone();
}

/** Legacy per-frame damping — frame-rate dependent, kept for regression comparison only. */
function simulateLegacySpringToward(
  start: THREE.Vector3,
  target: THREE.Vector3,
  duration: number,
  step: number,
  stiffness = 16,
  damping = 0.85,
): THREE.Vector3 {
  const lookAt = new THREE.Vector3();
  const state = createSpringCameraState(start, lookAt);
  let elapsed = 0;
  while (elapsed < duration) {
    const dt = Math.min(step, duration - elapsed);
    const springForce = target.clone().sub(state.position).multiplyScalar(stiffness * dt);
    const dampedVel = state.velocity.clone().multiplyScalar(damping);
    state.velocity.add(springForce).sub(dampedVel);
    state.position.addScaledVector(state.velocity, dt);
    elapsed += dt;
  }
  return state.position.clone();
}

describe('updateSpringCamera', () => {
  it('converges toward the target position over time', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(5, 2, -3);
    const finalPos = simulateSpringToward(start, target, 10, 1 / 60);

    expect(finalPos.distanceTo(target)).toBeLessThan(0.2);
  });

  it('is more frame-rate stable than legacy per-frame damping', () => {
    const start = new THREE.Vector3(0, 0, 0);
    const target = new THREE.Vector3(8, 0, 0);
    const duration = 1;
    const stiffness = 16;
    const damping = 0.85;

    const at60fps = simulateSpringToward(start, target, duration, 1 / 60, stiffness, damping);
    const at30fps = simulateSpringToward(start, target, duration, 1 / 30, stiffness, damping);
    const at144fps = simulateSpringToward(start, target, duration, 1 / 144, stiffness, damping);

    const newDiff = at60fps.distanceTo(at30fps);
    const newHighDiff = at60fps.distanceTo(at144fps);

    const legacyAt60 = simulateLegacySpringToward(start, target, duration, 1 / 60, stiffness, damping);
    const legacyAt30 = simulateLegacySpringToward(start, target, duration, 1 / 30, stiffness, damping);
    const legacyDiff = legacyAt60.distanceTo(legacyAt30);

    expect(newDiff).toBeLessThan(legacyDiff);
    expect(newHighDiff).toBeLessThan(0.5);
    expect(newDiff).toBeLessThan(0.5);
  });
});

describe('updateCutsceneController', () => {
  it('does not infinite-loop when waypoint duration is zero', () => {
    const waypoints = [
      makeWaypoint(0, 0),
      makeWaypoint(1, 0),
      makeWaypoint(2, 0),
      makeWaypoint(3, 1),
    ];
    const controller = createCutsceneController(waypoints);
    startCutscene(controller);

    const maxFrames = 120;
    for (let i = 0; i < maxFrames; i++) {
      updateCutsceneController(controller, 1 / 60);
      if (controller.isComplete) break;
    }

    expect(controller.isComplete).toBe(true);
    expect(controller.isPlaying).toBe(false);
    expect(controller.currentSegment).toBeGreaterThanOrEqual(waypoints.length - 2);
  });

  it('completes quickly with all zero-duration segments', () => {
    const waypoints = Array.from({ length: 50 }, (_, i) => makeWaypoint(i, 0));
    const controller = createCutsceneController(waypoints);
    startCutscene(controller);

    const start = performance.now();
    let frames = 0;
    while (!controller.isComplete && frames < 200) {
      updateCutsceneController(controller, 1 / 60);
      frames++;
    }
    const elapsed = performance.now() - start;

    expect(controller.isComplete).toBe(true);
    expect(frames).toBeLessThan(200);
    expect(elapsed).toBeLessThan(100);
  });
});
