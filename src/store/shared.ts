/* ─── Volodka RPG – shared store utilities ─── */
/* Common helpers, type definitions, and default state factories
 * used by multiple Zustand slices. Extracted here to avoid duplication. */

import type {
  PlayerState,
  PlayerProgression,
  ExplorationState,
  EquipmentSlot,
  InventoryItem } from '@/shared/types/game';
import { createInventoryItem } from '@/data/items';
import {
  INITIAL_PLAYER_NAME,
  INITIAL_KARMA,
  INITIAL_ENERGY,
  INITIAL_STRESS,
  DEFAULT_SKILLS } from '@/data/constants';

/* ─── Helpers ─── */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* ─── XP / leveling ─── */

export const MAX_LEVEL = 50;

export function calculateXpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

export interface XpGainResult {
  progression: PlayerProgression;
  prevLevel: number;
  levelsGained: number;
  perkPointsGained: number;
  perkPointGained: boolean;
  leveledUp: boolean;
}

/** Apply XP to progression state; callers handle notifications and eventBus. */
export function applyXpGain(prog: PlayerProgression, amount: number): XpGainResult {
  const prevLevel = prog.level;
  let newXp = prog.xp + amount;
  let newLevel = prevLevel;
  let newXpToNext = prog.xpToNextLevel;
  let newSkillPoints = prog.skillPoints;
  let newPerkPoints = prog.perkPoints;
  let perkPointsGained = 0;

  while (newXp >= newXpToNext && newLevel < MAX_LEVEL) {
    newXp -= newXpToNext;
    newLevel += 1;
    newSkillPoints += 1;
    if (newLevel % 3 === 0) {
      newPerkPoints += 1;
      perkPointsGained += 1;
    }
    newXpToNext = calculateXpToNextLevel(newLevel);
  }

  const levelsGained = newLevel - prevLevel;

  return {
    progression: {
      ...prog,
      level: newLevel,
      xp: newXp,
      xpToNextLevel: newXpToNext,
      skillPoints: newSkillPoints,
      perkPoints: newPerkPoints },
    prevLevel,
    levelsGained,
    perkPointsGained,
    perkPointGained: perkPointsGained > 0,
    leveledUp: levelsGained > 0 };
}

/* ─── Notification system ─── */

export type { NotificationType, GameNotification } from '@/shared/types/notifications';
export type { NarrativeKind } from '@/shared/types/narrativeKind';
import type { GameNotification, NotificationType } from '@/shared/types/notifications';

let notificationCounter = 0;

/** Push a notification to the list, keeping at most maxItems */
export function pushNotification(
  notifications: GameNotification[],
  type: NotificationType,
  text: string,
  maxItems = 5,
): GameNotification[] {
  return [
    ...notifications,
    { id: `${type}-${Date.now()}-${++notificationCounter}`, type, text, timestamp: Date.now() },
  ].slice(-maxItems);
}

/* ─── Journal system ─── */

export type JournalTab = 'notes' | 'skills' | 'poems' | 'lore' | 'thoughts';

/** Single entry in Volodka's thought history (FIFO, max 50). */
export interface ThoughtHistoryEntry {
  id: string;
  text: string;
  timestamp: number;
  sceneId: string;
}

export type { LoreCategory, LoreRarity } from '@/shared/types/lore';
import type { LoreCategory, LoreRarity } from '@/shared/types/lore';

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

/* ─── Thought history helpers ─── */

const MAX_THOUGHT_HISTORY = 50;

/** Push a thought entry, keeping at most MAX_THOUGHT_HISTORY items (FIFO). */
export function pushThoughtEntry(
  history: ThoughtHistoryEntry[],
  text: string,
  sceneId: string,
): ThoughtHistoryEntry[] {
  return [
    ...history,
    {
      id: `thought-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      timestamp: Date.now(),
      sceneId,
    },
  ].slice(-MAX_THOUGHT_HISTORY);
}

/* ─── Tutorial flags ─── */

export interface TutorialFlags {
  tutorial_seen_movement: boolean;
  tutorial_seen_interact: boolean;
  tutorial_seen_controls: boolean;
  tutorial_seen_poem_power: boolean;
  tutorial_seen_combat: boolean;
  tutorial_seen_quest_board: boolean;
  tutorialsDisabled: boolean;
  tutorialsCompleted: boolean;
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
    inventory: [
      createInventoryItem('coffee', 2),
      createInventoryItem('tea', 1),
      createInventoryItem('lighter', 1),
      createInventoryItem('scraps', 3),
      createInventoryItem('usb_drive', 1),
    ],
    equippedItems: {
      head: null,
      body: null,
      accessory: null } as Record<EquipmentSlot, InventoryItem | null>,
    flags: {},
    visitedNodes: [],
    visitedNodeTimestamps: {},
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
      unlockedPerks: [] },
    rngSeed: (Date.now() ^ Math.imul(0x9e3779b9, 1)) >>> 0,
    combatEncounterSeq: 0 };
}

export function createDefaultExploration(): ExplorationState {
  return {
    currentSceneId: 'volodka_room',
    playerPosition: [0, 0.01, 2],
    playerRotation: 0,
    timeOfDay: 8,
    npcStates: {},
  };
}

export function createDefaultTutorialFlags(): TutorialFlags {
  return {
    tutorial_seen_movement: false,
    tutorial_seen_interact: false,
    tutorial_seen_controls: false,
    tutorial_seen_poem_power: false,
    tutorial_seen_combat: false,
    tutorial_seen_quest_board: false,
    tutorialsDisabled: false,
    tutorialsCompleted: false };
}

/* ─── Cross-slice type composition ─── */
/* GameStoreState and per-slice read contracts live in ./types.ts and
 * ./crossSliceReads.ts to avoid circular imports in this utilities module. */
