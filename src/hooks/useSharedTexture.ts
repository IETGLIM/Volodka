import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
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

  const texture = useMemo(
    () => acquireSharedTexture(key, () => factoryRef.current()),
    [key],
  );

  useEffect(() => () => releaseSharedTexture(key), [key]);

  return texture;
}
