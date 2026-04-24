import type { PropDefinition } from './propsTypes';

export const PROP_DEFINITIONS: Record<string, PropDefinition> = {
  // === Мебель ===
  desk_volodka: {
    id: 'desk_volodka',
    category: 'furniture',
    glbPath: '/desk_volodka.glb',
    estimatedGeometryBytes: 120_000,
    /** Подогнано под комнату 14×10 при `explorationCharacterModelScale` 0.48 и ÷5 в `PropModel`. */
    baseUniform: 1.12,
  },
  chair_volodka: {
    id: 'chair_volodka',
    category: 'furniture',
    glbPath: undefined,
    estimatedGeometryBytes: 1024,
  },
  wardrobe_soviet: {
    id: 'wardrobe_soviet',
    category: 'furniture',
    glbPath: '/shelf.glb',
    estimatedGeometryBytes: 80_000,
    baseUniform: 0.92,
  },
  /** Процедурный диван в `VolodkaRoomVisual`; при появлении GLB — только `glbPath` в манифесте. */
  volodka_sofa: {
    id: 'volodka_sofa',
    category: 'furniture',
    glbPath: undefined,
    estimatedGeometryBytes: 2048,
  },
  /** Окно в задней стене (плоскость); при GLB — замена одной строкой в манифесте. */
  volodka_window: {
    id: 'volodka_window',
    category: 'decor',
    glbPath: undefined,
    estimatedGeometryBytes: 512,
  },

  // === Декор ===
  mug_techsupport: {
    id: 'mug_techsupport',
    category: 'tableware',
    glbPath: '/mug.glb',
    estimatedGeometryBytes: 256_000,
    baseUniform: 0.14,
    /** Мелкий ассет — сырой продукт bbox×uniform не в диапазоне «гуманоид». */
    exemptFromScaleValidation: true,
  },
  poster_glory_to_labor: {
    id: 'poster_glory_to_labor',
    category: 'decor',
    glbPath: undefined,
    estimatedTextureBytes: 512 * 512 * 4, // CanvasTexture
  },
  carpet_zarema: {
    id: 'carpet_zarema',
    category: 'decor',
    glbPath: undefined,
    estimatedGeometryBytes: 1024,
    estimatedTextureBytes: 512 * 512 * 3,
  },

  // === Техника ===
  keyboard_ibm: {
    id: 'keyboard_ibm',
    category: 'tech',
    glbPath: '/Keyboard.glb',
    estimatedGeometryBytes: 200_000,
    baseUniform: 0.1,
    exemptFromScaleValidation: true,
  },

  // === Освещение ===
  lamp_desk: {
    id: 'lamp_desk',
    category: 'lighting',
    glbPath: '/lamp.glb',
    estimatedGeometryBytes: 80_000,
    baseUniform: 0.32,
  },
};

/** Получить проп по ID (с fallback на undefined) */
export function getPropDefinition(id: string): PropDefinition | undefined {
  return PROP_DEFINITIONS[id];
}

/** GLB-пропы для CI (`propGlbScale.integration.test.ts`): путь как в `public/` (от корня сайта). */
export function getPropGlbDefinitionsForScaleValidator(): { url: string; def: PropDefinition }[] {
  const out: { url: string; def: PropDefinition }[] = [];
  for (const def of Object.values(PROP_DEFINITIONS)) {
    const p = def.glbPath?.trim();
    if (!p) continue;
    const url = p.startsWith('/') ? p : `/${p}`;
    out.push({ url, def });
  }
  return out;
}

/** Валидация масштаба GLB-пропа (см. `propScaleValidation.ts`). */
export { validatePropGlbScale } from '@/lib/propScaleValidation';
