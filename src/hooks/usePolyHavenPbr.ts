/**
 * Load Poly Haven CC0 PBR map sets with correct color spaces + tiling.
 */

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture } from 'three';
import type { ColorSpace } from 'three';
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

  // v4.33.0 fix (tiling cross-talk): configure CLONES, not the shared cached
  // textures. `useTexture` returns ONE shared Texture instance per URL — the
  // old code mutated `repeat/wrap/anisotropy` on it, so among ~60 call sites
  // with different `repeatScale` for the same material the last layout effect
  // to run decided the tiling of EVERY floor/wall using that material (it
  // visibly changed between scenes/quality switches).
  //
  // Texture.clone() in three ≥r151 shares the `Source` (single GPU upload —
  // no extra VRAM), while `repeat` is applied per-material via UV-transform
  // uniforms, so each consumer gets an independent tiling.
  const configured = useMemo(() => {
    const configure = (src: Texture, colorSpace: ColorSpace): Texture => {
      const t = src.clone();
      t.colorSpace = colorSpace;
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = 8;
      t.repeat.set(repeat, repeat);
      return t;
    };

    return {
      map: configure(maps.map, SRGBColorSpace),
      normalMap: configure(maps.normalMap, NoColorSpace),
      roughnessMap: configure(maps.roughnessMap, NoColorSpace),
      aoMap: configure(maps.aoMap, NoColorSpace),
    };
  }, [maps, repeat]);

  return { ...configured, repeat };
}
