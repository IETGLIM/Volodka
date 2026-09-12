import type { QuestDefinition } from '@/shared/types/game';

/**
 * «Эхо пирса» — побочный квест-исследование (Акт 2), v4.25.0, №155.
 *
 * Тема: пирс №3 повторяет то, о чём молчат. Трофим уверен — у эха есть
 * источник, и он не в воде. Квест — исследование: тихий маршрут парком,
 * прослушивание на рассвете, разговор с теми, кто слышит реку дольше нас.
 *
 * Тематически дополняет пак «Голоса Пирса» (pv_*): если тот пак — про
 * голоса, которые ловят НА ленту, то этот — про голос, который ловит
 * ТЕБЯ. Все ID NPC, сцен и предметов сверены с реестрами
 * (allNpcDefinitions, sceneDefinitions, items.ts).
 */
export const PIER_ECHO_QUESTS: QuestDefinition[] = [
  {
    id: 'ep_pier_echo',
    title: 'Эхо пирса',
    description:
      'Трофим знает про пирс №3 такое, чего не напишешь в отчёте гильдии: он повторяет то, о чём молчат. Стоишь над водой, думаешь своё — а через три секунды опоры возвращают это назад, только чуть тише и чуть грустнее. «Гильдия скажет — физика. Физика скажет — гильдия. А я скажу: иди и послушай сам. Только маршрут бери тихий — парком. Эхо стесняется трамвая.»',
    act: 2,
    faction: 'neutral',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Трофим на пирсе → тихий маршрут парком к пирсу → прослушать эхо на рассвете → Ритка на пирсе.',
    objectives: [
      {
        id: 'hear_echo_legend',
        description: 'Выслушать легенду Трофима об эхе пирса',
        type: 'npc_talked',
        target: 'fisherman_trofim',
        completed: false,
      },
      {
        id: 'walk_quiet_route',
        description: 'Пройти к пирсу тихим маршрутом — через парк',
        type: 'location_visited',
        target: 'park_day',
        completed: false,
      },
      {
        id: 'listen_to_echo',
        description: 'Прослушать эхо пирса и записать его на ленту',
        type: 'flag_set',
        target: 'ep_echo_listened',
        completed: false,
      },
      {
        id: 'ask_ritka_about_echo',
        description: 'Спросить Ритку, слышала ли она четвёртый голос',
        type: 'npc_talked',
        target: 'chk_ritka',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addCredits', value: 55 },
      { type: 'addKarma', value: 4 },
      { type: 'addXp', value: 35 },
    ],
    questGiverNpcId: 'fisherman_trofim',
    linkedStoryNodeId: 'ep_pier_echo_start',
  },
];
