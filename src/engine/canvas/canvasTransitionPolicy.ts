import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';

/** Modes where the WebGL canvas is composited (visible or warming hidden). */
export const CANVAS_COMPOSITE_MODES = new Set([
  'exploration',
  'cutscene',
  'combat',
  'intro',
]);

/** Modes where gameplay expects an interactive 3D view. */
export const CANVAS_GAMEPLAY_MODES = new Set(['exploration', 'cutscene', 'combat']);

/** True when entering `next` requires a fresh canvas:first-frame (visibility changed). */
export function modeSwitchNeedsFreshCanvasFrame(prevMode: string, nextMode: string): boolean {
  const wasComposite = CANVAS_COMPOSITE_MODES.has(prevMode);
  const isComposite = CANVAS_COMPOSITE_MODES.has(nextMode);
  if (!isComposite) return false;
  if (!wasComposite) return true;
  if (prevMode === 'intro' && nextMode === 'exploration') return true;
  return false;
}

/** True when mode switch should show the black canvas transition overlay. */
export function modeSwitchShowsCanvasOverlay(prevMode: string, nextMode: string): boolean {
  if (!CANVAS_GAMEPLAY_MODES.has(nextMode)) return false;
  if (modeSwitchNeedsFreshCanvasFrame(prevMode, nextMode)) return true;
  return CANVAS_GAMEPLAY_MODES.has(prevMode) && prevMode !== nextMode;
}

export function canvasFadeOutMs(warmPath: boolean): number {
  return warmPath ? CUTSCENE_TIMINGS.CANVAS_FADE_OUT_WARM_MS : CUTSCENE_TIMINGS.CANVAS_FADE_OUT_MS;
}
