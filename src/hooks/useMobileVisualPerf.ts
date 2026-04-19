'use client';

import { useEffect, useState } from 'react';

/**
 * Упрощённый визуальный режим: узкий экран, тач или reduced-motion.
 * На мобильных Safari/Chromium постоянные full-screen слои + backdrop-blur
 * часто дают мерцание compositor — тогда выключаем тяжёлые эффекты.
 *
 * В обходе (`RPGGameCanvas`) тот же флаг включает более крупный фикс. шаг Rapier
 * (`rapierExplorationTimestep`) — реже считаются коллайдеры, в ущерб точности.
 */
export function useMobileVisualPerf(): boolean {
  const [lite, setLite] = useState(false);

  useEffect(() => {
    const sync = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const narrow = window.matchMedia('(max-width: 1023px)').matches;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setLite(coarse || narrow || reduce);
    };
    sync();
    const m1 = window.matchMedia('(pointer: coarse)');
    const m2 = window.matchMedia('(max-width: 1023px)');
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
