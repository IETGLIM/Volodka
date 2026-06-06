import { useEffect, useState } from 'react';

/** Touch + viewport heuristics for mobile HUD controls. */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isTouchDevice = hasTouch || hasCoarsePointer;
      const narrowPortrait = window.innerWidth < 768;
      const tabletPortrait = window.innerWidth < 1024;
      if (isTouchDevice && narrowPortrait) return true;
      if (isTouchDevice && window.innerHeight < 768) return true;
      if (tabletPortrait && !isTouchDevice) return true;
      if (isTouchDevice && tabletPortrait) return true;
      if (isTouchDevice && window.innerHeight < 500) return true;
      if (isTouchDevice && Math.min(window.screen.width, window.screen.height) < 1200) return true;
      if (hasCoarsePointer && window.innerWidth < 1400) return true;
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
