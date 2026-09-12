import { useEffect, useRef, useState } from 'react';
import { AnimationClip, AnimationMixer, BufferGeometry, Group, Material, Object3D, SkinnedMesh, Mesh, Texture } from 'three';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { deepCloneWithSkeletons } from '@/utils/deepCloneWithSkeletons';
import {
  createSourceSkipSet,
  disposeSkinnedClone,
  type DisposeThreeOptions,
  type DisposeThreeSkipSets,
} from '@/engine/three/disposeThreeResources';

export interface UseSkinnedGltfCloneOptions extends DisposeThreeOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface SkinnedGltfClone {
  scene: Group;
  mixer: AnimationMixer | null;
  ready: boolean;
}

function buildSkinnedClone(
  sourceScene: Object3D,
  animations: AnimationClip[] | undefined,
  options?: UseSkinnedGltfCloneOptions,
): SkinnedGltfClone {
  const { castShadow, receiveShadow } = options ?? {};
  let clone: Group;
  try {
    clone = cloneSkinnedScene(sourceScene) as Group;
  } catch {
    clone = deepCloneWithSkeletons(sourceScene);
  }
  clone.traverse((node) => {
    if (node instanceof Mesh || node instanceof SkinnedMesh) {
      if (castShadow !== undefined) node.castShadow = castShadow;
      if (receiveShadow !== undefined) node.receiveShadow = receiveShadow;
    }
  });
  const animationMixer =
    animations && animations.length > 0
      ? new AnimationMixer(clone)
      : null;
  return { scene: clone, mixer: animationMixer, ready: true };
}

function createPlaceholderClone(): SkinnedGltfClone {
  return { scene: new Group(), mixer: null, ready: false };
}

/** Объединить skip-сет вызова с skip-сетом исходной сцены (оба защищены). */
function mergeSkipSets(
  caller: DisposeThreeSkipSets | undefined,
  source: DisposeThreeSkipSets,
): DisposeThreeSkipSets {
  return {
    geometries: new Set<BufferGeometry>([...(caller?.geometries ?? []), ...(source.geometries ?? [])]),
    materials: new Set<Material>([...(caller?.materials ?? []), ...(source.materials ?? [])]),
    textures: new Set<Texture>([...(caller?.textures ?? []), ...(source.textures ?? [])]),
  };
}

/**
 * Deep-clone a cached GLTF scene with independent skeletons, optional mixer,
 * and guaranteed GPU teardown on unmount or source change.
 * Clone work is deferred off the critical rAF path when possible.
 */
export function useSkinnedGltfClone(
  sourceScene: Object3D,
  animations: AnimationClip[] | undefined,
  options?: UseSkinnedGltfCloneOptions,
): SkinnedGltfClone {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [clone, setClone] = useState<SkinnedGltfClone>(createPlaceholderClone);
  const cloneRef = useRef(clone);
  cloneRef.current = clone;

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // FIX (критический, v4.17.1): SkeletonUtils.clone() шарит geometry /
    // material / текстуры с кэшированной сценой useGLTF. Без skip-сета
    // dispose клона уничтожал ОБЩИЕ ресурсы кэша → ре-аплоад буферов и
    // перекомпиляция шейдеров у остальных живых клонов (спайки-фризы при
    // LOD-свитчах и смене сцен). Skip-сет строим один раз на эффект.
    const sourceSkip = createSourceSkipSet(sourceScene);

    const resolveDisposeOptions = (): DisposeThreeOptions => {
      const { castShadow: _c, receiveShadow: _r, ...disposeOpts } = optionsRef.current ?? {};
      return { ...disposeOpts, skip: mergeSkipSets(disposeOpts.skip, sourceSkip) };
    };

    const commitClone = () => {
      if (cancelled) return;
      const previous = cloneRef.current;
      if (previous.ready) {
        disposeSkinnedClone(previous.scene, previous.mixer, resolveDisposeOptions());
      }
      const built = buildSkinnedClone(sourceScene, animations, optionsRef.current);
      cloneRef.current = built;
      setClone(built);
    };

    setClone(createPlaceholderClone());

    if (typeof requestIdleCallback === 'function') {
      idleId = requestIdleCallback(commitClone, { timeout: 32 });
    } else {
      timeoutId = setTimeout(commitClone, 0);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof cancelIdleCallback === 'function') {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      const current = cloneRef.current;
      if (current.ready) {
        disposeSkinnedClone(current.scene, current.mixer, resolveDisposeOptions());
      }
    };
  }, [sourceScene, animations]);

  return clone;
}
