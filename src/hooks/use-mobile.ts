
/* ─── Volodka RPG – Unified mobile detection hooks ─── */
/* Single source for all mobile/viewport detection.
 * - useIsMobile(): shadcn/ui standard (768px breakpoint)
 * - useIsMobileVisual(): R3F/3D viewport check (1024px breakpoint)
 * - useMobileVisualPerf(): visual performance profile
 *
 * Previously split across use-mobile.ts and use-mobile-visual.ts,
 * consolidated to prevent bugs from divergent implementations. */

import { useEffect, useState, useCallback } from 'react';

/* ─── Constants ─── */

/** shadcn/ui standard mobile breakpoint */
const MOBILE_BREAKPOINT = 768;

/** R3F/3D visual complexity breakpoint */
const VISUAL_MOBILE_BREAKPOINT = 1024;

/* ─── Core hook: useIsMobile (768px, shadcn standard) ─── */

export function useIsMobile(): boolean {
  // FIX: Always initialize with false (SSR-safe).
  // Reading window.innerWidth in useState initializer causes React #418
  // hydration mismatch because server renders with false but client may
  // compute true. The useEffect below sets the correct value immediately.
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Set correct value on mount (client-only)
    // Schedule via microtask to avoid "setState in effect" warning from React Compiler
    queueMicrotask(() => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT));

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

/* ─── Visual hook: useIsMobileVisual (1024px, for R3F) ─── */

export function useIsMobileVisual(): boolean {
  // FIX: Always initialize with false (SSR-safe).
  // Same hydration fix as useIsMobile — never read window in useState initializer.
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < VISUAL_MOBILE_BREAKPOINT);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

/* ─── Visual performance profile ─── */

export interface MobileVisualPerf {
  /** Reduce visual complexity (shadows, particles, post-FX) */
  visualLite: boolean;
  /** Narrow viewport — use compact UI */
  narrow: boolean;
}

/** Returns visual performance profile based on screen size and DPR */
export function useMobileVisualPerf(): MobileVisualPerf {
  // FIX: Always initialize with defaults (SSR-safe).
  // Never read window.innerWidth or devicePixelRatio in useState initializer.
  const [perf, setPerf] = useState<MobileVisualPerf>({ visualLite: false, narrow: false });

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const dpr = window.devicePixelRatio ?? 1;
      setPerf({
        visualLite: w < MOBILE_BREAKPOINT || dpr < 1.5,
        narrow: w < 640,
      });
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return perf;
}
