import type { NarrativeKind } from '@/shared/types/narrativeKind';
import { enterSceneFreeExplorationHub } from '@/engine/scene/freeExplorationHub';
import {
  openDiegeticNarrative,
  openNarrativeOverlay,
} from '@/engine/scene/narrativeOverlay';
import {
  isAct1DiegeticStoryNode,
  resolveNarrativePresentation,
} from './narrativePresentationPolicy';

/**
 * Single entry point for opening narrative beats.
 * Act 1 nodes route to diegetic HUD or closed-overlay hubs; Acts 2+ use legacy VN overlay.
 */
export function presentNarrativeBeat(nodeId: string, kind: NarrativeKind): void {
  try {
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
    import('@/shared/utils/devLog').then(({ devWarn }) => {
      devWarn('[presentNarrativeBeat] Unhandled error presenting beat', { nodeId, kind, error });
    });
    import('@/engine/interaction/emergencyInteractionReset')
      .then(({ forceResetAllInteractionState }) => forceResetAllInteractionState())
      .catch(() => { /* module may not exist yet */ });
  }
}
