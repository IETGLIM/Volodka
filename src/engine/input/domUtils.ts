/**
 * Returns true when the event target is the canvas element itself or falls
 * outside any exploration UI overlay / panel / dialog / interactive form
 * control. Used by both camera orbit input and interaction proximity to decide
 * whether a click or pointer event should be treated as a "canvas-area" action.
 */
export function isCanvasAreaTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement;
  if (!(el instanceof Element)) return false;
  if (el.tagName === 'CANVAS') return true;
  return !el.closest(
    '[data-exploration-ui], [data-panel], dialog, [role="dialog"], button, a, input, textarea',
  );
}