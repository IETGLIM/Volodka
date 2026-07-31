import * as THREE from 'three';
import { INTERACTION_LABELS, type TriggerZone } from '@/data/triggerZones';
import { FIRST_PERSON_ENABLED, FIRST_PERSON_EYE_HEIGHT } from '@/engine/camera/cameraConstants';
import { getInteractionQueryContext, type InteractionQueryContext } from '@/engine/interaction/interactionQueryContext';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import {
  INTERACTION_IN_RANGE_FRACTION,
  NPC_INTERACTION_QUERY_RANGE,
} from '@/engine/player/playerConstants';
export type InteractionTargetKind = 'zone' | 'npc' | 'exit';

export interface InteractionTargetHit {
  id: string;
  kind: InteractionTargetKind;
  distance: number;
  /** Lower is better (distance × facing penalty). */
  score: number;
  /** Metres used for the proximity score — approach UX ring. */
  maxRange: number;
  npcId?: string;
  triggerZoneId?: string;
  label: string;
}

export interface NpcQueryTarget {
  id: string;
  npcId: string;
  position: [number, number, number];
  label: string;
  /** Schedule activity — shown as hint subtitle when approaching NPC. */
  activity?: string;
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
const _npcLivePos = new THREE.Vector3();

/** H4: Reusable Ray object to avoid per-NPC per-frame allocation. */
let _reusableRay: InstanceType<InteractionQueryContext['rapier']['Ray']> | null = null;
let _reusableRayRapier: InteractionQueryContext['rapier'] | null = null;

/** H4: Frame counter for LOS throttle — check every 3rd frame. */
let _losFrameCounter = 0;

/**
 * Advance the LOS throttle once per render/interaction frame.
 * Must NOT be called from every `queryInteractionTargets` — prompts and E-key
 * both query in the same frame and would desync the "every 3rd frame" gate.
 */
export function beginInteractionQueryFrame(): void {
  _losFrameCounter++;
}

/** Prefer live NPC group world position over schedule anchor when registered. */
export function resolveNpcWorldPosition(
  npcId: string,
  schedulePos: [number, number, number],
): [number, number, number] {
  const group = getNPCGroup(npcId);
  if (!group) return schedulePos;
  group.getWorldPosition(_npcLivePos);
  return [_npcLivePos.x, _npcLivePos.y, _npcLivePos.z];
}

const NPC_MAX_RANGE = NPC_INTERACTION_QUERY_RANGE;
const ZONE_RANGE_PADDING = 1.55;

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

  if (distance < maxRange * INTERACTION_IN_RANGE_FRACTION) {
    facingPenalty = Math.min(facingPenalty, 0.45);
  }

  return { distance, score: distance * facingPenalty };
}

/** Mutable Rapier ray fields — API uses `dir`, not `direction`. */
type MutableRapierRay = {
  origin?: { x: number; y: number; z: number };
  dir?: { x: number; y: number; z: number };
};

/** H4: Rapier raycast from player eye to target — returns false when blocked by static geometry.
 *  Uses a reusable Ray object and 3-frame throttle to reduce per-NPC allocations + raycasts. */
