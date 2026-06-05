/* ─── Volodka RPG – World chunk streaming hook ─── */
/* Bridges exploration player position to WorldChunkManager.
 * Emits world:chunks_changed for future terrain/NPC loaders.
 * Today: integrates with legacy scene IDs; tomorrow: drives procedural tiles. */

import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import {
  WorldChunkManager,
  DEFAULT_WORLD_CHUNK_OPTIONS,
} from '@/engine/world/WorldChunkManager';
import { getChunkForScene } from '@/engine/world/legacySceneBridge';
import type { WorldChunkCoord, WorldChunkDiff } from '@/engine/world/types';
import { chunkKey } from '@/engine/world/types';

export interface UseWorldChunksResult {
  activeChunks: WorldChunkCoord[];
  lastDiff: WorldChunkDiff | null;
  playerChunk: WorldChunkCoord;
}

/**
 * Tracks which world chunks should be loaded around the player.
 * Call once from GameOrchestrator or RPGGameCanvas when open-world mode expands.
 *
 * Hybrid mode: when exploration uses discrete scenes, player world position is
 * derived from the scene's chunk origin + local playerPosition offset.
 */
export function useWorldChunks(enabled = false): UseWorldChunksResult {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const localPosition = useGameStore((s) => s.exploration.playerPosition);

  const managerRef = useRef<WorldChunkManager | null>(null);
  if (managerRef.current === null) {
    managerRef.current = new WorldChunkManager(DEFAULT_WORLD_CHUNK_OPTIONS);
  }
  const manager = managerRef.current;

  const lastDiffRef = useRef<WorldChunkDiff | null>(null);

  const playerWorld = useMemo(() => {
    const sceneChunk = getChunkForScene(sceneId);
    const size = DEFAULT_WORLD_CHUNK_OPTIONS.chunkSizeMeters;
    return {
      x: sceneChunk.x * size + localPosition[0],
      z: sceneChunk.z * size + localPosition[2],
    };
  }, [sceneId, localPosition]);

  const playerChunk = useMemo(
    () => manager.worldToChunk(playerWorld.x, playerWorld.z),
    [manager, playerWorld.x, playerWorld.z],
  );

  const activeChunks = useMemo(() => {
    if (!enabled) return [];
    const diff = manager.updateActiveChunks(playerWorld.x, playerWorld.z);
    lastDiffRef.current = diff;
    return diff.active;
  }, [enabled, manager, playerWorld.x, playerWorld.z]);

  useEffect(() => {
    if (!enabled || !lastDiffRef.current) return;
    const diff = lastDiffRef.current;
    if (diff.toLoad.length === 0 && diff.toUnload.length === 0) return;

    eventBus.emit('world:chunks_changed', {
      toLoad: diff.toLoad.map(chunkKey),
      toUnload: diff.toUnload.map(chunkKey),
      active: diff.active.map(chunkKey),
      playerChunk: chunkKey(playerChunk),
    });
  }, [enabled, activeChunks, playerChunk]);

  return {
    activeChunks,
    lastDiff: lastDiffRef.current,
    playerChunk,
  };
}
