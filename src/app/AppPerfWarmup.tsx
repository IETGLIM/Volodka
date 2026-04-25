'use client';

import { useEffect } from 'react';
import { ensureGltfDracoDecoderPathConfigured } from '@/lib/explorationGltfDecoders';
import { preloadExplorationPlayerGltf, preloadGltf } from '@/lib/model-cache';
import { warmupRapierWasm } from '@/lib/rapierWasmWarmup';

const PERF_MARK_START = 'volodka-app-perf-warmup-start';
const PERF_MARK_END = 'volodka-app-perf-warmup-end';
const PERF_MEASURE = 'volodka-app-perf-warmup';

/**
 * Частые GLB NPC (см. `npcDefinitions`): прогрев в фоне снижает подвисание при первом `useGLTF` в обходе.
 * Пути legacy `/models/…` переписываются в `preloadGltf` через `rewriteLegacyModelPath`.
 */
const CRITICAL_NPC_GLTF_PATHS = [
  '/models/lowpoly_anime_character_cyberstyle.glb',
  '/models/cyberpunk_female_full-body_character.glb',
  '/models/on_a_quest.glb',
];

function scheduleIdleWork(fn: () => void) {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => fn(), { timeout: 4500 });
  } else {
    setTimeout(fn, 0);
  }
}

/**
 * LCP: фоновый прогрев до первого 3D-кадра (Rapier WASM + GLB игрока + частые NPC).
 * Единый планировщик приоритетов (HDRI, SFX, UI-текстуры) — отдельная задача; здесь только триггер старта.
 */
export function AppPerfWarmup() {
  useEffect(() => {
    const run = async () => {
      const perf = typeof performance !== 'undefined' ? performance : null;
      perf?.mark?.(PERF_MARK_START);

      ensureGltfDracoDecoderPathConfigured();

      try {
        await warmupRapierWasm();
      } catch (error) {
        console.error('[AppPerfWarmup] Rapier warmup failed:', error);
      }

      try {
        await preloadExplorationPlayerGltf();
      } catch (error) {
        console.error('[AppPerfWarmup] Player GLTF preload failed:', error);
      }

      scheduleIdleWork(() => {
        for (const npcPath of CRITICAL_NPC_GLTF_PATHS) {
          void preloadGltf(npcPath);
        }
      });

      perf?.mark?.(PERF_MARK_END);
      try {
        perf?.measure?.(PERF_MEASURE, PERF_MARK_START, PERF_MARK_END);
      } catch {
        /* повторный measure при Strict Mode / HMR */
      }
    };

    void run();
  }, []);

  return null;
}
