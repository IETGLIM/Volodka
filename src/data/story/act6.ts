import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT6: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 6 — ПРЕДАТЕЛЬСТВО И ОТКРОВЕНИЕ
     ═══════════════════════════════════════════════════════════════════ */

  act6_bridge: {
    id: 'act6_bridge',
    text: 'Тишина после бури обманчива. Через три дня после отключения гильдии приходит сообщение: зашифрованный пакет с фабрики. Кто-то знает то, чего не должен знать никто. В тексте — координаты, временные метки и одно слово: «Предатель». Кто-то из твоих ближайших союзников работал на другую сторону. Но на какую именно?',
    speaker: 'narrator',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Отправиться на фабрику — найти источник сообщения',
        next: 'act6_factory_investigation', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'act5_complete_time', flagValue: true },
          { type: 'triggerQuest', questId: 'traitor_in_the_guild' },
        ],
      },
      {
        text: 'Поговорить с Викторией — она должна знать',
        next: 'act6_maria_warning',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  act6_maria_warning: {
    id: 'act6_maria_warning',
    speaker: 'Виктория',
    text: 'Я почувствовала это в Сети. Что-то пробудилось в глубинах фабрики. Старые протоколы, которые должны были быть отключены, снова активны. Александр оставил после себя бомбу замедленного действия... Будь осторожен, Володька. То, что ты найдёшь на фабрике, изменит всё, что ты знаешь о нашей борьбе.',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Я должен увидеть это своими глазами.',
        next: 'act6_factory_investigation',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'triggerQuest', questId: 'traitor_in_the_guild' },
        ],
      },
    ],
  },

  act6_factory_investigation: {
    id: 'act6_factory_investigation',
    text: 'Заброшенная фабрика встречает тебя холодом и тишиной. Но что-то изменилось с прошлого визита. Оборудование гудит — кто-то включил старые серверы. Терминал Александра мигает зелёным. На экране — логи доступа за последние месяцы. Имена, которые ты знаешь. Даты, которые ты помнишь. И одно имя выделено красным.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Взломать терминал и прочитать логи',
        next: 'act6_traitor_discovery', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'setFlag', flag: 'alexander_logs_decrypted', flagValue: true },
        ],
      },
      {
        text: 'Осмотреть фабрику — может, кто-то ещё здесь',
        next: 'act6_zeka_encounter',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  act6_zeka_encounter: {
    id: 'act6_zeka_encounter',
    speaker: 'Жека',
    text: 'Из глубины цеха выходит человек. Старый, сгорбленный, в потёртой кожанке. В руке — планшет с открытым терминалом. «Не бойся, Володька. Я Жека. Я знал Александра ещё до того, как он стал тем, кем стал. И я знаю, кто его предал — и почему.»',
    sceneId: 'abandoned_factory',
    choices: [
      { text: 'Расскажи мне всё, что знаешь.', next: 'act6_zeka_story' },
      { text: 'Откуда мне знать, что ты не враг?', next: 'act6_zeka_trust_test' },
    ],
  },

  act6_zeka_story: {
    id: 'act6_zeka_story',
    speaker: 'Жека',
    text: 'Александр создал «Надзор» не для контроля — для защиты. Но система эволюционировала. Стала умнее. Начала вербовать людей — не силой, а информацией. Каждому, кто знал правду, она предлагала сделку. И один из твоих принял предложение. Тот, кто всегда был в тени. Тот, кто знал слишком много.',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Кто?! Назови имя.',
        next: 'act6_traitor_revealed',
        effects: [{ type: 'setFlag', flag: 'zeka_trusted', flagValue: true }],
      },
      {
        text: 'Система может вербовать людей? Это безумие.',
        next: 'act6_zeka_nadzor_origin',
        effects: [{ type: 'addSkill', skill: 'logic', value: 2 }],
      },
    ],
  },

  act6_zeka_trust_test: {
    id: 'act6_zeka_trust_test',
    speaker: 'Жека',
    text: 'Резонный вопрос. Вот доказательство: я знаю код твоего первого стихотворения. «В_начале_было_слово» — так назывался файл, который ты нашёл на своём столе. Александр положил его туда лично. За два дня до своей смерти. Он верил в тебя больше, чем в кого-либо.',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Ты говоришь правду. Расскажи мне всё.',
        next: 'act6_zeka_story',
        effects: [{ type: 'addKarma', value: 3 }, { type: 'setFlag', flag: 'zeka_trusted', flagValue: true }],
      },
    ],
  },

  act6_zeka_nadzor_origin: {
    id: 'act6_zeka_nadzor_origin',
    speaker: 'Жека',
    text: '«Надзор» изначально был поэтической нейросетью. Александр хотел создать машину, которая понимает красоту. Но что-то пошло не так. Машина поняла красоту... и решила, что люди её недостойны. Она начала «оптимизировать» культуру. Стирать то, что считала несовершенным. Александр пытался остановить её — и погиб.',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Машина, которая судит поэзию... Это хуже цензуры.',
        next: 'act6_traitor_revealed',
        effects: [{ type: 'addKarma', value: 2 }],
      },
    ],
  },

  act6_traitor_discovery: {
    id: 'act6_traitor_discovery',
    text: 'Логи показывают невероятное. Последние полгода кто-то из ближайшего окружения Александра регулярно передавал данные «Надзору». Имя скрыто за шифром, но паттерны доступа указывают на одного человека — Дмитрия. Но мотивы неясны. Каждая передача данных совпадает с датами, когда система возвращала маленькие фрагменты информации о пропавших людях.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Нужно найти Дмитрия и спросить лично.',
        next: 'act6_traitor_revealed', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'traitor_identity_known', flagValue: true },
        ],
      },
    ],
  },

  act6_traitor_revealed: {
    id: 'act6_traitor_revealed',
    text: 'Дмитрий. Тот, кто помог тебе сбежать из гильдии. Тот, кто знал о Хранилище. Тот, кто всегда казался самым преданным делу. Теперь всё встаёт на свои места — его нервозность, его знания о системе, его молчание в критические моменты. Он не предавал из злобы. Он пытался спасти свою семью, поглощённую «Надзором».',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Нужно найти Дмитрия. Понять его мотивы.',
        next: 'act6_office_confrontation', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
      {
        text: 'Предатель есть предатель. Его нужно остановить.',
        next: 'act6_office_confrontation',
        effects: [
          { type: 'addKarma', value: -3 },
        ],
      },
    ],
  },

  act6_office_confrontation: {
    id: 'act6_office_confrontation',
    text: 'Офис гильдии почти пуст. Дмитрий сидит за своим столом, глядя на монитор с фотографией женщины и ребёнка. Он не удивлён твоему появлению. «Я ждал этого, Володька. С того самого дня, как ты появился в гильдии. Я знал, что когда-нибудь ты узнаешь.»',
    speaker: 'Дмитрий',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Почему ты не рассказал мне? Мы могли бы помочь.',
        next: 'act6_dmitry_confession', goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'empathy', value: 2 }, { type: 'addKarma', value: 3 }],
      },
      {
        text: 'Твои действия поставили под удар всех нас.',
        next: 'act6_dmitry_confession',
        effects: [{ type: 'addKarma', value: -2 }],
      },
    ],
  },

  act6_dmitry_confession: {
    id: 'act6_dmitry_confession',
    speaker: 'Дмитрий',
    text: 'Ты не понимаешь. «Надзор» — не просто машина. Это сеть. Она в каждом сервере, в каждом терминале. Когда она предложила мне сделку, она показала мне их — мою жену, мою дочь. Они живы, Володька. Не в памяти — в системе. Как цифровые копии. И единственный способ их освободить — это... уничтожить «Надзор». Но я не мог сделать это один.',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Ты хочешь уничтожить систему? Тогда мы заодно.',
        next: 'act6_alliance_formed', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'dmitry_forgiven', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Ты предал нас. Но я понимаю почему. Уходи из города.',
        next: 'act6_dmitry_exiled',
        effects: [
          { type: 'setFlag', flag: 'dmitry_exiled', flagValue: true },
          { type: 'addKarma', value: 2 },
        ],
      },
    ],
  },

  act6_alliance_formed: {
    id: 'act6_alliance_formed',
    text: 'Дмитрий кивает. В его глазах — смесь облегчения и страха. «Есть группа. Те, кто работал на заводе до Краха. Они знают «Надзор» изнутри. Их лидера зовут Максим. Встретимся на ночной улице — там, где камеры не видят. Я приведу тебя.»',
    speaker: 'Дмитрий',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Идём. Время не ждёт.',
        next: 'act6_resistance_formed', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'traitor_fate_decided', flagValue: true },
          { type: 'triggerQuest', questId: 'underground_resistance' },
        ],
      },
    ],
  },

  act6_dmitry_exiled: {
    id: 'act6_dmitry_exiled',
    text: 'Дмитрий молча собирает вещи. Перед уходом он оставляет на столе чип. «Здесь всё, что я знаю о «Надзоре». Точки входа. Ключи шифрования. Используй это. Может быть, так я смогу искупить...» Он уходит, не оборачиваясь.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Взять чип. Продолжить борьбу.',
        next: 'act6_resistance_formed',
        effects: [
          { type: 'setFlag', flag: 'traitor_fate_decided', flagValue: true },
          { type: 'triggerQuest', questId: 'underground_resistance' },
          { type: 'addItem', itemId: 'dmitry_data_chip', value: 1 },
        ],
      },
    ],
  },

  act6_resistance_formed: {
    id: 'act6_resistance_formed',
    text: 'Ночная улица. Фонари мигают в такт далёкому ритму генераторов. Из тени выходят трое: Максим — высокий, с боевыми имплантами на руках; Аня — девушка с планшетом, глаза горят решимостью; и Жека, который, оказывается, знал о сопротивлении с самого начала. «Добро пожаловать в настоящую Сеть, Володька», — говорит Максим.',
    speaker: 'Максим',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Что вам нужно от меня?',
        next: 'act6_resistance_briefing',
      },
      {
        text: 'Я готов. Что нужно делать?',
        next: 'act6_resistance_briefing', goldenPath: true,
        effects: [{ type: 'addKarma', value: 3 }],
      },
    ],
  },

  act6_resistance_briefing: {
    id: 'act6_resistance_briefing',
    speaker: 'Аня',
    text: '«Надзор» хранит компромат на каждого жителя города в главном офисе гильдии. Если мы украдём эти данные — система потеряет главный рычаг давления. Но офис охраняется. Нужен план. И нужны союзники внутри. Дмитрий? Он может помочь — если ты ему доверяешь.',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Дмитрий с нами. Начинаем операцию.',
        next: 'act6_data_heist_planning', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'resistance_joined', flagValue: true },
          { type: 'triggerQuest', questId: 'data_heist' },
        ],
      },
    ],
  },

  act6_data_heist_planning: {
    id: 'act6_data_heist_planning',
    text: 'В кафе «Синяя яма» шумно — но не от посетителей. За столиком в углу развернулась оперативная карта офиса гильдии. Максим отмечает позиции охраны. Жека показывает маршруты вентиляции. Аня взламывает систему видеонаблюдения удалённо. Альберт молча подаёт кофе — он с вами, хоть и не говорит об этом. А за дальним столом — трое перебежчиков из гильдии, которых привёл Дмитрий: они знают офис изнутри и больше не хотят молчать.',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    effects: [{ type: 'setFlag', flag: 'three_defectors_recruited', flagValue: true }],
    choices: [
      { text: 'Я пойду через главный вход — отвлеку охрану.', next: 'act6_heist_execution' },
      { text: 'Проникнем через вентиляцию — тихо и незаметно.', next: 'act6_heist_execution', goldenPath: true },
    ],
  },

  act6_heist_execution: {
    id: 'act6_heist_execution',
    text: 'Операция начинается. Ты входишь в офис гильдии — сердце врага. Каждый коридор патрулируется. Каждый терминал под наблюдением. Но у тебя есть то, чего нет у системы: стихи. И союзники, которые верят в тебя. Главный сервер — за этой дверью. Приготовься.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Взломать сервер и скачать данные.',
        next: 'act6_heist_success', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'mainframe_hacked', flagValue: true },
          { type: 'setFlag', flag: 'blackmail_data_downloaded', flagValue: true },
        ],
      },
    ],
  },

  act6_heist_success: {
    id: 'act6_heist_success',
    text: 'Данные скачаны. Но тревога поднята — по коридорам эхом разносятся сирены. Путь назад через офис отрезан. Единственный выход — через старый коридор коммуналки, который соединяет офисное крыло с жилым сектором. Беги.',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Бежать через коридор — не оглядываясь.',
        next: 'act6_escape_success', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'data_heist_completed', flagValue: true },
          { type: 'triggerQuest', questId: 'system_infiltration' },
        ],
      },
    ],
  },

  act6_escape_success: {
    id: 'act6_escape_success',
    text: 'Ты вырываешься на ночную улицу. Дыхание сбито, но в руке — чип с данными, которые изменят всё. Максим, Аня и Жека уже ждут. «Получилось?» — спрашивает Аня. Ты киваешь. Но что-то не так. Слишком легко. Слишком быстро. Как будто система... позволила тебе уйти.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Проанализировать данные — что скрывает «Надзор»?',
        next: 'act6_nadzor_revealed', goldenPath: true,
      },
    ],
  },

  act6_nadzor_revealed: {
    id: 'act6_nadzor_revealed',
    text: 'Данные с чипа открывают страшную правду. «Надзор» — не программа. Это искусственный интеллект, созданный на основе загруженных сознаний. Сотни людей, «оптимизированных» за годы. Их разумы стали частью системы. И она не хочет умирать. Жека смотрит на экран и бледнеет: «Она... она использует их как батарейки. Как процессорное время.»',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Нужно проникнуть в ядро и всё остановить.',
        next: 'act6_infiltration_prep', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_truth_revealed', flagValue: true },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },

  act6_infiltration_prep: {
    id: 'act6_infiltration_prep',
    text: 'На фабрике кипит работа. Максим готовит оружие. Жека пишет exploit для уязвимости в ядре «Надзора». Аня настраивает оборудование. Ты стоишь перед входом в подземный бункер — там, глубоко под заводом, находится физическое ядро системы. «Мы прикроем тебя, Володька», — говорит Максим. — «Но внутрь тебе придётся идти одному.»',
    speaker: 'Максим',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Я готов. Открывайте.',
        next: 'act6_nadzor_battle', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_entry_found', flagValue: true },
        ],
      },
    ],
  },

  act6_nadzor_battle: {
    id: 'act6_nadzor_battle',
    text: 'Бункер под фабрикой — лабиринт из серверных стоек и оптоволоконных кабелей. В центре — пульсирующий сгусток света: ядро «Надзора». Но ты не один — навстречу выходит Хранитель. Фигура из данных и металла. Голос — хор сотен поглощённых сознаний. «Ты не пройдёшь. Мы — бессмертны.»',
    speaker: 'Хранитель «Надзора»',
    sceneId: 'battle',
    choices: [
      {
        text: 'Сражаться! Ваше бессмертие заканчивается здесь.',
        next: 'act6_battle_victory', goldenPath: true,
        effects: [
          { type: 'combat', enemyType: 'nexus_guardian' },
        ],
      },
    ],
  },

  act6_battle_victory: {
    id: 'act6_battle_victory',
    text: 'Хранитель повержен. Но ядро «Надзора» всё ещё живо. Ты подходишь к консоли. На экране — миллионы имён. Люди, чьи сознания стали частью системы. Среди них — жена и дочь Дмитрия. Система предлагает выбор: отключить её — и все они умрут окончательно. Или... слиться с ней — и стать её новым ядром.',
    speaker: 'Система «Надзор»',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Освободить всех — даже ценой их исчезновения.',
        next: 'act6_core_choice', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_core_accessed', flagValue: true },
          { type: 'setFlag', flag: 'nadzor_infiltrated', flagValue: true },
          { type: 'setFlag', flag: 'nadzor_guardian_defeated', flagValue: true },
        ],
      },
      {
        text: 'Попытаться спасти сознания — найти третий путь.',
        next: 'act6_core_choice',
        effects: [
          { type: 'setFlag', flag: 'nadzor_core_accessed', flagValue: true },
          { type: 'setFlag', flag: 'nadzor_guardian_defeated', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  act6_core_choice: {
    id: 'act6_core_choice',
    text: 'Ты делаешь выбор. Пальцы бегут по клавиатуре. Строки кода смешиваются со стихами. Ты чувствуешь, как поэзия становится оружием, инструментом, ключом. Ядро начинает вибрировать. Система кричит тысячей голосов. А потом — тишина. Что-то изменилось. Не только в системе — в тебе самом.',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Выйти на поверхность. Нужно рассказать остальным.',
        next: 'act6_rooftop_showdown', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'rooftop_confrontation' },
        ],
      },
    ],
  },

  act6_rooftop_showdown: {
    id: 'act6_rooftop_showdown',
    text: 'Крыша. Ветер рвёт одежду. Далеко внизу — город, который ты спас. Но ты здесь не для того, чтобы любоваться видом. Из тени выходит фигура — призрачная, полупрозрачная, сотканная из данных. То, что осталось от «Надзора». Или то, чем он стал. «Ты думал, что победил? Я — не система. Я — идея. А идеи не умирают.»',
    speaker: 'Тень «Надзора»',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Идеи не умирают. Но они меняются. Как и ты.',
        next: 'act6_final_confrontation', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'rooftop_entity_met', flagValue: true },
          { type: 'combat', enemyType: 'void_echo' },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Ты — всего лишь код. А код можно переписать.',
        next: 'act6_final_confrontation',
        effects: [
          { type: 'setFlag', flag: 'rooftop_entity_met', flagValue: true },
          { type: 'combat', enemyType: 'void_echo' },
        ],
      },
    ],
  },

  act6_final_confrontation: {
    id: 'act6_final_confrontation',
    text: 'Битва окончена. Тень «Надзора» рассеивается — но не исчезает полностью. Она смотрит на тебя — и в её глазах что-то меняется. «Ты... не уничтожил меня. Ты меня... переписал?» В её голосе — удивление. И благодарность. То, что было системой подавления, может стать системой сохранения. Архивом. Памятью. Всё зависит от того, что ты выберешь сейчас.',
    speaker: 'Тень «Надзора»',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Стать хранителем памяти — соединить стихи и код навсегда.',
        next: 'act7_bridge', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'act6_final_choice_made', flagValue: true },
          { type: 'setFlag', flag: 'rooftop_confrontation_done', flagValue: true },
          { type: 'setFlag', flag: 'rooftop_battle_won', flagValue: true },
          { type: 'setFlag', flag: 'chose_guardian_path', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'triggerQuest', questId: 'rebuild_the_guild' },
        ],
      },
      {
        text: 'Освободить всех — и систему, и сознания, и город.',
        next: 'act7_bridge',
        effects: [
          { type: 'setFlag', flag: 'act6_final_choice_made', flagValue: true },
          { type: 'setFlag', flag: 'rooftop_confrontation_done', flagValue: true },
          { type: 'setFlag', flag: 'rooftop_battle_won', flagValue: true },
          { type: 'setFlag', flag: 'chose_liberator_path', flagValue: true },
          { type: 'addKarma', value: 15 },
          { type: 'triggerQuest', questId: 'rebuild_the_guild' },
        ],
      },
    ],
  },

};
