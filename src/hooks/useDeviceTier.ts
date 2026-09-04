import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export type DeviceTier = 'low' | 'medium' | 'high';

function detectDeviceTier(prefersReducedMotion: boolean): DeviceTier {
  if (prefersReducedMotion || typeof window === 'undefined') {
    return 'low';
  }

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const memoryGb = nav.deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const saveData = nav.connection?.saveData === true;

  if (saveData || memoryGb <= 2 || (memoryGb <= 4 && cores <= 4) || coarsePointer) {
    return 'low';
  }

  if (memoryGb >= 8 && cores >= 8) {
    return 'high';
  }

  return 'medium';
}

/** Coarse GPU/CPU tier for toggling cinematic post-processing. */
export function useDeviceTier(): DeviceTier {
  const prefersReducedMotion = useReducedMotion();
  // FIX (perf): раньше первый рендер всегда был 'medium', и мобильные
  // (coarsePointer → 'low') успевали начать загрузку 2k-HDRI (6.66 МБ),
  // пока useEffect не выставлял реальный тир. detectDeviceTier синхронен
  // (matchMedia/deviceMemory) — вычисляем корректный тир сразу в useState.
  const [tier, setTier] = useState<DeviceTier>(() =>
    typeof window === 'undefined' ? 'medium' : detectDeviceTier(false),
  );

  useEffect(() => {
    setTier(detectDeviceTier(!!prefersReducedMotion));
  }, [prefersReducedMotion]);

  return tier;
}

export function shouldUseHeavyIntroFx(tier: DeviceTier): {
  matrixRain: boolean;
  filmGrain: boolean;
  vignette: boolean;
  cinematicBars: boolean;
} {
  switch (tier) {
    case 'low':
      return { matrixRain: false, filmGrain: false, vignette: false, cinematicBars: true };
    case 'medium':
      return { matrixRain: true, filmGrain: false, vignette: true, cinematicBars: true };
    case 'high':
      return { matrixRain: true, filmGrain: true, vignette: true, cinematicBars: true };
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
