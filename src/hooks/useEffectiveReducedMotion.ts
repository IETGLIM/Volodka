import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { getAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';

/** OS reduced-motion preference plus in-game accessibility override. */
export function useEffectiveReducedMotion(): boolean {
  const framerReduced = useReducedMotion();
  const [settingsReduced, setSettingsReduced] = useState(
    () => getAccessibilitySettings().reducedMotionOverride,
  );

  useEffect(() => {
    return eventBus.on('accessibility:changed', ({ changedKey, settings }) => {
      if (changedKey === 'all' || changedKey === 'reducedMotionOverride') {
        setSettingsReduced(settings.reducedMotionOverride);
      }
    });
  }, []);

  return Boolean(framerReduced || settingsReduced);
}
