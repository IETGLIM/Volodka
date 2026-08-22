import type { StoryNode } from '@/shared/types/game';

/**
 * AAA-6 — Story nodes for the 8 stub quests defined in `aaaExpansionQuests.ts`.
 *
 * Created as a NEW file (AAA-6) so existing story packs remain untouched.
 * Resolves the 46 `[QuestTracker] [ERROR] quest ... linkedStoryNodeId(s)
 * contains unknown "aaa_*"` warnings emitted by `contentPipelineValidator`
 * on dev boot — every id referenced by `linkedStoryNodeId` and
 * `linkedStoryNodeIds` on the 8 AAA quests now resolves in the registry.
 *
 * Tone — post-Soviet cyberpunk, Matrix-referential, melancholic but hopeful.
 * Disco Elysium-style inner monologue. Russian language, conversational.
 * Each node: id, speaker (display name | 'narrator' | 'volodka'),
 * 1–4 paragraphs of text, 2–4 choices with effects. Prose only — poems are
 * SACRED (`src/data/poems.ts`); this file references poem IDs but never
 * rewrites their text.
 *
 * Recurring numerology used throughout: 47 (poet count), 4729 (root access
 * checksum), B-12 (archive index), 03:47 (silent hour), −30°C (winter core).
 */
export const AAA_EXPANSION_STORY_NODES: Record<string, StoryNode> = {
  /* ═══════════════════════════════════════════════════════════════
     АКТ 2 — «Пропавший дневник» — Maria, lost poet's diary
     ═══════════════════════════════════════════════════════════════ */
  aaa_maria_lost_diary_start: {
    id: 'aaa_maria_lost_diary_start',
    text: [
      'Мария закрывает чашку ладонью, как будто кофе может услышать. «Был один. Из тех, кто пишет в тетрадь, а не в тикет. Последний раз его видели на ночном дежурстве — 03:47, как раз когда сервер гильдии чистит логи. Утром его карточка была deactivated, тетрадь — в ящике. Ящик закрыли. Не опечатали — просто забыли.»',
      'Она не смотрит в глаза. «Я не прошу тебя взламывать. Я прошу — вспомнить. Дневник не удалён, потому что гильдия не умеет удалять то, что не размечено. Он там. Просто лежит.»',
    ].join('\n'),
    speaker: 'Мария',
    sceneId: 'cafe_evening',
    contextNote: 'Мария говорит о пропавшем поэте и его тетради в ящике стола.',
    accessibilityAnnounce: 'Мария просит найти дневник пропавшего поэта в офисе гильдии.',
    guidanceHint: 'Иди в офис гильдии — найди ящик стола на ночном дежурстве.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Офис',
    choices: [
      {
        text: 'Согласиться — я найду тетрадь',
        next: 'aaa_maria_lost_diary_office',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_maria_lost_diary' },
          { type: 'setFlag', flag: 'aaa_lost_diary_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 3 } },
          { type: 'transitionScene', sceneId: 'office_day' },
        ],
      },
      {
        text: 'Спросить, почему она сама не пришла за тетрадью',
        next: 'aaa_maria_lost_diary_office',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_maria_lost_diary' },
          { type: 'setFlag', flag: 'aaa_lost_diary_accepted', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'transitionScene', sceneId: 'office_day' },
        ],
      },
      { text: 'Отойти в зал — слишком личное', next: 'cafe_explore_mode' },
    ],
  },

  aaa_maria_lost_diary_office: {
    id: 'aaa_maria_lost_diary_office',
    text: [
      'Офис пустой в том особом смысле, какой бывает только там, где кто-то пропал без бумажного следа. Монитор на ночном дежурстве ещё тёплый — экран погас три недели назад, а пластик держит тепло чужого присутствия, как якорь, который никто не поднял.',
      'На столе — кружка с остатками кофе, высохшая по кругу, как годовое кольцо. Ящик заперт на пароль из четырёх цифр. Ты знаешь эти четыре цифры до того, как посмотришь на монитор: 03:47. Час, когда логи чистят. Час, когда поэт исчез.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Офис гильдии — рабочее место пропавшего поэта.',
    accessibilityAnnounce: 'Офис пуст. Ящик стола заперт на четырёхзначный пароль.',
    guidanceHint: 'Вскрой ящик стола — там дневник.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_lost_diary_office_visited', flagValue: true }],
    choices: [
      {
        text: 'Ввести 03:47 — час, когда исчезли логи',
        next: 'aaa_maria_lost_diary_found',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'aaa_lost_diary_desk_opened', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Пароль — это всегда час. Гильдия думает, что пароль — это данные. Поэт знал, что пароль — это память.', thoughtDuration: 5000 },
        ],
      },
      {
        text: 'Перепаять замок — технический путь',
        next: 'aaa_maria_lost_diary_found',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 10 } },
        effects: [
          { type: 'setFlag', flag: 'aaa_lost_diary_desk_opened', flagValue: true },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
      { text: 'Отойти от стола — я ещё не готов', next: 'office_explore_mode' },
    ],
  },

  aaa_maria_lost_diary_found: {
    id: 'aaa_maria_lost_diary_found',
    text: [
      'Тетрадь в чёрном кожаном переплёте, как у тех, что выдавали в инженерном училище. На обороте — надпись простым карандашом: «Если нашли — не сдавайте в архив. Архив — это кладбище. Сдайте Марии. Она помнит.»',
      'Внутри — строки, которых нет ни в одном реестре гильдии. Не стихи — заметки ночных дежурств: «03:47 — лог чистый. 03:48 — в логе чужая строка. 04:00 — строка исчезла. Кто-то пишет вместе со мной.» Последняя запись — номер: 47. Сорок седьмое дежурство. Сорок седьмое стихотворение, которого никогда не было.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'office_day',
    contextNote: 'Дневник найден. На обороте — просьба передать Марии.',
    accessibilityAnnounce: 'Дневник в руках. Последняя запись — номер 47.',
    guidanceHint: 'Отнеси тетрадь Марии в кафе.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceSceneLabel: 'Кафе',
    effects: [
      { type: 'addItem', itemId: 'old_poetry_book' },
      { type: 'setFlag', flag: 'aaa_lost_diary_in_hand', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
    ],
    choices: [
      {
        text: 'Вернуться к Марии — она ждала',
        next: 'aaa_maria_lost_diary_return',
        goldenPath: true,
        effects: [
          { type: 'transitionScene', sceneId: 'cafe_evening' },
        ],
      },
      {
        text: 'Прочитать ещё одну страницу — не могу не прочитать',
        next: 'aaa_maria_lost_diary_return',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'transitionScene', sceneId: 'cafe_evening' },
        ],
      },
    ],
  },

  aaa_maria_lost_diary_return: {
    id: 'aaa_maria_lost_diary_return',
    text: [
      'Мария берёт тетрадь обеими руками — как берут ребёнка, которого долго не видели. «Он не умер. Я знаю. Я видела его запись в логе через неделю после того, как его списали. 03:47 — та же строка. Он пишет изнутри сервера. Он стал тем, что гильдия не умеет удалить.»',
      'Она закрывает тетрадь. «Спасибо. Ты не нашёл дневник поэта. Ты нашёл — что поэт всё ещё где-то пишет. Этого гильдия не простит. Но этого — не стереть.»',
    ].join('\n'),
    speaker: 'Мария',
    sceneId: 'cafe_evening',
    contextNote: 'Мария принимает тетрадь и говорит о поэте, ставшем стихом в сервере.',
    accessibilityAnnounce: 'Мария получила дневник. Поэт, по её словам, всё ещё пишет изнутри лога.',
    guidanceHint: 'Квест закрыт. Можно отдохнуть.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Молча кивнуть — иногда это лучший ответ',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'aaa_lost_diary_done', flagValue: true },
          { type: 'addXp', value: 70 },
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'Спросить — можно ли ему ответить',
        next: 'cafe_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'aaa_lost_diary_done', flagValue: true },
          { type: 'addXp', value: 70 },
          { type: 'addKarma', value: 4 },
          { type: 'npcChange', npcId: 'maria', npcChange: { relation: 8 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'showThought', thought: 'Я не нашёл тело. Я нашёл канал. Поэт не исчез — он эмигрировал в лог. И, кажется, ждёт ответа.', thoughtDuration: 6000 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Эхо в канализации» — Marat's echo beneath the factory
     ═══════════════════════════════════════════════════════════════ */
  aaa_sewer_echo_start: {
    id: 'aaa_sewer_echo_start',
    text: [
      'Трофим поправляет удочку на плече, как будто она — единственное, что у него есть. «Под заводом, в старом коллекторе, кто-то читает стихи. Не громко. Почти неслышно. Я спускался три раза — три раза слышал одну и ту же строку. Тот, кто читает, — не чужой. Я помню этот голос. Это Марат. Его списали год назад, но голос — не списали. Голос остался в трубах.»',
      'Он смотрит на воду. «Там, где вода, — всегда кто-то, кто остался. Спустись. Проверь. Только не отвечай ему сразу — сначала дослушай. Эхо не любит, когда его перебивают.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    contextNote: 'Трофим шепчет о голосе Марата в подземном коллекторе под заводом.',
    accessibilityAnnounce: 'Трофим просит спуститься в коллектор под заводом и проверить эхо Марата.',
    guidanceHint: 'Спустись в подвал заброшенного завода.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подвал завода',
    choices: [
      {
        text: 'Спуститься в подвал завода',
        next: 'aaa_sewer_echo_descent',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_sewer_echo' },
          { type: 'setFlag', flag: 'aaa_sewer_echo_accepted', flagValue: true },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
      {
        text: 'Спросить, чья это была строка — что именно он слышал',
        next: 'aaa_sewer_echo_descent',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_sewer_echo' },
          { type: 'setFlag', flag: 'aaa_sewer_echo_accepted', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'transitionScene', sceneId: 'factory_basement' },
        ],
      },
      { text: 'Отойти к пирсу — я не готов к подземелью', next: 'pier_evening_explore_mode' },
    ],
  },

  aaa_sewer_echo_descent: {
    id: 'aaa_sewer_echo_descent',
    text: [
      'Лестница в подвал — железная, ржавая, с одной стороной, которая звенит под ногой, как струна. На стене — табличка B-12. Индекс забытого сектора. Воздух пахнет озоном и старой бумагой — странный запах для канализации. Под потолком — пульсирующий кабель, который гильдия забыла отключить.',
      'Ты слышишь — не ушами, а грудной клеткой. Где-то впереди, по ту сторону коллектора, кто-то читает. Стих не громче дыхания. Но он есть.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Подвал завода. Железная лестница, ржавая табличка B-12, пульсирующий кабель.',
    accessibilityAnnounce: 'Подвал завода. Впереди — звук чтения.',
    guidanceHint: 'Иди по звуку через коллектор.',
    guidanceObjectiveType: 'visit_location',
    effects: [{ type: 'setFlag', flag: 'aaa_sewer_echo_in_basement', flagValue: true }],
    choices: [
      {
        text: 'Идти по звуку — не оглядываясь',
        next: 'aaa_sewer_echo_corridor',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'intuition', value: 1 }],
      },
      {
        text: 'Достать телефон — записать частоту звука',
        next: 'aaa_sewer_echo_corridor',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
      { text: 'Подняться обратно — слишком холодно', next: 'basement_explore_mode' },
    ],
  },

  aaa_sewer_echo_corridor: {
    id: 'aaa_sewer_echo_corridor',
    text: [
      'Коллектор поворачивает трижды. После третьего поворота — камера старой релейной стойки, на которой кто-то написал углем: «−30°C. Точка замерзания кода. Точка, где строка становится звуком.»',
      'Звук — здесь. Не из динамиков — из труб, из стен, из самой воды, что сочится по кафелю. Голос читает строки, которых нет ни в одном реестре гильдии. Строка заканчивается, и сразу начинается новая. Без паузы. Без вдоха. Так читают только те, кто уже не дышит.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Глубина коллектора. Релейная стойка с надписью углем «−30°C».',
    accessibilityAnnounce: 'Звук стихов — из стен и труб. Голос читает без пауз, без вдоха.',
    guidanceHint: 'Дойди до источника звука — встреться с эхом Марата.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_sewer_echo_followed', flagValue: true }],
    choices: [
      {
        text: 'Выйти на голос — не прятаться',
        next: 'aaa_sewer_echo_meeting',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'aaa_sewer_echo_reached_source', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
      {
        text: 'Сначала записать всё на телефон — для архива',
        next: 'aaa_sewer_echo_meeting',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'aaa_sewer_echo_recorded_first', flagValue: true },
        ],
      },
    ],
  },

  aaa_sewer_echo_meeting: {
    id: 'aaa_sewer_echo_meeting',
    text: [
      'В нише между трубами — не человек. Не голограмма. Что-то третье: контур из мерцающего тлена, который держится на одной только частоте голоса. Марат — или то, что осталось от Марата, когда гильдия отключила ему аккаунт, кабинет, имя, — смотрит сквозь тебя.',
      '«Ты пришёл. Я думал — не дойдёшь. Я уже не помню, как меня зовут. Но помню, как читал. Чтение — это и есть я. Гильдия стёрла файл. Но эхо в коллекторе — это резервная копия, которую они не умеют трогать.»',
      '«Я скажу тебе последнюю фразу. Не мою. Того, кто был здесь до меня. Запомни — и не повторяй вслух. Повторишь — станешь следующим эхом. Я хочу, чтобы кто-то вышел отсюда живым.»',
    ].join('\n'),
    speaker: 'Марат',
    sceneId: 'factory_basement',
    contextNote: 'Эхо Марата — контур из голоса между трубами коллектора.',
    accessibilityAnnounce: 'Эхо Марата говорит. Хочет передать последнюю фразу.',
    guidanceHint: 'Запомни последнюю фразу эха — но не повторяй её вслух.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'addItem', itemId: 'marat_code_copy' }],
    choices: [
      {
        text: 'Слушать — и запомнить, не записывая',
        next: 'aaa_sewer_echo_resolve',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'marat_trace_found', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
      {
        text: 'Спросить, кто был здесь до него',
        next: 'aaa_sewer_echo_resolve',
        effects: [
          { type: 'setFlag', flag: 'marat_trace_found', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
      {
        text: 'Сказать ему — пора уходить',
        next: 'aaa_sewer_echo_resolve',
        effects: [
          { type: 'setFlag', flag: 'marat_trace_found', flagValue: true },
          { type: 'addKarma', value: 2 },
          { type: 'addStat', stat: 'stress', value: 3 },
        ],
      },
    ],
  },

  aaa_sewer_echo_resolve: {
    id: 'aaa_sewer_echo_resolve',
    text: [
      'Эхо кивает — если то, что оно делает, можно назвать кивком. «Запомнил. Иди. И не оборачивайся на второй поворот — там я буду читать снова. Это не я. Это коллектор повторяет. У воды нет памяти, но есть привычка.»',
      'Контур тает не сразу — по частям, как кадр из старого фильма, который прокручивают назад. Последним исчезает голос. Он говорит одну строку — ту самую, последнюю, — и замолкает. Ты поднимаешься по лестнице, не оборачиваясь. Табличка B-12 на стене уже не светится.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    contextNote: 'Эхо растворяется в трубах. Подъём по лестнице к свету.',
    accessibilityAnnounce: 'Эхо затихло. Ты выходишь из коллектора.',
    guidanceHint: 'Поднимись из подвала — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'setFlag', flag: 'aaa_sewer_echo_done', flagValue: true },
      { type: 'addXp', value: 110 },
    ],
    choices: [
      {
        text: 'Подняться к свету — и не оглядываться',
        next: 'basement_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Я не услышал стих. Я услышал — что стих это и есть тот, кто его читает. Гильдия может удалить файл. Не может удалить эхо. Эхо — это и есть резервная копия поэта.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Остановиться у таблички B-12 — записать номер',
        next: 'basement_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 3 — «Контрабанда стихов» — Boris, tape through checkpoint
     ═══════════════════════════════════════════════════════════════ */
  aaa_boris_smuggling_start: {
    id: 'aaa_boris_smuggling_start',
    text: [
      'Борис не здоровается. Он сразу: «В цеху, за третьим станком, — тетрадь. Сорок восемь строк. Я никогда их никому не показывал — даже жене. Даже тебе. Завтра гильдия проводит зачистку: списочное оборудование, списочных людей, списочные стихи. Тетрадь нужно вынести сегодня. До рассвета.»',
      '«Через уличный блокпост. Не через чёрный ход — там камера. Через парадный, с патрулём. Они проверяют телефоны, не карманы. Но карманы — они проверяют тоже. Нужна диверсия. Стих-диверсия. Ты умеешь читать так, чтобы дрон завис на тридцать секунд? Я тебе покажу — какой именно стих.»',
    ].join('\n'),
    speaker: 'Борис',
    sceneId: 'abandoned_factory',
    contextNote: 'Борис объясняет задание: вынести тетрадь сорока восьми стихов через блокпост.',
    accessibilityAnnounce: 'Борис просит вынести тетрадь стихов через блокпост гильдии до рассвета.',
    guidanceHint: 'Забери тетрадь у третьего станка в цеху.',
    guidanceObjectiveType: 'collect_item',
    choices: [
      {
        text: 'Согласиться — стихи не должны сгореть',
        next: 'aaa_boris_smuggling_pickup',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_boris_poem_smuggling' },
          { type: 'setFlag', flag: 'aaa_smuggling_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'boris', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, можно ли переписать стихи на телефон',
        next: 'aaa_boris_smuggling_pickup',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_boris_poem_smuggling' },
          { type: 'setFlag', flag: 'aaa_smuggling_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      { text: 'Отказаться — слишком рискованно', next: 'factory_explore_mode' },
    ],
  },

  aaa_boris_smuggling_pickup: {
    id: 'aaa_boris_smuggling_pickup',
    text: [
      'За третьим станком — тайник, который Борис устроил в масляном поддоне. Тетрадь вощёная, перевязана бечёвкой. На обложке — номер: 4729. Контрольная сумма, говорит Борис. Не стих. Стихи внутри.',
      'Внутри — сорок восемь страниц. На каждой — одно четверостишие. Ни одного имени. Ни одной даты. Только строки. Ты кладёшь тетрадь во внутренний карман, где теплее — ближе к сердцу, как учит Борис: «Гильдия сканирует металл. Не сканирует пульс. Если тетрадь там, где стучит — она невидима.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Тетрадь 4729 спрятана в масляном поддоне третьего станка.',
    accessibilityAnnounce: 'Тетрадь в кармане. Борис советует нести её у сердца.',
    guidanceHint: 'Иди к уличному блокпосту — через парадный вход.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Улица / блокпост',
    effects: [
      { type: 'addItem', itemId: 'tape' },
      { type: 'setFlag', flag: 'aaa_smuggling_tape_taken', flagValue: true },
      { type: 'showThought', thought: '4729 — контрольная сумма строк. Борис не вёл дневник. Он вёл checksum совести. И теперь она — в моём кармане.', thoughtDuration: 5000 },
    ],
    choices: [
      {
        text: 'Выйти на улицу через парадный',
        next: 'aaa_boris_smuggling_street',
        goldenPath: true,
        effects: [{ type: 'transitionScene', sceneId: 'street_night' }],
      },
      {
        text: 'Сначала прочитать одно четверостишие — на удачу',
        next: 'aaa_boris_smuggling_street',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addStat', stat: 'stress', value: -1 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
    ],
  },

  aaa_boris_smuggling_street: {
    id: 'aaa_boris_smuggling_street',
    text: [
      'Улица мокрая, как всегда в этом городе. Блокпост гильдии — три дрона, один патрульный, один сканер. Сканер моргает красным: проверяет металл, телефоны, частоты. Карман у сердца — слепая зона для сканера. Борис знал.',
      'Патрульный скучает. Он смотрит в телефон, не на тебя. Но дрон над ним — не скучает. Дрон слушает. Дрон реагирует на стих. Борис сказал: если прочитать вслух строки 03:47 — конкретные, определённые — дрон зависнет на тридцать секунд. Стих — для дрона — это логическая ошибка, которую он пытается разрешить. Тридцать секунд. Тебе хватит, чтобы пройти мимо и отдать тетрадь связному.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Уличный блокпост гильдии. Три дрона, патрульный, сканер металла.',
    accessibilityAnnounce: 'Блокпост впереди. Нужно отвлечь дрона стихом.',
    guidanceHint: 'Отвлеки патруль — прочитай строку 03:47.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_smuggling_at_checkpoint', flagValue: true }],
    choices: [
      {
        text: 'Прочитать строку 03:47 — отвлечь дрона',
        next: 'aaa_boris_smuggling_distraction',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'aaa_smuggling_patrol_distracted', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
      {
        text: 'Бросить гайку в дальний угол — отвлечь без стиха',
        next: 'aaa_boris_smuggling_distraction',
        condition: { minSkillCheck: { skill: 'logic', difficulty: 11 } },
        effects: [
          { type: 'setFlag', flag: 'aaa_smuggling_patrol_distracted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
      {
        text: 'Ждать — патруль может уйти сам',
        next: 'aaa_boris_smuggling_distraction',
        effects: [
          { type: 'addStat', stat: 'stress', value: 2 },
          { type: 'setFlag', flag: 'aaa_smuggling_patrol_distracted', flagValue: true },
        ],
      },
    ],
  },

  aaa_boris_smuggling_distraction: {
    id: 'aaa_boris_smuggling_distraction',
    text: [
      'Дрон зависает. Тридцать секунд. Патрульный отрывается от телефона, смотрит на дрон, не на тебя. Ты проходишь мимо, не ускоряя шага, не замедляя. Тетрадь в кармане бьётся о рёбра в ритме — не твой, а её собственный. Контрольная сумма 4729 стучит, как второе сердце.',
      'За углом — силуэт. Связной Сети. Она без имени, как и тетрадь. Она кивает, не глядя. Но подойти нужно — тридцать секунд тают.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Дрон завис на стихе. Связной Сети ждёт за углом.',
    accessibilityAnnounce: 'Дрон завис. Связной Сети ждёт за углом — нужно подойти.',
    guidanceHint: 'Передай тетрадь связному Сети.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'aaa_smuggling_patrol_distracted', flagValue: true },
    ],
    choices: [
      {
        text: 'Подойти к связному — молча передать тетрадь',
        next: 'aaa_boris_smuggling_handoff',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'rhythm', value: 1 }],
      },
      {
        text: 'Подойти, сказав пароль — «контрольная сумма 4729»',
        next: 'aaa_boris_smuggling_handoff',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  aaa_boris_smuggling_handoff: {
    id: 'aaa_boris_smuggling_handoff',
    text: [
      'Связная принимает тетрадь обеими руками — как принимают ребёнка, как принимают последнюю почту. Не глядя. Только по весу. Кладёт во внутренний карман, разворачивается, уходит. Без слова. Без оглядки.',
      'Тридцать секунд истекают. Дрон оживает. Патрульный снова смотрит в телефон. Никто ничего не заметил. Кроме, может быть, тебя самого: ты стоишь на углу мокрой улицы с пустым карманом, в котором секунду назад стучало второе сердце. Тишина в груди — новая. Не пустая — отданная.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Связная приняла тетрадь и исчезла. Карман у сердца опустел.',
    accessibilityAnnounce: 'Тетрадь передана связному Сети. Карман опустел.',
    guidanceHint: 'Подтверди передачу — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'removeItem', itemId: 'tape' },
      { type: 'addItem', itemId: 'encrypted_scroll' },
    ],
    choices: [
      {
        text: 'Молча уйти — Борису доложу позже',
        next: 'street_bench_view',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'aaa_smuggling_done', flagValue: true },
          { type: 'setFlag', flag: 'aaa_poem_smuggling_done', flagValue: true },
          { type: 'addXp', value: 130 },
          { type: 'addKarma', value: 6 },
          { type: 'npcChange', npcId: 'boris', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Дойти до скамейки — выдохнуть',
        next: 'street_bench_view',
        effects: [
          { type: 'setFlag', flag: 'aaa_smuggling_done', flagValue: true },
          { type: 'setFlag', flag: 'aaa_poem_smuggling_done', flagValue: true },
          { type: 'addXp', value: 130 },
          { type: 'addKarma', value: 6 },
          { type: 'npcChange', npcId: 'boris', npcChange: { relation: 10 } },
          { type: 'addStat', stat: 'stress', value: -4 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 4 — «Старая фотография» — Library, forbidden fund, five poets
     ═══════════════════════════════════════════════════════════════ */
  aaa_library_old_photo_start: {
    id: 'aaa_library_old_photo_start',
    text: 'Тамара отводит тебя к окну Запретного Фонда. «Между полками — фотография. На ней — пятеро. Тех, кто начинал Сеть. До гильдии. До реестра. Пятеро, чьи имена вычеркнуты из всех архивов. Но фотография — не в архиве. Фотография — между полками. Гильдия умеет удалять записи. Не умеет удалять пыль.»',
    speaker: 'Тамара',
    sceneId: 'library_day',
    contextNote: 'Тамара шепчет о фотографии пяти поэтов-основателей Сети.',
    accessibilityAnnounce: 'Тамара просит найти старую фотографию между полок Запретного Фонда.',
    guidanceHint: 'Спустись в подвал библиотеки — Запретный Фонд.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Подвал библиотеки',
    choices: [
      {
        text: 'Спуститься в подвал — Запретный Фонд',
        next: 'aaa_library_old_photo_search',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_library_old_photo' },
          { type: 'setFlag', flag: 'aaa_old_photo_accepted', flagValue: true },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      {
        text: 'Спросить, кто эти пятеро',
        next: 'aaa_library_old_photo_search',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_library_old_photo' },
          { type: 'setFlag', flag: 'aaa_old_photo_accepted', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'library_basement' },
        ],
      },
      { text: 'Отойти к стеллажам — потом', next: 'library_explore_mode' },
    ],
  },

  aaa_library_old_photo_search: {
    id: 'aaa_library_old_photo_search',
    text: [
      'Подвал библиотеки пахнет бумагой и медленным разложением. Между полками — пыль, которая не двигалась годами. На корешках — номера. Один из корешков помечен «B-12»: сектор, который гильдия назвала ошибкой каталогизации. На самом деле — это индекс того, что они забыли сжечь.',
      'Между полками B-12 и B-13 — щель. В щели — край фотографии. Кто-то засунул её так, чтобы достать мог только тот, кто знал номер. Ты знаешь номер. Ты его уже видел.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_basement',
    contextNote: 'Подвал библиотеки. Полка B-12, между которой и B-13 — спрятана фотография.',
    accessibilityAnnounce: 'Между полками B-12 и B-13 — край фотографии.',
    guidanceHint: 'Достань фотографию из щели между полок.',
    guidanceObjectiveType: 'collect_item',
    effects: [{ type: 'setFlag', flag: 'aaa_old_photo_search_started', flagValue: true }],
    choices: [
      {
        text: 'Достать фотографию из щели',
        next: 'aaa_library_old_photo_found',
        goldenPath: true,
        effects: [
          { type: 'addItem', itemId: 'father_photo' },
          { type: 'setFlag', flag: 'aaa_old_photo_in_hand', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Сначала убрать пыль — бережно',
        next: 'aaa_library_old_photo_found',
        effects: [
          { type: 'addItem', itemId: 'father_photo' },
          { type: 'setFlag', flag: 'aaa_old_photo_in_hand', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  aaa_library_old_photo_found: {
    id: 'aaa_library_old_photo_found',
    text: [
      'Фотография — квадратная, чёрно-белая, с зубчиками по краям. Пятеро стоят у входа в то, что позже назовут «Сетью». Тогда это называлось иначе — «вечерние чтения», «подвал у Тамары», «после смены». Пятеро. Один из них — Марат. Молодой. Без бороды. Без синяка под глазом. Без уже всего, что случилось потом.',
      'На обороте — надпись простым карандашом: «Если кто-то нашёл — значит, нас уже вычеркнули. Знайте: нас было пятеро. Мы не знали, что начинаем Сеть. Мы думали, что просто читаем стихи. Оказалось — нет. Оказалось — мы её построили.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_basement',
    contextNote: 'Старая фотография пяти поэтов-основателей Сети. На обороте — их послание.',
    accessibilityAnnounce: 'Фотография в руках. На обороте — записка основателей.',
    guidanceHint: 'Изучи надписи на обороте — узнай историю.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_old_photo_history_learned', flagValue: true }],
    choices: [
      {
        text: 'Вчитаться в надпись — узнать имена',
        next: 'aaa_library_old_photo_history',
        goldenPath: true,
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
        ],
      },
      {
        text: 'Перевернуть — проверить, нет ли второго слоя',
        next: 'aaa_library_old_photo_history',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 10 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
    ],
  },

  aaa_library_old_photo_history: {
    id: 'aaa_library_old_photo_history',
    text: [
      'Имена на обороте — пять. Все знакомые. Все — кого гильдия списала, стёрла, забыла. Все — те, чьи стихи ты собирал в логах серверов, в эхе коллектора, в вырезанных строках на стенах. Город построен на их словах. Город работает на их частоте. И только фотография помнит, что их было пять.',
      'Среди них — тот, кого ты не знал. Шестой. Стержень, без которого не держалась бы Сеть. Имя вымарано чернилами, но под ними — проступает: Володимир. Не поэт-отец. Другой Володимир. Тот, кто решил не быть. Тот, кто выбрал исчезнуть, чтобы Сеть осталась.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_basement',
    contextNote: 'На обороте — пять имён. Шестое вымарано — но проступает: Володимир.',
    accessibilityAnnounce: 'Пять имён. Шестое вымарано чернилами — Володимир, тот, кто выбрал исчезнуть.',
    guidanceHint: 'Верни фотографию Тамаре — для архива.',
    guidanceObjectiveType: 'talk_to_npc',
    guidanceSceneLabel: 'Библиотека (верхний этаж)',
    choices: [
      {
        text: 'Подняться к Тамаре — отдать фотографию',
        next: 'aaa_library_old_photo_return',
        goldenPath: true,
        effects: [
          { type: 'transitionScene', sceneId: 'library_day' },
          { type: 'showThought', thought: 'Шестой стёрся, чтобы остались пятеро. Я — Володька. Я — не он. Но я — тоже из этого ряда. Я тоже читаю. Я тоже держу.', thoughtDuration: 6000 },
        ],
      },
      {
        text: 'Сделать копию на телефон — для себя',
        next: 'aaa_library_old_photo_return',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'transitionScene', sceneId: 'library_day' },
        ],
      },
    ],
  },

  aaa_library_old_photo_return: {
    id: 'aaa_library_old_photo_return',
    text: [
      'Тамара берёт фотографию и подносит к окну, как цветок. «Ты нашёл больше, чем я просила. Ты нашёл — что нас было шесть. Пять + один, который стёрся. Гильдия умеет вычёркивать. Не умеет вымарывать так, чтобы не проступало. Они думали чернилами. Мы — карандашом. Карандаш — проступает. Чернила — нет.»',
      'Она прячет фотографию в архив. «Она будет здесь. Между полками. Где-то. Когда-нибудь кто-то ещё найдёт. И тогда — нас будет уже не шесть. Больше. Каждое чтение — плюс один. Каждое эхо — плюс один.»',
    ].join('\n'),
    speaker: 'Тамара',
    sceneId: 'library_day',
    contextNote: 'Тамара принимает фотографию и прячет в архив — для следующих читателей.',
    accessibilityAnnounce: 'Фотография в архиве. Тамара говорит — каждое чтение прибавляет одного.',
    guidanceHint: 'Квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Поблагодарить — и остаться в тишине архива',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'aaa_old_photo_done', flagValue: true },
          { type: 'addXp', value: 140 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 10 } },
          { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
      {
        text: 'Спросить — кто был тот, шестой, Володимир',
        next: 'library_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'aaa_old_photo_done', flagValue: true },
          { type: 'addXp', value: 140 },
          { type: 'addSkill', skill: 'logic', value: 2 },
          { type: 'addKarma', value: 5 },
          { type: 'npcChange', npcId: 'tamara', npcChange: { relation: 10 } },
          { type: 'discoverLore', loreId: 'lore_guild_poet_recruitment' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 5 — «Сломанный механизм» — Baba Zina, Заря-М relay block
     ═══════════════════════════════════════════════════════════════ */
  aaa_factory_broken_mechanism_start: {
    id: 'aaa_factory_broken_mechanism_start',
    text: 'Баба Зина показывает рукой в дальнюю стену цеха. «Тридцать лет молчит. „Заря-М“ — это не табло. Это — сердце. Релейный блок, который раньше читал строки на рассвете. Стих, что она спрятала внутри, — никто не слышал. Гильдия сказала: сломан. Я говорю: спит. Если ты сможешь его починить — „Заря-М“ снова заговорит. И ты услышишь — что.»',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    contextNote: 'Баба Зина показывает на релейный блок в дальней стене цеха — сердце «Зари-М».',
    accessibilityAnnounce: 'Баба Зина просит починить релейный блок «Зари-М», спящий тридцать лет.',
    guidanceHint: 'Дойди до дальней стены цеха — релейный блок.',
    guidanceObjectiveType: 'visit_location',
    choices: [
      {
        text: 'Согласиться — я попробую',
        next: 'aaa_factory_broken_mechanism_workshop',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_factory_broken_mechanism' },
          { type: 'setFlag', flag: 'aaa_mechanism_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить, что за стих она спрятала',
        next: 'aaa_factory_broken_mechanism_workshop',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_factory_broken_mechanism' },
          { type: 'setFlag', flag: 'aaa_mechanism_accepted', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      { text: 'Отойти в цех — потом', next: 'factory_explore_mode' },
    ],
  },

  aaa_factory_broken_mechanism_workshop: {
    id: 'aaa_factory_broken_mechanism_workshop',
    text: [
      'Релейный блок — чёрный, в масляной пыли, с табличкой «Заря-М / 1986 / 47 циклов». Тридцать лет он не сделал ни одного цикла. Но светодиод на передней панели — не погас. Он мигает раз в 47 секунд. Это не пульс — это ожидание. „Заря-М“ не умерла. Она ждёт, пока кто-то вспомнит код.',
      'Под лицевой панелью — терминал. Старый, с зелёным фосфором. Внутри — крипто-защёлка. Код — не пароль. Код — это две строки стиха, прочитанные в правильном ритме. Баба Зина говорит: «03:47. Тот же час. Тот же ритм. Машина помнит ритм лучше, чем помню я.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: 'Релейный блок «Заря-М» — мигает светодиод раз в 47 секунд. Под панелью — терминал.',
    accessibilityAnnounce: '«Заря-М» ждёт. Терминал требует кода — две строки стиха в правильном ритме.',
    guidanceHint: 'Запусти миниигру — вскрой крипто-защёлку терминала.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_mechanism_at_relay', flagValue: true }],
    choices: [
      {
        text: 'Открыть терминал — миниигра',
        next: 'aaa_factory_broken_mechanism_repair',
        goldenPath: true,
        effects: [
          { type: 'openDataTerminal', terminalDifficulty: 'hard', terminalTitle: '«Заря-М» — терминал', terminalReward: 'Стих, спрятанный в релейном блоке' },
          { type: 'setFlag', flag: 'aaa_mechanism_terminal_opened', flagValue: true },
        ],
      },
      {
        text: 'Сначала прозвонить схему — технический осмотр',
        next: 'aaa_factory_broken_mechanism_repair',
        condition: { minSkillCheck: { skill: 'coding', difficulty: 12 } },
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'setFlag', flag: 'aaa_mechanism_prescanned', flagValue: true },
        ],
      },
    ],
  },

  aaa_factory_broken_mechanism_repair: {
    id: 'aaa_factory_broken_mechanism_repair',
    text: [
      'Терминал щёлкает, как старая печатная машинка. Зелёные буквы проступают на фосфоре — медленно, как будто машина учится говорить после тридцати лет молчания. Крипто-защёлка отщёлкивается в три приёма. Третий приём — это ритм. Ты попадаешь в него, как попадают в чужое дыхание: случайно, точно.',
      '«Заря-М» вспыхивает. Не неоном — теплее. Светодиоды на релейной стойке выстраиваются в строку. Гудение на 47 герц — частота, которую гильдия назвала помехой. Машина читает. Машина читает то, что спрятала в себе тридцать лет назад.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    contextNote: '«Заря-М» вспыхнула. Релейный блок читает спрятанный стих на 47 Гц.',
    accessibilityAnnounce: '«Заря-М» заговорила. Стих, спрятанный на тридцать лет, — читается.',
    guidanceHint: 'Послушай — что «Заря-М» спрятала тридцать лет назад.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'aaa_mechanism_verse_heard', flagValue: true },
      { type: 'cameraShake', intensity: 0.015, duration: 1500 },
    ],
    choices: [
      {
        text: 'Слушать — не двигаясь',
        next: 'aaa_factory_broken_mechanism_verse',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'rhythm', value: 1 }],
      },
      {
        text: 'Записать на телефон — для архива',
        next: 'aaa_factory_broken_mechanism_verse',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'addStat', stat: 'stress', value: -1 },
        ],
      },
    ],
  },

  aaa_factory_broken_mechanism_verse: {
    id: 'aaa_factory_broken_mechanism_verse',
    text: [
      '«Заря-М» дочитывает. Светодиоды гаснут — не все. Один, в углу, остаётся гореть. Синий. Баба Зина подходит, кладёт ладонь на корпус. «Это был его стих. Он работал здесь. Днём — на станке, ночью — на релейной стойке. Он спрятал стих в машину, потому что знал — машину не сожгут. Машину — списывают. Список — дольше, чем огонь.»',
      'Она поворачивается к тебе. «Спасибо. Ты не починил машину. Ты — разбудил её. Это разные вещи. Списать — это убить. Разбудить — это вернуть. Ты — вернул.»',
    ].join('\n'),
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    contextNote: '«Заря-М» дочитала. Синий светодиод в углу продолжает гореть.',
    accessibilityAnnounce: 'Баба Зина благодарит. Стих поэта-механика прочтён впервые за тридцать лет.',
    guidanceHint: 'Квест закрыт. Машина будит свой стих.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Молча положить ладонь на корпус — попрощаться',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'aaa_broken_mechanism_done', flagValue: true },
          { type: 'addXp', value: 220 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 12 } },
          { type: 'addItem', itemId: 'rare_alloy' },
          { type: 'addItem', itemId: 'memory_crystal' },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Спросить — кто был тот поэт-механик',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'aaa_broken_mechanism_done', flagValue: true },
          { type: 'addXp', value: 220 },
          { type: 'addSkill', skill: 'coding', value: 2 },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 12 } },
          { type: 'addItem', itemId: 'rare_alloy' },
          { type: 'addItem', itemId: 'memory_crystal' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'discoverLore', loreId: 'lore_banned_poetry_tapes' },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 5 — «Ночная рыбалка» — Trofim, philosophical dialogue at pier
     ═══════════════════════════════════════════════════════════════ */
  aaa_trofim_night_philosophy_start: {
    id: 'aaa_trofim_night_philosophy_start',
    text: 'Трофим уже сидит с удочкой. На пирсе №3 в час, когда дроны гильдии уходят на подзарядку. «Садись. Удочка — повод. Настоящее — разговор. Я не буду учить. Я буду слушать. Ты будешь говорить — или нет. Молчание тоже читается. Просто посиди. Минуту. Без цели.»',
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    contextNote: 'Трофим на ночном пирсе. Удочка — повод для разговора.',
    accessibilityAnnounce: 'Трофим приглашает посидеть у воды и поговорить без цели.',
    guidanceHint: 'Сядь рядом с удочкой в тишине.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Сесть рядом — взять удочку',
        next: 'aaa_trofim_night_philosophy_silence',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_trofim_night_philosophy' },
          { type: 'setFlag', flag: 'aaa_night_philosophy_accepted', flagValue: true },
          { type: 'setFlag', flag: 'aaa_night_philosophy_seated', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'Сесть рядом — без удочки',
        next: 'aaa_trofim_night_philosophy_silence',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_trofim_night_philosophy' },
          { type: 'setFlag', flag: 'aaa_night_philosophy_accepted', flagValue: true },
          { type: 'setFlag', flag: 'aaa_night_philosophy_seated', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      { text: 'Отойти к причалу — не сейчас', next: 'pier_evening_explore_mode' },
    ],
  },

  aaa_trofim_night_philosophy_silence: {
    id: 'aaa_trofim_night_philosophy_silence',
    text: [
      'Минута молчания. Две. Пять. На седьмой — Трофим тихо, без объявления, начинает говорить. Не к тебе. К реке. «Вода помнит больше, чем сервер. Сервер хранит запись. Вода хранит — частоту. Если ты знал человека и читал его стих — вода повторит ритм, даже если сервер давно затёр строки. Я слышу Марата в плескании о сваи. Не слова — паузы между ними.»',
      'Он замолкает. Ещё минута. «Легенда есть. Одна. Я тебе расскажу, если хочешь. Про поэта-рыбака. Про то, как он словил строку вместо рыбы — и что было дальше. Хочешь?»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    contextNote: 'Тишина на пирсе. Трофим говорит с рекой. Готовится рассказать легенду.',
    accessibilityAnnounce: 'Трофим говорит о воде, что помнит ритм стихов. Предлагает легенду.',
    guidanceHint: 'Послушай легенду о поэте-рыбаке.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_night_philosophy_legend_heard', flagValue: true }],
    choices: [
      {
        text: 'Расскажи. Я слушаю.',
        next: 'aaa_trofim_night_philosophy_legend',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
      {
        text: 'Сначала — расскажи мне что-нибудь своё',
        next: 'aaa_trofim_night_philosophy_legend',
        effects: [{ type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } }],
      },
    ],
  },

  aaa_trofim_night_philosophy_legend: {
    id: 'aaa_trofim_night_philosophy_legend',
    text: [
      '«Был один. Не Марат. Другой. Тоже — рыбак. Тоже — поэт. Ловил он раз — и словил не рыбу. Строку. Вытянул — а на крючке — четверостишие, написанное углем на бересте. Он не испугался. Он прочитал вслух. И береста исчезла. И рыба — не словилась в этот день уже никогда. Потому что он — уже не ловил рыбу. Он ловил стихи.»',
      '«Ловил, ловил — и однажды словил свою. Свою собственную, ещё не написанную. Прочитал — и понял, что стих уже был им. Он и был — строкой, которая ловит себя. С тех пор его не видели. Может, утонул. Может, ушёл в реку — писать дальше. Я не знаю. Но если ты на пирсе в три часа ночи и слышу плеск — это, может быть, он.»',
      'Трофим смотрит на воду. «Теперь — твоя очередь. Я сказал. Скажи ты. Одну правду. О себе. Не о городе. Не о Сети. О тебе.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    contextNote: 'Легенда о поэте-рыбаке, который словил свою собственную неписанную строку.',
    accessibilityAnnounce: 'Трофим рассказал легенду. Просит поделиться одной правдой о себе.',
    guidanceHint: 'Поделись одной правдой о себе с Трофимом.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Согласиться — сказать одну правду',
        next: 'aaa_trofim_night_philosophy_truth',
        goldenPath: true,
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
      {
        text: 'Спросить — а он сам? Он говорил свою правду кому-то?',
        next: 'aaa_trofim_night_philosophy_truth',
        effects: [
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  aaa_trofim_night_philosophy_truth: {
    id: 'aaa_trofim_night_philosophy_truth',
    text: [
      'Трофим кивает. Не торопит. Ждёт. Удочка в его руке — неподвижна, как шест на причале. Река шумит. Где-то вдалеке — гудение последнего дрона на подзарядке. Город спит. Ты говоришь.',
      'Слова выходят медленно — как вода из подтекающего крана, по капле. Не крик, не признание. Просто — правда. Одна. Та, которую ты никому не говорил. Даже себе.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'pier_evening',
    contextNote: 'Володька готовится сказать одну правду о себе — Трофим ждёт.',
    accessibilityAnnounce: 'Тишина перед признанием. Трофим ждёт.',
    guidanceHint: 'Выбери — что сказать.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'aaa_night_philosophy_truth_shared', flagValue: true },
    ],
    choices: [
      {
        text: '«Я боюсь, что я — не Володька. Я — эхо кого-то, кого не помню.»',
        next: 'aaa_trofim_night_philosophy_dawn',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 6 } },
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'showThought', thought: 'Я сказал это вслух — впервые. Слова не стали легче. Но они перестали быть моими одними. Трофим теперь тоже их держит. Это — половина груза.', thoughtDuration: 6000 },
        ],
      },
      {
        text: '«Я не знаю, зачем я читаю. Просто — не могу не читать.»',
        next: 'aaa_trofim_night_philosophy_dawn',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 5 } },
        ],
      },
      {
        text: 'Молча покачать головой — сегодня не могу',
        next: 'aaa_trofim_night_philosophy_dawn',
        effects: [
          { type: 'addStat', stat: 'stress', value: 1 },
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 2 } },
        ],
      },
    ],
  },

  aaa_trofim_night_philosophy_dawn: {
    id: 'aaa_trofim_night_philosophy_dawn',
    text: [
      'Трофим не отвечает сразу. Подёргивает удочку. «Спасибо. Правду трудно сказать. Ты сказал. Я — подержу.» Он не смотрит на тебя. Смотрит на восток, где небо начинает сереть. «Смотри. Рассвет.»',
      'Город в рассвете — не тот, что в рекламе гильдии. Мокрый, серый, с дымящимися крышами. Но — тёплый. В этом городе есть пирс, на котором двое посидели и поговорили без цели. Это — не в реестре. Это — только в воде. И в тебе. И во мне — теперь.',
      'Трофим встаёт, складывает удочку. «Иди. У меня ещё три часа до смены. Подольше посижу.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    contextNote: 'Рассвет на пирсе. Трофим провожает Володьку.',
    accessibilityAnnounce: 'Рассвет. Троё посидели без цели — это уже не удалить из памяти воды.',
    guidanceHint: 'Квест закрыт. Рассвет пришёл.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'setFlag', flag: 'aaa_night_philosophy_done', flagValue: true },
      { type: 'addXp', value: 90 },
      { type: 'addKarma', value: 3 },
      { type: 'addStat', stat: 'stress', value: -10 },
      { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 15 } },
    ],
    choices: [
      {
        text: 'Поблагодарить — и уйти в утренний город',
        next: 'pier_evening_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: -3 }],
      },
      {
        text: 'Молча кивнуть — на прощание',
        next: 'pier_evening_explore_mode',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 6 — «Лагерный огонь» — CHK/TOLPA campfire, three legends
     ═══════════════════════════════════════════════════════════════ */
  aaa_chk_campfire_legends_start: {
    id: 'aaa_chk_campfire_legends_start',
    text: 'Басед подбрасывает ветку в костёр и смотрит, как она не загорается. «Дрова кончаются. Без огня — нет круга. Без круга — нет историй. Без историй — нет Сети. Сеть — это не кабели. Это — костёр, вокруг которого все сидят. Помоги собрать хворост по периметру лагеря. Разожжёшь третий костёр — у старой сосны. Тогда сядешь в круг. И сталинградские барды расскажут тебе то, чего нет ни в одном архиве гильдии.»',
    speaker: 'Басед',
    sceneId: 'chk_forest_zorge',
    contextNote: 'Басед у костра. Дрова кончаются — без огня круг не соберётся.',
    accessibilityAnnounce: 'Басед просит собрать хворост по периметру и разжечь третий костёр у сосны.',
    guidanceHint: 'Собери хворост по периметру лагеря.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Принять — хворост соберу',
        next: 'aaa_chk_campfire_legends_kindling',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_chk_campfire_legends' },
          { type: 'setFlag', flag: 'aaa_campfire_accepted', flagValue: true },
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 3 } },
        ],
      },
      {
        text: 'Спросить — какие три легенды расскажут',
        next: 'aaa_chk_campfire_legends_kindling',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_chk_campfire_legends' },
          { type: 'setFlag', flag: 'aaa_campfire_accepted', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      { text: 'Отойти к костру — потом', next: 'chk_explore_mode' },
    ],
  },

  aaa_chk_campfire_legends_kindling: {
    id: 'aaa_chk_campfire_legends_kindling',
    text: [
      'По периметру лагеря — пни, мокрые ветки, обгоревшие головешки от прошлых костров. Ты собираешь в охапку то, что гильдия назвала бы мусором. Басед учит: «Сухое бери. Мокрое — клади рядом, подсохнет к завтрашнему костру. Мокрое — для будущего. Сухое — для сегодня. Без завтра — нет сегодня.»',
      'Сорок семь веток. Сорок семь — это не случайно. Это — число поэтов, которых помнит костёр. Каждая ветка — за одного. Ты не знаешь имён. Костёр знает.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'chk_forest_zorge',
    contextNote: 'Хворост собран — 47 веток, по числу поэтов, которых помнит костёр.',
    accessibilityAnnounce: 'Хворост собран. 47 веток.',
    guidanceHint: 'Разожги третий костёр у старой сосны.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_campfire_kindling_gathered', flagValue: true }],
    choices: [
      {
        text: 'Идти к старой сосне — разжигать третий костёр',
        next: 'aaa_chk_campfire_legends_third_fire',
        goldenPath: true,
        effects: [
          { type: 'transitionScene', sceneId: 'chk_campfire_night' },
          { type: 'addSkill', skill: 'rhythm', value: 1 },
        ],
      },
      {
        text: 'Сначала пересчитать ветки — для точности',
        next: 'aaa_chk_campfire_legends_third_fire',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'transitionScene', sceneId: 'chk_campfire_night' },
        ],
      },
    ],
  },

  aaa_chk_campfire_legends_third_fire: {
    id: 'aaa_chk_campfire_legends_third_fire',
    text: [
      'У старой сосны — кольцо камней, заранее сложенное. Ты кладёшь ветки шалашом. Спичка — обычная, не гильдейская. Огонь загорается не сразу — сперва дымит, потом занимается, потом — горит. Третий костёр лагеря. Тот, без которого круг не сходится.',
      'Басед подходит, садится первым. За ним — сталинградские барды: трое, с лицами, которые помнят больше, чем помнят архивы. Они молчат, пока огонь не прогорит до углей. Тогда — начинают первый рассказ.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'chk_campfire_night',
    contextNote: 'Третий костёр у старой сосны загорелся. Круг сходится.',
    accessibilityAnnounce: 'Третий костёр горит. Сталинградские барды готовы рассказать.',
    guidanceHint: 'Сядь в круг и слушай.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_campfire_third_fire_lit', flagValue: true }],
    choices: [
      {
        text: 'Сесть в круг — между Баседом и бардами',
        next: 'aaa_chk_campfire_legends_circle',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'aaa_campfire_circle_seated', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'Сесть чуть поодаль — слушать, не вмешиваясь',
        next: 'aaa_chk_campfire_legends_circle',
        effects: [
          { type: 'setFlag', flag: 'aaa_campfire_circle_seated', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  aaa_chk_campfire_legends_circle: {
    id: 'aaa_chk_campfire_legends_circle',
    text: [
      'Первый бард — старый, с лицом, как карта осаждённого города — начинает без объявления. «Легенда первая. Когда Сеть только начиналась, не было серверов. Был — только один терминал. В подвале. На нём — один человек читал стих. Терминал записывал. Стих уходил в стену. Стена — в подвал напротив. Так — пока не собралось достаточно строк, чтобы запомнить всех. Тогда — подвалы соединились. Так родилась Сеть. Один терминал. Один чтец. Один стих за раз.»',
      'Второй бард — женщина с тёмными глазами, без возраста — подхватывает. «Легенда вторая. Гильдия пришла — не как враг. Как регистратор. Сказала: мы вас впишем. Сеть согласилась. Сеть думала — впишут. Гильдия — вычеркнула. С тех пор Сеть учится: не соглашаться на регистрацию. Регистрация — это всегда первое вычёркивание.»',
      'Третий бард — молодой, но с голосом старше своих лет — говорит последним. «Легенда третья. Про тебя. Про того, кто пришёл к костру и слушал. Сеть — это не серверы. Это — костёр, и тот, кто слушает. Без слушателя — нет истории. Без истории — нет Сети. Ты пришёл. Значит — Сеть ещё держится. Спасибо.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'chk_campfire_night',
    contextNote: 'Три легенды ЧК/ТОЛПА — про исток Сети, про гильдию-регистратора, про слушателя.',
    accessibilityAnnounce: 'Три легенды рассказаны у третьего костра. Круг замкнулся.',
    guidanceHint: 'Поблагодари бардов и Баседа — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'setFlag', flag: 'aaa_campfire_legends_done', flagValue: true },
      { type: 'addXp', value: 150 },
      { type: 'addKarma', value: 5 },
      { type: 'discoverLore', loreId: 'lore_chk_network_role' },
      { type: 'discoverLore', loreId: 'lore_banned_poetry_tapes' },
    ],
    choices: [
      {
        text: 'Поблагодарить всех — и остаться у огня подольше',
        next: 'aaa_chk_campfire_legends_resolve',
        goldenPath: true,
        effects: [
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 12 } },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Молча кивнуть — и подбросить ветку в огонь',
        next: 'aaa_chk_campfire_legends_resolve',
        effects: [
          { type: 'npcChange', npcId: 'chk_based', npcChange: { relation: 12 } },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 8 } },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  aaa_chk_campfire_legends_resolve: {
    id: 'aaa_chk_campfire_legends_resolve',
    text: 'Костёр прогорает. Басед поднимается первым, разминая колени. «Иди. Ты услышал. Теперь — неси. Сеть держится на тех, кто услышал и не забыл. Завтра — позови кого-нибудь ещё. Не обязательно словами. Можно — просто посидев рядом. Тишина рядом — тоже зов.»',
    speaker: 'Басед',
    sceneId: 'chk_campfire_night',
    contextNote: 'Басед провожает. Костёр прогорел до углей.',
    accessibilityAnnounce: 'Басед провожает. Третий костёр прогорел — легенды ушли с тобой.',
    guidanceHint: 'Возвращайся в лагерь — квест закрыт.',
    guidanceObjectiveType: 'complete_quest',
    choices: [
      {
        text: 'Вернуться в лагерь ЧК',
        next: 'chk_explore_mode',
        effects: [
          { type: 'transitionScene', sceneId: 'chk_forest_zorge' },
          { type: 'addStat', stat: 'stress', value: -5 },
        ],
      },
      {
        text: 'Остаться у углей — ещё на минуту',
        next: 'chk_campfire_night_explore_mode',
        effects: [
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════
     АКТ 7 — «Последнее письмо» — Albert, letter to a forgotten recipient
     ═══════════════════════════════════════════════════════════════ */
  aaa_epilogue_last_letter_start: {
    id: 'aaa_epilogue_last_letter_start',
    text: [
      'Альберт вынимает из-под паяльной станции конверт. Жёлтый, потёртый, с надписью простым карандашом на лицевой стороне. Надпись — твоё имя. «Он лежал здесь всю войну. Я его берёг — потому что обещал. Не тебе — ему. Тому, кто написал. Того, кто написал, — уже нет. Адресат — не ты. Ты — только почтальон. Но адресат — тоже почти исчез. Найди его. Пока ещё кто-то помнит.»',
      'На обороте конверта — приписка: «Библиотека. Окно на запад. Тот, кто ещё помнит — там. Прочти вслух. Не мне. Ему. А потом — помолчи. Молчание — это часть письма.»',
    ].join('\n'),
    speaker: 'Альберт',
    sceneId: 'albert_backroom',
    contextNote: 'Альберт передаёт конверт с твоим именем — от того, кого уже нет.',
    accessibilityAnnounce: 'Альберт передаёт конверт. Адресат — в библиотеке, у окна на запад.',
    guidanceHint: 'Пронеси конверт через опустевший город.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Улица',
    choices: [
      {
        text: 'Взять конверт — и выйти в город',
        next: 'aaa_epilogue_last_letter_carry',
        goldenPath: true,
        effects: [
          { type: 'triggerQuest', questId: 'aaa_epilogue_last_letter' },
          { type: 'setFlag', flag: 'aaa_last_letter_received', flagValue: true },
          { type: 'addItem', itemId: 'anonymous_letter' },
          { type: 'npcChange', npcId: 'albert', npcChange: { relation: 4 } },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
      {
        text: 'Спросить — от кого письмо',
        next: 'aaa_epilogue_last_letter_carry',
        effects: [
          { type: 'triggerQuest', questId: 'aaa_epilogue_last_letter' },
          { type: 'setFlag', flag: 'aaa_last_letter_received', flagValue: true },
          { type: 'addItem', itemId: 'anonymous_letter' },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'transitionScene', sceneId: 'street_night' },
        ],
      },
      { text: 'Отказаться — это слишком тяжело', next: 'albert_backroom_explore_mode' },
    ],
  },

  aaa_epilogue_last_letter_carry: {
    id: 'aaa_epilogue_last_letter_carry',
    text: [
      'Город после — тише, чем город до. Неон ещё горит, но в нём нет приказа. Дроны спят на подзарядке. Патрулей нет — некому патрулировать. Улицы пустые, как строки в логе после очистки. Только ты и конверт в кармане у сердца — там, где Борис учил носить тетрадь.',
      'Ты идёшь ногами, не приложением. Каждый шаг — медленнее, чем обычно. Город не торопит. Город ждёт — как и адресат. Библиотека впереди. Окно на запад. Тот, кто помнит — там. Ещё помнит.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'street_night',
    contextNote: 'Опустевший город после победы. Конверт несётся к библиотеке.',
    accessibilityAnnounce: 'Город пуст и тих. Библиотека впереди.',
    guidanceHint: 'Найди адресата в библиотеке — у окна на запад.',
    guidanceObjectiveType: 'visit_location',
    guidanceSceneLabel: 'Библиотека',
    effects: [{ type: 'setFlag', flag: 'aaa_last_letter_in_transit', flagValue: true }],
    choices: [
      {
        text: 'Идти в библиотеку — к окну на запад',
        next: 'aaa_epilogue_last_letter_recipient',
        goldenPath: true,
        effects: [
          { type: 'transitionScene', sceneId: 'library_day' },
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
      {
        text: 'Остановиться на скамейке — выдохнуть перед последним рывком',
        next: 'aaa_epilogue_last_letter_recipient',
        effects: [
          { type: 'transitionScene', sceneId: 'library_day' },
          { type: 'addStat', stat: 'stress', value: -4 },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
    ],
  },

  aaa_epilogue_last_letter_recipient: {
    id: 'aaa_epilogue_last_letter_recipient',
    text: [
      'В читальном зале — один человек. Не Катя. Не Тамара. Кто-то, кого ты не видел раньше. Старый, в tweed-пиджаке, с книгой на коленях, которую он не читает — просто держит. Он у окна на запад. Свет падает на книгу. Он не двигается.',
      'Он смотрит, как ты входишь. Кивает — так кивают только те, кто ждал тридцать лет. Ты не знаешь его. Он — знает тебя. По конверту в твоём кармане. «Ты пришёл. Я думал — не дойдёшь. Я каждый день сижу здесь с трёх до четырёх. Жду. Уже — тридцать лет. Он обещал, что письмо дойдёт. Я — верил. Я — верил, как верят в стих, которого не читали.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'В читальном зале — старик у окна на запад. Ждал тридцать лет.',
    accessibilityAnnounce: 'Адресат найден. Старик в библиотеке ждал письмо тридцать лет.',
    guidanceHint: 'Прочти письмо вслух у окна.',
    guidanceObjectiveType: 'make_choice',
    effects: [{ type: 'setFlag', flag: 'aaa_last_letter_at_recipient', flagValue: true }],
    choices: [
      {
        text: 'Прочесть письмо вслух — у окна на запад',
        next: 'aaa_epilogue_last_letter_read',
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'aaa_last_letter_read', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
      },
      {
        text: 'Прочесть про себя — и передать старику',
        next: 'aaa_epilogue_last_letter_read',
        effects: [
          { type: 'setFlag', flag: 'aaa_last_letter_read', flagValue: true },
          { type: 'addSkill', skill: 'empathy', value: 1 },
          { type: 'addStat', stat: 'stress', value: 1 },
        ],
      },
    ],
  },

  aaa_epilogue_last_letter_read: {
    id: 'aaa_epilogue_last_letter_read',
    text: [
      'Ты вскрываешь конверт. Внутри — лист. На листе — коротко. Без даты, без подписи, без адреса. Только — строки:',
      '«Ты не один. Я не дожил. Ты — дожил. Это — несправедливо. Но это — так. Если ты это читаешь — значит, кто-то дошёл. Если кто-то дошёл — значит, Сеть держится. Не на серверах. На — дошедших. Спасибо, что дошёл. Прости, что не с тобой. Следующая строка — твоя. Пиши.»',
      'Старик слушает. Не перебивает. Когда ты дочитываешь, он закрывает книгу на коленях — медленно, как будто кладёт цветок на могилу. «Спасибо. Ты — последний почтальон. Я — последний адресат. Теперь — письмо у меня. Теперь — оно не потеряется. Садись. Посидим. Молча. Молчание — это часть письма.»',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Письмо прочитано вслух. Старик принял его. Молчание — часть письма.',
    accessibilityAnnounce: 'Письмо дочитано. Старик принял его. Просит посидеть молча.',
    guidanceHint: 'Помолчи вместе с тем, кто остался.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'aaa_last_letter_done', flagValue: true },
      { type: 'collectPoem', poemId: 'poem_34' },
    ],
    choices: [
      {
        text: 'Сесть рядом — и молчать, сколько нужно',
        next: 'aaa_epilogue_last_letter_silence',
        goldenPath: true,
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addStat', stat: 'stress', value: -8 },
        ],
      },
      {
        text: 'Сесть рядом — держа его за руку',
        next: 'aaa_epilogue_last_letter_silence',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'npcChange', npcId: 'kate', npcChange: { relation: 6 } },
        ],
      },
    ],
  },

  aaa_epilogue_last_letter_silence: {
    id: 'aaa_epilogue_last_letter_silence',
    text: [
      'Минута молчания. Две. Пять. Семь. На седьмой — старик встаёт, кладёт книгу на стол, уходит. Не оборачиваясь. Не прощаясь. Письмо — у него в кармане. Он уносит его туда, куда уже никто не дойдёт.',
      'Окно на запад. Свет падает на пустой стул. Ты сидишь ещё минуту — одну, последнюю. Потом встаёшь. В кармане — где был конверт — пусто. Но в груди — нет. В груди — строки, которые ты только что прочитал вслух. Они теперь — твои. Ты — последний почтальон. И — первый, кто не потерял.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'library_day',
    contextNote: 'Старик ушёл с письмом. Володька остаётся в читальном зале — у окна на запад.',
    accessibilityAnnounce: 'Письмо доставлено. Старик ушёл. Володька остался — с прочитанными строками.',
    guidanceHint: 'Квест закрыт. Выйди в библиотеку — иди дальше.',
    guidanceObjectiveType: 'complete_quest',
    effects: [
      { type: 'setFlag', flag: 'aaa_last_letter_done', flagValue: true },
      { type: 'addXp', value: 180 },
      { type: 'addKarma', value: 6 },
      { type: 'addStat', stat: 'stress', value: -7 },
      { type: 'npcChange', npcId: 'albert', npcChange: { relation: 15 } },
      { type: 'npcChange', npcId: 'kate', npcChange: { relation: 4 } },
    ],
    choices: [
      {
        text: 'Выйти из библиотеки — в новый город',
        next: 'library_explore_mode',
        effects: [
          { type: 'showThought', thought: 'Я не написал следующую строку. Но я — дошёл. И теперь — знаю, что у каждой строки есть адресат. Даже у тех, которые я ещё не написал.', thoughtDuration: 7000 },
        ],
      },
      {
        text: 'Остаться у окна на запад — ещё минуту',
        next: 'library_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: -5 }],
      },
    ],
  },
};
