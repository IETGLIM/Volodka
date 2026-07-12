import { useCallback, useEffect, useRef } from 'react';

/** Tracks setTimeout ids with mount/generation guards to prevent leaks and stale setState. */
export function useSafeTimeouts() {
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);
  const generationRef = useRef(0);

  const clearTimeouts = useCallback(() => {
    generationRef.current += 1;
    timeoutRefs.current.forEach((id) => clearTimeout(id));
    timeoutRefs.current = [];
  }, []);

  const setSafeTimeout = useCallback((callback: () => void, delay: number) => {
    const expectedGeneration = generationRef.current;
    const id = setTimeout(() => {
      if (!mountedRef.current || expectedGeneration !== generationRef.current) return;
      callback();
    }, delay);
    timeoutRefs.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return { setSafeTimeout, clearTimeouts };
}
