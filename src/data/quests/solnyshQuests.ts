import type { QuestDefinition } from '@/shared/types/game';

export const QUESTS_SOLNYSH: QuestDefinition[] = [
  {
    id: 'solnysh_comfort',
    title: 'Согреть Солныш',
    description: 'Солныш тревожится — как лучшая подруга с детства, она нуждается в поддержке. Напомни ей, что её любят и что всё не так плохо, как кажется.',
    act: 1,
    questType: 'side',
    difficulty: 'easy',
    hint: 'Поговори с Солныш в коридоре (7–12) или в их комнате — выслушай и поддержи.',
    objectives: [
      {
        id: 'talk_solnysh',
        description: 'Поговорить с Солныш',
        type: 'npc_talked',
        target: 'vera',
        completed: false,
      },
      {
        id: 'comfort_solnysh',
        description: 'Успокоить и поддержать Солныш',
        type: 'flag_set',
        target: 'solnysh_comforted',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'empathy', value: 3 },
      { type: 'addKarma', value: 8 },
      { type: 'addXp', value: 60 },
    ],
    linkedStoryNodeId: 'solnysh_room_talk',
    questGiverNpcId: 'vera',
  },

  {
    id: 'solnysh_roof_wine',
    title: 'Вино на крыше',
    description: 'Найди бутылку вина, которую спрятал Лёня, и предложи Алине — Солныш — подняться на крышу: вместе выпить и посмотреть на город.',
    act: 1,
    questType: 'side',
    difficulty: 'medium',
    hint: 'Лёня намекнул на шкаф. Вино — в комнате Солныш. После — предложи прогулку на крышу.',
    objectives: [
      {
        id: 'find_wine',
        description: 'Найти бутылку вина',
        type: 'item_collected',
        target: 'solnysh_wine_bottle',
        completed: false,
      },
      {
        id: 'offer_wine',
        description: 'Предложить Алине вино на крыше',
        type: 'flag_set',
        target: 'solnysh_wine_offered',
        completed: false,
      },
      {
        id: 'roof_toast',
        description: 'Подняться на крышу вместе',
        type: 'flag_set',
        target: 'solnysh_roof_toast_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'addKarma', value: 10 },
      { type: 'addXp', value: 90 },
    ],
    linkedStoryNodeId: 'solnysh_roof_arrival',
    questGiverNpcId: 'vera',
  },

  {
    id: 'solnysh_relocation',
    title: 'Другая страна',
    description: 'Лёня получил предложение работы за границей. Солныш боится, но мечтает. Помоги им решиться и поддержи переезд.',
    act: 1,
    questType: 'side',
    difficulty: 'medium',
    requiredFlag: 'solnysh_roof_toast_done',
    hint: 'Поговори с Солныш после вечера на крыше — спроси о будущем.',
    objectives: [
      {
        id: 'discuss_move',
        description: 'Обсудить переезд с Алиной',
        type: 'npc_talked',
        target: 'vera',
        completed: false,
      },
      {
        id: 'support_move',
        description: 'Поддержать решение о переезде',
        type: 'flag_set',
        target: 'solnysh_relocation_supported',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addKarma', value: 15 },
      { type: 'addXp', value: 120 },
      { type: 'addCredits', value: 50 },
    ],
    linkedStoryNodeId: 'solnysh_relocation_talk',
    questGiverNpcId: 'vera',
  },
];
