import { useEffect, useState } from 'react';

/** Touch detection for mobile HUD controls.
 *  Simplified: any touch device gets mobile controls.
 *  Previous version was too strict — tablets and touch laptops got no controls. */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      // Primary signal: touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // Secondary: coarse pointer (finger, not mouse)
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      // UA hint for phones/tablets
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      // Show mobile controls if: touch device OR coarse pointer OR mobile UA
      return hasTouch || hasCoarsePointer || mobileUA;
    };

    queueMicrotask(() => setIsMobile(checkMobile()));
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isMobile;
}
