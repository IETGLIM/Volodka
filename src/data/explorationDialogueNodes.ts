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
    text: 'Ты выходишь в коридор коммуналки. У зеркала — Солныш поправляет платок; лампочка мигает. Из кухни доносится звон посуды — Зарема уже проснулась.',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Поздороваться и осмотреться',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'corridor_explore_mode' },
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 3 } },
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

  explore_act2_albert_hint: {
    id: 'explore_act2_albert_hint',
    speaker: 'Голос',
    text: 'Кафе «Синяя яма», вечер. Альберт сидит в своём углу — пальцы постукивают по столу, нервный ритм, не похожий на обычную созерцательность. «Володька,» — говорит он тихо, — «тебе не кажется странным, что стихи появились именно в коде гильдии?»',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Ты знаешь, кто мог их туда поместить?',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_albert_hint' },
          { type: 'setFlag', flag: 'heard_act2_albert_hint', flagValue: true },
        ],
      },
      {
        text: 'Может, это старый код — до Краха?',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_albert_hint' },
          { type: 'setFlag', flag: 'heard_act2_albert_hint', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  explore_act2_dmitry_office_meeting: {
    id: 'explore_act2_dmitry_office_meeting',
    speaker: 'Голос',
    text: 'Офис гильдии, поздний вечер. Дмитрий ждёт у терминала — худой, усталый, с глазами загнанного зверя. Он оглядывается на дверь кабинета Александра. «Ты пришёл,» — шепчет он. — «Протокол Забвения нужно остановить. У нас мало времени.»',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Спросить, как отключить Протокол',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_dmitry_office_meeting' },
          { type: 'setFlag', flag: 'heard_dmitry_story', flagValue: true },
          { type: 'setFlag', flag: 'dmitry_escape_planned', flagValue: true },
        ],
      },
      {
        text: 'Сначала убедиться, что Александр не следит',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_dmitry_office_meeting' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'heard_dmitry_story', flagValue: true },
        ],
      },
    ],
  },

  explore_act2_barista_safehouse: {
    id: 'explore_act2_barista_safehouse',
    speaker: 'Голос',
    text: 'Бариста пододвигается ближе. Его металлическая рука тихо жужжит. «Слышал про Хранилище,» — говорит он негромко. «У меня есть задняя комната. Никто не знает о ней — даже гильдия. Сделаем явочную квартиру для Сети?» На запястье — татуировка: свиток и единица.',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Договорились. Это будет явочная квартира.',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_safehouse_agreed' },
          { type: 'setFlag', flag: 'cafe_safehouse_agreed', flagValue: true },
          { type: 'triggerQuest', questId: 'cafe_safehouse' },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Мне нужно сначала поговорить с Альбертом',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'setFlag', flag: 'cafe_safehouse_pending_albert', flagValue: true },
        ],
      },
    ],
  },

  explore_act2_safehouse_terminal: {
    id: 'explore_act2_safehouse_terminal',
    speaker: 'Голос',
    text: 'Подсобка тесная, пахнет обжаренными зёрнами и озоном. За стеллажом — ниша, в которой стоит древний терминал. Экран мерцает зелёным. Ключ-карта от баристы подходит идеально.',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Установить терминал и включить канал',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_safehouse_terminal' },
          { type: 'setFlag', flag: 'safehouse_terminal_installed', flagValue: true },
          { type: 'addItem', itemId: 'vault_key_fragment', value: 1 },
        ],
      },
      {
        text: 'Осмотреть нишу ещё раз',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_act2_safehouse_message: {
    id: 'explore_act2_safehouse_message',
    speaker: 'Голос',
    text: 'На зелёном экране мигает конверт. Сообщение простое: «Добро пожаловать в Сеть. Твоё стихотворение — ключ. Хранилище ждёт. — Д.» Кто такой Д.?',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Ответить на сообщение',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_safehouse_message' },
          { type: 'setFlag', flag: 'secure_channel_tested', flagValue: true },
          { type: 'setFlag', flag: 'contacted_dmitry_network', flagValue: true },
        ],
      },
      {
        text: 'Сохранить сообщение и выйти',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'secure_channel_tested', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
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
          { type: 'npcChange', npcId: 'solnysh', npcChange: { relation: 3 } },
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

  explore_sleep_dream_entrance: {
    id: 'explore_sleep_dream_entrance',
    speaker: 'Голос',
    text: 'В центре сна — светящиеся строки, складывающиеся в стихотворение. Город без неона, люди с открытыми лицами, голос, который звучит как твой — но говорит то, чего ты не писал наяву.',
    sceneId: 'sleep_dream',
    choices: [
      {
        text: 'Запомнить стихотворение из сна',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'sleep_dream_entrance' },
          { type: 'setFlag', flag: 'dream_poem_seen', flagValue: true },
        ],
      },
      {
        text: 'Бродить по сну ещё немного',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_zarema_bank_discovery: {
    id: 'explore_zarema_bank_discovery',
    speaker: 'Голос',
    text: 'Ноутбук Заремы — банковское приложение пульсирует красным. Суммы уходят странными маршрутами, следы ведут к гильдии. Зарема ещё не знает, что ты это видишь.',
    sceneId: 'zarema_albert_room',
    choices: [
      {
        text: 'Зафиксировать следы и начать расследование',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'zarema_bank_discovery' },
          { type: 'setFlag', flag: 'found_zarema_bank', flagValue: true },
        ],
      },
      {
        text: 'Закрыть ноутбук — не сейчас',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  /* ─── Act II Phase 5 — vault_key_fragments ─── */

  explore_act2_vault_guild_fragment: {
    id: 'explore_act2_vault_guild_fragment',
    speaker: 'Голос',
    text: 'За серверной стойкой — потайной шкафчик с логотипом гильдии. Внутри, между кабелями, — металлическая пластина с выгравированным фрагментом ключа. Кто-то спрятал его здесь на случай «второго Краха».',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Забрать фрагмент ключа гильдии',
        next: null,
        effects: [
          { type: 'addItem', itemId: 'vault_key_fragment', value: 1 },
          { type: 'setFlag', flag: 'guild_vault_fragment_found', flagValue: true },
          { type: 'triggerQuest', questId: 'vault_key_fragments' },
        ],
      },
      {
        text: 'Сфотографировать и оставить на месте',
        next: null,
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  explore_act2_vault_maria_fragment: {
    id: 'explore_act2_vault_maria_fragment',
    speaker: 'Виктория',
    text: '«Фрагмент Сети,» — шепчет Виктория, протягивая чип в ладони. «Мы выковали его из стихов, которые гильдия не смогла стереть. Храни — без него Хранилище не откроется. И помни: гильдия ищет все три.»',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Принять фрагмент Сети',
        next: null,
        effects: [
          { type: 'addItem', itemId: 'vault_key_fragment', value: 1 },
          { type: 'setFlag', flag: 'maria_vault_fragment_given', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, где искать третий фрагмент',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'maria_vault_fragment_given', flagValue: true },
        ],
      },
    ],
  },

  explore_act2_vault_neutral_fragment: {
    id: 'explore_act2_vault_neutral_fragment',
    speaker: 'Голос',
    text: 'Под ржавым станком — ниша, которую не видно с прохода. Внутри — третий фрагмент: без герба гильдии, без метки Сети. Его оставил тот, кто не принадлежал никому. Металл холодный, но пульсирует слабым светом.',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Забрать нейтральный фрагмент',
        next: null,
        effects: [
          { type: 'addItem', itemId: 'vault_key_fragment', value: 1 },
          { type: 'setFlag', flag: 'neutral_vault_fragment_found', flagValue: true },
        ],
      },
      {
        text: 'Осмотреть нишу ещё раз',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_act2_vault_assemble: {
    id: 'explore_act2_vault_assemble',
    speaker: 'Голос',
    text: 'Три фрагмента ложатся в ладонь — металл щёлкает, как замок, которого давно ждали. Ключ Хранилища собран. На поверхности проступает надпись: «Слово сильнее стирания.»',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Собрать полный ключ Хранилища',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_vault_revealed' },
          { type: 'setFlag', flag: 'vault_key_assembled', flagValue: true },
          { type: 'setFlag', flag: 'full_vault_access', flagValue: true },
        ],
      },
    ],
  },

  /* ─── Act II Phase 5 — poetry_smuggling (library → park → rooftop → cafe) ─── */

  explore_act2_poetry_library_stash: {
    id: 'explore_act2_poetry_library_stash',
    speaker: 'Голос',
    text: 'За потайной полкой — свёрток в восковой бумаге. Внутри — запрещённые стихи, спрятанные до «Надзора». Гильдия патрулирует основные маршруты. Придётся идти через парк и крыши.',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Забрать свёрток и идти через парк',
        next: null,
        effects: [
          { type: 'addItem', itemId: 'encrypted_scroll', value: 1 },
          { type: 'setFlag', flag: 'poetry_stash_retrieved', flagValue: true },
          { type: 'triggerQuest', questId: 'poetry_smuggling' },
          { type: 'transitionScene', sceneId: 'park_day' },
          { type: 'visitStoryNode', nodeId: 'park_explore_mode' },
        ],
      },
      {
        text: 'Переписать стихи на память и спрятать обратно',
        next: null,
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'setFlag', flag: 'poetry_stash_retrieved', flagValue: true },
        ],
      },
    ],
  },

  explore_act2_poetry_park_patrol: {
    id: 'explore_act2_poetry_park_patrol',
    speaker: 'Голос',
    text: 'Патруль гильдии проходит по аллее — два силуэта в серых плащах, сканеры в руках. Ты прижимаешься к дереву, держишь свёрток под курткой. Они проходят мимо. Дальше — крыши.',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Перебраться на крыши',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'poetry_park_evaded', flagValue: true },
          { type: 'transitionScene', sceneId: 'rooftop_edge' },
          { type: 'visitStoryNode', nodeId: 'rooftop_explore_mode' },
        ],
      },
      {
        text: 'Подождать, пока патруль уйдёт',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_act2_poetry_rooftop_cross: {
    id: 'explore_act2_poetry_rooftop_cross',
    speaker: 'Голос',
    text: 'Ветер бьёт в лицо. Ты перебираешься по крышам — свёрток под мышкой, город внизу не подозревает. Впереди — огни «Синей ямы». Последний рывок.',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Спуститься к кафе через пожарную лестницу',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'poetry_rooftop_crossed', flagValue: true },
          { type: 'transitionScene', sceneId: 'cafe_evening' },
          { type: 'visitStoryNode', nodeId: 'cafe_explore_mode' },
        ],
      },
      {
        text: 'Остановиться и перевести дух',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
    ],
  },

  explore_act2_poetry_cafe_delivery: {
    id: 'explore_act2_poetry_cafe_delivery',
    speaker: 'Бариста',
    text: 'Бариста принимает свёрток, не задавая вопросов. «Задняя комната,» — кивает он. «Здесь стихи в безопасности. Гильдия крыши не контролирует — пока.»',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Передать стихи в безопасную комнату',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'street_bench' },
          { type: 'setFlag', flag: 'poems_smuggled', flagValue: true },
          { type: 'npcChange', npcId: 'cafe_barista', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  explore_act2_closing: {
    id: 'explore_act2_closing',
    speaker: 'Голос',
    text: 'Ты выходишь на зимнюю улицу. Снег ложится на плечи, на лицо, на ладони. Город затихает — редкий момент тишины. Впереди — борьба. Но сегодня ты просто идёшь домой сквозь снег.',
    sceneId: 'street_winter',
    choices: [
      {
        text: 'Идти домой — завтра будет новый день',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'act2_closing' }],
      },
      {
        text: 'Зайти к Зареме — рассказать всё',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'act2_closing' },
          { type: 'npcChange', npcId: 'zarema', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  /* ─── Act II Phase 5 — pier / basement side-arc ─── */

  explore_pier_trofim_portwine: {
    id: 'explore_pier_trofim_portwine',
    speaker: 'Трофим',
    text: 'Ха! «777». Уважил старика. *долго смотрит на бутылку, потом лезет за пазуху и достаёт ключ на ржавой проволоке* Держи. От двери в дальнем углу цеха. Спустишься — её не трогай. Просто послушай.',
    sceneId: 'river_pier',
    choices: [
      {
        text: 'Принять ключ сторожа',
        next: null,
        effects: [
          { type: 'removeItem', itemId: 'port_wine_777' },
          { type: 'setFlag', flag: 'trofim_portwine_delivered', flagValue: true },
          { type: 'addItem', itemId: 'watchman_key' },
          { type: 'setFlag', flag: 'basement_key_found', flagValue: true },
          { type: 'triggerQuest', questId: 'basement_hum' },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  explore_basement_hum_listen: {
    id: 'explore_basement_hum_listen',
    speaker: 'Голос',
    text: 'Гул на 50 герц проходит сквозь подошвы — и выше, до затылка. Монолит «Зари-М» пульсирует зелёным, но не говорит. Трофим просил: не трогай — послушай. Ты слушаешь. По коже — мурашки.',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Запомнить гул и отступить',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'basement_hum_heard', flagValue: true },
          { type: 'setFlag', flag: 'zarya_monolith_examined', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_zarya_project_early' },
        ],
      },
      {
        text: 'Ещё раз обойти монолит',
        next: null,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
    ],
  },

  explore_corridor_letter: {
    id: 'explore_corridor_letter',
    speaker: 'Голос',
    text: 'Третий ящик сверху. Конверт без марки — только твоё имя, написанное почерком, который ты почти узнаёшь. Бумага пожелтела. Три месяца ты не решался открыть.',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Открыть письмо',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'corridor_letter_open' }],
      },
      {
        text: 'Не сейчас',
        next: null,
        effects: [{ type: 'addStat', stat: 'stress', value: 1 }],
      },
    ],
  },

  explore_corridor_intercom: {
    id: 'explore_corridor_intercom',
    speaker: 'Голос',
    text: 'Красная кнопка домофона мигает. В динамике — тихое жужжание, как перед соединением. Кто-то звонил вчера ночью. Ты не открыл.',
    sceneId: 'volodka_corridor',
    choices: [
      {
        text: 'Нажать кнопку — ответить',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'corridor_intercom_whisper' }],
      },
      {
        text: 'Отойти',
        next: null,
      },
    ],
  },

  explore_room_wardrobe: {
    id: 'explore_room_wardrobe',
    speaker: 'Голос',
    text: 'На верхней полке — фотоальбом, который ты давно не открывал. Гимназия, первый компьютер, Солныш с Умкой на лестнице. Между страницами — листок с четырьмя строками.',
    sceneId: 'volodka_room',
    choices: [
      {
        text: 'Прочитать листок',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'room_wardrobe_memory' }],
      },
      {
        text: 'Закрыть шкаф',
        next: null,
        effects: [{ type: 'setFlag', flag: 'morning_ritual_wardrobe', flagValue: true }],
      },
    ],
  },

  explore_kitchen_radio: {
    id: 'explore_kitchen_radio',
    speaker: 'Голос',
    text: '«Океан» шипит между станциями. Между волнами статики — обрывки голосов, словно кто-то читает стихи в белом шуме. Зарема говорила: иногда там слышен голос, которого не должно быть в эфире.',
    sceneId: 'home_evening',
    choices: [
      {
        text: 'Покрутить настройку — поймать сигнал',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'zarema_radio_quest_started', flagValue: true },
          { type: 'triggerQuest', questId: 'zarema_radio' },
          { type: 'visitStoryNode', nodeId: 'zarema_radio_success' },
        ],
      },
      {
        text: 'Попросить Зарему помочь',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'zarema_radio_request' }],
      },
      {
        text: 'Оставить радио в покое',
        next: null,
      },
    ],
  },

  explore_street_guild_tower: {
    id: 'explore_street_guild_tower',
    speaker: 'Голос',
    text: 'Башня IT-гильдии пульсирует ровным светом на горизонте. Окна верхних этажей мигают не в такт рекламе — кто-то там работает ночью. Сергея из ночной смены ты ещё не знаешь, но ритм уже запоминается.',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Запомнить ритм — пригодится',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'street_guild_pulse' },
        ],
      },
      {
        text: 'Отвернуться — не сейчас',
        next: null,
      },
    ],
  },

  explore_albert_lesson: {
    id: 'explore_albert_lesson',
    speaker: 'Альберт',
    text: '«Код и стих — один язык, разный синтаксис. Докажи, что видишь глубже поверхности — и я научу тебя приёмам, которых нет в учебниках гильдии.»',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Принять урок',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'cafe_albert_lesson_intro' }],
      },
      {
        text: 'Мне некогда',
        next: null,
      },
    ],
  },

  explore_cafe_backroom: {
    id: 'explore_cafe_backroom',
    speaker: 'Голос',
    text: 'За стеллажом — дверь без таблички. Из щели тянет озоном и старым кофе. Бариста делает вид, что не смотрит. «Там» — говорят в «Синей яме», когда не хотят называть место вслух.',
    sceneId: 'cafe_evening',
    choices: [
      {
        text: 'Заглянуть внутрь',
        next: null,
        effects: [{ type: 'visitStoryNode', nodeId: 'cafe_backroom_peek' }],
      },
      {
        text: 'Не сейчас',
        next: null,
        effects: [{ type: 'setFlag', flag: 'noticed_cafe_backroom', flagValue: true }],
      },
    ],
  },

  explore_office_server_hum: {
    id: 'explore_office_server_hum',
    speaker: 'Голос',
    text: 'Серверная гудит на fifty hertz. Зелёный свет между стойками пульсирует в такт башне за окном. Где-то здесь ночью работает Сергей — и видит то, что днём прячут логи.',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Поговорить с Сергеем у стойки',
        next: null,
        effects: [
          { type: 'visitStoryNode', nodeId: 'office_server_pulse' },
          { type: 'triggerQuest', questId: 'night_shift_mystery' },
        ],
      },
      {
        text: 'Только осмотреться',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'found_server_room', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_office_server_hum' },
        ],
      },
    ],
  },

  explore_office_vault_bash: {
    id: 'explore_office_vault_bash',
    speaker: 'Голос',
    text: 'Терминал Хранилища ждёт bash-доступа. Коллега дал пароль — или ты вспомнил подсказку Альберта: truth без return — это молчание. Стихи в архиве не удаляются. Их только прячут.',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Начать взлом терминала',
        next: null,
        effects: [{ type: 'setFlag', flag: 'vault_terminal_accessed', flagValue: true }],
      },
    ],
  },

  explore_office_vault_archive: {
    id: 'explore_office_vault_archive',
    speaker: 'Голос',
    text: 'Шифр снят. В резервной копии — стих, которого нет в официальных архивах. Строки складываются сами, как будто кто-то дописывал их годами.',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Сохранить стих и отключиться',
        next: null,
        condition: { flag: 'bash_terminal_solved' },
        effects: [{ type: 'visitStoryNode', nodeId: 'office_vault_archive' }],
      },
      {
        text: 'Сначала нужно взломать терминал',
        next: null,
      },
    ],
  },
};
