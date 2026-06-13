import type { SceneId } from '@/shared/types/game';

/** Guided story progression — GuidedStoryManager, StoryGuidanceHUD, GameOrchestrator. */
export interface StoryEvents {
  'story:guidance_update': {
    objectiveText: string;
    objectiveType: 'talk_to_npc' | 'visit_location' | 'complete_quest' | 'collect_item' | 'make_choice';
    targetId: string;
    urgency: 'optional' | 'recommended' | 'required';
    actNumber: number;
    chapterTitle: string;
    targetSceneId?: SceneId;
  };  'story:act_transition': { fromAct: number; toAct: number; chapterTitle: string };
  'story:quest_available': { questId: string; questTitle: string; questType: string; npcId?: string };
  'story:quest_chain_unlock': {
    completedQuestId: string;
    completedQuestTitle: string;
    nextQuestId: string;
    nextQuestTitle: string;
    nextQuestType: string;
    npcId?: string;
    actNumber: number;
  };
}
