import * as THREE from 'three';

export interface QuaterniusRetargetBinding {
  bonePatterns: readonly string[];
  partName: string;
  copyPositionY?: boolean;
}

/** Quaternius / Mixamo bone names → procedural composer group names. */
export const QUATERNIUS_PROCEDURAL_BINDINGS: readonly QuaterniusRetargetBinding[] = [
  { bonePatterns: ['Head', 'head', 'mixamorigHead'], partName: 'head' },
  { bonePatterns: ['Chest', 'Torso', 'Spine2', 'Spine1', 'UpperChest', 'mixamorigSpine2'], partName: 'torso', copyPositionY: true },
  { bonePatterns: ['UpperArm.L', 'LeftArm', 'mixamorigLeftArm'], partName: 'leftArm' },
  { bonePatterns: ['UpperArm.R', 'RightArm', 'mixamorigRightArm'], partName: 'rightArm' },
  { bonePatterns: ['UpperLeg.L', 'LeftUpLeg', 'mixamorigLeftUpLeg'], partName: 'leftLeg' },
  { bonePatterns: ['UpperLeg.R', 'RightUpLeg', 'mixamorigRightUpLeg'], partName: 'rightLeg' },
];

interface RetargetCache {
  rigRootUuid: string | null;
  bones: Map<string, THREE.Bone | null>;
}

const retargetCaches = new Map<string, RetargetCache>();

function getRetargetCache(key: string): RetargetCache {
  let cache = retargetCaches.get(key);
  if (!cache) {
    cache = { rigRootUuid: null, bones: new Map() };
    retargetCaches.set(key, cache);
  }
  return cache;
}

function matchesPattern(name: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => name === pattern || name.includes(pattern));
}

function findBone(rigRoot: THREE.Object3D, patterns: readonly string[]): THREE.Bone | null {
  let found: THREE.Bone | null = null;
  rigRoot.traverse((child) => {
    if (found) return;
    if (child instanceof THREE.Bone && matchesPattern(child.name, patterns)) {
      found = child;
    }
  });
  return found;
}

function resolveBindingBone(
  cacheKey: string,
  rigRoot: THREE.Object3D,
  binding: QuaterniusRetargetBinding,
): THREE.Bone | null {
  const cache = getRetargetCache(cacheKey);
  if (cache.rigRootUuid !== rigRoot.uuid) {
    cache.rigRootUuid = rigRoot.uuid;
    cache.bones.clear();
  }

  const cached = cache.bones.get(binding.partName);
  if (cached !== undefined) {
    return cached;
  }

  const bone = findBone(rigRoot, binding.bonePatterns);
  cache.bones.set(binding.partName, bone);
  return bone;
}

/**
 * Copy animated Quaternius/Mixamo bone pose onto procedural composer groups.
 * Call after AnimationMixer.update() each frame.
 */
export function applyQuaterniusRigToComposer(
  cacheKey: string,
  rigRoot: THREE.Object3D,
  composerRoot: THREE.Group,
  torsoBaseY: number,
): boolean {
  let applied = false;

  for (const binding of QUATERNIUS_PROCEDURAL_BINDINGS) {
    const bone = resolveBindingBone(cacheKey, rigRoot, binding);
    const part = composerRoot.getObjectByName(binding.partName) as THREE.Group | null;
    if (!bone || !part) continue;

    part.quaternion.copy(bone.quaternion);
    part.rotation.setFromQuaternion(part.quaternion);

    if (binding.copyPositionY && binding.partName === 'torso') {
      part.position.y = torsoBaseY + bone.position.y * 0.02;
    }

    applied = true;
  }

  return applied;
}

export function invalidateQuaterniusRigRetarget(cacheKey: string): void {
  retargetCaches.delete(cacheKey);
}

export function disposeAllQuaterniusRigRetarget(): void {
  retargetCaches.clear();
}
