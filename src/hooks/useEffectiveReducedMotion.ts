import { useReducedMotion } from 'framer-motion';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';

/** OS reduced-motion preference plus in-game accessibility override. React counterpart of isEffectiveReducedMotion(). */
export function useEffectiveReducedMotion(): boolean {
  const framerReduced = useReducedMotion();
  const { reducedMotionOverride } = useAccessibilitySettings();

  return Boolean(framerReduced || reducedMotionOverride);
}
