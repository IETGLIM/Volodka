import type { StoryNode } from '@/shared/types/game';

/** Extended «тихий час» — overrides hub from act4.ts with more branches. */
export const STORY_NODES_ACT4_QUIET_HOUR: Record<string, StoryNode> = {
  act4_quiet_hour: {
    id: 'act4_quiet_hour',
    text: 'Час. Шестьдесят минут, которые гильдия ещё не отняла. План лежит на ящике из-под микрочипов, исчерченный стрелками, и больше в него смотреть незачем. Снаружи гудит город — неон, серверы, чужие окна. Ты вдруг понимаешь простую вещь: завтра может не быть. А сегодня ещё есть люди, голоса, строки. Один тихий час — на то, что нельзя взять с собой в башню.',
    contextNote: 'Тихий час перед штурмом. План на ящике, город гудит за стеной.',
    accessibilityAnnounce: 'Тихий час. Выбери, с кем провести последний час перед штурмом.',
    ambientSound: 'sounds/ambient/underground_hum.ogg',
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    guidanceHint: 'Потрать час на близких — или вернись к плану.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Подняться на крышу — Дмитрий курит там один',
        next: 'act4_quiet_rooftop_dmitry',
        condition: { flag: 'dmitry_defected' },
      },
      {
        text: 'Зайти к Зареме — последний чай перед бурей',
        next: 'act4_quiet_tea_zarema',
        condition: { flag: 'zarema_rescued' },
      },
      {
        text: 'Заглянуть в комнату Заремы — она не спит',
        next: 'act4_quiet_zarema_room',
        condition: { flag: 'zarema_rescued' },
      },
      {
        text: 'Прочитать сообщение от Альберта',
        next: 'act4_quiet_albert_message',
      },
      {
        text: 'Зайти в подсобку — Альберт ждёт там',
        next: 'act4_quiet_albert_backroom',
      },
      {
        text: 'Позвонить Солныш — услышать её голос',
        next: 'act4_quiet_solnysh_call',
        condition: { flag: 'solnysh_comforted' },
      },
      {
        text: 'Сходить на пирс — Трофим ловит рассветную рыбу',
        next: 'act4_quiet_pier_trofim',
        condition: { flag: 'chk_forest_unlocked' },
      },
      {
        text: 'Постоять у окна в опенспейсе — в последний раз',
        next: 'act4_quiet_openspace_window',
      },
      {
        text: 'Заглянуть в серверную — последний взгляд на ядро',
        next: 'act4_quiet_mainframe',
        condition: { flag: 'guild_core_accessed' },
      },
      {
        text: 'Услышать уличного поэта на площади',
        next: 'act4_quiet_poet_square',
      },
      {
        text: 'Перечитать первый стих — с которого всё началось',
        next: 'act4_quiet_first_poem',
      },
      {
        text: 'Час истёк. Вернуться к плану.',
        next: 'act4_infiltration_prep',
      },
    ],
  },

  act4_quiet_zarema_room: {
    id: 'act4_quiet_zarema_room',
    text: 'Комната Заремы тиха — настольная лампа, книга раскрыта на середине, детская игрушка на подоконнике. Она не удивляется, когда ты входишь: «Я знала, что придёшь. Садись.» Говорите о мелочах — погода, соседский кот, рецепт пирога. Ничего о завтра. Именно поэтому это важно.',
    contextNote: 'Комната Заремы. Лампа, книга, разговор о мелочах.',
    accessibilityAnnounce: 'Тихий разговор с Заремой в её комнате.',
    speaker: 'Зарема',
    sceneId: 'zarema_room',
    effects: [{ type: 'setFlag', flag: 'quiet_zarema_room', flagValue: true }],
    choices: [
      {
        text: 'Поблагодарить и уйти, пока чай ещё тёплый',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -6 },
          { type: 'npcChange', npcId: 'npc_zarema', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  act4_quiet_albert_backroom: {
    id: 'act4_quiet_albert_backroom',
    text: 'Подсобка «Синей ямы» пахнет зерном и озоном от кофемолки. Альберт молча наливает двойной эспрессо — без сахара, как ты любишь в тяжёлые дни. «Завтра будет шумно,» — говорит он. «Сегодня — тишина. Пей медленно.» На стене — выцветшая фотография: он и Зарема, молодые, ещё до гильдии.',
    contextNote: 'Подсобка кафе. Альберт наливает эспрессо.',
    speaker: 'Альберт',
    sceneId: 'albert_backroom',
    effects: [{ type: 'setFlag', flag: 'quiet_albert_backroom', flagValue: true }],
    choices: [
      {
        text: 'Допить и кивнуть — слов не нужно',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'energy', value: 8 },
          { type: 'npcChange', npcId: 'npc_albert', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  act4_quiet_solnysh_call: {
    id: 'act4_quiet_solnysh_call',
    text: 'Солныш отвечает на третьем гудке. Голос тёплый, чуть сонный: «Ты не спишь? Я тоже.» Вы молчите вместе — не неловко, а правильно. Потом она читает вслух четыре строки, которые написала сегодня. Ты запоминаешь ритм — на случай, если завтра понадобится якорь.',
    contextNote: 'Звонок Солныш. Четыре новые строки вслух.',
    accessibilityAnnounce: 'Телефонный разговор с Солныш. Она читает стихи.',
    speaker: 'Солныш',
    sceneId: 'solnysh_room',
    effects: [{ type: 'setFlag', flag: 'quiet_solnysh_call', flagValue: true }],
    choices: [
      {
        text: 'Сказать «спокойной ночи» и положить трубку',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -7 },
          { type: 'npcChange', npcId: 'npc_solnysh', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  act4_quiet_pier_trofim: {
    id: 'act4_quiet_pier_trofim',
    text: 'Пирс на рассвете — вода серебрится, Трофим не ловит рыбу: «Сегодня смотрю.» Он рассказывает, как река «помнит» завод под землёй — гул идёт по трубам, как пульс. «Ты тоже идёшь туда, сынок?» — спрашивает без осуждения. Ты киваешь. Он протягивает термос с чаем — крепкий, с берёзовым дёгтем.',
    contextNote: 'Вечерний пирс. Трофим и река, которая слышит завод.',
    proceduralAmbientOverride: 'pier',
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    effects: [{ type: 'setFlag', flag: 'quiet_pier_trofim', flagValue: true }],
    choices: [
      {
        text: 'Попрощаться и вернуться к убежищу',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'npc_trofim', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  act4_quiet_mainframe: {
    id: 'act4_quiet_mainframe',
    text: 'Серверная гильдии ночью — зелёный свет, гул вентиляторов, холодный воздух. Ты стоишь у стойки, где завтра будешь бороться с Протоколом. Экраны мерцают логами — чужие имена, чужие стихи, помеченные «УДАЛИТЬ». Ты касаешься стекла. Оно холодное. Завтра оно станет горячим.',
    contextNote: 'Серверная гильдии. Зелёный свет, логи удалённых стихов.',
    accessibilityAnnounce: 'Серверная гильдии. Холодные стойки, зелёные индикаторы.',
    speaker: 'narrator',
    sceneId: 'guild_mainframe',
    effects: [{ type: 'setFlag', flag: 'quiet_mainframe', flagValue: true }],
    choices: [
      {
        text: 'Запомнить расположение стоек и уйти',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'mainframe_scouted', flagValue: true },
        ],
      },
    ],
  },

  act4_quiet_poet_square: {
    id: 'act4_quiet_poet_square',
    text: 'На площади — один человек с блокнотом. Уличный поэт читает прохожим (их трое) о городе, который забывает свои имена. Голос тихий, но чёткий — как будто микрофоны гильдии его не слышат. Ты останавливаешься. Он поднимает глаза: «Поэт? Тогда ты знаешь — слова тяжелеют к утру. Неси их осторожно.»',
    contextNote: 'Центральная площадь. Уличный поэт читает прохожим.',
    accessibilityAnnounce: 'Площадь. Уличный поэт читает о забытых именах.',
    speaker: 'Уличный поэт',
    sceneId: 'city_square',
    effects: [{ type: 'setFlag', flag: 'quiet_poet_square', flagValue: true }],
    choices: [
      {
        text: 'Бросить монету в футляр и уйти',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Прочитать ответную четверостишие',
        next: 'act4_quiet_poet_reply',
        goldenPath: true,
      },
    ],
  },

  act4_quiet_poet_reply: {
    id: 'act4_quiet_poet_reply',
    text: 'Поэт улыбается — впервые за вечер. «Живой,» — говорит он. «Редкость.» Он записывает твои строки в блокнот с пометкой «до рассвета». «Если нас сотрут,» — шепчет, — «бумага дольше серверов держит.» Площадь пустеет. Остаётся только ветер и обещание.',
    contextNote: 'Ответное четверостишие на площади.',
    speaker: 'Уличный поэт',
    sceneId: 'city_square',
    choices: [
      {
        text: 'Вернуться к убежищу',
        next: 'act4_quiet_hour',
        effects: [
          { type: 'collectPoem', poemId: 'poem_14' },
          { type: 'setFlag', flag: 'met_street_poet', flagValue: true },
        ],
      },
      {
        text: 'Час истёк. К плану.',
        next: 'act4_infiltration_prep',
        effects: [
          { type: 'collectPoem', poemId: 'poem_14' },
          { type: 'setFlag', flag: 'met_street_poet', flagValue: true },
        ],
      },
    ],
  },
};
