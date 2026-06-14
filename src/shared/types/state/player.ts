/* ─── Player runtime state ─── */

import type { EquipmentSlot, InventoryItem } from '../definitions/items';
import type { PlayerSkills } from '../definitions/skills';

export interface PlayerProgression {
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  /** Set of unlocked skill tree node IDs */
  unlockedSkills: string[];
  /** Current act (1 or 2) — gates late-game content */
  currentAct: number;
  /** Perk points — gained every 3 levels (3, 6, 9, etc.) */
  perkPoints: number;
  /** IDs of acquired perks */
  unlockedPerks: string[];
}

export interface PlayerState {
  name: string;
  skills: PlayerSkills;
  karma: number;
  energy: number;
  stress: number;
  credits: number;
  inventory: InventoryItem[];
  equippedItems: Record<EquipmentSlot, InventoryItem | null>;
  flags: Record<string, boolean>;
  visitedNodes: string[];
  /** ISO visit time per story node id (newest-first journal ordering). */
  visitedNodeTimestamps: Record<string, number>;
  choiceLog: string[];
  moralChoices: string[];
  interactions: string[];
  progression: PlayerProgression;
}
