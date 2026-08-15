/** Visual quality tiers — drives DPR, LOD, compression variant, and procedural/GLB mix. */

import { getSessionAutoResolvedTier } from './autoQualitySession';
import {
  computePhysicalPixelCount,
  getCachedWebGlGpuProbe,
  isWeakMobileGpuRenderer,
  type WebGlGpuProbe,
} from './gpuQualityProbe';

export type QualityPresetId = 'auto' | 'low' | 'medium' | 'high' | 'ultra';

type ConcreteQualityPresetId = Exclude<QualityPresetId, 'auto'>;

interface NavigatorBatteryManager {
  charging: boolean;
  level: number;
  addEventListener(type: 'levelchange' | 'chargingchange', listener: () => void): void;
}

/** Runtime pressure from GPU memory / perf monitors — degrades post-FX gracefully. */
export type GfxPressureLevel = 'none' | 'memory' | 'critical';

function hasCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

export type AssetRenderMode = 'procedural' | 'hybrid' | 'glb';
export type CompressionPreference = 'none' | 'draco' | 'meshopt';

export interface QualityPreset {
  id: Exclude<QualityPresetId, 'auto'>;
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
  compression: CompressionPreference;
  /** NPC: procedural silhouettes until unique RPM/AI3DGen mesh on disk. */
  npcRenderMode: AssetRenderMode;
  environmentRenderMode: AssetRenderMode;
  /** Alias for legacy visualLite checks */
  visualLite: boolean;
}

