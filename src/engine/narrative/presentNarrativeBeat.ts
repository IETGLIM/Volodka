import type { NarrativeKind } from '@/shared/types/narrativeKind';
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

/**
 * Single entry point for opening narrative beats.
 * Act 1 nodes route to diegetic HUD or closed-overlay hubs; Acts 2+ use legacy VN overlay.
 */
export function presentNarrativeBeat(nodeId: string, kind: NarrativeKind): void {
  if (narrativeInflight) {
    devWarn('[presentNarrativeBeat] Rejected: another beat is already presenting', { nodeId, kind });
    return;
  }
  narrativeInflight = true;
  const myGen = ++narrativeInflightGen;
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
    import('@/engine/StateDispatcher').then(({ dispatchStateAction }) => {
      dispatchStateAction({
        type: 'notification/push',
        notificationType: 'quest',
        text: 'Ошибка загрузки контента. Попробуйте перезайти в сцену.',
      });
    });
    import('@/shared/utils/devLog').then(({ devWarn: dw }) => {
      dw('[presentNarrativeBeat] Unhandled error presenting beat', { nodeId, kind, error });
    });
    import('@/engine/interaction/emergencyInteractionReset')
      .then(({ forceResetAllInteractionState }) => forceResetAllInteractionState())
      .catch(() => { /* module may not exist yet */ });
  } finally {
    // Race #8: release guard synchronously but also bump generation so that
    // any re-entrant call queued in the same microtask batch is detected as stale.
    narrativeInflight = false;
  }
}