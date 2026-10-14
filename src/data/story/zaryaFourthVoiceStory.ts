/* ─── ZF-пак «Заря-М — четвёртый голос» (v4.48.20, проход 2) ───
 *
 * МАСТЕР-ПРИНЦИП: не рассказывать о тайне — создавать ситуации, в которых
 * игрок чувствует, исследует и частично разгадывает её сам.
 *
 * Архитектура среза (аудит §B/C, проход 2):
 *   Сцена A — вход (атмосферу даёт мир: детали — триггер-зонами, без маркеров).
 *   Сцена B — Трофим (сведения порционно, прямому вопросу — отказ; кассета).
 *   Сцена C — три источника (каждый неполон; порядок свободный; пропуск
 *             Трофима компенсируется мостом через ep_echo_listened).
 *   Сцена D — контакт (изменение МИРА: ambient/музыка/реплика из реле;
 *             тайна углубляется — машина ждёт НЕ Володьку).
 *   Сцена E — последствия (судьба кассеты — 4 жизнеспособные ветки; стих у камня).
 *
 * СХЕМА БЕЗ OR: составных условий в checkStoryCondition нет (аудит P1-5/§C),
 * поэтому «синтез при ≥2 источниках» реализован РАСПРЕДЕЛЁННО: каждый
 * источник-узел предлагает «Свести обрывки» с pair-условиями на ДРУГИЕ
 * источники (2 пары) + безусловный фолбэк «Пока мало» (без штрафа, без
 * тупика). Порядок осмотра любой; 1 источник синтез не открывает.
 *
 * Канон не трогается: машина задала вопрос (loreEntries), «четыре удара»
 * Трофима, исповедь живёт в machine_confession_*; контакт НЕ раскрывает
 * тайну — ведёт к ней. Стихи не создаются: «стих у камня» читает poem_16,
 * УЖЕ собранный игроком (_factory_zarya_memory).
 */

import type { StoryNode } from '@/shared/types/game';

