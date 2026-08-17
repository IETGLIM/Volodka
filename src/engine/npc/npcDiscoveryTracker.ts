/* ─── Volodka RPG – NPC Discovery Tracker ─── */
/*
 * Hook that auto-discovers NPCs when the player:
 * 1. Visits a dialogue node linked to an NPC (via NPC_BY_DIALOGUE_NODE)
 * 2. Has npcRelations entries for an NPC
 *
 * Subscribe to game store and update the standalone NpcCodexStore.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useNpcCodexStore } from '@/store/stores/npcCodexStore';
import { NPC_BY_DIALOGUE_NODE, ALL_NPC_IDS } from '@/data/allNpcDefinitions';

/**
 * Hook that watches game state and auto-discovers NPCs.
 * Mount this in the game orchestrator or a top-level component.
 */
export function useNpcDiscoveryTracker(): void {
  const visitedNodes = useGameStore((s) => s.playerState.visitedNodes);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const discoverNpc = useNpcCodexStore((s) => s.discoverNpc);

  /* Track previously discovered NPCs to avoid redundant calls */
  const previouslyDiscoveredRef = useRef<Set<string>>(new Set());

  /* Track processed nodes to avoid re-checking */
  const processedNodesRef = useRef<Set<string>>(new Set());

  /* Track processed relation NPC IDs */
  const processedRelationNpcsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const discoveredSet = previouslyDiscoveredRef.current;

    /* Check new visited nodes for NPC dialogue links */
    for (const nodeId of visitedNodes) {
      if (processedNodesRef.current.has(nodeId)) continue;
      processedNodesRef.current.add(nodeId);

      const linkedNpc = NPC_BY_DIALOGUE_NODE.get(nodeId);
      if (linkedNpc && !discoveredSet.has(linkedNpc.id)) {
        discoverNpc(linkedNpc.id);
        discoveredSet.add(linkedNpc.id);
      }
    }

    /* Also check npcRelations for any NPC with entries */
    for (const rel of npcRelations) {
      if (processedRelationNpcsRef.current.has(rel.npcId)) continue;
      processedRelationNpcsRef.current.add(rel.npcId);

      if (!discoveredSet.has(rel.npcId)) {
        /* Only discover if the NPC definition exists */
        if (ALL_NPC_IDS.includes(rel.npcId)) {
          discoverNpc(rel.npcId);
          discoveredSet.add(rel.npcId);
        }
      }
    }
  }, [visitedNodes, npcRelations, discoverNpc]);
}
