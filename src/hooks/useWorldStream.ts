/* ─── Volodka RPG – World streaming hook ─── */
/* Bridges exploration state to WorldStreamManager + region/cell context. */

import { useEffect, useMemo, useRef, useState } from 'react';
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
 * Chunk diff runs in a Web Worker when available (Rapier physics stays on main thread).
 */
export function useWorldStream(enabled = true): UseWorldStreamResult {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const localPosition = useGameStore((s) => s.exploration.playerPosition);

  const manager = getWorldStreamManager();

  const [activeChunks, setActiveChunks] = useState<WorldChunkCoord[]>([]);
  const lastDiffRef = useRef<WorldChunkDiff | null>(null);

  const playerChunk = useMemo(
    () => manager.getPlayerChunk(sceneId, localPosition),
    [manager, sceneId, localPosition],
  );

  useEffect(() => {
    if (!enabled) {
      manager.setStreamingEnabled(false);
      setActiveChunks([]);
      lastDiffRef.current = null;
      return;
    }

    let cancelled = false;

    void manager.updateStreamAsync(sceneId, localPosition).then((diff) => {
      if (cancelled) return;
      lastDiffRef.current = diff;
      setActiveChunks(diff.active);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, manager, sceneId, localPosition]);

  const streamState = useMemo(
    () => manager.getStreamState(sceneId, localPosition),
    [manager, sceneId, localPosition, activeChunks],
  );

  return {
    streamState,
    activeChunks,
    lastDiff: lastDiffRef.current,
    playerChunk,
  };
}

/** @deprecated use useWorldStream */
export { useWorldStream as useWorldChunks };
