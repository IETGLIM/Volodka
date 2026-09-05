
/* ─── Volodka RPG – NPC system for current scene ─── */

import { useMemo } from 'react';
import { Vector3 } from 'three';
import type { SceneId, NPCDefinition } from '@/shared/types/game';
import { useCurrentSceneId, useTimeOfDay, useScheduleContext } from '@/store/selectors';
import { getNPCsForScene, getCurrentScheduleEntry } from '@/engine/ScheduleEngine';
import { findNpcById } from '@/data/allNpcDefinitions';
import { NPC } from './NPC';
import { NpcFrameBatchRunner } from './NpcFrameBatchRunner';
import { advanceBarkRelationFrame, advanceEmissiveFrame } from './NPC';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { separateNpcPositions } from '@/engine/npc/separateNpcPositions';
import { resolveNpcRenderTier } from '@/engine/npc/npcRenderTier';
import { resolveNpcPlacementForScene } from '@/engine/scene/placementAudit';

interface NPCSystemProps {
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
  /** Current interaction state from the interaction system */
  interactionState?: InteractionState;
  /** The NPC ID that is currently the target of interaction */
  interactionTargetNPCId?: string | null;
}

/** Max interactable NPCs in heavy scenes — prevents frame stalls.
 *  Caps are applied to the CURRENT sceneId (not the schedule parent), so
 *  derived scenes (e.g. guild_mainframe ← office_day) use their own caps.
 *  Parent scenes that are visited directly also need caps — without one,
 *  peak-hour NPC counts can stall the frame budget (office_day reaches 10
 *  NPCs at hour 12 with act 3+ overrides; cafe_evening reaches 7 at hour 19). */
const MAX_NPCS_PER_SCENE: Partial<Record<SceneId, number>> = {
  volodka_room: 1,
  volodka_corridor: 3,
  solnysh_room: 2,
  zarema_albert_room: 2,
  zarema_room: 2,
  home_evening: 3,
  street_night: 5,
  street_winter: 4,
  city_square: 5,
  abandoned_factory: 5,
  park_day: 8,
  pier_evening: 2,
  factory_roof: 3,
  guild_mainframe: 4,
  albert_backroom: 2,
  underground_bunker: 4,
  library_basement: 3,
  chk_campfire_night: 6,
  chk_forest_zorge: 7,
  // Direct-visit parent scenes — previously uncapped, could stall frames at peak hours.
  cafe_evening: 6,  // peak 7 NPCs at hour 19; slices 1 background (chk_guest_analyst)
  library_day: 4,   // peak 4 NPCs at hour 14-18; no slicing, safeguard only
  office_day: 6,    // peak 10 NPCs at hour 12 (act 3+); slices 4 background chk_*
};

/** Shared patrol loop for schedule "walk" NPCs in the narrow communal corridor. */
const CORRIDOR_PATROL_WAYPOINTS: [number, number, number][] = [
  [0, 0, -4.0],
  [0, 0, 0],
  [0, 0, 4.0],
];

/** Sidewalk loop on the 6 m strip — keeps walkers off lamp posts & curbs.
 *  FIX (placement-audit): [1.8,0,-2] проходил сквозь киоск obstacle[2.5,-2],
 *  [2.2,0,3] — сквозь ящик obstacle[2,3]; обведены с запасом капсулы. */
const STREET_PATROL_WAYPOINTS: [number, number, number][] = [
  [-2.2, 0, -6],
  [1.2, 0, -2.2],
  [2.2, 0, 4.2],
  [-1.5, 0, 7],
  [-2.4, 0, 1],
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
            : (sceneId === 'street_night' || sceneId === 'street_winter') &&
                (activity === 'walk' || activity === 'rest')
              ? STREET_PATROL_WAYPOINTS
              : undefined);

        return {
          definition: def,
          // FIX (placement-audit): расписание авторизовано для сцены-родителя —
          // в варианте (SCENE_SCHEDULE_PARENT) геометрия другая; оверрайды
          // переводят NPC в валидную точку варианта (на пол, вне мебели).
          position: resolveNpcPlacementForScene(
            sceneId,
            def.id,
            entry?.position ?? def.defaultPosition,
          ),
          rotation: def.defaultRotation,
          activity,
          patrolWaypoints,
          patrolRoutes: def.patrolRoutes,
          renderTier: resolveNpcRenderTier(def, sceneId),
        };
      })
      .filter(Boolean) as Array<{
      definition: NPCDefinition;
      position: [number, number, number];
      rotation: number | undefined;
      activity: string;
      patrolWaypoints?: [number, number, number][];
      patrolRoutes?: readonly (readonly [number, number, number][])[];
      renderTier: ReturnType<typeof resolveNpcRenderTier>;
    }>;

    let placed = npcs;
    const cap = MAX_NPCS_PER_SCENE[sceneId];
    if (cap !== undefined && placed.length > cap) {
      placed = placed.slice(0, cap);
    }
    if (sceneId === 'street_night' || sceneId === 'street_winter') {
      placed = separateNpcPositions(placed);
    }
    return placed;
  }, [sceneId, timeOfDay, scheduleCtx]);

  return (
    <group>
      <NpcFrameBatchRunner />
      <NPCFrameCacheAdvancer />
      {visibleNPCs.map(({ definition, position, rotation, activity, patrolWaypoints, patrolRoutes, renderTier }) => (
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
          patrolRoutes={patrolRoutes}
          renderTier={renderTier}
        />
      ))}
    </group>
  );
}

/** Advances per-frame caches in NPC.tsx once per frame (not per-NPC).
 *  Uses the 'npc' FrameSystemId so the cache tick is budgeted together with
 *  other NPC frame work and appears in the per-system CPU stats. */
function NPCFrameCacheAdvancer() {
  useFrameTick(
    'npc',
    () => {
      advanceBarkRelationFrame();
      advanceEmissiveFrame();
    },
    { label: 'NPCFrameCacheAdvancer' },
  );
  return null;
}
