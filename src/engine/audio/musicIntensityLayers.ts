/**
 * Adaptive music intensity layers — exploration / tension / combat.
 */

export type MusicIntensityLayer = 'exploration' | 'tension' | 'combat';

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

/** Map game mode to default intensity layer. */
export function musicLayerForMode(mode: string): MusicIntensityLayer {
  switch (mode) {
    case 'combat':
      return 'combat';
    case 'cutscene':
      return 'tension';
    default:
      return 'exploration';
  }
}
