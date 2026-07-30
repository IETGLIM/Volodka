/**
 * Live presentation mirrors for HUD (Compass / MiniMap).
 *
 * AAA ownership:
 * - Body yaw: PhysicsPlayer locomotion → livePlayerRotationRef → sharedPlayerRotationRef
 * - Look yaw: FollowCamera → sharedCameraYawRef (TP: independent of body)
 * - Position: finalizePlayerFrame → livePlayerPositionRef → sharedPlayerPositionRef
 * - Store exploration.playerPosition/Rotation: transitions / cinematics / save only
 */

export const sharedPlayerRotationRef: { current: number } = { current: Math.PI };

/** Live world position mirror — do not write from React store selectors. */
export const sharedPlayerPositionRef: {
  current: { x: number; y: number; z: number };
} = { current: { x: 0, y: 0, z: 0 } };

/** Camera yaw (horizontal look) — used for FPS interaction targeting. */
export const sharedCameraYawRef: { current: number } = { current: Math.PI };

