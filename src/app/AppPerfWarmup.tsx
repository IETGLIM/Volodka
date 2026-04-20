'use client';

import { useEffect } from 'react';
import { preloadExplorationPlayerGltf } from '@/lib/model-cache';
import { warmupRapierWasm } from '@/lib/rapierWasmWarmup';

/**
 * LCP: фоновый прогрев тяжёлых модулей до первого 3D-кадра (Rapier WASM + GLB игрока).
 */
export function AppPerfWarmup() {
  useEffect(() => {
    void warmupRapierWasm();
    preloadExplorationPlayerGltf();
  }, []);
  return null;
}
