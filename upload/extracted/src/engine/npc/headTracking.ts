/* ─── Volodka RPG – NPC Head Tracking ─── */

import * as THREE from 'three';

/**
 * Makes an NPC's head bone track the player position using
 * bone manipulation and slerp for smooth rotation.
 *
 * Usage: Call `updateHeadTracking()` every frame from useFrame.
 */

/** Configuration for head tracking behavior */
export interface HeadTrackingConfig {
  /** Maximum head rotation angle (radians) in any direction */
  maxAngle: number;
  /** Slerp speed (higher = faster tracking) */
  trackSpeed: number;
  /** Distance within which head tracking activates */
  activationDistance: number;
  /** Name patterns to search for head/neck bones */
  boneNames: string[];
}

/** Default head tracking configuration */
export const DEFAULT_HEAD_TRACKING_CONFIG: HeadTrackingConfig = {
  maxAngle: Math.PI * 0.35, // ~63° max rotation
  trackSpeed: 3.0,
  activationDistance: 8.0,
  boneNames: ['Head', 'head', 'Neck', 'neck', 'Bip001 Head', 'head_01'],
};

/** Persistent state per NPC for head tracking */
interface HeadTrackingState {
  /** Original rotation (euler y) of the head group (for procedural models) */
  originalQuat: THREE.Quaternion;
  /** Whether the original quaternion has been captured */
  hasCapturedOriginal: boolean;
  /** Current target quaternion for the head */
  targetQuat: THREE.Quaternion;
  /** Temp quaternion for slerp computation */
  tempQuat: THREE.Quaternion;
  /** Whether this is a procedural model (THREE.Group head) vs bone-based */
  isProcedural: boolean;
  /** Original Y rotation for procedural models */
  originalRotY: number;
  /** Cached head bone/group — found once, reused every frame */
  headObj: THREE.Bone | THREE.Group | null;
}

const headTrackingStates = new Map<string, HeadTrackingState>();

function getOrCreateState(npcId: string): HeadTrackingState {
  let state = headTrackingStates.get(npcId);
  if (!state) {
    state = {
      originalQuat: new THREE.Quaternion(),
      hasCapturedOriginal: false,
      targetQuat: new THREE.Quaternion(),
      tempQuat: new THREE.Quaternion(),
      isProcedural: false,
      originalRotY: 0,
      headObj: null,
    };
    headTrackingStates.set(npcId, state);
  }
  return state;
}

/**
 * Find the head/neck bone or named group in an NPC's model.
 * Searches recursively for:
 * 1. THREE.Bone objects matching bone name patterns (for GLB models)
 * 2. THREE.Group objects named 'head' (for procedural models)
 */
export function findHeadBone(group: THREE.Group): THREE.Bone | THREE.Group | null {
  const config = DEFAULT_HEAD_TRACKING_CONFIG;
  let headBone: THREE.Bone | THREE.Group | null = null;

  group.traverse((child) => {
    if (headBone) return; // Already found

    // Check for THREE.Bone (GLB models with skeletons)
    if (child instanceof THREE.Bone) {
      for (const pattern of config.boneNames) {
        if (child.name === pattern || child.name.includes(pattern)) {
          headBone = child;
          return;
        }
      }
    }

    // Check for named THREE.Group 'head' (procedural models)
    if (child instanceof THREE.Group && child.name === 'head') {
      headBone = child;
      return;
    }
  });

  return headBone;
}

/**
 * Update head tracking for an NPC.
 * Works with both bone-based (GLB) and group-based (procedural) head objects.
 *
 * @param npcId - Unique NPC identifier
 * @param npcGroup - The NPC's THREE.Group
 * @param playerPosition - Current player world position
 * @param delta - Frame delta time
 * @param config - Optional override configuration
 */
