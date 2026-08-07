/** Modes where the WebGL canvas is composited (visible or warming hidden). */
export const CANVAS_COMPOSITE_MODES = new Set([
  'exploration',
  'cutscene',
  'combat',
]);

/** Modes where gameplay expects an interactive 3D view. */
export const CANVAS_GAMEPLAY_MODES = new Set(['exploration', 'cutscene', 'combat']);
