/* ─── Volodka RPG – NPC Head Tracking ─── */

import * as THREE from 'three';
import { registerGlobalCleanup, registerModuleGlobalCleanupBinder } from '@/engine/core/GlobalCleanupService';

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

/** Shared forward axis for bone look-at (read-only). */
const HEAD_TRACK_FORWARD = new THREE.Vector3(0, 0, 1);
const HEAD_TRACK_UP = new THREE.Vector3(0, 1, 0);
const DEGENERATE_DIR_EPS = 1e-8;
const ANTI_PARALLEL_DOT = -0.9999;
const PARALLEL_DOT = 0.9999;

/** Per-NPC math state — intentionally no THREE.Object3D refs so LOD/model
 * remounts cannot leave dangling Bone/Group pointers in a module singleton.
 */
interface HeadTrackingState {
  originalQuat: THREE.Quaternion;
  hasCapturedOriginal: boolean;
  targetQuat: THREE.Quaternion;
  tempQuat: THREE.Quaternion;
  isProcedural: boolean;
  originalRotY: number;
  /** Head bone/group uuid within the current model instance (re-resolved each frame). */
  headObjUuid: string | null;
  /** Pre-allocated temps — avoid Vector3/Quaternion alloc in useFrame hot path. */
  headWorldPos: THREE.Vector3;
  direction: THREE.Vector3;
  localDir: THREE.Vector3;
  worldQuatInv: THREE.Quaternion;
  axis: THREE.Vector3;
  /** Layered mode — smoothed additive offsets applied after Mixamo / limb pose. */
  layeredYaw: number;
  layeredPitch: number;
}

export interface LayeredHeadTrackResult {
  yaw: number;
  pitch: number;
}

const headTrackingStates = new Map<string, HeadTrackingState>();

function createHeadTrackingState(): HeadTrackingState {
  return {
    originalQuat: new THREE.Quaternion(),
    hasCapturedOriginal: false,
    targetQuat: new THREE.Quaternion(),
    tempQuat: new THREE.Quaternion(),
    isProcedural: false,
    originalRotY: 0,
    headObjUuid: null,
    headWorldPos: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    localDir: new THREE.Vector3(),
    worldQuatInv: new THREE.Quaternion(),
    axis: new THREE.Vector3(),
    layeredYaw: 0,
    layeredPitch: 0,
  };
}

function getOrCreateState(npcId: string): HeadTrackingState {
  let state = headTrackingStates.get(npcId);
  if (!state) {
    state = createHeadTrackingState();
    headTrackingStates.set(npcId, state);
  }
  return state;
}

function isHeadObject(obj: THREE.Object3D): obj is THREE.Bone | THREE.Group {
  return obj instanceof THREE.Bone || (obj instanceof THREE.Group && obj.name === 'head');
}

function resolveHeadObject(
  npcGroup: THREE.Group,
  state: HeadTrackingState,
): THREE.Bone | THREE.Group | null {
  if (state.headObjUuid) {
    const cached = npcGroup.getObjectByProperty('uuid', state.headObjUuid);
    if (cached && isHeadObject(cached)) {
      return cached;
    }
    state.headObjUuid = null;
    state.hasCapturedOriginal = false;
  }

  const found = findHeadBone(npcGroup);
  state.headObjUuid = found?.uuid ?? null;
  return found;
}

/**
 * setFromUnitVectors safe variant — avoids NaN when vectors are near-zero or anti-parallel.
 * Returns false when `to` is degenerate (caller should skip rotation update).
 */
