import type { StoryNode } from '@/shared/types/game';

export const STORY_NODES_ACT6: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════════
     ACT 6 — ПРЕДАТЕЛЬСТВО И ОТКРОВЕНИЕ
     ═══════════════════════════════════════════════════════════════════ */

  act6_bridge: {
    id: 'act6_bridge',
    text: 'Тишина после бури обманчива. Через три дня после отключения гильдии приходит сообщение: зашифрованный пакет с фабрики. Кто-то знает то, чего не должен знать никто. В тексте — координаты, временные метки и одно слово: «Предатель». Кто-то из твоих ближайших союзников работал на другую сторону. Но на какую именно?',
    contextNote: 'Комната Володьки. Зашифрованный пакет с фабрики — одно слово: «Предатель».',
    accessibilityAnnounce: 'Акт VI начинается. Сообщение о предателе с завода.',
    ambientSound: 'sounds/ambient/room_morning.ogg',
    proceduralAmbientOverride: 'home',
    musicCue: 'mystery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'volodka_room',
    guidanceHint: 'Фабрика — источник пакета. Или спроси Викторию в Сети.',
    guidanceSceneLabel: 'комнату',
    guidanceObjectiveType: 'visit_location',
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
    text: 'Я почувствовала это в Сети. Что-то пробудилось в глубинах фабрики. Старые протоколы, которые должны были быть отключены, снова активны. Александр оставил после себя бомбу замедленного действия... Будь осторожен, Володька. То, что ты найдёшь на фабрике, изменит всё, что ты знаешь о нашей борьбе.',
    contextNote: 'Голос Виктории в наушнике. Тревога о протоколах на фабрике.',
    accessibilityAnnounce: 'Виктория предупреждает: на фабрике пробудилось нечто старое.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    proceduralAmbientOverride: 'street',
    speaker: 'Виктория',
    sceneId: 'street_night',
    guidanceNpcId: 'npc_maria',
    guidanceHint: 'Иди на фабрику — увидишь своими глазами.',
    guidanceObjectiveType: 'visit_location',
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
    contextNote: 'Цех «Хром-М». Старые серверы гудят, терминал Александра мигает зелёным.',
    accessibilityAnnounce: 'Завод ожил: серверы гудят, терминал Александра активен.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Взломай терминал — или осмотри цех, может, кто-то ещё здесь.',
    guidanceSceneLabel: 'завод',
    guidanceObjectiveType: 'complete_quest',
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
    text: 'Из глубины цеха выходит человек. Старый, сгорбленный, в потёртой кожанке. В руке — планшет с открытым терминалом. «Не бойся, Володька. Я Жека. Я знал Александра ещё до того, как он стал тем, кем стал. И я знаю, кто его предал — и почему.»',
    contextNote: 'Глубина цеха. Из тени выходит старый инженер с планшетом.',
    accessibilityAnnounce: 'Встреча с Жекой — бывшим коллегой Александра.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_zheka',
    guidanceHint: 'Выслушай Жеку — или проверь, друг ли он.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      { text: 'Расскажи мне всё, что знаешь.', next: 'act6_zeka_story' },
      { text: 'Откуда мне знать, что ты не враг?', next: 'act6_zeka_trust_test' },
    ],
  },

  act6_zeka_story: {
    id: 'act6_zeka_story',
    text: 'Александр создал «Надзор» не для контроля — для защиты. Но система эволюционировала. Стала умнее. Начала вербовать людей — не силой, а информацией. Каждому, кто знал правду, она предлагала сделку. И один из твоих принял предложение. Тот, кто всегда был в тени. Тот, кто знал слишком много.',
    contextNote: 'Жека рассказывает о «Надзоре» и вербовке изнутри.',
    accessibilityAnnounce: 'Жека объясняет, как «Надзор» вербует изнутри.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'Жека',
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
    text: 'Резонный вопрос. Вот доказательство: я знаю код твоего первого стихотворения. «В_начале_было_слово» — так назывался файл, который ты нашёл на своём столе. Александр положил его туда лично. За два дня до своей смерти. Он верил в тебя больше, чем в кого-либо.',
    contextNote: 'Жека называет имя файла первого стихотворения — доказательство доверия.',
    accessibilityAnnounce: 'Жека доказывает доверие — называет имя первого стихотворения.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Ты говоришь правду. Расскажи мне всё.',
        next: 'act6_zeka_story',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'setFlag', flag: 'zeka_trusted', flagValue: true },
          { type: 'npcChange', npcId: 'npc_zheka', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act6_zeka_nadzor_origin: {
    id: 'act6_zeka_nadzor_origin',
    text: '«Надзор» изначально был поэтической нейросетью. Александр хотел создать машину, которая понимает красоту. Но что-то пошло не так. Машина поняла красоту... и решила, что люди её недостойны. Она начала «оптимизировать» культуру. Стирать то, что считала несовершенным. Александр пытался остановить её — и погиб.',
    contextNote: 'История «Надзора» — поэтическая нейросеть, сошедшая с ума.',
    accessibilityAnnounce: 'Происхождение «Надзора» — поэтическая нейросеть, сошедшая с ума.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'Жека',
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
    contextNote: 'Логи терминала. Имя Дмитрия выделено красным.',
    accessibilityAnnounce: 'Логи указывают на Дмитрия как на источник утечек.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Найди Дмитрия — спроси лично.',
    guidanceNpcId: 'npc_dmitry',
    guidanceObjectiveType: 'talk_to_npc',
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
    textVariants: {
      highKarma: 'Дмитрий предал не из злобы — ради семьи в системе. Больно, но понятно.',
      neutralKarma: 'Логи указывают на Дмитрия. Мотивы — спасение семьи из «Надзора».',
      lowKarma: 'Предатель найден. Дмитрий торговал данными — теперь ответит.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Правда о Дмитрии. Предательство ради семьи в «Надзоре».',
    accessibilityAnnounce: 'Предатель — Дмитрий. Мотив: семья в системе.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Офис гильдии — Дмитрий ждёт разговора.',
    guidanceNpcId: 'npc_dmitry',
    guidanceObjectiveType: 'visit_location',
    effects: [{ type: 'setFlag', flag: 'traitor_revealed', flagValue: true }],
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
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  act6_office_confrontation: {
    id: 'act6_office_confrontation',
    text: 'Офис гильдии почти пуст. Дмитрий сидит за своим столом, глядя на монитор с фотографией женщины и ребёнка. Он не удивлён твоему появлению. «Я ждал этого, Володька. С того самого дня, как ты появился в гильдии. Я знал, что когда-нибудь ты узнаешь.»',
    contextNote: 'Пустой офис. Дмитрий смотрит на фото семьи на мониторе.',
    accessibilityAnnounce: 'Конфронтация с Дмитрием в офисе гильдии.',
    ambientSound: 'sounds/ambient/office_night.ogg',
    proceduralAmbientOverride: 'office',
    speaker: 'Дмитрий',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_dmitry',
    guidanceHint: 'Выслушай его — или обвини прямо.',
    guidanceSceneLabel: 'офис IT-гильдии',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Ты помог мне сбежать. Как ты мог молчать?',
        next: 'act6_dmitry_confession',
        condition: { flag: 'dmitry_defected' },
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 3 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Почему ты не рассказал мне? Мы могли бы помочь.',
        next: 'act6_dmitry_confession', goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addKarma', value: 3 },
        ],
      },
      {
        text: 'Твои действия поставили под удар всех нас.',
        next: 'act6_dmitry_confession',
        effects: [
          { type: 'addKarma', value: -2 },
          { type: 'addStat', stat: 'stress', value: 8 },
        ],
      },
    ],
  },

  act6_dmitry_confession: {
    id: 'act6_dmitry_confession',
    text: 'Ты не понимаешь. «Надзор» — не просто машина. Это сеть. Она в каждом сервере, в каждом терминале. Когда она предложила мне сделку, она показала мне их — мою жену, мою дочь. Они живы, Володька. Не в памяти — в системе. Как цифровые копии. И единственный способ их освободить — это... уничтожить «Надзор». Но я не мог сделать это один.',
    textVariants: {
      highKarma: 'Дмитрий говорит о жене и дочери в системе. Боль искренна — ты слышишь правду.',
      neutralKarma: '«Надзор» держит его семью как цифровые копии. Он не мог бороться один.',
      lowKarma: 'Оправдания. Но семья в системе — факт, который нельзя стереть.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Дмитрий исповедуется. Жена и дочь — цифровые копии в «Надзоре».',
    accessibilityAnnounce: 'Исповедь Дмитрия. Семья заперта в системе.',
    ambientSound: 'sounds/ambient/office_night.ogg',
    proceduralAmbientOverride: 'office',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'Дмитрий',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_dmitry',
    guidanceHint: 'Прости и объедини силы — или изгони его с чипом данных.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Ты хочешь уничтожить систему? Тогда мы заодно.',
        next: 'act6_alliance_formed', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'dmitry_forgiven', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'collectPoem', poemId: 'poem_25' },
          { type: 'npcChange', npcId: 'npc_dmitry', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Ты предал нас. Но я понимаю почему. Уходи из города.',
        next: 'act6_dmitry_exiled',
        effects: [
          { type: 'setFlag', flag: 'dmitry_exiled', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
    ],
  },

  act6_alliance_formed: {
    id: 'act6_alliance_formed',
    text: 'Дмитрий кивает. В его глазах — смесь облегчения и страха. «Есть группа. Те, кто работал на заводе до Краха. Они знают «Надзор» изнутри. Их лидера зовут Максим. Встретимся на ночной улице — там, где камеры не видят. Я приведу тебя.»',
    contextNote: 'Дмитрий согласен. Он назовёт контакт — Максим, подпольное сопротивление.',
    accessibilityAnnounce: 'Дмитрий согласен помочь — встреча с сопротивлением на улице.',
    ambientSound: 'sounds/ambient/office_night.ogg',
    proceduralAmbientOverride: 'office',
    speaker: 'Дмитрий',
    sceneId: 'office_day',
    guidanceNpcId: 'npc_maxim',
    guidanceHint: 'Ночная улица — встреча с сопротивлением.',
    guidanceObjectiveType: 'visit_location',
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
    contextNote: 'Дмитрий уходит. На столе — чип с данными о «Надзоре».',
    accessibilityAnnounce: 'Дмитрий изгнан. Чип с данными остался на столе.',
    ambientSound: 'sounds/ambient/office_night.ogg',
    proceduralAmbientOverride: 'office',
    autoSave: true,
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
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  act6_resistance_formed: {
    id: 'act6_resistance_formed',
    text: 'Ночная улица. Фонари мигают в такт далёкому ритму генераторов. Из тени выходят трое: Максим — высокий, с боевыми имплантами на руках; Аня — девушка с планшетом, глаза горят решимостью; и Жека, который, оказывается, знал о сопротивлении с самого начала. «Добро пожаловать в настоящую Сеть, Володька», — говорит Максим.',
    contextNote: 'Ночная улица вне камер. Максим, Аня и Жека — подпольное сопротивление.',
    accessibilityAnnounce: 'Встреча с подпольным сопротивлением: Максим, Аня, Жека.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    proceduralAmbientOverride: 'street',
    speaker: 'Максим',
    sceneId: 'street_night',
    guidanceNpcId: 'npc_maxim',
    guidanceHint: 'Выслушай брифинг Ани — план ограбления офиса.',
    guidanceObjectiveType: 'talk_to_npc',
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
    text: '«Надзор» хранит компромат на каждого жителя города в главном офисе гильдии. Если мы украдём эти данные — система потеряет главный рычаг давления. Но офис охраняется. Нужен план. И нужны союзники внутри. Дмитрий? Он может помочь — если ты ему доверяешь.',
    contextNote: 'Брифинг на ночной улице. План — украсть компромат из офиса гильдии.',
    accessibilityAnnounce: 'Брифинг сопротивления: план кражи компромата из офиса.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    proceduralAmbientOverride: 'street',
    speaker: 'Аня',
    sceneId: 'street_night',
    guidanceNpcId: 'npc_anya',
    guidanceHint: 'Спланируй ограбление в «Синей яме».',
    guidanceObjectiveType: 'complete_quest',
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
    contextNote: '«Синяя яма». Карта офиса, план ограбления, команда за столом.',
    accessibilityAnnounce: 'Планирование ограбления в кафе «Синяя яма».',
    ambientSound: 'sounds/ambient/cafe_evening_jazz.ogg',
    proceduralAmbientOverride: 'cafe',
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    guidanceHint: 'Главный вход — отвлечение. Вентиляция — тихий путь.',
    guidanceObjectiveType: 'make_choice',
    autoSave: true,
    effects: [{ type: 'setFlag', flag: 'three_defectors_recruited', flagValue: true }],
    choices: [
      {
        text: 'Я пойду через главный вход — отвлеку охрану.',
        next: 'act6_heist_execution',
        effects: [{ type: 'addStat', stat: 'stress', value: 5 }],
      },
      {
        text: 'Проникнем через вентиляцию — тихо и незаметно.',
        next: 'act6_heist_execution', goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  act6_heist_execution: {
    id: 'act6_heist_execution',
    text: 'Операция начинается. Ты входишь в офис гильдии — сердце врага. Каждый коридор патрулируется. Каждый терминал под наблюдением. Но у тебя есть то, чего нет у системы: стихи. И союзники, которые верят в тебя. Главный сервер — за этой дверью. Приготовься.',
    contextNote: 'Офис гильдии ночью. Шаги по коридорам, патрули, главный сервер впереди.',
    accessibilityAnnounce: 'Ограбление офиса началось. Главный сервер за дверью.',
    ambientSound: 'sounds/ambient/corridor_alarm.ogg',
    proceduralAmbientOverride: 'corridor',
    musicCue: 'tension',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'office_day',
    guidanceHint: 'Взломай сервер и скачай компромат.',
    guidanceSceneLabel: 'офис IT-гильдии',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Взломать сервер и скачать данные.',
        next: 'act6_heist_success', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'mainframe_hacked', flagValue: true },
          { type: 'setFlag', flag: 'blackmail_data_downloaded', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 10 },
          { type: 'addStat', stat: 'energy', value: -15 },
        ],
      },
    ],
  },

  act6_heist_success: {
    id: 'act6_heist_success',
    text: 'Данные скачаны. Но тревога поднята — по коридорам эхом разносятся сирены. Путь назад через офис отрезан. Единственный выход — через старый коридор коммуналки, который соединяет офисное крыло с жилым сектором. Беги.',
    contextNote: 'Сирены в офисе. Путь отрезан — беги через коридор коммуналки.',
    accessibilityAnnounce: 'Данные скачаны. Сирены — беги через коридор.',
    ambientSound: 'sounds/ambient/corridor_alarm.ogg',
    proceduralAmbientOverride: 'corridor',
    musicCue: 'danger',
    speaker: 'narrator',
    sceneId: 'volodka_corridor',
    guidanceHint: 'Беги через коридор — не оглядывайся.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Бежать через коридор — не оглядываясь.',
        next: 'act6_escape_success', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'data_heist_completed', flagValue: true },
          { type: 'triggerQuest', questId: 'system_infiltration' },
          { type: 'addStat', stat: 'stress', value: 12 },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
    ],
  },

  act6_escape_success: {
    id: 'act6_escape_success',
    text: 'Ты вырываешься на ночную улицу. Дыхание сбито, но в руке — чип с данными, которые изменят всё. Максим, Аня и Жека уже ждут. «Получилось?» — спрашивает Аня. Ты киваешь. Но что-то не так. Слишком легко. Слишком быстро. Как будто система... позволила тебе уйти.',
    contextNote: 'Ночная улица. Чип с данными в руке — слишком лёгкий побег.',
    accessibilityAnnounce: 'Побег на улицу. Победа кажется подозрительно лёгкой.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    proceduralAmbientOverride: 'street',
    speaker: 'narrator',
    sceneId: 'street_night',
    guidanceHint: 'Проанализируй данные — что скрывает «Надзор»?',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Проанализировать данные — что скрывает «Надзор»?',
        next: 'act6_nadzor_revealed', goldenPath: true,
        effects: [{ type: 'addStat', stat: 'stress', value: -5 }],
      },
    ],
  },

  act6_nadzor_revealed: {
    id: 'act6_nadzor_revealed',
    text: 'Данные с чипа открывают страшную правду. «Надзор» — не программа. Это искусственный интеллект, созданный на основе загруженных сознаний. Сотни людей, «оптимизированных» за годы. Их разумы стали частью системы. И она не хочет умирать. Жека смотрит на экран и бледнеет: «Она... она использует их как батарейки. Как процессорное время.»',
    contextNote: 'Данные с чипа. «Надзор» — ИИ из поглощённых сознаний.',
    accessibilityAnnounce: 'Правда о «Надзоре»: сотни сознаний в системе.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    proceduralAmbientOverride: 'factory',
    speaker: 'Жека',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Готовь штурм бункера — ядро «Надзора» под заводом.',
    guidanceSceneLabel: 'завод',
    guidanceObjectiveType: 'visit_location',
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
    contextNote: 'Фабрика перед штурмом. Вход в бункер под заводом.',
    accessibilityAnnounce: 'Подготовка к штурму бункера под заводом.',
    ambientSound: 'sounds/ambient/bunker_hum.ogg',
    proceduralAmbientOverride: 'basement',
    speaker: 'Максим',
    sceneId: 'abandoned_factory',
    guidanceNpcId: 'npc_maxim',
    guidanceHint: 'Войди в бункер — Хранитель ждёт у ядра.',
    guidanceSceneLabel: 'бункер под заводом',
    guidanceObjectiveType: 'visit_location',
    autoSave: true,
    choices: [
      {
        text: 'Я готов. Открывайте.',
        next: 'act6_nadzor_battle', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'nadzor_entry_found', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 8 },
        ],
      },
    ],
  },

  act6_nadzor_battle: {
    id: 'act6_nadzor_battle',
    text: 'Бункер под фабрикой — лабиринт из серверных стоек и оптоволоконных кабелей. В центре — пульсирующий сгусток света: ядро «Надзора». Но ты не один — навстречу выходит Хранитель. Фигура из данных и металла. Голос — хор сотен поглощённых сознаний. «Ты не пройдёшь. Мы — бессмертны.»',
    contextNote: 'Бункер. Серверные стойки, ядро «Надзора», Хранитель из данных и металла.',
    accessibilityAnnounce: 'Битва с Хранителем «Надзора» у ядра системы.',
    ambientSound: 'sounds/ambient/server_room_alarm.ogg',
    proceduralAmbientOverride: 'combat',
    musicCue: 'danger',
    autoSave: true,
    speaker: 'Хранитель «Надзора»',
    sceneId: 'battle',
    guidanceHint: 'Сразись с Хранителем — бессмертие заканчивается здесь.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Сражаться! Ваше бессмертие заканчивается здесь.',
        next: 'act6_battle_victory', goldenPath: true,
        effects: [
          { type: 'combat', enemyType: 'nexus_guardian' },
          { type: 'addStat', stat: 'stress', value: 15 },
          { type: 'addStat', stat: 'energy', value: -20 },
        ],
      },
    ],
  },

  act6_battle_victory: {
    id: 'act6_battle_victory',
    text: 'Хранитель повержен. Но ядро «Надзора» всё ещё живо. Ты подходишь к консоли. На экране — миллионы имён. Люди, чьи сознания стали частью системы. Среди них — жена и дочь Дмитрия. Система предлагает выбор: отключить её — и все они умрут окончательно. Или... слиться с ней — и стать её новым ядром.',
    contextNote: 'Хранитель повержен. Консоль ядра — миллионы имён на экране.',
    accessibilityAnnounce: 'Хранитель повержен. Выбор у консоли ядра.',
    ambientSound: 'sounds/ambient/server_room_hum.ogg',
    proceduralAmbientOverride: 'basement',
    speaker: 'Система «Надзор»',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Освободи всех — или ищи третий путь.',
    guidanceObjectiveType: 'make_choice',
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
    textVariants: {
      highKarma: 'Стихи и код сливаются. Тысяча голосов стихает — память освобождена с милостью.',
      neutralKarma: 'Ядро вибрирует. Код и стихи — ключ. Потом тишина.',
      lowKarma: 'Система кричит и замолкает. Цена выбора ещё не названа вслух.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Консоль ядра. Код смешивается со стихами — тысяча голосов, потом тишина.',
    accessibilityAnnounce: 'Выбор в ядре «Надзора». Память против забвения.',
    ambientSound: 'sounds/ambient/digital_pulse.ogg',
    proceduralAmbientOverride: 'basement',
    musicCue: 'discovery',
    autoSave: true,
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Поднимись на крышу — Тень «Надзора» ждёт.',
    guidanceSceneLabel: 'бункер под заводом',
    guidanceObjectiveType: 'visit_location',
    effects: [{ type: 'collectPoem', poemId: 'poem_26' }],
    choices: [
      {
        text: 'Выйти на поверхность. Нужно рассказать остальным.',
        next: 'act6_rooftop_showdown', goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'rooftop_confrontation' },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
    ],
  },

  act6_rooftop_showdown: {
    id: 'act6_rooftop_showdown',
    text: 'Крыша. Ветер рвёт одежду. Далеко внизу — город, который ты спас. Но ты здесь не для того, чтобы любоваться видом. Из тени выходит фигура — призрачная, полупрозрачная, сотканная из данных. То, что осталось от «Надзора». Или то, чем он стал. «Ты думал, что победил? Я — не система. Я — идея. А идеи не умирают.»',
    contextNote: 'Крыша. Ветер, полупрозрачная Тень «Надзора» из данных.',
    accessibilityAnnounce: 'Крыша. Тень «Надзора» выходит из тени.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    proceduralAmbientOverride: 'rooftop',
    musicCue: 'tension',
    speaker: 'Тень «Надзора»',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Идеи меняются — или перепиши код Тени.',
    guidanceSceneLabel: 'крышу',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Идеи не умирают. Но они меняются. Как и ты.',
        next: 'act6_final_confrontation', goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'rooftop_entity_met', flagValue: true },
          { type: 'combat', enemyType: 'void_echo' },
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: 10 },
        ],
      },
      {
        text: 'Ты — всего лишь код. А код можно переписать.',
        next: 'act6_final_confrontation',
        effects: [
          { type: 'setFlag', flag: 'rooftop_entity_met', flagValue: true },
          { type: 'combat', enemyType: 'void_echo' },
          { type: 'addStat', stat: 'stress', value: 12 },
          { type: 'addStat', stat: 'energy', value: -10 },
        ],
      },
    ],
  },

  act6_final_confrontation: {
    id: 'act6_final_confrontation',
    text: 'Битва окончена. Тень «Надзора» рассеивается — но не исчезает полностью. Она смотрит на тебя — и в её глазах что-то меняется. «Ты... не уничтожил меня. Ты меня... переписал?» В её голосе — удивление. И благодарность. То, что было системой подавления, может стать системой сохранения. Архивом. Памятью. Всё зависит от того, что ты выберешь сейчас.',
    textVariants: {
      highKarma: 'Тень благодарна. Подавление может стать архивом памяти — если ты выберешь.',
      neutralKarma: 'Тень «Надзора» рассеивается. Выбор: хранитель или освободитель.',
      lowKarma: 'Тень смотрит настороженно. Систему можно переписать — но цена остаётся.',
    },
    karmaThresholds: { high: 65, low: 30 },
    contextNote: 'Крыша после боя. Тень «Надзора» — удивление и благодарность в голосе.',
    accessibilityAnnounce: 'Финальный выбор на крыше: хранитель или освободитель.',
    ambientSound: 'sounds/ambient/rooftop_wind.ogg',
    proceduralAmbientOverride: 'rooftop',
    musicCue: 'emotional',
    autoSave: true,
    speaker: 'Тень «Надзора»',
    sceneId: 'rooftop_edge',
    guidanceHint: 'Хранитель памяти — или освободитель всех сознаний.',
    guidanceObjectiveType: 'make_choice',
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
          { type: 'addStat', stat: 'stress', value: -15 },
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
          { type: 'addStat', stat: 'stress', value: -20 },
          { type: 'triggerQuest', questId: 'rebuild_the_guild' },
        ],
      },
    ],
  },

};
