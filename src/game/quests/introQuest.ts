import type { Quest } from '@/game/quests/types';

/** Стартовый модульный квест: взаимодействие `npc_intro` в 3D-обходе. */
export const introQuest: Quest = {
  id: 'intro_quest',
  title: 'First Contact',
  description: 'Talk to the NPC',
  status: 'inactive',
  objectives: [
    {
      id: 'talk_npc',
      description: 'Speak with the NPC',
      type: 'interact',
      targetId: 'npc_intro',
      completed: false,
    },
  ],
};
