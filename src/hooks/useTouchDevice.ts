import { useEffect, useState } from 'react';

/** Whether the runtime environment reports touch input (client-only, SSR-safe default false). */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouchDevice;
}
