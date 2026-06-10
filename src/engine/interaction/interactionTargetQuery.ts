import * as THREE from 'three';
import { INTERACTION_LABELS, type TriggerZone } from '@/data/triggerZones';
import type { SceneId } from '@/shared/types/game';
import { FIRST_PERSON_ENABLED, FIRST_PERSON_EYE_HEIGHT } from '@/engine/camera/cameraConstants';
import { getInteractionQueryContext } from '@/engine/interaction/interactionQueryContext';
export type InteractionTargetKind = 'zone' | 'npc' | 'exit';

export interface InteractionTargetHit {
  id: string;
  kind: InteractionTargetKind;
  distance: number;
  /** Lower is better (distance × facing penalty). */
  score: number;
  npcId?: string;
  triggerZoneId?: string;
  label: string;
}

export interface NpcQueryTarget {
  id: string;
  npcId: string;
  position: [number, number, number];
  label: string;
}

export interface ExitQueryTarget {
  id: string;
  position: [number, number, number];
  label: string;
  maxRange: number;
}

export interface QueryInteractionTargetsParams {
  playerPos: THREE.Vector3;
  playerYaw: number;
  zones: TriggerZone[];
  npcs: NpcQueryTarget[];
  exits?: ExitQueryTarget[];
  /** When false, skip physics LOS (e.g. unit tests). Default true. */
  checkLineOfSight?: boolean;
}

const _playerForward = new THREE.Vector3();
const _toTarget = new THREE.Vector3();
const _eye = new THREE.Vector3();
const _target = new THREE.Vector3();

const NPC_MAX_RANGE = 3.0;
const ZONE_RANGE_PADDING = 1.35;

/** Score a target by distance and whether the player faces it (horizontal only). */
export function scoreInteractionTarget(
  playerPos: THREE.Vector3,
  playerYaw: number,
  targetPos: THREE.Vector3,
  maxRange: number,
): { distance: number; score: number } | null {
  const distance = playerPos.distanceTo(targetPos);
  if (distance > maxRange) return null;

  _playerForward.set(Math.sin(playerYaw), 0, Math.cos(playerYaw));
  _toTarget.subVectors(targetPos, playerPos);
  _toTarget.y = 0;

  if (_toTarget.lengthSq() < 1e-6) {
    return { distance, score: distance * 0.5 };
  }

  _toTarget.normalize();
  const facingDot = _playerForward.dot(_toTarget);
  let facingPenalty =
    facingDot < 0 ? 1.5 + -facingDot : Math.max(0.35, 0.85 - facingDot * 0.5);

  if (distance < maxRange * 0.55) {
    facingPenalty = Math.min(facingPenalty, 0.45);
  }

  return { distance, score: distance * facingPenalty };
}

/** Rapier raycast from player eye to target — returns false when blocked by static geometry. */
export function hasInteractionLineOfSight(
  playerPos: THREE.Vector3,
  targetPos: THREE.Vector3,
): boolean {
  const ctx = getInteractionQueryContext();
  if (!ctx) return true;

  _eye.copy(playerPos);
  _eye.y += FIRST_PERSON_ENABLED ? FIRST_PERSON_EYE_HEIGHT : 1.4;
  _target.copy(targetPos);
  _target.y += 1.0;

  const dx = _target.x - _eye.x;
  const dy = _target.y - _eye.y;
  const dz = _target.z - _eye.z;
  const maxDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (maxDist < 0.05) return true;

  const ray = new ctx.rapier.Ray(
    { x: _eye.x, y: _eye.y, z: _eye.z },
    { x: dx / maxDist, y: dy / maxDist, z: dz / maxDist },
  );

  const hit = ctx.world.castRay(ray, maxDist - 0.2, true);
  return hit === null;
}

function pushZoneTarget(
  hits: InteractionTargetHit[],
  playerPos: THREE.Vector3,
  playerYaw: number,
  zone: TriggerZone,
  checkLos: boolean,
): void {
  _target.set(zone.position[0], zone.position[1], zone.position[2]);
  const range = Math.max(zone.size[0], zone.size[2]) / 2 + ZONE_RANGE_PADDING;
  const scored = scoreInteractionTarget(playerPos, playerYaw, _target, range);
  if (!scored) return;
  if (checkLos && scored.distance > 1.2 && !hasInteractionLineOfSight(playerPos, _target)) return;

  hits.push({
    id: zone.id,
    kind: 'zone',
    distance: scored.distance,
    score: scored.score,
    triggerZoneId: zone.id,
    label: zone.interactionLabel ?? (zone.interactionType ? INTERACTION_LABELS[zone.interactionType] : zone.id),
  });
}

function pushNpcTarget(
  hits: InteractionTargetHit[],
  playerPos: THREE.Vector3,
  playerYaw: number,
  npc: NpcQueryTarget,
  checkLos: boolean,
): void {
  _target.set(npc.position[0], npc.position[1], npc.position[2]);
  const scored = scoreInteractionTarget(playerPos, playerYaw, _target, NPC_MAX_RANGE);
  if (!scored) return;
  if (checkLos && scored.distance > 1.2 && !hasInteractionLineOfSight(playerPos, _target)) return;

  hits.push({
    id: npc.id,
    kind: 'npc',
    distance: scored.distance,
    score: scored.score,
    npcId: npc.npcId,
    label: npc.label,
  });
}

/** Rank interactable zones / NPCs / exits for prompt display and E-key priority. */
export function queryInteractionTargets(
  params: QueryInteractionTargetsParams,
): InteractionTargetHit[] {
  const {
    playerPos,
    playerYaw,
    zones,
    npcs,
    exits = [],
    checkLineOfSight = true,
  } = params;

  const hits: InteractionTargetHit[] = [];

  for (const zone of zones) {
    pushZoneTarget(hits, playerPos, playerYaw, zone, checkLineOfSight);
  }
  for (const npc of npcs) {
    pushNpcTarget(hits, playerPos, playerYaw, npc, checkLineOfSight);
  }
  for (const exit of exits) {
    _target.set(exit.position[0], exit.position[1], exit.position[2]);
    const scored = scoreInteractionTarget(playerPos, playerYaw, _target, exit.maxRange);
    if (!scored) continue;
    if (checkLineOfSight && scored.distance > 1.2 && !hasInteractionLineOfSight(playerPos, _target)) continue;

    hits.push({
      id: exit.id,
      kind: 'exit',
      distance: scored.distance,
      score: scored.score,
      label: exit.label,
    });
  }

  hits.sort((a, b) => a.score - b.score || a.distance - b.distance);
  return hits;
}

/** Pick the best target in scene (used by centralized interact routing). */
export function pickPrimaryInteractionTarget(
  params: QueryInteractionTargetsParams,
): InteractionTargetHit | null {
  const hits = queryInteractionTargets(params);
  return hits[0] ?? null;
}
