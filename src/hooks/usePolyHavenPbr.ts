/**
 * Load Poly Haven CC0 PBR map sets with correct color spaces + tiling.
 */

import { useLayoutEffect, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture } from 'three';
import {
  getPolyHavenPbrUrls,
  type PolyHavenMaterialId,
} from '@/config/polyhavenAssets';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

export interface PolyHavenPbrTextures {
  map: Texture;
  normalMap: Texture;
  roughnessMap: Texture;
  aoMap: Texture;
  repeat: number;
}

export function usePolyHavenPbr(
  materialId: PolyHavenMaterialId,
  repeatScale = 1,
): PolyHavenPbrTextures {
  const { preset } = useGraphicsQuality();
  const urls = useMemo(
    () => getPolyHavenPbrUrls(materialId, preset.textureScale),
    [materialId, preset.textureScale],
  );

  const maps = useTexture({
    map: urls.map,
    normalMap: urls.normalMap,
    roughnessMap: urls.roughnessMap,
    aoMap: urls.aoMap,
  });

  const repeat = urls.repeat * repeatScale;

  useLayoutEffect(() => {
    maps.map.colorSpace = SRGBColorSpace;
    maps.map.wrapS = maps.map.wrapT = RepeatWrapping;
    maps.map.anisotropy = 8;
    maps.map.repeat.set(repeat, repeat);
    maps.map.needsUpdate = true;

    for (const t of [maps.normalMap, maps.roughnessMap, maps.aoMap]) {
      t.colorSpace = NoColorSpace;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 8;
      t.repeat.set(repeat, repeat);
      t.needsUpdate = true;
    }
  }, [maps, repeat]);

  return { ...maps, repeat };
}
