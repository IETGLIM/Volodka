/**
 * Единая точка решения «что делает клавиша взаимодействия (E)» в обходе:
 * 1) триггеры с `requiresInteraction`, пока не сработали (`triggered`);
 * 2) иначе — ближайший из пары «интерактивный объект» vs «NPC» по дистанции XZ
 *    (при почти равной дистанции приоритет у NPC — «сначала люди»).
 */
import type { InteractiveObjectConfig } from '@/config/scenes';
import type { NPCDefinition, NPCState, TriggerState, TriggerZone } from '@/data/rpgTypes';
import { getNearestInteractiveObjectWithDistance } from '@/components/game/InteractiveTriggers';

/** Горизонтальный радиус разговора с NPC (м), согласован с `RPGGameCanvas`. */
export const EXPLORATION_NPC_INTERACT_RADIUS = 3;

/** Если |d_npc − d_obj| ≤ eps, считаем дистанции равными и выбираем NPC. */
const NPC_VS_OBJECT_TIE_EPS = 0.18;

function playerInTriggerAABB(pos: { x: number; y: number; z: number }, trigger: TriggerZone): boolean {
  const dx = pos.x - trigger.position.x;
  const dy = pos.y - trigger.position.y;
  const dz = pos.z - trigger.position.z;
  return (
    Math.abs(dx) < trigger.size.x / 2 &&
    Math.abs(dy) < trigger.size.y / 2 &&
    Math.abs(dz) < trigger.size.z / 2
  );
}

export type ExplorationPrimaryTarget =
  | { kind: 'trigger'; triggerId: string }
  | { kind: 'world_object'; object: InteractiveObjectConfig }
  | { kind: 'npc'; npcId: string; distance: number }
  | { kind: 'none' };

export function resolveExplorationPrimaryInteraction(params: {
  playerPosition: { x: number; y: number; z: number; rotation?: number };
  sceneTriggers: TriggerZone[];
  triggerStates: Record<string, TriggerState>;
  sceneInteractiveObjects: InteractiveObjectConfig[];
  sceneNPCs: NPCDefinition[];
  npcStates: Record<string, NPCState>;
}): ExplorationPrimaryTarget {
  const { playerPosition, sceneTriggers, triggerStates, sceneInteractiveObjects, sceneNPCs, npcStates } =
    params;

  for (const trigger of sceneTriggers) {
    const st = triggerStates[trigger.id] || { id: trigger.id, triggered: false };
    if (st.triggered) continue;
    if (!trigger.requiresInteraction) continue;
    if (!playerInTriggerAABB(playerPosition, trigger)) continue;
    return { kind: 'trigger', triggerId: trigger.id };
  }

  const near = getNearestInteractiveObjectWithDistance(
    { x: playerPosition.x, z: playerPosition.z },
    sceneInteractiveObjects,
  );

  let bestNpc: { id: string; d: number } | null = null;
  for (const npc of sceneNPCs) {
    const state = npcStates[npc.id];
    const npcPos = state?.position || npc.defaultPosition;
    const dx = playerPosition.x - npcPos.x;
    const dz = playerPosition.z - npcPos.z;
    const d = Math.hypot(dx, dz);
    if (d < EXPLORATION_NPC_INTERACT_RADIUS && (!bestNpc || d < bestNpc.d)) {
      bestNpc = { id: npc.id, d };
    }
  }

  if (!near && !bestNpc) return { kind: 'none' };
  if (!bestNpc) return { kind: 'world_object', object: near!.object };
  if (!near) return { kind: 'npc', npcId: bestNpc.id, distance: bestNpc.d };

  const dObj = near.distance;
  const dNpc = bestNpc.d;
  if (dNpc + NPC_VS_OBJECT_TIE_EPS < dObj) {
    return { kind: 'npc', npcId: bestNpc.id, distance: dNpc };
  }
  if (dObj + NPC_VS_OBJECT_TIE_EPS < dNpc) {
    return { kind: 'world_object', object: near.object };
  }
  return { kind: 'npc', npcId: bestNpc.id, distance: dNpc };
}
