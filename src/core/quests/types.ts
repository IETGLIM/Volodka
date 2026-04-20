export type QuestStatus = 'inactive' | 'active' | 'completed' | 'failed';

export type QuestObjective = {
  id: string;
  description: string;
  type: 'interact' | 'reach' | 'collect';
  targetId?: string;
  requiredCount?: number;
  currentCount?: number;
  completed: boolean;
};

export type Quest = {
  id: string;
  title: string;
  description: string;
  status: QuestStatus;
  objectives: QuestObjective[];
};
