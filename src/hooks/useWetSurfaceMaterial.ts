import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { applyWetness } from '@/engine/graphics/materials/pbrPresets';

export interface WetSurfaceMaterialOptions {
  dryRoughness: number;
  dryMetalness: number;
  rainIntensity?: number;
}

/** Hook: mesh material that darkens and glosses with rain intensity. */
export function useWetSurfaceMaterial(
  color: string,
  options: WetSurfaceMaterialOptions,
): THREE.MeshStandardMaterial {
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  if (!matRef.current) {
    matRef.current = new THREE.MeshStandardMaterial({
      color,
      roughness: options.dryRoughness,
      metalness: options.dryMetalness,
    });
  }

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    applyWetness(mat, options.dryRoughness, options.dryMetalness, options.rainIntensity ?? 0);
  });

  return matRef.current;
}
