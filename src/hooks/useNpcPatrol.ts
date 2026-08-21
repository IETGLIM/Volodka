/* ─── NPC patrol hook — manages patrol state and per-frame movement ─── */

import { useRef, useState, useEffect, useMemo, type RefObject } from 'react';
import { Group, Vector3 } from 'three';
import { createPatrolState, updatePatrol, shouldPatrol, type PatrolState } from '@/engine/npc/npcPatrol';
import { buildNpcAvoidanceObstacles, type NpcObstacleAabb } from '@/engine/npc/npcObstacleAvoidance';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { getSceneFloorY } from '@/config/scenes';
import type { ColliderDef } from '@/shared/types/sceneDefinition';
import type { SceneId } from '@/shared/types/game';
import { InteractionState } from '@/engine/interaction/interactionMachine';

/* ─── Player proximity reaction thresholds ─── */
const PLAYER_STOP_DISTANCE = 3.0;   // Stop patrol & face player
const PLAYER_RESUME_DISTANCE = 5.0; // Resume patrol when player walks away

interface UseNpcPatrolParams {
  activity: string;
  isInteractionTarget: boolean;
  patrolWaypoints?: [number, number, number][];
  /** Multiple patrol route options — random one picked at mount */
  patrolRoutes?: readonly (readonly [number, number, number][])[];
  position: [number, number, number];
  sceneId: SceneId;
  rotation?: number;
  interactionState: InteractionState;
  groupRef: RefObject<Group | null>;
  /** Live player position for proximity-based patrol interruption */
  livePlayerPositionRef?: React.MutableRefObject<Vector3>;
}

interface UseNpcPatrolResult {
  patrolActivity: 'idle' | 'walk';
  updatePatrolFrame: (delta: number) => void;
}

/** Pick a random route from the available patrol routes */
function pickRandomRoute(
  routes: readonly (readonly [number, number, number][])[] | undefined,
  fallback: [number, number, number][] | undefined,
): [number, number, number][] | undefined {
  if (routes && routes.length > 0) {
    return [...routes[Math.floor(Math.random() * routes.length)]];
  }
  return fallback;
}

export function useNpcPatrol({
  activity,
  isInteractionTarget,
  patrolWaypoints,
  patrolRoutes,
  position,
  sceneId,
  rotation,
  interactionState,
  groupRef,
  livePlayerPositionRef,
}: UseNpcPatrolParams): UseNpcPatrolResult {
  const patrolRef = useRef<PatrolState | null>(null);
  const patrolActivityRef = useRef<'idle' | 'walk'>('idle');
  const [patrolActivity, setPatrolActivity] = useState<'idle' | 'walk'>('idle');
  const frozenByPlayerRef = useRef(false);
  const _tmpDir = useRef(new Vector3());

  // ── Select patrol route: prefer patrolRoutes (random pick), fallback to patrolWaypoints ──
  const activeWaypoints = useMemo(
    () => pickRandomRoute(patrolRoutes, patrolWaypoints),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable references, random on mount
    [patrolRoutes, patrolWaypoints],
  );

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
    if (activeWaypoints && activeWaypoints.length > 0) {
      patrolRef.current = createPatrolState(activeWaypoints, position);
      frozenByPlayerRef.current = false;
    } else {
      patrolRef.current = null;
    }
  // Only re-create if the waypoints array reference changes, not every position change
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  }, [activeWaypoints]);

  const updatePatrolFrame = (delta: number): void => {
    const group = groupRef.current;
    if (!group) return;

    const hasWaypoints = !!activeWaypoints?.length;
    const isPatrolling = shouldPatrol(activity, isInteractionTarget, hasWaypoints);

    // ── Player proximity check: freeze/unfreeze patrol ──
    if (isPatrolling && livePlayerPositionRef && !isInteractionTarget) {
      const playerPos = livePlayerPositionRef.current;
      const dx = playerPos.x - group.position.x;
      const dz = playerPos.z - group.position.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      if (!frozenByPlayerRef.current && distToPlayer < PLAYER_STOP_DISTANCE) {
        // Player is close — freeze patrol and face the player
        frozenByPlayerRef.current = true;
      } else if (frozenByPlayerRef.current && distToPlayer > PLAYER_RESUME_DISTANCE) {
        // Player moved away — unfreeze patrol
        frozenByPlayerRef.current = false;
      }
    } else if (!isPatrolling || isInteractionTarget) {
      frozenByPlayerRef.current = false;
    }

    const frozen = frozenByPlayerRef.current;

    if (isPatrolling && patrolRef.current && activeWaypoints && !frozen) {
      const result = updatePatrol(
        patrolRef.current,
        activeWaypoints,
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
      // Not patrolling or frozen by player proximity
      if (!frozen) {
        group.position.set(position[0], position[1], position[2]);
      }
      if (patrolActivityRef.current !== 'idle') {
        patrolActivityRef.current = 'idle';
        setPatrolActivity('idle');
      }
    }

    // During Align phase, the interaction system sets rotation directly on the group.
    // We should NOT override it with the default rotation during active interaction.
    if (!isInteractionTarget || interactionState === InteractionState.Idle) {
      if (frozen && livePlayerPositionRef) {
        // Smoothly rotate to face the player
        const playerPos = livePlayerPositionRef.current;
        _tmpDir.current.set(
          playerPos.x - group.position.x,
          0,
          playerPos.z - group.position.z,
        );
        const targetAngle = Math.atan2(_tmpDir.current.x, _tmpDir.current.z);
        let diff = targetAngle - group.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        group.rotation.y += diff * Math.min(1, 4.0 * delta);
      } else if (isPatrolling && patrolRef.current && !frozen) {
        // Use patrol-derived rotation (facing walk direction)
        group.rotation.y = patrolRef.current.rotationY;
      } else if (rotation !== undefined) {
        group.rotation.y = rotation;
      }
    }
  };

  return { patrolActivity, updatePatrolFrame };
}
