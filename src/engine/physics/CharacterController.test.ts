import { describe, expect, it } from 'vitest';
import { integrateKinematicLocomotionDelta } from './CharacterController';
import type { PlayerControls } from '@/engine/input/playerControlsTypes';

const idleControls: PlayerControls = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  run: false,
  jump: false,
  interact: false,
};

describe('integrateKinematicLocomotionDelta', () => {
  it('builds horizontal speed when holding forward', () => {
    const verticalVel = { current: 0 };
    const horizVelX = { current: 0 };
    const horizVelZ = { current: 0 };
    integrateKinematicLocomotionDelta({
      dt: 1 / 60,
      controls: { ...idleControls, forward: true },
      locomotionScale: 1,
      moveYaw: 0,
      gravityY: 0,
      grounded: true,
      verticalVel,
      horizVelX,
      horizVelZ,
      canJump: { current: true },
      isRunning: { current: false },
      horizontalWorldSpace: true,
    });
    expect(Math.hypot(horizVelX.current, horizVelZ.current)).toBeGreaterThan(0.02);
  });

  it('reduces horizontal speed when input is idle', () => {
    const verticalVel = { current: 0 };
    const horizVelX = { current: 4 };
    const horizVelZ = { current: 0 };
    integrateKinematicLocomotionDelta({
      dt: 1 / 60,
      controls: idleControls,
      locomotionScale: 1,
      moveYaw: 0,
      gravityY: 0,
      grounded: true,
      verticalVel,
      horizVelX,
      horizVelZ,
      canJump: { current: true },
      isRunning: { current: false },
      horizontalWorldSpace: true,
    });
    expect(Math.abs(horizVelX.current)).toBeLessThan(4);
  });
});
