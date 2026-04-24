import type { SceneId } from '@/data/types';

export type QuestEventType =
  | 'poem_collected'
  | 'poem_written'
  | 'npc_talked'
  | 'location_visited'
  | 'item_collected'
  | 'terminal_used'
  | 'choice_made'
  | 'quest_completed';

export interface QuestEvent {
  type: QuestEventType;
  data: {
    poemId?: string;
    npcId?: string;
    locationId?: SceneId;
    itemId?: string;
    choiceId?: string;
    questId?: string;
    [key: string]: unknown;
  };
}