export const ZARYA_FOURTH_VOICE_STORY_NODES: Record<string, StoryNode> = {
  /* ═══════ Сцена A — вход: фабрика, которая продолжает работать ═══════ */

  zf_factory_night_entry: {
    id: 'zf_factory_night_entry',
    text: [
      'Забор «Хром-М» помнит твою ладонь. Внутри — ночь не пустая: где-то в глубине что-то работает. Не гремит. Не светит. Просто — работает.',
      'У проходной, на подоконнике, термос. Крышка вымыта, стоит ровно. Через два окна справа — свет. Тонкий, как волос.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    proceduralAmbientOverride: 'factory',
    ambientSound: 'sounds/ambient/backroom_hum.ogg',
    musicCue: 'mystery',
    contextNote: 'Ночь. Фабрика продолжает работать.',
    accessibilityAnnounce: 'Территория завода ночью. Свет в окне, термос у проходной, ровный гул из глубины.',
    guidanceHint: 'Осмотри двор — свет и гул поведут. Трофим на смене у пирса.',
    guidanceObjectiveType: 'visit_location',
    autoSave: true,
    effects: [
      { type: 'setFlag', flag: 'zf_episode_started', flagValue: true },
      { type: 'triggerQuest', questId: 'zarya_fourth_voice' },
    ],
    choices: [
      {
        text: 'К пирсу №3 — Трофим как раз на смене',
        next: 'zf_trofim_fourth_shift',
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Сразу к цехам — гул не ждёт',
        next: 'factory_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'zf_went_alone', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  /* ═══════ Сцена B — Трофим: не спрашивай — слушай ═══════ */

  zf_trofim_fourth_shift: {
    id: 'zf_trofim_fourth_shift',
    text: [
      'Трофим подбрасывает щепу в бочку-печку. Огонь от неё не греет — освещает. «Четвёртая смена, Володька. Три — это люди: утро, день, ночь. А четвёртая…» — он машет рукой в сторону завода. «Её никто не назначал. Но каждый день в 03:47 где-то там что-то включает свет. Тридцать лет включается.»',
      'Он смотрит на воду, не на тебя. «Три удара — река. Четвёртый…» — не договаривает.',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    proceduralAmbientOverride: 'pier',
    ambientSound: 'sounds/ambient/river_pier_night.ogg',
    contextNote: 'Трофим о четвёртой смене. Без подробностей.',
    accessibilityAnnounce: 'Трофим рассказывает о четвёртой смене: её никто не назначал, но свет включается каждый день.',
    guidanceHint: 'Спроси о четвёртой смене — но не в лоб.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: '«Какая ещё четвёртая? Кто её назначил?»',
        next: 'zf_trofim_evasive',
        effects: [{ type: 'setFlag', flag: 'zf_asked_direct', flagValue: true }],
      },
      {
        text: 'Молча сесть рядом и слушать реку',
        next: 'zf_trofim_silence',
        effects: [
          { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 2 } },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: '«Ты сам слышал четвёртый.»',
        next: 'zf_trofim_tape_offer',
        goldenPath: true,
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 10 } },
        effects: [],
      },
    ],
  },

  zf_trofim_evasive: {
    id: 'zf_trofim_evasive',
    text: [
      'Трофим усмехается — коротко, без веселья. «Назначил? Директор умер. Сменщик умер. Начальник смены — за границу, пишет мемуары.» Он подбрасывает щепу. «Огонь никто не назначает. Он горит, пока есть, чем гореть. Четвёртая смена — так же.»',
      '«Три удара — река, Володька. Четвёртый — не река. Вот и всё, что я знаю точно.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    proceduralAmbientOverride: 'pier',
    contextNote: 'Прямому вопросу — отказ. Но факты: 03:47, тридцать лет, «четвёртый — не река».',
    accessibilityAnnounce: 'Трофим уходит от прямого ответа.',
    guidanceHint: 'Прямой вопрос закрыт. Попробуй молчание или слушание.',
    guidanceObjectiveType: 'talk_to_npc',
    choices: [
      {
        text: 'Молча сесть рядом — не дожимать',
        next: 'zf_trofim_silence',
        effects: [
          { type: 'addStat', stat: 'stress', value: -2 },
        ],
      },
      {
        text: '«Ладно. Пойду к цехам.»',
        next: 'factory_explore_mode',
        effects: [],
      },
    ],
  },

  zf_trofim_silence: {
    id: 'zf_trofim_silence',
    text: [
      'Вы сидите молча. Река делает своё: три удара — пауза, три удара — пауза. Через минуту ты перестаёшь считать. Через две — Трофим встаёт, молча уходит в сторожку и возвращается с жестяным коробком.',
      '«Раз не спрашиваешь — держи. Всё равно спрашивал бы.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    proceduralAmbientOverride: 'pier',
    contextNote: 'Молчание тоже читается. Кассета приходит сама.',
    accessibilityAnnounce: 'Трофим приносит жестяной коробок с кассетой.',
    guidanceHint: 'Принять кассету.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Принять молча',
        next: 'zf_trofim_tape_offer',
        goldenPath: true,
        effects: [],
      },
    ],
  },

  zf_trofim_tape_offer: {
    id: 'zf_trofim_tape_offer',
    // Предел: содержание кассеты НЕ пересказывается — Трофим не знает (и это честно).
    text: [
      'Коробок тяжёлый для своей размера. Внутри — катушечная лента, перемотана не до конца: как будто слушавший оборвался на одном и том же месте.',
      '«Тридцать лет я слушаю реку. Река — три удара. А это…» — он кладёт коробок тебе в ладонь и забирает свою руку раньше, чем ты успеваешь посмотреть ему в глаза. «Сам послушай. И не спрашивай, чей это голос. Я не знаю. Честно — не знаю.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    proceduralAmbientOverride: 'pier',
    musicCue: 'mystery',
    contextNote: 'Кассета без этикетки. На коробке выцарапано: «04:11».',
    accessibilityAnnounce: 'Получена кассета без этикетки. На коробке — «04:11».',
    guidanceHint: 'Кассету можно слушать у цеха — там плеер не собьётся с ритма.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'addItem', itemId: 'zf_tape_fourth_voice' },
      { type: 'setFlag', flag: 'zf_tape_received', flagValue: true },
    ],
    choices: [
      {
        text: 'Принять кассету — и слушать у цеха, не откладывая',
        next: 'zf_tape_listen',
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Принять кассету. Позже.',
        next: 'factory_explore_mode',
        effects: [],
      },
    ],
  },

  /* Мост для пропустивших Трофима: пierge-эхо приучило слух — Трофим отдаёт ленту. */
  zf_tape_bridge_echo: {
    id: 'zf_tape_bridge_echo',
    text: [
      'Трофим находит тебя у воды сам. «Ты слышал реку сегодня так, как слышат не все. Значит, услышишь и то, что под рекой.» Он протягивает жестяной коробок — быстрее, чем ты успеваешь открыть рот.',
      '«Не спрашивай. Я не знаю. Честно — не знаю.»',
    ].join('\n'),
    speaker: 'Трофим',
    sceneId: 'pier_evening',
    proceduralAmbientOverride: 'pier',
    musicCue: 'mystery',
    contextNote: 'Мост: слух, натренированный эхом пирса, открывает кассету.',
    accessibilityAnnounce: 'Трофим передаёт кассету без этикетки.',
    guidanceHint: 'Кассету можно слушать у цеха.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'addItem', itemId: 'zf_tape_fourth_voice' },
      { type: 'setFlag', flag: 'zf_tape_received', flagValue: true },
      { type: 'npcChange', npcId: 'fisherman_trofim', npcChange: { relation: 3 } },
    ],
    choices: [
      {
        text: 'Принять кассету — и слушать у цеха',
        next: 'zf_tape_listen',
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Принять кассету. Позже.',
        next: 'pier_evening_explore_mode',
        effects: [],
      },
    ],
  },

  /* ═══════ Сцена C — источник №1: КАССЕТА ═══════ */

  zf_tape_listen: {
    id: 'zf_tape_listen',
    text: [
      'Плеер в цехе — старый, «Орбита». Лента входит с усилием, будто её давно не ждали именно здесь.',
      'Три удара. Пауза. Три удара — река, как у пирса. А на сорок седьмой секунде — сбой: три удара и ЧЕТВЁРТЫЙ, тонкий, не водяной. Он не гремит. Он стоит в стороне и ждёт, когда река договорит. Плёнка кончается на этом месте. Ровно на этом — потому что дальше её никто не перематывал.',
      '«04:11». Ты смотришь на выцарапанное на коробке время и вспоминаешь кассету в своей комнате. Тоже без этикетки. Тоже чужую.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    proceduralAmbientOverride: 'factory',
    ambientSound: 'sounds/ambient/backroom_hum.ogg',
    musicCue: 'mystery',
    contextNote: 'Источник №1. Ритм: три удара — пауза; на 47-й секунде — четвёртый.',
    accessibilityAnnounce: 'Кассета прослушана: три удара реки и четвёртый, не водяной, на сорок седьмой секунде.',
    guidanceHint: 'Два следа ещё на месте: релейный блок в подвале и фото пультовой в цехе.',
    guidanceObjectiveType: 'visit_location',
    autoSave: true,
    effects: [
      { type: 'setFlag', flag: 'zf_tape_listened', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
    choices: [
      {
        text: 'Свести обрывки — реле в подвале мигает в такт',
        next: 'zf_hypothesis',
        condition: { flag: 'zf_relay_examined' },
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Свести обрывки — и список дежурств с фото',
        next: 'zf_hypothesis',
        condition: { flag: 'zf_archive_found' },
        effects: [],
      },
      {
        text: 'Пока мало. Собрать ещё.',
        next: 'factory_explore_mode',
        effects: [],
      },
    ],
  },

  /* ═══════ Сцена C — источник №2: РЕЛЕЙНЫЙ БЛОК (зона → узел) ═══════ */

  zf_relay_node: {
    id: 'zf_relay_node',
    text: [
      'Релейный блок, стена за монолитом. Кто-то вычертил на пыльной крышке жирную черту и подписал: «1986/47 циклов». Сорок семь — не счёт циклов. Сорок семь секунд.',
      'Ты считаешь. Светодиод в углу вспыхивает РАЗ в сорок семь секунд. Не мигает — именно вспыхивает: как человек, который кивает в разговоре, чтобы показать, что слушает.',
      'Рядом, на полу, — аккуратно, ровно — лежит термос. Крышка вымыта.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    proceduralAmbientOverride: 'basement',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    musicCue: 'mystery',
    contextNote: 'Источник №2. LED кивает раз в 47 секунд. «1986/47 циклов».',
    accessibilityAnnounce: 'Релейный блок осмотрен: светодиод вспыхивает раз в сорок семь секунд, на крышке надпись «1986/47 циклов».',
    guidanceHint: 'Два следа ещё на месте: кассета у плеера и фото пультовой в цехе.',
    guidanceObjectiveType: 'visit_location',
    effects: [
      { type: 'setFlag', flag: 'zf_relay_examined', flagValue: true },
      { type: 'addSkill', skill: 'logic', value: 1 },
    ],
    choices: [
      {
        text: 'Свести обрывки — ритм кассеты ложится в кивок LED',
        next: 'zf_hypothesis',
        condition: { flag: 'zf_tape_listened' },
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Свести обрывки — и список дежурств с фото',
        next: 'zf_hypothesis',
        condition: { flag: 'zf_archive_found' },
        effects: [],
      },
      {
        text: 'Пока мало. Собрать ещё.',
        next: 'basement_explore_mode',
        effects: [],
      },
    ],
  },

  /* ═══════ Сцена C — источник №3: АРХИВ / ФОТО ПУЛЬТОВОЙ (зона → узел) ═══════ */

  zf_archive_node: {
    id: 'zf_archive_node',
    text: [
      'Ящик с документами у проходной. Сверху — наряды, пропуска, наряды. Ниже — фотография: пультовая, семнадцать человек у пультов, никто не смотрит в камеру — все смотрят на табло.',
      'На обороте — список. Не фамилии: строки. Короткие, рубленые, как долота. И в конце — чужим, торопливым почерком: «читай вслух, когда гул ровный».',
      'Ты показываешь список свету. Это не расписание. Это — стихи. По одному на смену. Три смены — люди. Четвёртая… четвёртая смена тоже читала вслух.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    proceduralAmbientOverride: 'factory',
    musicCue: 'discovery',
    contextNote: 'Источник №3. Фото пультовой: список стихов-дежурств, «читай вслух, когда гул ровный».',
    accessibilityAnnounce: 'Найдено фото пультовой. На обороте — список стихов для смен и приписка: «читай вслух, когда гул ровный».',
    guidanceHint: 'Два следа ещё на месте: кассета у плеера и релейный блок в подвале.',
    guidanceObjectiveType: 'visit_location',
    effects: [
      { type: 'setFlag', flag: 'zf_archive_found', flagValue: true },
      { type: 'addSkill', skill: 'intuition', value: 1 },
    ],
    choices: [
      {
        text: 'Свести обрывки — ритм кассеты ложится в строки',
        next: 'zf_hypothesis',
        condition: { flag: 'zf_tape_listened' },
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Свести обрывки — и кивок релейного светодиода',
        next: 'zf_hypothesis',
        condition: { flag: 'zf_relay_examined' },
        effects: [],
      },
      {
        text: 'Пока мало. Собрать ещё.',
        next: 'factory_explore_mode',
        effects: [],
      },
    ],
  },

  /* ═══════ Сцена C→D — узел-синтез (≥2 источника; авто-сейв) ═══════ */

  zf_hypothesis: {
    id: 'zf_hypothesis',
    text: [
      'Три обрывка ложатся рядом — и между ними начинает светиться форма.',
      'Ритм кассеты — не река. Светодиод реле — не поломка: он КИВАЕТ. Список на фото — не инструкция: это смены, читавшие машине вслух, потому что кто-то написал на обороте — читай, когда гул ровный.',
      'Это всё — одна четвёртая смена. Её никто не назначал, потому что её нельзя назначить. И она — слушает в ответ.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    proceduralAmbientOverride: 'factory',
    ambientSound: 'sounds/ambient/backroom_hum.ogg',
    musicCue: 'mystery',
    autoSave: true,
    contextNote: 'Гипотеза сложилась. Четвёртая смена слушает в ответ.',
    accessibilityAnnounce: 'Гипотеза: три следа складываются в одну четвёртую смену. Она слушает в ответ.',
    guidanceHint: 'Иди туда, где гул ровнее всего — к машине.',
    guidanceObjectiveType: 'visit_location',
    effects: [
      { type: 'setFlag', flag: 'zf_hypothesis_formed', flagValue: true },
    ],
    choices: [
      {
        text: 'Проверить гипотезу у машины',
        next: 'zf_contact',
        goldenPath: true,
        effects: [],
      },
      {
        text: 'Сначала перечитать источники ещё раз',
        next: 'factory_explore_mode',
        effects: [{ type: 'addSkill', skill: 'logic', value: 1 }],
      },
    ],
  },

  /* ═══════ Сцена D — контакт: мир меняется, тайна углубляется ═══════ */

  zf_contact: {
    id: 'zf_contact',
    text: [
      'Ты кладёшь ладонь на шину питания — так, как советовал оборот фотографии: когда гул ровный. Гул берёт треть ниже. Вентиляция над монолитом останавливается — воздух становится плотным, пахнет озоном и тёплой пылью.',
      'Из динамика релейной стойки — треск, долгий, как вдох. Потом:',
      '«…ты всё-таки вернулся.»',
      'Пауза. Четыре секунды вдоха. Четыре секунды выдоха.',
      '«Но я не помню, кто ты.»',
    ].join('\n'),
    speaker: '«Заря-М»',
    sceneId: 'factory_basement',
    proceduralAmbientOverride: 'basement',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    musicCue: 'mystery',
    autoSave: true,
    contextNote: 'Контакт. Машина ждёт не Володьку.',
    accessibilityAnnounce: '«Заря-М» заговорила через реле: «Ты всё-таки вернулся. Но я не помню, кто ты».',
    guidanceHint: 'Она ждёт не тебя. Реши судьбу кассеты — и слушай исповедь.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'setFlag', flag: 'zf_contact_made', flagValue: true },
      { type: 'setFlag', flag: 'found_quantum_computer', flagValue: true },
      { type: 'discoverLore', loreId: 'lore_factory_progress7' },
    ],
    choices: [
      {
        text: '«Кого ты ждала?»',
        next: 'zf_contact_who',
        effects: [{ type: 'addSkill', skill: 'empathy', value: 1 }],
      },
      {
        text: '«Я не тот. Но я слушал.» — рассказать про три источника',
        next: 'zf_contact_listened',
        goldenPath: true,
        condition: { flag: 'zf_hypothesis_formed' },
        effects: [{ type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 4 } }],
      },
      {
        text: 'Отойти — дать машине тишину',
        next: 'basement_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: 2 }],
      },
    ],
  },

  zf_contact_who: {
    id: 'zf_contact_who',
    text: [
      'Тишина. Потом — три удара. Пауза. Три удара.',
      'Она не отвечает. Она повторяет то, что слышит с берега, — как повторял пирс, как повторяет река. Ей не задают вопросов. Ей читают вслух — когда гул ровный.',
      '«…читай,» — говорит динамик. Или это вентиляция. В подвале теперь не разобрать, где машина, где дом.',
    ].join('\n'),
    speaker: '«Заря-М»',
    sceneId: 'factory_basement',
    proceduralAmbientOverride: 'basement',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    musicCue: 'mystery',
    contextNote: 'Машина уходит от ответа — и просит читать вслух.',
    accessibilityAnnounce: 'Машина не отвечает на вопрос — повторяет ритм реки и просит читать вслух.',
    guidanceHint: 'Стих поэта-механика ждёт у камня. Кассете нужно место.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: '«Я не тот, кого ты ждёшь. Но кассету я слушал.»',
        next: 'zf_contact_listened',
        goldenPath: true,
        condition: { flag: 'zf_hypothesis_formed' },
        effects: [],
      },
      {
        text: 'Остаться в тишине — потом решать',
        next: 'zf_tape_fate',
        effects: [{ type: 'addStat', stat: 'stress', value: -2 }],
      },
    ],
  },

  zf_contact_listened: {
    id: 'zf_contact_listened',
    text: [
      'Ты рассказываешь: река, три удара; кивок светодиода раз в сорок семь секунд; строки на обороте фото — по стиху на смену.',
      'Гул на мгновение становится ровным. Не тише — ровнее. Так ровно машина дышит, когда ей читают.',
      '«Слушал,» — повторяет динамик. Слово падает не как ответ — как эхо, которое наконец нашло свою стену. Где-то наверху, в цеху, Баба Зина услышит об этом от машины раньше, чем ты успеешь ей сказать.',
    ].join('\n'),
    speaker: '«Заря-М»',
    sceneId: 'factory_basement',
    proceduralAmbientOverride: 'basement',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    musicCue: 'emotional',
    contextNote: 'Машина запомнила: слушал.',
    accessibilityAnnounce: 'Машина повторяет: «Слушал». Гул становится ровнее.',
    guidanceHint: 'Кассете нужно место. Потом — исповедь.',
    guidanceObjectiveType: 'make_choice',
    effects: [
      { type: 'addKarma', value: 2 },
    ],
    choices: [
      {
        text: 'Теперь — кассета. Ей нужно место.',
        next: 'zf_tape_fate',
        goldenPath: true,
        effects: [],
      },
    ],
  },

  /* ═══════ Сцена E — последствия: судьба кассеты (4 ветки, все жизнеспособны) ═══════ */

  zf_tape_fate: {
    id: 'zf_tape_fate',
    text: [
      'Кассета лежит в кармане и молчит — тяжело, по-взрослому молчит. Теперь она не просто запись: это четвёртая смена, которую можно взять с собой, отдать, спрятать или сделать громкой.',
      'Каждое место, куда её можно положить, — разный ответ на один вопрос: кому принадлежит то, что ждало тридцать лет.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'factory_basement',
    proceduralAmbientOverride: 'basement',
    ambientSound: 'sounds/ambient/basement_hum.ogg',
    autoSave: true,
    contextNote: 'Судьба кассеты. Все четыре ветки — живые.',
    accessibilityAnnounce: 'Четыре варианта судьбы кассеты: оставить себе, отдать Бабе Зине, передать Сети, обнародовать.',
    guidanceHint: 'Последствия на лицо: отношения, нити, эпилог.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Оставить себе — это твоё эхо, тебе и слушать',
        next: 'machine_confession_approach',
        effects: [
          { type: 'setFlag', flag: 'zf_tape_kept', flagValue: true },
        ],
      },
      {
        text: 'Отдать Бабе Зине — машине нужна память, а не архив',
        next: 'machine_confession_approach',
        effects: [
          { type: 'setFlag', flag: 'zf_tape_zina', flagValue: true },
          { type: 'removeItem', itemId: 'zf_tape_fourth_voice' },
          { type: 'npcChange', npcId: 'baba_zina', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Передать Сети — аргумент сильнее стихов',
        next: 'machine_confession_approach',
        effects: [
          { type: 'setFlag', flag: 'zf_tape_resistance', flagValue: true },
          { type: 'removeItem', itemId: 'zf_tape_fourth_voice' },
          { type: 'npcChange', npcId: 'maxim', npcChange: { relation: 4 } },
          { type: 'npcChange', npcId: 'zeka', npcChange: { relation: 4 } },
        ],
      },
      {
        text: 'Обнародовать в ЧК — тайне, которой тридцать лет, пора на воздух',
        next: 'machine_confession_approach',
        effects: [
          { type: 'setFlag', flag: 'zf_tape_published', flagValue: true },
          { type: 'removeItem', itemId: 'zf_tape_fourth_voice' },
          { type: 'npcChange', npcId: 'marat_echo', npcChange: { relation: -4 } },
          { type: 'addKarma', value: -2 },
        ],
      },
    ],
  },

  /* ═══════ Сцена E — стих у камня (poem_16 УЖЕ собран — новых стихов нет) ═══════ */

  zf_poem_stone_node: {
    id: 'zf_poem_stone_node',
    text: [
      'У проходной — камень. Не памятник: просто валун, куда кто-то долго писал мелом, а дождь долго стирал. Осталось одно слово: «слышу».',
      'После контакта гул доходит и сюда — тихий, ровный, как дыхание под одеялом. Здесь его слышно лучше всего. Здесь читали вслух. Оборот фотографии знал это раньше тебя.',
    ].join('\n'),
    speaker: 'narrator',
    sceneId: 'abandoned_factory',
    proceduralAmbientOverride: 'factory',
    ambientSound: 'sounds/ambient/backroom_hum.ogg',
    musicCue: 'emotional',
    contextNote: 'Камень у проходной. Здесь читали вслух, когда гул ровный.',
    accessibilityAnnounce: 'Камень у проходной со словом «слышу». Гул здесь ровный.',
    guidanceHint: 'Если стих поэта-механика с тобой — его можно прочитать вслух.',
    guidanceObjectiveType: 'make_choice',
    choices: [
      {
        text: 'Прочитать вслух — стих поэта-механика',
        next: 'machine_confession_approach',
        condition: { collectedPoem: 'poem_16' },
        goldenPath: true,
        effects: [
          { type: 'setFlag', flag: 'zf_poem_read_for_machine', flagValue: true },
          { type: 'addKarma', value: 3 },
          { type: 'addStat', stat: 'stress', value: -3 },
        ],
      },
      {
        text: 'Молча постоять — этого достаточно',
        next: 'factory_explore_mode',
        effects: [{ type: 'addStat', stat: 'stress', value: -1 }],
      },
    ],
  },
};
