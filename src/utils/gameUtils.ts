// ============================================
// GAME UTILITIES FOR VERCEL DEPLOYMENT
// ============================================

/**
 * Safe localStorage wrapper with error handling for SSR and restricted environments
 */
export const safeStorage = {
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      console.warn('Failed to save to localStorage');
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Safe session storage wrapper
 */
export const safeSessionStorage = {
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__session_test__';
      window.sessionStorage.setItem(testKey, testKey);
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  getItem: (key: string): string | null => {
    if (!safeSessionStorage.isAvailable()) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!safeSessionStorage.isAvailable()) return false;
    try {
      window.sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Suppress ResizeObserver errors (common in React apps)
 */
export function suppressResizeObserverErrors(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const errorHandler = (e: ErrorEvent) => {
    if (e.message.includes('ResizeObserver')) {
      e.stopImmediatePropagation();
      return false;
    }
    return true;
  };

  window.addEventListener('error', errorHandler);
  
  // Also handle unhandled promise rejections that might be related
  const rejectionHandler = (e: PromiseRejectionEvent) => {
    if (e.reason?.message?.includes('ResizeObserver')) {
      e.preventDefault();
      return false;
    }
    return true;
  };

  window.addEventListener('unhandledrejection', rejectionHandler);

  return () => {
    window.removeEventListener('error', errorHandler);
    window.removeEventListener('unhandledrejection', rejectionHandler);
  };
}

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (!isBrowser) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (!isBrowser) return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get device pixel ratio (for high-DPI canvas)
 */
export function getDevicePixelRatio(): number {
  if (!isBrowser) return 1;
  return Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Request Animation Frame with proper cleanup and delta time
 */
export function createAnimationFrameLoop(
  callback: (deltaTime: number, timestamp: number) => void
): { start: () => void; stop: () => void } {
  let animationFrameId: number | null = null;
  let lastTimestamp = 0;
  let isRunning = false;

  const loop = (timestamp: number) => {
    if (!isRunning) return;

    const deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
    lastTimestamp = timestamp;

    // Cap delta time to prevent huge jumps (e.g., when tab was hidden)
    const cappedDelta = Math.min(deltaTime, 0.1);
    
    callback(cappedDelta, timestamp);
    
    animationFrameId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      lastTimestamp = 0;
      animationFrameId = requestAnimationFrame(loop);
    },
    stop: () => {
      isRunning = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    },
  };
}

/**
 * Create a resize observer with error handling
 */
export function createSafeResizeObserver(
  callback: ResizeObserverCallback
): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') return null;

  try {
    return new ResizeObserver((entries, observer) => {
      // Wrap callback in try-catch to prevent errors from propagating
      try {
        callback(entries, observer);
      } catch (error) {
        console.warn('ResizeObserver callback error:', error);
      }
    });
  } catch (error) {
    console.warn('Failed to create ResizeObserver:', error);
    return null;
  }
}

/**
 * Visibility change handler for pausing/resuming game
 */
export function createVisibilityHandler(
  onVisible: () => void,
  onHidden: () => void
): { mount: () => void; unmount: () => void } {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      onHidden();
    } else {
      onVisible();
    }
  };

  return {
    mount: () => {
      if (isBrowser) {
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }
    },
    unmount: () => {
      if (isBrowser) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    },
  };
}

/**
 * Mobile viewport height fix (for mobile browsers with dynamic toolbars)
 */
export function fixMobileViewportHeight(): () => void {
  if (!isBrowser) return () => {};

  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVH();
  window.addEventListener('resize', setVH);
  
  return () => {
    window.removeEventListener('resize', setVH);
  };
}

/**
 * Prefers reduced motion check
 */
export function prefersReducedMotion(): boolean {
  if (!isBrowser) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
