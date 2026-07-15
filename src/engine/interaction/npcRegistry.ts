/* ─── Volodka RPG – NPC Group Registry ─── */

import * as THREE from 'three';
import type { NpcBehaviorState } from '@/engine/npc/npcStateMachine';
import { isValidNpcBehaviorTransition } from '@/engine/npc/npcStateMachine';

/**
 * Global registry mapping npcId → THREE.Group ref.
 * This allows the interaction system to look up any NPC's world-space
 * group for position/rotation reads and head-tracking manipulation.
 *
 * Registration is done by the NPC component on mount; unregistered on unmount.
 */

const npcGroupMap = new Map<string, THREE.Group>();
const npcBehaviorStateMap = new Map<string, NpcBehaviorState>();

/** Register an NPC's group ref */
export function registerNPCGroup(npcId: string, group: THREE.Group): void {
  npcGroupMap.set(npcId, group);
  if (!npcBehaviorStateMap.has(npcId)) {
    npcBehaviorStateMap.set(npcId, 'idle');
  }
}

/** Unregister an NPC's group ref (on unmount) */
export function unregisterNPCGroup(npcId: string): void {
  npcGroupMap.delete(npcId);
  npcBehaviorStateMap.delete(npcId);
}

/** Get an NPC's group ref by ID */
export function getNPCGroup(npcId: string): THREE.Group | undefined {
  return npcGroupMap.get(npcId);
}

/** Get all registered NPC IDs */
export function getRegisteredNPCIds(): string[] {
  return Array.from(npcGroupMap.keys());
}

/** Read the current behavioral state for an NPC (defaults to idle). */
export function getNpcBehaviorState(npcId: string): NpcBehaviorState {
  return npcBehaviorStateMap.get(npcId) ?? 'idle';
}

/**
 * Authoritative FSM sync — bypasses transition validation.
 * Used by `useNpcVisualBehavior` so registry matches resolved behavior on both mesh paths.
 */
export function syncNpcBehaviorState(npcId: string, next: NpcBehaviorState): boolean {
  const current = getNpcBehaviorState(npcId);
  if (current === next) return false;
  npcBehaviorStateMap.set(npcId, next);
  return true;
}

/**
 * Transition an NPC's behavioral state when the edge is valid.
 * Returns whether the state changed.
 */
export function setNpcBehaviorState(npcId: string, next: NpcBehaviorState): boolean {
  const current = getNpcBehaviorState(npcId);
  if (current === next) return false;
  if (!isValidNpcBehaviorTransition(current, next)) {
    if (import.meta.env.DEV) {
      console.warn(
        `[npcRegistry] Invalid NPC behavior transition for "${npcId}": ${current} → ${next}`,
      );
    }
    return false;
  }
  npcBehaviorStateMap.set(npcId, next);
  return true;
}

/** Snapshot of all registered NPC behavioral states (debug / minimap overlays). */
export function getNpcBehaviorStateSnapshot(): Readonly<Record<string, NpcBehaviorState>> {
  const snapshot: Record<string, NpcBehaviorState> = {};
  for (const [npcId, state] of npcBehaviorStateMap) {
    snapshot[npcId] = state;
  }
  return snapshot;
}

/** Test hook — clear behavioral state without touching group refs. */
export function resetNpcBehaviorStatesForTests(): void {
  npcBehaviorStateMap.clear();
}

/** Full registry cleanup — call from disposeGameEngine to prevent stale THREE.Group refs during HMR. */
export function clearNpcRegistry(): void {
  npcGroupMap.clear();
  npcBehaviorStateMap.clear();
}