function setQuaternionFromUnitVectorsSafe(
  quat: THREE.Quaternion,
  from: THREE.Vector3,
  to: THREE.Vector3,
  axis: THREE.Vector3,
): boolean {
  const toLenSq = to.lengthSq();
  if (toLenSq < DEGENERATE_DIR_EPS) return false;

  const toNormX = to.x / Math.sqrt(toLenSq);
  const toNormY = to.y / Math.sqrt(toLenSq);
  const toNormZ = to.z / Math.sqrt(toLenSq);
  const dot = from.x * toNormX + from.y * toNormY + from.z * toNormZ;

  if (dot > PARALLEL_DOT) {
    quat.identity();
    return true;
  }

  if (dot < ANTI_PARALLEL_DOT) {
    axis.crossVectors(from, HEAD_TRACK_UP);
    if (axis.lengthSq() < DEGENERATE_DIR_EPS) {
      axis.set(1, 0, 0);
    }
    axis.normalize();
    quat.setFromAxisAngle(axis, Math.PI);
    return true;
  }

  quat.setFromUnitVectors(from, to);
  return true;
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
  const state = getOrCreateState(npcId);
  const headObj = resolveHeadObject(npcGroup, state);
  if (!headObj) return;

  const activationDistSq = config.activationDistance * config.activationDistance;
  const distSq = npcGroup.position.distanceToSquared(playerPosition);

  // Determine if this is a procedural model on first frame for this model instance
  if (!state.hasCapturedOriginal) {
    state.isProcedural = headObj instanceof THREE.Group && !(headObj instanceof THREE.Bone);
    state.originalQuat.copy(headObj.quaternion);
    state.originalRotY = headObj.rotation.y;
    state.hasCapturedOriginal = true;
  }

  // If player is too far, smoothly return head to original rotation
  if (distSq > activationDistSq) {
    if (state.isProcedural) {
      // For procedural models, slerp Y rotation back to original
      headObj.rotation.y += (state.originalRotY - headObj.rotation.y) * Math.min(1, config.trackSpeed * delta * 0.5);
    } else {
      headObj.quaternion.slerp(state.originalQuat, config.trackSpeed * delta * 0.5);
    }
    return;
  }

  // Compute direction from NPC head to player (in world space)
  headObj.getWorldPosition(state.headWorldPos);
  const dirLenSq = state.direction.subVectors(playerPosition, state.headWorldPos).lengthSq();
  if (dirLenSq < DEGENERATE_DIR_EPS) {
    if (state.isProcedural) {
      headObj.rotation.y += (state.originalRotY - headObj.rotation.y) * Math.min(1, config.trackSpeed * delta * 0.5);
    } else {
      headObj.quaternion.slerp(state.originalQuat, config.trackSpeed * delta * 0.5);
    }
    return;
  }
  state.direction.normalize();

  if (state.isProcedural) {
    // For procedural models: simple Y-axis rotation toward player
    // Convert player direction to local space of the NPC group
    state.localDir.copy(state.direction);
    npcGroup.getWorldQuaternion(state.worldQuatInv).invert();
    state.localDir.applyQuaternion(state.worldQuatInv);

    // Compute target Y rotation (atan2 gives angle from Z axis)
    const targetRotY = Math.atan2(state.localDir.x, state.localDir.z);

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
    headObj.getWorldQuaternion(state.worldQuatInv).invert();
    state.localDir.copy(state.direction).applyQuaternion(state.worldQuatInv);

    if (!setQuaternionFromUnitVectorsSafe(
      state.targetQuat,
      HEAD_TRACK_FORWARD,
      state.localDir,
      state.axis,
    )) {
      headObj.quaternion.slerp(state.originalQuat, config.trackSpeed * delta * 0.5);
      return;
    }

    // Clamp rotation to maxAngle
    const angle = 2 * Math.acos(Math.min(1, Math.abs(state.targetQuat.w)));
    if (angle > config.maxAngle) {
      const clampedAngle = config.maxAngle;
      const sinHalfAngle = Math.sin(angle / 2);
      if (sinHalfAngle > DEGENERATE_DIR_EPS) {
        state.axis.set(
          state.targetQuat.x / sinHalfAngle,
          state.targetQuat.y / sinHalfAngle,
          state.targetQuat.z / sinHalfAngle,
        );
      } else {
        state.axis.set(0, 1, 0);
      }
      const halfAngle = clampedAngle / 2;
      const sinHalf = Math.sin(halfAngle);
      state.targetQuat.set(
        state.axis.x * sinHalf,
        state.axis.y * sinHalf,
        state.axis.z * sinHalf,
        Math.cos(halfAngle),
      );
    }

    // Combine with original quaternion
    state.tempQuat.copy(state.originalQuat).multiply(state.targetQuat);

    // Slerp toward target for smooth tracking
    headObj.quaternion.slerp(state.tempQuat, config.trackSpeed * delta);
  }
}

function computeLayeredTrackAngles(
  headObj: THREE.Bone | THREE.Group,
  npcGroup: THREE.Group,
  playerPosition: THREE.Vector3 | null,
  config: HeadTrackingConfig,
): LayeredHeadTrackResult {
  if (!playerPosition) {
    return { yaw: 0, pitch: 0 };
  }

  const state = _layeredScratch;
  headObj.getWorldPosition(state.headWorldPos);
  const dirLenSq = state.direction.subVectors(playerPosition, state.headWorldPos).lengthSq();
  if (dirLenSq < DEGENERATE_DIR_EPS) {
    return { yaw: 0, pitch: 0 };
  }
  state.direction.normalize();

  state.localDir.copy(state.direction);
  npcGroup.getWorldQuaternion(state.worldQuatInv).invert();
  state.localDir.applyQuaternion(state.worldQuatInv);

  const yaw = Math.max(-config.maxAngle, Math.min(config.maxAngle, Math.atan2(state.localDir.x, state.localDir.z)));
  const pitch = Math.max(
    -config.maxAngle * 0.45,
    Math.min(config.maxAngle * 0.45, Math.asin(Math.max(-1, Math.min(1, state.localDir.y)))),
  );
  return { yaw, pitch };
}

