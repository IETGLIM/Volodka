/**
 * Volodka RPG – Optimized NPC System with LOD
 * Reduces rendering cost for distant NPCs using Level of Detail
 */

'use client';

import { useMemo, useRef, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { SceneId, NPCDefinition } from '@/shared/types/game';
import { useExplorationState } from '@/store/useOptimizedStore';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { NPC } from './NPC';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { SpatialGrid, LOD_LEVELS } from '@/engine/PerformanceOptimizer';

interface NPCSystemProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  interactionState?: InteractionState;
  interactionTargetNPCId?: string | null;
}

/* ═══════════════════════════════════════════════════════════════
   LOD Configuration
   ═══════════════════════════════════════════════════════════════ */

const NPC_LOD_DISTANCES = {
  FULL_DETAIL: 15,    // Full animations, shadows, physics
  REDUCED_DETAIL: 30, // Reduced animations, no shadows
  MINIMAL_DETAIL: 50, // Idle only, billboard candidate
  CULLED: 80,         // Not rendered
};

/* ═══════════════════════════════════════════════════════════════
   Spatial Grid for efficient NPC queries
   ═══════════════════════════════════════════════════════════════ */

const npcSpatialGrid = new SpatialGrid<{ id: string; position: THREE.Vector3 }>(20);

/* ═══════════════════════════════════════════════════════════════
   NPC Data with LOD information
   ═══════════════════════════════════════════════════════════════ */

interface NPCData {
  definition: NPCDefinition;
  position: [number, number, number];
  rotation: number | undefined;
  activity: string;
  patrolWaypoints?: [number, number, number][];
  lodLevel: number;
  distance: number;
}

/**
 * Calculate LOD level based on distance
 */
function calculateLOD(distance: number): number {
  if (distance < NPC_LOD_DISTANCES.FULL_DETAIL) return 0;
  if (distance < NPC_LOD_DISTANCES.REDUCED_DETAIL) return 1;
  if (distance < NPC_LOD_DISTANCES.MINIMAL_DETAIL) return 2;
  if (distance < NPC_LOD_DISTANCES.CULLED) return 3;
  return 4; // Culled
}

/* ═══════════════════════════════════════════════════════════════
   Main NPC System Component (Optimized)
   ═══════════════════════════════════════════════════════════════ */

export const NPCSystemOptimized = memo(function NPCSystemOptimized({
  livePlayerPositionRef,
  interactionState = InteractionState.Idle,
  interactionTargetNPCId = null,
}: NPCSystemProps) {
  const { currentSceneId, timeOfDay } = useExplorationState();
  const lastUpdateTime = useRef(0);
  const npcPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map());

  // Compute visible NPCs from schedule (expensive, memoized)
  const baseNPCs = useMemo(() => {
    const npcIds = getNPCsForScene(currentSceneId, timeOfDay);
    return npcIds
      .map((id) => {
        const def = NPC_DEFINITIONS.find((n) => n.id === id);
        if (!def) return null;
        const entry = getCurrentScheduleEntry(id, timeOfDay);
        return {
          definition: def,
          position: entry?.position ?? def.defaultPosition,
          rotation: def.defaultRotation,
          activity: entry?.activity ?? 'idle',
          patrolWaypoints: def.patrolWaypoints,
        };
      })
      .filter(Boolean) as Array<{
      definition: NPCDefinition;
      position: [number, number, number];
      rotation: number | undefined;
      activity: string;
      patrolWaypoints?: [number, number, number][];
    }>;
  }, [currentSceneId, timeOfDay]);

  // Calculate LOD for each NPC based on player position
  // This runs less frequently than render (throttled)
  const npcsWithLOD = useMemo(() => {
    const playerPos = livePlayerPositionRef.current;
    const results: NPCData[] = [];

    for (const npc of baseNPCs) {
      const npcPos = new THREE.Vector3(...npc.position);
      const distance = playerPos.distanceTo(npcPos);
      const lodLevel = calculateLOD(distance);

      // Skip culled NPCs
      if (lodLevel >= 4) continue;

      // Update spatial grid
      npcSpatialGrid.insert({ id: npc.definition.id, position: npcPos }, npcPos);

      results.push({
        ...npc,
        lodLevel,
        distance,
      });
    }

    return results;
  }, [baseNPCs, livePlayerPositionRef.current]);

  // Cleanup spatial grid on unmount
  useEffect(() => {
    return () => npcSpatialGrid.clear();
  }, []);

  // Sort NPCs by LOD level for rendering priority
  const sortedNPCs = useMemo(() => {
    return [...npcsWithLOD].sort((a, b) => a.lodLevel - b.lodLevel);
  }, [npcsWithLOD]);

  return (
    <group>
      {sortedNPCs.map(({ definition, position, rotation, activity, patrolWaypoints, lodLevel, distance }) => (
        <NPCWithLOD
          key={definition.id}
          definition={definition}
          livePlayerPositionRef={livePlayerPositionRef}
          position={position}
          rotation={rotation}
          interactionState={interactionState}
          isInteractionTarget={definition.id === interactionTargetNPCId}
          activity={activity}
          patrolWaypoints={patrolWaypoints}
          lodLevel={lodLevel}
          distance={distance}
        />
      ))}
    </group>
  );
});

/* ═══════════════════════════════════════════════════════════════
   NPC Component with LOD Support
   ═══════════════════════════════════════════════════════════════ */

interface NPCWithLODProps {
  definition: NPCDefinition;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  position: [number, number, number];
  rotation: number | undefined;
  interactionState: InteractionState;
  isInteractionTarget: boolean;
  activity: string;
  patrolWaypoints?: [number, number, number][];
  lodLevel: number;
  distance: number;
}

const NPCWithLOD = memo(function NPCWithLOD({
  definition,
  livePlayerPositionRef,
  position,
  rotation,
  interactionState,
  isInteractionTarget,
  activity,
  patrolWaypoints,
  lodLevel,
  distance,
}: NPCWithLODProps) {
  // LOD 3: Minimal detail - just a simple mesh, no animations
  if (lodLevel === 3) {
    return (
      <SimpleNPCProxy
        position={position}
        color={definition.appearance?.bodyColor || '#888888'}
      />
    );
  }

  // LOD 0-2: Full NPC with reduced features based on level
  const enableShadows = lodLevel === 0;
  const animationDetail = lodLevel === 0 ? 'full' : lodLevel === 1 ? 'reduced' : 'idle-only';

  return (
    <NPC
      definition={definition}
      livePlayerPositionRef={livePlayerPositionRef}
      position={position}
      rotation={rotation}
      interactionState={interactionState}
      isInteractionTarget={isInteractionTarget}
      activity={activity}
      patrolWaypoints={patrolWaypoints}
      // LOD props passed to NPC component
      _lodShadows={enableShadows}
      _lodAnimationDetail={animationDetail}
    />
  );
});

/* ═══════════════════════════════════════════════════════════════
   Simple NPC Proxy for distant NPCs
   Uses a simple colored mesh instead of full GLB model
   ═══════════════════════════════════════════════════════════════ */

const SimpleNPCProxy = memo(function SimpleNPCProxy({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow={false}>
      <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
});

/* ═══════════════════════════════════════════════════════════════
   Export aliased for drop-in replacement
   ═══════════════════════════════════════════════════════════════ */

export { NPCSystemOptimized as NPCSystem };
