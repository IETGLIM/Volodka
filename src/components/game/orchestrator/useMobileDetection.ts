import { useEffect, useState } from 'react';

/** Touch + viewport heuristics for mobile HUD controls. */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const narrowPortrait = window.innerWidth < 768;
      const narrowLandscape = window.innerWidth < 1024 && window.innerHeight < 768;

      // Primary: phone / small tablet in portrait with touch.
      if (hasTouch && narrowPortrait) return true;
      // Compact landscape handheld (phones).
      if (hasTouch && narrowLandscape) return true;
      // Coarse pointer only when the viewport is clearly handheld-sized.
      if (hasCoarsePointer && hasTouch && Math.min(window.innerWidth, window.innerHeight) < 600) {
        return true;
      }
      return false;
    };

    queueMicrotask(() => setIsMobile(checkMobile()));
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    const mql = window.matchMedia('(orientation: landscape)');
    mql.addEventListener('change', handleResize);
    const pql = window.matchMedia('(pointer: coarse)');
    pql.addEventListener('change', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mql.removeEventListener('change', handleResize);
      pql.removeEventListener('change', handleResize);
    };
  }, []);

  return isMobile;
}
