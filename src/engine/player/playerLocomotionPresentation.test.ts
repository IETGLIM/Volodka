import { describe, expect, it } from 'vitest';
import {
  computeSlopeLocomotionScale,
  getExplorationCameraMotionScale,
  resolveLocomotionClipState,
  resolveMovementIntent,
} from '@/engine/player/playerLocomotionPresentation';

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

  it('getExplorationCameraMotionScale zeros motion when reduced', () => {
    expect(getExplorationCameraMotionScale(0).breathingScale).toBeLessThanOrEqual(1);
    expect(getExplorationCameraMotionScale(1).breathingScale).toBeLessThan(1);
  });
});