export function hasInteractionLineOfSight(
  playerPos: THREE.Vector3,
  targetPos: THREE.Vector3,
): boolean {
  const ctx = getInteractionQueryContext();
  if (!ctx) return true;

  // H4: Throttle — assume clear LOS on 2 out of 3 frames.
  if (_losFrameCounter % 3 !== 0) return true;

  _eye.copy(playerPos);
  _eye.y += FIRST_PERSON_ENABLED ? FIRST_PERSON_EYE_HEIGHT : 1.4;
  _target.copy(targetPos);
  _target.y += 1.0;

  const dx = _target.x - _eye.x;
  const dy = _target.y - _eye.y;
  const dz = _target.z - _eye.z;
  const maxDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (maxDist < 0.05) return true;

  const invDist = 1 / maxDist;
  const ox = _eye.x;
  const oy = _eye.y;
  const oz = _eye.z;
  const dirX = dx * invDist;
  const dirY = dy * invDist;
  const dirZ = dz * invDist;

  // H4: Reuse cached Ray. Rapier.Ray exposes `dir` (not `direction`) — writing
  // `ray.direction.x` threw every throttled frame: Cannot set properties of
  // undefined (setting 'x') → crash loop in the physics-scene chunk.
  const ray = _reusableRay as MutableRapierRay | null;
  if (
    ray &&
    _reusableRayRapier === ctx.rapier &&
    ray.origin &&
    ray.dir
  ) {
    ray.origin.x = ox;
    ray.origin.y = oy;
    ray.origin.z = oz;
    ray.dir.x = dirX;
    ray.dir.y = dirY;
    ray.dir.z = dirZ;
  } else {
    try {
      _reusableRay = new ctx.rapier.Ray(
        { x: ox, y: oy, z: oz },
        { x: dirX, y: dirY, z: dirZ },
      );
      _reusableRayRapier = ctx.rapier;
    } catch {
      // World/Ray unavailable during teardown — treat as clear LOS.
      _reusableRay = null;
      _reusableRayRapier = null;
      return true;
    }
  }

  try {
    const hit = ctx.world.castRay(_reusableRay, maxDist - 0.2, true);
    return hit === null;
  } catch {
    // Disposed world during scene transition — skip LOS for this frame.
    return true;
  }
}

/** Clear cached LOS ray when the Rapier world unregisters (scene teardown). */
export function clearInteractionLineOfSightCache(): void {
  _reusableRay = null;
  _reusableRayRapier = null;
}

function pushZoneTarget(
  hits: InteractionTargetHit[],
  playerPos: THREE.Vector3,
  playerYaw: number,
  zone: TriggerZone,
  _checkLos: boolean,
): void {
  _target.set(zone.position[0], zone.position[1], zone.position[2]);
  const range = Math.max(zone.size[0], zone.size[2]) / 2 + ZONE_RANGE_PADDING;
  const scored = scoreInteractionTarget(playerPos, playerYaw, _target, range);
  if (!scored) return;
  // Trigger zones sit on furniture/walls — Rapier LOS falsely blocks desk, shelf, etc.

  hits.push({
    id: zone.id,
    kind: 'zone',
    distance: scored.distance,
    score: scored.score,
    maxRange: range,
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
  const livePos = resolveNpcWorldPosition(npc.npcId, npc.position);
  _target.set(livePos[0], livePos[1], livePos[2]);
  const scored = scoreInteractionTarget(playerPos, playerYaw, _target, NPC_MAX_RANGE);
  if (!scored) return;
  if (checkLos && scored.distance > 1.2 && !hasInteractionLineOfSight(playerPos, _target)) return;

  hits.push({
    id: npc.id,
    kind: 'npc',
    distance: scored.distance,
    score: scored.score,
    maxRange: NPC_MAX_RANGE,
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
      maxRange: exit.maxRange,
      label: exit.label,
    });
  }

  hits.sort((a, b) => {
    const scoreDelta = a.score - b.score;
    if (Math.abs(scoreDelta) > 1e-4) return scoreDelta;
    const distDelta = a.distance - b.distance;
    if (Math.abs(distDelta) > 1e-4) return distDelta;
    // Near-ties: prefer NPCs (dialogue focus) over zones/exits for E-key.
    const kindRank = (k: InteractionTargetKind): number =>
      k === 'npc' ? 0 : k === 'zone' ? 1 : 2;
    return kindRank(a.kind) - kindRank(b.kind);
  });
  return hits;
}

/** Pick the best target in scene (used by centralized interact routing). */
export function pickPrimaryInteractionTarget(
  params: QueryInteractionTargetsParams,
): InteractionTargetHit | null {
  const hits = queryInteractionTargets(params);
  return hits[0] ?? null;
}
