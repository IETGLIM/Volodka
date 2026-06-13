import { useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import { QUALITY_GPU_CLEANUP } from '@/engine/graphics/graphicsSettingsStorage';
import {
  acquireSharedTexture,
  releaseSharedTexture,
} from '@/engine/three/textureReuseMap';

/** Ref-counted GPU texture — shared across scene remounts, released on unmount. */
export function useSharedTexture(
  key: string,
  factory: () => THREE.Texture,
): THREE.Texture {
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const onQualityCleanup = () => {
      releaseSharedTexture(key);
      setGeneration((value) => value + 1);
    };
    window.addEventListener(QUALITY_GPU_CLEANUP, onQualityCleanup);
    return () => window.removeEventListener(QUALITY_GPU_CLEANUP, onQualityCleanup);
  }, [key]);

  const texture = useMemo(
    () => acquireSharedTexture(key, () => factoryRef.current()),
    [key, generation],
  );

  useEffect(() => () => releaseSharedTexture(key), [key, generation]);

  return texture;
}
