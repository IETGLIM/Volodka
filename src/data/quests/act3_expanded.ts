import type { QuestDefinition } from '@/shared/types/game';

export const QUESTS_ACT3_EXPANDED: QuestDefinition[] = [
  /* ═══════════════════════════════════════════════════════════════════
     РАСШИРЕННЫЕ КВЕСТЫ АКТА 3
     ═══════════════════════════════════════════════════════════════════ */

  /* ─────────── КВЕСТ: Тень Смотрящего ─────────── */
  {
    id: 'watchers_shadow',
    title: 'Тень Смотрящего',
    description: 'Кто-то слушает весь город. Каждый разговор, каждое сообщение, каждый шёпот — всё фиксируется и уходит в неизвестный узел сети. Контакт из Сети передал координаты: точка перехвата скрыта в старом телекоммуникационном шкафу на окраине промзоны. Найди узел, взломай его и забери данные — прежде чем Смотрящий заметит, что за ним следят.',
    act: 3,
    faction: 'network',
    questType: 'side',
    difficulty: 'medium',
    hint: 'Телекоммуникационный шкаф спрятан за вентиляционной решёткой на третьем уровне промзоны. Для взлома понадобится навык кодирования не ниже 6.',
    objectives: [
      {
        id: 'find_surveillance_node',
        description: 'Найти узел слежения в промзоне',
        type: 'location_visited' as const,
        target: 'guild_mainframe',
        completed: false,
      },
      {
        id: 'hack_surveillance_node',
        description: 'Взломать узел перехвата',
        type: 'flag_set' as const,
        target: 'surveillance_node_hacked',
        completed: false,
      },
      {
        id: 'retrieve_surveillance_data',
        description: 'Извлечь данные из узла',
        type: 'item_collected' as const,
        target: 'surveillance_data_chip',
        completed: false,
      },
      {
        id: 'report_to_surveillance_contact',
        description: 'Доложить контакту из Сети',
        type: 'npc_talked' as const,
        target: 'surveillance_contact',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 150 },
      { type: 'addCredits', value: 60 },
      { type: 'addSkill', skill: 'coding', value: 3 },
      { type: 'addKarma', value: 5 },
      { type: 'setFlag', flag: 'watchers_shadow_complete', flagValue: true },
    ],
    questGiverNpcId: 'surveillance_contact',
  },

  /* ─────────── КВЕСТ: Ржавые Ключи ─────────── */
  {
    id: 'rusty_keys',
    title: 'Ржавые Ключи',
    description: 'В парке сидит старик — каждый день на одной и той же скамье. Он не бродяга, нет — в его глазах ещё живёт что-то древнее этой промзоны. Он потерял ключи от подземного убежища, куда уходили его предки. Ключ расколот на три фрагмента, разбросанных по всему району. Верни их старику — и, может быть, он откроет тебе дверь, за которой хранится память о мире до Катастрофы.',
    act: 3,
    questType: 'side',
    difficulty: 'easy',
    hint: 'Фрагменты ключей часто находят в заброшенных посылочных ячейках, под обломками старых киосков и в щелях между бетонными плитами у входа в промзону.',
    objectives: [
      {
        id: 'talk_to_park_old_man',
        description: 'Поговорить со стариком в парке',
        type: 'npc_talked' as const,
        target: 'park_old_man',
        completed: false,
      },
      {
        id: 'find_key_fragment_1',
        description: 'Найти первый фрагмент ключа',
        type: 'item_collected' as const,
        target: 'key_fragment_1',
        completed: false,
      },
      {
        id: 'find_key_fragment_2',
        description: 'Найти второй фрагмент ключа',
        type: 'item_collected' as const,
        target: 'key_fragment_2',
        completed: false,
      },
      {
        id: 'find_key_fragment_3',
        description: 'Найти третий фрагмент ключа',
        type: 'item_collected' as const,
        target: 'key_fragment_3',
        completed: false,
      },
      {
        id: 'return_keys_to_old_man',
        description: 'Вернуть собранные ключи старику',
        type: 'npc_talked' as const,
        target: 'park_old_man',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 100 },
      { type: 'addKarma', value: 8 },
      { type: 'addSkill', skill: 'empathy', value: 2 },
      { type: 'setFlag', flag: 'rusty_keys_returned', flagValue: true },
    ],
    questGiverNpcId: 'park_old_man',
  },

  /* ─────────── КВЕСТ: Последнее Стих (side quest — dying poet → Elena) ── */
  /* NOTE: renamed from `last_poem` to `dying_poet_last_letter` to avoid
     id collision with the golden-path `last_poem` quest in act4.ts. */
  {
    id: 'dying_poet_last_letter',
    title: 'Последнее Стих',
    description: 'В читальном зале библиотеки, за последним стеллажом, лежит человек, которого забыли все кроме смерти. Поэт — последний из тех, кто помнит, как стихи были оружием. Он написал своё последнее произведение: не для публикаций, не для Сети — для одного человека. Человека, которого он предал тридцать лет назад. У него нет сил встать. У него есть только этот листок и имя.',
    act: 3,
    questType: 'side',
    difficulty: 'easy',
    hint: 'Поэт укажет имя и место. Человек, которого ищешь, может не хотеть тебя видеть — приготовь аргументы.',
    objectives: [
      {
        id: 'talk_to_dying_poet',
        description: 'Поговорить с умирающим поэтом в библиотеке',
        type: 'npc_talked' as const,
        target: 'dying_poet',
        completed: false,
      },
      {
        id: 'read_the_last_poem',
        description: 'Прочитать последний стих',
        type: 'flag_set' as const,
        target: 'last_poem_read',
        completed: false,
      },
      {
        id: 'find_poem_recipient',
        description: 'Найти адресата стихотворения',
        type: 'npc_talked' as const,
        target: 'poem_recipient_elena',
        completed: false,
      },
      {
        id: 'deliver_poem_to_recipient',
        description: 'Передать стих адресату',
        type: 'npc_talked' as const,
        target: 'poem_recipient_elena',
        completed: false,
      },
      {
        id: 'return_to_poet',
        description: 'Вернуться к поэту с ответом',
        type: 'npc_talked' as const,
        target: 'dying_poet',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 120 },
      { type: 'addKarma', value: 10 },
      { type: 'addSkill', skill: 'empathy', value: 3 },
      { type: 'addSkill', skill: 'writing', value: 2 },
      { type: 'setFlag', flag: 'last_poem_delivered', flagValue: true },
    ],
    questGiverNpcId: 'dying_poet',
  },

  /* ─────────── КВЕСТ: Ночной Сдвиг ─────────── */
  {
    id: 'night_shift',
    title: 'Ночной Сдвиг',
    description: 'Ночью завод «Прогресс-7» оживает — но не так, как днём. Данные-фантомы, осколки коррумпированных программ, стекаются в подвал и пульсируют в темноте, словно больное сердце. Мастер завода просит кого-нибудь зачистить подвал, пока фантомы не поднялись выше. Опасно, но за работу хорошо платят — и не только кредитами.',
    act: 3,
    faction: 'guild',
    questType: 'side',
    difficulty: 'hard',
    hint: 'Фантомы уязвимы к стихотворным атакам, но появляется новая волна каждые два часа. Уничтожь источник — и они исчезнут навсегда.',
    timeLimitHours: 4,
    objectives: [
      {
        id: 'enter_factory_at_night',
        description: 'Войти на завод «Прогресс-7» ночью',
        type: 'location_visited' as const,
        target: 'abandoned_factory',
        completed: false,
      },
      {
        id: 'defeat_phantom_1',
        description: 'Уничтожить первого фантома',
        type: 'flag_set' as const,
        target: 'phantom_1_destroyed',
        completed: false,
      },
      {
        id: 'defeat_phantom_2',
        description: 'Уничтожить второго фантома',
        type: 'flag_set' as const,
        target: 'phantom_2_destroyed',
        completed: false,
      },
      {
        id: 'defeat_phantom_3',
        description: 'Уничтожить третьего фантома',
        type: 'flag_set' as const,
        target: 'phantom_3_destroyed',
        completed: false,
      },
      {
        id: 'find_phantom_source',
        description: 'Найти источник фантомов',
        type: 'location_visited' as const,
        target: 'factory_basement',
        completed: false,
      },
      {
        id: 'destroy_phantom_source',
        description: 'Уничтожить источник фантомов',
        type: 'flag_set' as const,
        target: 'phantom_source_destroyed',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 200 },
      { type: 'addCredits', value: 100 },
      { type: 'addSkill', skill: 'coding', value: 2 },
      { type: 'addSkill', skill: 'logic', value: 2 },
      { type: 'setFlag', flag: 'factory_basement_cleared', flagValue: true },
    ],
    questGiverNpcId: 'factory_foreman',
  },

  /* ─────────── КВЕСТ: Шёпот Стен ─────────── */
  {
    id: 'whisper_of_walls',
    title: 'Шёпот Стен',
    description: 'Под руинами старого жилого блока обнаружен вход в подземный бункер — один из тех, что строили до Катастрофы. Внутри, по слухам, сохранились записи: голоса людей, которые жили, когда небо было чистым. Архивисты из Хранилища мечтают получить эти плёнки — они могут содержать неслыханные стихи и потерянные знания. Но бункер опасен: обрушения, старые ловушки и гул, от которого сводит зубы.',
    act: 3,
    questType: 'side',
    difficulty: 'medium',
    hint: 'Библиотекарь Фёдор → вход на минус два → плёнки → вернуть архивисту.',
    questGiverNpcId: 'old_librarian_fyodor',
    objectives: [
      {
        id: 'find_bunker_entrance',
        description: 'Найти вход в подземный бункер',
        type: 'location_visited' as const,
        target: 'underground_bunker',
        completed: false,
      },
      {
        id: 'explore_bunker_first_room',
        description: 'Осмотреть первый зал бункера',
        type: 'location_visited' as const,
        target: 'underground_bunker',
        completed: false,
      },
      {
        id: 'find_recording_device',
        description: 'Найти записывающее устройство',
        type: 'item_collected' as const,
        target: 'bunker_recording_device',
        completed: false,
      },
      {
        id: 'listen_to_recordings',
        description: 'Прослушать все три записи',
        type: 'flag_set' as const,
        target: 'bunker_recordings_heard',
        completed: false,
      },
      {
        id: 'exit_bunker',
        description: 'Выбраться из бункера',
        type: 'location_visited' as const,
        target: 'street_night',
        completed: false,
      },
    ],
    rewards: [
      { type: 'addXp', value: 130 },
      { type: 'addKarma', value: 5 },
      { type: 'addSkill', skill: 'intuition', value: 3 },
      { type: 'setFlag', flag: 'bunker_explored', flagValue: true },
    ],
  },
];
