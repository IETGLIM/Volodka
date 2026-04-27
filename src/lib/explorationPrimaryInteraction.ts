/**
 * Единая точка приоритета «что делает E в обходе»:
 * 1) среди кандидатов NPC / интерактивный объект / триггер `requiresInteraction` выбирается **ближайший**
 *    по дистанции до «якоря» (NPC — xz; объект — как в `getNearestInteractiveObjectWithDistance`; триггер — центр AABB);
 * 2) при почти равной дистанции: **NPC > объект > триггер** (диалог не перехватывается «дверью» с большим боксом);
 * 3) триггер с `interactionId` возвращается как `registry` (выполнение через `InteractionRegistry.tryExecute`);
 *    без `interactionId` — `story_trigger` (`handleTriggerEnter` / story / cutscene).
 */
import type { InteractiveObjectConfig } from '@/config/scenes';
import type { NPCDefinition, NPCState, TriggerState, TriggerZone } from '@/data/rpgTypes';
import { getNearestInteractiveObjectWithDistance } from '@/ui/game/InteractiveTriggers';

/** Горизонтальный радиус разговора с NPC (м), согласован с `RPGGameCanvas`. */
export const EXPLORATION_NPC_INTERACT_RADIUS = 3;

/** Порог «почти равной» дистанции для приоритета типа (NPC > object > trigger). */
const PRIORITY_TIE_EPS = 0.2;

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

/** Дистанция до «центра» триггера по XZ (большой AABB у двери не даёт d=0, если центр дальше игрока). */
function triggerAnchorDistanceXZ(
  pos: { x: number; y: number; z: number },
  trigger: TriggerZone,
): number {
  const dx = pos.x - trigger.position.x;
  const dz = pos.z - trigger.position.z;
  return Math.hypot(dx, dz);
}

type CandidateKind = 'npc' | 'world_object' | 'trigger';

function tier(kind: CandidateKind): number {
  if (kind === 'npc') return 0;
  if (kind === 'world_object') return 1;
  return 2;
}

function pickNearestByDistanceThenTier(
  candidates: Array<{ kind: CandidateKind; distance: number }>,
): CandidateKind | null {
  if (!candidates.length) return null;
  let minD = Infinity;
  for (const c of candidates) {
    if (c.distance < minD) minD = c.distance;
  }
  const near = candidates.filter((c) => c.distance <= minD + PRIORITY_TIE_EPS);
  near.sort((a, b) => tier(a.kind) - tier(b.kind));
  return near[0]?.kind ?? null;
}

export type ExplorationInteractionPriorityTarget =
  | { kind: 'none' }
  | { kind: 'registry'; interactionId: string; triggerId: string }
  | { kind: 'story_trigger'; triggerId: string }
  | { kind: 'world_object'; object: InteractiveObjectConfig }
  | { kind: 'npc'; npcId: string; distance: number };

export function resolveExplorationInteractionPriority(params: {
  playerPosition: { x: number; y: number; z: number; rotation?: number };
  sceneTriggers: TriggerZone[];
  triggerStates: Record<string, TriggerState>;
  sceneInteractiveObjects: InteractiveObjectConfig[];
  sceneNPCs: NPCDefinition[];
  npcStates: Record<string, NPCState>;
  /**
   * Разрешённые `interactionId` из `TriggerSystem`.
   * Если `undefined` — не фильтровать по реестру (только для legacy-вызовов в тестах).
   */
  availableInteractionIds?: ReadonlySet<string>;
}): ExplorationInteractionPriorityTarget {
  const {
    playerPosition,
    sceneTriggers,
    triggerStates,
    sceneInteractiveObjects,
    sceneNPCs,
    npcStates,
    availableInteractionIds,
  } = params;

  const nearObj = getNearestInteractiveObjectWithDistance(
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

  type TriggerPick = { trigger: TriggerZone; distance: number };
  const triggerCandidates: TriggerPick[] = [];
  for (const trigger of sceneTriggers) {
    const st = triggerStates[trigger.id] || { id: trigger.id, triggered: false };
    if (st.triggered) continue;
    if (!trigger.requiresInteraction) continue;
    if (!playerInTriggerAABB(playerPosition, trigger)) continue;
    if (trigger.interactionId && availableInteractionIds != null && !availableInteractionIds.has(trigger.interactionId)) {
      continue;
    }
    triggerCandidates.push({ trigger, distance: triggerAnchorDistanceXZ(playerPosition, trigger) });
  }
  let bestTrigger: TriggerPick | null = null;
  for (const row of triggerCandidates) {
    if (!bestTrigger || row.distance < bestTrigger.distance) bestTrigger = row;
  }

  const cand: Array<{ kind: CandidateKind; distance: number }> = [];
  if (bestNpc) cand.push({ kind: 'npc', distance: bestNpc.d });
  if (nearObj) cand.push({ kind: 'world_object', distance: nearObj.distance });
  if (bestTrigger) cand.push({ kind: 'trigger', distance: bestTrigger.distance });

  const winner = pickNearestByDistanceThenTier(cand);
  if (!winner) return { kind: 'none' };

  if (winner === 'npc' && bestNpc) {
    return { kind: 'npc', npcId: bestNpc.id, distance: bestNpc.d };
  }
  if (winner === 'world_object' && nearObj) {
    return { kind: 'world_object', object: nearObj.object };
  }
  if (winner === 'trigger' && bestTrigger) {
    const t = bestTrigger.trigger;
    if (t.interactionId) {
      return { kind: 'registry', interactionId: t.interactionId, triggerId: t.id };
    }
    return { kind: 'story_trigger', triggerId: t.id };
  }

  return { kind: 'none' };
}

export type ExplorationPrimaryTarget =
  | { kind: 'trigger'; triggerId: string }
  | { kind: 'world_object'; object: InteractiveObjectConfig }
  | { kind: 'npc'; npcId: string; distance: number }
  | { kind: 'none' };

/**
 * @deprecated Используйте `resolveExplorationInteractionPriority` + раздельная обработка `registry` / `story_trigger`.
 * Оставлено для тестов совместимости: `registry` и `story_trigger` сводятся к `{ kind: 'trigger' }`.
 */
export function resolveExplorationPrimaryInteraction(params: {
  playerPosition: { x: number; y: number; z: number; rotation?: number };
  sceneTriggers: TriggerZone[];
  triggerStates: Record<string, TriggerState>;
  sceneInteractiveObjects: InteractiveObjectConfig[];
  sceneNPCs: NPCDefinition[];
  npcStates: Record<string, NPCState>;
  availableInteractionIds?: ReadonlySet<string>;
}): ExplorationPrimaryTarget {
  const p = resolveExplorationInteractionPriority(params);
  if (p.kind === 'registry' || p.kind === 'story_trigger') {
    return { kind: 'trigger', triggerId: p.triggerId };
  }
  if (p.kind === 'world_object' || p.kind === 'npc' || p.kind === 'none') return p;
  return { kind: 'none' };
}
