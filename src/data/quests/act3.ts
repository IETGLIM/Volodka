import type { QuestDefinition } from '@/shared/types/game';

export const QUESTS_ACT3: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════════
     ACT 3 — КОНФЛИКТ: Война за правду
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────────── QUEST 13: Zarema rescue ─────────────── */
  {
    id: 'zarema_rescue',
    title: 'Спасение Заремы',
    description: 'Гильдия арестовала Зарему — она знала слишком много о связи Володьки с Сетью. Теперь её держат в блоке задержания. Вызволить её — значит раскрыть себя. Оставить — значит потерять единственного близкого человека.',
    act: 3,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Охрану можно обойти — если знать правильный стих.',
    timeLimitHours: 6,
    objectives: [
      {
        id: 'learn_zarema_arrested',
        description: 'Узнать о задержании Заремы',
        type: 'flag_set',
        target: 'zarema_arrested',
        completed: false,
      },
      {
        id: 'infiltrate_detention',
        description: 'Проникнуть в блок задержания гильдии',
        type: 'flag_set',
        target: 'detention_breached',
        completed: false,
        poemPowerBypass: 'poem_8',
        poemPowerHint: 'Стихотворение «Прорыв» поможет взломать замок камеры',
      },
      {
        id: 'free_zarema',
        description: 'Освободить Зарему из камеры',
        type: 'flag_set',
        target: 'zarema_rescued',
        completed: false,
      },
      {
        id: 'escape_together',
        description: 'Выбраться из здания гильдии вместе',
        type: 'flag_set',
        target: 'escaped_with_zarema',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'coding', value: 3 },
      { type: 'addSkill', skill: 'empathy', value: 3 },
      { type: 'addKarma', value: 15 },
      { type: 'addXp', value: 200 },
    ],
    linkedStoryNodeId: 'act3_zarema_arrest',
    questGiverNpcId: 'zarema',
  },

  /* ─────────────── QUEST 14: Vault defense ─────────────── */
  {
    id: 'vault_defense',
    title: 'Защита Хранилища',
    description: 'Гильдия обнаружила Хранилище и готовит зачистку. Стихи, архивы, вся память города — под угрозой уничтожения. Нужно защищать то, что осталось, или спасти что сможешь.',
    act: 3,
    faction: 'network',
    questType: 'main',
    difficulty: 'hard',
    hint: 'Без фаервола Хранилище обречено — установи защиту немедленно.',
    timeLimitHours: 4,
    canRetry: true,
    objectives: [
      {
        id: 'receive_vault_alert',
        description: 'Получить сигнал тревоги от Хранилища',
        type: 'flag_set',
        target: 'vault_under_attack',
        completed: false,
      },
      {
        id: 'rally_defenders',
        description: 'Собрать защитников из числа Сети',
        type: 'flag_set',
        target: 'rally_defenders_met',
        completed: false,
      },
      {
        id: 'deploy_firewall',
        description: 'Установить защитный экран на серверы Хранилища',
        type: 'flag_set',
        target: 'vault_firewall_deployed',
        completed: false,
      },
      {
        id: 'hold_the_line',
        description: 'Удержать Хранилище от проникновения гильдии',
        type: 'flag_set',
        target: 'vault_defense_held',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'coding', value: 4 },
      { type: 'addSkill', skill: 'logic', value: 3 },
      { type: 'addKarma', value: 12 },
      { type: 'setFlag', flag: 'vault_defended', flagValue: true },
      { type: 'addXp', value: 200 },
    ],
    linkedStoryNodeId: 'act3_guild_counterattack',
    questGiverNpcId: 'albert',
  },

  /* ─────────────── QUEST 15: Maria truth ─────────────── */
  {
    id: 'maria_truth',
    title: 'Правда Виктории',
    description: 'Кто такая Виктория на самом деле? Её знания слишком точны, её появление — слишком вовремя. Подсказки разбросаны по всему городу. Собери их, прежде чем столкнёшься с ответом, который изменит всё.',
    act: 3,
    faction: 'neutral',
    questType: 'main',
    requiresQuests: ['maria_connection', 'network_initiation'],
    objectives: [
      {
        id: 'find_maria_records',
        description: 'Найти записи о Виктории в архивах Хранилища',
        type: 'flag_set',
        target: 'found_maria_records',
        completed: false,
      },
      {
        id: 'ask_barista_about_maria',
        description: 'Расспросить баристу о прошлом Виктории',
        type: 'npc_talked',
        target: 'cafe_barista',
        completed: false,
      },
      {
        id: 'confront_maria',
        description: 'Предоставить Виктории доказательства и потребовать правду',
        type: 'npc_talked',
        target: 'maria',
        completed: false,
      },
      {
        id: 'accept_truth',
        description: 'Принять правду о природе Виктории',
        type: 'flag_set',
        target: 'maria_truth_revealed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addSkill', skill: 'intuition', value: 5 },
      { type: 'addSkill', skill: 'empathy', value: 3 },
      { type: 'addKarma', value: 10 },
      { type: 'setFlag', flag: 'maria_truth_accepted', flagValue: true },
      { type: 'addXp', value: 200 },
    ],
    linkedStoryNodeId: 'act3_maria_mystery',
    questGiverNpcId: 'maria',
  },

  /* ─────────────── QUEST: Нить из 18 строк ─────────────── */
  {
    id: 'thread_of_18_lines',
    title: 'Нить из 18 строк',
    description: 'Три следа ведут к одной тайне: Великий Сбой 2029, Инцидент #4729 и гул «Прогресс-7» под заводом. Собери нить — и «Заря-М» ответит иначе.',
    act: 3,
    questType: 'side',
    difficulty: 'medium',
    hint: 'Мемориал в парке, расшифровка в офисе и подвал «Хрома-М» — три точки одной истории.',
    // Q-02: Declared dependency on the optional quest that sets basement_hum_heard.
    // Without this, the objective is permanently stuck if the player skipped the
    // optional basement_hum quest in Act 2.
    requiresQuests: ['basement_hum'],
    objectives: [
      {
        id: 'trace_crash',
        description: 'Узнать о Великом Сбое 2029 у мемориала',
        type: 'flag_set',
        target: 'thread_lore_crash',
        completed: false,
      },
      {
        id: 'trace_4729',
        description: 'Связать Инцидент #4729 со стихами в коде',
        type: 'flag_set',
        target: 'thread_lore_4729',
        completed: false,
      },
      {
        id: 'trace_progress7',
        description: 'Услышать гул «Прогресс-7» под заводом',
        type: 'flag_set',
        target: 'basement_hum_heard',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 150 },
      { type: 'addSkill', skill: 'intuition', value: 4 },
      { type: 'addSkill', skill: 'logic', value: 2 },
      { type: 'addKarma', value: 8 },
      { type: 'setFlag', flag: 'thread_18_complete', flagValue: true },
    ],
    linkedStoryNodeId: 'park_entrance',
    questGiverNpcId: undefined,
  },

];
