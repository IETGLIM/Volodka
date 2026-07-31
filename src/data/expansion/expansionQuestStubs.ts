/* ─── Quest definitions referenced from expanded dialogue (Albert deep talk) ─── */

import type { QuestDefinition } from '@/shared/types/game';

export const EXPANSION_QUEST_STUBS: QuestDefinition[] = [
  {
    id: 'act1_albert_alliance',
    title: 'Союз с Альбертом',
    description:
      'Альберт предлагает неформальный союз: обмен информацией, прикрытие в гильдии и доступ к закрытым логам. Это не подпись — расследование: условия, проверка на улице, возврат в кафе и закрепление доверия.',
    act: 1,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Кафе → условия союза → улица (слушать) → снова «Синяя яма» → закрепить с Альбертом.',
    objectives: [
      {
        id: 'accept_alliance_brief',
        description: 'Принять предложение союза и выслушать условия',
        type: 'flag_set',
        target: 'act1_albert_alliance_active',
        completed: false,
      },
      {
        id: 'agree_alliance_terms',
        description: 'Согласовать правила обмена и прикрытия',
        type: 'flag_set',
        target: 'act1_albert_terms_agreed',
        completed: false,
      },
      {
        id: 'listen_street_for_albert',
        description: 'Проверить улицу — убедиться, что никто не слушает',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'return_cafe_seal',
        description: 'Вернуться в «Синюю яму» для закрепления',
        type: 'location_visited',
        target: 'cafe_evening',
        completed: false,
      },
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
      { type: 'addSkill', skill: 'persuasion', value: 1 },
    ],
    linkedStoryNodeId: 'act1_albert_alliance_start',
    linkedStoryNodeIds: [
      'act1_albert_alliance_start',
      'act1_albert_alliance_terms',
      'act1_albert_alliance_street',
      'act1_albert_alliance_seal',
    ],
    questGiverNpcId: 'albert',
  },
  {
    id: 'act2_archive_seven',
    title: 'Архив-7',
    description:
      'Альберт намекает на Архив-7 — хранилище стёртых стихов и имён. Точка входа — не дверь: три следа (костёр ЧК, стена кафе, серверная), затем чип и checksum правды.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['act1_albert_alliance'],
    hint: 'Альберт → костёр ЧК → стена «Синей ямы» → серверная офиса → чип → раскрытие.',
    objectives: [
      {
        id: 'hear_archive_brief',
        description: 'Услышать от Альберта схему трёх следов Архива-7',
        type: 'flag_set',
        target: 'act2_archive_seven_active',
        completed: false,
      },
      {
        id: 'trace_chk_campfire',
        description: 'Снять след у костра ЧК',
        type: 'location_visited',
        target: 'chk_forest_zorge',
        completed: false,
      },
      {
        id: 'trace_cafe_wall',
        description: 'Снять след со стены стихов в кафе',
        type: 'location_visited',
        target: 'cafe_evening',
        completed: false,
      },
      {
        id: 'trace_office_server',
        description: 'Снять след в серверной офиса',
        type: 'location_visited',
        target: 'office_day',
        completed: false,
      },
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
      { type: 'discoverLore', loreId: 'lore_archive_seven_truth' },
    ],
    linkedStoryNodeId: 'act2_archive_seven_start',
    linkedStoryNodeIds: [
      'act2_archive_seven_start',
      'act2_archive_seven_chk_trace',
      'act2_archive_seven_cafe_trace',
      'act2_archive_seven_resolve',
    ],
    questGiverNpcId: 'albert',
  },
];
