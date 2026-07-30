/* ─── Hub-connecting side quests (cafe ↔ street ↔ office ↔ CHK ↔ pier) ─── */

import type { QuestDefinition } from '@/shared/types/game';

export const EXPANSION_HUB_QUESTS: QuestDefinition[] = [
  {
    id: 'act2_cafe_office_relay',
    title: 'Кофейный релей',
    description:
      'Бариста в «Синей яме» просит передать запечатанный конверт коллеге в офисе — «не через почту, не через Slack, только ногами». Гильдия сканирует каналы; улица — единственный протокол, которому ещё доверяют.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'easy',
    requiredFlag: 'act2_network_initiation',
    hint: 'Возьми конверт у бариста в кафе и найди коллегу у серверной в офисе.',
    objectives: [
      {
        id: 'take_cafe_envelope',
        description: 'Получить конверт у бариста в кафе',
        type: 'flag_set',
        target: 'cafe_relay_envelope_taken',
        completed: false,
      },
      {
        id: 'deliver_office_envelope',
        description: 'Передать конверт коллеге в офисе',
        type: 'flag_set',
        target: 'cafe_relay_envelope_delivered',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 1 },
      { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
      { type: 'addXp', value: 45 },
    ],
    linkedStoryNodeId: 'act2_cafe_office_relay_start',
    questGiverNpcId: 'cafe_barista',
  },
  {
    id: 'act2_street_chk_samizdat',
    title: 'Уличный самиздат',
    description:
      'Зарема встречает Володьку у ночной скамейки с пачкой листовок — стихи, которых нет в реестре. Нужно донести пакет до костра ЧК, пока патруль «Ока» не сделал обход.',
    act: 2,
    faction: 'tolpa',
    questType: 'side',
    difficulty: 'medium',
    requiredFlag: 'act2_network_initiation',
    hint: 'Зарема у уличной скамейки — затем костёр в ЧК и Басед.',
    objectives: [
      {
        id: 'receive_samizdat',
        description: 'Получить самиздат у Заремы на улице',
        type: 'flag_set',
        target: 'street_samizdat_received',
        completed: false,
      },
      {
        id: 'deliver_chk_samizdat',
        description: 'Передать пакет Баседу у костра ЧК',
        type: 'flag_set',
        target: 'street_samizdat_delivered',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addKarma', value: 4 },
      { type: 'addSkill', skill: 'rhythm', value: 1 },
      { type: 'collectPoem', poemId: 'poem_wall_handwritten' },
      { type: 'addXp', value: 70 },
    ],
    linkedStoryNodeId: 'act2_street_chk_samizdat_start',
    questGiverNpcId: 'zarema',
  },
  {
    id: 'act2_pier_cafe_frequency',
    title: 'Частота кафе',
    description:
      'Трофим на пирсе слышит частоту, которую река несёт с завода. Бариста узнаёт её по стене «Синей ямы» — нужно связать два узла, пока гул не ушёл в шум.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    requiredFlag: 'act2_network_initiation',
    hint: 'Поговори с Трофимом на пирсе, затем — с бариста у стены стихов в кафе.',
    objectives: [
      {
        id: 'hear_pier_frequency',
        description: 'Услышать частоту реки у Трофима',
        type: 'flag_set',
        target: 'pier_frequency_heard',
        completed: false,
      },
      {
        id: 'match_cafe_wall',
        description: 'Сопоставить частоту со стеной стихов в кафе',
        type: 'flag_set',
        target: 'pier_cafe_frequency_matched',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'intuition', value: 2 },
      { type: 'collectPoem', poemId: 'poem_river_frequency' },
      { type: 'discoverLore', loreId: 'lore_frequency_poem' },
      { type: 'addXp', value: 65 },
    ],
    linkedStoryNodeId: 'act2_pier_cafe_frequency_start',
    questGiverNpcId: 'fisherman_trofim',
  },
  {
    id: 'act2_night_city_watch',
    title: 'Ночной дозор',
    description:
      'Альберт просит обойти три точки города — скамейку, пирс, костёр ЧК — и вернуться в кафе с отчётом «на салфетке, не в облаке». Так Сеть проверяет, жив ли релей.',
    act: 2,
    faction: 'network',
    questType: 'side',
    difficulty: 'hard',
    requiresQuests: ['act1_albert_alliance'],
    hint: 'Альберт в кафе — затем улица, пирс, ЧК и снова кафе.',
    objectives: [
      {
        id: 'watch_street_bench',
        description: 'Отметить ночную скамейку',
        type: 'location_visited',
        target: 'street_night',
        completed: false,
      },
      {
        id: 'watch_pier',
        description: 'Проверить пирс перед рассветом',
        type: 'location_visited',
        target: 'river_pier',
        completed: false,
      },
      {
        id: 'watch_chk_campfire',
        description: 'Заглянуть к костру в ЧК',
        type: 'location_visited',
        target: 'chk_forest_zorge',
        completed: false,
      },
      {
        id: 'report_albert_cafe',
        description: 'Вернуться к Альберту в кафе с отчётом',
        type: 'flag_set',
        target: 'night_city_watch_reported',
        completed: false,
      },
    ],
    rewards: [
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
      { type: 'addSkill', skill: 'logic', value: 1 },
      { type: 'addXp', value: 90 },
    ],
    linkedStoryNodeId: 'act2_night_city_watch_start',
    questGiverNpcId: 'albert',
  },
];