export const QUALITY_PRESETS: Record<Exclude<QualityPresetId, 'auto'>, QualityPreset> = {
  low: {
    id: 'low',
    labelRu: 'Низкое',
    dpr: [0.75, 1],
    shadows: false,
    antialias: false,
    postProcessing: false,
    effectsScale: 0.25,
    lodBias: 0.6,
    textureScale: 0.25,
    maxDrawDistance: 40,
    compression: 'draco',
    npcRenderMode: 'procedural',
    environmentRenderMode: 'procedural',
    visualLite: true,
  },
  medium: {
    id: 'medium',
    labelRu: 'Среднее',
    dpr: [1, 1.35],
    shadows: true,
    antialias: true,
    postProcessing: true,
    effectsScale: 0.62,
    lodBias: 0.9,
    textureScale: 0.5,
    maxDrawDistance: 65,
    compression: 'draco',
    npcRenderMode: 'hybrid',
    environmentRenderMode: 'hybrid',
    visualLite: true,
  },
  high: {
    id: 'high',
    labelRu: 'Высокое',
    // Locked mid-laptop 60fps envelope: keep atmosphere, cap pixel fill.
    dpr: [1, 1.5],
    shadows: true,
    antialias: true,
    postProcessing: true,
    effectsScale: 0.78,
    lodBias: 1,
    textureScale: 1,
    maxDrawDistance: 78,
    compression: 'draco',
    npcRenderMode: 'hybrid',
    environmentRenderMode: 'hybrid',
    visualLite: false,
  },
  ultra: {
    id: 'ultra',
    labelRu: 'Ультра',
    dpr: [1.25, 2],
    shadows: true,
    antialias: true,
    postProcessing: true,
    effectsScale: 1,
    lodBias: 1.25,
    textureScale: 1,
    maxDrawDistance: 120,
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

/** High-DPR phones (e.g. iPhone @3x) — cap auto tier to avoid WebGL OOM. */
const HIGH_DPR_MOBILE_THRESHOLD = 2.75;

/** Physical pixel budget thresholds (CSS viewport × DPR²).
 *  Ordered: above MEDIUM_MAX → cap to medium; above HIGH_MAX → cap to high;
 *  above ULTRA_MAX → cap ultra to high. */
const PIXEL_BUDGET_MEDIUM_MAX = 20_000_000;
const PIXEL_BUDGET_HIGH_MAX = 12_000_000;
const PIXEL_BUDGET_ULTRA_MAX = 8_000_000;

function readDeviceMemoryGb(): number | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
}

function readViewportHeight(fallbackWidth: number): number {
  if (typeof window !== 'undefined' && window.innerHeight > 0) {
    return window.innerHeight;
  }
  return Math.round(fallbackWidth * 9 / 16);
}

/** Downgrade auto tier on framebuffer pixel budget. */
export function capQualityTierForPixelBudget(
  tier: Exclude<QualityPresetId, 'auto'>,
  physicalPixelCount: number,
): Exclude<QualityPresetId, 'auto'> {
  let capped = tier;

  if (physicalPixelCount > PIXEL_BUDGET_MEDIUM_MAX) {
    if (capped === 'ultra') capped = 'high';
    if (capped === 'high') capped = 'medium';
  } else if (physicalPixelCount > PIXEL_BUDGET_ULTRA_MAX && capped === 'ultra') {
    capped = 'high';
  } else if (physicalPixelCount > PIXEL_BUDGET_HIGH_MAX && capped === 'high') {
    capped = 'medium';
  }

  return capped;
}

/** Downgrade auto tier on memory-constrained / high-DPR mobile GPUs. */
export function capQualityTierForGpuMemory(
  tier: Exclude<QualityPresetId, 'auto'>,
  devicePixelRatio: number,
  deviceMemoryGb: number | undefined = readDeviceMemoryGb(),
  gpuProbe: WebGlGpuProbe = getCachedWebGlGpuProbe(),
): Exclude<QualityPresetId, 'auto'> {
  let capped = tier;

  if (gpuProbe.isSoftwareRenderer) return 'low';

  if (devicePixelRatio >= HIGH_DPR_MOBILE_THRESHOLD) {
    if (capped === 'ultra') capped = 'high';
    if (devicePixelRatio >= 3 && capped === 'high') capped = 'medium';
  }

  if (deviceMemoryGb !== undefined) {
    if (deviceMemoryGb <= 2) return 'low';
    if (deviceMemoryGb <= 4) {
      if (capped === 'ultra') capped = 'high';
      if (capped === 'high' && devicePixelRatio >= 2) capped = 'medium';
    }
  }

  if (gpuProbe.maxTextureSize !== undefined) {
    if (gpuProbe.maxTextureSize < 4096) capped = 'low';
    else if (gpuProbe.maxTextureSize < 8192 && capped === 'ultra') capped = 'high';
  }

  if (isWeakMobileGpuRenderer(gpuProbe.renderer)) {
    if (capped === 'ultra') capped = 'high';
    if (capped === 'high' && devicePixelRatio >= 2) capped = 'medium';
  }

  // Touch / tablet form-factors: auto rarely benefits from ultra or high@3x.
  if (hasCoarsePointer()) {
    if (capped === 'ultra') capped = 'high';
    if (capped === 'high' && devicePixelRatio >= 2) capped = 'medium';
  }

  return capped;
}

let cachedBatteryCap: ConcreteQualityPresetId | null = null;
let batteryListenerAttached = false;

function computeBatteryQualityCap(battery: NavigatorBatteryManager): ConcreteQualityPresetId | null {
  if (battery.charging) return null;
  if (battery.level <= 0.15) return 'low';
  if (battery.level <= 0.3) return 'medium';
  return null;
}

function clampTierToCap(
  tier: ConcreteQualityPresetId,
  cap: ConcreteQualityPresetId | null,
): ConcreteQualityPresetId {
  if (!cap) return tier;
  const tierIdx = QUALITY_PRESET_ORDER.indexOf(tier);
  const capIdx = QUALITY_PRESET_ORDER.indexOf(cap);
  return QUALITY_PRESET_ORDER[Math.min(tierIdx, capIdx)];
}

/** Cached battery cap for sync auto-quality (null when charging or API unavailable). */
export function getBatteryQualityCap(): ConcreteQualityPresetId | null {
  return cachedBatteryCap;
}

/** Attach Battery API listeners once — graceful no-op when unsupported. */
export function initBatteryQualityCapListener(): void {
  if (batteryListenerAttached || typeof navigator === 'undefined') return;
  batteryListenerAttached = true;

  const nav = navigator as Navigator & { getBattery?: () => Promise<NavigatorBatteryManager> };
  if (!nav.getBattery) return;

  void nav.getBattery()
    .then((battery) => {
      const sync = (): void => {
        cachedBatteryCap = computeBatteryQualityCap(battery);
      };
      sync();
      battery.addEventListener('levelchange', sync);
      battery.addEventListener('chargingchange', sync);
    })
    .catch(() => {
      cachedBatteryCap = null;
    });
}

/** Test harness — reset battery cap state between cases. */
export function resetBatteryQualityCapForTests(): void {
  cachedBatteryCap = null;
  batteryListenerAttached = false;
}

/** Test harness — inject battery cap without Battery API. */
export function setBatteryQualityCapForTests(cap: ConcreteQualityPresetId | null): void {
  cachedBatteryCap = cap;
  batteryListenerAttached = true;
}

/** Resolve `auto` from viewport + DPR + pixel budget + GPU memory + battery heuristics. */
export function detectAutoQualityPreset(
  viewportWidth: number,
  devicePixelRatio: number,
  viewportHeight: number = readViewportHeight(viewportWidth),
): Exclude<QualityPresetId, 'auto'> {
  initBatteryQualityCapListener();

  let tier: Exclude<QualityPresetId, 'auto'>;
  // Conservative auto-tier: 'high' is the sweet spot for most desktops.
  // 'ultra' (GodRays, HUGE bloom, DoF) only for very large screens (≥2560px)
  // to avoid frame drops on mid-range GPUs at 1080p/1440p.
  const isMobileViewport = viewportWidth < 768;
  if (isMobileViewport) tier = 'low';
  else if (viewportWidth < 1024) tier = 'medium';
  else if (viewportWidth < 2560) tier = 'high';
  else tier = 'ultra';

  const physicalPixels = computePhysicalPixelCount(
    viewportWidth,
    viewportHeight,
    devicePixelRatio,
  );
  tier = capQualityTierForPixelBudget(tier, physicalPixels);
  tier = capQualityTierForGpuMemory(tier, devicePixelRatio);
  return clampTierToCap(tier, getBatteryQualityCap());
}

/** Whether post-processing may run for this preset + user toggle. */
export function isPostProcessingEnabled(
  preset: QualityPreset,
  postfxUserEnabled: boolean,
): boolean {
  return preset.postProcessing && postfxUserEnabled;
}

/** Gracefully reduce post-processing under memory/perf pressure instead of failing. */
export function applyGfxPressureToPreset(
  preset: QualityPreset,
  pressure: GfxPressureLevel,
): QualityPreset {
  switch (pressure) {
    case 'none':
      return preset;
    case 'memory':
      // Medium + coarse pointer (phones/tablets): drop PostFX/shadow maps → contact-blob only.
      if (preset.id === 'medium' && hasCoarsePointer()) {
        return {
          ...preset,
          postProcessing: false,
          shadows: false,
          effectsScale: Math.min(preset.effectsScale, 0.4),
        };
      }
      // High/ultra keep PostFX alive — only thin effectsScale so atmosphere survives.
      if (preset.id === 'high' || preset.id === 'ultra') {
        return {
          ...preset,
          postProcessing: true,
          effectsScale: Math.max(0.55, preset.effectsScale * 0.82),
        };
      }
      return preset.postProcessing
        ? { ...preset, effectsScale: preset.effectsScale * 0.75 }
        : preset;
    case 'critical':
      // Desktop High: keep lite PostFX + contact shadows rather than gutting the look.
      if (preset.id === 'high' && !hasCoarsePointer()) {
        return {
          ...preset,
          postProcessing: true,
          shadows: true,
          effectsScale: Math.max(0.45, preset.effectsScale * 0.55),
          antialias: true,
        };
      }
      return {
        ...preset,
        postProcessing: false,
        shadows: false,
        effectsScale: preset.effectsScale * 0.5,
        antialias: preset.id === 'low' ? false : preset.antialias,
      };
    default: {
      const _exhaustive: never = pressure;
      return _exhaustive;
    }
  }
}

export function resolveQualityPreset(
  selected: QualityPresetId,
  viewportWidth: number,
  devicePixelRatio: number,
  autoRuntimeTier: Exclude<QualityPresetId, 'auto'> | null = getSessionAutoResolvedTier(),
  gfxPressure: GfxPressureLevel = 'none',
): QualityPreset {
  const id =
    selected === 'auto'
      ? autoRuntimeTier ?? detectAutoQualityPreset(viewportWidth, devicePixelRatio)
      : selected;
  return applyGfxPressureToPreset(QUALITY_PRESETS[id], gfxPressure);
}

/** Whether shipped GLB dressing / props should render for this render-mode tier. */
export function allowsGlbAssetRendering(mode: AssetRenderMode): boolean {
  switch (mode) {
    case 'procedural':
      return false;
    case 'hybrid':
    case 'glb':
      return true;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

/** Russian detail line under quality preset buttons — i18n-safe, driven by preset tiers. */
export function formatQualityPresetDetailRu(
  selectedPreset: QualityPresetId,
  preset: QualityPreset,
): string {
  const base =
    selectedPreset === 'auto'
      ? `Авто → ${preset.labelRu}: Draco/Meshopt, LOD, KTX2 при high/ultra`
      : `${preset.labelRu}: ${preset.npcRenderMode} NPC · ${preset.environmentRenderMode} окружение · DPR ${preset.dpr[0]}–${preset.dpr[1]}`;

  const hints: string[] = [];
  if (!preset.shadows) {
    hints.push('Только contact-blob у ног');
  } else if (preset.visualLite) {
    hints.push('Карты теней + мягкий blob');
  } else {
    hints.push('Полные карты теней');
  }
  const glbCapable =
    allowsGlbAssetRendering(preset.npcRenderMode)
    || allowsGlbAssetRendering(preset.environmentRenderMode);
  if (glbCapable) {
    hints.push('Уникальные аватары (RPM)');
  }
  // Reflector wet street: medium+; MeshPhysical glass/puddle accents: high/ultra only.
  // Ultra gets the SSR tier (1024-res planar reflector + anisotropic streak blur);
  // high stays on the basic 384-res planar path; medium on 256-res basic.
  // (Mirrors qualityFeatureGates — never advertise heavy features on auto.)
  if (selectedPreset === 'ultra') {
    hints.push('SSR-отражения мокрых улиц (1024)');
    hints.push('MeshPhysical акценты');
  } else if (selectedPreset === 'high') {
    hints.push('Планарные отражения');
    hints.push('MeshPhysical акценты');
  } else if (selectedPreset === 'medium') {
    hints.push('Базовые мокрые отражения');
  } else if (
    selectedPreset === 'auto'
    && (preset.id === 'ultra' || preset.id === 'high' || preset.id === 'medium')
  ) {
    hints.push('Мокрые отражения: выберите пресет «Среднее» или выше');
  }

  return hints.length > 0 ? `${base} · ${hints.join(' · ')}` : base;
}
