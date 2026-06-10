/**
 * Browser ML bridge — transformers.js opt-in.
 * See docs/AI_CANON_POLICY.md. Must not import dialogue or poem modules.
 */

import { createMlEmbeddingEngine } from '@/engine/ml/mlEngineLoader';
import type { MlEmbeddingEngine } from '@/engine/ml/mlEmbeddingIndex';

const AI_FEATURES_STORAGE_KEY = 'volodka_ai_features';

let enginePromise: Promise<MlEmbeddingEngine | null> | null = null;

function isMlSkipped(): boolean {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
  return env?.VITE_ML_SKIP === '1' || env?.MODE === 'test';
}

/** Whether the user opted in to experimental AI features (default OFF). */
export function isAiFeaturesEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(AI_FEATURES_STORAGE_KEY) === '1';
}

export function setAiFeaturesEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AI_FEATURES_STORAGE_KEY, enabled ? '1' : '0');
  if (!enabled) {
    enginePromise = null;
  }
}

/** True when ML runtime is unavailable (CI skip or build flag). */
export function isMlEngineStub(): boolean {
  return isMlSkipped();
}

/**
 * Lazy-load ML runtime when opt-in is enabled.
 * Returns null when disabled or skipped; resolves engine when available.
 */
export async function loadMlEngine(): Promise<MlEmbeddingEngine | null> {
  if (!isAiFeaturesEnabled() || isMlSkipped()) return null;

  if (!enginePromise) {
    enginePromise = createMlEmbeddingEngine()
      .then((engine) => engine)
      .catch((err) => {
        console.warn('[Volodka ML] Engine load failed:', err);
        enginePromise = null;
        return null;
      });
  }

  return enginePromise;
}
