import { useMemo } from 'react';
import { getLoadingScreenFx } from '@/engine/loading/loadingFxTier';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Device tier + accessibility prefs for loading screen visual effects. */
export function useLoadingScreenFx() {
  const reduceMotion = useEffectiveReducedMotion();
  const tier = useDeviceTier();
  const { loadingFxDisabled } = useAccessibilitySettings();

  return useMemo(
    () => getLoadingScreenFx(tier, reduceMotion, loadingFxDisabled),
    [tier, reduceMotion, loadingFxDisabled],
  );
}
