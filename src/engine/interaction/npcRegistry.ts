/* ─── Volodka RPG – NPC Group Registry ─── */

import { Group } from 'three';
import type { NpcBehaviorState } from '@/engine/npc/npcStateMachine';
import { isValidNpcBehaviorTransition } from '@/engine/npc/npcStateMachine';
import { getGameSnapshot } from '@/engine/StateDispatcher';

import { devWarn } from '@/shared/utils/devLog';
/**
 * Global registry mapping npcId → { group, sceneId }.
 * This allows the interaction system to look up any NPC's world-space
 * group for position/rotation reads and head-tracking manipulation.
 *
 * Registration is done by the NPC component on mount; unregistered on unmount.
 * The sceneId guards against cross-scene contamination during transitions:
 * if an NPC group from a previous scene hasn't unmounted yet, queries for
 * the current scene won't pick up the stale ref.
 */

interface NpcGroupEntry {
  group: Group;
  sceneId: string;
}

const npcGroupMap = new Map<string, NpcGroupEntry>();
const npcBehaviorStateMap = new Map<string, NpcBehaviorState>();

/** Register an NPC's group ref with its owning scene. */
export function registerNPCGroup(npcId: string, group: Group, sceneId: string): void {
  npcGroupMap.set(npcId, { group, sceneId });
  if (!npcBehaviorStateMap.has(npcId)) {
    npcBehaviorStateMap.set(npcId, 'idle');
  }
}

/** Unregister an NPC's group ref (on unmount) */
export function unregisterNPCGroup(npcId: string): void {
  npcGroupMap.delete(npcId);
  npcBehaviorStateMap.delete(npcId);
}

/** Get an NPC's group ref by ID, only if it belongs to the current scene. */
export function getNPCGroup(npcId: string): Group | undefined {
  const entry = npcGroupMap.get(npcId);
  if (!entry) return undefined;
  // Skip stale groups from a different scene (cross-scene contamination guard).
  const currentSceneId = getGameSnapshot().exploration.currentSceneId;
  if (entry.sceneId !== currentSceneId) return undefined;
  return entry.group;
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
      devWarn(
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

/** Full registry cleanup — call from disposeGameEngine to prevent stale Group refs during HMR. */
export function clearNpcRegistry(): void {
  npcGroupMap.clear();
  npcBehaviorStateMap.clear();
}
