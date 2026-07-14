/* ─── Story effects and combat side effects ─── */

import type { SceneId } from '@/config/sceneDefinitions';
import type { TrainablePlayerSkill } from '../definitions/skills';

export type StoryEffectType =
  | 'addStat'
  | 'addSkill'
  | 'addItem'
  | 'removeItem'
  | 'setFlag'
  | 'addKarma'
  | 'addXp'
  | 'addCredits'
  | 'npcChange'
  | 'triggerQuest'
  | 'collectPoem'
  | 'discoverLore'
  | 'combat'
  | 'transitionScene'
  | 'visitStoryNode'
  | 'showThought'
  | 'openDataTerminal';

export interface StoryEffect {
  type: StoryEffectType;
  stat?: string;
  value?: number;
  skill?: TrainablePlayerSkill;
  itemId?: string;
  flag?: string;
  flagValue?: boolean;
  npcId?: string;
  npcChange?: { relation?: number };
  questId?: string;
  poemId?: string;
  /** Lore entry ID(s) to discover — can be a single ID or comma-separated list */
  loreId?: string;
  /** Enemy type for combat trigger (e.g. 'system_daemon') */
  enemyType?: string;
  /** Target scene for transitionScene effect */
  sceneId?: SceneId;
  /** Story spine node id for visitStoryNode effect */
  nodeId?: string;
  /** Thought text for showThought effect (inner monologue) */
  thought?: string;
  /** Custom duration in ms for showThought effect (default 4000) */
  thoughtDuration?: number;
  /** Terminal difficulty for openDataTerminal effect */
  terminalDifficulty?: 'easy' | 'medium' | 'hard';
  /** Terminal title for openDataTerminal effect */
  terminalTitle?: string;
  /** Terminal reward description for openDataTerminal effect */
  terminalReward?: string;
}

/** Side effects emitted by execute() functions that should be applied to the
 *  Zustand store after the combat state transition is computed. */
export type SideEffect =
  | { type: 'addEnergy'; value: number }
  | { type: 'addKarma'; value: number }
  | { type: 'addStress'; value: number }
  | { type: 'addSkill'; skill: string; value: number }
  | { type: 'addXp'; value: number }
  | { type: 'setCombatActive'; active: boolean }
  | { type: 'addPoemPower'; poemId: string };

/** @deprecated Use StoryEffect — retained for trigger-zone content during migration. */
export type GameEffect = StoryEffect;
