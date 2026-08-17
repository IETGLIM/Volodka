/**
 * MenuMouseTracker — sets CSS custom properties --mouse-x and --mouse-y
 * (percentage 0–100) on document.documentElement for the menu parallax effect.
 * Only active during the 'menu' game phase. Uses rAF for performance.
 */
'use client';

import { useEffect, useRef } from 'react';
import { useGamePhase } from '@/store/selectors/uiSelectors';
import type { GamePhase } from '@/shared/gamePhase';

export function MenuMouseTracker() {
  const phase = useGamePhase();
  const rafRef = useRef<number>(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (phase !== ('menu' as GamePhase)) {
      // Reset custom props when leaving menu
      document.documentElement.style.removeProperty('--mouse-x');
      document.documentElement.style.removeProperty('--mouse-y');
      return;
    }

    function onPointerMove(e: PointerEvent) {
      const x = Math.round((e.clientX / window.innerWidth) * 100);
      const y = Math.round((e.clientY / window.innerHeight) * 100);
      pendingRef.current = { x, y };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(flush);
      }
    }

    function flush() {
      rafRef.current = 0;
      const p = pendingRef.current;
      if (p) {
        document.documentElement.style.setProperty('--mouse-x', String(p.x));
        document.documentElement.style.setProperty('--mouse-y', String(p.y));
      }
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.documentElement.style.removeProperty('--mouse-x');
      document.documentElement.style.removeProperty('--mouse-y');
    };
  }, [phase]);

  return null;
}