export function updateHeadTracking(
  npcId: string,
  npcGroup: THREE.Group,
  playerPosition: THREE.Vector3,
  delta: number,
  config: HeadTrackingConfig = DEFAULT_HEAD_TRACKING_CONFIG,
): void {
  const npcPos = npcGroup.position;
  const dist = npcPos.distanceTo(playerPosition);

  const state = getOrCreateState(npcId);

  // Cache head bone on first lookup — avoid full scene-graph traversal every frame
  let headObj = state.headObj;
  if (!headObj) {
    headObj = findHeadBone(npcGroup);
    state.headObj = headObj;
  }
  if (!headObj) return;

  // Determine if this is a procedural model on first frame
  if (!state.hasCapturedOriginal) {
    state.isProcedural = headObj instanceof THREE.Group && !(headObj instanceof THREE.Bone);
    state.originalQuat.copy(headObj.quaternion);
    state.originalRotY = headObj.rotation.y;
    state.hasCapturedOriginal = true;
  }

  // If player is too far, smoothly return head to original rotation
  if (dist > config.activationDistance) {
    if (state.isProcedural) {
      // For procedural models, slerp Y rotation back to original
      headObj.rotation.y += (state.originalRotY - headObj.rotation.y) * Math.min(1, config.trackSpeed * delta * 0.5);
    } else {
      headObj.quaternion.slerp(state.originalQuat, config.trackSpeed * delta * 0.5);
    }
    return;
  }

  // Compute direction from NPC head to player (in world space)
  const headWorldPos = new THREE.Vector3();
  headObj.getWorldPosition(headWorldPos);

  const direction = new THREE.Vector3()
    .subVectors(playerPosition, headWorldPos)
    .normalize();

  if (state.isProcedural) {
    // For procedural models: simple Y-axis rotation toward player
    // Convert player direction to local space of the NPC group
    const localDir = direction.clone();
    const npcWorldQuatInv = new THREE.Quaternion();
    npcGroup.getWorldQuaternion(npcWorldQuatInv).invert();
    localDir.applyQuaternion(npcWorldQuatInv);

    // Compute target Y rotation (atan2 gives angle from Z axis)
    const targetRotY = Math.atan2(localDir.x, localDir.z);

    // Clamp the rotation offset from original
    const rotationOffset = targetRotY - state.originalRotY;
    const clampedOffset = Math.max(-config.maxAngle, Math.min(config.maxAngle, rotationOffset));
    const targetY = state.originalRotY + clampedOffset;

    // Smoothly interpolate toward target
    const lerpFactor = Math.min(1, config.trackSpeed * delta);
    headObj.rotation.y += (targetY - headObj.rotation.y) * lerpFactor;
  } else {
    // For bone-based models: full quaternion-based tracking
    // Convert world direction to bone's local space
    const boneWorldQuatInv = new THREE.Quaternion();
    headObj.getWorldQuaternion(boneWorldQuatInv).invert();

    const localDirection = direction.applyQuaternion(boneWorldQuatInv);

    // Create a look-at quaternion in local space
    const forward = new THREE.Vector3(0, 0, 1);
    state.targetQuat.setFromUnitVectors(forward, localDirection);

    // Clamp rotation to maxAngle
    const angle = 2 * Math.acos(Math.min(1, Math.abs(state.targetQuat.w)));
    if (angle > config.maxAngle) {
      const clampedAngle = config.maxAngle;
      const axis = new THREE.Vector3(state.targetQuat.x, state.targetQuat.y, state.targetQuat.z).normalize();
      const halfAngle = clampedAngle / 2;
      const sinHalf = Math.sin(halfAngle);
      state.targetQuat.set(
        axis.x * sinHalf,
        axis.y * sinHalf,
        axis.z * sinHalf,
        Math.cos(halfAngle),
      );
    }

    // Combine with original quaternion
    state.tempQuat.copy(state.originalQuat).multiply(state.targetQuat);

    // Slerp toward target for smooth tracking
    headObj.quaternion.slerp(state.tempQuat, config.trackSpeed * delta);
  }
}

/**
 * Reset head tracking for an NPC (return head to original orientation).
 */
export function resetHeadTracking(npcId: string, npcGroup: THREE.Group): void {
  const headObj = findHeadBone(npcGroup);
  if (!headObj) return;

  const state = headTrackingStates.get(npcId);
  if (state && state.hasCapturedOriginal) {
    if (state.isProcedural) {
      headObj.rotation.y = state.originalRotY;
    } else {
      headObj.quaternion.copy(state.originalQuat);
    }
  }
}

/**
 * Clean up head tracking state for an NPC (on unmount).
 */
export function cleanupHeadTracking(npcId: string): void {
  headTrackingStates.delete(npcId);
}
