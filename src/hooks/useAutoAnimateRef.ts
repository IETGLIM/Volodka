import { useEffect, useRef } from 'react';
import autoAnimate from '@formkit/auto-animate';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/** Parent ref for list/grid insert animations; disabled when reduced motion is on. */
export function useAutoAnimateRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    if (!ref.current || reducedMotion) return;
    const controller = autoAnimate(ref.current, { duration: 280, easing: 'ease-out' });
    return () => {
      controller.disable();
    };
  }, [reducedMotion]);

  return ref;
}
