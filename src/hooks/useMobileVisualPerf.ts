'use client';

import { useEffect, useState } from 'react';
import { MOBILE_MAX_WIDTH_MEDIA } from '@/hooks/use-mobile';

/**
 * Упрощённый визуальный режим: узкий экран, грубый указатель или `prefers-reduced-motion`.
 * Ширина «узкого» экрана совпадает с `MOBILE_MAX_WIDTH_MEDIA` / `useIsMobile`.
 * Тач-панель (`useTouchGameControls`) не включает reduced-motion на десктопе — только HUD/инпут.
 */
export function useMobileVisualPerf(): boolean {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const widthQuery = MOBILE_MAX_WIDTH_MEDIA;
    const sync = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const narrow = window.matchMedia(widthQuery).matches;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setLite(coarse || narrow || reduce);
    };
    sync();
    const m1 = window.matchMedia('(pointer: coarse)');
    const m2 = window.matchMedia(widthQuery);
    const m3 = window.matchMedia('(prefers-reduced-motion: reduce)');
    m1.addEventListener('change', sync);
    m2.addEventListener('change', sync);
    m3.addEventListener('change', sync);
    return () => {
      m1.removeEventListener('change', sync);
      m2.removeEventListener('change', sync);
      m3.removeEventListener('change', sync);
    };
  }, []);

  return lite;
}
