
/* ─── Volodka RPG – NPC system for current scene ─── */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneId, NPCDefinition } from '@/shared/types/game';
import { useCurrentSceneId, useTimeOfDay, useScheduleContext } from '@/store/selectors';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { findNpcById } from '@/data/allNpcDefinitions';
import { NPC } from './NPC';
import { InteractionState } from '@/engine/interaction/interactionMachine';

interface NPCSystemProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  /** Current interaction state from the interaction system */
  interactionState?: InteractionState;
  /** The NPC ID that is currently the target of interaction */
  interactionTargetNPCId?: string | null;
}

/** Max interactable NPCs in heavy scenes — prevents frame stalls */
const MAX_NPCS_PER_SCENE: Partial<Record<SceneId, number>> = {
  volodka_room: 1,
  volodka_corridor: 2,
  zarema_albert_room: 2,
  home_evening: 3,
  abandoned_factory: 5,
  park_day: 8,
};

/** Shared patrol loop for schedule "walk" NPCs in the narrow communal corridor. */
const CORRIDOR_PATROL_WAYPOINTS: [number, number, number][] = [
  [0, 0, -2.5],
  [0, 0, 0],
  [0, 0, 2.2],
];

/** Manages all NPCs for the current scene */
export function NPCSystem({
  livePlayerPositionRef,
  interactionState = InteractionState.Idle,
  interactionTargetNPCId = null,
}: NPCSystemProps) {
  const sceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const scheduleCtx = useScheduleContext();

  // Compute visible NPCs from schedule
  const visibleNPCs = useMemo(() => {
    const npcIds = getNPCsForScene(sceneId, timeOfDay, scheduleCtx);
    const npcs = npcIds
      .map((id) => {
        const def = findNpcById(id);
        if (!def) return null;
        const entry = getCurrentScheduleEntry(id, timeOfDay, scheduleCtx);
        const activity = entry?.activity ?? 'idle';
        const patrolWaypoints =
          def.patrolWaypoints ??
          (sceneId === 'volodka_corridor' &&
          (activity === 'walk' || activity === 'rest')
            ? CORRIDOR_PATROL_WAYPOINTS
            : undefined);

        return {
          definition: def,
          position: entry?.position ?? def.defaultPosition,
          rotation: def.defaultRotation,
          activity,
          patrolWaypoints,
        };
      })
      .filter(Boolean) as Array<{
      definition: NPCDefinition;
      position: [number, number, number];
      rotation: number | undefined;
      activity: string;
      patrolWaypoints?: [number, number, number][];
    }>;

    const cap = MAX_NPCS_PER_SCENE[sceneId];
    if (cap !== undefined && npcs.length > cap) {
      return npcs.slice(0, cap);
    }
    return npcs;
  }, [sceneId, timeOfDay, scheduleCtx]);

  return (
    <group>
      {visibleNPCs.map(({ definition, position, rotation, activity, patrolWaypoints }) => (
        <NPC
          key={definition.id}
          definition={definition}
          livePlayerPositionRef={livePlayerPositionRef}
          position={position}
          rotation={rotation}
          interactionState={interactionState}
          isInteractionTarget={definition.id === interactionTargetNPCId}
          activity={activity}
          patrolWaypoints={patrolWaypoints}
        />
      ))}
    </group>
  );
}
