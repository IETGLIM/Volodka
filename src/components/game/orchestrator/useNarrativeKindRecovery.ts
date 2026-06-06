import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

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
    void (async () => {
      const [{ STORY_NODES }, { DIALOGUE_NODES }] = await Promise.all([
        import('@/data/storyNodes'),
        import('@/data/dialogueNodes'),
      ]);
      if (cancelled) return;
      if (STORY_NODES[currentNodeId]) setNarrativeKind('story');
      else if (DIALOGUE_NODES[currentNodeId]) setNarrativeKind('dialogue');
    })();

    return () => {
      cancelled = true;
    };
  }, [showStoryOverlay, narrativeKind, currentNodeId, setNarrativeKind]);
}
