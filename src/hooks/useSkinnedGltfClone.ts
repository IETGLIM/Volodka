import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { deepCloneWithSkeletons } from '@/utils/deepCloneWithSkeletons';
import {
  disposeSkinnedClone,
  type DisposeThreeOptions,
} from '@/engine/three/disposeThreeResources';

export interface UseSkinnedGltfCloneOptions extends DisposeThreeOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface SkinnedGltfClone {
  scene: THREE.Group;
  mixer: THREE.AnimationMixer | null;
}

/**
 * Deep-clone a cached GLTF scene with independent skeletons, optional mixer,
 * and guaranteed GPU teardown on unmount or source change.
 */
export function useSkinnedGltfClone(
  sourceScene: THREE.Object3D,
  animations: THREE.AnimationClip[] | undefined,
  options?: UseSkinnedGltfCloneOptions,
): SkinnedGltfClone {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const { scene, mixer } = useMemo(() => {
    const { castShadow, receiveShadow } = optionsRef.current ?? {};
    const clone = deepCloneWithSkeletons(sourceScene);
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh || node instanceof THREE.SkinnedMesh) {
        if (castShadow !== undefined) node.castShadow = castShadow;
        if (receiveShadow !== undefined) node.receiveShadow = receiveShadow;
      }
    });
    const animationMixer =
      animations && animations.length > 0
        ? new THREE.AnimationMixer(clone)
        : null;
    return { scene: clone, mixer: animationMixer };
  }, [sourceScene, animations]);

  useEffect(() => {
    return () => {
      const { castShadow: _c, receiveShadow: _r, ...disposeOpts } = optionsRef.current ?? {};
      disposeSkinnedClone(scene, mixer, disposeOpts);
    };
  }, [scene, mixer]);

  return { scene, mixer };
}
