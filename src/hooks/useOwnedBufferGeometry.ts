import { useMemo } from 'react';
import type * as THREE from 'three';
import { registerModuleGeometry } from '@/engine/three/moduleGeometryRegistry';

/** Component-scoped BufferGeometry registered for canvas/HMR disposal. */
export function useOwnedBufferGeometry<T extends THREE.BufferGeometry>(
  factory: () => T,
  deps: readonly unknown[],
): T {
  return useMemo(() => registerModuleGeometry(factory()), deps);
}
