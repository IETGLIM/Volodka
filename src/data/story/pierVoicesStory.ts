import type { StoryNode } from '@/shared/types/game';

/**
 * «Голоса Пирса» — story nodes for the 5 side quests defined in
 * `pierVoicesQuests.ts` (Акт 2 → Акт 4), v4.8.0.
 *
 * Created as a NEW file so existing story packs remain untouched. Every id
 * referenced by `linkedStoryNodeId` on the 5 quests resolves here; the pack
 * merges in `buildStoryNodes()` and registers as the `pierVoices` satellite
 * in `narrativePackRegistry.ts`.
 *
 * Tone — post-Soviet cyberpunk, melancholic but hopeful, river-noir.
 * Russian language, conversational. Poems are SACRED (`src/data/poems.ts`)
 * and are never rewritten here.
 *
 * Recurring numerology of the pack: девятнадцатое число, три голоса реки,
 * тридцать лет ожидания, жестиевая коробка из-под чая.
 */
export const PIER_VOICES_STORY_NODES: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════
     АКТ 2 — «Радиограмма для Зины» — tin box, ferry vs bridge
     ═══════════════════════════════════════════════════════════════ */
  pv_zina_box_start: {
    id: 'pv_zina_box_start',
    text: [
      'Баба Зина вытирает руки о фартук и достаёт из-под прилавка жестяную коробку из-под индийского чая. Печатная этикетка выцвела до состояния «намёк». Внутри что-то тихо перекатывается — тяжёлое, будто подшипник.',
      '«Марине отнеси. Дом за мостом, у самой воды, ставни синие. Она теперь там живёт, одна. Коробку отдай И скажешь: окончание на "е", не на "я". Она поймёт. Не спрашивай, что внутри — не скажу. Не потому что тайна. Потому что не помню. Но помню, что важно.»',
    ].join('\n'),
    speaker: 'Баба Зина',
    sceneId: 'city_square',
    contextNote: 'Баба Зина в «Заре-М» протягивает жестяную коробку с поручением для Марины.',
    accessibilityAnnounce: 'Баба Зина просит отнести коробку Марине, в дом за мостом.',
    guidanceHint: 'Возьми коробку и доберись до дома Марины за мостом.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Взять коробку — паромом утром успею',
        next: 'pv_zina_box_ferry',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'pv_zina_tin_box' },
          { type: 'setFlag', flag: 'pv_zina_box_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 3 } },
          { type: 'transitionScene', sceneId: 'river_pier' },
        ],
      },
      {
        text: 'Взять — но спросить про окончание ещё раз',
        next: 'pv_zina_box_ferry',
        effects: [
          { type: 'triggerQuest', questId: 'pv_zina_tin_box' },
          { type: 'setFlag', flag: 'pv_zina_box_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'river_pier' },
        ],
      },
      { text: 'Не сейчас — у меня своих дел хватает', next: 'city_square_explore_mode' },
    ],
  },

  pv_zina_box_ferry: {
    id: 'pv_zina_box_ferry',
    text: [
      'Пирс дышит речной сыростью. Паром — ржавая платформа с будкой — стоит на приколе: ходит только до десяти утра. Буксир за ним лениво гудит, подрабатывая прожектором по воде.',
      'Коробка в кармане оттягивает куртку. До дома Марины — два пути: паромом по воде, если успеваешь, или в обход, через мост, полгорода пешком. Мост дольше. Вода — надёжнее.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Пирс. Паром на приколе, до дома Марины — водой или в обход через мост.',
    accessibilityAnnounce: 'Выбор: паром по воде или обходной мост.',
    guidanceHint: 'Доберись до дома Марины любым путём.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Паромом — по воде, пока ходит',
        next: 'pv_zina_box_deliver',
        goldenPath: true,
        condition: { maxTimeOfDay: 10 },
        effects: [
          { type: 'setFlag', flag: 'pv_used_ferry', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Вода под паромом — цвета остывшего чая. Коробка в кармане стучит в такт волнам. Хорошо, что не спросил, что внутри: теперь дорога — как миниатюра чужой тайны.', thoughtDuration: 5000 },
          { type: 'transitionScene', sceneId: 'river_pier' },
        ],
      },
      {
        text: 'Через мост — верным путём, пешком',
        next: 'pv_zina_box_deliver',
        effects: [
          { type: 'setFlag', flag: 'pv_used_bridge', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'transitionScene', sceneId: 'river_pier' },
        ],
      },
    ],
  },

  pv_zina_box_deliver: {
    id: 'pv_zina_box_deliver',
    text: [
      'Синие ставни, дом у самой воды, огород из бочек. Марина — женщина с усталым лицом человека, который давно перестал ждать чудес и начал ждать только погоды — долго смотрит на коробку, прежде чем взять.',
      '«Окончание на "е"», — говоришь ты. Она кивает — медленно, как будто каждый кивок стоит ей года. Открывает. Внутри — латунный медальон на потёртой цепочке. Она подносит его к свету и впервые за всё время улыбается: «Зинка. Всё-таки помнит.»',
    ].join('\n'),
    speaker: 'Марина',
    sceneId: 'river_pier',
    contextNote: 'Марина открывает коробку: внутри латунный медальон.',
    accessibilityAnnounce: 'Марина получила коробку с медальоном.',
    guidanceHint: 'Поручение выполнено.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_zina_box_delivered', flagValue: true },
      { type: 'npcChange', npcId: 'marina', npcChange: { relation: 8 } },
      { type: 'addKarma', value: 3 },
    ],
    choices: [
      {
        text: 'Не спрашивать — попрощаться тихо',
        next: 'pier_evening_explore_mode',
        effects: [{ type: 'addKarma', value: 2 }],
      },
      {
        text: 'Спросить, что это было',
        next: 'pv_zina_box_afterword',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
    ],
  },

  pv_zina_box_afterword: {
    id: 'pv_zina_box_afterword',
    text: [
      '«Тридцать лет назад мы с Зиной были не разлей вода. Потом — слово из четырёх букв, окончание на "я", я уехала за мост, она осталась. И слово это — неправильное. А правильное — с "е" на конце. Она мне его в коробке и прислала. Тридцать лет оно ехало, Володька. Дожило.»',
      'Медальон она зажимает в кулаке, как жучок связи. «Скажи ей… нет. Не говори ничего. Она поймёт, что ты донёс — по моему лицу, когда в следующий раз через мост приду. Сама приду.»',
    ].join('\n'),
    speaker: 'Марина',
    sceneId: 'river_pier',
    contextNote: 'Марина объясняет, что коробка — примирение тридцатилетней давности.',
    accessibilityAnnounce: 'Коробка — это извинение, которое ехало тридцать лет.',
    guidanceHint: 'Возвращайся к своим делам.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_zina_box_story_known', flagValue: true },
      { type: 'showThought', thought: 'Слова тоже имеют право на доставку. Просто у них срок — подольше.', thoughtDuration: 4500 },
    ],
    choices: [{ text: 'Идти своей дорогой', next: 'pier_evening_explore_mode' }],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 2 — «Три голоса реки» — Trofim's tape recorder
     ═══════════════════════════════════════════════════════════════ */
  pv_three_voices_start: {
    id: 'pv_three_voices_start',
    text: [
      'Трофим чинит ленточный магнитофон прямо на перилах пирса — «Маяк-203», доперестроечный, с катушками больше его кулака. Рядом на верёвке сохнут три пустые бобины.',
      '«Реку записать хочу. Пока её не "облагородили" до бетонного лотка с вентиляцией. Три голоса нужно. Первый: причал на рассвете скрипит — знаешь, как старик со спиной? Второй: буксир ночной гудит — ниже, чем кажется. Третий — Ритка. Она поёт так, что датчики гильдии сбиваются с ритма, честное слово. Поможешь? Я — у записи, ты — у ноги. То есть наоборот.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим с ленточным магнитофоном «Маяк-203» на пирсе.',
    accessibilityAnnounce: 'Трофим просит помочь записать три голоса реки.',
    guidanceHint: 'Рассвет на причале → ночной гудок → Ритка.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Согласиться — река заслуживает пластинку',
        next: 'pv_three_voices_dawn',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'pv_three_voices' },
          { type: 'setFlag', flag: 'pv_three_voices_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, зачем старику лента с рекой',
        next: 'pv_three_voices_why',
        effects: [
          { type: 'triggerQuest', questId: 'pv_three_voices' },
          { type: 'setFlag', flag: 'pv_three_voices_accepted', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  pv_three_voices_why: {
    id: 'pv_three_voices_why',
    text: [
      '«Затем, что помню её другой. С камышом, с чайками, с рыбой, которая клюёт не потому что голодная, а из принципа. Гильдия речной фарватер уже перечертила — под логистику. Через год тут будет ровная вода, как в отчёте: без звука, без скрипа, без Ритки. А на ленте — останется. Лента, Володька, — единственный носитель, который гильдия ещё не умеет переписывать.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим объясняет, зачем записывает реку.',
    accessibilityAnnounce: 'Трофим записывает реку до её «облагораживания».',
    guidanceHint: 'Начни с рассвета на причале.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'К рассвету, так к рассвету',
        next: 'pv_three_voices_dawn',
        goldenPath: true,
        effects: [{ type: 'addKarma', value: 2 }],
      },
    ],
  },

  pv_three_voices_dawn: {
    id: 'pv_three_voices_dawn',
    text: [
      'Пять утра. Причал скрипит именно так, как обещал Трофим: со вкусом, с апломбом, как старик, у которого спина болит, но характер цел. Лента идёт, катушки вращаются, роса на перилах дрожит в такт.',
      'Ты стоишь на часах, пока Трофим держит микрофон над водой. Река просыпается медленно: сначала вода, потом ветер, потом — чайка, наглая, как счёт за коммуналку.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Рассвет. Трофим записывает скрип причала.',
    accessibilityAnnounce: 'Запись скрипа причала на рассвете идёт.',
    guidanceHint: 'Дождись ночи для гудка буксира.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_recorded_dawn_creak', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
    choices: [
      {
        text: 'Ждать ночи — гудок сам себя не запишет',
        next: 'pv_three_voices_night',
        goldenPath: true,
        effects: [{ type: 'setFlag', flag: 'pv_dawn_done', flagValue: true }],
      },
    ],
  },

  pv_three_voices_night: {
    id: 'pv_three_voices_night',
    text: [
      'Ночь. Буксир выходит из-за поворота — огни, вода, гудок. Он ниже, чем кажется: чувствуется не ушами, а рёбрами. Трофим ловит его на ленту и шепчет: «Есть. Второй голос реки — принят.»',
      'Остаётся третий — Ритка. Она на пирсе, перебирает струны и делает вид, что это не она тут недавно пела так, что дроны зависали.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'pier_evening',
    contextNote: 'Ночь. Гудок буксира записан. Осталась Ритка.',
    accessibilityAnnounce: 'Гудок записан. Иди к Ритке.',
    guidanceHint: 'Поговори с Риткой на пирсе.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_recorded_tug_horn', flagValue: true },
      { type: 'addSkill', skill: 'logic', value: 1 },
    ],
    choices: [
      {
        text: 'К Ритке — уговорить спеть для ленты',
        next: 'pv_three_voices_ritka',
        goldenPath: true,
        effects: [],
      },
    ],
  },

  pv_three_voices_ritka: {
    id: 'pv_three_voices_ritka',
    text: [
      'Ритка долго смотрит на магнитофон, потом на Трофима, потом на тебя. «Для ленты? Для реки? Хорошо. Но у меня условие: когда её облагородят и всё тут заткнётся — вы эту плёнку включите. Пусть бетон знает, чего он лишился.»',
      'Она поёт. Ты не понимаешь слов — их там нет, есть только звуки, от которых у пирса на секунду перестаёт скрипеть. Трофим плачет и делает вид, что это конденсат. Лента идёт.',
    ].join('\n'),
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    contextNote: 'Ритка поёт для записи. Третий голос реки — на ленте.',
    accessibilityAnnounce: 'Ритка записала свою песню для реки.',
    guidanceHint: 'Все три голоса записаны — возвращайся к Трофиму.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_ritka_recorded', flagValue: true },
      { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 5 } },
      { type: 'showThought', thought: 'Река теперь существует в двух местах: здесь и на плёнке. Одно из этих мест не отнять.', thoughtDuration: 5000 },
    ],
    choices: [
      {
        text: 'Лента полная — отдать Трофиму',
        next: 'pier_evening_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'pv_three_voices_done', flagValue: true },
          { type: 'addKarma', value: 5 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «То, что гильдия утопила» — drowned server
     ═══════════════════════════════════════════════════════════════ */
  pv_drowned_server_start: {
    id: 'pv_drowned_server_start',
    text: [
      'Марат-эхо живёт в отражениях воды: сегодня он — рябь у третьей сваи. «Володька. Три года назад гильдия "утилизировала" серверный блок. Утилизировала — это они так говорят. В реку бросила, Володька. А блок — с разумами. Не выключенными. Они спят, но им холодно и темно, и от этого им снятся плохие сны, а от снов — утечка, а от утечки — крипы речные завелись. Разберись, а? У эха рук нет. У тебя — есть.»',
      'Он показывает (отражением, конечно) место: у затопленной баржи, глубина по пояс. «Крипы — не злые. Они — как бородавки на утечке. Уберёшь блок — уйдут сами. Ну… почти сами.»',
    ].join('\n'),
    speaker: 'Марат (эхо)',
    sceneId: 'river_pier',
    contextNote: 'Марат-эхо просит поднять затопленный серверный блок гильдии.',
    accessibilityAnnounce: 'Марат просит поднять серверный блок со дна реки у баржи.',
    guidanceHint: 'Зачисти речных крипов у затопленной баржи, затем подними блок.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Иду к барже — разберусь с крипами',
        next: 'pv_drowned_server_fight',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'pv_drowned_server' },
          { type: 'setFlag', flag: 'pv_drowned_server_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'marat_echo', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Спросить, почему он сам не разбудил разумы',
        next: 'pv_drowned_server_why',
        effects: [
          { type: 'triggerQuest', questId: 'pv_drowned_server' },
          { type: 'setFlag', flag: 'pv_drowned_server_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  pv_drowned_server_why: {
    id: 'pv_drowned_server_why',
    text: [
      '«Потому что эхо — это голос, Володька, а не руки. Я могу кричать сколько угодно, но разумы под водой спят крепко: их будить надо током, а током — это к тебе. Ты разберись с крипами — они от утечки, не от злобы. Блок поднимешь — утечка кончится, крипы разбегутся, а я уже разбужу: я умею громко.»',
    ].join('\n'),
    speaker: 'Марат (эхо)',
    sceneId: 'river_pier',
    contextNote: 'Марат объясняет, почему не может поднять блок сам.',
    accessibilityAnnounce: 'Эхо — голос без рук: поднимать блок придётся игроку.',
    guidanceHint: 'К барже.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Понял. К барже.',
        next: 'pv_drowned_server_fight',
        goldenPath: true,
        effects: [],
      },
    ],
  },

  pv_drowned_server_fight: {
    id: 'pv_drowned_server_fight',
    text: [
      'Затопленная баржа — рёбра ржавого киля над водой. Вокруг — крипы: медленные, разбухшие, с речным мусором в панцирях. Они шипят не на тебя, а на утечку — она им снится, как и разумам в блоке.',
      'Двое заметили тебя. Один — крупнее, с водорослями вместо боевого знака. Ну что ж: разбудим реку по-настоящему.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Речные крипы у затопленной баржи: двое атакуют.',
    accessibilityAnnounce: 'Бой с речными крипами у баржи.',
    guidanceHint: 'Победи крипов, затем подними блок.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_river_creeps_fought', flagValue: true },
    ],
    choices: [
      {
        text: 'В бой',
        next: 'pv_drowned_server_raise',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'pv_river_creeps_cleared', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  pv_drowned_server_raise: {
    id: 'pv_drowned_server_raise',
    text: [
      'Крипы уходят по воде, как будто их выключили: утечка без блока — просто вода. Сам блок — тяжёлый, холодный, с лампочкой, которая мигает под плёнкой водорослей. Медленно. Три долгих. Девять коротких.',
      'Ты поднимаешь его на пирс. Марат-эхо собирается в человека — насколько отражение может быть человеком. «Спасибо. Разбужу. Скажу им: река — нормальное место для сна, но не для жизни.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Серверный блок поднят на пирс; Марат будит спящие разумы.',
    accessibilityAnnounce: 'Блок поднят, Марат будит разумы.',
    guidanceHint: 'Задача выполнена.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_server_block_raised', flagValue: true },
      { type: 'npcChange', npcId: 'marat_echo', npcChange: { relation: 6 } },
      { type: 'addKarma', value: 4 },
      { type: 'showThought', thought: 'Иногда "утилизировано" — это просто "спрятано". Хорошо, что реки умеют хранить секреты. Плохо, что им приходится.', thoughtDuration: 5000 },
    ],
    choices: [
      { text: 'Вернуться к делам', next: 'pier_evening_explore_mode' },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Ожидание на причале» — Marina, 19th of every month
     ═══════════════════════════════════════════════════════════════ */
  pv_waiting_start: {
    id: 'pv_waiting_start',
    text: [
      'Ритка перебирает струны и рассказывает между аккордами: «Марина-а-а. Из дома за мостом. Она каждое девятнадцатое число на причале сидит. Час ровно, минута в минуту. Потом уходит. Тридцать лет уже, Володька. Ни писем, ни встреч — сидит и уходит. Я как-то спросила: "Кого ждёшь?" Она говорит: "Никого. Место жду." Место, представляешь?»',
      '«Проверь, а? Мне — неудобно: я пою, я не спрашиваю. А ты — ты городской, тебе можно.»',
    ].join('\n'),
    speaker: 'Ритка',
    sceneId: 'pier_evening',
    contextNote: 'Ритка рассказывает про Марину, которая 30 лет приходит на причал 19-го числа.',
    accessibilityAnnounce: 'Ритка просит узнать, кого или чего ждёт Марина.',
    guidanceHint: 'Понаблюдай за Мариной на причале 19-го числа.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Понаблюдаю — издалека, как положено',
        next: 'pv_waiting_watch',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'pv_waiting_on_pier' },
          { type: 'setFlag', flag: 'pv_waiting_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'chk_ritka', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, почему Ритка сама не посмотрела',
        next: 'pv_waiting_watch',
        effects: [
          { type: 'triggerQuest', questId: 'pv_waiting_on_pier' },
          { type: 'setFlag', flag: 'pv_waiting_accepted', flagValue: true },
          { type: 'addSkill', skill: 'persuasion', value: 1 },
        ],
      },
    ],
  },

  pv_waiting_watch: {
    id: 'pv_waiting_watch',
    text: [
      'Девятнадцатое. Марина приходит ровно в семь, садится на крайнюю скамью, кладёт руки на колени — и смотрит на воду. Не на паром, не на буксир, не на тот берег — на воду. Ровно час. Потом встаёт и уходит, не оглянувшись.',
      'Ты замечаешь: она держит что-то в кулаке. Маленькое, металлическое. Блеснёт и спрячется. Потом вспоминаешь: дом за мостом, синие ставни. Там, говорят, старый комод, который она никому не открывает.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Наблюдение за Мариной: держит в кулаке что-то металлическое.',
    accessibilityAnnounce: 'Марина держит в руке маленький металлический предмет.',
    guidanceHint: 'Осмотри её дом — старый комод не открывается просто так.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_watched_marina', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
    choices: [
      {
        text: 'Дом за мостом. Комод. Надо посмотреть',
        next: 'pv_waiting_ticket',
        goldenPath: true,
        effects: [],
      },
    ],
  },

  pv_waiting_ticket: {
    id: 'pv_waiting_ticket',
    text: [
      'Комод — старый, с ключом в замке (не заперт: просто некому запирать). Внутри, под платками — жестяная коробка из-под чая. У тебя мороз по коже: та самая этикетка. Внутри — паромный билет. Девятнадцатое число, тридцатилетней давности. И латунный медальон — второй, зеркальный первому.',
      'Ты почти слышишь, как в голове щёлкает: она не «никого» ждёт. Она ждёт знак, что тот, на том берегу, всё ещё помнит окончание. На "е".',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'В комоде Марины — старый паромный билет и второй медальон.',
    accessibilityAnnounce: 'Найден билет и второй медальон: Марина ждёт знак с того берега.',
    guidanceHint: 'Развязка близко.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_found_ferry_ticket', flagValue: true },
      { type: 'addSkill', skill: 'logic', value: 1 },
      { type: 'showThought', thought: 'Иногда ждут не человека. Ждут доказательства, что человек был. Тридцать лет доказательства. Двумя медальонами.', thoughtDuration: 5500 },
    ],
    choices: [
      {
        text: 'Скажешь Марине при встрече: она на правильном берегу',
        next: 'pier_evening_explore_mode',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'marina', npcChange: { relation: 5 } },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Четвёртый голос» — the tape, final choice
     ═══════════════════════════════════════════════════════════════ */
  pv_fourth_voice_start: {
    id: 'pv_fourth_voice_start',
    text: [
      'Трофим встречает тебя с лентой в руках — четвёртая бобина, которую никто не просил. «Перемотал на ночь — проверить плотность записи. А там — голос. Не Риткин, не гудок, не скрип. Разговор. Старый, лет тридцать, не меньше. Кто-то признаётся в чём-то… тяжёлом. Я дослушал до конца, Володька, и теперь не сплю. Это — чужая тайна, которая сама записалась на мою ленту.»',
      '«Гильдия за такое платит: им нужны архивы. Сеть — обнародует: у них принцип. А можно найти того, чей это голос, и отдать ему. Лента одна, Володька. Ты уже слышал всех этих людей. Тебе и решать.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'river_pier',
    contextNote: 'Трофим с четвёртой бобиной: запись чужого старого признания.',
    accessibilityAnnounce: 'На ленте — чужая тридцатилетняя тайна. Решить судьбу записи.',
    guidanceHint: 'Выслушай все три стороны, затем реши.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Выслушаю всех — потом решу',
        next: 'pv_fourth_voice_sides',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'pv_fourth_voice' },
          { type: 'setFlag', flag: 'pv_fourth_voice_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
        ],
      },
    ],
  },

  pv_fourth_voice_sides: {
    id: 'pv_fourth_voice_sides',
    text: [
      'Гильдия (через посредника с уклоном в кожаный плащ): «Архивная ценность. 150 кредитов, никаких вопросов, лента едет в хранилище». Сеть (голос в наушниках, с помехами): «Обнародуй. Тайны, которым тридцать лет, — не тайны, а раны. Раны на воздухе заживают». И третий голос — ты сам вспомнил его по тембру: Марат-эхо. Он узнал говорящего. Он не скажет, кто это. Но сказал: «Он до сих пор на пирсе бывает. Каждое девятнадцатое.»',
      'Всё сходится, и от этого не легче. Лента в кармане — тихая, тяжёлая, как жестяная коробка из-под чая.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'river_pier',
    contextNote: 'Три стороны выслушаны: гильдия платит, сеть обнародует, владелец — здесь.',
    accessibilityAnnounce: 'Три стороны выслушаны.',
    guidanceHint: 'Финальный выбор: продать, обнародовать или вернуть владельцу.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'pv_heard_all_sides', flagValue: true },
      { type: 'addSkill', skill: 'persuasion', value: 1 },
    ],
    choices: [
      {
        text: 'Продать гильдии — тайна в хранилище надёжнее, чем в реке',
        next: 'pier_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pv_fourth_voice_resolved', flagValue: true },
          { type: 'setFlag', flag: 'pv_fourth_voice_sold', flagValue: true },
          { type: 'addCredits', value: 150 },
          { type: 'addKarma', value: -3 },
        ],
      },
      {
        text: 'Отдать Сети — пусть рана заживёт на воздухе',
        next: 'pier_evening_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'pv_fourth_voice_resolved', flagValue: true },
          { type: 'setFlag', flag: 'pv_fourth_voice_published', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'marat_echo', npcChange: { relation: -4 } },
        ],
      },
      {
        text: 'Вернуть владельцу — девятнадцатое число, крайняя скамья',
        next: 'pv_fourth_voice_return',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'pv_fourth_voice_resolved', flagValue: true },
          { type: 'setFlag', flag: 'pv_fourth_voice_returned', flagValue: true },
          { type: 'addKarma', value: 6 },
        ],
      },
    ],
  },

  pv_fourth_voice_return: {
    id: 'pv_fourth_voice_return',
    text: [
      'Девятнадцатое. Крайняя скамья. Марина берёт ленту обеими руками, как берут не вещь, а итогам целой жизни. «Тридцать лет я ждала, что он скажет это сам. Не сказал. Теперь — сказала река.»',
      'Она смотрит на воду долго. Потом: «Спасибо, Володька. Иди. Мне надо кое-что дослушать.» Ты уходишь. За спиной — тишина, в которой наконец-то нет ожидания.',
    ].join('\n'),
    speaker: 'Марина',
    sceneId: 'river_pier',
    contextNote: 'Лента возвращена владелице — Марине. Ожидание закрыто.',
    accessibilityAnnounce: 'Лента возвращена Марине. Тридцатилетнее ожидание завершено.',
    guidanceHint: 'Линия «Голосов Пирса» завершена.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'npcChange', npcId: 'marina', npcChange: { relation: 10 } },
      { type: 'showThought', thought: 'Три голоса реки записали для памяти. Четвёртый — стёрли для милосердия. Иногда правильный архив — это пустая катушка.', thoughtDuration: 6000 },
    ],
    choices: [
      { text: 'Идти — река теперь просто река', next: 'pier_evening_explore_mode' },
    ],
  },
};
