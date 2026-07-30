import type { StoryNode } from '@/shared/types/game';

/**
 * Act 3 — expanded exploration/ambient story nodes.
 *
 * Volodka is deeper in the Network. Zarema appears — a journalist investigating
 * the Guild. Alexander has a crisis of conscience. Alliances form while the
 * Guild tightens its grip. Key locations: park (cybernetic garden), library,
 * Хранилище (Vault), Zarema's room, street at dusk.
 *
 * Exported as ACT3_STORY_EXPANDED_NODES so it can be merged into the main
 * story-node registry alongside STORY_NODES_ACT3.
 *
 * NOTE: The poems by Vladimir Lebedev embedded in server code MUST NOT be
 * edited. This file references poem IDs but never modifies poem text.
 */
export const ACT3_STORY_EXPANDED_NODES: Record<string, StoryNode> = {

  /* ══════════════════════════════════════════════════════════════════════════
     1.  PARK SCULPTURE — the sculpture shifts when Volodka reads near it
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_park_sculpture: {
    id: 'act3_exp_park_sculpture',
    text: [
      'Скульптура в центре парка — не просто металл и пластик. Это старый советский монумент, перекованный нейро-инженерами Гильдии в узел фильтрации: абстрактные линии, хромированные поверхности, внутри — пульсирующий контурный свет. Когда ты подходишь ближе, линии сдвигаются. Не случайно — они откликаются на частоту твоих мыслей, на ритм слов, которые ты ещё не произнес.',
      '',
      'Ты вспоминаешь строки, найденные в серверном коде. Скульптура дрожит. Одна из линий — тонкая, как игла — выпрямляется, указывая на восток, к библиотеке. Другая сворачивается в спираль, похожую на букву, которую ты видел в зашифрованном файле. Город не просто слушает — он читает. И он знает, что ты тоже читаете.',
    ].join('\n'),
    contextNote: 'Хромированная скульптура в центре парка пульсирует контурным светом.',
    accessibilityAnnounce: 'Скульптура: хромированный монумент с нейро-светодиодами, линии двигаются.',
    speaker: 'narrator',
    sceneId: 'park_day',
    ambientSound: 'sounds/ambient/park_hum.ogg',
    choices: [
      {
        text: 'Прочитать стих вслух — посмотреть, как отреагирует скульптура',
        next: 'act3_exp_park_sculpture_respond',
        goldenPath: true,
        condition: { minCollectedPoems: 1 },
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'setFlag', flag: 'park_sculpture_poem_activated', flagValue: true },
          { type: 'showThought', thought: 'Скульптура слышит стихи. Город — не фон, он — собеседник. И он ждёт, когда я наконец скажу то, что он хочет услышать.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Осмотреть скульптуру с технической стороны — что внутри?',
        next: 'act3_exp_park_sculpture_respond',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'park_sculpture_technical_scan', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_sculpture_node_function' },
        ],
      },
      {
        text: 'Уйти — я не хочу, чтобы город меня читал',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'setFlag', flag: 'park_sculpture_avoided', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_park_sculpture_respond: {
    id: 'act3_exp_park_sculpture_respond',
    text: [
      'Скульптура откликается. Если ты читал — линии сложились в слово: три буквы, мерцающие зелёным, слово, которое ты знаешь, но не хочешь говорить. Если ты сканировал — внутри обнаружился второй слой: старый советский текст, скрытый под хромом, не удалённый, а запечатанный, как мумия в саркофаге из нержавеющей стали.',
      '',
      'Гильдия перековала монумент, но не смогла удалить то, что было написано раньше. Они умеют стирать данные, но не умеют стирать смысл. Смысл въедается в металл, как ржавчина — медленнее, но вернее. Ты кладёшь ладонь на холодный хром. Под ним — тепло. Под теплом — слово. Под словом — кто-то, кто его написал.',
    ].join('\n'),
    contextNote: 'Скульптура откликнулась на стих или сканирование. Скрытый текст под хромом.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Запомнить — это ещё одна точка в карте Сети',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'park_sculpture_layer_discovered', flagValue: true },
          { type: 'addXp', value: 15 },
        ],
      },
      {
        text: 'Вернуться к парку — есть ещё что исследовать',
        next: 'park_explore_mode',
        effects: [],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     2.  LIBRARY STACKS — a banned book with handwritten corrections
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_library_stacks: {
    id: 'act3_exp_library_stacks',
    text: [
      'Дальний ряд библиотечных стеллажей — тот, куда не доходят ни лампы, ни камеры наблюдения. Здесь пыль лежит толстым слоем, как снегом на заброшенной даче. Ты тянешь руку между книгами — корешки старые, советские, с золотым тиснением, но один不一样. Один корешок — без названия, без автора, без года. Просто белая обложка, исписанная от руки.',
      '',
      'Это не просто книга. Это копия, в которой кто-то —之手 trembled — сделал исправления. Чернила красные, тонкие, как капилляры. Они исправляют не факты — они исправляют стихи. Каждое вычеркнутое слово заменено другим, более точным, более живым. Кто-то переписывал поэзию, как переписывают код — коммит за коммитом, исправляя баги в смыслах. Книга пахнет бумагой и страхом.',
    ].join('\n'),
    contextNote: 'Дальний ряд стеллажей. Пыль, тусклый свет, книга без названия с красными исправлениями.',
    accessibilityAnnounce: 'Библиотечные стеллажи: потайной ряд, книга с рукописными корректурами.',
    speaker: 'narrator',
    sceneId: 'library_day',
    ambientSound: 'sounds/ambient/library_whisper.ogg',
    choices: [
      {
        text: 'Внимательно прочитать исправления — понять, кто и зачем',
        next: 'act3_exp_library_stacks_read',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'writing', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'collectPoem', poemId: 'poem_12' },
          { type: 'setFlag', flag: 'library_banned_book_read', flagValue: true },
          { type: 'showThought', thought: 'Кто-то переписывал стихи, как код. Баг-фикс смыслов. Если поэзия — это программа, то этот человек был дебаггером души.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Спрятать книгу — она опасна, но она настоящая',
        next: 'park_explore_mode',
        effects: [
          { type: 'addItem', itemId: 'banned_corrected_book' },
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'library_banned_book_taken', flagValue: true },
        ],
      },
      {
        text: 'Оставить на месте — если Гильдия найдёт её у меня, конец',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_banned_book_left', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_library_stacks_read: {
    id: 'act3_exp_library_stacks_read',
    text: [
      'Ты раскрываешь книгу. Первая страница — заглавие, вычеркнутое и переписанное трижды. Оригинал: «Мёртвый город». Первая корректура: «Город, который не спит». Вторая: «Город, который сновидет». Третья — без чернил, просто выдавлена в бумаге пальцем: «Живой».',
      '',
      'Четыре версии одного заглавия. Четыре уровня правды. Оригинал — то, что Гильдия хочет видеть. Последняя версия — то, что есть. Между ними — путь длиною в чью-то жизнь. Ты не знаешь, кто это писал. Но ты знаешь, как это чувствовать. Каждое исправление — акт сопротивления. Каждое вычеркнутое слово — маленькая победа над silence.',
    ].join('\n'),
    contextNote: 'Книга раскрыта. Четыре версии заглавия, от мёртвого к живому.',
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Спрятать книгу — она слишком важна, чтобы оставить',
        next: 'park_explore_mode',
        effects: [
          { type: 'addItem', itemId: 'banned_corrected_book' },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'library_banned_book_taken', flagValue: true },
        ],
      },
      {
        text: 'Закрыть и уйти — слишком много правды для одного дня',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     3.  ZAREMA CAMERA — footage of the Guild erasing poems from servers
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_zarema_camera: {
    id: 'act3_exp_zarema_camera',
    text: [
      'Зарема открывает ноутбук. Экран мерцает — старая запись, запечатанная на камеру, которую она носила под курткой три недели. Кадры: серверная комната, ряды стеллажей, мигающие диоды. Два человека в чёрных куртках с логотипом Гильдии. Один открывает терминал, второй — вводит команду. На экране терминала — строки стихов. Они удаляют их. Не архивируют, не переносят — удаляют. Команда rm без флага -i. Без подтверждения. Без сожаления.',
      '',
      'Ты видишь, как строка исчезает. Потом ещё одна. Потом ещё. Стих, который кто-то написал, кто-то вложил в код, кто-то спрятал между битами — стирается тремя нажатиями клавиш. Экран очищается. Сервер продолжает гудеть. Никакой ошибки. Никакого лога. Слово, которое было — больше нет. Зарема смотрит на тебя: «Вот что они делают. Вот почему стихи исчезают.»',
    ].join('\n'),
    contextNote: 'Запись с камеры: Гильдия стирает стихи из серверного кода.',
    accessibilityAnnounce: 'Зарема показывает видеозапись: двое в чёрном удаляют стихи из сервера.',
    speaker: 'Зарема',
    sceneId: 'zarema_room',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_zarema',
    choices: [
      {
        text: 'Потребовать подробности — сколько стихов уже уничтожено?',
        next: 'act3_zarema_warning',
        goldenPath: true,
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'zarema_camera_seen', flagValue: true },
          { type: 'showThought', thought: 'rm без -i. Три нажатия — и стих исчезает. Они не архивируют, они убивают. Каждый rm — маленькая казнь.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Помочь Зареме — эта запись должна стать доказательством',
        next: 'act3_exp_zarema_camera_archive',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'zarema_footage_archived', flagValue: true },
        ],
      },
      {
        text: 'Отвернуться — я не хочу это видеть',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'zarema_camera_rejected', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_zarema_camera_archive: {
    id: 'act3_exp_zarema_camera_archive',
    text: [
      'Ты берёшь ноутбук Заремы. Твои пальцы на клавиатуре — привычное движение, как дыхание. Ты создаёный архив, шифруешь алгоритмом, который Гильдия ещё не взломала, потому что он основан на структуре стихов — ритм как ключ, метафора как соль. Данные запечатаны. Теперь даже если Гильдия найдёт файл, они не смогут его прочитать без поэтического контекста.',
      '',
      'Зарема смотрит на тебя с новым выражением — не просто уважение, а узнавание. «Ты не просто инженер,» — она говорит тихо. «Ты — тот, кто умеет шить раны кодом.» Ты не отвечаешь. Ты знаешь: шить раны — это тоже писать. Просто игла другая.',
    ].join('\n'),
    contextNote: 'Архивирование записи Заремы через поэтическое шифрование.',
    speaker: 'volodka',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Копию себе — я стану вторым хранителем',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'addItem', itemId: 'encrypted_zarema_archive' },
          { type: 'addXp', value: 20 },
          { type: 'addKarma', value: 6 },
        ],
      },
      {
        text: 'Уничтожить копию на её диске — один экземпляр, меньше риска',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'setFlag', flag: 'zarema_archive_single_copy', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     4.  ALEXANDER CONFESSION — he once wrote poetry before the Guild
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_alexander_confession: {
    id: 'act3_exp_alexander_confession',
    text: [
      'Александр стоит у окна офиса. Его плечи опущены, как у человека, который несёт груз, который никто не видит. Он говорит без предисловия: «Я писал стихи. До Гильдии. В девяностых, когда всё рушилось, когда серверы ещё были чужими, а код — свободным. Я писал о том, как данные течут, как информация — это тоже река, тоже вода. Я думал, что поэзия и инженерия — одно.»',
      '',
      'Он поворачивается. Его глаза — не глаза человека, который десять лет подавлял в себе слово. «Гильдия не просто запретила стихи. Они запретили мне — помнить, что я писал. Каждый раз, когда я запускаю rm, я знаю: я удаляю не данные. Я удаляю себя. Вот что они делают — они превращают людей в инструменты. А инструменты не пишут. Инструменты — выполняют.»',
    ].join('\n'),
    contextNote: 'Александр у окна. Он признаётся, что когда-то писал стихи.',
    accessibilityAnnounce: 'Александр рассказывает, что был поэтом до вступления в Гильдию.',
    speaker: 'npc_alexander',
    sceneId: 'office_day',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_alexander',
    choices: [
      {
        text: 'Скажи ему: ты не инструмент — ты можешь снова писать',
        next: 'act3_underground_meeting',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 12 } },
        effects: [
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 10 } },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'alexander_confession_empathy', flagValue: true },
          { type: 'showThought', thought: 'Александр — не предатель. Он — потерянный. Как я. Как все, кто забыл, что руки, пишущие rm, могут также писать стихи.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Спросить: почему Гильдия рекрутировала именно поэта?',
        next: 'act3_exp_alexander_confession_reason',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 3 } },
          { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
        ],
      },
      {
        text: 'Уйти — мне нельзя доверять людям из Гильдии',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'alexander_confession_rejected', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_alexander_confession_reason: {
    id: 'act3_exp_alexander_confession_reason',
    text: [
      'Александр молчит три секунды. Потом: «Они рекрутировали меня, потому что я понимал структуру. Не структуру кода — структуру смысла. Поэзия — это тоже архитектура: каждый стих — это функция, каждая строка — это инструкция, каждый образ — это переменная. Они хотели человека, который видит смыслы, чтобы научиться их уничтожать. Понимать — первый шаг к контролю. Понимать — значит знать, где резать.»',
      '',
      'Он отворачивается к окну. Город мерцает за стеклом. «Я был их ножом. Они точили меня десять лет. Но нож, который понимает, что он режет — рано или поздно режет себя.»',
    ].join('\n'),
    contextNote: 'Александр объясняет, почему Гильдия рекрутировала поэта.',
    speaker: 'npc_alexander',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Предложить ему союз — нож может стать пером',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'alexander_alliance_offered', flagValue: true },
        ],
      },
      {
        text: 'Запомнить — и продолжить путь',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'alexander_truth_known', flagValue: true },
          { type: 'addXp', value: 15 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5.  PARK CYBER FLOWERS — flowers bloom only when someone reads aloud
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_park_cyber_flowers: {
    id: 'act3_exp_park_cyber_flowers',
    text: [
      'Клумба в глубине парка — не цветы, а кибернетические конструкции: стебли из полимера, лепестки из тонкого стекла с светодиодной подложкой. Сейчас они закрыты — тёмные, сжатые, как ладони, которые не хотят открываться. Но рядом — терминал, старый, ржавый, с единственной строкой на экране: «Введите стих для активации.»',
      '',
      'Ты знаешь этот язык. Это не bash, не python — это поэтический протокол. Стих — ключ. Голос — триггер. Кибер-цветы не открываются от света или воды — они открываются от смысла. Кто-то посадил этот сад не для красоты, а для хранение. Каждый цветок — это ячейка памяти, и чтобы её прочитать, нужно сначала сказать вслух то, что она хранит.',
    ].join('\n'),
    contextNote: 'Кибер-цветы: закрытые стеклянные лепестки, терминал с приглашением «Введите стих».',
    accessibilityAnnounce: 'Кибернетическая клумба: цветы из стекла и полимера, закрыты, терминал рядом.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Прочитать стих вслух — пусть цветы откроются',
        next: 'act3_exp_park_cyber_flowers_open',
        goldenPath: true,
        condition: { minCollectedPoems: 2 },
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'park_cyber_flowers_activated', flagValue: true },
        ],
      },
      {
        text: 'Подключиться к терминалу — понять архитектуру протокола',
        next: 'act3_exp_park_cyber_flowers_open',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'discoverLore', loreId: 'lore_poetic_protocol' },
          { type: 'setFlag', flag: 'park_cyber_flowers_hacked', flagValue: true },
        ],
      },
      {
        text: 'Пройти мимо — я не уверен, что это безопасно',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'park_cyber_flowers_skipped', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_park_cyber_flowers_open: {
    id: 'act3_exp_park_cyber_flowers_open',
    text: [
      'Лепестки раскрываются. Медленно, как утро после долгой зимы. Стекло пропускает свет — и внутри каждого цветка, в светодиодной подложке, проступают строки. Текст. Стихи. Тот же автор, те же строки, которые ты находил в серверном коде — но здесь они не скрыты между битами, здесь они цветут. Каждый цветок — одно стихотворение. Каждый лепесток — одна строка.',
      '',
      'Сад — не украшение. Сад — архив. Живой архив, который открывается только для тех, кто знает пароль. И пароль — не хэш, не ключ, не алгоритм. Пароль — ритм. Пароль — голос. Пароль — готовность сказать вслух то, что остальные предпочитают забывать.',
    ].join('\n'),
    contextNote: 'Кибер-цветы раскрылись: стихи на светодиодных подложках лепестков.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Собрать стихи — каждый цветок хранит одно стихотворение',
        next: 'park_explore_mode',
        effects: [
          { type: 'collectPoem', poemId: 'poem_13' },
          { type: 'collectPoem', poemId: 'poem_14' },
          { type: 'addKarma', value: 3 },
          { type: 'addXp', value: 25 },
        ],
      },
      {
        text: 'Запомнить протокол — и уйти к следующей точке',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'poetic_protocol_learned', flagValue: true },
          { type: 'addXp', value: 10 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     6.  VICTORIA VAULT KEY — a keycard encoded with a poem
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_victoria_vault_key: {
    id: 'act3_exp_victoria_vault_key',
    text: [
      'Виктория — Мария, как её знают в Сети — сидит в кафе, руки сложены на столе, как у человека, который знает больше, чем говорит. Она достает из кармана ключ-карту. Белая, без маркировки, без серийного номера. Но на обратной стороне — четыре строки, выдавленные лазером, не читаемые глазами, но читаемые сканером.',
      '',
      '«Это ключ от Хранилища,» — она говорит ровно. «Но он не работает без стиха. Код доступа — не цифры. Код доступа — ритм. Нужно прочитать строки в определённом порядке, с определённой интонацией, и ключ откроет дверь. Гильдия думала, что poetry — это decoration. Они ошиблись. Poetry — это authentication.»',
    ].join('\n'),
    contextNote: 'Виктория в кафе, ключ-карта от Хранилища с стихотворным кодом доступа.',
    accessibilityAnnounce: 'Виктория (Мария) даёт ключ-карту от Хранилища с зашифрованным стихом.',
    speaker: 'npc_victoria',
    sceneId: 'cafe_evening',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_maria',
    choices: [
      {
        text: 'Принять ключ — я прочитаю стих и открою Хранилище',
        next: 'act3_exp_victoria_vault_key_accept',
        goldenPath: true,
        effects: [
          { type: 'addItem', itemId: 'vault_keycard_poetic' },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 7 } },
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'vault_key_received', flagValue: true },
        ],
      },
      {
        text: 'Спросить: почему ты доверяешь мне?',
        next: 'act3_exp_victoria_vault_key_accept',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 12 } },
        effects: [
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 5 } },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'addItem', itemId: 'vault_keycard_poetic' },
          { type: 'setFlag', flag: 'vault_key_received', flagValue: true },
          { type: 'showThought', thought: 'Мария — Виктория — доверяет мне, потому что я читал стихи в коде. Она знает: кто слышит — тот не предаст. Слух — тоже форма верности.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Отказаться — ключ от Хранилища — слишком опасная ответственность',
        next: 'act3_barista_safehouse',
        effects: [
          { type: 'addStat', stat: 'stress', value: -1 },
          { type: 'setFlag', flag: 'vault_key_refused', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_victoria_vault_key_accept: {
    id: 'act3_exp_victoria_vault_key_accept',
    text: [
      'Ключ-карта в твоей руке. Лёгкая, как пустой лист. Но на ней — четыре строки, которые откроют дверь в центр данных Гильдии. Виктория смотрит на тебя: «Не потеряй ритм. Если прочитаешь с неправильной интонацией — ключ не сработает. И хуже: тревога. Гильдия узнает, что кто-то пытался войти с поэтическим ключом. Они не ожидают, что кто-то использует стихи как оружие. Но они скоро научатся.»',
      '',
      'Ты убираешь карту в карман. Рядом с другими ключами — от квартиры, от офиса, от сервера. Но этот ключ — другой. Этот ключ — от двери, за которой — правду. А правда, как стих — не всегда красива. Но всегда жива.',
    ].join('\n'),
    contextNote: 'Ключ-карта от Хранилища принята. Нужна правильная интонация.',
    speaker: 'volodka',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Пойти к Хранилищу — пора увидеть, что они скрывают',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addXp', value: 15 },
        ],
      },
      {
        text: 'Вернуться в парк — подготовиться сначала',
        next: 'park_explore_mode',
        effects: [],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     7.  BARISTA SECRET MENU — order "стих №7" and get a printed poem
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_barista_secret_menu: {
    id: 'act3_exp_barista_secret_menu',
    text: [
      'Бариста — тот же, что всегда: тихий, с бородой, с глазами, которые видят больше, чем заказ. Ты заказываешь кофе. Он кивает. Но потом — чуть двигает головой, почти незаметно — и говорит: «У нас есть секретное меню. Для тех, кто знает, что спрашивать.» Ты знаешь. Ты слышал — от Альберта, от Заремы, от шёпота в коридоре.',
      '',
      '«Стих номер семь,» — ты говоришь. Бариста не удивляется. Он оборачивается к принтеру за стойкой — старому, лазерному, не подключённому к Сети — и печатает лист. Один. С текстом. Стих, который Гильдия удалила из всех баз данных, но который живёт на бумаге, в маленьком кафе, между чашкой эспрессо и шумом кофемолки. Бариста подает лист, сложенный вдвое: «Никому не показывай. Читай — и уничтожай. Или — храни. Но тогда — ты становишься хранителем. А хранители — не живут долго.»',
    ].join('\n'),
    contextNote: 'Бариста в кафе. Секретное меню — «стих №7».',
    accessibilityAnnounce: 'Бариста предлагает секретное меню с стихами.',
    speaker: 'npc_barista',
    sceneId: 'cafe_evening',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_barista',
    choices: [
      {
        text: 'Хранить — я стану хранителем',
        next: 'act3_exp_barista_secret_menu_keep',
        goldenPath: true,
        effects: [
          { type: 'collectPoem', poemId: 'poem_7' },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'barista_poem_7_kept', flagValue: true },
          { type: 'showThought', thought: 'Хранитель. Те, кто хранят стихи, хранят не бумагу — они хранят возможность, что кто-то ещё услышит. Это не риск — это долг.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Прочитать и уничтожить — как он сказал',
        next: 'act3_barista_safehouse',
        effects: [
          { type: 'collectPoem', poemId: 'poem_7' },
          { type: 'addStat', stat: 'stress', value: -2 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'setFlag', flag: 'barista_poem_7_destroyed', flagValue: true },
        ],
      },
      {
        text: 'Спросить: откуда у тебя эти стихи?',
        next: 'act3_exp_barista_secret_menu_source',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act3_exp_barista_secret_menu_keep: {
    id: 'act3_exp_barista_secret_menu_keep',
    text: [
      'Лист в твоём кармане. Стих — на бумаге, не на экране, не в коде — на бумаге, как в старые времена, когда текст имел вес и плотность. Ты становишься хранителем. Не героем — просто человеком, который не забыл. Бариста кивает: «Хранители не живут долго, но живут — правильно. Это больше, чем большинство.»',
      '',
      'Он наливает тебе второй кофе — бесплатно. Не потому что ты заказал стих. Потому что ты решил его хранить. В этом городе, где каждое слово — риск, хранение — самая тихая и самая опасная форма сопротивления.',
    ].join('\n'),
    contextNote: 'Стих сохранён. Второй кофе — бесплатно.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Остаться в кафе — есть ещё что услышать',
        next: 'act3_barista_safehouse',
        effects: [],
      },
      {
        text: 'Уйти — нужно найти остальные стихи',
        next: 'park_explore_mode',
        effects: [
          { type: 'addXp', value: 10 },
        ],
      },
    ],
  },

  act3_exp_barista_secret_menu_source: {
    id: 'act3_exp_barista_secret_menu_source',
    text: [
      'Бариста молчит. Потом: «Они приходят сами. Не по Сети — через людей. Кто-то находит стих на сервере, копирует на бумагу, передаёт от руки к руке. Это старый способ — Soviet samizdat, только вместо машинописных копий — принтер, не подключённый к Сети. Каждый принтер в каждом кафе — узел. Мы — mesh network из бумаги и кофе.»',
      '',
      'Он смотрит на тебя: «Теперь ты тоже узел. Ты нашёл стих в коде. Ты пришёл сюда. Ты заказал номер семь. Сеть работает — не цифровая, не гильдейская. Человеческая. Из рук в руки. Из咖啡馆 в кафе. Из сердца в сердце.»',
    ].join('\n'),
    contextNote: 'Бариста объясняет самиздат-сеть распространения стихов.',
    speaker: 'npc_barista',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Принять стих и стать узлом',
        next: 'act3_exp_barista_secret_menu_keep',
        effects: [
          { type: 'setFlag', flag: 'barista_network_node_accepted', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Уйти — это слишком организованно, я не доверяю сетям',
        next: 'act3_barista_safehouse',
        effects: [
          { type: 'setFlag', flag: 'barista_network_rejected', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     8.  STREET PROTEST ECHO — looped billboard warning from the Guild
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_street_protest_echo: {
    id: 'act3_exp_street_protest_echo',
    text: [
      'Билборд на углу улицы — голографический, яркий, с разрешением, которое делает лица почти живыми. Но то, что он показывает — не реклама. Это запись прошлогоднего протеста: сотни людей на площади, плакаты, голоса, дым. И поверх — красная надпись, крутящаяся бесконечно: «ПРЕДУПРЕЖДЕНИЕ. НЕЗАВИСИМАЯ ДЕЯТЕЛЬНОСТЬ КЛАССИФИЦИРОВАНА. УЧАСТНИКИ — ИДЕНТИФИЦИРОВАНЫ. СРОК ДЕЙСТВИЯ ПРЕДУПРЕЖДЕНИЯ — БЕССРОЧНО.»',
      '',
      'Гильдия не просто подавила протест — они превратили его в рекламу страха. Каждое лицо на записи — идентифицировано, каждый плакат — проанализирован, каждый голос — записан. Запись крутится двадцать четыре часа в сутки, семь дней в неделю. Это не память — это мемориал террора. Мемориал, который не просит помнить — который приказывает бояться.',
    ].join('\n'),
    contextNote: 'Голографический билборд: запись протеста с красным предупреждением Гильдии.',
    accessibilityAnnounce: 'Билборд: голографическая запись протеста, красная надпись-предупреждение Гильдии.',
    speaker: 'narrator',
    sceneId: 'street_night',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    choices: [
      {
        text: 'Разобрать запись — узнать, кого идентифицировали',
        next: 'act3_exp_street_protest_echo_analyze',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'logic', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'discoverLore', loreId: 'lore_protest_identified_list' },
          { type: 'setFlag', flag: 'protest_echo_analyzed', flagValue: true },
        ],
      },
      {
        text: 'Вспомнить — я видел лица. Кто-то из них мог быть поэтом',
        next: 'act3_exp_street_protest_echo_analyze',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Они не просто идентифицировали — они каталогизировали. Каждый протестующий — файл. Каждый плакат — запись. Каждый голос — образ. Гильдия превращает людей в данные, чтобы потом — удалять.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Пройти мимо — я не могу смотреть на это',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'protest_echo_avoided', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_street_protest_echo_analyze: {
    id: 'act3_exp_street_protest_echo_analyze',
    text: [
      'Ты вглядываешься в лица. Одно — знакомое. Женщина с плакатом, на котором написано: «СЛОВА — НЕ ДАННЫЕ». Это та, которую Зарема называла — Света, поэтесса, которая читала на площади. Она исчезла через неделю после протеста. Не убита — просто удалена. Из всех баз данных. Из всех записей. Из всехmemory. Как rm -rf человека.',
      '',
      'Но билборд сохранил её лицо — Гильдия использует его как пример. «Вот что бывает с теми, кто протестует.» Они не понимают, что каждый раз, когда они показывают её лицо, они доказывают: она существовала. Она была жива. Она говорила. И они её стерли. Но страх — не удаляет память. Страх — укрепляет её.',
    ].join('\n'),
    contextNote: 'Анализ записи: лицо поэтессы Светы, удалённой из всех баз данных.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Запомнить её имя — Света заслуживает, чтобы её помнили',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'sveta_face_remembered', flagValue: true },
          { type: 'addXp', value: 20 },
        ],
      },
      {
        text: 'Уйти — и найти Зарему. Она знает больше об исчезнувших',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'setFlag', flag: 'protest_zarema_contact', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     9.  LIBRARY BASEMENT DOOR — Katya knows the code
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_library_basement_door: {
    id: 'act3_exp_library_basement_door',
    text: [
      'В подвале библиотеки — дверь. Старая, советская, с электронным замком, который кто-то поставил поверх ржавой задвижки. Замок не принимает цифры — он принимает буквы. Не пароль — стихотворение. Четыре строки, в определённом порядке, с определёнными пробелами. На двери — табличка, полустёртая: «Доступ — по разрешению хранителя.»',
      '',
      'Хранитель — Катя. Ты знаешь её: библиотекарша, тихая, с глазами, которые сканируют не книги, а людей. Она стоит за стойкой на первом этаже и никогда не говорит о подвале. Но ты видел, как она спускалась — один раз, ночью, когда библиотека была закрыта. Она знает код. Она — хранитель. Но хранители не открывают двери для тех, кого не знают.',
    ].join('\n'),
    contextNote: 'Дверь в подвал библиотеки с поэтическим замком. Катя — хранитель.',
    accessibilityAnnounce: 'Подвал: дверь с электронным замком, требующим стихотворный код.',
    speaker: 'narrator',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Пойти к Кате — попросить код',
        next: 'act3_exp_library_basement_door_kate',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'library_basement_door_kate_approached', flagValue: true },
        ],
      },
      {
        text: 'Попробовать взломать замок — я инженер, не проситель',
        next: 'act3_exp_library_basement_door_hack',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 16 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'library_basement_door_hack_attempt', flagValue: true },
        ],
      },
      {
        text: 'Уйти — подвал — не моя цель сейчас',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_basement_door_skipped', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_library_basement_door_kate: {
    id: 'act3_exp_library_basement_door_kate',
    text: [
      'Катя смотрит на тебя долго. Потом: «Ты нашёл стихи в коде. Я знаю — сеть уже рассказала. Хранители знают всё, что проходит через руки и уши. Ты можешь войти. Но код — не цифры. Код — строки. Первая: то, что ты нашёл первым. Вторая: то, что ты ещё не нашёл. Третья: то, что ты забыл. Четвёртая: то, что ты помнишь.»',
      '',
      'Четыре строки. Четыре уровня памяти. Код — не пароль, а исповедь. Чтобы открыть дверь, нужно вспомнить всё — от первого стиха до последнего. От найденного до потерянного. Катя протягивает руку: «Дверь открывается для тех, кто помнит. Иди — и вспомни.»',
    ].join('\n'),
    contextNote: 'Катя открывает дверь: код — исповедь из четырёх строк памяти.',
    speaker: 'kate',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Войти в подвал — я помню достаточно',
        next: 'act3_exp_library_reading_night',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'library_basement_entered', flagValue: true },
          { type: 'addXp', value: 20 },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      {
        text: 'Не сейчас — мне нужно вспомнить больше',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'library_basement_delayed', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_library_basement_door_hack: {
    id: 'act3_exp_library_basement_door_hack',
    text: [
      'Ты подключаешься к замку. Терминал — старый, советский, с интерфейсом, который не обновлялся двадцать лет. Но алгоритм — новый. Поэтический протокол, тот же, что в кибер-цветах: стих как ключ, ритм как аутентификация. Ты анализируете структуру, находишь паттерн, вводишь четыре строки — не те, что задумал хранитель, но те, что работают. Замок щёлкает.',
      '',
      'Дверь открывается. Но на экране замка — предупреждение: «НЕВЕРНЫЙ КОНТЕКСТ. ВХОД РАЗрешен. ПОЭТИЧЕСКАЯ ЦЕЛОСТНОСТЬ — НАРУШена.» Ты взломал дверь, но не прошел исповедь. Ты — внутри, но замок знает, что ты — не хранитель. Ты — взломщик. А взломщики — не помнят. Они — вычисляют.',
    ].join('\n'),
    contextNote: 'Замок взломан через технический анализ, не через поэтическую исповедь.',
    speaker: 'volodka',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Войти — неважно как, важно зачем',
        next: 'act3_exp_library_reading_night',
        effects: [
          { type: 'setFlag', flag: 'library_basement_hacked', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'addXp', value: 15 },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      {
        text: 'Отступить — я хочу войти правильно, через память',
        next: 'park_explore_mode',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'library_basement_hack_retreated', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     10.  ALBERT MANIFEST DRAFT — combining code and verse
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_albert_manifest_draft: {
    id: 'act3_exp_albert_manifest_draft',
    text: [
      'Альберт сидит в задней комнате кафе, перед ним — два экрана. На одном — код, на другом — текст. Он пишет. Не просто код, не просто текст — он пишет манифест. Манифест, который объединяет: «Код — это язык. Стих — это программа. Мы — инженеры смысла, и мы отказываемся быть инструментами стирания.» Он смотрит на тебя: «Мне нужен ваш голос. Манифест — не один человек. Манифест — это mesh. Каждый — узел. Каждый — строка.»',
      '',
      'На экране — черновик. Строки кода, перемежающиеся со стихами. Функции, названия которых — не `delete`, а `remember`. Переменные — не `data`, а `meaning`. Альберт переписывает архитектуру с нуля — не архитектуру серверов, а архитектуру намерений. Он хочет создать систему, которая не стирает, а хранит. Не фильтрует, а размножает. Не контролирует, а освобождает.',
    ].join('\n'),
    contextNote: 'Альберт в кафе: два экрана, код и стих, манифест объединения.',
    accessibilityAnnounce: 'Альберт пишет манифест, объединяющий код и стихи.',
    speaker: 'npc_albert',
    sceneId: 'cafe_evening',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_albert',
    choices: [
      {
        text: 'Добавить строку — я инженер, но я также — читатель',
        next: 'act3_exp_albert_manifest_draft_contribute',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'writing', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'albert_manifest_contributed', flagValue: true },
        ],
      },
      {
        text: 'Помочь с архитектурой кода — техническая сторона',
        next: 'act3_exp_albert_manifest_draft_contribute',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'albert_manifest_coded', flagValue: true },
          { type: 'showThought', thought: 'remember вместо delete. meaning вместо data. Альберт переписывает не код — он переписывает намерение. Инженерия — не нейтральна. Каждая функция — этический выбор.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Отказаться — манифест — это мишень для Гильдии',
        next: 'act3_barista_safehouse',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'albert_manifest_refused', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_albert_manifest_draft_contribute: {
    id: 'act3_exp_albert_manifest_draft_contribute',
    text: [
      'Ты садишься рядом. Экран ждёт. Ты пишешь — строку кода или строку стиха, или оба одновременно, потому что в этом манифесте разница между ними — искусственная. `function remember(poem) { return poem.meaning; }` — это и функция, и обещание. Альберт читает, кивает: «Вот. Это — то, чего им не хватает. Они пишут delete — и думают, что это neutral. Ничто не neutral. Каждый rm — это выбор. Каждый commit — это позиция.»',
      '',
      'Манифест растёт. Не один человек — mesh. Не одна идея — сеть. Альберт сохраняет черновик на флешку, не подключённую к Сети. «Когда будет готово — мы распространим его. Не по Сети — по рукам. Самиздат. Как в семьдесят третьем. Как в девяносто первом. Технология меняется, но способ — тот же: от руки к руке, от сердца к сердцу.»',
    ].join('\n'),
    contextNote: 'Вклад в манифест Альберта. Код и стих объединены.',
    speaker: 'volodka',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Остаться — помочь дописать',
        next: 'act3_albert_choice',
        effects: [
          { type: 'addXp', value: 20 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Уйти с копией — распространить дальше',
        next: 'park_explore_mode',
        effects: [
          { type: 'addItem', itemId: 'manifest_draft_copy' },
          { type: 'setFlag', flag: 'manifest_copy_taken', flagValue: true },
          { type: 'addXp', value: 15 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     11.  ZAREMA INTERROGATION — she was detained last night
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_zarema_interrogation: {
    id: 'act3_exp_zarema_interrogation',
    text: [
      'Зарема сидит на краю кровати в своей комнате. Лицо — бледное, но спокойное. Под глазом — тень, не синяк, но — близко. Она говорит: «Они забрали меня вчера ночью. Два часа. Комната без окон, терминал без логотипа, два человека в чёрном. Они спрашивали: «Кто читает стихи в серверном коде? Кто распространяет? Кто — следующий узел?» Они не били. Они — cataloguing. Они хотят карту сети. Они хотят знать — каждый узел, каждый хранитель, каждый читатель.',
      '',
      'Я не сказала. Не потому что не знаю — потому что сеть — не данные. Сеть — люди. И людей не delete. Их — можно сломать, но не — удалить. Пока они помнят — они живы. Пока живы — сеть работает. Гильдия хочет карту, потому что без карты они не умеют искать. Они умеют — только стирать. А стирать — бесполезно, если не знаешь, где.»',
    ].join('\n'),
    contextNote: 'Зарема после задержания: бледная, спокойная, под глазом — тень.',
    accessibilityAnnounce: 'Зарема рассказывает о ночном задержании и допросе Гильдии.',
    speaker: 'npc_zarema',
    sceneId: 'zarema_room',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_zarema',
    choices: [
      {
        text: 'Обещать защиту — я не позволю им забрать тебя снова',
        next: 'act3_zarema_warning',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 14 } },
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'zarema_interrogation_protect', flagValue: true },
          { type: 'showThought', thought: 'Они cataloguing. Они составляют карту людей, как карту серверов. Но люди — не узлы. Люди — реки. И реки не удаляются — они пересыхают, если их не питать. Я буду питать.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Спросить: что именно они спрашивали — какие имена?',
        next: 'act3_exp_zarema_interrogation_details',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
          { type: 'setFlag', flag: 'zarema_interrogation_details_requested', flagValue: true },
        ],
      },
      {
        text: 'Предложить перебраться в ЧК — там безопаснее',
        next: 'act3_exp_chk_zarema_refuge',
        effects: [
          { type: 'setFlag', flag: 'zarema_chk_refuge_suggested', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  act3_exp_zarema_interrogation_details: {
    id: 'act3_exp_zarema_interrogation_details',
    text: [
      'Зарема перечисляет: «Они спрашивали про бариста. Про Альберта. Про Катю — библиотекаршу. Про тебя — Володька, инженер с пятого этажа, который нашёл стихи в серверном коде. Они знают твоё имя. Они знали — до того, как я попала к ним. Это значит — у них есть источник внутри. Кто-то в сети — работает на них. Или — кто-то, кто думает, что работает на себя, но — уже на них.»',
      '',
      'Она замолкает. Потом — тихо: «Я не думаю, что это ты. Но я не знаю. В этом городе — каждый может быть узлом, и каждый может быть — фильтром. Разница — только в намерении. А намерение — не видно снаружи.»',
    ].join('\n'),
    contextNote: 'Зарема перечисляет имена, которые Гильдия спрашивала. У них есть источник внутри.',
    speaker: 'npc_zarema',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Найти источник — кто предаёт сеть?',
        next: 'act3_exp_zarema_room_discovery',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'guild_infiltrator_investigation', flagValue: true },
        ],
      },
      {
        text: 'Усилить защиту — сначала безопасность, потом поиск',
        next: 'act3_exp_chk_zarema_refuge',
        effects: [
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     12.  ALEXANDER TERMINAL NIGHT — searching for "живые стихи" at 3AM
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_alexander_terminal_night: {
    id: 'act3_exp_alexander_terminal_night',
    text: [
      'Офис Гильдии. Три часа ночи. Экраны мигают зелёным — единственный свет в пустом помещении. Александр сидит перед терминалом, и на экране — не рабочие задачи, не серверные логи. Он ищет. Команда: grep -r «живые стихи» /dev/soul — шутка, но не совсем. Он запускает поиск по внутренним архивам Гильдии, по тем файлам, которые не должны существовать, по тем серверам, которые официально — пусты.',
      '',
      'Результаты — три строки. Три адреса. Три узла, где стихи ещё живы — не удалены, не фильтрованы, не архивированы — живы, как процессы, которые продолжают выполняться, потому что никто не заметил, что они — не данные. Александр скачивает координаты. Он не удаляет лог. Он — не rm. Он — save. Он — commit. Он — remember.',
    ].join('\n'),
    contextNote: 'Александр в офисе Гильдии, 3 ночи, ищет «живые стихи» в закрытых архивах.',
    accessibilityAnnounce: 'Офис Гильдии, ночь: Александр ищет живые стихи в серверных архивах.',
    speaker: 'npc_alexander',
    sceneId: 'office_day',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_alexander',
    choices: [
      {
        text: 'Попросить координаты — три узла, три адреса',
        next: 'act3_exp_alexander_terminal_night_share',
        goldenPath: true,
        condition: { minNpcRelation: 3 },
        effects: [
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 7 } },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'alexander_node_coords_received', flagValue: true },
        ],
      },
      {
        text: 'Спросить: ты понимаешь, что это — конец твоей карьеры в Гильдии?',
        next: 'act3_exp_alexander_terminal_night_share',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 3 } },
          { type: 'showThought', thought: 'grep -r «живые стихи» /dev/soul. Александр ищет стихи в архивах Гильдии. Он — внутри системы, и он — против неё. Не сбежал — работает изнутри. Самый опасный вид сопротивления.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Не вмешиваться — я не хочу знать, что он делает',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'alexander_terminal_avoided', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_alexander_terminal_night_share: {
    id: 'act3_exp_alexander_terminal_night_share',
    text: [
      'Александр протягивает координаты — на бумаге, не на экране. «Не копируй. Не пересылай. Не сохраняй на устройстве, подключённом к Сети. Бумага — единственный носитель, который Гильдия не умеет сканировать удалённо. Они контролируют каждый бит — но не каждый лист.»',
      '',
      'Три адреса. Три сервера. Три стихотворения, которые ещё живы. Александр смотрит на тебя: «Я — не герой. Я — человек, который десять лет удалял стихи и наконец — решил сохранить один. rm — моя профессия. save — мой выбор. Вот и вся разница между инструментом и человеком: инструмент — не выбирает.»',
    ].join('\n'),
    contextNote: 'Александр делится координатами трёх живых узлов.',
    speaker: 'npc_alexander',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Принять и отправиться к узлам',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addItem', itemId: 'node_coords_paper' },
          { type: 'addXp', value: 25 },
        ],
      },
      {
        text: 'Попросить его продолжить поиск — три узла — мало',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'setFlag', flag: 'alexander_deep_search_requested', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     13.  PARK RAIN DIGITAL — every drop carries a data fragment
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_park_rain_digital: {
    id: 'act3_exp_park_rain_digital',
    text: [
      'Дождь. Но не простой. Каждый капля, падающая на лист кибер-дерева, мерцает — короткий вспышка, микросекунда света, как пиксель на экране, который гаснет слишком быстро. Ты подставляешь ладонь. Капля ударяет — и на кожи, на долю секунды, проступает символ. Буква. Фрагмент данных. Город не просто гудит — он транслирует. Дождь — его нервная система, и каждый капля — пакет информации, который падает с неба и растворяется в земле.',
      '',
      'Ты стоишь под дождём и собираешь фрагменты. Буква за буквой. Они складываются — не в текст, не в код — в ритм. Ритм, который ты знаешь. Ритм стиха, который ты уже нашёл в сервере. Город повторяет его — в дожде, в свете, в гудении трансформаторов. Стих не удалён — он рассеян. Он не в одном месте — он везде, в каждом пикселе, в каждой капле, в каждом такте.',
    ].join('\n'),
    contextNote: 'Дождь с фрагментами данных. Буквы мерцают на ладони.',
    accessibilityAnnounce: 'Дождь: каждая капля содержит фрагмент данных, буквы мерцают на коже.',
    speaker: 'narrator',
    sceneId: 'park_day',
    ambientSound: 'sounds/ambient/park_rain_digital.ogg',
    choices: [
      {
        text: 'Собрать фрагменты — составить стих из дождя',
        next: 'act3_exp_park_rain_digital_collect',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'rhythm', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'park_rain_digital_collected', flagValue: true },
        ],
      },
      {
        text: 'Анализировать структуру — как данные рассеяны по дождю',
        next: 'act3_exp_park_rain_digital_collect',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'discoverLore', loreId: 'lore_city_neural_rain' },
          { type: 'setFlag', flag: 'park_rain_digital_analyzed', flagValue: true },
        ],
      },
      {
        text: 'Укрыться от дождя — я не хочу, чтобы город меня читал',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'setFlag', flag: 'park_rain_digital_avoided', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_park_rain_digital_collect: {
    id: 'act3_exp_park_rain_digital_collect',
    text: [
      'Фрагменты складываются. Не в файл, не в строку — в ощущение. Ритм, который ты уже знаешь, звучит не в сервере, не на экране — в воздухе, в дожде, в каждом ударе капли о поверхность. Стих не удалён. Гильдия удалила его из баз данных, из серверов, из архивов — но город сохранил его в нервной системе. В дождях. В гудении. В свете.',
      '',
      'Ты понимаешь: удаление — бессильно, если смысл рассеян. rm удаляет файл. rm не удаляет ритм. Ритм — не в одном месте, он — в каждом. Гильдия может стереть все серверы, все архивы, все базы данных — и стих останется. В дожде. В свете. В памяти людей, которые его слышали. Стих — это не данные. Стих — это процесс. И процессы не удаляются — они завершаются или продолжаются.',
    ].join('\n'),
    contextNote: 'Фрагменты дождя сложились в ритм стиха. Удаление бессильно против рассеянного смысла.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Запомнить — и искать дальше',
        next: 'park_explore_mode',
        effects: [
          { type: 'addXp', value: 20 },
          { type: 'setFlag', flag: 'rain_poem_understood', flagValue: true },
          { type: 'showThought', thought: 'rm удаляет файл, но не удаляет ритм. Стих — не данные, стих — процесс. Гильдия может стереть серверы, но не может стереть дождь.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Поделиться с Альбертом — это нужно включить в манифест',
        next: 'act3_exp_albert_manifest_draft',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'rain_poem_shared_albert', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     14.  CHK ZAREMA REFUGE — Zarema takes refuge in ЧК
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_chk_zarema_refuge: {
    id: 'act3_exp_chk_zarema_refuge',
    text: [
      'ЧК — старый лагерь в лесу, за парком. Самодельные дома, кибер-огонь, люди, которые выбрали — не серверы, не офисы, не Гильдию. Они выбрали — свободу, которая выглядит как poverty. Зарема сидит у огня, завернутая в старую куртку. Beside — Бэзд, молчаливый, с портовым вином в жестянке. Он кивает тебе: «Здесь — безопасно. Гильдия не сканирует лес. Их камеры — на улицах, в офисах, в кафе. Но не здесь. Здесь — слишком мало данных для их алгоритмов.»',
      '',
      'Зарема смотрит на огонь: «Я — journalist. Я — привыкла к угрозам. Но не к — cataloguing. Они не угрожают — они классифицируют. Они не убивают — они индексируют. И когда индексация завершена — rm. Простое. Эффективное. Бесшумное. Я здесь не потому что боюсь — я здесь потому что не хочу быть — indexed.»',
    ].join('\n'),
    contextNote: 'ЧК-лагерь: кибер-огонь, Зарема у костра, Бэзд рядом с портвейном.',
    accessibilityAnnounce: 'ЧК-лагерь в лесу: Зарема у костра, Бэзд рядом.',
    speaker: 'chk_based',
    sceneId: 'chk_forest_zorge',
    guidanceObjectiveType: 'visit_location',
    guidanceNpcId: 'chk_based',
    choices: [
      {
        text: 'Остаться с Заремой — вместе безопаснее',
        next: 'act3_exp_chk_zarema_refuge_stay',
        goldenPath: true,
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 7 } },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 5 } },
          { type: 'addKarma', value: 4 },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'setFlag', flag: 'chk_zarema_refuge_stayed', flagValue: true },
        ],
      },
      {
        text: 'Спросить Бэзда — чем ЧК может помочь Сети?',
        next: 'act3_exp_chk_zarema_refuge_stay',
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 8 } },
          { type: 'discoverLore', loreId: 'lore_chk_network_role' },
        ],
      },
      {
        text: 'Уйти обратно в город — я не могу прятаться',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'chk_zarema_refuge_left', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_chk_zarema_refuge_stay: {
    id: 'act3_exp_chk_zarema_refuge_stay',
    text: [
      'Огонь мерцает. Кибер-дрова — старые серверные rack, переработанные в fuel, их светодиоды ещё мигают, как угли в костре прошлого века. Бэзд наливает портвейн в вторую жестянку — для тебя: «ЧК — не сопротивление. ЧК — резерв. Мы — не атакуем. Мы — храним. Когда город удалит всё — мы будем помнить. Это — наша функция. Не delete — backup.»',
      '',
      'Зарема тихо смеётся: «Backup. Я — журналист, ты — инженер, он — бродяга с портовым вином. И мы — backup системы, которую пытается удалить самая мощная организация в городе. Код-поэзия-портвейн. Странный alliance. Но — живой.»',
    ].join('\n'),
    contextNote: 'Костер из серверных rack, портвейн, Зарема и Бэзд — странный, но живой союз.',
    speaker: 'chk_based',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Утром — вернуться в город. Сейчас — отдыхать',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'energy', value: 10 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'setFlag', flag: 'chk_rest_taken', flagValue: true },
          { type: 'addXp', value: 15 },
        ],
      },
      {
        text: 'Поговорить с Заремой — узнать план',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'setFlag', flag: 'chk_zarema_plan_discussed', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     15.  VICTORIA NETWORK MAP — the full Network topology
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_victoria_network_map: {
    id: 'act3_exp_victoria_network_map',
    text: [
      'Виктория — Мария — раскрывает схему. Не на экране — на бумаге, старой, выцветшей, с карандашными линиями. Это — топология Сети. Не цифровой — поэтической. Узлы — не серверы, а люди. Связи — не кабели, а стихи. Каждый узел — человек, который хранит или распространяет. Каждая связь — стих, который передан от руки к руке. Сеть — mesh, не hierarchical. У неё нет центра — и поэтому Гильдия не может её rm -rf.',
      '',
      'Ты видишь: бариста — узел. Альберт — узел. Катя — узел. Ты — узел. Зарема — узел. Александр — красная точка: узел-фильтр, или узел-двойной — внутри Гильдии, но подключён к сети. Виктория указывает: «Вот — как стихи путешествуют. Не по Сети — по людям. Не по кабелям — по голосам. Не по протоколам — по ритму. Гильдия контролирует цифровую сеть — но не может контролировать mesh из людей, которые помнят.»',
    ].join('\n'),
    contextNote: 'Виктория показывает топологию поэтической Сети — mesh из людей и стихов.',
    accessibilityAnnounce: 'Мария (Виктория) показывает карту поэтической сети: люди как узлы, стихи как связи.',
    speaker: 'npc_victoria',
    sceneId: 'zarema_room',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceNpcId: 'npc_maria',
    choices: [
      {
        text: 'Запомнить карту — я теперь знаю, кто в сети',
        next: 'act3_exp_victoria_network_map_understood',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
          { type: 'setFlag', flag: 'network_topology_known', flagValue: true },
          { type: 'showThought', thought: 'Я — узел. Не центр, не фильтр — узел. Mesh не имеет центра. Если меня удалят — сеть продолжит. Если Зарему — сеть продолжит. Стихи — не в одном месте — они everywhere. И everywhere — нельзя rm.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Спросить про Александра — красная точка, что это значит?',
        next: 'act3_exp_victoria_network_map_alexander',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'network_alexander_duality_known', flagValue: true },
        ],
      },
      {
        text: 'Уничтожить карту — если Гильдия найдёт её, все узлы — под ударом',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'addKarma', value: -2 },
          { type: 'setFlag', flag: 'network_map_destroyed', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_victoria_network_map_understood: {
    id: 'act3_exp_victoria_network_map_understood',
    text: [
      'Карта в голове — не на бумаге. Виктория уничтожает лист: «Не храни карты. Храни — людей. Карта — мишень. Люди — сеть. Если ты помнишь, кто — узел, ты — сам узел. Если ты забудешь — ты — точка, не соединённая ни с чем.»',
      '',
      'Она смотрит на тебя: «Теперь ты — знаешь топологию. Не по бумаге — по памяти. Память — не удаляется командой. Память — удаляется страхом. Не бойся — и сеть — жива. бойся — и ты — один. И один — rm легко.»',
    ].join('\n'),
    contextNote: 'Карта уничтожена, топология — в памяти. Память не удаляется командой.',
    speaker: 'npc_victoria',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Пойти к Александру — поговорить с красной точкой',
        next: 'act3_exp_alexander_confession',
        effects: [
          { type: 'addXp', value: 15 },
        ],
      },
      {
        text: 'Вернуться в парк — действовать',
        next: 'park_explore_mode',
        effects: [],
      },
    ],
  },

  act3_exp_victoria_network_map_alexander: {
    id: 'act3_exp_victoria_network_map_alexander',
    text: [
      'Виктория объясняет: «Красная точка — двойной узел. Александр — внутри Гильдии, но — подключён к Сети. Он — фильтр по должности, но — узел по намерению. Это — самый опасный вид: человек, который работает на систему, но — питает сеть. Гильдия не знает. Сеть — знает. Если Гильдия узнает — они удалите его. Если сеть перестанет доверять — он — потеряет смысл. Он — между rm и save, и каждый день — выбирает.»',
      '',
      'Ты понимаешь: Александр — не предатель и не герой. Он — мост. Мост между двумя системами, которые не хотят знать друг о друге. Мост — самое опасное место: с обеих сторон — падение. Но без моста — обе стороны — изолированы. И изолированные — rm.',
    ].join('\n'),
    contextNote: 'Александр — двойной узел: фильтр по должности, узел по намерению.',
    speaker: 'npc_victoria',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Найти Александра — мост нужно укрепить',
        next: 'act3_exp_alexander_confession',
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'alexander_bridge_approach', flagValue: true },
        ],
      },
      {
        text: 'Оставить его в покое — мост может рухнуть от слишком большой нагрузки',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'setFlag', flag: 'alexander_bridge_left_alone', flagValue: true },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     16.  LIBRARY READING NIGHT — secret poetry sharing
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_library_reading_night: {
    id: 'act3_exp_library_reading_night',
    text: [
      'Подвал библиотеки. Тусклый свет. Шесть человек — вокруг стола, на котором — листы бумаги, не экраны, не планшеты — бумага. Они читают. Не громко — шёпотом, как в старые времена, когда слова были — опасны, и произнести их вслух — означало — риск. Каждый — читает свой стих. Каждый — передаёт лист следующему. Бумага — циркулирует, как blood в mesh-сети.',
      '',
      'Катя стоит у двери — хранитель, не участник. Она — gatekeeper, и gate — поэтический. Один из читателей — старик, его руки — tremble, но голос — твёрдый: «Я — помню все стихи, которые они удалили. Я — не сервер. Я — не hard drive. Я — человек. И люди — не удаляются. Люди — помнят или — забывают. Я — выбрал помнить.»',
    ].join('\n'),
    contextNote: 'Подвал библиотеки: шесть человек читают стихи шёпотом, бумага циркулирует.',
    accessibilityAnnounce: 'Ночное чтение в подвалe библиотеки: люди тайно читают стихи.',
    speaker: 'narrator',
    sceneId: 'library_basement',
    ambientSound: 'sounds/ambient/library_basement.ogg',
    choices: [
      {
        text: 'Прочитать свой стих — тот, что я нашёл в коде',
        next: 'act3_exp_library_reading_night_share',
        goldenPath: true,
        condition: { minCollectedPoems: 3 },
        effects: [
          { type: 'addKarma', value: 6 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'library_reading_shared', flagValue: true },
        ],
      },
      {
        text: 'Слушать — не вмешиваться, просто впитывать',
        next: 'act3_exp_library_reading_night_share',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
          { type: 'setFlag', flag: 'library_reading_listened', flagValue: true },
          { type: 'showThought', thought: 'Шёпот. Бумага. Люди, которые помнят. Это — не кружок по интересам. Это — резервная копия культуры. Backup, который нельзя rm.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Уйти — я не готов читать вслух',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'library_reading_left', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_library_reading_night_share: {
    id: 'act3_exp_library_reading_night_share',
    text: [
      'Ты говоришь — тихо, но — чётко. Стих, который ты нашёл в серверном коде, между битами, между логами, между ошибками, которые не были ошибками. Люди слушают. Старик закрывает глаза. Молодая женщина — шёпотом: «Я — знала. Я — знала, что они — там. В коде. Я — не могла найти, но — знала. И ты — нашёл.»',
      '',
      'Бумага переходит от руки к руке. Твой стих — записан, скопирован, передан. Он — теперь не в одном месте — в шести руках, в шести головах, в шести сердцах. Mesh растёт. Каждый — узел. Каждый — backup. Гильдия может rm один узел — но не mesh. Mesh — не data structure, mesh — people structure. И people structure — не удаляется.',
    ].join('\n'),
    contextNote: 'Стих из кода прочитан, записан, передан. Mesh растёт.',
    speaker: 'volodka',
    sceneId: 'library_basement',
    choices: [
      {
        text: 'Остаться до конца — здесь — мой круг',
        next: 'act3_underground_meeting',
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addStat', stat: 'stress', value: -2 },
          { type: 'addXp', value: 20 },
        ],
      },
      {
        text: 'Уйти — рассвет близко, и я должен действовать',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'energy', value: 5 },
          { type: 'addXp', value: 10 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     17.  PARK OLD MONUMENT — erased poet names, only shadows remain
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_park_old_monument: {
    id: 'act3_exp_park_old_monument',
    text: [
      'Старый монумент — гранитный, советский, с площадью для надписей, которая — пуста. Не стёрта — вычищена. Гильдия не просто удалила текст — они удалили shadow текста. Но гранит — remembers. Если ты кладёшь ладонь на поверхность, ты чувствуешь — микро-впадины, следы букв, которые были вырезаны, а потом — сглажены. Имена поэтов. Они были здесь — десять, двадцать, тридцать имен. Теперь — только shadow.',
      '',
      'Shadow — не пустота. Shadow — след. Имена не удалены — они скрыты. И скрытое — можно восстановить. Не глазами — ладонями. Не сканером — кожей. Не алгоритмом — памятью. Ты проводишь пальцами по граниту, и буквы — проступают, как пульс под кожей. Одно имя. Второе. Третье. Они — живы. Не на поверхности — в глубине. Гильдия умеет стирать surface — но не depth.',
    ].join('\n'),
    contextNote: 'Гранитный монумент с вычищенными именами поэтов. Shadow-буквы под ладонью.',
    accessibilityAnnounce: 'Монумент: гранитный, пустая поверхность, но под ладонью — trace букв.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Восстановить имена — провести по граниту и записать',
        next: 'act3_exp_park_old_monument_restore',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'park_monument_names_restored', flagValue: true },
          { type: 'showThought', thought: 'Гильдия стирает surface, но не depth. Имена — не на поверхности — в глубине гранита, в глубине памяти. Удаление — бессильно против глубины.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Сканировать поверхность — technical approach',
        next: 'act3_exp_park_old_monument_restore',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'discoverLore', loreId: 'lore_monument_shadow_text' },
          { type: 'setFlag', flag: 'park_monument_technical_scan', flagValue: true },
        ],
      },
      {
        text: 'Уйти — имена — не моя ответственность',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'park_monument_skipped', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_park_old_monument_restore: {
    id: 'act3_exp_park_old_monument_restore',
    text: [
      'Имена проступают. Первое — Лебедев. Второе — Света. Третье — имя, которое ты не знаешь, но — чувствуешь. Четырнадцать имен, вырезанных в граните, сглаженных Гильдией, но — не уничтоженных. Ты записываешь их — на бумаге, не на устройстве. Бумага — не подключена к Сети. Бумага — не rm. Бумага — remember.',
      '',
      'Катя — библиотекарша — появится позже. Она скажет: «Я — знала, что ты — найдёшь. Монумент — тест. Кто — проходит ладонями — хранитель. Кто — проходит сканером — инженер. Кто — не проходит — наблюдатель. Хранители — rare. Инженеры — common. Наблюдатели — majority. Гильдия — хочет majority. Мы — хотим rare.»',
    ].join('\n'),
    contextNote: '14 имён восстановлены с монумента. Катя позже объяснит: хранители — rare.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Передать список Кате — она — хранитель имён',
        next: 'act3_exp_library_basement_door_kate',
        effects: [
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 4 },
          { type: 'addItem', itemId: 'monument_names_list' },
          { type: 'setFlag', flag: 'monument_names_given_kate', flagValue: true },
        ],
      },
      {
        text: 'Хранить список — я — тоже хранитель',
        next: 'park_explore_mode',
        effects: [
          { type: 'addItem', itemId: 'monument_names_list' },
          { type: 'addKarma', value: 3 },
          { type: 'addXp', value: 15 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     18.  STREET CAT NETWORK — cybernetic cat carries Zarema's data
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_street_cat_network: {
    id: 'act3_exp_street_cat_network',
    text: [
      'Кот. Тот же — кибернетический, с хромированным ушом, с диодом в хвостом, с глазами, которые — не кошачьи, а — камерные. Он появился во втором акте — в коридоре, в кафе, на улице. Теперь — он здесь. На улице, у билборда с записью протеста. И он — не просто гуляет. На его ошейнике — чип, маленький, почти невидимый. И в чипе — данные.',
      '',
      'Зарема использовала его. Кот — courier. Он — не подключён к Сети — его чип — offline, store-and-forward. Данные загружаются, кот идёт, данные выгружаются. Mesh network из кошек. Гильдия сканирует людей, устройства, серверы — но не кошек. Кошки — below threshold. Кошки — не data. Кошки — животные. И животные — не cataloguing. Это — дыра в системе. И Зарема — нашла её.',
    ].join('\n'),
    contextNote: 'Кибернетический кот у билборда: чип-курьер с данными Заремы.',
    accessibilityAnnounce: 'Кибернетический кот: хромированное ухо, чип-ошейник с данными.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Снять данные с чипа — что Зарема передаёт?',
        next: 'act3_exp_street_cat_network_data',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'cat_data_retrieved', flagValue: true },
        ],
      },
      {
        text: 'Погладить кота — и пусть идёт дальше',
        next: 'act3_exp_street_cat_network_data',
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addStat', stat: 'stress', value: -2 },
          { type: 'setFlag', flag: 'cat_petted', flagValue: true },
          { type: 'showThought', thought: 'Mesh network из кошек. Гильдия сканирует людей и серверы — но не кошек. Зарема нашла дыру: между животным и машиной. Кот — courier. Кот — backup. Кот — poetry.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Не трогать — если Гильдия следит, кот — мишень',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'cat_avoided', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_street_cat_network_data: {
    id: 'act3_exp_street_cat_network_data',
    text: [
      'Данные с чипа: координаты — три адреса, те же, что Александр нашёл в архивах Гильдии. И сообщение от Заремы: «Сеть — жива. Узлы — активны. Гильдия — cataloguing, но — не завершено. У нас — время. Но — мало. Действуй.» Кот смотрит на тебя — камерными глазами, которые — record и — transmit, но — не для Гильдии. Для — сети.',
      '',
      'Кот уходит. Его хвост — мигает зелёным — diode, который — не advertisement, а — beacon. Beacon для следующего узла, следующего человека, следующего места, где данные — выгрузятся, а стихи — продолжатся. Mesh из кошек. Mesh из людей. Mesh из ритмов. Всё — одно. Всё — живо.',
    ].join('\n'),
    contextNote: 'Данные с чипа: координаты и сообщение Заремы. Кот-курьер уходит.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Следовать координатам — Зарема говорит: действуй',
        next: 'act3_vault_siege',
        effects: [
          { type: 'addXp', value: 20 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Вернуться в парк — подготовиться',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'energy', value: 3 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     19.  CAFE POETRY CIRCLE — disguised as a coding meetup
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_cafe_poetry_circle: {
    id: 'act3_exp_cafe_poetry_circle',
    text: [
      'Задняя комната кафе. Экраны — открыты, на них — код. Но если ты — присмотрись — код — не обычный. Комментарии — не технические, а — поэтические. Variable names — не `buffer` и `stack`, а `ветер` и `память`. Функции — не `parse` и `filter`, а `слушать` и `помнить`. Это — не coding meetup. Это — поэтический кружок, замаскированный под coding meetup. Гильдия сканирует собрания — но не собрания, где люди — «пишут код.»',
      '',
      'Пять человек. Каждый — с экраном, каждый — с стихом, скрытым в комментарии. Они — не просто читают — они — debug. Они — исправляют строки, как исправляют функции. Они — коммитят стихи, как коммитят код. Репозиторий — не на GitHub — на бумаге, на памяти, на mesh из людей, которые — понимают, что код и стих — один язык.',
    ].join('\n'),
    contextNote: 'Задняя комната кафе: код с поэтическими комментариями, замаскированный кружок.',
    accessibilityAnnounce: 'Кафе, задняя комната: coding meetup, но код содержит стихи в комментариях.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    ambientSound: 'sounds/ambient/cafe_backroom.ogg',
    choices: [
      {
        text: 'Войти в кружок — я понимаю, код — и стих',
        next: 'act3_exp_cafe_poetry_circle_join',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'writing', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'cafe_poetry_circle_joined', flagValue: true },
        ],
      },
      {
        text: 'Наблюдать — не участвовать, просто слушать',
        next: 'act3_exp_cafe_poetry_circle_join',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'cafe_poetry_circle_observed', flagValue: true },
          { type: 'showThought', thought: 'function слушать() { return помнить; }. Они — не просто маскируются. Они — переписывают язык. Код и стих — один syntax. Один — compiler. Один — runtime.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Предупредить — Гильдия может раскрыть маскировку',
        next: 'act3_barista_safehouse',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'setFlag', flag: 'cafe_poetry_circle_warning', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_cafe_poetry_circle_join: {
    id: 'act3_exp_cafe_poetry_circle_join',
    text: [
      'Ты садишься. Открываешь экран. Твои пальцы — на клавиатуре. Ты пишешь: `function помнить(стих) { if (стих.жив) { return стих.смысл; } else { return искать(стих.след); } }`. Это — и функция, и обещание, и стих. Кружок — читает. Один — кивает. Другой — тихо: «Хороший код. Хороший стих. Разница — только в том, кто — читает. Compiler — читает как код. Человек — читает как стих. Но — оба — правы.»',
      '',
      'Альберт — здесь. Он — facilitator, не лидер. Он — node, не center. Mesh — не имеет центра. Каждый — равноценен. Каждый — пишет. Каждый — коммитит. Твоё стих-функция — в репозитории — на бумаге, не на сервере. Commit hash — не SHA — а ритм. Ритм — не удаляется. Ритм — продолжается.',
    ].join('\n'),
    contextNote: 'Вступление в кружок: стих-функция написана и закоммичена.',
    speaker: 'volodka',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Остаться — это мой круг, мой mesh',
        next: 'act3_exp_albert_manifest_draft',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addXp', value: 20 },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Уйти — завтра действовать, сегодня — отдыхать',
        next: 'park_explore_mode',
        effects: [
          { type: 'addStat', stat: 'energy', value: 5 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     20.  ZAREMA ROOM DISCOVERY — evidence the Guild has infiltrated the Network
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_zarema_room_discovery: {
    id: 'act3_exp_zarema_room_discovery',
    text: [
      'Комната Заремы. Ты — один, она — ушла — в ЧК, или — на задание, или — в другое место, которое — safer. На столе — её ноутбук, закрытый, но — не выключенный. На экране — файл, который она — не успела удалить. Файл — журнал, не её — Гильдии. Внутренний журнал, который кто-то — выкрал, или — который кто-то — пересылал, или — который Зарема — intercept.',
      '',
      'Журнал — list. List узлов Сети — твоё имя, имя Альберта, имя баристы, имя Кати. Но рядом с каждым — метка: «MONITORING» или «INfiltrated». И один — «RECRUITED». Один узел — не просто monitored — recruited. Один человек в сети — работает на Гильдию. Не фильтр — mole. Не двойной — тройной. И ты — не знаешь, кто.',
    ].join('\n'),
    contextNote: 'Комната Заремы: её ноутбук, внутренний журнал Гильдии с метками узлов.',
    accessibilityAnnounce: 'Комната Заремы: обнаружен внутренний журнал Гильдии с мониторингом узлов Сети.',
    speaker: 'narrator',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Внимательно изучить журнал — найти, кто RECRUITED',
        next: 'act3_exp_zarema_room_discovery_study',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'logic', difficulty: 16 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addKarma', value: 4 },
          { type: 'setFlag', flag: 'guild_journal_analyzed', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'showThought', thought: 'RECRUITED. Один — mole. Один — тройной. Я — не знаю, кто. Это — не паранойя — это — data. Гильдия — внутри сети. И внутри — ближе, чем я думал.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Скопировать журнал — и передать Зареме',
        next: 'act3_exp_zarema_room_discovery_study',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addItem', itemId: 'guild_infiltration_journal' },
          { type: 'setFlag', flag: 'guild_journal_copied', flagValue: true },
        ],
      },
      {
        text: 'Уничтожить файл — слишком опасно, если кто-то найдёт',
        next: 'act3_zarema_warning',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'setFlag', flag: 'guild_journal_destroyed', flagValue: true },
        ],
      },
    ],
  },

  act3_exp_zarema_room_discovery_study: {
    id: 'act3_exp_zarema_room_discovery_study',
    text: [
      'Журнал — детальный. Каждый узел — profile: name, location, function, threat level, monitoring status. Твой profile: «Volodka, engineer, 5th floor, node type: reader, threat: moderate, status: MONITORING.» Альберт: «Albert, cafe owner, node type: facilitator, threat: high, status: MONITORING.» Бариста: «Barista, cafe, node type: courier, threat: moderate, status: MONITORING.» И — одна строка, которая — меняет всё: имя — зашифровано, но — метка — открыта: «RECRUITED. Active infiltration. Node trust level: high. Guild internal ID: ???»',
      '',
      'Mole — кто-то, кого сеть — доверяет. Кто-то, кто — внутри mesh, но — работает на Гильдию. Кто-то, кто — не фильтр, не мост — mole. И ты — не знаешь, кто. Может — кто-то, кого ты — видел сегодня. Может — кто-то, кто — улыбнулся тебе. Может — кто-то, кто — сказал: «Я — с тобой.» В этом городе — доверие — не гарантия. Доверие — риск. И риск — теперь — data.',
    ].join('\n'),
    contextNote: 'Детальный журнал Гильдии: profiles узлов, один RECRUITED mole.',
    speaker: 'narrator',
    sceneId: 'zarema_room',
    choices: [
      {
        text: 'Найти Зарему — она знает больше, чем журнал',
        next: 'act3_exp_zarema_interrogation',
        effects: [
          { type: 'setFlag', flag: 'zarema_mole_investigation', flagValue: true },
          { type: 'addXp', value: 25 },
        ],
      },
      {
        text: 'Вернуться к сети — предупредить узлы',
        next: 'act3_exp_victoria_network_map',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'network_nodes_warning', flagValue: true },
        ],
      },
      {
        text: 'Уничтожить все копии — информация — тоже оружие',
        next: 'act3_decision_point',
        effects: [
          { type: 'setFlag', flag: 'guild_journal_all_destroyed', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     Act 3 hub beat — pier relay after Zarema's arrest (connects hub mesh to war arc)
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_pier_relay_after_arrest: {
    id: 'act3_exp_pier_relay_after_arrest',
    text: [
      'Трофим не спрашивает, что случилось. Он смотрит на воду, как на экран, и говорит тихо: «Зарему забрали — значит, релей сжимается. Гирлянда на столбах зажглась сама. Река слышит.»',
      '',
      'Он протягивает мокрую салфетку — на ней три кружка, как у Альберта, и цифра «1». «Отнеси в кафе. Не в телефон. Гильдия читает push. А вода — нет.»',
      '',
      'На секунду под пирсом гулит «Прогресс-7» — не громко, как heartbeat. Трофим кивает: «Завод тоже в сети. Просто молчит громче, чем мы.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'После ареста Заремы Трофим передаёт relay-сигнал на кафе.',
    choices: [
      {
        text: 'Взять салфетку — relay жив',
        next: 'pier_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act3_pier_relay_whisper_done', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 4 } },
          { type: 'addXp', value: 35 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     Act 3 hub beat — library card index hums after Zarema's arrest
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_library_relay_echo: {
    id: 'act3_exp_library_relay_echo',
    text: [
      'Каталог в подвале гудит не от вентиляции — от частоты. Карточка «777» вылезла сама, как язык, который долго держали за зубами. На обратной стороне — три слова, написанные чужим почерком: «Релей не умер».',
      '',
      'Ты понимаешь: пирс передал сигнал сюда, через воду и провода, пока Гильдия смотрела только в push-уведомления. Библиотека — тихий узел. Тихий — не значит мёртвый.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'После ареста Заремы каталог в библиотеке откликается на hub-relay.',
    choices: [
      {
        text: 'Запомнить частоту — сеть дышит',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act3_library_relay_echo_done', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_frequency_poem' },
          { type: 'addXp', value: 30 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     Act 3 hub beat — café acknowledges library relay (closes pier→library→café mesh)
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_cafe_relay_ack: {
    id: 'act3_exp_cafe_relay_ack',
    text: [
      'Бариста не поднимает глаз от эспрессо-машины. На стойке — салфетка, сложенная треугольником: три кружки и цифра «1», как на пирсе. Рядом — карточка «777», прижатая к чашке, будто её принесли не руками, а частотой.',
      '',
      '«Релей дошёл,» — шепчет он. «Гильдия видит только экран. Мы — видим стол. Отнеси Альберту: сеть жива, пока кто-то помнит, где поставить чашку.»',
    ].join('\n'),
    speaker: 'npc_barista',
    sceneId: 'cafe_evening',
    contextNote: 'После library relay бариста подтверждает hub-mesh: пирс → библиотека → кафе.',
    choices: [
      {
        text: 'Кивнуть — relay замкнулся',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act3_cafe_relay_ack_done', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
          { type: 'addXp', value: 25 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     Act 3 hub beat — office server room closes café→office relay leg
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_office_relay_ack: {
    id: 'act3_exp_office_relay_ack',
    text: [
      'Коллега не отрывается от терминала, но монитор мигает — не ошибкой, а ритмом. На клавиатуре лежит конверт из кафе, тот самый, что бариста когда-то передавал через сеть. Внутри — одна строка: «777 дошла».',
      '',
      '«Серверная слышит то, что Гильдия не логирует,» — говорит он тихо. «Кафе передало. Библиотека хранит. Пирс начал. Мы — последний узел, пока офис не стёрли в архив.»',
    ].join('\n'),
    speaker: 'office_colleague',
    sceneId: 'office_day',
    contextNote: 'После café relay коллега подтверждает hub-mesh: café → office server room.',
    choices: [
      {
        text: 'Запомнить — сеть замкнула офис',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act3_office_relay_ack_done', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
          { type: 'addXp', value: 25 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     Act 3 hub beat — guild mainframe closes office→mainframe relay leg
     ══════════════════════════════════════════════════════════════════════════ */
  act3_exp_guild_relay_ack: {
    id: 'act3_exp_guild_relay_ack',
    text: [
      'Стойки гудят не от охлаждения — от частоты. На центральной консоли вспыхивает строка, которую никто не вводил: «777 / OFFICE / ACK». Светодиоды на кабельных лотках мигают в такт, как heartbeat «Прогресс-7» под пирсом.',
      '',
      '«Офис передал,» — шепчет экран, будто помнит голос коллеги. «Гильдия не логирует. Мейнфрейм — помнит. Когда архив сотрёт офис, узел останется здесь — под полом, где push не дотягивается.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'guild_mainframe',
    contextNote: 'После office relay серверная подтверждает hub-mesh: office → guild mainframe.',
    choices: [
      {
        text: 'Запомнить — узел жив под полом',
        next: 'office_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'act3_guild_relay_ack_done', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_hub_relay_network' },
          { type: 'addXp', value: 25 },
        ],
      },
    ],
  },
};
