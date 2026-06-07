/** Visual quality tiers — drives DPR, LOD, compression variant, and procedural/GLB mix. */

export type QualityPresetId = 'auto' | 'low' | 'medium' | 'high' | 'ultra';

export type AssetRenderMode = 'procedural' | 'hybrid' | 'glb';
export type CompressionPreference = 'none' | 'draco' | 'meshopt';

export interface QualityPreset {
  id: Exclude<QualityPresetId, 'auto'>;
  label: string;
  labelRu: string;
  /** Canvas DPR range passed to useDynamicDPR */
  dpr: [number, number];
  shadows: boolean;
  antialias: boolean;
  postProcessing: boolean;
  /** Global particle / fog multiplier 0–1 */
  effectsScale: number;
  /** >1 keeps higher LOD longer (multiplies LOD switch distances) */
  lodBias: number;
  /** Texture mip bias for KTX2 / atlas selection */
  textureScale: 0.25 | 0.5 | 1;
  maxDrawDistance: number;
  useInstancing: boolean;
  useImpostors: boolean;
  /** Camera distance at which impostor replaces mesh (meters) */
  impostorDistance: number;
  /** Prefer lightmaps / baked probes when asset provides them */
  bakedLighting: boolean;
  compression: CompressionPreference;
  npcRenderMode: AssetRenderMode;
  environmentRenderMode: AssetRenderMode;
  /** Alias for legacy visualLite checks */
  visualLite: boolean;
}

export const QUALITY_PRESETS: Record<Exclude<QualityPresetId, 'auto'>, QualityPreset> = {
  low: {
    id: 'low',
    label: 'Low',
    labelRu: 'Низкое',
    dpr: [0.75, 1],
    shadows: false,
    antialias: false,
    postProcessing: false,
    effectsScale: 0.25,
    lodBias: 0.6,
    textureScale: 0.25,
    maxDrawDistance: 40,
    useInstancing: true,
    useImpostors: true,
    impostorDistance: 18,
    bakedLighting: true,
    compression: 'meshopt',
    npcRenderMode: 'procedural',
    environmentRenderMode: 'procedural',
    visualLite: true,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    labelRu: 'Среднее',
    dpr: [1, 1.25],
    shadows: false,
    antialias: true,
    postProcessing: true,
    effectsScale: 0.5,
    lodBias: 0.85,
    textureScale: 0.5,
    maxDrawDistance: 60,
    useInstancing: true,
    useImpostors: true,
    impostorDistance: 28,
    bakedLighting: true,
    compression: 'draco',
    npcRenderMode: 'hybrid',
    environmentRenderMode: 'hybrid',
    visualLite: true,
  },
  high: {
    id: 'high',
    label: 'High',
    labelRu: 'Высокое',
    dpr: [1, 1.75],
    shadows: true,
    antialias: true,
    postProcessing: true,
    effectsScale: 0.85,
    lodBias: 1,
    textureScale: 1,
    maxDrawDistance: 90,
    useInstancing: true,
    useImpostors: false,
    impostorDistance: 45,
    bakedLighting: true,
    compression: 'draco',
    npcRenderMode: 'hybrid',
    environmentRenderMode: 'hybrid',
    visualLite: false,
  },
  ultra: {
    id: 'ultra',
    label: 'Ultra',
    labelRu: 'Ультра',
    dpr: [1.25, 2],
    shadows: true,
    antialias: true,
    postProcessing: true,
    effectsScale: 1,
    lodBias: 1.25,
    textureScale: 1,
    maxDrawDistance: 120,
    useInstancing: true,
    useImpostors: false,
    impostorDistance: 60,
    bakedLighting: true,
    compression: 'meshopt',
    npcRenderMode: 'glb',
    environmentRenderMode: 'glb',
    visualLite: false,
  },
};

export const QUALITY_PRESET_ORDER: Exclude<QualityPresetId, 'auto'>[] = [
  'low',
  'medium',
  'high',
  'ultra',
];

export const GRAPHICS_SETTINGS_KEY = 'volodka_quality_preset';

/** Resolve `auto` from viewport + DPR heuristics. */
export function detectAutoQualityPreset(
  viewportWidth: number,
  devicePixelRatio: number,
): Exclude<QualityPresetId, 'auto'> {
  if (viewportWidth < 768 || devicePixelRatio < 1.25) return 'low';
  if (viewportWidth < 1024 || devicePixelRatio < 1.5) return 'medium';
  if (viewportWidth < 1440) return 'high';
  return 'ultra';
}

export function resolveQualityPreset(
  selected: QualityPresetId,
  viewportWidth: number,
  devicePixelRatio: number,
): QualityPreset {
  const id =
    selected === 'auto'
      ? detectAutoQualityPreset(viewportWidth, devicePixelRatio)
      : selected;
  return QUALITY_PRESETS[id];
}
