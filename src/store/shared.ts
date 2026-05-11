/* ─── Volodka RPG – shared store utilities ─── */
/* Common helpers, type definitions, and default state factories
 * used by multiple Zustand slices. Extracted here to avoid duplication. */

import type {
  GameMode,
  PlayerState,
  ExplorationState,
  TrainablePlayerSkill,
  EquipmentSlot,
  InventoryItem,
} from '@/shared/types/game';
import {
  INITIAL_PLAYER_NAME,
  INITIAL_KARMA,
  INITIAL_ENERGY,
  INITIAL_STRESS,
  DEFAULT_SKILLS,
} from '@/data/constants';

/* ─── Helpers ─── */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ─── Notification system ─── */

export type NotificationType = 'karma' | 'skill' | 'energy' | 'stress' | 'poem' | 'quest';

export interface GameNotification {
  id: string;
  type: NotificationType;
  text: string;
  timestamp: number;
}

/** Push a notification to the list, keeping at most maxItems */
export function pushNotification(
  notifications: GameNotification[],
  type: NotificationType,
  text: string,
  maxItems = 5,
): GameNotification[] {
  return [
    ...notifications,
    { id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, text, timestamp: Date.now() },
  ].slice(-maxItems);
}

/* ─── Journal system ─── */

export type JournalTab = 'notes' | 'skills' | 'poems' | 'lore';

export type LoreCategory = 'history' | 'factions' | 'technology' | 'culture' | 'mysteries';

export type LoreRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface LoreEntry {
  id: string;
  title: string;
  category: LoreCategory;
  body: string;
  sceneId: string;
  discoveryScene?: string;
  discoveryCondition?: string;
  rarity: LoreRarity;
  relatedEntries?: string[];
  discovered: boolean;
}

export interface ConversationLogEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

/* ─── Tutorial flags ─── */

export interface TutorialFlags {
  tutorial_seen_movement: boolean;
  tutorial_seen_interact: boolean;
  tutorial_seen_controls: boolean;
  tutorialsDisabled: boolean;
}

/* ─── Poem power cooldown tracking ─── */

export interface PoemPowerState {
  lastUsed: number;
  cooldownMs: number;
}

/* ─── Default state factories ─── */

export function createDefaultPlayerState(): PlayerState {
  return {
    name: INITIAL_PLAYER_NAME,
    skills: { ...DEFAULT_SKILLS },
    karma: INITIAL_KARMA,
    energy: INITIAL_ENERGY,
    stress: INITIAL_STRESS,
    credits: 100,
    inventory: [],
    equippedItems: {
      head: null,
      body: null,
      accessory: null,
    } as Record<EquipmentSlot, InventoryItem | null>,
    flags: {},
    visitedNodes: [],
    choiceLog: [],
    moralChoices: [],
    interactions: [],
    progression: {
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      skillPoints: 0,
      unlockedSkills: [],
      currentAct: 1,
      perkPoints: 0,
      unlockedPerks: [],
    },
  };
}

export function createDefaultExploration(): ExplorationState {
  return {
    currentSceneId: 'volodka_room',
    playerPosition: [0, 0.01, 2],
    playerRotation: 0,
    timeOfDay: 8,
    npcStates: {},
    weatherEnabled: true,
    rainIntensity: 0.7,
  };
}

export function createDefaultTutorialFlags(): TutorialFlags {
  return {
    tutorial_seen_movement: false,
    tutorial_seen_interact: false,
    tutorial_seen_controls: false,
    tutorialsDisabled: false,
  };
}
