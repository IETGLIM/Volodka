/** After stuck recovery — re-light the nearest NPC interaction ring. */

import { findNpcById } from '@/data/gameDataLoader';
import { eventBus } from '@/engine/EventBus';
import { getNPCGroup, getRegisteredNPCIds } from '@/engine/interaction/npcRegistry';
import { NPC_INTERACTION_QUERY_RANGE } from '@/engine/player/playerConstants';
import { getGameSnapshot } from '@/engine/StateDispatcher';
import * as THREE from 'three';

const _player = new THREE.Vector3();
const _npc = new THREE.Vector3();

export type StuckRecoveryRingFocus = {
  npcId: string;
  distance: number;
  label: string;
};

/**
 * Prefer the recovered target if still registered; otherwise nearest NPC in scene.
 * Returns null when no NPCs are available (empty street, mid-transition).
 */
export function resolveNearestNpcForRingFocus(
  preferredNpcId: string | null,
): StuckRecoveryRingFocus | null {
  let playerPos: [number, number, number] = [0, 0, 0];
  try {
    playerPos = getGameSnapshot().exploration.playerPosition;
  } catch {
    /* tests / early boot */
  }
  _player.set(playerPos[0], playerPos[1], playerPos[2]);

  if (preferredNpcId) {
    const group = getNPCGroup(preferredNpcId);
    if (group) {
      group.getWorldPosition(_npc);
      const distance = _player.distanceTo(_npc);
      return {
        npcId: preferredNpcId,
        distance,
        label: findNpcById(preferredNpcId)?.name ?? preferredNpcId,
      };
    }
  }

  let best: StuckRecoveryRingFocus | null = null;
  for (const npcId of getRegisteredNPCIds()) {
    const group = getNPCGroup(npcId);
    if (!group) continue;
    group.getWorldPosition(_npc);
    const distance = _player.distanceTo(_npc);
    if (!best || distance < best.distance) {
      best = {
        npcId,
        distance,
        label: findNpcById(npcId)?.name ?? npcId,
      };
    }
  }
  return best;
}

/** Emit interaction:hint so InteractionDistanceRing reappears after recovery. */
export function emitStuckRecoveryNpcRingFocus(preferredNpcId: string | null): StuckRecoveryRingFocus | null {
  const focus = resolveNearestNpcForRingFocus(preferredNpcId);
  if (!focus) return null;

  eventBus.emit('interaction:hint', {
    label: focus.label,
    key: 'E',
    description: 'Снова в зоне взаимодействия',
    type: 'npc',
    distance: focus.distance,
    maxRange: Math.max(focus.distance + 0.5, NPC_INTERACTION_QUERY_RANGE),
  });

  const group = getNPCGroup(focus.npcId);
  if (group) {
    group.getWorldPosition(_npc);
    eventBus.emit('camera:look_toward', { x: _npc.x, y: _npc.y, z: _npc.z });
  }

  return focus;
}
