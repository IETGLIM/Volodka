/**
 * Compatibility shim — discovery APIs live on the unified poemReveal orchestrator.
 * Prefer importing from `@/engine/poemReveal/poemRevealOrchestrator`.
 */

export {
  resetPoemDiscoveryRevealSession,
  getPendingPoemDiscoveryId,
  hasSeenPoemDiscoveryThisSession,
  isPoemDiscoveryRevealUiActive,
  isPoemDiscoveryRevealBusy,
  setPoemDiscoveryRevealUiActive,
  requestPoemDiscoveryReveal,
  completePoemDiscoveryReveal,
  cancelPoemDiscoveryReveal,
  bindPoemDiscoveryRevealLifecycleListeners,
  unbindPoemDiscoveryRevealLifecycleListeners,
  // Unified aliases
  isPoemRevealBusy,
  requestPoemReveal,
  completePoemReveal,
  cancelPoemReveal,
  resetPoemRevealSession,
  bindPoemRevealLifecycleListeners,
  unbindPoemRevealLifecycleListeners,
} from '@/engine/poemReveal/poemRevealOrchestrator';
