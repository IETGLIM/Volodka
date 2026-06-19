import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createCinematicTimelineState,
  getCinematicTimelineTotalDuration,
  startCinematicTimelineState,
  updateCinematicTimelineState,
} from './cinematicTimelineController';
import { splashPresetToTimeline } from './splashToTimeline';
import { SPLASH_NPC_ORBIT } from '@/data/interactionSplashes';
import { INTRO_WAKE_TIMELINE } from './introWakeTimeline';

describe('cinematicTimelineController', () => {
  it('computes total duration from phase durations', () => {
    expect(getCinematicTimelineTotalDuration(INTRO_WAKE_TIMELINE)).toBeGreaterThan(10);
  });

  it('plays splash timeline to completion', () => {
    const def = splashPresetToTimeline(SPLASH_NPC_ORBIT);
    const state = createCinematicTimelineState(def);
    startCinematicTimelineState(state);

    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 2, 5);

    let frames = 0;
    let complete = false;
    while (!complete && frames < 500) {
      const result = updateCinematicTimelineState(state, 1 / 60, camera);
      if (result?.isComplete) complete = true;
      frames++;
    }

    expect(complete).toBe(true);
    expect(state.phaseIndex).toBe(def.phases.length - 1);
  });
});

describe('splashToTimeline', () => {
  it('creates one phase per camera segment', () => {
    const def = splashPresetToTimeline(SPLASH_NPC_ORBIT);
    expect(def.phases.length).toBe(SPLASH_NPC_ORBIT.waypoints.length - 1);
    expect(def.phases.every((p) => p.actor.mode === 'none')).toBe(true);
  });
});
