/**
 * Этап 133: контракт URL-роутинга внешних карт PolyHaven.
 *
 * KTX2 одобрен только для diff/rough/ao (измерения PSNR/размера — см.
 * scripts/generate-polyhaven-ktx2.mjs); нормали остаются WebP. Prune/verify
 * используют те же функции — дрейф keep-set ловится тестом и verify:deploy.
 */
import { describe, it, expect } from 'vitest';
import {
  getPolyHavenFallbackMapUrl,
  getPolyHavenFallbackPbrUrls,
  getPolyHavenMapUrl,
  getPolyHavenPbrUrls,
  resolvePolyHavenRes,
  POLYHAVEN_KTX2_MAP_KINDS,
  POLYHAVEN_MAP_KINDS,
  POLYHAVEN_MATERIAL_IDS,
} from '@/config/polyhavenAssets';

describe('polyhavenAssets: KTX2-роутинг (этап 133)', () => {
  it('diff/rough/ao получают .ktx2, нормали остаются .webp', () => {
    expect(getPolyHavenMapUrl('asphalt_02', 'diff', 1)).toBe(
      '/textures/polyhaven/asphalt_02/asphalt_02_diff_2k.ktx2',
    );
    expect(getPolyHavenMapUrl('asphalt_02', 'rough', 1)).toBe(
      '/textures/polyhaven/asphalt_02/asphalt_02_rough_2k.ktx2',
    );
    expect(getPolyHavenMapUrl('asphalt_02', 'ao', 1)).toBe(
      '/textures/polyhaven/asphalt_02/asphalt_02_ao_2k.ktx2',
    );
    expect(getPolyHavenMapUrl('asphalt_02', 'nor_gl', 1)).toBe(
      '/textures/polyhaven/asphalt_02/asphalt_02_nor_gl_2k.webp',
    );
  });

  it('разрешение зависит от textureScale и HAS_2K (2k только у asphalt_02/wood_floor)', () => {
    expect(resolvePolyHavenRes('asphalt_02', 1)).toBe('2k');
    expect(resolvePolyHavenRes('asphalt_02', 0.5)).toBe('1k');
    expect(resolvePolyHavenRes('asphalt_02', 0.25)).toBe('1k');
    expect(resolvePolyHavenRes('metal_plate', 1)).toBe('1k');
    expect(getPolyHavenMapUrl('wood_floor', 'diff', 0.5)).toBe(
      '/textures/polyhaven/wood_floor/wood_floor_diff_1k.ktx2',
    );
    // 1k-материал на scale 1 не должен ссылаться на несуществующий 2k
    expect(getPolyHavenMapUrl('metal_plate', 'diff', 1)).toBe(
      '/textures/polyhaven/metal_plate/metal_plate_diff_1k.ktx2',
    );
  });

  it('фолбэк всегда .webp и совпадает с основным путём для нормалей', () => {
    expect(getPolyHavenFallbackMapUrl('asphalt_02', 'diff', 1)).toBe(
      '/textures/polyhaven/asphalt_02/asphalt_02_diff_2k.webp',
    );
    expect(getPolyHavenFallbackMapUrl('metal_plate', 'nor_gl', 1)).toBe(
      getPolyHavenMapUrl('metal_plate', 'nor_gl', 1),
    );
  });

  it('PBR-набор содержит 4 карты + repeat; фолбэк-набор зеркален', () => {
    const urls = getPolyHavenPbrUrls('plastered_wall', 0.5);
    expect(Object.keys(urls).sort()).toEqual([
      'aoMap',
      'map',
      'normalMap',
      'repeat',
      'roughnessMap',
    ]);
    expect(urls.map.endsWith('.ktx2')).toBe(true);
    expect(urls.normalMap.endsWith('.webp')).toBe(true);
    expect(urls.roughnessMap.endsWith('.ktx2')).toBe(true);
    expect(urls.aoMap.endsWith('.ktx2')).toBe(true);

    const fallback = getPolyHavenFallbackPbrUrls('plastered_wall', 0.5);
    expect(fallback.map).toBe(getPolyHavenFallbackMapUrl('plastered_wall', 'diff', 0.5));
    expect(fallback.normalMap).toBe(urls.normalMap);
    expect(fallback.repeat).toBe(urls.repeat);
  });

  it('канонические списки полны и KTX2-набор = {ao, diff, rough}', () => {
    expect(POLYHAVEN_MATERIAL_IDS).toHaveLength(5);
    expect(POLYHAVEN_MAP_KINDS).toHaveLength(4);
    expect([...POLYHAVEN_KTX2_MAP_KINDS].sort()).toEqual(['ao', 'diff', 'rough']);
  });
});
