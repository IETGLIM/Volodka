/* ─── Volodka RPG – World streaming hook ─── */
/* Bridges exploration state to WorldStreamManager + region/cell context. */

import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  getWorldStreamManager,
  type WorldChunkCoord,
  type WorldChunkDiff,
  type WorldStreamState,
} from '@/engine/world';

export interface UseWorldStreamResult {
  streamState: WorldStreamState;
  activeChunks: WorldChunkCoord[];
  lastDiff: WorldChunkDiff | null;
  playerChunk: WorldChunkCoord;
}

/**
 * Tracks open-world chunk streaming around the player.
 * Streaming activates only in district scenes; interiors/combat/dream stay discrete.
 */
export function useWorldStream(enabled = true): UseWorldStreamResult {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const localPosition = useGameStore((s) => s.exploration.playerPosition);

  const manager = useMemo(() => getWorldStreamManager(), []);

  const lastDiffRef = useRef<WorldChunkDiff | null>(null);

  const playerChunk = useMemo(
    () => manager.getPlayerChunk(sceneId, localPosition),
    [manager, sceneId, localPosition],
  );

  const activeChunks = useMemo(() => {
    if (!enabled) {
      manager.setStreamingEnabled(false);
      return [];
    }
    const diff = manager.updateStream(sceneId, localPosition);
    lastDiffRef.current = diff;
    return diff.active;
  }, [enabled, manager, sceneId, localPosition]);

  const streamState = useMemo(
    () => manager.getStreamState(sceneId, localPosition),
    [manager, sceneId, localPosition, activeChunks],
  );

  useEffect(() => {
    manager.syncContextFromScene(sceneId);
  }, [manager, sceneId]);

  return {
    streamState,
    activeChunks,
    lastDiff: lastDiffRef.current,
    playerChunk,
  };
}

/** @deprecated use useWorldStream */
export { useWorldStream as useWorldChunks };
