import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  ACCESSIBILITY_SETTINGS_CHANGED,
  getAccessibilitySettings,
} from '@/engine/accessibility/accessibilitySettings';

/** OS reduced-motion preference plus in-game accessibility override. */
export function useEffectiveReducedMotion(): boolean {
  const framerReduced = useReducedMotion();
  const [settingsReduced, setSettingsReduced] = useState(
    () => getAccessibilitySettings().reducedMotionOverride,
  );

  useEffect(() => {
    const sync = () => setSettingsReduced(getAccessibilitySettings().reducedMotionOverride);
    window.addEventListener(ACCESSIBILITY_SETTINGS_CHANGED, sync);
    return () => window.removeEventListener(ACCESSIBILITY_SETTINGS_CHANGED, sync);
  }, []);

  return Boolean(framerReduced || settingsReduced);
}
