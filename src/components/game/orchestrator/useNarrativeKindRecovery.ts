import { useEffect } from 'react';
import { useGamePrimitive, useSetNarrativeKind, useOrchestratorNarrativeOverlay } from '@/store/selectors';
import {
  getDialogueNodes,
  getStoryNodes,
  preloadNarrativeGameData,
  ensureNarrativeNodeIds,
} from '@/data/gameDataLoader';
import { devWarn } from '@/shared/utils/devLog';

/** Recover narrativeKind for saves created before overlay kind was persisted. */
export function useNarrativeKindRecovery() {
  const { showStoryOverlay, narrativeKind } = useOrchestratorNarrativeOverlay();
  const currentNodeId = useGamePrimitive((s) => s.currentNodeId);
  const setNarrativeKind = useSetNarrativeKind();

  useEffect(() => {
    if (!showStoryOverlay || narrativeKind || !currentNodeId) return;

    let cancelled = false;
    void preloadNarrativeGameData()
      .then(() => ensureNarrativeNodeIds([currentNodeId]))
      .then(() => {
        if (cancelled) return;
        const storyNodes = getStoryNodes();
        const dialogueNodes = getDialogueNodes();
        if (storyNodes[currentNodeId]) setNarrativeKind('story');
        else if (dialogueNodes[currentNodeId]) setNarrativeKind('dialogue');
      })
      .catch((err) => {
        devWarn('[useNarrativeKindRecovery] Failed to resolve narrativeKind:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [showStoryOverlay, narrativeKind, currentNodeId, setNarrativeKind]);
}
