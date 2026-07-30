/* ─── Quest definitions referenced from expanded dialogue (Albert deep talk) ─── */

import type { QuestDefinition } from '@/shared/types/game';

export const EXPANSION_QUEST_STUBS: QuestDefinition[] = [
  {
    id: 'act1_albert_alliance',
    title: 'Союз с Альбертом',
    description:
      'Альберт предлагает неформальный союз: обмен информацией, прикрытие в гильдии и доступ к закрытым логам. Володька решает, насколько далеко зайти в этой дружбе.',
    act: 1,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Продолжи глубокий разговор с Альбертом в кафе.',
    objectives: [
      {
        id: 'deep_talk_albert',
        description: 'Продолжить глубокий разговор с Альбертом в кафе',
        type: 'npc_talked',
        target: 'albert',
        completed: false,
      },
      {
        id: 'form_alliance',
        description: 'Закрепить союз с Альбертом',
        type: 'flag_set',
        target: 'act1_albert_alliance_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 10 } },
      { type: 'addXp', value: 60 },
    ],
    linkedStoryNodeId: 'act1_albert_alliance_start',
    questGiverNpcId: 'albert',
  },
  {
    id: 'act2_archive_seven',
    title: 'Архив-7',
    description:
      'Альберт намекает на существование Архива-7 — хранилища стёртых стихов и имён. Нужно собрать улики и найти точку входа, пока гильдия не затёрла след.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['act1_albert_alliance'],
    hint: 'Слушай Альберта о тайном архиве и ищи чип в расширенных нодах.',
    objectives: [
      {
        id: 'find_archive_chip',
        description: 'Найти чип Архива-7',
        type: 'item_collected',
        target: 'archive7_chip',
        completed: false,
      },
      {
        id: 'unlock_archive_truth',
        description: 'Раскрыть правду Архива-7',
        type: 'flag_set',
        target: 'act2_archive_seven_done',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'addXp', value: 100 },
    ],
    linkedStoryNodeId: 'act2_archive_seven_start',
    linkedStoryNodeIds: ['act2_archive_seven_start', 'act2_archive_seven_resolve'],
    questGiverNpcId: 'albert',
  },
];
