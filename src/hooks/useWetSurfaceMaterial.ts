import { useLayoutEffect, useEffect, useRef } from 'react';
import { registerFrameTick, unregisterFrameTick } from '@/engine/frame/FrameBudgetRegistry';
import { MeshStandardMaterial } from 'three';
import { applyWetness } from '@/engine/graphics/materials/pbrPresets';
import { disposeMaterialWithTextures } from '@/engine/three/disposeThreeResources';

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

  // Dispose material AND its attached textures on unmount — R3F does not
  // auto-dispose materials attached via <primitive object={mat} attach="material" />,
  // and Three.js Material.dispose() intentionally does NOT cascade to its textures.
  // applySurfaceDetailMaps (called by WetStreetGround) clones map/normalMap/
  // roughnessMap DataTextures onto this material — without texture disposal, each
  // WetStreetGround mount would leak ~3 DataTextures (~128KB each on GPU).
  // Reuses the canonical disposeMaterialWithTextures helper from disposeThreeResources
  // (which itself reuses the MATERIAL_TEXTURE_KEYS traversal used everywhere else).
  useEffect(() => {
    return () => {
      if (matRef.current) {
        disposeMaterialWithTextures(matRef.current);
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
