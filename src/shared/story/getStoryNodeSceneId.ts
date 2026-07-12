import { getStoryNodes, isNarrativeGameDataLoaded } from '@/data/gameDataLoader';

/** Resolve scene id for a story node when narrative packs are loaded. */
export function getStoryNodeSceneId(nodeId: string): string | undefined {
  if (!isNarrativeGameDataLoaded()) return undefined;
  return getStoryNodes()[nodeId]?.sceneId;
}
