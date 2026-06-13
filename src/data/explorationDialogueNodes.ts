/* ─── Exploration dialogue nodes (Act 1 / World Director) ───
 * Narrative content for 3D trigger zones — same text as early story nodes,
 * routed through DialogueRenderer instead of fullscreen StoryRenderer.
 */

import type { DialogueNode } from '@/shared/types/game';

export const EXPLORATION_DIALOGUE_NODES: Record<string, DialogueNode> = {
  explore_room_table: {
    id: 'explore_room_table',
    speaker: 'Голос',
    text: 'Ты садишься за стол. Три монитора мигают — на среднем открыто незаконченное стихотворение, на левом — логи серверов, на правом — сообщение от IT-гильдии: «Инцидент #4729. Требуется диагностика. Явка обязательна.» Клавиатура ещё тёплая от вчерашней ночи.',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Прочитать стихотворение',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'visitStoryNode', nodeId: 'room_table' },
        ],
      },
      {
        text: 'Изучить сообщение гильдии',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'read_guild_message', flagValue: true },
          { type: 'visitStoryNode', nodeId: 'room_table' },
        ],
      },
      {
        text: 'Ответить гильдии — я приду',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'accepted_guild_quest', flagValue: true },
          { type: 'visitStoryNode', nodeId: 'go_to_cafe' },
        ],
      },
    ],
  },

  explore_room_bookshelf: {
    id: 'explore_room_bookshelf',
    speaker: 'Голос',
    text: 'Книжная полка — твой алтарь знаний. Тут вперемешку стоят тома Пушкина и руководства по архитектуре ПО, сборники Ахматовой и «Чистый код» Мартина. Между книгами — засушенный цветок и старая фотография. Ты проводишь пальцем по корешкам, и на пол падает сложенный листок.',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Поднять листок — это стихи',
        next: null,
        condition: { missingPoem: 'poem_2' },
        effects: [
          { type: 'collectPoem', poemId: 'poem_2' },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Перечитать знакомые строки',
        next: null,
        condition: { collectedPoem: 'poem_2' },
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
      {
        text: 'Отложить листок, читать дальше',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_room_window: {
    id: 'explore_room_window',
    speaker: 'Голос',
    text: 'За мутным стеклом — серый город под вечным дождём. Панельные дома, мигающие неоном вывески, мокрые крыши. Где-то там — люди. Здесь — только терминал и тишина.',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Отойти от окна',
        next: null,
      },
    ],
  },

  explore_corridor_door: {
    id: 'explore_corridor_door',
    speaker: 'Голос',
    text: 'Ты выходишь в коридор коммуналки. У зеркала стоит Солныш — она поправляет платок и тихо улыбается: «Доброе утро, Володька.» Лампочка мигает. Из кухни доносится звон посуды — Зарема уже проснулась.',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Поздороваться и осмотреться',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'corridor_explore_mode' },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  explore_kitchen_table: {
    id: 'explore_kitchen_table',
    speaker: 'Голос',
    text: 'На кухне Зарема ставит перед тобой кружку горячего чая. «Опять не спал всю ночь?» — спрашивает она мягко, но с тревогой в глазах. На столе — хлеб, варенье и старый радиоприёмник, из которого льётся статика. Зарема — единственный человек, который по-настоящему заботится о тебе в этом городе.',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Поблагодарить Зарему',
        next: 'explore_kitchen_window',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Промолчать и пить чай',
        next: 'explore_kitchen_window',
        effects: [{ type: 'addStat', stat: 'stress', value: -5 }],
      },
    ],
  },

  explore_kitchen_window: {
    id: 'explore_kitchen_window',
    speaker: 'Голос',
    text: 'Ты смотришь в окно. Серые панельные дома уходят к горизонту, между ними — неоновые вывески и голограммы рекламы. Где-то далеко мигает башня IT-гильдии. Дождь усиливается, и город будто смазывается акварелью. «Тебе пора?» — тихо спрашивает Зарема.',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Да, мне нужно в кафе «Синяя яма»',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'going_to_cafe', flagValue: true },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
      {
        text: 'Ещё немного побуду дома',
        next: null,
        effects: [{ type: 'addStat', stat: 'energy', value: 10 }],
      },
      {
        text: 'Выйти на балкон — подышать',
        next: null,
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
    ],
  },

  explore_street_entry: {
    id: 'explore_street_entry',
    speaker: 'Голос',
    text: 'Ты садишься на скамейку у подъезда. Дождь закончился, но воздух всё ещё влажный. Мимо проходят люди — каждый в своём мире, каждый смотрит в свой терминал. Неоновая вывеска «Синяя яма» мигает в переулке напротив. Где-то вдалеке гудит башня гильдии.',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Оглядеться',
        next: null,
      },
    ],
  },

  explore_go_home: {
    id: 'explore_go_home',
    speaker: 'Голос',
    text: 'Ты возвращаешься домой. Здесь привычно и спокойно. Мониторы всё так же мерцают, и город за окном всё так же сер. Но что-то неуловимо изменилось — может быть, в тебе самом.',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Осмотреться',
        next: null,
      },
    ],
  },

  explore_volodka_inner: {
    id: 'explore_volodka_inner',
    speaker: 'Голос',
    text: 'Ты закрываешь глаза. За шумом города, за пульсацией серверов, за гулом неоновых вывесок — тишина. В этой тишине ты слышишь себя. Настоящего себя. Не программиста гильдии, не чьего-то соседа по коммуналке — поэта, который видит код как стихи, а стихи как код.',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Прислушаться к внутреннему голосу',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addStat', stat: 'stress', value: -10 },
        ],
      },
      {
        text: 'Записать открывшееся стихотворение',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 3 },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'inner_pledge_poems', flagValue: true },
          { type: 'triggerQuest', questId: 'poetry_collection' },
        ],
      },
    ],
  },

  explore_cafe_enter: {
    id: 'explore_cafe_enter',
    speaker: 'Голос',
    text: 'Кафе «Синяя яма» — странное место. Подвальное помещение, освещённое синими неоновыми трубками. В воздухе висит запах жжёного кофе и жареных орехов. За стойкой — бариста с кибернетическим протезом руки. В углу сидит Альберт — философ-затворник, постоянный гость.',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Осмотреть зал',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'met_albert', flagValue: true },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Заказать кофе у баристы',
        next: null,
        effects: [{ type: 'addStat', stat: 'energy', value: 5 }],
      },
    ],
  },

  explore_cafe_exit: {
    id: 'explore_cafe_exit',
    speaker: 'Голос',
    text: 'Ты выходишь из кафе на улицу. Неон «Синей ямы» мигает за спиной, холодный воздух ударяет в лицо. Город шумит — дроны, реклама, далёкий гул башни гильдии.',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Продолжить',
        next: null,
      },
    ],
  },

  explore_street_bench_view: {
    id: 'explore_street_bench_view',
    speaker: 'Голос',
    text: 'Улица залита неоновым светом. Рекламные голограммы мерцают на стенах домов, предлагая улучшения, обновления, апгрейды. Стрим-дроны проносятся над головой. В переулке кто-то сидит на корточках — силуэт, почти невидимый в тени.',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Подойти к незнакомке',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'maria_curious' },
          { type: 'setFlag', flag: 'spotted_maria', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'collectPoem', poemId: 'poem_19' },
        ],
      },
      {
        text: 'Побыстрее уйти в кафе',
        next: null,
        effects: [
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'transitionScene', sceneId: 'cafe_evening' },
        ],
      },
    ],
  },

  explore_start_diagnosis: {
    id: 'explore_start_diagnosis',
    speaker: 'Голос',
    text: 'Ты садишься за терминал. На экране — cascading логи инцидента #4729. Код выглядит странно: комментарии на русском, переменные с поэтическими именами, и кое-где — строки, похожие на стихи. Это не обычный вирус. Кто-то зашифровал послание в самом коде. Александр стоит за твоей спиной и молча ждёт.',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Начать расшифровку',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'start_diagnosis' },
          { type: 'addSkill', skill: 'coding', value: 3 },
          { type: 'addStat', stat: 'energy', value: -15 },
          { type: 'setFlag', flag: 'started_decryption', flagValue: true },
        ],
      },
      {
        text: 'Сравнить с архивными данными',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'setFlag', flag: 'compared_archives', flagValue: true },
        ],
      },
    ],
  },

  explore_act3_zarema_warning: {
    id: 'explore_act3_zarema_warning',
    speaker: 'Голос',
    text: 'У подножия памятника — высеченные буквы, наполовину стёртые временем и гильдией. Ты осторожно очищаешь камень от мха — под пальцами проступают строки. Камень помнит. Между деревьями мелькает знакомая фигура.',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Искать Зарему — она должна быть здесь',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act3_zarema_warning' },
          { type: 'collectPoem', poemId: 'poem_10' },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Ещё раз пройтись по аллеям',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_act4_peaceful_march: {
    id: 'explore_act4_peaceful_march',
    speaker: 'Голос',
    text: 'На зимней улице собирается марш — плакаты со стихами, терминалы с лозунгами, люди идут к башне гильдии. Поток растёт, но остаётся мирным.',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Продолжить марш — мирно и уверенно',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act4_peaceful_march' },
          { type: 'addKarma', value: 5 },
          { type: 'setFlag', flag: 'public_speech_done', flagValue: true },
        ],
      },
      {
        text: 'Понаблюдать из стороны',
        next: null,
        effects: [{ type: 'addSkill', skill: 'persuasion', value: 1 }],
      },
    ],
  },

  explore_act4_rooftop_broadcast: {
    id: 'explore_act4_rooftop_broadcast',
    speaker: 'Голос',
    text: 'На краю крыши — передающая антенна. Ветер бьёт в лицо, но оборудование уже подключено. Город внизу ждёт эфира.',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Начать подготовку вещания',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act4_rooftop_broadcast' },
          { type: 'setFlag', flag: 'broadcast_ready', flagValue: true },
        ],
      },
      {
        text: 'Ещё раз проверить антенну',
        next: null,
        effects: [{ type: 'addSkill', skill: 'coding', value: 1 }],
      },
    ],
  },

  explore_factory_basement_descent: {
    id: 'explore_factory_basement_descent',
    speaker: 'Голос',
    text: 'Лестница в подвал тянет холодом и гулом на 50 герц. Слабое мерцание внизу — «Заря-М» не спит.',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Спуститься к «Заре-М»',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'factory_basement' },
          { type: 'setFlag', flag: 'entered_factory_basement', flagValue: true },
        ],
      },
      {
        text: 'Остаться в цеху',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_basement_machine_confession: {
    id: 'explore_basement_machine_confession',
    speaker: 'Голос',
    text: 'Монолит «Заря-М» пульсирует зелёным. Гул проходит сквозь подошвы — и выше, до затылка. Баба Зина кивает: «Послушай. Машина ждёт.»',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Слушать исповедь машины',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'machine_confession_scene' },
          { type: 'setFlag', flag: 'zarya_confession_requested', flagValue: true },
        ],
      },
      {
        text: 'Ещё раз обойти монолит',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_chk_act5_campfire_dawn: {
    id: 'explore_chk_act5_campfire_dawn',
    speaker: 'Голос',
    text: 'Рассвет после эфира. Костёр ещё тлеет, а Ру уже наливает портвейн в кружки. Чекисты молчат — город слышал стихи, и лес тоже.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Подойти к Ру — финальное слово ЧК',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'chk_act5_campfire_dawn' },
          { type: 'setFlag', flag: 'tolpa_act5_blessing', flagValue: true },
        ],
      },
      {
        text: 'Посидеть у костра молча',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -4 }],
      },
    ],
  },

  explore_pier_factory_route: {
    id: 'explore_pier_factory_route',
    speaker: 'Голос',
    text: 'Трофим кивает на север: «Ключ от «Хрома-М» — у тебя. Завод не спит, как и река. Иди, если готов слушать, а не трогать.»',
    sceneId: 'river_pier',
    choices: [
      {
        text: 'Идти к заброшенному заводу',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'abandoned_workshop' },
          { type: 'transitionScene', sceneId: 'abandoned_factory' },
        ],
      },
      {
        text: 'Остаться у воды',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
    ],
  },

  explore_solnysh_room_talk: {
    id: 'explore_solnysh_room_talk',
    speaker: 'Голос',
    text: 'Солныш откладывает кисть и смотрит на тебя голубыми глазами. Умка крутится у ног, ожидая, что ты останешься.',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Поговорить с Солныш',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'solnysh_room_talk' },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Побуду рядом молча',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -4 }],
      },
    ],
  },

  explore_act7_library_archive: {
    id: 'explore_act7_library_archive',
    speaker: 'Голос',
    text: 'Центральная консоль библиотеки — серверные стойки вместо запертых шкафов. Катя и Алина готовят открытый архив стихов для всего города.',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Открыть архив для всего города',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act7_library_archive' },
          { type: 'addKarma', value: 5 },
        ],
      },
      {
        text: 'Просмотреть каталог спасённых стихов',
        next: null,
        effects: [{ type: 'addSkill', skill: 'writing', value: 1 }],
      },
    ],
  },
};
