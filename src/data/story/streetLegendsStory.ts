import type { StoryNode } from '@/shared/types/game';

/**
 * «Уличные легенды» — story nodes for the 5 side quests defined in
 * `streetLegendsQuests.ts` (Акт 3 → Акт 5).
 *
 * Created as a NEW file so existing story packs remain untouched. Every id
 * referenced by `linkedStoryNodeId` / `linkedStoryNodeIds` on the 5 quests
 * resolves here; the pack is merged in `buildStoryNodes()` and registered as
 * the `streetLegends` satellite in `narrativePackRegistry.ts`.
 *
 * Tone — post-Soviet cyberpunk, melancholic but hopeful, Disco Elysium-style
 * inner monologue. Russian language, conversational. Prose only — poems are
 * SACRED (`src/data/poems.ts`); this file never rewrites their text.
 *
 * Recurring numerology of the pack: дом 12 по Косой линии, три длинных и
 * девять коротких (12 миганий), 12 лет ожидания, «тихий час».
 */
export const STREET_LEGENDS_STORY_NODES: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Свет в окне напротив» — Grisha, blinking light, Косая 12
     ═══════════════════════════════════════════════════════════════ */
  sl_window_light_start: {
    id: 'sl_window_light_start',
    text: [
      'Гриша сидит на краю крыши, свесив ноги над пожарной лестницей, и тычет пальцем в темноту между панельками. «Вон. Дом по Косой, двенадцать. Брошен лет двенадцать назад, электричество отрубили, окна заколотили. А свет в окне второго этажа — мигает. Каждую ночь. Три длинных, девять коротких. Я сидел три ночи и считал. Это не короткое замыкание, Володька. Короткое замыкание не умеет в ритм.»',
      'Он сплёвывает вниз, в двенадцатиэтажную пустоту. «Гильдия дом списала. Дроны туда не летают — нет кода здания, некуда записывать протокол. То есть — там сейчас законно ничего нет. А свет — есть. Проверь, а? Мне с крыши не видно, а тебе из твоего окна — должно.»',
    ].join('\n'),
    speaker: 'Гриша',
    sceneId: 'rooftop_edge',
    contextNote: 'Гриша на краю крыши показывает на мигающий свет в брошенном доме по Косой, 12.',
    accessibilityAnnounce: 'Гриша просит проследить за мигающим светом в окне брошенного дома напротив.',
    guidanceHint: 'Вернись домой и посмотри в окно — понаблюдай за домом напротив.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Спуститься домой — посмотреть из своего окна',
        next: 'sl_window_light_watch',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'sl_window_light' },
          { type: 'setFlag', flag: 'sl_window_light_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'grisha', npcChange: { relation: 3 } },
          { type: 'transitionScene', sceneId: 'volodka_room' },
        ],
      },
      {
        text: 'Спросить, почему он сам не спустился — три ночи же сидел',
        next: 'sl_window_light_watch',
        effects: [
          { type: 'triggerQuest', questId: 'sl_window_light' },
          { type: 'setFlag', flag: 'sl_window_light_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'volodka_room' },
        ],
      },
      { text: 'Отойти от края — сейчас не до легенд', next: 'rooftop_explore_mode' },
    ],
  },

  sl_window_light_watch: {
    id: 'sl_window_light_watch',
    text: [
      'Твоя комната. Чайник остывает, город за стеклом работает свою ночную смену: дроны, реклама, дождь. Дом по Косой, 12 — прямо напротив, через двор. Тёмный, прямой, безмолвный. И только одно окно на втором этаже живёт: вспышка — пауза — вспышка. Три долгих. Девять коротких. Снова.',
      'Ты узнаёшь этот ритм не головой, а чем-то ниже: так мигает не неисправность. Так подмигивает тот, кто уверен, что его никто не видит. Осталось решить — досмотреть до конца или идти прямо сейчас, пока свет не устал.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'volodka_room',
    contextNote: 'Володька у окна своей комнаты наблюдает мигающий свет в доме напротив.',
    accessibilityAnnounce: 'Окно на Косой, 12 мигает: три длинных, девять коротких.',
    guidanceHint: 'Досмотри ритм до конца (ночью он меняется) — или иди на улицу сейчас.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_window_light_watching_started', flagValue: true }],
    choices: [
      {
        text: 'Досмотреть до конца — после десяти вечера ритм меняется',
        next: 'sl_window_light_street',
        goldenPath: true,
        condition: { minTimeOfDay: 22, maxTimeOfDay: 24 },
        effects: [
          { type: 'setFlag', flag: 'sl_window_light_night_watch', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'После десяти — двенадцать миганий, пауза, снова двенадцать. Это не сигнал. Это — счёт. Кто-то внутри считает что-то, что кончается. Или не кончается.', thoughtDuration: 5000 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
      {
        text: 'Не ждать ночи — идти к дому прямо сейчас',
        next: 'sl_window_light_street',
        effects: [
          { type: 'setFlag', flag: 'sl_window_light_night_watch', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  sl_window_light_street: {
    id: 'sl_window_light_street',
    text: [
      'Косая линия ночью — это не улица, а черновик улицы: фонарь через три, лужи с нефтяной радугой, табличка «12» выцветшая до «1». Дверь заколочена крест-накрест, но крест прибит недавно — гвозди блестят. Кто-то обновляет доски. Кто-то следит, чтобы дом выглядел мёртвым.',
      'Свет на втором этаже отсюда не виден — мешает козырёк подъезда. Зато видно другое: пожарная лестница, ржавая, но со свежей смазкой на нижнем колене. И окно подвала, приоткрытое ровно на ширину ладони.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Косая линия, 12. Заколоченная дверь, смазанная лестница, приоткрытое окно подвала.',
    accessibilityAnnounce: 'Дом заколочен, но лестница смазана, а окно подвала приоткрыто.',
    guidanceHint: 'Попади внутрь — через окно подвала или по пожарной лестнице.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Косая, 12',
    choices: [
      {
        text: 'Подняться по пожарной лестнице — к мигающему окну',
        next: 'sl_window_light_house',
        goldenPath: true,
        effects: [{ type: 'addStat', stat: 'stress', value: 1 }],
      },
      {
        text: 'Сначала окно подвала — войти снизу, тихо',
        next: 'sl_window_light_house',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  sl_window_light_house: {
    id: 'sl_window_light_house',
    text: [
      'Второй этаж пахнет пылью, старым лаком и палёной изоляцией. В комнате, где мигает свет, нет никого — только стол у окна, и на столе — оно. Ламповый радиопередатчик в фанерном корпусе, самодельный, с антенной из гвоздей, выведенной сквозь дырку в раме на крышу. Лампа на корпусе и есть тот свет: три долгих, девять коротких. Рядом — будильник без стрелок и банка из-под кофе с мелочью.',
      'Всё чисто. Пыль лежит ровно, кроме тропинки от окна к столу — её протаптывают. Регулярно. Ты стоишь в чужой комнате, которая не пустует, хотя дом по всем реестрам мёртв уже двенадцать лет.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Комната на втором этаже: самодельный радиопередатчик, лампа-маячок, банка с мелочью.',
    accessibilityAnnounce: 'Передатчик на столе. Комната не пустует — тропинка к столу протоптана.',
    guidanceHint: 'Осмотри передатчик — послушай, что он передаёт.',
    guidanceObjectiveType: 'collect_item',
    effects: [
      { type: 'addItem', itemId: 'old_radio_transmitter' },
      { type: 'setFlag', flag: 'sl_window_light_transmitter_found', flagValue: true },
    ],
    choices: [
      {
        text: 'Послушать передачу — что он ловит',
        next: 'sl_window_light_room',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'rhythm', value: 1 }],
      },
      {
        text: 'Сначала заглянуть в банку с мелочью',
        next: 'sl_window_light_room',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Мелочь — старая, до Сбоя. Кто-то платит этой станции за эфир. Монетами. Как в автомате с газировкой — только автомат тут один на весь мёртвый дом.', thoughtDuration: 5000 },
        ],
      },
    ],
  },

  sl_window_light_room: {
    id: 'sl_window_light_room',
    text: [
      'Кассету ты в передатчике не находишь — её там и нет: это приёмник. Колесо настройки стоит на частоте, которой нет ни в одном реестре гильдии, и из динамика идёт голос. Старик, старая плёнка, старая манера говорить: «...ветер северо-западный, три метра в секунду, к утру — тише...» Дальше — четверостишие. Тихое, домашнее, про двор, про сеть над двором, про тех, кто не доспал.',
      'На задней панели передатчика — солнечная батарея, прислонённая к раме, и надпись мелом: «меняй в марте». Почерк детский. Круглые буквы, старание, жирная точка в конце. Ты стоишь в комнате, где двенадцать лет кто-то меняет в марте батарею — и не хочет, чтобы об этом знали.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Передатчик ловит частоту, которой нет в реестрах. Батарею меняют каждый март — детский почерк.',
    accessibilityAnnounce: 'Голос читает старую сводку погоды и стих. Батарею меняет кто-то с детским почерком.',
    guidanceHint: 'Реши судьбу станции — и легенды о свете в окне.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'sl_window_light_tape_heard', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_communal_radio' },
    ],
    choices: [
      {
        text: 'Сохранить тайну — свет останется ничьим, как и положено легенде',
        next: 'sl_window_light_resolve',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_window_light_resolved', flagValue: true },
          { type: 'setFlag', flag: 'sl_window_light_secret_kept', flagValue: true },
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addXp', value: 100 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'grisha', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Рассказать Грише и Сети — частоту поставят на баланс, будут менять батарею по расписанию',
        next: 'sl_window_light_resolve',
        effects: [
          { type: 'setFlag', flag: 'sl_window_light_resolved', flagValue: true },
          { type: 'setFlag', flag: 'sl_window_light_shared', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addXp', value: 100 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'npcChange', npcId: 'grisha', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  sl_window_light_resolve: {
    id: 'sl_window_light_resolve',
    text: [
      'Ты аккуратно ставишь передатчик на стол — туда, где он стоял: тропинка от окна до стола должна остаться ровно такой, какой была. Лампа мигает тебе вслед: три долгих, девять коротких. Двенадцать. Как номер дома. Как лет с тех пор, как город вычеркнул Косую, 12 из своих списков — а Косая, 12 не заметила.',
      'Внизу, во дворе, ветер гонит листву вдоль заколоченной двери. Где-то в этом городе спит человек, который каждое утро проверяет солнечную батарею и каждое утро надеется, что никто не спросит, зачем. Легенды не живут в реестрах. Они живут, пока есть кто-то, кто не рассказал.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Володька оставляет станцию как была и выходит из дома на Косой, 12.',
    accessibilityAnnounce: 'Станция останется на своём окне. Легенда — при ней.',
    guidanceHint: 'Квест закрыт. Возвращайся к своим делам.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Вернуться на крышу — Гриша досчитывает свои ночи',
        next: 'rooftop_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'sl_window_light_done', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'transitionScene', sceneId: 'rooftop_edge' },
        ],
      },
      {
        text: 'Сесть на скамейку во дворе — досмотреть, как мигает',
        next: 'street_bench_view',
        effects: [{ type: 'setFlag', flag: 'sl_window_light_done', flagValue: true }],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Курьер поневоле» — Lyonya's parcel for Sergey
     ═══════════════════════════════════════════════════════════════ */
  sl_courier_start: {
    id: 'sl_courier_start',
    text: [
      'Лёня гасит ростер, вытирает руки о фартук и долго смотрит на крайнюю чашку на сушилке — как будто она должна решить за него. «Вот, — говорит он наконец. — Отнесёшь. Сергей, сисадмин ночной смены, серверная на втором этаже офиса гильдии. Из рук в руки. Скажешь: от Лёни, с Косой.»',
      'Пакет — крафт-бумага, бечёвка, узел старомодный, морской. «Не потеряй. Не вскрывай. И не спрашивай, почему я не отдам его сам, — я пробовал. Двенадцать лет пробовал. Он заходит по вторникам, садится вон там, у окна, пьёт двойной эспрессо и уходит. А я стою за стойкой и не могу через неё выйти. Стойка, Володька, — это граница. С одной стороны — тот, кто варит. С другой — все остальные.»',
    ].join('\n'),
    speaker: 'Лёня',
    sceneId: 'cafe_evening',
    contextNote: 'Лёня за стойкой протягивает запечатанный пакет с двенадцатилетней историей.',
    accessibilityAnnounce: 'Лёня просит доставить запечатанную посылку Сергею — сисадмину ночной смены.',
    guidanceHint: 'Возьми пакет и иди через ночной город в серверную гильдии.',
    guidanceObjectiveType: 'collect_item',
    guidanceSceneLabel: 'Кафе',
    choices: [
      {
        text: 'Взять пакет — не задавая вопросов',
        next: 'sl_courier_takeoff',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'sl_reluctant_courier' },
          { type: 'setFlag', flag: 'sl_courier_accepted', flagValue: true },
          { type: 'addItem', itemId: 'sealed_parcel' },
          { type: 'npcChange', npcId: 'lyonya', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, что внутри — пакет тяжёлый, как полтора кирпича',
        next: 'sl_courier_takeoff',
        effects: [
          { type: 'triggerQuest', questId: 'sl_reluctant_courier' },
          { type: 'setFlag', flag: 'sl_courier_accepted', flagValue: true },
          { type: 'addItem', itemId: 'sealed_parcel' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Он не ответил. Он сказал «кофе» и отвернулся к ростеру. Значит, внутри — не кофе. Значит, внутри что-то, что пахнет кофе лишь потому, что лежало здесь двенадцать лет.', thoughtDuration: 5000 },
        ],
      },
      { text: 'Отказаться — у стойки границ, а у меня свои', next: 'cafe_explore_mode' },
    ],
  },

  sl_courier_takeoff: {
    id: 'sl_courier_takeoff',
    text: [
      'Пакет в руках оказывается легче, чем выглядит, — так бывает только с вещами, которые ждали слишком долго: они высыхают. Бечёвка врезается в ладонь. На углу, под почтовым штемпелем давно закрытой сортировочной, — строка карандашом: «если не найду в себе сил — пусть найдёт курьер».',
      'До офиса гильдии — через весь центр: двор, мост, площадь. Ночь как раз та, в которую города перестают притворяться, что спят. Дождь начинается у самого моста — мелкий, технический, из тех, что гильдия зовёт «оптимизацией влажности».',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'cafe_evening',
    contextNote: 'Пакет в руках. На углу — карандашная приписка: «пусть найдёт курьер».',
    accessibilityAnnounce: 'Посылка получена. Через город — до серверной офиса гильдии.',
    guidanceHint: 'Выходи на улицу — и через мост, к офису гильдии.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Улица',
    choices: [
      {
        text: 'Выйти в дождь — нести, как велено',
        next: 'sl_courier_street',
        goldenPath: true,
        effects: [{ type: 'transitionScene', sceneId: 'street_night' }],
      },
      {
        text: 'Перечитать адрес ещё раз — аккуратность курьера',
        next: 'sl_courier_street',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  sl_courier_street: {
    id: 'sl_courier_street',
    text: [
      'Мост. Вода под ним — чёрная, с нефтяными разводами, отражает рекламу гильдии в перевёрнутом виде: «ПОРЯДОК — ЭТО ЯСНОСТЬ» превращается в «ЬТСОЛЯЯ ЕТ Э ТЯДРОП». Под навесом автобусной остановки дремлет патруль — тебе не интересен, ты не интересен ему: курьеры — фон города.',
      'Пакет под курткой согрелся и будто бы тикает — нет, не тикает: это твоё собственное сердце стучит в бечёвку. На скамейке у моста можно остановиться и одну секунду побыть не почтальоном, а просто человеком, у которого в руках чужая тайна.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Мост через центр. Патруль дремлет под навесом. Пакет прижат к груди.',
    accessibilityAnnounce: 'Мост. Патруль не обращает внимания. Впереди — офис гильдии.',
    guidanceHint: 'Отнеси пакет Сергею в серверную — не вскрывая.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_courier_in_transit', flagValue: true }],
    choices: [
      {
        text: 'Не останавливаться — нести, как велено, не вскрывая',
        next: 'sl_courier_delivery',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'setFlag', flag: 'sl_courier_parcel_intact', flagValue: true },
        ],
      },
      {
        text: 'Сесть на скамейку и вскрыть — один уголок, только посмотреть',
        next: 'sl_courier_delivery',
        effects: [
          { type: 'addKarma', value: -2 },
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'sl_courier_parcel_peeked', flagValue: true },
          { type: 'showThought', thought: 'Я увидел только угол листа и одну строчку. Двенадцать лет человек ждал, когда эти строки дойдут, — а я прочитал их на скамейке первым. Курьер имеет право знать, что несёт. Почтальон — нет.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Сесть на скамейку — просто переждать дождь, пакет не трогать',
        next: 'sl_courier_delivery',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
          { type: 'setFlag', flag: 'sl_courier_parcel_intact', flagValue: true },
        ],
      },
    ],
  },

  sl_courier_delivery: {
    id: 'sl_courier_delivery',
    text: [
      'Серверная на втором этаже офиса гильдии гудит на двух герцах ниже, чем город, — здесь холодно, ровно и по-своему честно. Сергей сидит между стоек, как сидят люди, давно переставшие различать дом и работу. Увидев пакет, он сначала не встаёт. Потом встаёт медленно, вытирает ладони о джинсы — дважды.',
      '«От Лёни, — говоришь ты. — С Косой». Сергей кивает так, будто ждал именно этих трёх слов все двенадцать лет. Берёт пакет. Верёвка поддаётся с третьего узла — Лёня завязал на совесть. Внутри — не кофемолка и не инструмент. Лист, исписанный от руки. И маленький пакет зерна, полупрозрачный от старости.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Серверная гильдии. Сергей разворачивает пакет: рукописный лист и старый пакет кофе.',
    accessibilityAnnounce: 'Пакет доставлен. Сергей разворачивает: рукопись и старое зерно.',
    guidanceHint: 'Стой рядом — это его минута.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceSceneLabel: 'Серверная',
    choices: [
      {
        text: 'Стоять рядом — молча',
        next: 'sl_courier_reading',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
      {
        text: 'Сознаться, что видел одну строчку на скамейке',
        next: 'sl_courier_reading',
        condition: { flag: 'sl_courier_parcel_peeked' },
        effects: [
          { type: 'addKarma', value: 1 },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 3 } },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
      {
        text: 'Отойти к стойке — не смотреть, как чужое письмо находит адресата',
        next: 'sl_courier_reading',
        effects: [{ type: 'addStat', stat: 'stress', value: -1 }],
      },
    ],
  },

  sl_courier_reading: {
    id: 'sl_courier_reading',
    text: [
      'Сергей читает стоя, потому что сесть сейчас — значит потерять страницу из виду хотя бы на секунду. Лист дрожит не от сквозняка. В серверной гудят стойки, и кажется, что это они читают вместе с ним — все сорок два юнита, все резервные копии.',
      '«Отец, — говорит Сергей наконец. Не тебе. Гулу. — Ты двенадцать лет собирался». Он выравнивает лист, кладёт на серверную стойку, сверху — пакетик зерна, как пресс-папье. «Лёня варил этот кофе в последнюю нашу смену. Двойной эспрессо. Он всё помнил. Я — тоже. Просто мы оба не умели первый шаг.»',
    ].join('\n'),
    speaker: 'Сергей',
    sceneId: 'office_day',
    contextNote: 'Сергей дочитал рукопись отца. Лист лежит на стойке под пакетиком старого зерна.',
    accessibilityAnnounce: 'Рукопись — от отца Сергея. Двенадцать лет она ждала у Лёни за стойкой.',
    guidanceHint: 'Квест почти закрыт — досмотри эту минуту до конца.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'sl_courier_parcel_delivered', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_coffee_code' },
    ],
    choices: [
      {
        text: 'Ничего не спрашивать — просто быть рядом, сколько нужно',
        next: 'sl_courier_resolve',
        goldenPath: true,
        effects: [
          { type: 'addXp', value: 120 },
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 6 } },
        ],
      },
      {
        text: 'Спросить, что там — в последней строке',
        next: 'sl_courier_resolve',
        effects: [
          { type: 'addXp', value: 120 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'sergey', npcChange: { relation: 6 } },
          { type: 'showThought', thought: 'Он показал. Последняя строка была не про Сергея и не про Лёню. Она была про любого, кто дочитал до конца: «если ты это читаешь — значит, город всё-таки умеет доставлять».', thoughtDuration: 6000 },
        ],
      },
    ],
  },

  sl_courier_resolve: {
    id: 'sl_courier_resolve',
    text: [
      'Сергей фотографирует лист — не для архива, для себя, в телефон, дрожащими руками. Потом аккуратно складывает рукопись вдвое и убирает во внутренний карман, где теплее. «Скажи Лёне... — начинает он и машет рукой. — Нет. Ничего не говори. Он поймёт по тому, как я выпью кофе во вторник. Двойной эспрессо. За стойкой.»',
      'Ты выходишь из серверной в коридор с пустыми руками — и руки почему-то легче, чем были с пакетом. За окном светает. Где-то на другом конце города Лёня уже греет ростер для утренней смены и не знает, что двенадцать лет кончились этой ночью.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Рукопись у Сергея. Курьер выходит с пустыми руками — и легче.',
    accessibilityAnnounce: 'Посылка доставлена. Двенадцать лет ожидания кончились.',
    guidanceHint: 'Квест закрыт. Вернись в кафе — или иди своей дорогой.',
    guidanceObjectiveType: 'complete_quest',
    effects: [{ type: 'removeItem', itemId: 'sealed_parcel' }],
    choices: [
      {
        text: 'Вернуться в кафе — посмотреть, как Лёня встретит вторник',
        next: 'cafe_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_courier_done', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'addCredits', value: 40 },
          { type: 'npcChange', npcId: 'lyonya', npcChange: { relation: 10 } },
          { type: 'transitionScene', sceneId: 'cafe_evening' },
        ],
      },
      {
        text: 'Выйти в город — утро уже началось без тебя',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'sl_courier_done', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -3 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Крысиные бега» — Progress-7 basement crypt cleanup
     ═══════════════════════════════════════════════════════════════ */
  sl_rat_race_start: {
    id: 'sl_rat_race_start',
    text: [
      'Мастер «Прогресса-7» встречает тебя у цеховых ворот, как встречают сантехника, которого вызывали трижды: устало и с порога о деле. «Подвал. Опять. Крипы развелись — кабель грызут, стойку облепили. Крысы — ладно, крысы от яда уходят. Эти — к стойке возвращаются. Ночью их там двенадцать было. Я считал с люка.»',
      '«Я в мистику не верю, — добавляет он ровно, как читает инструкцию. — Я верю в исправные кабели. Платим по факту: два патруля — и то, что они там пасут. Это третьим пунктом, отдельно. Подпись не нужна, у нас тут честное слово и наряд-заказ. Перчатки возьми у Зины.»',
    ].join('\n'),
    speaker: 'Мастер',
    sceneId: 'abandoned_factory',
    contextNote: 'Мастер «Прогресса-7» выдаёт наряд на зачистку подвала от крип-патрулей.',
    accessibilityAnnounce: 'Мастер просит зачистить подвал: два крип-патруля и то, что они охраняют.',
    guidanceHint: 'Спустись в подвал завода — патрули ждут.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подвал завода',
    choices: [
      {
        text: 'Спуститься в подвал — перчатки потом',
        next: 'sl_rat_race_basement',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'sl_rat_race' },
          { type: 'setFlag', flag: 'sl_rat_race_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'factory_foreman', npcChange: { relation: 3 } },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
      {
        text: 'Спросить, что за стойка — и почему крипы её пасут',
        next: 'sl_rat_race_basement',
        effects: [
          { type: 'triggerQuest', questId: 'sl_rat_race' },
          { type: 'setFlag', flag: 'sl_rat_race_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
      { text: 'Отойти в цех — подумать до вечера', next: 'factory_explore_mode' },
    ],
  },

  sl_rat_race_basement: {
    id: 'sl_rat_race_basement',
    text: [
      'Подвал «Прогресса-7» — это карта всех страхов завода за последние двадцать лет, нарисованная кабелями. Гудит мёртвая тяга, капает конденсат, и в глубине, за вторым поворотом коллектора, стоит тусклое сияние — как гирлянда, которую забыли снять с нового года, только нового года было двенадцать назад.',
      'Первый патруль ты слышишь раньше, чем видишь: сухой шелест, как перетаскивают перфокарты. Призрак Данных — три сгустка холодного огня, ходят по кругу и «выщипывают» жилы из кабельного лотка. За ними, глубже, маячит оранжевое: второй патруль, посерьёзнее. Гильдейский силовик. Говорят, из списанных, но списанные — самые злые.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Подвал завода. Первый крип-патруль щиплет кабели, глубже ждёт второй.',
    accessibilityAnnounce: 'В подвале два патруля крипов. Первый — прямо по курсу.',
    guidanceHint: 'Разбери первый патруль — Призрак Данных.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_rat_race_in_basement', flagValue: true }],
    choices: [
      {
        text: 'В лоб — стая мелкая, стойку жалко',
        next: 'sl_rat_race_first_patrol',
        goldenPath: true,
        effects: [
          { type: 'combat', enemyType: 'data_wraith' },
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
      {
        text: 'Обойти по кабельным козлам и ударить сверху',
        next: 'sl_rat_race_first_patrol',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 10 } },
        effects: [
          { type: 'combat', enemyType: 'data_wraith' },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  sl_rat_race_first_patrol: {
    id: 'sl_rat_race_first_patrol',
    text: [
      'Сгустки рассыпаются с тихим звоном — как будто уронили коробку ёлочных игрушек, а поднять уже некому. Кабельный лоток на месте повреждения тёплый и липкий. Мастер был прав: они возвращаются к стойке. Все тропки тут ведут в одну сторону — к дальнему углу, где сияние становится ровнее и глуше.',
      'Второй патруль тебя заметил — и не спешит. Гильдейский силовик из списанных ходит вокруг старой серверной стойки, как ходят вокруг печки в холодном цеху: медленно, по привычке, обогревая бока. Он не охраняет — он греется. Но разбираться придётся и с этим.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Первый патруль рассыпан. Второй — силовик — греется у старой серверной стойки.',
    accessibilityAnnounce: 'Первый патруль зачищен. У стойки ждёт гильдейский силовик.',
    guidanceHint: 'Разбери второй патруль — списанного силовика.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_rat_race_patrol_one_cleared', flagValue: true }],
    choices: [
      {
        text: 'Идти на силовика — в открытую',
        next: 'sl_rat_race_second_patrol',
        goldenPath: true,
        effects: [
          { type: 'combat', enemyType: 'guild_enforcer' },
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
      {
        text: 'Перебить свет на секции — и ударить из темноты',
        next: 'sl_rat_race_second_patrol',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 11 } },
        effects: [
          { type: 'combat', enemyType: 'guild_enforcer' },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  sl_rat_race_second_patrol: {
    id: 'sl_rat_race_second_patrol',
    text: [
      'Силовик оседает с электрическим вздохом, как сгоревший трансформатор, — и подвал впервые за долгое время замолкает по-настоящему. Теперь слышно то, что перекрывали патрули: низкий, утробный гонг. Не звук даже — счёт. Стойка в дальнем углу не просто светится — она отсчитывает.',
      'Ты подходишь. Ржавая серверная стойка, древняя, из тех, что ставили, когда «Прогресс» ещё выпускал прогресс. Вокруг неё — гнездо: оптоволокно, витое, свитое, сплетённое крипами в подобие короны. А внутри, за мутным стеклом, медленно поворачивается барабан памяти. Крысиный король. Он был тут раньше крипов, раньше мастера — может, раньше самого подвала.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Силовик выключен. У ржавой стойки — «крысиный король», Ржавый Страж.',
    accessibilityAnnounce: 'Патрули зачищены. У стойки просыпается крысиный король.',
    guidanceHint: 'Победи крысиного короля — Ржавого Стража.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_rat_race_patrol_two_cleared', flagValue: true }],
    choices: [
      {
        text: 'Вскрыть стойку — король мешает работе завода',
        next: 'sl_rat_race_king',
        goldenPath: true,
        effects: [
          { type: 'combat', enemyType: 'rust_sentinel' },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
      {
        text: 'Сначала срезать оптоволоконную корону — чтобы не повредить',
        next: 'sl_rat_race_king',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'combat', enemyType: 'rust_sentinel' },
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  sl_rat_race_king: {
    id: 'sl_rat_race_king',
    text: [
      'Ржавый Страж умирает долго и с достоинством: барабан докручивает последний оборот, лампы гаснут по очереди — справа налево, как аплодисменты наоборот. Когда стихает последнее эхо, ты стоишь один перед стойкой, на которой двенадцать лет кто-то хранил заводскую память: смены, наряды, заявки, голоса мастеров, записанные на вход.',
      'Крипы не грызли стойку. Они её грели — оптоволокно держало тепло, и патрули, списанные из своих сетей, приходили сюда, как приходят к последнему тёплому месту. На боку стойки мелом — тот же детский круглый почерк, что и на Косой, 12: «пусть играет». Под мелом — кнопка. Запись цикла заводского радиоузла: утренняя перекличка, гимн смены и одно четверостишие, которое кто-то из мастеров читал в микрофон каждый понедельник, двадцать лет подряд.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Страж выключен. В стойке — заводская память и цикл радиоузла. Крипы грелись у тепла.',
    accessibilityAnnounce: 'Король побеждён. В стойке — записи заводского радиоузла и строки мастеров.',
    guidanceHint: 'Забери корону и реши, что делать с памятью стойки.',
    guidanceObjectiveType: 'collect_item',
    effects: [
      { type: 'setFlag', flag: 'sl_rat_race_king_defeated', flagValue: true },
      { type: 'addItem', itemId: 'rat_king_crown' },
      { type: 'discoverLore', loreId: 'lore_factory_ghosts' },
    ],
    choices: [
      {
        text: 'Переписать строки на бумагу — для Бабы Зины, ей такое дорого',
        next: 'sl_rat_race_resolve',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'sl_rat_race_memory_copied', flagValue: true },
        ],
      },
      {
        text: 'Сдать всё мастеру, как договаривались — наряд есть наряд',
        next: 'sl_rat_race_resolve',
        effects: [
          { type: 'addCredits', value: 30 },
          { type: 'npcChange', npcId: 'factory_foreman', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'sl_rat_race_memory_reported', flagValue: true },
        ],
      },
    ],
  },

  sl_rat_race_resolve: {
    id: 'sl_rat_race_resolve',
    text: [
      'Подвал молчит — впервые за двенадцать лет по-честному: не испуганно, не натужно, а просто тихо. Ты наматываешь «корону» на локоть: оптоволокно тёплое, гибкое, живое на ощупь — как всё, что крутилось слишком долго. Наверху, в цеху, стучит смена. Мастер не спросит подробностей. Мастера никогда не спрашивают подробностей — только результат.',
      'По лестнице поднимается утренний сквозняк — с запахом машинного масла и свежего кофе из кулера. Крысиные бега окончены: стойка остаётся внизу, крипы — в списках утиля, а корона... корона поедет с тобой. Просто потому, что трофей без хозяина — это просто ржавчина.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Подвал зачищен. Корона намотана на локоть — трофей при тебе.',
    accessibilityAnnounce: 'Подвал зачищен, трофей взят. Пора к мастеру — закрывать наряд.',
    guidanceHint: 'Квест закрыт. Вернись в цех к мастеру.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Подняться в цех — сдать наряд мастеру',
        next: 'factory_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_rat_race_done', flagValue: true },
          { type: 'addXp', value: 170 },
          { type: 'addCredits', value: 90 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'factory_foreman', npcChange: { relation: 10 } },
          { type: 'transitionScene', sceneId: 'abandoned_factory' },
        ],
      },
      {
        text: 'Ещё раз обойти подвал — вдруг крипы что-то забыли',
        next: 'basement_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'sl_rat_race_done', flagValue: true },
          { type: 'addXp', value: 170 },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Тихий час» — Tamara, three forgotten things
     ═══════════════════════════════════════════════════════════════ */
  sl_quiet_hour_start: {
    id: 'sl_quiet_hour_start',
    text: [
      'Тамара закрывает за тобой дверь читального зала и говорит тише, чем положено даже для библиотеки. «Сейчас — тихий час. Раз в году, два часа до закрытия, все забытые вещи в библиотеке начинают шептать. Не верят только те, кто не слышал. Я слышу двадцать лет — и записываю, что они просят. Обычно просят вернуть.»',
      '«В этом году их три. Очки — на столе у окна, с треснувшим стеклом. Зонт — в стояке у входа, хозяин оставил его в прошлый ноябрь. И кассета — в подвале, в коробке невостребованного, с надписью „тихий час“ шилом на корпусе. Очки и зонт я верну сама. Кассету... — Тамара смотрит в сторону подвальной лестницы. — Кассету возвращать некому. Но сначала — собери все три. Пока час не кончился.»',
    ].join('\n'),
    speaker: 'Тамара',
    sceneId: 'library_day',
    contextNote: 'Тамара шепчет про тихий час: три забытые вещи просят их вернуть.',
    accessibilityAnnounce: 'Тихий час в библиотеке: найти очки, зонт и кассету.',
    guidanceHint: 'Обойди библиотеку: читальный зал, стояк у входа, подвал архива.',
    guidanceObjectiveType: 'collect_item',
    guidanceSceneLabel: 'Библиотека',
    choices: [
      {
        text: 'Идти собирать — тихий час не ждёт',
        next: 'sl_quiet_hour_glasses',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'sl_quiet_hour' },
          { type: 'setFlag', flag: 'sl_quiet_hour_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, чьи это вещи — и почему кассету возвращать некому',
        next: 'sl_quiet_hour_glasses',
        effects: [
          { type: 'triggerQuest', questId: 'sl_quiet_hour' },
          { type: 'setFlag', flag: 'sl_quiet_hour_accepted', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      { text: 'Отойти к стеллажам — легенды подождут до вечера', next: 'library_explore_mode' },
    ],
  },

  sl_quiet_hour_glasses: {
    id: 'sl_quiet_hour_glasses',
    text: [
      'Стол у окна, второй ряд. Очки лежат на раскрытом томе — так, будто читатель вышел на минуту: поправить чай, ответить на звонок, дожить до утра. Треснувшее стекло преломляет закатный свет в тонкую радужную нить. Дужка обмотана синей изолентой — дважды, аккуратно, с тем же терпением, с каким человек двенадцать лет перечитывал одну и ту же книгу.',
      'Если тихий час и правда существует — сейчас это чувствуется: между страниц что-то шелестит. Не ветер. Не сквозняк. Скорее — благодарность. Очень тихая, очень бумажная.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Читальный зал. Очки на раскрытом томе — читатель как будто вышел на минуту.',
    accessibilityAnnounce: 'Очки найдены на столе у окна. Стекло треснувшее, дужка в изоленте.',
    guidanceHint: 'Возьми очки — и к стояку у входа, за зонтом.',
    guidanceObjectiveType: 'collect_item',
    effects: [{ type: 'setFlag', flag: 'sl_quiet_hour_glasses_found', flagValue: true }],
    choices: [
      {
        text: 'Взять очки — осторожно, за дужку',
        next: 'sl_quiet_hour_umbrella',
        goldenPath: true,
        effects: [{ type: 'addItem', itemId: 'lost_reading_glasses' }],
      },
      {
        text: 'Завернуть очки в страницу газеты — так носят хрупкое',
        next: 'sl_quiet_hour_umbrella',
        effects: [
          { type: 'addItem', itemId: 'lost_reading_glasses' },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  sl_quiet_hour_umbrella: {
    id: 'sl_quiet_hour_umbrella',
    text: 'Стояк у входа — деревянный, из тех, что помнят паркет и шёпот. В нём три зонта: два новых, гильдейских, со сканерами в ручках, и один — чёрный, с погнутым ребром и латунной монограммой «А.К.». Тот, что постарше, стоит в углу так основательно, что персонал давно считает его частью интерьера. Тамара считает иначе — и монограмма в её картотеке, наверное, занимает целую карточку. За дверью, на лестнице, сохнет дождь — прошлогодний, ноябрьский, оставшийся на зонте вечной сыростью.',
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Стояк у входа. Чёрный зонт с монограммой «А.К.» ждёт с прошлого ноября.',
    accessibilityAnnounce: 'Зонт найден в стояке. Монограмма А.К., ребро погнуто.',
    guidanceHint: 'Возьми зонт — и спускайся в подвал за кассетой.',
    guidanceObjectiveType: 'collect_item',
    effects: [{ type: 'setFlag', flag: 'sl_quiet_hour_umbrella_found', flagValue: true }],
    choices: [
      {
        text: 'Взять зонт и спуститься в подвал архива',
        next: 'sl_quiet_hour_tape',
        goldenPath: true,
        effects: [
          { type: 'addItem', itemId: 'lost_umbrella' },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      {
        text: 'Заглянуть в картотеку — кто такой «А.К.»',
        next: 'sl_quiet_hour_tape',
        effects: [
          { type: 'addItem', itemId: 'lost_umbrella' },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'showThought', thought: 'Карточка нашлась сразу: «Ковалёва А.С., зачёт читательского билета — 2013». На обороте чужим почерком: «зонт пусть постоит. Я за ним как-нибудь». «Как-нибудь» длится двенадцатый год.', thoughtDuration: 6000 },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
    ],
  },

  sl_quiet_hour_tape: {
    id: 'sl_quiet_hour_tape',
    text: [
      'Подвал архива встречает запахом нафталина и холодной бумаги. Коробка «невостребованное» — третья полка, самый низ. Кассета МК-60 лежит сверху, без подписи, только «тихий час» нацарапано шилом — тем почерком, каким пишут не для других, а для себя, чтобы не забыть. Лента слиплась от старости, но датчик остатка показывает: её слушали до конца. Много раз.',
      'Принести кассету наверх — минута. Но есть момент, который случается только здесь: если приложить кассету к уху, слышно, как лента дышит. Не играет — дышит. В тихий час забытые вещи шепчут, и эта — громче всех.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_basement',
    contextNote: 'Подвал архива. Кассета «тихий час» — в коробке невостребованного.',
    accessibilityAnnounce: 'Кассета найдена в подвале. Лента слиплась, но слушана много раз.',
    guidanceHint: 'Возьми кассету и возвращайся к Тамаре.',
    guidanceObjectiveType: 'collect_item',
    effects: [{ type: 'setFlag', flag: 'sl_quiet_hour_tape_found', flagValue: true }],
    choices: [
      {
        text: 'Слушать кассету у уха — одну секунду, пока несёшь',
        next: 'sl_quiet_hour_return',
        goldenPath: true,
        effects: [
          { type: 'addItem', itemId: 'lost_tape' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'setFlag', flag: 'sl_quiet_hour_tape_listened', flagValue: true },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
      {
        text: 'Не слушать — нести как есть, Тамара разберётся',
        next: 'sl_quiet_hour_return',
        effects: [
          { type: 'addItem', itemId: 'lost_tape' },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
    ],
  },

  sl_quiet_hour_return: {
    id: 'sl_quiet_hour_return',
    text: [
      'Тамара принимает вещи по одной, как принимают результаты анализов: очки — вздох, зонт — кивок, кассета — долгая пауза. «Очки отдам дочери владельца, она приезжает по субботам. Зонт — пусть постоит ещё: хозяйка прислала открытку, просила не отдавать никому, кроме неё самой. А кассета...»',
      'Она кладёт кассету на стойку между вами. «Его больше нет. Три года, как нет. Он приходил по средам, брал одну и ту же книгу и садился вон туда — где сейчас стойка возврата. Кассету оставил в последний раз, с этим „тихим часом“ на корпусе. Я не слушала. Не смогла. Ты — реши, что с ней делать. Тихий час кончается через двадцать минут, и потом она замолчит навсегда.»',
    ].join('\n'),
    speaker: 'Тамара',
    sceneId: 'library_day',
    contextNote: 'Тамара рассказала про владельца кассеты. Кассета на стойке — решать Володьке.',
    accessibilityAnnounce: 'Владельца кассеты нет три года. Тамара не смогла её слушать. Решать тебе.',
    guidanceHint: 'Реши судьбу кассеты: архив — или живое чтение.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_quiet_hour_items_returned', flagValue: true }],
    choices: [
      {
        text: 'Передать кассету уличному поэту — пусть голос живёт в чтениях',
        next: 'sl_quiet_hour_resolve',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_quiet_hour_choice_made', flagValue: true },
          { type: 'setFlag', flag: 'sl_quiet_hour_tape_to_poet', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'npcChange', npcId: 'street_poet', npcChange: { relation: 5 } },
          { type: 'showThought', thought: 'Архив хранит голос. Чтение — возвращает его в город. Он приходил по средам и читал одну и ту же книгу. Пусть теперь его читают — по средам, на площади, вслух.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Оставить кассету в архиве Тамары — храниться вечно, недоступно никому',
        next: 'sl_quiet_hour_resolve',
        effects: [
          { type: 'setFlag', flag: 'sl_quiet_hour_choice_made', flagValue: true },
          { type: 'setFlag', flag: 'sl_quiet_hour_tape_to_archive', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 4 } },
        ],
      },
    ],
  },

  sl_quiet_hour_resolve: {
    id: 'sl_quiet_hour_resolve',
    text: [
      'Двадцать минут истекают, и библиотека делает то, что делает всегда в конце тихого часа: выдыхает. Шёпот — если это был он — стихает, как стихает дождь, который кончился ещё в ноябре. Очки найдут дочь владельца. Зонт будет ждать свою «как-нибудь». Кассета... у кассеты теперь есть план.',
      'Тамара гасит лампу над читальным залом — не всю, только ту, что над столом у окна. «Приходи в следующий тихий час, — говорит она в темноту между стеллажами. — Их всегда три. Всегда разные. Всегда — чьи-то.»',
    ].join('\n'),
    speaker: 'Тамара',
    sceneId: 'library_day',
    contextNote: 'Тихий час истёк. Три вещи возвращены — у каждой своя дорога.',
    accessibilityAnnounce: 'Тихий час закончился. Все три вещи нашли свою дорогу.',
    guidanceHint: 'Квест закрыт. Выходи из библиотеки.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'removeItem', itemId: 'lost_reading_glasses' },
      { type: 'removeItem', itemId: 'lost_umbrella' },
      { type: 'removeItem', itemId: 'lost_tape' },
    ],
    choices: [
      {
        text: 'Выйти из библиотеки — вечер уже начался',
        next: 'library_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_quiet_hour_done', flagValue: true },
          { type: 'addXp', value: 130 },
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'empathy', value: 2 },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Остаться до закрытия — перечитать одну страницу у окна',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'sl_quiet_hour_done', flagValue: true },
          { type: 'addXp', value: 130 },
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 5 — «Голос из водостока» — Street poet, drain, final choice
     ═══════════════════════════════════════════════════════════════ */
  sl_drainpipe_start: {
    id: 'sl_drainpipe_start',
    text: [
      'Уличный поэт сидит на своём месте у фонтана, и сегодня он не читает — рассказывает. «Городские легенды я собираю, как твои сверстники — стикеры: по одной, бережно, в альбом. Одна не даёт мне спать. В мемориальном парке, у старого водостока, если бросить в решётку монету — из-под земли отвечает голос. Не эхо. Голос: старый диктор, обрывок стиха и тишина, которая слушает в ответ.»',
      'Он наклоняется ближе. «Я кинул монету двенадцать раз. Двенадцать раз — ответ. У меня три теории, и все три недостаточно безумные для этого города. Проверь, а? Легенда без свидетеля — просто шум. А эта... эта слишком честная, чтобы быть шумом.»',
    ].join('\n'),
    speaker: 'Уличный поэт',
    sceneId: 'city_square',
    contextNote: 'Уличный поэт рассказывает легенду о голосе из водостока в мемориальном парке.',
    accessibilityAnnounce: 'Поэт просит проверить легенду: голос из водостока отвечает на монету.',
    guidanceHint: 'Иди в мемориальный парк — найди скамейку старика и решётку.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Мемориальный парк',
    choices: [
      {
        text: 'Идти в парк — легенда сама себя не проверит',
        next: 'sl_drainpipe_oldman',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'sl_drainpipe_voice' },
          { type: 'setFlag', flag: 'sl_drainpipe_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'street_poet', npcChange: { relation: 3 } },
          { type: 'transitionScene', sceneId: 'park_day' },
        ],
      },
      {
        text: 'Спросить про три теории — хоть одну',
        next: 'sl_drainpipe_oldman',
        effects: [
          { type: 'triggerQuest', questId: 'sl_drainpipe_voice' },
          { type: 'setFlag', flag: 'sl_drainpipe_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'park_day' },
        ],
      },
      { text: 'Отойти к фонтану — городские легенды подождут', next: 'city_square_explore_mode' },
    ],
  },

  sl_drainpipe_oldman: {
    id: 'sl_drainpipe_oldman',
    text: [
      'Старик на скамье — тот самый, с лицом, помнящим этот парк ещё аллеей, а не мемориалом. Он видит монету в твоей руке раньше, чем ты успеваешь поздороваться. «К поэту ходил, — не спрашивает, констатирует. — Значит, за голосом. Ну, бросай. Только сначала послушай, чтобы потом не выдумывать: я эти монеты бросаю двадцать лет. Каждый четверг. Говорят, кормлю его. Правда — просто держу компанию.» Он смеётся, коротко и скрипуче, как калитка.',
      '«Теории у поэта есть, я слышал. Про трансляционную линию, про петлю эфира, про застрявшую запись. Всё не то. Я слышал голос до того, как они эту линию вообще проложили. И скажу тебе, парень: неважно, что там под решёткой. Важно, что оно отвечает. В этом городе уже давно никто ничего не отвечает — а оно отвечает.»',
    ].join('\n'),
    speaker: 'Старик на скамье',
    sceneId: 'park_day',
    contextNote: 'Старик на скамье двадцать лет бросает монеты в водосток — «держит компанию».',
    accessibilityAnnounce: 'Старик держит голосу компанию двадцать лет. Теории поэта — не то.',
    guidanceHint: 'Брось монету в решётку — послушай сам.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_drainpipe_oldman_met', flagValue: true }],
    choices: [
      {
        text: 'Бросить монету — и слушать',
        next: 'sl_drainpipe_listen',
        goldenPath: true,
        effects: [{ type: 'addStat', stat: 'stress', value: -2 }],
      },
      {
        text: 'Спросить, кем был диктор — голос ведь чей-то',
        next: 'sl_drainpipe_listen',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: '«Диктор? — старик пожал плечами. — В этом городе каждый второй когда-то был диктором. Каждый первый — стихами». И это была самая честная справка, какую мне выдавали за всё расследование.', thoughtDuration: 6000 },
        ],
      },
    ],
  },

  sl_drainpipe_listen: {
    id: 'sl_drainpipe_listen',
    text: [
      'Монета уходит в темноту решётки — три секунды тишины, долгих, как поворот головы. Потом из-под земли, из железа и воды, отвечает: «...осадков не ожидается, ветер северо-западный, три метра в секунду...» Голос старый, ламповый, с той самой интонацией областного радио, когда диктор точно знает, что его слушают трое — и дорожит каждым.',
      'Дальше — четверостишие. Домашнее, простое, про двор, про шины на проводах, про тех, кто рано встаёт. И потом — тишина. Но не пустая: она слушает в ответ. Так молчит собеседник, который ждёт твоей реплики. Ты стоишь над решёткой, и город на секунду становится разговором, в котором есть хотя бы двое.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Голос из водостока: старая сводка погоды, четверостишие и слушающая тишина.',
    accessibilityAnnounce: 'Голос ответил: сводка погоды, стих и тишина, которая слушает.',
    guidanceHint: 'Найди источник — подними решётку.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'sl_drainpipe_voice_heard', flagValue: true },
      { type: 'cameraShake', intensity: 0.01, duration: 1200 },
    ],
    choices: [
      {
        text: 'Слушать до конца — не двигаясь',
        next: 'sl_drainpipe_source',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'rhythm', value: 1 }],
      },
      {
        text: 'Записать на телефон — филофонист расследований',
        next: 'sl_drainpipe_source',
        effects: [{ type: 'addSkill', skill: 'coding', value: 1 }],
      },
    ],
  },

  sl_drainpipe_source: {
    id: 'sl_drainpipe_source',
    text: [
      'Решётка поддаётся — давно не заперта, просто тяжёлая. Внизу, в бетонном горле водостока, на кронштейне для кабеля висит громкоговоритель. Парковое радио, модель из тех, что вешали в аллеях, чтобы играть марш к открытию смены. Коробка питания рядом — батарейная, самодельная, свежие метки отвёртки на винтах. Кто-то обслуживает. Регулярно.',
      'Но внутри — не плёнка и не петля. Приёмник. Настроен на частоту, которой нет ни в одном реестре, — шкала уходит за крайние деления, туда, где по всем спецификациям уже не бывает ничего. Громкоговоритель просто честно усиливает то, что ловит: сводку, стих, тишину. Кто-то много лет назад повесил сюда колонку, чтобы мёртвая частота имела хотя бы один динамик в целом городе.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Под решёткой — громкоговоритель с приёмником на частоте вне реестров.',
    accessibilityAnnounce: 'Источник найден: колонка с приёмником на нереестровой частоте.',
    guidanceHint: 'Реши: сообщить о находке — или сохранить тайну.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'sl_drainpipe_source_found', flagValue: true }],
    choices: [
      {
        text: 'Разобраться в схеме — до конца, как инженер',
        next: 'sl_drainpipe_choice',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'showThought', thought: 'Схема собрана на совесть и на любовь: обмотка пропаяна дважды, контакты залиты воском. Воск — от церковной свечи. Инженеры так не делают. Так делают те, кто освящает технику, потому что не верит гарантии.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Не лезть в схему — есть вещи важнее устройства',
        next: 'sl_drainpipe_choice',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
    ],
  },

  sl_drainpipe_choice: {
    id: 'sl_drainpipe_choice',
    text: [
      'Ты сидишь на корточках у открытой решётки, и в руках у тебя — чужой секрет на ладони. Одна опция: рассказать. Катя из Сети найдёт частоту, поставит её на учёт, задокументирует «явление городского эфира» — по-настоящему, с приборами. Голос будет сохранён навечно и, возможно, размножен на все приёмники района. Легенда станет записью. Записи не умирают — но и не шепчут.',
      'Вторая опция: закрыть решётку и уйти. Старик продолжит бросать монеты по четвергам, поэт — не спать по ночам, а голос — отвечать тем немногим, кто догадается спросить. Город сотрёт эту частоту рано или поздно — он всё стирает. Но пока не стёр — она будет единственным местом в Уфе, где город отвечает на монету.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Выбор: задокументировать частоту для Сети — или оставить голос легендой.',
    accessibilityAnnounce: 'Финальный выбор: сообщить о находке или сохранить тайну.',
    guidanceHint: 'Выбери судьбу голоса — это и есть легенда.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Сообщить Кате — частоту задокументируют и сохранят навечно',
        next: 'sl_drainpipe_resolve',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_drainpipe_resolved', flagValue: true },
          { type: 'setFlag', flag: 'sl_drainpipe_reported', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addXp', value: 150 },
          { type: 'npcChange', npcId: 'radio_operator_katya', npcChange: { relation: 5 } },
          { type: 'npcChange', npcId: 'street_poet', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Промолчать — пусть голос остаётся легендой, а не записью',
        next: 'sl_drainpipe_resolve',
        effects: [
          { type: 'setFlag', flag: 'sl_drainpipe_resolved', flagValue: true },
          { type: 'setFlag', flag: 'sl_drainpipe_secret_kept', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addXp', value: 150 },
          { type: 'npcChange', npcId: 'street_poet', npcChange: { relation: 5 } },
          { type: 'npcChange', npcId: 'park_old_man', npcChange: { relation: 8 } },
          { type: 'showThought', thought: 'Я закрою решётку и никому не скажу. Не потому, что жадный. Потому что в городе, где всё записано, единственная честная вещь — та, которую не записали. Пусть отвечает тем, кто спросит сам.', thoughtDuration: 6000 },
        ],
      },
    ],
  },

  sl_drainpipe_resolve: {
    id: 'sl_drainpipe_resolve',
    text: [
      'Решётка ложится на место с ровным чугунным ударом — как точка в конце длинного предложения. Старик на скамье смотрит на тебя и не спрашивает ничего: по глазам, наверное, видно — спрашивать не надо. «Ну вот, — говорит он и достаёт из кармана следующую монету. — Четверг завтра. Приходи, если будешь рядом. Только монету бросай мелкую. Крупную он не любит — думает, что его покупают.»',
      'Ты идёшь к выходу из парка мимо мемориального камня с гравировкой «Тем, кто стал данным. Тем, кто забыл своё имя». Здесь, в парке, даже смартфоны теряют сигнал — и, может, поэтому именно здесь остался единственный голос, который не помнит своего имени, но помнит, как отвечать. Уличные легенды не живут в реестрах. Они живут, пока есть кто-то, кто спросил.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'park_day',
    contextNote: 'Решётка закрыта. Парк провожает Володьку к выходу.',
    accessibilityAnnounce: 'Голос останется при своей тайне. Легенда закрыта.',
    guidanceHint: 'Квест закрыт. Вернись к поэту на площадь — или останься в парке.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Вернуться к поэту на площадь — у легенды появился свидетель',
        next: 'city_square_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'sl_drainpipe_done', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
          { type: 'addStat', stat: 'stress', value: -4 },
          { type: 'transitionScene', sceneId: 'city_square' },
        ],
      },
      {
        text: 'Остаться в парке — посидеть на «депрекейтед» скамейке',
        next: 'park_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'sl_drainpipe_done', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -6 },
          { type: 'showThought', thought: 'Стихи здесь звучат не громче — честнее. Кажется, я наконец понимаю, почему именно тут. Парк днём — единственное место, где Паноптикум теряет фокус: слишком много листьев, теней и случайных звуков, не похожих на данные. И один голос, похожий на все сразу.', thoughtDuration: 6000 },
        ],
      },
    ],
  },
};
