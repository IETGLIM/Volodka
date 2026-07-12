import { useEffect, useState } from 'react';

const DEFAULT_VIEWPORT_WIDTH = 360;

/** Tracks viewport width; safe during SSR (returns default until mounted). */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : DEFAULT_VIEWPORT_WIDTH,
  );

  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return width;
}
