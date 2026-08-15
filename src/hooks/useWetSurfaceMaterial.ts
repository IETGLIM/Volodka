import { useLayoutEffect, useEffect, useRef } from 'react';
import { registerFrameTick, unregisterFrameTick } from '@/engine/frame/FrameBudgetRegistry';
import { MeshStandardMaterial } from 'three';
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
): MeshStandardMaterial {
  const matRef = useRef<MeshStandardMaterial | null>(null);
  const lastColorRef = useRef<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const wetActive = (options.rainIntensity ?? 0) > 0;

  if (!matRef.current) {
    matRef.current = new MeshStandardMaterial({
      color,
      roughness: options.dryRoughness,
      metalness: options.dryMetalness,
    });
    lastColorRef.current = color;
  } else if (lastColorRef.current !== color) {
    lastColorRef.current = color;
    matRef.current.color.set(color);
  }

  // Dispose material on unmount — R3F does not auto-dispose materials
  // attached via <primitive object={mat} attach="material" />. Each street
  // scene visit otherwise leaks one MeshStandardMaterial.
  useEffect(() => {
    return () => {
      if (matRef.current) {
        matRef.current.dispose();
        matRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!wetActive) {
      const mat = matRef.current;
      if (mat) {
        const { dryRoughness, dryMetalness } = optionsRef.current;
        applyWetness(mat, dryRoughness, dryMetalness, 0);
      }
      return;
    }

    const tickId = registerFrameTick('weather', () => {
      const mat = matRef.current;
      if (!mat) return;
      const { dryRoughness, dryMetalness, rainIntensity } = optionsRef.current;
      applyWetness(mat, dryRoughness, dryMetalness, rainIntensity ?? 0);
    });

    return () => unregisterFrameTick(tickId);
  }, [wetActive, options.dryRoughness, options.dryMetalness]);

  return matRef.current;
}
