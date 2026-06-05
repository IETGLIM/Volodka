
/* ─── Volodka RPG – NPC system for current scene ─── */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { SceneId, NPCDefinition } from '@/shared/types/game';
import { useGameStore } from '@/store/gameStore';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { buildScheduleContext } from '@/shared/scheduleContext';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { EXPANDED_NPCS } from '@/data/expandedNPCs';
import { NPC } from './NPC';

/** Merged NPC definitions: core 7 + expanded 5 */
const ALL_NPC_DEFINITIONS = [...NPC_DEFINITIONS, ...EXPANDED_NPCS];
import { InteractionState } from '@/engine/interaction/interactionMachine';

interface NPCSystemProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
  /** Current interaction state from the interaction system */
  interactionState?: InteractionState;
  /** The NPC ID that is currently the target of interaction */
  interactionTargetNPCId?: string | null;
}

/** Manages all NPCs for the current scene */
export function NPCSystem({
  livePlayerPositionRef,
  interactionState = InteractionState.Idle,
  interactionTargetNPCId = null,
}: NPCSystemProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const scheduleCtx = useGameStore((s) => buildScheduleContext(s));

  // Compute visible NPCs from schedule
  const visibleNPCs = useMemo(() => {
    const npcIds = getNPCsForScene(sceneId, timeOfDay, scheduleCtx);
    return npcIds
      .map((id) => {
        const def = ALL_NPC_DEFINITIONS.find((n) => n.id === id);
        if (!def) return null;
        const entry = getCurrentScheduleEntry(id, timeOfDay, scheduleCtx);
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
