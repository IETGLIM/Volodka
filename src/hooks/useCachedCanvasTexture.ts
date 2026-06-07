import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import {
  getCachedCanvasTexture,
  releaseCachedCanvasTexture,
} from '@/engine/three/cachedCanvasTexture';

/** Ref-counted canvas texture — shared across scene remounts, released on unmount. */
export function useCachedCanvasTexture(
  key: string,
  factory: () => THREE.CanvasTexture,
): THREE.CanvasTexture {
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  const texture = useMemo(
    () => getCachedCanvasTexture(key, () => factoryRef.current()),
    [key],
  );

  useEffect(() => () => releaseCachedCanvasTexture(key), [key]);

  return texture;
}
