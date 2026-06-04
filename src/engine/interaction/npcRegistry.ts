/* ─── Volodka RPG – NPC Group Registry ─── */

import * as THREE from 'three';

/**
 * Global registry mapping npcId → THREE.Group ref.
 * This allows the interaction system to look up any NPC's world-space
 * group for position/rotation reads and head-tracking manipulation.
 *
 * Registration is done by the NPC component on mount; unregistered on unmount.
 */

const npcGroupMap = new Map<string, THREE.Group>();

/** Register an NPC's group ref */
export function registerNPCGroup(npcId: string, group: THREE.Group): void {
  npcGroupMap.set(npcId, group);
}

/** Unregister an NPC's group ref (on unmount) */
export function unregisterNPCGroup(npcId: string): void {
  npcGroupMap.delete(npcId);
}

/** Get an NPC's group ref by ID */
export function getNPCGroup(npcId: string): THREE.Group | undefined {
  return npcGroupMap.get(npcId);
}

/** Get all registered NPC IDs */
export function getRegisteredNPCIds(): string[] {
  return Array.from(npcGroupMap.keys());
}
