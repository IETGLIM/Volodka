/* ─── Quest definitions ─── */

import type { StoryEffect } from '../common/effects';

export type QuestType = 'main' | 'side' | 'hidden' | 'daily';

export interface QuestObjective {
  readonly id: string;
  readonly description: string;
  readonly type:
    | 'location_visited'
    | 'npc_talked'
    | 'item_collected'
    | 'poem_collected'
    | 'flag_set'
    | 'minigame_completed'
    | 'custom';
  readonly target?: string;
  readonly completed: boolean;
  readonly poemPowerBypass?: string;
  readonly poemPowerHint?: string;
}

export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly act?: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  readonly faction?: string;
  readonly questType: QuestType;
  readonly difficulty?: QuestDifficulty;
  readonly hint?: string;
  readonly objectives: QuestObjective[];
  readonly rewards?: StoryEffect[];
  readonly linkedStoryNodeId?: string;
  readonly linkedStoryNodeIds?: string[];
  readonly requiresQuests?: string[];
  readonly timeLimitHours?: number;
  readonly canRetry?: boolean;
  readonly requiredFlag?: string;
  /** Quest stays locked until this poem is collected (hasPoem gate). */
  readonly requiredPoem?: string;
  readonly questGiverNpcId?: string;
  readonly spineOrder?: number;
  readonly rewardItems?: { readonly itemId: string; readonly quantity: number }[];
  /** When set, only show this many uncompleted objectives at a time for
   *  overwhelming quests (e.g. poetry_collection with 22 objectives).
   *  As the player completes objectives, new ones are revealed. */
  readonly progressiveRevealCount?: number;
}
