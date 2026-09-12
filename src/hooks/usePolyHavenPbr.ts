/**
 * Load Poly Haven CC0 PBR map sets with correct color spaces + tiling.
 *
 * Этап 133: загрузка через standalone KTX2-путь (ktx2Textures.ts) — diff/rough/ao
 * приходят как KTX2/Basis (basis-lz, встроенные mip-цепочки, 4 bpp в VRAM),
 * нормали — WebP (решение по измерениям PSNR/размера). При недоступности
 * транскодера весь набор перестраивается по WebP-фолбэку. Suspense-семантика
 * прежняя (drei useTexture → React 19 use()).
 */

import { useMemo, use } from 'react';
import { useThree } from '@react-three/fiber';
import { NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture } from 'three';
import type { ColorSpace } from 'three';
import {
  getPolyHavenFallbackPbrUrls,
  getPolyHavenPbrUrls,
  type PolyHavenMaterialId,
} from '@/config/polyhavenAssets';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { loadPolyHavenPbrTextureSet } from '@/engine/assets/ktx2Textures';

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
  const gl = useThree((state) => state.gl);

  const urls = useMemo(
    () => getPolyHavenPbrUrls(materialId, preset.textureScale),
    [materialId, preset.textureScale],
  );
  const fallbackUrls = useMemo(
    () => getPolyHavenFallbackPbrUrls(materialId, preset.textureScale),
    [materialId, preset.textureScale],
  );

  // React 19 use(): suspends on first mount (как useTexture ранее), затем
  // мгновенный результат из модульного кэша промисов (стабильная ссылка).
  // Фолбэк на WebP зашит внутрь промиса — rejection доходит до ErrorBoundary
  // только при провале ОБЕИХ веток (эквивалент прежнего 404 в useTexture).
  const maps = use(loadPolyHavenPbrTextureSet(urls, fallbackUrls, gl));

  const repeat = urls.repeat * repeatScale;

  // v4.33.0 fix (tiling cross-talk): configure CLONES, not the shared cached
  // textures. Загрузчик возвращает ОДИН shared Texture на URL — мутация
  // repeat/wrap/anisotropy на нём ломает ~60 call-site'ов. Texture.clone()
  // в three ≥r151 шарит Source (одна GPU-загрузка; для CompressedTexture
  // Source тоже шарится — повторной распаковки нет), repeat применяется
  // per-material через UV-transform uniform.
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
