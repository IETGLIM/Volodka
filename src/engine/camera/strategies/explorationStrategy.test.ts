import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyShoulderOffset } from '@/engine/camera/cameraShoulder';
import { SHOULDER_OFFSET_X } from '@/engine/camera/cameraConstants';
import { explorationStrategy } from '@/engine/camera/strategies/explorationStrategy';
import { getExplorationCameraMotionScale } from '@/engine/player/playerLocomotionPresentation';
import { updateMoveBlendRef } from '@/engine/player/playerLocomotionPresentation';

describe('applyShoulderOffset', () => {
  it('nudges pos and look along camera-right for yaw=0', () => {
    const pos = new THREE.Vector3(0, 1.3, 2);
    const look = new THREE.Vector3(0, 1.3, 0);
    applyShoulderOffset(pos, look, 0);
    expect(pos.x).toBeCloseTo(SHOULDER_OFFSET_X, 5);
    expect(look.x).toBeCloseTo(SHOULDER_OFFSET_X, 5);
    expect(pos.z).toBeCloseTo(2, 5);
    expect(look.z).toBeCloseTo(0, 5);
  });

  it('uses perpendicular of spherical offset at yaw=π/2', () => {
    const pos = new THREE.Vector3(0, 0, 0);
    const look = new THREE.Vector3(0, 0, 0);
    applyShoulderOffset(pos, look, Math.PI / 2);
    // right = (cos(π/2), -sin(π/2)) = (0, -1)
    expect(pos.x).toBeCloseTo(0, 5);
    expect(pos.z).toBeCloseTo(-SHOULDER_OFFSET_X, 5);
  });
});

describe('explorationStrategy', () => {
  it('is always eligible as default camera mode', () => {
    expect(explorationStrategy.isActive({} as Parameters<typeof explorationStrategy.isActive>[0])).toBe(true);
  });
});

describe('exploration camera motion scale', () => {
  it('dampens bob while the player is moving', () => {
    const idle = getExplorationCameraMotionScale(0);
    const moving = getExplorationCameraMotionScale(1);
    expect(moving.breathingScale).toBeLessThan(idle.breathingScale);
    expect(moving.bobScale).toBeLessThan(idle.bobScale);
  });
});

describe('playerMainMovement degraded blend', () => {
  it('updates moveBlend during degraded horizontal motion', () => {
    const blend = { current: 0 };
    updateMoveBlendRef(blend, 1, 0.1);
    expect(blend.current).toBeGreaterThan(0);
  });
});

/** Max Payne facing: body yaw tracks camera forward, not moveDir. */
describe('OTS body facing helper', () => {
  it('camera forward yaw is independent of strafe moveDir', () => {
    const camFwd = new THREE.Vector3(0, 0, -1);
    const camRight = new THREE.Vector3(1, 0, 0);
    const moveDir = new THREE.Vector3().addScaledVector(camRight, -1); // A strafe
    const faceMoveYaw = Math.atan2(moveDir.x, moveDir.z);
    const cameraFaceYaw = Math.atan2(camFwd.x, camFwd.z);
    expect(Math.abs(faceMoveYaw - cameraFaceYaw)).toBeGreaterThan(0.5);
    expect(cameraFaceYaw).toBeCloseTo(Math.atan2(0, -1), 5);
  });
});
