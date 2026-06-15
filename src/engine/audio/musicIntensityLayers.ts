/**
 * Adaptive music intensity layers — exploration / tension / combat.
 */

export type MusicIntensityLayer = 'exploration' | 'tension' | 'combat';

export interface MusicLayerContext {
  showStoryOverlay?: boolean;
}

let currentLayer: MusicIntensityLayer = 'exploration';
const listeners = new Set<(layer: MusicIntensityLayer) => void>();

export function getMusicIntensityLayer(): MusicIntensityLayer {
  return currentLayer;
}

export function setMusicIntensityLayer(layer: MusicIntensityLayer): void {
  if (currentLayer === layer) return;
  currentLayer = layer;
  for (const fn of listeners) fn(layer);
}

export function subscribeMusicIntensityLayer(
  listener: (layer: MusicIntensityLayer) => void,
): () => void {
  listeners.add(listener);
  listener(currentLayer);
  return () => listeners.delete(listener);
}

/** Map game mode + narrative overlay to intensity layer. */
export function resolveMusicIntensityLayer(
  mode: string,
  context: MusicLayerContext = {},
): MusicIntensityLayer {
  switch (mode) {
    case 'combat':
      return 'combat';
    case 'cutscene':
      return 'tension';
    default:
      if (context.showStoryOverlay) return 'tension';
      return 'exploration';
  }
}

/** @deprecated Prefer resolveMusicIntensityLayer — kept for legacy call sites. */
export function musicLayerForMode(mode: string): MusicIntensityLayer {
  return resolveMusicIntensityLayer(mode);
}
