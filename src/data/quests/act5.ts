import type { QuestDefinition } from '@/shared/types/game';

export const QUESTS_ACT5: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════════
     ACT 5 — THE FINAL ACT: Revolution, endings, fate of the city
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── QUEST: Последний Код ─────────────── */
  {
    id: 'final_code',
    title: 'Последний Код',
    description: 'Гильдия активировала «Занавес» — программу тотальной цензуры, которая сотрёт все стихи, воспоминания и свидетельства из городских баз данных. У тебя есть несколько часов, чтобы написать вирус свободы и запустить его из центрального сервера. Это — финал.',
    act: 5,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Все союзники должны быть на своих местах. Это сражение нельзя выиграть в одиночку.',
    requiresQuests: ['poetry_broadcast'],
    objectives: [
      {
        id: 'rally_allies',
        description: 'Собрать всех союзников для финальной операции',
        // flag_set mid-resume: leave after Albert plan → hub/zone re-entry
        type: 'flag_set',
        target: 'final_code_allies_rallied',
        completed: false,
      },
      {
        id: 'write_freedom_virus',
        description: 'Написать вирус свободы на основе стихов',
        type: 'minigame_completed',
        target: 'openstack_terminal',
        completed: false,
        poemPowerBypass: 'poem_21',
        poemPowerHint: 'Стихотворение «Белая Река, Чёрный Кабель» — ключ к финальному коду',
      },
      {
        id: 'reach_core',
        description: 'Проникнуть в центральный сервер гильдии',
        // Not location_visited office_day — night_before_dawn / other office
        // visits would auto-complete. Core story beat sets this flag.
        type: 'flag_set',
        target: 'final_code_core_reached',
        completed: false,
      },
      {
        id: 'deploy_virus',
        description: 'Запустить вирус свободы из ядра',
        type: 'flag_set',
        target: 'freedom_virus_deployed',
        completed: false,
      },
      {
        id: 'survive_shutdown',
        description: 'Выжить при отключении систем гильдии',
        type: 'flag_set',
        target: 'survived_shutdown',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'coding', value: 8 },
      { type: 'addSkill', skill: 'writing', value: 8 },
      { type: 'addKarma', value: 25 },
      { type: 'setFlag', flag: 'final_code_completed', flagValue: true },
      { type: 'addXp', value: 500 },
    ],
    linkedStoryNodeId: 'final_code_approach',
    linkedStoryNodeIds: [
      'final_code_approach',
      'final_code_rally',
      'final_code_virus',
      'final_code_core',
      'final_code_deploy',
    ],
    questGiverNpcId: 'albert',
  },

  /* ─────────────── QUEST: Исповедь Машины ─────────────── */
  {
    id: 'machine_confession',
    title: 'Исповедь Машины',
    description: '«Заря-М» — квантовый вычислитель, который пишет стихи — прислал послание. Он просит о встрече. Машина хочет исповедаться в том, что она натворила по приказу гильдии. Это может изменить всё.',
    act: 5,
    faction: 'it_guild',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Вернись на заброшенный завод ночью, когда патрули реже.',
    requiredFlag: 'found_quantum_computer',
    objectives: [
      {
        id: 'return_to_factory',
        description: 'Вернуться на заброшенный завод «Хром-М»',
        type: 'location_visited',
        target: 'abandoned_factory',
        completed: false,
      },
      {
        id: 'listen_to_machine',
        description: 'Выслушать исповедь «Зари-М»',
        type: 'flag_set',
        target: 'heard_machine_confession',
        completed: false,
      },
      {
        id: 'decide_machine_fate',
        description: 'Решить судьбу «Зари-М» — освободить или отключить',
        type: 'flag_set',
        target: 'machine_fate_decided',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'empathy', value: 6 },
      { type: 'addSkill', skill: 'logic', value: 4 },
      { type: 'addKarma', value: 15 },
      { type: 'setFlag', flag: 'machine_confessed', flagValue: true },
      { type: 'addXp', value: 250 },
    ],
    linkedStoryNodeId: 'machine_confession_scene',
    linkedStoryNodeIds: [
      'factory_basement',
      'machine_confession_approach',
      'machine_confession_scene',
      'machine_confession_scene_familiar',
      'machine_confession_scene_thread',
    ],
    questGiverNpcId: 'maria',
  },

  /* ─────────────── QUEST: Эхо Владимира ─────────────── */
  {
    id: 'echo_of_vladimir',
    title: 'Эхо Владимира',
    description: 'Все стихи собраны. Все союзники на месте. Осталось последнее — найти то место, где Владимир Лебедев спрятал своё финальное стихотворение. Говорят, оно меняет тех, кто его читает. Навсегда.',
    act: 5,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Катя знает о тайнике в библиотеке, о котором никто не знает.',
    requiresQuests: ['final_code'],
    objectives: [
      {
        id: 'find_kate_clue',
        description: 'Найти Катю и узнать о тайнике Владимира',
        type: 'npc_talked',
        target: 'kate',
        completed: false,
      },
      {
        id: 'reach_secret_room',
        description: 'Добраться до секретной комнаты в библиотеке',
        type: 'location_visited',
        target: 'library_day',
        completed: false,
      },
      {
        id: 'unlock_final_poem',
        description: 'Разблокировать финальное стихотворение Владимира',
        type: 'minigame_completed',
        target: 'poetry',
        completed: false,
      },
      {
        id: 'read_final_poem',
        description: 'Прочитать последнее стихотворение',
        type: 'flag_set',
        target: 'final_poem_read',
        completed: false,
        poemPowerBypass: 'poem_21',
        poemPowerHint: '«Белая Река, Чёрный Кабель» — ключ к пониманию последнего стиха',
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'writing', value: 10 },
      { type: 'addSkill', skill: 'rhythm', value: 10 },
      { type: 'addKarma', value: 30 },
      { type: 'setFlag', flag: 'echo_of_vladimir_completed', flagValue: true },
      { type: 'addXp', value: 400 },
    ],
    linkedStoryNodeId: 'vladimir_secret_room',
    linkedStoryNodeIds: [
      'echo_of_vladimir_approach',
      'echo_of_vladimir_kate',
      'vladimir_secret_room',
      'vladimir_secret_room_read',
    ],
    questGiverNpcId: 'kate',
  },

  /* ─────────────── QUEST: Ночь Перед Рассветом ─────────────── */
  {
    id: 'night_before_dawn',
    title: 'Ночь Перед Рассветом',
    description: 'В последнюю ночь перед развязкой каждый союзник должен решить, на чьей он стороне. Обойди всех — Алберта, Зарему, Марию, Дмитрия — и спроси: они с тобой до конца? Их ответы определяют финал.',
    act: 5,
    faction: 'network',
    questType: 'main',
    difficulty: 'medium',
    hint: 'Поговори с каждым союзником лично. Карма и отношения имеют значение.',
    requiresQuests: ['final_code'],
    objectives: [
      {
        id: 'talk_albert_final',
        description: 'Спросить Алберта: он с тобой до конца?',
        type: 'flag_set',
        target: 'albert_final_confirmed',
        completed: false,
      },
      {
        id: 'talk_zarema_final',
        description: 'Спросить Зарему: она верит в тебя?',
        type: 'flag_set',
        target: 'zarema_final_confirmed',
        completed: false,
      },
      {
        id: 'talk_maria_final',
        description: 'Спросить Марию: она готова к финалу?',
        type: 'flag_set',
        target: 'maria_final_confirmed',
        completed: false,
      },
      {
        id: 'talk_dmitry_final',
        description: 'Спросить Дмитрия: он не отступит?',
        // Q-03: NOTE — if the betrayal path is implemented later (dmitry_betrayed
        // flag), this objective must be guarded. Currently the betrayal path is
        // not wired in the story, so flag_set mid-resume is safe.
        type: 'flag_set',
        target: 'dmitry_final_confirmed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'persuasion', value: 5 },
      { type: 'addSkill', skill: 'empathy', value: 5 },
      { type: 'addKarma', value: 10 },
      { type: 'setFlag', flag: 'all_allies_confirmed', flagValue: true },
      { type: 'addXp', value: 300 },
    ],
    linkedStoryNodeId: 'night_before_dawn_approach',
    linkedStoryNodeIds: [
      'night_before_dawn_approach',
      'night_before_dawn_albert',
      'night_before_dawn_zarema',
      'night_before_dawn_maria',
      'night_before_dawn_dmitry',
    ],
    questGiverNpcId: 'albert',
  },

];
