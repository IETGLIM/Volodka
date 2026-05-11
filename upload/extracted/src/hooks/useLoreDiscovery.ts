'use client';

/* ─── Volodka RPG – Lore auto-discovery hook ───
 * Automatically discovers lore entries when the player enters a scene.
 * Uses LORE_SCENE_MAP to determine which lore entries are associated with each scene.
 * Also discovers lore from story node progression via LORE_STORY_NODE_MAP.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getLoreForScene, getLoreForStoryNode } from '@/data/loreSceneMap';

/**
 * Hook that auto-discovers scene-based lore when the player enters a scene.
 * Call this once in the GameOrchestrator.
 */
export function useLoreDiscovery() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const prevSceneIdRef = useRef(sceneId);
  const prevNodeIdRef = useRef(currentNodeId);

  // Discover lore when entering a new scene
  useEffect(() => {
    if (sceneId !== prevSceneIdRef.current) {
      prevSceneIdRef.current = sceneId;
      const loreIds = getLoreForScene(sceneId);
      if (loreIds.length > 0) {
        const store = useGameStore.getState();
        for (const loreId of loreIds) {
          store.discoverLoreEntry(loreId);
        }
      }
    }
  }, [sceneId]);

  // Discover lore when reaching specific story nodes
  useEffect(() => {
    if (currentNodeId && currentNodeId !== prevNodeIdRef.current) {
      prevNodeIdRef.current = currentNodeId;
      const loreIds = getLoreForStoryNode(currentNodeId);
      if (loreIds.length > 0) {
        const store = useGameStore.getState();
        for (const loreId of loreIds) {
          store.discoverLoreEntry(loreId);
        }
      }
    }
  }, [currentNodeId]);
}
