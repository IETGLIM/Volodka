'use client';

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
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
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
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < VISUAL_MOBILE_BREAKPOINT;
  });

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
  const [perf, setPerf] = useState<MobileVisualPerf>(() => {
    if (typeof window === 'undefined') return { visualLite: false, narrow: false };
    const w = window.innerWidth;
    const dpr = window.devicePixelRatio ?? 1;
    return {
      visualLite: w < MOBILE_BREAKPOINT || dpr < 1.5,
      narrow: w < 640,
    };
  });

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
