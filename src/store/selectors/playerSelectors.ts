/* ─── Volodka RPG – player slice selectors ─── */

import type { PlayerState, TrainablePlayerSkill } from '@/shared/types/game';
import type { GameNotification } from '../shared';
import { getGameStore } from '../gameStore';
import { getVisitedNodeSet } from '../visitedNodesIndex';
import { useGameSelector, useGamePrimitive } from './hooks';

/** Fields used by buildStoryConditionContext — avoids full playerState subscriptions. */
export type StoryConditionPlayerSlice = Pick<
  PlayerState,
  'karma' | 'skills' | 'flags' | 'progression'
>;

/* ─── Plain getters (non-React) ─── */

export const selectPlayerState = (s = getGameStore()): PlayerState => s.playerState;

export const selectPlayerInventory = (s = getGameStore()) => s.playerState.inventory;

export const selectPlayerFlags = (s = getGameStore()) => s.playerState.flags;

export const selectPlayerProgression = (s = getGameStore()) => s.playerState.progression;

export const selectPlayerSkills = (s = getGameStore()) => s.playerState.skills;

export const selectEquippedItems = (s = getGameStore()) => s.playerState.equippedItems;

export const selectNotifications = (s = getGameStore()): GameNotification[] => s.notifications;

/* ─── React hooks ─── */

/** Full player state object — shallow-stable subscription. */
export function usePlayerState(): PlayerState {
  return useGameSelector((s) => s.playerState);
}

export function usePlayerInventory() {
  return useGameSelector((s) => s.playerState.inventory);
}

export function usePlayerFlags() {
  return useGameSelector((s) => s.playerState.flags);
}

export function usePlayerProgression() {
  return useGameSelector((s) => s.playerState.progression);
}

export function usePlayerSkills() {
  return useGameSelector((s) => s.playerState.skills);
}

export function useEquippedItems() {
  return useGameSelector((s) => s.playerState.equippedItems);
}

export function useNotifications() {
  return useGameSelector((s) => s.notifications);
}

export function usePlayerKarma() {
  return useGamePrimitive((s) => s.playerState.karma);
}

export function usePlayerStress() {
  return useGamePrimitive((s) => s.playerState.stress);
}

export function usePlayerEnergy() {
  return useGamePrimitive((s) => s.playerState.energy);
}

export function usePlayerLevel() {
  return useGamePrimitive((s) => s.playerState.progression?.level ?? 1);
}

export function useVisitedNodes() {
  return useGameSelector((s) => s.playerState.visitedNodes);
}

export function useVisitedNodeTimestamps() {
  return useGameSelector((s) => s.playerState.visitedNodeTimestamps);
}

export function useVisitedNodeSet(): ReadonlySet<string> {
  return useGameSelector((s) => getVisitedNodeSet(s.playerState.visitedNodes));
}

/** Composite vitals — shallow compare { energy, stress, karma }. */
export function useVitalStats() {
  return useGameSelector((s) => ({
    energy: s.playerState.energy,
    stress: s.playerState.stress,
    karma: s.playerState.karma,
  }));
}

export function usePlayerSkill(skill: TrainablePlayerSkill) {
  return useGamePrimitive((s) => s.playerState.skills[skill]);
}

/** Story/dialogue condition inputs only — not inventory, equipment, etc. */
export function useStoryConditionPlayerSlice(): StoryConditionPlayerSlice {
  return useGameSelector((s) => ({
    karma: s.playerState.karma,
    skills: s.playerState.skills,
    flags: s.playerState.flags,
    progression: s.playerState.progression,
  }));
}

export function usePlayerCurrentAct() {
  return useGamePrimitive((s) => s.playerState.progression.currentAct);
}

export function usePlayerCredits() {
  return useGamePrimitive((s) => s.playerState.credits);
}

export function useProgressionSummary() {
  return useGameSelector((s) => ({
    level: s.playerState.progression.level,
    xp: s.playerState.progression.xp,
    xpToNextLevel: s.playerState.progression.xpToNextLevel,
    unlockedPerks: s.playerState.progression.unlockedPerks,
  }));
}

/** Alias — prefer usePlayerInventory in new code. */
export const useInventory = usePlayerInventory;
