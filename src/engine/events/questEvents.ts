/** Quest lifecycle — QuestTracker, worldSlice, QuestNotificationSystem. */
import type { SceneId } from '@/shared/types/game';

export interface QuestEvents {
  'quest:accepted': { questId: string; questTitle: string };
  'quest:completed': { questId: string; npcId?: string };
  'quest:reward_applied': { questId: string; questTitle: string; xpGained: number; rewards: string[] };
  'quest:failed': {
    questId: string;
    questTitle: string;
    reason?: string;
    canRetry?: boolean;
  };
  'quest:objective_updated': { questId: string; objectiveId: string };
  'quest:retried': { questId: string; questTitle: string };
  'quest:poem_bypass': { questId: string; objectiveId: string; poemId: string };
  'quest:complete_objective': { questId: string; objectiveId: string };
  /** Boost scene quest marker pulse (journal click / travel arrival). */
  'quest:pulse_marker': { questId: string; sceneId?: SceneId };
  'quests:select_quest': { questId: string };
}
