import type { PropDefinition } from './propsTypes';

export const PROP_DEFINITIONS: Record<string, PropDefinition> = {
  // === Мебель ===
  desk_volodka: {
    id: 'desk_volodka',
    category: 'furniture',
    glbPath: undefined, // пока процедурный
    estimatedGeometryBytes: 2048,
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
    glbPath: undefined, // позже заменим на GLB
    estimatedGeometryBytes: 4096,
  },

  // === Декор ===
  mug_techsupport: {
    id: 'mug_techsupport',
    category: 'tableware',
    glbPath: undefined,
    estimatedGeometryBytes: 256,
    baseUniform: 0.025, // кружка ~10 см высотой
  },
  poster_glory_to_labor: {
    id: 'poster_glory_to_labor',
    category: 'decor',
    glbPath: undefined,
    estimatedTextureBytes: 512 * 512 * 4, // CanvasTexture
  },

  // === Техника ===
  keyboard_ibm: {
    id: 'keyboard_ibm',
    category: 'tech',
    glbPath: undefined,
    estimatedGeometryBytes: 512,
    baseUniform: 0.01,
  },

  // === Освещение ===
  lamp_desk: {
    id: 'lamp_desk',
    category: 'lighting',
    glbPath: undefined,
    estimatedGeometryBytes: 512,
  },
};

/** Получить проп по ID (с fallback на undefined) */
export function getPropDefinition(id: string): PropDefinition | undefined {
  return PROP_DEFINITIONS[id];
}

/** Валидация масштаба GLB-пропа (см. `propScaleValidation.ts`). */
export { validatePropGlbScale } from '@/lib/propScaleValidation';
