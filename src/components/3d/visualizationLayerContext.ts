import { createContext, useContext } from 'react';
import type * as THREE from 'three';

export const LAYER = {
  DEFAULT: 0,
  BACKGROUND: 1,
  MIDGROUND: 2,
  FOREGROUND: 3,
  OVERLAY: 4,
} as const;

export type LayerName = keyof typeof LAYER;

export interface LayerContextValue {
  registerObject: (ref: THREE.Object3D, layer: LayerName) => void;
  unregisterObject: (ref: THREE.Object3D) => void;
  getLayerObjects: (layer: LayerName) => THREE.Object3D[];
  setLayerEnabled: (layer: LayerName, enabled: boolean) => void;
  isLayerEnabled: (layer: LayerName) => boolean;
}

export const LayerContext = createContext<LayerContextValue | null>(null);

/** Hook to access the visualization layer system */
export function useVisualizationLayer(): LayerContextValue {
  const ctx = useContext(LayerContext);
  if (!ctx) {
    return {
      registerObject: () => {},
      unregisterObject: () => {},
      getLayerObjects: () => [],
      setLayerEnabled: () => {},
      isLayerEnabled: () => true,
    };
  }
  return ctx;
}
