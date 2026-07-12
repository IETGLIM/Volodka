import { useLayoutEffect, useState, type RefObject } from 'react';
import {
  computeTooltipCoords,
  getDefaultTooltipSize,
  type TooltipCoords,
  type TooltipPlacement,
} from '@/engine/inventory/inventoryTooltipPresentation';

export function useInventoryTooltipPosition(
  anchorRef: RefObject<HTMLElement | null>,
  tooltipRef: RefObject<HTMLElement | null>,
  visible: boolean,
  preferred: TooltipPlacement = 'above',
): TooltipCoords {
  const [coords, setCoords] = useState<TooltipCoords>(() => ({
    top: 0,
    left: 0,
    placement: preferred,
  }));

  useLayoutEffect(() => {
    if (!visible) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const measured = tooltipRef.current?.getBoundingClientRect();
      const fallback = getDefaultTooltipSize();

      setCoords(
        computeTooltipCoords(
          anchorRect,
          measured?.width ?? fallback.width,
          measured?.height ?? fallback.height,
          preferred,
        ),
      );
    };

    update();
    const rafId = requestAnimationFrame(update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, tooltipRef, visible, preferred]);

  return coords;
}
