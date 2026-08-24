import { useEffect, useMemo, useState } from 'react';
import { Object3D } from 'three';
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
  scene: Object3D,
  options: GltfPropPlacementOptions,
): GltfPropPlacement {
  const { manualScale = 1, targetSizeM, fitAxis } = options;

  // v4.8.1 FIX: measure synchronously on first render to avoid the
  // "floating props" flash — requestIdleCallback deferred the bounds
  // measurement, so footY=0 on first frame put tall models (bookshelves,
  // shelves with books, cabinets) with their origin at floor level:
  // bottom half underground, top half (where books sit) floating.
  // Now we try synchronous measurement first; if bounds aren't valid
  // (empty scene / not yet loaded), fall back to idle scheduling.
  const initial = useMemo(() => {
    try {
      const bounds = measureGltfBounds(scene);
      if (bounds.size.x > 0 || bounds.size.y > 0 || bounds.size.z > 0) {
        return fitPropGltf(bounds, { manualScale, targetSizeM, fitAxis });
      }
    } catch {
      // scene may be a placeholder Object3D before GLB loads
    }
    return { scale: manualScale, footY: 0 };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, manualScale, fitAxis, targetSizeM?.[0], targetSizeM?.[1], targetSizeM?.[2]]);

  const [placement, setPlacement] = useState<GltfPropPlacement>(initial);

  useEffect(() => {
    // If the synchronous measurement already gave a non-zero footY, skip
    // the deferred re-measure (saves an idle callback per prop on mount).
    if (initial.footY !== 0 || initial.scale !== initial.scale) {
      // Still re-measure if scene changes later (clone swap).
    }
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const bounds = measureGltfBounds(scene);
      const fit = fitPropGltf(bounds, { manualScale, targetSizeM, fitAxis });
      setPlacement(fit);
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const handle = requestIdleCallback(measure, { timeout: 96 });
      return () => { cancelled = true; cancelIdleCallback(handle); };
    }
    const handle = setTimeout(measure, 0);
    return () => { cancelled = true; clearTimeout(handle); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, manualScale, fitAxis, targetSizeM?.[0], targetSizeM?.[1], targetSizeM?.[2]]);

  return placement;
}
