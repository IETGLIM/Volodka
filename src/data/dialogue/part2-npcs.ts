import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_PART2: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     COLLEAGUE – nervous office worker (7 nodes)
     Anxious, stammers. Always looking over shoulder.
     ═══════════════════════════════════════════════════════════ */

  office_colleague_dialogue: {
    id: 'office_colleague_dialogue',
    speaker: 'Коллега',
    text: 'Псс. Ты новый? Или... тебя Александр прислал? Слушай, я тут случайно наткнулся на кое-что в логах. Странные совпадения. Но я не уверен, что стоит кому-то рассказывать...',
    choices: [
      {
        text: 'Расскажи мне. Я умею держать язык за зубами.',
        next: 'office_colleague_share',
        condition: {
          minSkillCheck: { skill: 'persuasion', difficulty: 6 },
        },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Если это связано с инцидентом — мне нужно знать.',
        next: 'office_colleague_share',
        effects: [{ type: 'addKarma', value: 2 }],
      },
      {
        text: 'Делай как знаешь. Мне это неинтересно.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -3 } },
        ],
      },
      {
        text: 'Что ещё ты слышал? Сплетни тоже пригодятся.',
        next: 'colleague_gossip',
        condition: { flag: 'colleague_shared_poetry_code' },
        effects: [
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
      {
        text: 'Ты выглядишь напуганным. Кто тебя так пугает?',
        next: 'office_colleague_fear',
        condition: { minKarma: 30 },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Ты знаешь что-то про арест Заремы?',
        next: 'colleague_moral_conflict',
        condition: { requiredAct: 3, flag: 'zarema_arrested' },
      },
      {
        text: 'Штормовой ветер ещё во мне — помоги разобрать логи быстрее.',
        next: 'dialogue_storm_wind_live',
        condition: { activeTTLFlag: 'storm_wind_active', collectedPoem: 'poem_5' },
      },
    ],
  },

  dialogue_storm_wind_live: {
    id: 'dialogue_storm_wind_live',
    speaker: 'Коллега',
    text: '*шепчет, глядя на монитор* Ладно... Пока у тебя этот напор — смотри сюда. Вот цепочка commit-ов: они не случайны. Кто-то вшил ямб в diff. Если ветер ещё дует — успеешь вытащить ключ до того, как Александр заметит.',
    choices: [
      {
        text: 'Покажи цепочку.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'colleague_storm_hint', flagValue: true },
        ],
      },
      { text: 'Слишком рискованно.', next: null },
    ],
  },

  office_colleague_share: {
    id: 'office_colleague_share',
    speaker: 'Коллега',
    text: 'Ладно... Только тихо. Видишь эти метки времени в логах? Они образуют последовательность. Не случайную — это стихотворные размеры. Ямб, хорей, амфибрахий. Кто-то зашифровал стихи в самом коде. И это... это не вирус. Это послание.',
    choices: [
      {
        text: 'Стихи в коде? Кто мог такое сделать?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'colleague_shared_poetry_code', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Это может быть ловушкой.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'colleague_warning_trap', flagValue: true },
        ],
      },
    ],
  },

  colleague_gossip: {
    id: 'colleague_gossip',
    speaker: 'Коллега',
    text: 'Сплетни? О, у меня их полно. Слушай: Дмитрий — он не просто старший разраб. Говорят, у него есть доступ к архивам, которых официально не существует. И ещё: Александр получает странные письма. Каждую ночь. Без отправителя. Только строки кода. Он их читает и... плачет. Я видел. Не спрашивай откуда.',
    choices: [
      {
        text: 'Александр плачет? Это... неожиданно.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'alexander_crying_known', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
          { type: 'discoverLore', loreId: 'lore_alexander_schemes' },
          { type: 'discoverLore', loreId: 'lore_colleague_double_life' },
        ],
      },
      {
        text: 'Дмитрий и скрытые архивы? Мне нужно узнать больше.',
        next: 'colleague_reluctant_help',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  colleague_reluctant_help: {
    id: 'colleague_reluctant_help',
    speaker: 'Коллега',
    text: 'Не проси меня лезть в это! Я и так уже слишком много рассказал. Но... ладно. Вот что: терминал Дмитрия в северо-западном углу. Если он уйдёт на перерыв — между 14:00 и 14:20 — у тебя будет двадцать минут. Пароль — первые строчки «Евгения Онегина». Буквально. Он использует строки Пушкина как пароли. Только... если тебя поймают — я тебя не знаю.',
    choices: [
      {
        text: 'Спасибо. Ты рискуешь не меньше меня.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'dmitry_password_hint', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_terminal_window', flagValue: true },
        ],
      },
      {
        text: 'Пароль из Пушкина? Дмитрий — романтик.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'setFlag', flag: 'dmitry_password_hint', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_terminal_window', flagValue: true },
        ],
      },
    ],
  },

  office_colleague_fear: {
    id: 'office_colleague_fear',
    speaker: 'Коллега',
    text: 'Напуганным? Я... да, конечно я напуган. Ты бы тоже был на моём месте. Смотри, месяц назад у нас был аналитик — Олег. Хороший парень, тихий. Он тоже заметил стихи в логах. И знаешь что? Его больше нет. Не умер — просто... исчез. Его имя стёрли из базы. Его стол — пустой. Его пропуск — недействителен. Как будто его никогда не было. А я... я работал рядом с ним. Каждый день. И теперь я боюсь, что следующий — я.',
    choices: [
      {
        text: 'Мы найдём Олега. И всех остальных. Обещаю.',
        next: 'colleague_promise',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'oleg_search_pledged', flagValue: true },
        ],
      },
      {
        text: 'Кто это делает? Гильдия?',
        next: 'colleague_suspects',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 7 } },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
        ],
      },
      {
        text: 'Бежать поздно. Если они стирают людей — мы уже в списке.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  colleague_promise: {
    id: 'colleague_promise',
    speaker: 'Коллега',
    text: 'Ты... ты правда хочешь помочь? Ладно. Тогда слушай — Олег оставил мне сообщение. Перед тем как... перед. Он сказал: «Стихи в данных — это не баг. Это голос тех, кого стёрли. Ищи Архив-7. Там — всё.» Я не понимал тогда. Теперь понимаю. Олег нашёл Архив, и за это его стёрли. Но данные — они не исчезают бесследно. Я видел следы в логах. Там, где было имя Олега — теперь пустота. Но пустота имеет форму.',
    choices: [
      {
        text: 'Пустота имеет форму... Это звучит как стихотворение само по себе.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'oleg_void_form', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Ты можешь показать мне эти следы в логах?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'oleg_log_traces', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  colleague_suspects: {
    id: 'colleague_suspects',
    speaker: 'Коллега',
    text: 'Гильдия? Нет... Нет, я не думаю. Гильдия — они грубые. Они стирают файлы, удаляют учётные записи — но они оставляют следы. Всегда. А тут — ничего. Полная тишина. Как будто... как будто само пространство данных отказывается помнить Олега. Это что-то... изнутри сети. Что-то, что защищает стихи. Или... что-то, что питается ими. Я не знаю, Володька. Я просто знаю, что боюсь. И что стихи — это и причина, и единственная надежда.',
    choices: [
      {
        text: 'Стихи — наша единственная надежда. Я верю в это.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'colleague_poem_hope', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Мы должны действовать, пока не стали следующими.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ── COLLEAGUE expansion: trust checks, eavesdrop, betrayal/aid ── */

  colleague_overhear: {
    id: 'colleague_overhear',
    speaker: 'Коллега',
    text: 'Только между нами... Я слышал кое-что. Вчера, после смены, я задержался — забыл куртку. И слышал, как Александр разговаривал с кем-то по закрытому каналу. Он говорил про Архив-7. Говорил, что есть «человек внутри», который копирует данные. И что этот человек... «будет остановлен». Я не слышал имени. Но если это Дмитрий...',
    choices: [
      {
        text: 'Тебе нужно рассказать это Дмитрию. Он должен знать.',
        next: 'colleague_trust_test',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Молчи. Если Александр узнает, что ты слышал — ты следующий.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
        ],
      },
      {
        text: 'А если «человек внутри» — это ты, коллега?',
        next: 'colleague_betrayal',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 8 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  colleague_trust_test: {
    id: 'colleague_trust_test',
    speaker: 'Коллега',
    text: 'Рассказать Дмитрию? Я... Я не знаю. Я боюсь, Володька. Если я подойду к нему — кто-нибудь увидит. Если я отправлю сообщение — его перехватят. Я... Я скажу тебе. Только тебе. Потому что ты не из гильдии. У тебя нет причин меня предавать. Или... есть? Откуда я знаю, что ты не работаешь на Александра?',
    choices: [
      {
        text: 'Ты прав — доверять трудно. Но мы должны рискнуть. Вот тебе моя клятва: я никому не передам твои слова без разрешения.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 15 } },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
          { type: 'setFlag', flag: 'alexander_wants_dmitry_stopped', flagValue: true },
        ],
      },
      {
        text: 'Если хочешь — можешь не верить. Но информация дойдёт до Дмитрию — через меня.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
          { type: 'setFlag', flag: 'alexander_wants_dmitry_stopped', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Я докажу. Вот — я покажу тебе, что я нашёл в инциденте #4729.',
        next: null,
        condition: { flag: 'started_decryption' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
          { type: 'setFlag', flag: 'alexander_wants_dmitry_stopped', flagValue: true },
        ],
      },
    ],
  },

  colleague_betrayal: {
    id: 'colleague_betrayal',
    speaker: 'Коллега',
    text: '...Я... Нет! Я не... Ладно. Ты прав. Это я. Я копирую данные для Александра. Каждый месяц. Он платит мне — не деньгами, защитой. Он обещал, что моё имя не появится в списке на сокращение. Что меня не «забудут», как Олега. Я думал, что это просто... информация. Просто данные. Но когда я увидел стихи... Я понял, что копирую не байты. Я копирую чьи-то жизни. И я больше не могу. Помоги мне остановиться, Володька. Пока ещё можно.',
    choices: [
      {
        text: 'Я помогу. Но тебе нужно встретиться с Дмирием. Он прячет стихи — не стирает.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
          { type: 'setFlag', flag: 'colleague_double_agent', flagValue: true },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: -5 } },
        ],
      },
      {
        text: 'Ты предавал всех нас. Почему я должен тебе верить?',
        next: null,
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'setFlag', flag: 'colleague_suspicious', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: -5 } },
        ],
      },
      {
        text: 'Ты можешь стать двойным агентом — но уже для нас. Передавай Александру то, что мы хотим, чтобы он знал.',
        next: null,
        condition: { minSkillCheck: { skill: 'persuasion', difficulty: 7 } },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 10 } },
          { type: 'setFlag', flag: 'colleague_double_agent', flagValue: true },
          { type: 'setFlag', flag: 'colleague_trusted', flagValue: true },
        ],
      },
    ],
  },

  colleague_after_hours: {
    id: 'colleague_after_hours',
    speaker: 'Коллега',
    text: 'Псс! Володька! Я думал, ты уже ушёл. Слушай... я слышал кое-что ещё. После закрытия офиса — около одиннадцати — кто-то входит в серверную. Не через главный вход — через технический. Я видел тень. И слышал, как кто-то читает вслух. Тихо, почти шёпотом. Стихи. Кто-то приходит ночью, чтобы читать стихи серверам. Я сначала подумал — сошёл с ума. Но потом вспомнил: серверы — они же хранят данные. Может, стихи... оживляют их?',
    choices: [
      {
        text: 'Кто это может быть? Виктория? Дмитрий?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'night_reader_known', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Стихи, которые оживляют серверы... Это звучит как легенда Сети.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'colleague_heard_network_legend', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Нам нужно посмотреть своими глазами. Пойдём вместе.',
        next: null,
        condition: { flag: 'colleague_trusted' },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'night_stakeout_planned', flagValue: true },
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 12 } },
        ],
      },
    ],
  },

  /* ── BARISTA expansion: Network faction, eavesdrop, poem hints, voice shift ── */

  cafe_barista_network_hint: {
    id: 'cafe_barista_network_hint',
    speaker: 'Бариста',
    text: 'Знаешь, ты задаёшь слишком правильные вопросы для человека, который просто пьёт кофе. Может, тебе стоит спросить что-нибудь... неправильное. Я слышал, в этом городе есть люди, которые читают стихи не книгам — серверам. Звучит безумно? Может. Но они знают вещи, которые не знает никто. Если хочешь — приходи во второй вторник. Вечером. Когда закрываемся.',
    choices: [
      {
        text: 'Улица сегодня странно гудит… ты тоже слышишь?',
        next: 'cafe_barista_night_pulse',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Кто эти люди? Как их найти?',
        next: 'cafe_barista_network_reveal',
        condition: { minKarma: 50 },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Второй вторник. Запомню.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'barista_network_hint_received', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Ты говоришь загадками. Мне нужны прямые ответы.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: -3 } },
        ],
      },
    ],
  },

  cafe_barista_night_pulse: {
    id: 'cafe_barista_night_pulse',
    speaker: 'Бариста',
    text: 'Слышишь? Улица сегодня громче обычного. Не дождь — пульс. Башня гильдии мигает не в такт рекламе, а скамейка у подъезда… кто-то уже сидит и делает вид, что курит. Если выйдешь — не смотри прямо. Пусть город сам вас представит.',
    choices: [
      {
        text: 'Выйду на улицу — послушаю',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'night_city_pulse_felt', flagValue: true },
          { type: 'setFlag', flag: 'barista_night_pulse_hint', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Сначала кофе — потом улица',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'barista_night_pulse_hint', flagValue: true },
          { type: 'addStat', stat: 'energy', value: 5 },
        ],
      },
    ],
  },

  cafe_barista_eavesdrop: {
    id: 'cafe_barista_eavesdrop',
    speaker: 'Бариста',
    text: 'Видишь тех двоих в углу? Серые куртки, терминалы на столе? Они из Гильдии. Приходят каждую пятницу, пьют эспрессо и обсуждают «оптимизацию». На прошлой неделе я услышал: «Архив-7 — аллергия. Нужно вылечить.» И ещё: «Тот аналитик — что с ним?» — «Уже забыли.» Мне захотелось плеснуть им в лицо кипятком. Но я просто подал им счёт. Иногда бездействие — самое тяжёлое действие.',
    choices: [
      {
        text: 'Что ещё ты слышал от них?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'barista_guild_overheard', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Ты не бездействуешь. Ты слушаешь. Это тоже борьба.',
        next: 'cafe_barista_network_reveal',
        condition: { minSkillCheck: { skill: 'empathy', difficulty: 5 } },
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Забыли... Как можно забыть человека?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  cafe_barista_poem_hint: {
    id: 'cafe_barista_poem_hint',
    speaker: 'Бариста',
    text: 'Володька... Я слышал, как кто-то читал стихи. Здесь, в кафе. После закрытия. Голос шёл из подсобки — но я точно знаю, что там никого не было. Я проверил. Стихи были о... о звёздах, кажется. И о детях, которые хотят в космос. «Sic itur ad astra» — помню эту строку. Кто-то из Сети оставил послание в самом воздухе кафе. Или я схожу с ума. Что вероятнее — не знаю.',
    choices: [
      {
        text: 'Ты не сошёл с ума. Стихи живут в сетях. Я это знаю.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'barista_poem_phenomenon', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: '«Sic itur ad astra» — так шли к звёздам. Это латинская фраза.',
        next: 'cafe_barista_network_reveal',
        condition: { minSkillCheck: { skill: 'writing', difficulty: 4 } },
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'collectPoem', poemId: 'poem_12' },
        ],
      },
      {
        text: 'Может, это была запись? Динамик в подсобке?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  cafe_barista_network_reveal: {
    id: 'cafe_barista_network_reveal',
    speaker: 'Бариста',
    text: 'Ладно, Володька. Снимем маски. Я не просто бариста. Кафе «Синяя яма» — это узел Сети. Мы знаем о тебе больше, чем ты думаешь. Мы знаем, что ты расшифровал стихи в коде. Мы знаем, что Александр следит за тобой. И мы знаем, что ты не продался. Пока. Каждый «особый» кофе, который я подаю — это зашифрованное послание. Каждая салфетка со стихами — координаты. Я — контакт Сети в этом районе. И ты нам нужен.',
    choices: [
      {
        text: 'Я с вами. Скажите, что делать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 8 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 20 } },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'setFlag', flag: 'barista_network_ally', flagValue: true },
          { type: 'triggerQuest', questId: 'network_initiation' },
        ],
      },
      {
        text: 'Откуда вы знаете обо мне? Кто вам рассказал?',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'setFlag', flag: 'barista_network_ally', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Мне нужно подумать. Это... неожиданно.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  cafe_barista_deep_trust: {
    id: 'cafe_barista_deep_trust',
    speaker: 'Бариста',
    text: 'Володька, присядь. Тут кое-что для тебя. Виктория — она была здесь вчера. Оставила конверт. Сказала: «Отдай тому, кто слышит стихи в коде.» Внутри — координаты. Не физические — цифровые. Адрес сервера, который официально не существует. Там хранится то, что Гильдия пытается уничтожить уже три года. Архив-7 — или то, что от него осталось. Ты готов к правде? Однажды войдя — не выйдешь тем же.',
    choices: [
      {
        text: 'Я готов. Давай координаты.',
        next: null,
        effects: [
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: 8 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 25 } },
          { type: 'setFlag', flag: 'archive7_coordinates', flagValue: true },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'addItem', itemId: 'archive7_key', value: 1 },
        ],
      },
      {
        text: 'Почему Виктория доверила это тебе?',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
        ],
      },
      {
        text: 'А если это ловушка? Что если Гильдия подставила Викторию?',
        next: null,
        condition: { flag: 'alexander_suspicious' },
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
        ],
      },
    ],
  },

  cafe_barista_other_secrets: {
    id: 'cafe_barista_other_secrets',
    speaker: 'Бариста',
    text: 'Хочешь знать, кто ещё ходит сюда? Альберт — каждый вечер, один и тот же столик. Он не просто философ — он хранитель. Зарема приходит по утрам, заказывает чай и шепчет стихи на татарском, думая, что никто не слышит. Дмитрий — раз в неделю, всегда после полуночи, всегда с терминалом. Он копирует сюда данные на наш сервер. А Александр... Александр приходит, когда думает, что его никто не видит. И плачет. Заказывает чёрный кофе и плачет в чашку. Вы все — часть чего-то большего, чем сами знаете.',
    choices: [
      {
        text: 'Ты наблюдаешь за всеми нами. Зачем?',
        next: 'cafe_barista_network_reveal',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Александр плачет? Это... меняет всё.',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'setFlag', flag: 'alexander_crying_barista', flagValue: true },
        ],
      },
      {
        text: 'Дмитрий копирует данные на ваш сервер? Значит, Сеть уже спасает стихи.',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'dmitry_network_backup_known', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  cafe_barista_quest_trigger: {
    id: 'cafe_barista_quest_trigger',
    speaker: 'Бариста',
    text: 'Володька, время пришло. Сеть готова принять тебя. Но прежде — одно задание. В офисе Гильдии есть терминал с меткой «Архив-7». Нам нужен его IP-адрес. Не взламывай — просто запиши. Это безопасно. Но если тебя поймают... Я тебя не знаю. Удачи. И — вам с сахаром или без?',
    choices: [
      {
        text: 'Без сахара. Я готов.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'setFlag', flag: 'barista_quest_accepted', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_backup_trial' },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 15 } },
        ],
      },
      {
        text: 'С сахаром. И ещё — расскажи мне о Сети. Всё.',
        next: 'cafe_barista_network_reveal',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'energy', value: 15 },
          { type: 'setFlag', flag: 'network_contact', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Я не шпион, бариста. Найдите другого.',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 3 },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: -5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     RETURN DIALOGUE NODES
     ═══════════════════════════════════════════════════════════ */

  office_colleague_return: {
    id: 'office_colleague_return',
    speaker: 'Коллега',
    text: 'Псс... Ты снова здесь. *оглядывается* Я... я не против. Просто — тише, ладно? После прошлого раза я три дня проверял, не следят ли за мной.',
    choices: [
      {
        text: 'Что нового? Какие-нибудь свежие логи?',
        next: 'office_colleague_share',
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Тебе нечего бояться. Я прикрою.',
        next: null,
        condition: { flag: 'colleague_trusted' },
        effects: [
          { type: 'npcChange', npcId: 'office_colleague', npcChange: { relation: 3 } },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
      {
        text: 'Расскажи, что ещё ты слышал.',
        next: 'colleague_gossip',
        condition: { flag: 'colleague_shared_poetry_code' },
      },
      {
        text: 'Не буду тебя задерживать. Увидимся.',
        next: null,
      },
    ],
  },

  office_alexander_return: {
    id: 'office_alexander_return',
    speaker: 'Александр',
    text: 'Володька. Ты вернулся. Я... не ожидал. Впрочем, если ты здесь — значит, тебе что-то нужно. Гильдия не ждёт, но и не гонит. Пока.',
    choices: [
      {
        text: 'Расскажи, что происходит в гильдии.',
        next: 'office_alexander_politics',
        condition: { flag: 'alexander_suspicious' },
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
      {
        text: 'Я нашёл кое-что в инциденте #4729.',
        next: 'office_alexander_task',
        condition: { flag: 'started_decryption' },
      },
      {
        text: 'Александр... Ты плачешь по ночам. Почему?',
        next: null,
        condition: { flag: 'alexander_crying_known' },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'office_alexander', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Нам не о чем говорить.',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  cafe_barista_return: {
    id: 'cafe_barista_return',
    speaker: 'Бариста',
    text: 'Снова в «Синей яме»? Тебе здесь рады. Хотя... после того, что ты узнал, — может, уже не за кофе приходишь?',
    choices: [
      {
        text: 'Кофе. Просто кофе.',
        next: 'cafe_barista_dialogue',
        effects: [{ type: 'addStat', stat: 'energy', value: 10 }],
      },
      {
        text: 'Какие новости от Сети?',
        next: 'cafe_barista_network_hint',
        condition: { flag: 'network_contact' },
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Новые салфетки со стихами?',
        next: 'cafe_barista_secret_messages',
        condition: { flag: 'barista_poems_received' },
      },
      {
        text: 'Увидимся, бариста.',
        next: null,
      },
    ],
  },

  maria_return: {
    id: 'maria_return',
    speaker: 'Виктория',
    speakerId: 'maria',
    text: 'Ты вернулся. Я... рада. Между нами — провода, данные, тишина. Но что-то тянет тебя сюда. Или кто-то.',
    choices: [
      {
        text: 'Расскажи мне больше о себе. Кто ты на самом деле?',
        next: 'maria_dialogue_identity',
        condition: { minNpcRelation: 40 },
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
      {
        text: 'Что ты знаешь об Архиве-7?',
        next: null,
        condition: { flag: 'maria_revealed_past' },
        effects: [
          { type: 'setFlag', flag: 'maria_archive_asked', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Гильдия не спит. Ты в опасности?',
        next: null,
        condition: { flag: 'maria_pledge_help' },
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 2 } },
        ],
      },
      {
        text: 'Мне пора.',
        next: null,
      },
    ],
  },

  office_dmitry_return: {
    id: 'office_dmitry_return',
    speaker: 'Дмитрий',
    speakerId: 'dmitry',
    text: 'Володька... Ты вернулся. Я... рад. Не думал, что скажу такое о ком-то из офиса. Садись. Только не при Александре.',
    choices: [
      {
        text: 'Что нового в старых логах?',
        next: 'dmitry_guild_knowledge',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
      {
        text: 'Как твои тайные сервера? Целы?',
        next: null,
        condition: { flag: 'dmitry_secret_shared' },
        effects: [
          { type: 'npcChange', npcId: 'office_dmitry', npcChange: { relation: 3 } },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Помоги с расшифровкой инцидента.',
        next: 'dmitry_technical_assist',
        condition: { flag: 'started_decryption' },
      },
      {
        text: 'Увидимся, Дмитрий.',
        next: null,
      },
    ],
  },

};
