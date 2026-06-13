import { useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import { QUALITY_GPU_CLEANUP } from '@/engine/graphics/graphicsSettingsStorage';
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
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const onQualityCleanup = () => {
      releaseCachedCanvasTexture(key);
      setGeneration((value) => value + 1);
    };
    window.addEventListener(QUALITY_GPU_CLEANUP, onQualityCleanup);
    return () => window.removeEventListener(QUALITY_GPU_CLEANUP, onQualityCleanup);
  }, [key]);

  const texture = useMemo(
    () => getCachedCanvasTexture(key, () => factoryRef.current()),
    [key, generation],
  );

  useEffect(() => () => releaseCachedCanvasTexture(key), [key, generation]);

  return texture;
}
