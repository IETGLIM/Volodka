import type { NarrativeKind } from '@/shared/types/narrativeKind';
import { eventBus } from '@/engine/EventBus';
import { dispatchStateAction } from '@/engine/StateDispatcher';
import { devWarn } from '@/shared/utils/devLog';
import { beginInteractionEndCycle } from '@/engine/interaction/interactionEndDedup';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import {
  openDiegeticNarrative,
  openNarrativeOverlay,
} from '@/engine/scene/narrativeOverlay';
import {
  isAct1DiegeticStoryNode,
  resolveNarrativePresentation,
} from './narrativePresentationPolicy';

/** Mutual-exclusion guard — prevents concurrent invocations from racing.
 *  Uses a generation counter so that even if narrativeInflight is released in
 *  `finally` before subscribers flush, a stale re-entrant call can be detected.
 */
let narrativeInflight = false;
let narrativeInflightGen = 0;
let narrativeOwnerGen = -1;

/**
 * Single entry point for opening narrative beats.
 * Act 1 nodes route to diegetic HUD or closed-overlay hubs; Acts 2+ use legacy VN overlay.
 */
export function presentNarrativeBeat(nodeId: string, kind: NarrativeKind): void {
  // INT-1: Check both the boolean guard AND the generation counter.
  // If narrativeInflight is true AND the current owner generation matches
  // narrativeInflightGen (i.e., the same logical invocation still "owns" the lock),
  // reject the re-entrant call. This prevents stale microtask-queued calls
  // from executing after finally{} releases the boolean.
  if (narrativeInflight && narrativeOwnerGen === narrativeInflightGen) {
    devWarn('[presentNarrativeBeat] Rejected: another beat is already presenting', { nodeId, kind });
    return;
  }
  narrativeInflight = true;
  const myGen = ++narrativeInflightGen;
  narrativeOwnerGen = myGen;
  try {
    beginInteractionEndCycle();

    if (!isAct1DiegeticStoryNode(nodeId)) {
      openNarrativeOverlay(nodeId, kind);
      return;
    }

    const mode = resolveNarrativePresentation(nodeId, kind);
    switch (mode) {
      case 'hub':
        enterSceneFreeExplorationHub(nodeId);
        break;
      case 'hud':
        openDiegeticNarrative(nodeId, kind);
        break;
      case 'legacy_overlay':
        openNarrativeOverlay(nodeId, kind);
        break;
    }
  } catch (error) {
    // Use synchronous dispatch — these modules are already loaded at runtime.
    // Dynamic imports resolve asynchronously and could fire after disposal.
    dispatchStateAction({
      type: 'notification/push',
      notificationType: 'quest',
      text: 'Ошибка загрузки контента. Попробуйте перезайти в сцену.',
    });
    devWarn('[presentNarrativeBeat] Unhandled error presenting beat', { nodeId, kind, error });
    // Guaranteed fallback: emit interaction:end synchronously so the player
    // is never permanently stuck in an interaction state, even if the dynamic
    // import of emergencyInteractionReset fails.
    eventBus.emit('interaction:end', {});
    import('@/engine/interaction/emergencyInteractionReset')
      .then(({ forceResetAllInteractionState }) => forceResetAllInteractionState())
      .catch((importErr) => {
        devWarn('[presentNarrativeBeat] emergencyInteractionReset import failed', importErr);
      });
  } finally {
    // Race #8 / C3: defer release to next microtask so that calls queued
    // during this invocation's try block still see the guard as active.
    queueMicrotask(() => {
      narrativeInflight = false;
    });
  }
}