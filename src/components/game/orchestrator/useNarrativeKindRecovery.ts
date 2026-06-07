import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  getDialogueNodes,
  getStoryNodes,
  preloadNarrativeGameData,
} from '@/data/gameDataLoader';

/** Recover narrativeKind for saves created before overlay kind was persisted. */
export function useNarrativeKindRecovery(
  showStoryOverlay: boolean,
  narrativeKind: 'story' | 'dialogue' | null,
  currentNodeId: string,
) {
  const setNarrativeKind = useGameStore((s) => s.setNarrativeKind);

  useEffect(() => {
    if (!showStoryOverlay || narrativeKind || !currentNodeId) return;

    let cancelled = false;
    void preloadNarrativeGameData().then(() => {
      if (cancelled) return;
      const storyNodes = getStoryNodes();
      const dialogueNodes = getDialogueNodes();
      if (storyNodes[currentNodeId]) setNarrativeKind('story');
      else if (dialogueNodes[currentNodeId]) setNarrativeKind('dialogue');
    });

    return () => {
      cancelled = true;
    };
  }, [showStoryOverlay, narrativeKind, currentNodeId, setNarrativeKind]);
}
