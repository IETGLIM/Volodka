/**
 * Browser ML bridge — transformers.js opt-in stub.
 * See docs/AI_CANON_POLICY.md. Must not import dialogue or poem modules.
 */

const AI_FEATURES_STORAGE_KEY = 'volodka_ai_features';

const NOT_IMPLEMENTED = 'ML engine not implemented';

/** Whether the user opted in to experimental AI features (default OFF). */
export function isAiFeaturesEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(AI_FEATURES_STORAGE_KEY) === '1';
}

export function setAiFeaturesEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AI_FEATURES_STORAGE_KEY, enabled ? '1' : '0');
}

/** True when the bridge is wired but models are not shipped yet. */
export function isMlEngineStub(): boolean {
  return true;
}

/**
 * Lazy-load ML runtime when opt-in is enabled.
 * Returns null when disabled; throws when enabled but not yet implemented.
 */
export async function loadMlEngine(): Promise<unknown | null> {
  if (!isAiFeaturesEnabled()) return null;

  // Phase C: dynamic import('@huggingface/transformers') in a dedicated lazy chunk.
  throw new Error(NOT_IMPLEMENTED);
}
