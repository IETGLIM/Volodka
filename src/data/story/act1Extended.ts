import type { StoryNode } from '@/shared/types/game';

/**
 * Act 1 extended beats — morning prologue from wake through leaving home.
 * Optional branches that deepen the first chapter without altering golden-path spine.
 */
export const STORY_NODES_ACT1_EXTENDED: Record<string, StoryNode> = {
  room_terminal_wake: {
    id: 'room_terminal_wake',
    text: 'Терминал не спит — зелёное приглашение root@volodka мигает, как пульс. Три окна: слева — логи, в центре — обрывок стиха, справа — красная строка от IT-гильдии. «Инцидент #4729. Требуется диагностика. Явка обязательна.» Под сообщением — метка времени: 03:47. Ты не помнишь, чтобы просыпался в три сорок семь. Но кто-то, кажется, помнит за тебя.',
    contextNote: 'Три монитора светятся в темноте комнаты. Центральный экран — обрывок стиха.',
    accessibilityAnnounce: 'Терминал: сообщение гильдии и черновик стиха.',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Прочитай сообщение гильдии или сохрани лог с терминала.',
    guidanceSceneLabel: 'Комната Володьки',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Сохранить лог и выйти из терминала',
        next: 'room_table',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'checked_terminal', flagValue: true },
          { type: 'setFlag', flag: 'read_guild_message', flagValue: true },
          { type: 'setFlag', flag: 'morning_terminal_read', flagValue: true },
          { type: 'setFlag', flag: 'morning_ritual_terminal', flagValue: true },
        ],
      },
      {
        text: 'Попробовать взломать черновик стиха на среднем экране',
        next: 'room_table',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'checked_terminal', flagValue: true },
          { type: 'setFlag', flag: 'morning_poem_draft_seen', flagValue: true },
          { type: 'setFlag', flag: 'morning_ritual_terminal', flagValue: true },
        ],
      },
      {
        text: 'Ответить гильдии — «Буду через час»',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'accepted_guild_quest', flagValue: true },
          { type: 'setFlag', flag: 'checked_terminal', flagValue: true },
          { type: 'triggerQuest', questId: 'incident_scroll_4729' },
        ],
      },
    ],
  },

  room_wardrobe_memory: {
    id: 'room_wardrobe_memory',
    text: 'На верхней полке — фотоальбом, который ты давно не открывал. Гимназия, первый компьютер, Солныш с Умкой на лестнице, отец у паяльника. Между страницами — листок с четырьмя строками, написанными другим почерком: «Не всё, что стёрто, исчезло. Некоторые вещи просто ждут, пока их прочитают.»',
    contextNote: 'Вы стоите у шкафа. В руках — старый фотоальбом, пахнет пылью и кедром.',
    ambientSound: 'sounds/ambient/room_wardrobe_creak.ogg',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Фотоальбом хранит строки, которые ждут читателя.',
    guidanceSceneLabel: 'Платяной шкаф',
    guidanceObjectiveType: 'make_choice',
    soundEffect: 'ui_open',
    choices: [
      {
        text: 'Записать строки в блокнот',
        next: 'explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 2 },
          { type: 'discoverLore', loreId: 'lore_volodka_engineer' },
          { type: 'collectPoem', poemId: 'poem_5' },
          { type: 'setFlag', flag: 'wardrobe_memory_read', flagValue: true },
          { type: 'setFlag', flag: 'morning_ritual_wardrobe', flagValue: true },
        ],
      },
      {
        text: 'Отложить альбом — не сейчас',
        next: 'explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'setFlag', flag: 'morning_ritual_wardrobe', flagValue: true },
        ],
      },
    ],
  },

  corridor_letter_open: {
    id: 'corridor_letter_open',
    text: 'Третий ящик сверху. Конверт без марки, без обратного адреса — только «Володька», написанное почерком, который ты почти узнаёшь. Бумага пожелтела. Зарема однажды спрашивала: «Может, откроешь?» Ты ответил: «Не готов.» Сейчас пальцы дрожат не от холода.',
    contextNote: 'Ряд почтовых ящиков. Третий сверху — конверт без марки.',
    accessibilityAnnounce: 'Почтовые ящики в коридоре.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    guidanceHint: 'В почтовом ящике — письмо без марки. Открыть?',
    guidanceObjectiveType: 'collect_item',
    guidanceSceneLabel: 'Коридор',
    soundEffect: 'ui_open',
    choices: [
      {
        text: 'Открыть письмо',
        next: 'corridor_letter_read',
        effects: [
          { type: 'setFlag', flag: 'corridor_letter_opened', flagValue: true },
          { type: 'triggerQuest', questId: 'corridor_letter' },
        ],
      },
      {
        text: 'Положить обратно — ещё рано',
        next: 'corridor_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  corridor_letter_read: {
    id: 'corridor_letter_read',
    text: 'Внутри — одна строка, без подписи: «Когда в игру вступают деньги, правда становится товаром. Но стихи не продаются — их только прячут.» Почерк совпадает с комментариями в коде инцидента #4729. На обороте — схема: комната, коридор, кафе, башня. Стрелка указывает на «Синюю яму».',
    contextNote: 'Шелест бумаги. На ладони — пожелтевший лист с одной строкой.',
    ambientSound: 'sounds/ambient/paper_rustle.ogg',
    autoSave: true,
    musicCue: 'discovery',
    soundEffect: 'item_use',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    guidanceHint: 'Спрятай письмо или покажи Зареме — она может узнать почерк.',
    guidanceObjectiveType: 'collect_item',
    choices: [
      {
        text: 'Спрятать письмо в карман',
        next: 'corridor_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'corridor_letter_kept', flagValue: true },
          { type: 'addItem', itemId: 'anonymous_letter', value: 1 },
        ],
      },
      {
        text: 'Показать Зареме — может, она знает почерк',
        next: 'zarema_letter_reaction',
        effects: [{ type: 'transitionScene', sceneId: 'home_evening' }],
      },
    ],
  },

  zarema_letter_reaction: {
    id: 'zarema_letter_reaction',
    text: 'Зарема читает строку и бледнеет. «Это... похоже на почерк Владимира. Твоего... того, кого стёрли из архивов.» Она сжимает твою руку. «Не показывай никому в гильдии. Но и не выбрасывай. Некоторые письма приходят не по почте — они приходят, когда ты готов.»',
    contextNote: 'Кухня. Зарема держит письмо дрожащими руками.',
    speaker: 'Зарема',
    sceneId: 'home_evening',
    guidanceNpcId: 'zarema',
    guidanceHint: 'Зарема узнала почерк — поблагодари и реши, что делать с письмом.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Спасибо, Зарема. Я запомню.',
        next: 'corridor_explore_mode',
        effects: [
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'corridor_letter_kept', flagValue: true },
          { type: 'addItem', itemId: 'anonymous_letter', value: 1 },
        ],
      },
    ],
  },

  corridor_intercom_whisper: {
    id: 'corridor_intercom_whisper',
    text: 'Динамик трещит. Голос — искажённый, как через старый модем: «Володька... не иди в гильдию одним путём. Синяя яма — первая остановка. Там тебя ждут не только кофе.» Щелчок. Камера над дверью моргает красным и гаснет. На стене остаётся отражение, которое запаздывает на полсекунды.',
    textVariants: {
      highKarma: 'Динамик трещит мягко. Голос тёплый, как через старый модем: «Володька... тебя ждут в Синей яме. Не бойся. Там свои.» Щелчок. Камера мигает и гаснет.',
      neutralKarma: 'Динамик трещит. Голос — искажённый, как через старый модем: «Володька... не иди в гильдию одним путём. Синяя яма — первая остановка. Там тебя ждут не только кофе.» Щелчок.',
      lowKarma: 'Динамик скрипит. Голос резкий, с паузами: «Володька... не доверяй никому. Даже мне. Синяя яма — ловушка или спасение. Решай сам.» Щелчок. Камера моргает красным.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Домофон у входа трещит. Камера над дверью мигает красным.',
    ambientSound: 'sounds/ambient/intercom_static.ogg',
    soundEffect: 'notify',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    guidanceHint: 'Запиши слова из домофона — они могут пригодиться.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Записать слова — потом разберусь',
        next: 'corridor_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'heard_intercom_whisper', flagValue: true },
          { type: 'setFlag', flag: 'morning_ritual_intercom', flagValue: true },
        ],
      },
      {
        text: 'Проигнорировать — слишком похоже на паранойю',
        next: 'corridor_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: 3 }],
      },
    ],
  },

  umka_corridor_pet: {
    id: 'umka_corridor_pet',
    text: 'Умка подходит, тыкается мокрым носом в ладонь и виляет хвостом — коротко, по-деловому, как будто проверяет, жив ли ты. Солныш смеётся: «Видишь? Она тебя помнит с гимназии.» Собака садится у зеркала и смотрит на вас обоих — верный третий в разговоре, который ещё не начался.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    contextNote: 'Умка — маленькая собака у ног Солныш. Шерсть мягкая, хвост виляет.',
    guidanceNpcId: 'solnysh',
    guidanceHint: 'Погладь Умку — Солныш оценит.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Почесать за ухом',
        next: 'corridor_explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: -4 },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 2 } },
          { type: 'setFlag', flag: 'umka_petted', flagValue: true },
        ],
      },
      {
        text: 'Вернуться к разговору',
        next: 'corridor_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: 1 }],
      },
    ],
  },

  zarema_radio_request: {
    id: 'zarema_radio_request',
    text: '«Володька, радио опять шипит,» — Зарема кивает на «Океан» у окна. «Между станциями иногда пробивается голос — не музыка, не новости. Словно кто-то читает стихи в белом шуме. Альберт говорил, это «эхо Краха». Можешь покрутить настройку? Я боюсь лезть — там слишком много проводов.»',
    contextNote: 'На подоконнике — старый приёмник «Океан», шипит белым шумом.',
    ambientSound: 'sounds/ambient/radio_static.ogg',
    speaker: 'Зарема',
    sceneId: 'home_evening',
    guidanceNpcId: 'zarema',
    guidanceHint: 'Настрой «Океан» — в белом шуме слышен эхо.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Попробую настроить приёмник',
        next: 'home_evening_explore_mode',
        effects: [
          { type: 'triggerQuest', questId: 'zarema_radio' },
          { type: 'setFlag', flag: 'zarema_radio_quest_started', flagValue: true },
          { type: 'setFlag', flag: 'zarema_radio_needs_fix', flagValue: true },
        ],
      },
      {
        text: 'Сейчас некогда — мне в кафе',
        next: 'kitchen_window',
        effects: [{ type: 'npcChange', npcId: 'zarema', npcChange: { relation: -2 } }],
      },
    ],
  },

  zarema_radio_success: {
    id: 'zarema_radio_success',
    text: 'Шипение стихает на полсекунды — и сквозь статику проступает голос, читающий четыре строки. Ты узнаёшь ритм: это не радиостанция. Это архив, который кто-то транслирует в эфир, пока гильдия спит. Зарема закрывает глаза и шепчет: «Спасибо. Теперь я знаю, что он ещё где-то рядом.»',
    condition: { flag: 'zarema_radio_quest_started' },
    contextNote: 'Радио на мгновение замолкает. Сквозь шум — четыре строки стиха.',
    ambientSound: 'sounds/ambient/radio_static_clear.ogg',
    musicCue: 'discovery',
    soundEffect: 'quest_complete',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'home_evening',
    guidanceNpcId: 'zarema',
    guidanceHint: 'Эхо в эфире — стих найден. Поблагодари Зарему.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Поблагодарить и собраться в путь',
        next: 'kitchen_window',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'zarema_radio_fixed', flagValue: true },
          { type: 'collectPoem', poemId: 'poem_16' },
        ],
      },
    ],
  },

  street_guild_pulse: {
    id: 'street_guild_pulse',
    text: 'Башня IT-гильдии пульсирует ровным светом — fifty hertz, как лампочка в коридоре, как серверы за стеной твоей комнаты. В три часа сорок семь ночью, говорят, гул прерывается на секунду. Сейчас вечер, но ты замечаешь: окна верхних этажей мигают не в такт рекламе. Кто-то там работает. Или кто-то там не спит уже давно.',
    contextNote: 'Улица. Вдали пульсирует башня IT-гильдии.',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Запомни ритм башни — он совпадает с гулом в коридоре.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Запомнить ритм — пригодится',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'spotted_night_servers', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'triggerQuest', questId: 'night_shift_mystery' },
        ],
      },
      {
        text: 'Не думать об этом — идти дальше',
        next: 'street_bench',
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  cafe_albert_lesson_intro: {
    id: 'cafe_albert_lesson_intro',
    text: 'Альберт отодвигает кружку и рисует на салфетке: «function poem() { return truth; }» — «Видишь? Синтаксис разный, намерение одно. Гильдия учит писать код без души. Я хочу доказать обратное. Реши мою загадку — и покажи, что понимаешь связь.»',
    contextNote: 'Угол кафе. Альберт рисует на салфетке псевдокод.',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'albert',
    guidanceHint: 'Прими урок Альберта — код и стих едины.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Принять вызов — какая загадка?',
        next: 'cafe_albert_riddle',
        effects: [{ type: 'triggerQuest', questId: 'alberts_lesson' }],
      },
      {
        text: 'Мне некогда — инцидент ждёт',
        next: 'cafe_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  cafe_albert_riddle: {
    id: 'cafe_albert_riddle',
    text: '«Три слова,» — шепчет Альберт. «Переменная, которая хранит правду. Функция, которая её возвращает. И комментарий, который нельзя удалить — потому что это и есть стих. Найди их в логах инцидента #4729, когда будешь в офисе. А пока — вот тебе подсказка: truth без return — это молчание.»',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'albert',
    guidanceHint: 'Ищи truth, return и стих в логах инцидента — потом вернись к Альберту.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Запомнил. Спасибо, Альберт.',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'albert_lesson_started', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 5 } },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
      {
        text: 'Я уже видел truth в логах — вот ответ',
        next: 'cafe_albert_riddle_solved',
        condition: { flag: 'started_decryption' },
      },
      {
        text: 'Стих в коде — я уже расшифровал',
        next: 'cafe_albert_riddle_solved',
        condition: { flag: 'found_first_poem' },
      },
    ],
  },

  cafe_albert_riddle_solved: {
    id: 'cafe_albert_riddle_solved',
    text: 'Альберт медленно кивает. «truth. return. И комментарий, который нельзя стереть — стих в логах #4729. Ты видишь то, что гильдия называет шумом.» Он протягивает руку: «Добро пожаловать в меньшинство, Володька.»',
    contextNote: 'Альберт улыбается — редкое событие в «Синей яме».',
    musicCue: 'discovery',
    soundEffect: 'quest_complete',
    speaker: 'Альберт',
    sceneId: 'cafe_evening',
    guidanceNpcId: 'albert',
    guidanceHint: 'Загадка решена — Альберт признал твой ответ.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Спасибо за урок.',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'solved_albert_riddle', flagValue: true },
          { type: 'setFlag', flag: 'proved_poetry_code_link', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 8 } },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addKarma', value: 3 },
          { type: 'collectPoem', poemId: 'poem_8' },
        ],
      },
    ],
  },

  morning_ritual_complete: {
    id: 'morning_ritual_complete',
    text: 'Комната, коридор, кухня — ты прошёл их не впервые, но сегодня впервые по-настоящему осмотрел. Терминал, полка, окно, шкаф. Почта, домофон, чай у Заремы. Город за окном не стал добрее — но ты знаешь его утренние тени чуть лучше. Где-то внутри щёлкает переключатель: пролог закончен, история начинается.',
    contextNote: 'Утренний ритуал завершён. Город ждёт за окном.',
    accessibilityAnnounce: 'Пролог завершён.',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    autoSave: true,
    choices: [
      {
        text: 'Пора выходить — город ждёт',
        next: 'go_to_cafe',
        effects: [
          { type: 'addXp', value: 40 },
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'morning_ritual_complete', flagValue: true },
        ],
      },
    ],
  },
};
