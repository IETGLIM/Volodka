/** Quest lifecycle — QuestTracker, worldSlice, QuestNotificationSystem. */
export interface QuestEvents {
  'quest:accepted': { questId: string; questTitle: string };
  'quest:completed': { questId: string; npcId?: string };
  'quest:reward_applied': { questId: string; questTitle: string; xpGained: number; rewards: string[] };
  'quest:failed': { questId: string; reason: string };
  'quest:objective_updated': { questId: string; objectiveId: string };
  'quest:poem_bypass': { questId: string; objectiveId: string; poemId: string };
  'quest:complete_objective': { questId: string; objectiveId: string };
}
