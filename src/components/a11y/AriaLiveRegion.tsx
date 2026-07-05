import { useEffect, useRef } from 'react';

type AriaLivePriority = 'polite' | 'assertive';

interface AriaLiveRegionProps {
  message: string;
  priority?: AriaLivePriority;
  /** Re-announce when the same message is sent again */
  clearOnEmpty?: boolean;
}

/**
 * Visually hidden live region for screen reader announcements.
 */
export function AriaLiveRegion({
  message,
  priority = 'polite',
  clearOnEmpty = true,
}: AriaLiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = regionRef.current;
    if (!node) return;
    if (clearOnEmpty && !message) {
      node.textContent = '';
    }
  }, [message, clearOnEmpty]);

  return (
    <div
      ref={regionRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
