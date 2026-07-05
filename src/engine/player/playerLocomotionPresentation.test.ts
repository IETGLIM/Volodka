import { describe, expect, it, vi } from 'vitest';
import * as accessibilitySettings from '@/engine/accessibility/accessibilitySettings';
import {
  computeSlopeLocomotionScale,
  getExplorationCameraMotionScale,
  resolveLocomotionClipState,
  resolveLockedLocomotionPresentation,
  resolveMovementIntent,
  resolveRunWalkCrossfadeTarget,
} from '@/engine/player/playerLocomotionPresentation';

const ZERO_EXPLORATION_CAMERA_MOTION = {
  breathingScale: 0,
  turnTiltScale: 0,
  bobScale: 0,
} as const;

describe('playerLocomotionPresentation', () => {
  it('resolveLocomotionClipState maps walk/run/idle', () => {
    expect(resolveLocomotionClipState('idle').locomotionActive).toBe(false);
    expect(resolveLocomotionClipState('walk').runWeight).toBe(0);
    expect(resolveLocomotionClipState('run').runWeight).toBe(1);
  });

  it('resolveMovementIntent prefers keyboard over virtual', () => {
    const intent = resolveMovementIntent({
      keys: {
        forward: true,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false,
        hasMovement: true,
      },
      virtual: { forward: 0, backward: 1, left: 0, right: 0, run: 0, jump: 0, moveMagnitude: 0.8 },
    });
    expect(intent.fwd).toBe(1);
    expect(intent.bwd).toBe(0);
    expect(intent.analogSpeedScale).toBe(1);
  });

  it('resolveMovementIntent uses analog magnitude for gamepad', () => {
    const intent = resolveMovementIntent({
      keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        run: false,
        jump: false,
        hasMovement: false,
      },
      virtual: {
        forward: 0.5,
        backward: 0,
        left: 0,
        right: 0,
        run: 0,
        jump: 0,
        moveMagnitude: 0.5,
      },
    });
    expect(intent.analogSpeedScale).toBe(0.5);
    expect(intent.isMoving).toBe(true);
  });

  it('computeSlopeLocomotionScale penalizes steep climbs', () => {
    expect(computeSlopeLocomotionScale(0.1, 0, 0.1, true)).toBe(1);
    expect(computeSlopeLocomotionScale(0.1, 0.04, 0.1, true)).toBeLessThan(1);
    expect(computeSlopeLocomotionScale(0.1, 0.04, 0.1, false)).toBe(1);
  });

  it('getExplorationCameraMotionScale dampens bob while moving', () => {
    expect(getExplorationCameraMotionScale(0).breathingScale).toBe(1);
    expect(getExplorationCameraMotionScale(1).breathingScale).toBeLessThan(1);
  });

  it('getExplorationCameraMotionScale zeros motion when reduced motion is effective', () => {
    const spy = vi.spyOn(accessibilitySettings, 'isEffectiveReducedMotion').mockReturnValue(true);
    expect(getExplorationCameraMotionScale(1)).toEqual(ZERO_EXPLORATION_CAMERA_MOTION);
    spy.mockRestore();
  });

  it('resolveRunWalkCrossfadeTarget only fires on threshold crossing', () => {
    expect(resolveRunWalkCrossfadeTarget(0, 0)).toBeNull();
    expect(resolveRunWalkCrossfadeTarget(1, 1)).toBeNull();
    expect(resolveRunWalkCrossfadeTarget(0, 1)).toBe('walk_to_run');
    expect(resolveRunWalkCrossfadeTarget(1, 0)).toBe('run_to_walk');
  });

  it('resolveLockedLocomotionPresentation maps approach and combat', () => {
    expect(resolveLockedLocomotionPresentation({
      externalActive: true,
      vx: 2,
      vz: 0,
      gamePhase: 'exploration',
    })).toMatchObject({ anim: 'walk', moveBlendTarget: 1 });

    expect(resolveLockedLocomotionPresentation({
      externalActive: false,
      vx: 0,
      vz: 0,
      gamePhase: 'exploration',
    })).toMatchObject({ anim: 'idle', moveBlendTarget: 0 });

    expect(resolveLockedLocomotionPresentation({
      externalActive: false,
      vx: 0,
      vz: 0,
      gamePhase: 'combat',
    })).toMatchObject({ anim: 'combat', moveBlendTarget: 0 });
  });
});
