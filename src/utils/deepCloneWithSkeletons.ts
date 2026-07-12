/* ─── Deep clone utility for Three.js scenes with SkinnedMeshes ───
 *
 * `scene.clone(true)` does NOT clone Skeletons — all cloned SkinnedMeshes
 * share the same Skeleton/Bone objects as the original. When the animation
 * system updates those bones, it moves the original mesh's vertices, NOT the
 * clone's — so the clone appears frozen at the origin while its shadow
 * (computed from the group's bounding box) moves with the physics body.
 *
 * This function:
 *  1. Clones the entire scene graph via `scene.clone(true)`
 *  2. Walks both trees in parallel
 *  3. For every SkinnedMesh, replaces its skeleton with a properly cloned one
 *  4. Also fixes bindMatrix to ensure proper vertex deformation
 */

import * as THREE from 'three';

export interface DeepCloneOptions {
  /** When true, dispose GPU resources on the source after cloning (default false). */
  disposeSource?: boolean;
}

export function deepCloneWithSkeletons(
  source: THREE.Object3D,
  options: DeepCloneOptions = {},
): THREE.Group {
  // Step 1: Tag every source object with a unique persistent ID
  // (We use userData so it doesn't interfere with Three.js internals)
  const tag = `__deepClone_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  source.traverse((obj) => {
    obj.userData[tag] = true;
    obj.userData[`${tag}_uuid`] = obj.uuid;
  });

  // Step 2: Clone the entire scene graph
  const cloned = source.clone(true) as THREE.Group;

  // Step 3: Build a map: source UUID → cloned object
  const cloneMap = new Map<string, THREE.Object3D>();
  cloned.traverse((obj) => {
    const srcUUID = obj.userData[`${tag}_uuid`];
    if (srcUUID) {
      cloneMap.set(srcUUID, obj);
    }
  });

  // Step 4: Fix SkinnedMeshes in the clone
  source.traverse((srcObj) => {
    if (!(srcObj instanceof THREE.SkinnedMesh)) return;

    const srcMesh = srcObj as THREE.SkinnedMesh;
    const srcUUID = srcMesh.userData[`${tag}_uuid`];
    if (!srcUUID) return;

    const clonedObj = cloneMap.get(srcUUID);
    if (!clonedObj || !(clonedObj instanceof THREE.SkinnedMesh)) return;

    const clonedMesh = clonedObj as THREE.SkinnedMesh;

    try {
    // Clone each bone — find it in the clone map first
    const clonedBones = srcMesh.skeleton.bones.map((bone) => {
      const boneTag = `${tag}_uuid`;
      // First try: find the bone in the clone map by its source UUID
      const boneUUID = bone.userData[boneTag];
      if (boneUUID) {
        const match = cloneMap.get(boneUUID);
        if (match && match instanceof THREE.Bone) return match;
      }

      // Second try: search by name in the cloned tree
      if (bone.name) {
        let found: THREE.Bone | null = null;
        cloned.traverse((obj) => {
          if (obj instanceof THREE.Bone && obj.name === bone.name && !found) {
            found = obj;
          }
        });
        if (found) return found;
      }

      // Fallback: manual clone of the bone
      const newBone = bone.clone() as THREE.Bone;
      newBone.name = bone.name;
      return newBone;
    });

    // Create a new Skeleton with the cloned bones
    // NOTE: We do NOT pass boneMatrices (inverseBindMatrices) to the Skeleton
    // constructor because the constructor validates that the array length matches
    // the number of bones. When GLB models have mismatched bone counts (e.g.,
    // more bone matrices than actual bones), this causes the warning:
    //   "THREE.Skeleton: Number of inverse bone matrices does not match amount of bones"
    // Instead, we let Skeleton compute inverseBindMatrices from the bone world matrices
    // via the bind() call below, which is the correct approach for cloned skeletons.
    const clonedSkeleton = new THREE.Skeleton(clonedBones);

    // Clone bone texture if it exists
    if (srcMesh.skeleton.boneTexture) {
      clonedSkeleton.boneTexture = srcMesh.skeleton.boneTexture.clone();
    }

    // CRITICAL: Unbind the cloned mesh from the old skeleton
    // and bind it to the new one. This ensures vertex deformation
    // follows the new skeleton's bone transforms.
    clonedMesh.bind(clonedSkeleton, srcMesh.bindMatrix.clone());

    // Normalize skin weights to ensure proper deformation
    clonedMesh.normalizeSkinWeights();

    // Ensure the cloned mesh's matrixWorld gets updated
    clonedMesh.updateMatrixWorld(true);
    } catch (err) {
      // Skeleton cloning can fail when the GLB model has mismatched bone
      // counts (e.g. "THREE.Skeleton: Number of inverse bone matrices does
      // not match amount of bones"). Skip this mesh's skeleton fix rather
      // than crashing — the clone will still render, just without proper
      // skinning on this particular mesh.
      console.warn(
        `[deepCloneWithSkeletons] Failed to clone skeleton for "${srcMesh.name}", skipping:`,
        err,
      );
    }
  });

  // Step 5: Clean up tags from both source and clone
  source.traverse((obj) => {
    delete obj.userData[tag];
    delete obj.userData[`${tag}_uuid`];
  });
  cloned.traverse((obj) => {
    delete obj.userData[tag];
    delete obj.userData[`${tag}_uuid`];
  });

  if (options.disposeSource) {
    source.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.SkinnedMesh) {
        obj.geometry?.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of materials) {
          mat?.dispose();
        }
      }
    });
  }

  return cloned;
}
