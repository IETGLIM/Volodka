
/* ─── Procedural tree via @dgreenheck/ez-tree ─── */

import { useEffect, useMemo } from 'react';
import { Tree } from '@dgreenheck/ez-tree';
import * as THREE from 'three';

export interface EzTreeInstanceProps {
  position: [number, number, number];
  rotation?: number;
  seed: number;
  scale?: number;
  /** Preset name from ez-tree (e.g. "Oak Medium", "Pine Small") */
  preset?: string;
}

function disposeTree(tree: Tree): void {
  tree.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        mat?.dispose();
      }
    }
  });
  tree.clear();
}

/** Single ez-tree instance for R3F scenes */
export function EzTreeInstance({
  position,
  rotation = 0,
  seed,
  scale = 1,
  preset = 'Oak Medium',
}: EzTreeInstanceProps) {
  const tree = useMemo(() => {
    const instance = new Tree();
    try {
      instance.loadPreset(preset);
    } catch {
      // Fallback: preset name may differ by ez-tree version
    }
    instance.options.seed = seed;
    instance.generate();
    instance.scale.setScalar(scale);
    return instance;
  }, [seed, scale, preset]);

  useEffect(() => () => disposeTree(tree), [tree]);

  return (
    <primitive
      object={tree}
      position={position}
      rotation={[0, rotation, 0]}
    />
  );
}
