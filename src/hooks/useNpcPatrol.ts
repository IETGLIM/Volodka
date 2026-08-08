/* ─── NPC patrol hook — manages patrol state and per-frame movement ─── */

import { useRef, useState, useEffect, useMemo, type RefObject } from 'react';
import * as THREE from 'three';
import { createPatrolState, updatePatrol, shouldPatrol, type PatrolState } from '@/engine/npc/npcPatrol';
import { buildNpcAvoidanceObstacles, type NpcObstacleAabb } from '@/engine/npc/npcObstacleAvoidance';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { getSceneFloorY } from '@/config/scenes';
import type { ColliderDef } from '@/shared/types/sceneDefinition';
import type { SceneId } from '@/shared/types/game';
import { InteractionState } from '@/engine/interaction/interactionMachine';

interface UseNpcPatrolParams {
  activity: string;
  isInteractionTarget: boolean;
  patrolWaypoints?: [number, number, number][];
  position: [number, number, number];
  sceneId: SceneId;
  rotation?: number;
  interactionState: InteractionState;
  groupRef: RefObject<THREE.Group | null>;
}

interface UseNpcPatrolResult {
  patrolActivity: 'idle' | 'walk';
  updatePatrolFrame: (delta: number) => void;
}

export function useNpcPatrol({
  activity,
  isInteractionTarget,
  patrolWaypoints,
  position,
  sceneId,
  rotation,
  interactionState,
  groupRef,
}: UseNpcPatrolParams): UseNpcPatrolResult {
  const patrolRef = useRef<PatrolState | null>(null);
  const patrolActivityRef = useRef<'idle' | 'walk'>('idle');
  const [patrolActivity, setPatrolActivity] = useState<'idle' | 'walk'>('idle');

  // ── NPC avoidance obstacles for the current scene ──
  // Walls + tall props as AABBs, so patrol NPCs steer around them instead of
  // walking through walls. Recomputed only when the scene changes.
  const avoidanceObstacles = useMemo<NpcObstacleAabb[]>(
    () => {
      const def = (SCENE_DEFINITIONS as Record<string, { walls?: ColliderDef[]; obstacles?: ColliderDef[] }>)[sceneId];
      if (!def) return [];
      return buildNpcAvoidanceObstacles(def);
    },
    [sceneId],
  );

  // Initialize patrol state when waypoints are available
  useEffect(() => {
    if (patrolWaypoints && patrolWaypoints.length > 0) {
      patrolRef.current = createPatrolState(patrolWaypoints, position);
    } else {
      patrolRef.current = null;
    }
  // Only re-create if the waypoints array reference changes, not every position change
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [patrolWaypoints]);

  const updatePatrolFrame = (delta: number): void => {
    const group = groupRef.current;
    if (!group) return;

    const isPatrolling = shouldPatrol(activity, isInteractionTarget, !!patrolWaypoints?.length);
    if (isPatrolling && patrolRef.current && patrolWaypoints) {
      const result = updatePatrol(
        patrolRef.current,
        patrolWaypoints,
        delta,
        undefined,
        avoidanceObstacles,
        sceneId,
        getSceneFloorY(sceneId),
      );
      if (result.activity !== patrolActivityRef.current) {
        patrolActivityRef.current = result.activity;
        setPatrolActivity(result.activity);
      }
      group.position.copy(patrolRef.current.position);
    } else {
      group.position.set(position[0], position[1], position[2]);
      if (patrolActivityRef.current !== 'idle') {
        patrolActivityRef.current = 'idle';
        setPatrolActivity('idle');
      }
    }

    // During Align phase, the interaction system sets rotation directly on the group.
    // We should NOT override it with the default rotation during active interaction.
    if (!isInteractionTarget || interactionState === InteractionState.Idle) {
      if (isPatrolling && patrolRef.current) {
        // Use patrol-derived rotation (facing walk direction)
        group.rotation.y = patrolRef.current.rotationY;
      } else if (rotation !== undefined) {
        group.rotation.y = rotation;
      }
    }
  };

  return { patrolActivity, updatePatrolFrame };
}