const _layeredScratch = {
  headWorldPos: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  localDir: new THREE.Vector3(),
  worldQuatInv: new THREE.Quaternion(),
  animatedQuat: new THREE.Quaternion(),
  trackQuat: new THREE.Quaternion(),
  euler: new THREE.Euler(0, 0, 0, 'YXZ'),
};

/**
 * Additive head tracking layered on top of the current animated pose (post-Mixamo / post-limb).
 * Returns smoothed yaw/pitch offsets for eye tracking.
 */
export function applyLayeredHeadTracking(
  npcId: string,
  headObj: THREE.Bone | THREE.Group,
  npcGroup: THREE.Group,
  playerPosition: THREE.Vector3 | null,
  delta: number,
  config: HeadTrackingConfig = DEFAULT_HEAD_TRACKING_CONFIG,
): LayeredHeadTrackResult {
  const state = getOrCreateState(npcId);
  const isProcedural = headObj instanceof THREE.Group && !(headObj instanceof THREE.Bone);
  const target = computeLayeredTrackAngles(headObj, npcGroup, playerPosition, config);
  const lerpFactor = Math.min(1, config.trackSpeed * delta);

  state.layeredYaw += (target.yaw - state.layeredYaw) * lerpFactor;
  state.layeredPitch += (target.pitch - state.layeredPitch) * lerpFactor;

  if (isProcedural) {
    headObj.rotation.y += state.layeredYaw * 0.85;
    headObj.rotation.x += state.layeredPitch * 0.7;
  } else if (headObj instanceof THREE.Bone) {
    _layeredScratch.animatedQuat.copy(headObj.quaternion);
    _layeredScratch.euler.setFromQuaternion(_layeredScratch.animatedQuat, 'YXZ');
    _layeredScratch.euler.y += state.layeredYaw;
    _layeredScratch.euler.x += state.layeredPitch;
    headObj.quaternion.setFromEuler(_layeredScratch.euler);
  }

  return { yaw: state.layeredYaw, pitch: state.layeredPitch };
}

/** Eyes track the player with a fraction of head rotation for extra life. */
export function applyLayeredEyeTracking(
  leftEye: THREE.Object3D | null,
  rightEye: THREE.Object3D | null,
  yaw: number,
  pitch: number,
  delta: number,
  eyeFactor = 0.42,
): void {
  const lerpFactor = Math.min(1, 4 * delta);
  const targetYaw = yaw * eyeFactor;
  const targetPitch = pitch * eyeFactor;

  for (const eye of [leftEye, rightEye]) {
    if (!eye) continue;
    eye.rotation.y += (targetYaw - eye.rotation.y) * lerpFactor;
    eye.rotation.x += (targetPitch - eye.rotation.x) * lerpFactor;
  }
}

/**
 * Reset head tracking for an NPC (return head to original orientation).
 */
export function resetHeadTracking(npcId: string, npcGroup: THREE.Group): void {
  const state = headTrackingStates.get(npcId);
  if (!state || !state.hasCapturedOriginal) return;

  const headObj = resolveHeadObject(npcGroup, state);
  if (!headObj) return;

  if (state.isProcedural) {
    headObj.rotation.y = state.originalRotY;
  } else {
    headObj.quaternion.copy(state.originalQuat);
  }
}

/**
 * Drop cached model binding when the NPC mesh instance changes (LOD swap, remount).
 * Keeps per-npc math state but clears uuid/original capture so the next frame re-binds.
 */
export function invalidateHeadTracking(npcId: string): void {
  const state = headTrackingStates.get(npcId);
  if (!state) return;
  state.headObjUuid = null;
  state.hasCapturedOriginal = false;
  state.layeredYaw = 0;
  state.layeredPitch = 0;
}

/**
 * Clean up head tracking state for an NPC (on unmount).
 */
export function cleanupHeadTracking(npcId: string): void {
  headTrackingStates.delete(npcId);
}

/** Remove all NPC head-tracking entries (scene unload / canvas teardown). */
export function disposeAllHeadTracking(): void {
  headTrackingStates.clear();
}

let unregisterHeadTrackingGlobalCleanup: (() => void) | null = null;

function bindHeadTrackingGlobalCleanup(): void {
  unregisterHeadTrackingGlobalCleanup?.();
  unregisterHeadTrackingGlobalCleanup = registerGlobalCleanup((ctx) => {
    if (ctx.reason === 'scene-unload' || ctx.reason === 'unmount') {
      disposeAllHeadTracking();
    }
  });
}

registerModuleGlobalCleanupBinder(bindHeadTrackingGlobalCleanup);
bindHeadTrackingGlobalCleanup();
