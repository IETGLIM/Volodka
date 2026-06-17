import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  fitPropGltf,
  measureGltfBounds,
  type PropFitAxis,
} from '@/engine/assets/gltfScale';

export interface GltfPropPlacementOptions {
  manualScale?: number;
  targetSizeM?: readonly [number, number, number];
  fitAxis?: PropFitAxis;
}

export interface GltfPropPlacement {
  scale: number;
  footY: number;
}

/** Measure a loaded GLB clone and resolve AAA metre-scale placement. */
export function useGltfPropPlacement(
  scene: THREE.Object3D,
  options: GltfPropPlacementOptions,
): GltfPropPlacement {
  const { manualScale = 1, targetSizeM, fitAxis } = options;
  const [placement, setPlacement] = useState<GltfPropPlacement>({ scale: manualScale, footY: 0 });

  useEffect(() => {
    const bounds = measureGltfBounds(scene);
    const fit = fitPropGltf(bounds, { manualScale, targetSizeM, fitAxis });
    setPlacement(fit);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- targetSizeM tuple elements tracked individually
  }, [scene, manualScale, fitAxis, targetSizeM?.[0], targetSizeM?.[1], targetSizeM?.[2]]);

  return placement;
}
