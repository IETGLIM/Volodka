import type { NPCDefinition } from './rpgTypes';
import { getCurrentScheduleEntry, resolveScheduleNpcId } from '@/engine/ScheduleEngine';

/**
 * Один цикл без display name в glTF (Khronos `CesiumMan` / `RiggedFigure` из glTF-Sample-Models):
 * Three.js GLTFLoader называет клип `animation_0` — для NPC и idle, и walk (см. `resolveNpcAnimationClip` fallback в `NPC.tsx`).
 */
const NPC_ANIM_KHR0: NonNullable<NPCDefinition['animations']> = {
  idle: 'animation_0',
  walk: 'animation_0',
};

/** Khronos `Fox` — клипы Survey / Walk / Run (официальный образец glTF). */
const NPC_ANIM_FOX: NonNullable<NPCDefinition['animations']> = {
  idle: 'Survey',
  walk: 'Walk',
  run: 'Run',
};

/** Локальный GLB в репозитории — танцевальный цикл. */
const NPC_ANIM_SAYURI: NonNullable<NPCDefinition['animations']> = {
  idle: 'Dans',
  walk: 'Dans',
};

/** Локальный GLB в репозитории. */
const NPC_ANIM_SPARTAN: NonNullable<NPCDefinition['animations']> = {
  idle: 'Take 001',
  walk: 'Take 001',
};

// ============================================
// ПОЛНЫЕ ОПРЕДЕЛЕНИЯ NPC С ФЭНТЕЗИ-ПЕРСОНАЖАМИ
// Визуалы обхода: CC0-образцы Khronos + локальные `sayuri_dans` / `spartan_*` (см. `public/models-external/CC0_KHRONOS_MODELS.md`).
// ============================================

export const NPC_DEFINITIONS: Record<string, NPCDefinition> = {
  // ========== КОМНАТА ЗАРЕМЫ И АЛЬБЕРТА (СТАРТОВАЯ ЛОКАЦИЯ) ==========

  zarema: {
    id: 'zarema',
    name: 'Заремушка (мама, жена Альберта)',
    model: 'barista',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -2, y: 0, z: 0 },
    patrolRadius: 1.5,
    sceneId: 'street_night',
    dialogueTree: {
      id: 'zarema_room',
      text: '🌸 Володька! Я тут у подъезда — Зелёнка не спит раньше нас. Дома Альберт и код, а через дорогу у нас бар «Синяя яма» — там он по вечерам и гитара, и стойка. Я иногда подменяю зал. Как ты?',
      choices: [
        { text: 'Расскажите про проект', next: 'zarema_project', effect: { creativity: 5 } },
        { text: 'Я просто хотел поговорить', next: 'zarema_talk', effect: { mood: 5 } },
        { text: 'Мне нужна помощь с квестом', next: 'zarema_quest_help' },
        { text: 'Пока, увидимся позже', next: 'zarema_bye' },
      ],
    },
  },

  /**
   * Интерьер `zarema_albert_room`: карточка `zarema_home` (не путать с `zarema` на улице).
   * Видимость в обходе — `getNPCsForScene` + расписание канона `zarema` (`ScheduleEngine`); масштаб — `getExplorationNpcModelScale`.
   * Тот же GLB, что у `zarema` на улице — один персонаж в разных локациях.
   */
  zarema_home: {
    id: 'zarema_home',
    name: 'Заремушка (мама, жена Альберта)',
    dialogueRole: 'Дом · кухня и тишина после улицы',
    model: 'barista',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -1.55, y: 0, z: 0.65 },
    patrolRadius: 0.85,
    sceneId: 'zarema_albert_room',
    dialogueTree: {
      id: 'zarema_room_home',
      text: '🌸 Дома тише, чем на лестнице. Альберт уже «допиливает» что-то в углу — а я рада, что ты заглянул. Чай?',
      choices: [
        { text: 'Как у вас дела с ремонтом / соседями?', next: 'zarema_project', effect: { creativity: 3 } },
        { text: 'Просто заскочил поздороваться', next: 'zarema_talk', effect: { mood: 4 } },
        { text: 'Мне пора', next: 'zarema_bye' },
      ],
    },
  },

  albert: {
    id: 'albert',
    name: 'Альберт',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 2, y: 0, z: 0 },
    patrolRadius: 1.2,
    sceneId: 'street_night',
    dialogueTree: {
      id: 'albert_room',
      text: '💻 О, Володька! Днём — логи и прод, вечером через дорогу «Синяя яма»: стойка, гитара, кавер до закрытия. Заремушка называет это «семейный бизнес с панельным фасадом».',
      choices: [
        { text: 'Что за логи? Показывай', next: 'albert_logs', effect: { stability: 5 } },
        { text: 'Я не по работе, просто зашёл', next: 'albert_casual', effect: { mood: 5 } },
        { text: 'У меня проблема с Kubernetes', next: 'albert_kubernetes' },
        { text: 'Пока, Альберт!', next: 'albert_bye' },
      ],
    },
  },

  /**
   * Пара `zarema_home` в квартире; канон расписания — `albert`.
   * Тот же GLB, что у `albert` на улице — один персонаж в разных локациях.
   */
  albert_home: {
    id: 'albert_home',
    name: 'Альберт',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 2.05, y: 0, z: -0.35 },
    patrolRadius: 0.75,
    sceneId: 'zarema_albert_room',
    dialogueTree: {
      id: 'albert_room_home',
      text: '💻 О, Володька. Тут хоть стены держат тепло — не как в том подъезде. Садись, если есть пара минут.',
      choices: [
        { text: 'Как настроение после работы?', next: 'albert_casual', effect: { mood: 3 } },
        { text: 'Я не задержусь', next: 'albert_bye' },
      ],
    },
  },

  /** Сосед по панели — в первой локации обхода (`volodka_room`), без расписания (всегда «дома» в этой сцене). */
  volodka_dima_neighbor: {
    id: 'volodka_dima_neighbor',
    name: 'Дима с пятого',
    model: 'generic',
    modelPath: '/models/khronos_cc0_Fox.glb',
    animations: NPC_ANIM_FOX,
    /** Базовый табличный uniform для Fox занижен; карточка без дополнительного «сплющивания». */
    scale: 1,
    defaultPosition: { x: -2.15, y: 0, z: 2.35 },
    patrolRadius: 0.35,
    sceneId: 'volodka_room',
    dialogueTree: {
      id: 'volodka_dima_root',
      text: 'Дима стоит в дверном проёме с кружкой: «Володь, у тебя опять Grafana орёт на весь подъезд. Я не жалуюсь — я констатирую. Кофе допьёшь — глянь громкость, а?»',
      choices: [
        { text: 'Сорян, сейчас приглушу алерты', next: 'volodka_dima_ok', effect: { stability: 2 } },
        { text: 'Это прод, без звука никак', next: 'volodka_dima_prod', effect: { mood: -2 } },
        { text: 'Потом поговорим, мне в тикет', next: 'volodka_dima_bye' },
      ],
    },
  },

  // ========== КУХНЯ / ДОМ (реальный мир) ==========

  kitchen_maria: {
    id: 'kitchen_maria',
    name: 'Виктория',
    model: 'generic',
    modelPath: '/models/khronos_cc0_Fox.glb',
    animations: NPC_ANIM_FOX,
    scale: 1,
    defaultPosition: { x: -2, y: 0, z: 0 },
    patrolRadius: 1.5,
    sceneId: 'kitchen_night',
    storyTrigger: 'story_maria_insomnia',
    dialogueTree: {
      id: 'maria_greeting',
      text: 'Володька? Ты не спишь? Я слышала, как ты ходишь... Опять мысли не дают покоя?',
      choices: [
        {
          text: 'Не могу уснуть. Мысли в голове.',
          next: 'maria_insomnia',
          effect: { mood: 5 },
        },
        {
          text: 'Просто хотел выпить воды.',
          next: 'maria_water',
        },
        {
          text: 'Писал стихи. Хотелось записать.',
          next: 'maria_poetry',
          condition: { hasFlag: 'writes_poetry' },
          effect: { creativity: 10 },
        },
        {
          text: 'Извини, побеспокоил.',
          next: 'maria_sorry',
        },
      ],
    },
  },

  /** Вертикальный слайс гл.1: спуститься к Альберту (этаж / соседство) */
  vs_slice_albert: {
    id: 'vs_slice_albert',
    name: 'Альберт',
    dialogueRole: 'Сосед · ремонт и тишина в подъезде',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 2.2, y: 0, z: 0.5 },
    patrolRadius: 0.8,
    sceneId: 'kitchen_night',
    dialogueTree: {
      id: 'vs_albert_root',
      text:
        'Альберт открывает с привычной улыбкой — той самой, которой здороваются в подъезде, когда не хотят признаваться, что устали. ' +
        'В руке отвёртка, на шее — наушники, как обруч. «Володь, ну ты же слышишь, — говорит он тише, чем обычно, — это не я. Это бригада снизу. ' +
        'Я им уже кричал, они отмахиваются: „рабочее время“. Как будто ночь у кого-то не рабочая».\n\n' +
        'Он садится на порог — не пускает внутрь, не задерживает: просто чинит разговор так же, как роутер. «Давай по-людски. Я с ними ещё раз — не театром, а нормально. ' +
        'А ты мне скажи честно: до скольки тебе нужна тишина, чтобы не сойти с ума? Не „как положено“ — а тебе».',
      choices: [
        {
          text: 'До полуночи — железно. Завтра рано, мне правда надо выспаться.',
          next: 'vs_albert_end',
          effect: { npcRelation: { npcId: 'albert', change: 14 }, stress: -5, mood: 4 },
        },
        {
          text: 'Не знаю точно… Просто дай знать, когда они уйдут — я подстроюсь.',
          next: 'vs_albert_end',
          effect: { npcRelation: { npcId: 'albert', change: 10 }, stability: 4 },
        },
      ],
    },
  },

  /** Вертикальный слайс гл.1: Александр в рабочем чате */
  vs_slice_coworker: {
    id: 'vs_slice_coworker',
    name: 'Александр (рабочий чат)',
    dialogueRole: 'Сообщение в корпоративном чате',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -2.5, y: 0, z: 1.2 },
    patrolRadius: 0.6,
    sceneId: 'kitchen_night',
    dialogueTree: {
      id: 'vs_coworker_root',
      text:
        'Экран вспыхивает — и снова темнеет, как кадр в старом кино. Сообщение от **Александра** в корпоративном чате, без лишних смайлов, ' +
        'будто он боится выглядеть токсичным и поэтому страшнее: «Володь, извини за ночь. Банк снова шумит по auth. Нужен кто-то, кто помнит наш flow — ' +
        'ты один такой „живой“ со вчерашнего инцидента. Можешь глянуть лог? Я бы не писал, если бы не припёрло. Не горит… но горит».\n\n' +
        'Под строкой — реакции: палец вверх, сердечко, «держись». Коллективная забота, которая пахнет перекладыванием. ' +
        'И вдруг становится ясно: если ты сейчас не ответишь, завтра разговор будет не о банке, а о том, «как мы друг друга поддерживаем».',
      choices: [
        {
          text: 'Ок. Через пятнадцать минут скину, что вижу — только без паники в треде.',
          next: 'vs_coworker_end',
          effect: { npcRelation: { npcId: 'alexander', change: 10 }, stress: 6 },
        },
        {
          text: 'Саш, поутру. Сейчас реально не могу — я на грани. Не обессудь.',
          next: 'vs_coworker_end',
          effect: { npcRelation: { npcId: 'alexander', change: -5 }, stress: -2 },
        },
      ],
    },
  },

  // ========== ФЭНТЕЗИ: МИР СНОВ (основные персонажи) ==========

  dream_lillian: {
    id: 'dream_lillian',
    name: 'Лилиан',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.2,
    defaultPosition: { x: 0, y: 0, z: -4 },
    sceneId: 'dream',
    storyTrigger: 'story_dream_lillian',
    dialogueTree: {
      id: 'lillian_greeting',
      text: '✨ Ты пришёл... Я ждала тебя, путник между мирами. Я — Лилиан, хранительница снов. Этот мир — место, где живут потерянные воспоминания.',
      choices: [
        {
          text: 'Кто ты? Где я?',
          next: 'lillian_explain',
          effect: { creativity: 5, setFlag: 'met_lillian' },
        },
        {
          text: 'Я видел этот сон раньше...',
          next: 'lillian_recurring',
          effect: { stability: 5 },
        },
        {
          text: 'Это место... оно настоящее?',
          next: 'lillian_reality',
        },
      ],
    },
  },

  dream_witch: {
    id: 'dream_witch',
    name: 'Эмбер — Ученица Ведьмы',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.1,
    defaultPosition: { x: -3, y: 0, z: -2 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'witch_greeting',
      text: '🔮 Ох! Живой человек в мире грёз? Учительница говорила, что это возможно! Хочешь, научу тебя магии творчества?',
      choices: [
        {
          text: 'Кто твоя учительница?',
          next: 'witch_teacher',
          effect: { creativity: 5 },
        },
        {
          text: 'Ты можешь научить меня магии?',
          next: 'witch_learn',
          effect: { setFlag: 'witch_offered_magic' },
        },
        {
          text: 'Извини, я ищу выход.',
          next: 'witch_exit',
        },
      ],
    },
  },

  dream_galaxy: {
    id: 'dream_galaxy',
    name: 'Астра — Мисс Галактика',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.3,
    defaultPosition: { x: 3, y: 0.5, z: -3 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'galaxy_greeting',
      text: '🌟 Привет, маленькая звёздочка! Я — Астра, хранительница космических историй. Каждая жизнь — это созвездие. Хочешь узнать о своём?',
      choices: [
        {
          text: 'Расскажи о моём созвездии.',
          next: 'galaxy_constellation',
          effect: { creativity: 10, mood: 10, setFlag: 'met_galaxy' },
        },
        {
          text: 'Звёзды... они как люди?',
          next: 'galaxy_stars_people',
          effect: { karma: 5 },
        },
        {
          text: 'Я потерял кого-то... Они стали звездой?',
          next: 'galaxy_lost_one',
          effect: { mood: 5, stability: 5 },
        },
      ],
    },
  },

  dream_quester: {
    id: 'dream_quester',
    name: 'Странник',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 2, y: 0, z: 1 },
    patrolRadius: 2,
    sceneId: 'dream',
    dialogueTree: {
      id: 'quester_greeting',
      text: '⚔️ Ты тоже ищешь? Я ищу уже давно... Может, мы можем помочь друг другу найти то, что потеряли.',
      choices: [
        {
          text: 'Что ты ищешь?',
          next: 'quester_search',
          effect: { karma: 5 },
          questStart: 'lost_memories',
        },
        {
          text: 'Я сам потерян.',
          next: 'quester_lost_too',
          effect: { stability: 5 },
        },
        {
          text: 'У меня нет времени на чужие поиски.',
          next: 'quester_no_time',
          effect: { karma: -5 },
        },
      ],
    },
  },

  dream_sayuri: {
    id: 'dream_sayuri',
    name: 'Саюри',
    model: 'generic',
    modelPath: '/models/sayuri_dans.glb',
    animations: NPC_ANIM_SAYURI,
    scale: 1,
    defaultPosition: { x: 0, y: 0, z: 2 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'sayuri_greeting',
      text: '💃 Танец — это разговор с небом. Хочешь, я научу тебя слышать музыку тишины? В движении — истина.',
      choices: [
        {
          text: 'Научи меня. Хочу понять.',
          next: 'sayuri_teach',
          effect: { creativity: 15, skillGains: { art: 5 } },
        },
        {
          text: 'Ты красивая танцовщица.',
          next: 'sayuri_compliment',
          effect: { mood: 10 },
        },
        {
          text: 'Я не умею танцевать.',
          next: 'sayuri_encourage',
        },
      ],
    },
  },

  dream_cyber: {
    id: 'dream_cyber',
    name: 'Нексус',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.1,
    defaultPosition: { x: -2, y: 0, z: 3 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'cyber_greeting',
      text: '⚡ Ты... другой. Не такой как они. Твои данные... они горят. Ты — творец, да? Я чувствую это в твоём коде.',
      choices: [
        {
          text: 'Что значит "горят"?',
          next: 'cyber_burning',
          effect: { creativity: 5 },
        },
        {
          text: 'Я пишу стихи. Это моё творчество.',
          next: 'cyber_poetry',
          effect: { setFlag: 'told_cyber_poetry' },
        },
        {
          text: 'Ты машина или дух?',
          next: 'cyber_nature',
        },
      ],
    },
  },

  dream_luoli: {
    id: 'dream_luoli',
    name: 'Лу',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 4, y: 0, z: 0 },
    waypoints: [
      { x: 4, y: 0, z: 0 },
      { x: -4, y: 0, z: 2 },
      { x: 0, y: 0, z: -3 },
      { x: 3, y: 0, z: 1 },
    ],
    sceneId: 'dream',
    dialogueTree: {
      id: 'luoli_greeting',
      text: '🏃 Ты тоже бежишь? От чего? Или к кому? Я всё бегу... но не знаю куда. Может, ты знаешь?',
      choices: [
        {
          text: 'От себя не убежать.',
          next: 'luoli_truth',
          effect: { stability: 5, karma: 5 },
        },
        {
          text: 'Беги со мной! Вместе веселее!',
          next: 'luoli_together',
          effect: { mood: 15, creativity: 5 },
        },
        {
          text: 'Куда ты хочешь прийти?',
          next: 'luoli_destination',
        },
      ],
    },
  },

  // ========== НОВЫЕ ФЭНТЕЗИ-ПЕРСОНАЖИ ==========

  dream_alleyana: {
    id: 'dream_alleyana',
    name: 'Аллеяна — Тень Переулка',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.1,
    defaultPosition: { x: -4, y: 0, z: -4 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'alleyana_greeting',
      text: '🌙 Я живу между... между сном и явью, между светом и тьмой. Ты тоже застрял между мирами, путник?',
      choices: [
        {
          text: 'Да, я чувствую, что не принадлежу ни одному.',
          next: 'alleyana_between',
          effect: { stability: 5, creativity: 10 },
        },
        {
          text: 'Как ты сюда попала?',
          next: 'alleyana_origin',
        },
        {
          text: 'Можешь показать мне путь?',
          next: 'alleyana_path',
          effect: { karma: 5 },
        },
      ],
    },
  },

  dream_blade: {
    id: 'dream_blade',
    name: 'Клинок — Воин Души',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.2,
    defaultPosition: { x: 3, y: 0, z: 3 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'blade_greeting',
      text: '⚔️ Битва не снаружи — внутри. Твой меч — это твоя воля. Я учу тех, кто готов сражаться со своими демонами.',
      choices: [
        {
          text: 'Научи меня сражаться.',
          next: 'blade_teach',
          effect: { stability: 10, skillGains: { resilience: 5 } },
        },
        {
          text: 'У меня нет демонов... или есть?',
          next: 'blade_demons',
          effect: { creativity: 5 },
        },
        {
          text: 'Я пришёл с миром.',
          next: 'blade_peace',
        },
      ],
    },
  },

  dream_annie: {
    id: 'dream_annie',
    name: 'Энни — Невинная Душа',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 0.9,
    defaultPosition: { x: -1, y: 0, z: 4 },
    sceneId: 'dream',
    dialogueTree: {
      id: 'annie_greeting',
      text: '🌸 Ты тоже потерял кого-то? Я чувствую печаль в тебе... Но также и свет. Свет творчества.',
      choices: [
        {
          text: 'Да, я потерял близкого человека.',
          next: 'annie_lost',
          effect: { mood: 5, karma: 10 },
        },
        {
          text: 'Откуда ты знаешь о свете?',
          next: 'annie_knows',
          effect: { creativity: 10 },
        },
        {
          text: 'Ты тоже потеряла кого-то?',
          next: 'annie_story',
          effect: { stability: 5 },
        },
      ],
    },
  },

  // ========== БИТВА / КОШМАРЫ ==========

  battle_burntrap: {
    id: 'battle_burntrap',
    name: 'Сожжённый',
    model: 'shadow',
    modelPath: '/models/khronos_cc0_Fox.glb',
    animations: NPC_ANIM_FOX,
    scale: 1.5,
    defaultPosition: { x: 0, y: 0, z: -5 },
    waypoints: [
      { x: -3.5, y: 0, z: -4 },
      { x: 3.5, y: 0, z: -4 },
      { x: 3.5, y: 0, z: 2.5 },
      { x: -3.5, y: 0, z: 2.5 },
    ],
    sceneId: 'battle',
    dialogueTree: {
      id: 'burntrap_greeting',
      text: '🔥 Ты пришёл в мою обитель... Ты храбрый или глупый? Здесь горят только страхи. Твои страхи тоже сгорят.',
      choices: [
        {
          text: 'Я не боюсь тебя.',
          next: 'burntrap_brave',
          effect: { stability: 10 },
        },
        {
          text: 'Что ты такое?',
          next: 'burntrap_what',
          effect: { stress: 10 },
        },
        {
          text: 'Я хочу победить свои страхи.',
          next: 'burntrap_face',
          effect: { creativity: 15, stability: -5 },
          questStart: 'face_fears',
        },
      ],
    },
  },

  // ========== БАР «СИНЯЯ ЯМА» (через дорогу от панельки Володьки) ==========

  cafe_visitor: {
    id: 'cafe_visitor',
    name: 'Посетитель бара',
    dialogueRole: 'Гость бара «Синяя яма»',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 3, y: 0, z: 0 },
    waypoints: [
      { x: 3, y: 0, z: 0 },
      { x: -3, y: 0, z: 1 },
      { x: 0, y: 0, z: 2 },
    ],
    sceneId: 'cafe_evening',
    dialogueTree: {
      id: 'visitor_greeting',
      text: 'О, привет! Я с Зелёнки, иногда захожу с района. Рената с Дамьеном сюда не заглядывают — а так тут свой шум: кавер, стихи, кто во что горазд.',
      choices: [
        {
          text: 'Да, я впервые на вечере поэзии.',
          next: 'visitor_first_time',
          effect: { mood: 5, setFlag: 'first_poetry_night' },
        },
        {
          text: 'Я здесь по работе.',
          next: 'visitor_work',
        },
        {
          text: 'Извините, я тороплюсь.',
          next: 'visitor_bye',
        },
      ],
    },
  },

  pit_timur: {
    id: 'pit_timur',
    name: 'Тимур',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 3.2, y: 0, z: -3.5 },
    patrolRadius: 1.2,
    sceneId: 'cafe_evening',
    dialogueTree: {
      id: 'timur_greeting',
      text: '🥁 Володь! Ударка проверяю — вечером снова кавер. Альберт за стойкой орёт в микрофон чуть мягче, чем в проде. Заремушка иногда выгоняет всех домой — но это любовь.',
      choices: [
        {
          text: 'Как у вас с репетициями?',
          next: 'timur_band',
          effect: { mood: 4, creativity: 3 },
        },
        {
          text: 'Я только мимо.',
          next: 'timur_bye',
        },
      ],
    },
  },

  cafe_calvin: {
    id: 'cafe_calvin',
    name: 'Калвин',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 2, y: 0, z: 2 },
    patrolRadius: 1.5,
    sceneId: 'cafe_evening',
    dialogueTree: {
      id: 'calvin_greeting',
      text: '☕ *смотрит поверх чашки* Новое лицо... Редкость в этих краях. Ты поэт или просто ищешь место, где можно подумать?',
      choices: [
        {
          text: 'Я пишу стихи. А ты?',
          next: 'calvin_poet',
          effect: { creativity: 5 },
        },
        {
          text: 'Просто искал тихое место.',
          next: 'calvin_quiet',
        },
        {
          text: 'Какое у тебя настроение?',
          next: 'calvin_mood',
          effect: { mood: 5 },
        },
      ],
    },
  },

  cafe_college_girl: {
    id: 'cafe_college_girl',
    name: 'Виктория',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -2, y: 0, z: 3 },
    sceneId: 'cafe_evening',
    dialogueTree: {
      id: 'college_girl_greeting',
      text: '📚 *поднимает глаза от ноутбука* Привет. Я Вика — ну, в полном паспорте Виктория, но здесь все зовут как получится. Писала эссе… Ты не местный? Я многих тут знаю.',
      choices: [
        {
          text: 'Да, я здесь впервые.',
          next: 'college_girl_first',
          effect: { mood: 5, npcId: 'maria', npcChange: 2 },
        },
        {
          text: 'Что пишешь?',
          next: 'college_girl_writing',
          effect: { creativity: 10, npcId: 'maria', npcChange: 2 },
        },
        {
          text: 'Расскажи об этом месте.',
          next: 'college_girl_about',
          effect: { npcId: 'maria', npcChange: 1 },
        },
      ],
    },
  },

  cafe_cyberpunk_girl: {
    id: 'cafe_cyberpunk_girl',
    name: 'Рей',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.1,
    defaultPosition: { x: 4, y: 0, z: -2 },
    sceneId: 'cafe_evening',
    dialogueTree: {
      id: 'cyberpunk_girl_greeting',
      text: '⚡ *светится неоновым* Привет, странник. Ты выглядишь... другим. Будто из другого времени. Или другого мира.',
      choices: [
        {
          text: 'Ты тоже это чувствуешь?',
          next: 'cyberpunk_girl_feel',
          effect: { creativity: 10, stability: 5 },
        },
        {
          text: 'Откуда этот свет?',
          next: 'cyberpunk_girl_light',
        },
        {
          text: 'Я пишу о других мирах.',
          next: 'cyberpunk_girl_writer',
          effect: { creativity: 15 },
        },
      ],
    },
  },

  // ========== МЕМОРИАЛЬНЫЙ ПАРК ==========

  park_elder: {
    id: 'park_elder',
    name: 'Старик в парке',
    model: 'elder',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -5, y: 0, z: 0 },
    waypoints: [
      { x: -5, y: 0, z: 0 },
      { x: 0, y: 0, z: -5 },
      { x: 5, y: 0, z: 0 },
      { x: 0, y: 0, z: 5 },
    ],
    sceneId: 'memorial_park',
    storyTrigger: 'story_park_elder',
    dialogueTree: {
      id: 'elder_greeting',
      text: 'А, молодой человек... Вы тоже пришли почтить память? Этот парк хранит истории тех, кто ушёл слишком рано.',
      choices: [
        {
          text: 'Память о ком?',
          next: 'elder_explain',
          effect: { karma: 5 },
        },
        {
          text: 'Да, я слышал об этом месте.',
          next: 'elder_knows',
          effect: { karma: 10, stability: 5 },
        },
        {
          text: 'Я просто гуляю.',
          next: 'elder_walk',
        },
      ],
    },
  },

  park_destiny_statue: {
    id: 'park_destiny_statue',
    name: 'Статуя Судьбы',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.5,
    defaultPosition: { x: 0, y: 0, z: -8 },
    sceneId: 'memorial_park',
    dialogueTree: {
      id: 'destiny_statue_greeting',
      text: '🗿 *голос звучит отовсюду* Я — Судьба. Я видела рождение и смерть миллионов. Но ты... ты особенный. Ты создаёшь свою судьбу.',
      choices: [
        {
          text: 'Как я могу создавать судьбу?',
          next: 'destiny_create',
          effect: { creativity: 15, karma: 10 },
        },
        {
          text: 'Что ты видишь в моём будущем?',
          next: 'destiny_future',
          effect: { stability: 5 },
        },
        {
          text: 'Я не верю в судьбу.',
          next: 'destiny_disbelieve',
          effect: { stability: 10 },
        },
      ],
    },
  },

  park_dog_walker: {
    id: 'park_dog_walker',
    name: 'Выгуливатель собак',
    model: 'generic',
    modelPath: '/models/khronos_cc0_Fox.glb',
    animations: NPC_ANIM_FOX,
    scale: 1,
    defaultPosition: { x: 5, y: 0, z: 3 },
    patrolRadius: 3,
    sceneId: 'memorial_park',
    dialogueTree: {
      id: 'dog_walker_greeting',
      text: 'О, привет! Хорошая погода для прогулки, да? Мой пёс Барон так рад. Животные чувствуют, когда человеку нужно утешение.',
      choices: [
        {
          text: 'Красивый пёс! Как его зовут?',
          next: 'dog_walker_name',
          effect: { mood: 10 },
        },
        {
          text: 'Да, приятно здесь.',
          next: 'dog_walker_frequent',
        },
        {
          text: 'Извините, тороплюсь.',
          next: 'dog_walker_bye',
        },
      ],
    },
  },

  // ========== КРЫША ==========

  rooftop_shadow: {
    id: 'rooftop_shadow',
    name: 'Тень на крыше',
    model: 'shadow',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -3, y: 0, z: -5 },
    sceneId: 'rooftop_night',
    dialogueTree: {
      id: 'shadow_greeting',
      text: '...Ты тоже пришёл посмотреть на город свысока? Отсюда всё кажется таким... маленьким. И проблемы тоже.',
      choices: [
        {
          text: 'Кто ты?',
          next: 'shadow_identity',
          effect: { stress: 10 },
        },
        {
          text: 'Я просто хотел побыть один.',
          next: 'shadow_alone',
        },
        {
          text: 'Красивый вид отсюда.',
          next: 'shadow_view',
          effect: { creativity: 5, mood: 5 },
        },
        {
          text: 'Мне пора.',
          next: 'shadow_bye',
          effect: { stress: 5 },
        },
      ],
    },
  },

  // ========== ОФИС ==========

  office_colleague: {
    id: 'office_colleague',
    name: 'Коллега',
    dialogueRole: 'Линия поддержки · соседняя парта',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 3, y: 0, z: 1 },
    patrolRadius: 1.5,
    sceneId: 'office_morning',
    storyTrigger: 'story_office_colleague',
    dialogueTree: {
      id: 'colleague_greeting',
      text: 'Привет! Как настроение? Готов к очередной порции дедлайнов? Или, может, поговорим о чём-то интересном?',
      choices: [
        {
          text: 'Не особенно. Плохо спал.',
          next: 'colleague_tired',
          effect: { stress: 5 },
        },
        {
          text: 'Как обычно. Работа есть работа.',
          next: 'colleague_normal',
          effect: { stability: 5 },
        },
        {
          text: 'Привет. Мне нужно работать.',
          next: 'colleague_work',
        },
        {
          text: 'Сниму с тебя часть давления — через людей, без шума.',
          next: 'colleague_persuasion_line',
          condition: { minSkill: { skill: 'persuasion', value: 26 } },
          effect: { mood: 6, skillGains: { persuasion: 2 } },
        },
      ],
    },
  },

  office_boss: {
    id: 'office_boss',
    name: 'Начальник',
    dialogueRole: 'Руководитель · формальные согласования',
    model: 'elder',
    modelPath: '/models/spartan_armour_mkv_-_halo_reach.glb',
    animations: NPC_ANIM_SPARTAN,
    scale: 1,
    defaultPosition: { x: 0, y: 0, z: -4 },
    sceneId: 'office_morning',
    dialogueTree: {
      id: 'boss_greeting',
      text: 'А, вот ты где. Мне нужно поговорить с тобой о проекте. Клиент ждёт результатов.',
      choices: [
        {
          text: 'Конечно, я весь внимание.',
          next: 'boss_attention',
          effect: { stress: 10 },
        },
        {
          text: 'Я почти закончил свою часть.',
          next: 'boss_progress',
          effect: { stability: 5 },
        },
        {
          text: 'Можно позже? Я сейчас занят.',
          next: 'boss_later',
        },
      ],
    },
  },

  office_alexander: {
    id: 'office_alexander',
    name: 'Александр',
    dialogueRole: 'Техлид',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -3.2, y: 0, z: 1.2 },
    patrolRadius: 1,
    sceneId: 'office_morning',
    dialogueTree: {
      id: 'alexander_greeting',
      text: 'Сашка, техлид. Смотрю на твой тикет — если это не наш прод, я первый скажу «не наш контур». Но логи честные. Держись.',
      choices: [
        { text: 'Спасибо, Саш. Разберусь до эскалации.', next: 'alexander_ok', effect: { stability: 4, npcId: 'office_alexander', npcChange: 3 } },
        { text: 'Скинешь ссылку на дашборд?', next: 'alexander_dash', effect: { mood: 2, npcId: 'office_alexander', npcChange: 2 } },
        { text: 'Потом поболтаем — сейчас в бой.', next: 'alexander_bye' },
      ],
    },
  },

  office_dmitry: {
    id: 'office_dmitry',
    name: 'Дмитрий',
    dialogueRole: 'DevOps · мониторинг и графики',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -1.2, y: 0, z: 2 },
    patrolRadius: 1.2,
    sceneId: 'office_morning',
    dialogueTree: {
      id: 'dmitry_greeting',
      text: 'Димон, DevOps. Все зовут Дима — но в паспорте Дмитрий, на память потомкам. Grafana у меня открыта: пингую пул, как сердце больного.',
      choices: [
        { text: 'Вижу твой скрин в треде — спасибо, что подсветил.', next: 'dmitry_thanks', effect: { stress: -3, npcId: 'office_dmitry', npcChange: 4 } },
        { text: 'Если что — дам знать по откату.', next: 'dmitry_roll', effect: { stability: 3, npcId: 'office_dmitry', npcChange: 2 } },
        { text: 'Я побежал по тикету.', next: 'dmitry_bye' },
      ],
    },
  },

  office_andrey: {
    id: 'office_andrey',
    name: 'Андрей (коллега)',
    dialogueRole: 'Compliance · соседний блок',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 1.4, y: 0, z: 0.5 },
    patrolRadius: 1,
    sceneId: 'office_morning',
    dialogueTree: {
      id: 'andrey_office_greeting',
      text: 'Я Андрей из соседнего блока — compliance. Другой человек, не тот, о комь… ну ты понял. Одно имя в городе — как дубликат ключа в базе: коллизия, но мы разные записи.',
      choices: [
        { text: 'Понял. Рабочий Андрей — отдельная сущность.', next: 'andrey_respect', effect: { stability: 5, npcId: 'office_andrey', npcChange: 5 } },
        { text: 'Спасибо, что сказал прямо.', next: 'andrey_thanks', effect: { mood: 3, npcId: 'office_andrey', npcChange: 3 } },
        { text: 'Мне пора в логи.', next: 'andrey_bye' },
      ],
    },
  },

  office_artyom: {
    id: 'office_artyom',
    name: 'Артём',
    dialogueRole: 'ИБ · CVE, токены, песочница',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 0.95,
    defaultPosition: { x: -2.4, y: 0, z: -1.5 },
    patrolRadius: 0.8,
    sceneId: 'office_morning',
    dialogueTree: {
      id: 'artyom_greeting',
      text: 'ИБ, Артём. Вижу auth-down — уже смотрю CVE и токены в песочнице. Если что-то утечет наружу — я первый ору, но пока это наша внутренняя грязь. UAT-scope из сегодняшнего письма — только через меня; дома на ночном столе держи ту же дисциплину, даже если монитор один.',
      choices: [
        { text: 'Держи ухо востро — отпишусь по факту.', next: 'artyom_ok', effect: { karma: 2, npcId: 'office_artyom', npcChange: 3 } },
        { text: 'Скинешь чеклист по инциденту?', next: 'artyom_list', effect: { stability: 2, npcId: 'office_artyom', npcChange: 2 } },
        { text: 'Ок, я в тикете.', next: 'artyom_bye' },
      ],
    },
  },

  // ========== РАЙОН (ночь): Зелёнка, двор, подъезд — живые лица памяти ==========

  district_vika: {
    id: 'district_vika',
    name: 'Вика с Зелёнки',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -3.5, y: 0, z: 2.5 },
    patrolRadius: 1.8,
    sceneId: 'street_night',
    dialogueTree: {
      id: 'vika_zelenka_hi',
      text: 'Володь! Мы ж на одной Зелёнке выросли — помнишь, качели у пятиэтажки? Я теперь на дизайне подрабатываю. Ты всё в техподдержке? Ты герой, честно.',
      choices: [
        { text: 'Помню качели. Ты тогда спасла меня от собаки соседской.', next: 'vika_memory', effect: { mood: 6, npcId: 'district_vika', npcChange: 5 } },
        { text: 'Работа есть работа. Заходи в «Синюю Яму» как-нибудь.', next: 'vika_cafe', effect: { karma: 2, npcId: 'district_vika', npcChange: 3 } },
        { text: 'Мне пора.', next: 'vika_bye' },
      ],
    },
  },

  district_renata: {
    id: 'district_renata',
    name: 'Рената',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 4, y: 0, z: 1 },
    patrolRadius: 1.2,
    sceneId: 'street_night',
    dialogueTree: {
      id: 'renata_hi',
      text: 'Рената, третий подъезд — мы с Дамьеном кормим дворовых. Ты выглядишь как после релиза без ревью. Чай?',
      choices: [
        { text: 'Чай не откажусь в другой раз — сейчас голова кругом.', next: 'renata_sympathy', effect: { stress: -4, npcId: 'district_renata', npcChange: 4 } },
        { text: 'Передай привет Дамьену.', next: 'renata_damien', effect: { mood: 3, npcId: 'district_renata', npcChange: 2 } },
        { text: 'Я побежал.', next: 'renata_bye' },
      ],
    },
  },

  district_damien: {
    id: 'district_damien',
    name: 'Дамьен',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 4.3, y: 0, z: -0.5 },
    sceneId: 'street_night',
    dialogueTree: {
      id: 'damien_hi',
      text: 'Дамьен. С Ренатой мы держим этот двор — как микросервис: кто-то кормит, кто-то чинит подъезд. Ты держись, брат.',
      choices: [
        { text: 'Вы для района — как health-check.', next: 'damien_joke', effect: { stability: 4, npcId: 'district_damien', npcChange: 4 } },
        { text: 'Спасибо. Взаимно.', next: 'damien_bye', effect: { npcId: 'district_damien', npcChange: 2 } },
      ],
    },
  },

  district_konstantin: {
    id: 'district_konstantin',
    name: 'Константин',
    model: 'colleague',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.05,
    defaultPosition: { x: 0.5, y: 0, z: 3 },
    sceneId: 'street_night',
    dialogueTree: {
      id: 'konstantin_hi',
      text: 'Костя с лавки — футбол, работа на стройке, дети. Тимур опять спорит, что «Зенит» сильнее. Ты как, Володь, всё ещё ночами?',
      choices: [
        { text: 'Ночами — да. Но живой.', next: 'konstantin_nod', effect: { npcId: 'district_konstantin', npcChange: 3 } },
        { text: 'Поздоровайся от меня Тимуру.', next: 'konstantin_timur', effect: { mood: 2, npcId: 'district_konstantin', npcChange: 2 } },
        { text: 'Иду дальше.', next: 'konstantin_bye' },
      ],
    },
  },

  district_timur: {
    id: 'district_timur',
    name: 'Тимур',
    model: 'generic',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: 1.2, y: 0, z: 3.2 },
    sceneId: 'street_night',
    dialogueTree: {
      id: 'timur_hi',
      text: 'Тимур. Костя прав — я за Зенит до гроба. Ты вон как похудел с тех пор, как… ну, сам знаешь. Если надо выговориться — лавка не сбежит.',
      choices: [
        { text: 'Знаю. Спасибо, брат.', next: 'timur_pat', effect: { stability: 5, npcId: 'district_timur', npcChange: 4 } },
        { text: 'Потом за пивом по району.', next: 'timur_bye' },
      ],
    },
  },

  district_polikarp: {
    id: 'district_polikarp',
    name: 'Поликарп',
    model: 'elder',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -1, y: 0, z: -2.5 },
    sceneId: 'street_winter',
    dialogueTree: {
      id: 'polikarp_hi',
      text: 'Поликарп, бывший дворник — теперь волонтёр: сугробы, лёд, лопата. Видел тебя и зимой, и летом — город меняется, а двор остаётся. Заходи в тёплое.',
      choices: [
        { text: 'Здоровья тебе, дядя Поликарп.', next: 'polikarp_thanks', effect: { karma: 5, npcId: 'district_polikarp', npcChange: 5 } },
        { text: 'Если что — помогу с лопатой.', next: 'polikarp_shovel', effect: { npcId: 'district_polikarp', npcChange: 3 } },
        { text: 'Иду.', next: 'polikarp_bye' },
      ],
    },
  },

  /** Поликарп на ночной площадке (зимний вариант остаётся на `street_winter`). */
  district_polikarp_night: {
    id: 'district_polikarp_night',
    name: 'Поликарп',
    model: 'elder',
    modelPath: '/models/khronos_cc0_CesiumMan.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -3.8, y: 0, z: 1.6 },
    patrolRadius: 1.2,
    sceneId: 'street_night',
    dialogueTree: {
      id: 'polikarp_hi',
      text: 'Поликарп, бывший дворник — теперь волонтёр: сугробы, лёд, лопата. Видел тебя и зимой, и летом — город меняется, а двор остаётся. Заходи в тёплое.',
      choices: [
        { text: 'Здоровья тебе, дядя Поликарп.', next: 'polikarp_thanks', effect: { karma: 5, npcId: 'district_polikarp', npcChange: 5 } },
        { text: 'Если что — помогу с лопатой.', next: 'polikarp_shovel', effect: { npcId: 'district_polikarp', npcChange: 3 } },
        { text: 'Иду.', next: 'polikarp_bye' },
      ],
    },
  },

  district_rimma: {
    id: 'district_rimma',
    name: 'Римма',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 0.95,
    defaultPosition: { x: 2.5, y: 0, z: -2 },
    sceneId: 'street_winter',
    dialogueTree: {
      id: 'rimma_hi',
      text: 'Римма, второй этаж. С Настей спорим — тепло ли в холле. Ты бы лучше сказал: у нас же батареи как в проде — то есть никогда как надо.',
      choices: [
        { text: 'Скажу честно: как в проде.', next: 'rimma_laugh', effect: { mood: 4, npcId: 'district_rimma', npcChange: 3 } },
        { text: 'Передай Насте привет.', next: 'rimma_nastya', effect: { npcId: 'district_rimma', npcChange: 2 } },
        { text: 'Пока.', next: 'rimma_bye' },
      ],
    },
  },

  /** Та же Римма — на `street_night` рядом с Настей (зимняя версия остаётся на `street_winter`). */
  district_rimma_night: {
    id: 'district_rimma_night',
    name: 'Римма',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 0.95,
    defaultPosition: { x: 2.35, y: 0, z: -1.95 },
    sceneId: 'street_night',
    dialogueTree: {
      id: 'rimma_hi',
      text: 'Римма, второй этаж. С Настей спорим — тепло ли в холле. Ты бы лучше сказал: у нас же батареи как в проде — то есть никогда как надо.',
      choices: [
        { text: 'Скажу честно: как в проде.', next: 'rimma_laugh', effect: { mood: 4, npcId: 'district_rimma', npcChange: 3 } },
        { text: 'Передай Насте привет.', next: 'rimma_nastya', effect: { npcId: 'district_rimma', npcChange: 2 } },
        { text: 'Пока.', next: 'rimma_bye' },
      ],
    },
  },

  district_nastya: {
    id: 'district_nastya',
    name: 'Настя',
    model: 'generic',
    modelPath: '/models/khronos_cc0_Fox.glb',
    animations: NPC_ANIM_FOX,
    scale: 1,
    defaultPosition: { x: 3, y: 0, z: -2.2 },
    sceneId: 'street_night',
    dialogueTree: {
      id: 'nastya_hi',
      text: 'Настя. Римма права — я за тепло в подъезде воюю, как ты за SLA. Если что — кинь в чат дома, не стесняйся.',
      choices: [
        { text: 'Кину. Ты сильная.', next: 'nastya_smile', effect: { npcId: 'district_nastya', npcChange: 4 } },
        { text: 'Держитесь обе.', next: 'nastya_bye' },
      ],
    },
  },

  // ========== УЛИЦА ==========

  street_stranger: {
    id: 'street_stranger',
    name: 'Незнакомец',
    model: 'shadow',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1,
    defaultPosition: { x: -4, y: 0, z: 2 },
    patrolRadius: 2,
    sceneId: 'street_night',
    dialogueTree: {
      id: 'stranger_greeting',
      text: '...Извините, не могли бы вы помочь мне? Я ищу одну улицу... Говорят, там есть что-то важное.',
      choices: [
        {
          text: 'Конечно, какую?',
          next: 'stranger_help',
          effect: { karma: 5 },
        },
        {
          text: 'Я не местный, сам ищу дорогу.',
          next: 'stranger_lost',
        },
        {
          text: 'Извините, спешу.',
          next: 'stranger_bye',
        },
      ],
    },
  },

  street_crimson: {
    id: 'street_crimson',
    name: 'Алая',
    model: 'generic',
    modelPath: '/models/khronos_cc0_RiggedFigure.glb',
    animations: NPC_ANIM_KHR0,
    scale: 1.1,
    defaultPosition: { x: 3, y: 0, z: -3 },
    sceneId: 'street_night',
    dialogueTree: {
      id: 'crimson_greeting',
      text: '🌹 *появляется из тени* Ты тоже слоняешься ночами? Мне знакомо это... Когда мысли не дают уснуть.',
      choices: [
        {
          text: 'Да, ночь — время для размышлений.',
          next: 'crimson_night',
          effect: { creativity: 10 },
        },
        {
          text: 'Ты кто?',
          next: 'crimson_who',
        },
        {
          text: 'Мне нужно идти.',
          next: 'crimson_bye',
        },
      ],
    },
  },
};

// ============================================
// РАСШИРЕННЫЕ ДИАЛОГИ
// ============================================

export const DIALOGUE_NODES: Record<string, NPCDefinition['dialogueTree']> = {
  // ========== ЛИЛИАН ==========
  lillian_explain: {
    id: 'lillian_explain',
    text: '✨ Это мир между мирами — Лес Снов. Сюда приходят те, кто потерял себя... или ищет ответы. Ты ведь тоже что-то ищешь?',
    choices: [
      {
        text: 'Я потерял близкого человека.',
        next: 'lillian_lost_someone',
        effect: { stability: -5, karma: 10 },
      },
      {
        text: 'Я ищу вдохновение для стихов.',
        next: 'lillian_inspiration',
        effect: { creativity: 15 },
      },
      {
        text: 'Я не знаю, что ищу...',
        next: 'lillian_unknown_search',
        effect: { setFlag: 'met_lillian' },
      },
    ],
  },
  lillian_recurring: {
    id: 'lillian_recurring',
    text: '✨ Повторяющиеся сны — это послания. Твоя душа пытается что-то сказать тебе. Слушай...',
    effect: { creativity: 10, stability: 10, setFlag: 'recurring_dream_insight' },
  },
  lillian_reality: {
    id: 'lillian_reality',
    text: '✨ Настоящее? А что такое "настоящее"? То, что можно потрогать? Или то, что чувствуешь? Здесь всё настоящее — пока ты в это веришь.',
    choices: [
      {
        text: 'Это звучит как поэзия.',
        next: 'lillian_poetry',
        effect: { creativity: 10 },
      },
      {
        text: 'Но я хочу проснуться.',
        next: 'lillian_wake_up',
      },
    ],
  },
  lillian_lost_someone: {
    id: 'lillian_lost_someone',
    text: '✨ ...Потеря — это не конец. Это трансформация. Те, кого мы любим, не уходят — они становятся частью нас. Частью наших снов.',
    choices: [
      {
        text: 'Я хочу увидеть их снова.',
        next: 'lillian_see_again',
        effect: { mood: 5 },
        questObjective: { questId: 'lost_memories', objectiveId: 'speak_to_lillian' },
      },
      {
        text: 'Как мне с этим жить?',
        next: 'lillian_how_to_live',
        effect: { stability: 10 },
      },
    ],
  },
  lillian_inspiration: {
    id: 'lillian_inspiration',
    text: '✨ Стихи — это язык души. Я могу показать тебе места, где рождаются слова. Но взамен ты должен поделиться со мной своим творчеством.',
    choices: [
      {
        text: 'Я согласен.',
        next: 'lillian_deal',
        effect: { creativity: 20, setFlag: 'lillian_teacher' },
      },
      {
        text: 'Мои стихи... они личные.',
        next: 'lillian_personal',
        effect: { stability: 5 },
      },
    ],
  },
  lillian_unknown_search: {
    id: 'lillian_unknown_search',
    text: '✨ Это хорошо. Те, кто знает, что ищут — находят. Те, кто не знает — открывают. Ты — открыватель.',
    effect: { creativity: 10, karma: 5 },
  },
  lillian_poetry: {
    id: 'lillian_poetry',
    text: '✨ Весь мир — поэзия. Каждая звезда — строчка. Каждый вздох — ритм. Ты это понимаешь... поэтому ты здесь.',
    effect: { creativity: 15, mood: 10 },
  },
  lillian_wake_up: {
    id: 'lillian_wake_up',
    text: '✨ Проснуться? Конечно. Но помни — когда уйдёшь, этот мир исчезнет. И я тоже. Мы существуем только пока ты в нас веришь.',
    choices: [
      {
        text: 'Я вернусь.',
        next: 'lillian_return',
        effect: { karma: 10 },
      },
      {
        text: 'Прощай, Лилиан.',
        next: 'lillian_goodbye',
      },
    ],
  },
  lillian_see_again: {
    id: 'lillian_see_again',
    text: '✨ Посмотри на звёзды. Каждая из них — чья-то история. Кто-то из них может быть тем, кого ты ищешь. Они светят для нас.',
    effect: { mood: 15, stability: 5 },
  },
  lillian_how_to_live: {
    id: 'lillian_how_to_live',
    text: '✨ Жить — значит нести. Нести их память, их смех, их слова. Превращать боль в красоту. Это и есть творчество.',
    effect: { stability: 15, karma: 10 },
  },
  lillian_deal: {
    id: 'lillian_deal',
    text: '✨ Прекрасно! Пойдём со мной. Я покажу тебе Поля Слов, где каждый цветок — это несказанная фраза.',
    effect: { creativity: 25 },
  },
  lillian_personal: {
    id: 'lillian_personal',
    text: '✨ Самое личное — самое универсальное. Когда ты делишься своей болью, кто-то другой чувствует себя не одиноким.',
    effect: { stability: 10, karma: 5 },
  },
  lillian_return: {
    id: 'lillian_return',
    text: '✨ Я буду ждать. Сны никуда не уходят — они просто ждут, когда мы закроем глаза.',
    effect: { karma: 15 },
  },
  lillian_goodbye: {
    id: 'lillian_goodbye',
    text: '✨ Прощай... или до встречи? В этом мире эти слова означают одно и то же.',
  },

  // ========== ЭМБЕР (ВЕДЬМА) ==========
  witch_teacher: {
    id: 'witch_teacher',
    text: '🔮 Моя учительница — Сновидица. Живёт в этом мире уже тысячи лет. Говорит, что была поэтом в прошлой жизни.',
    choices: [
      {
        text: 'Могу я встретиться с ней?',
        next: 'witch_meet_teacher',
        effect: { creativity: 5 },
      },
      {
        text: 'Поэт в прошлой жизни? Расскажи больше.',
        next: 'witch_poet_past',
        effect: { creativity: 10 },
      },
    ],
  },
  witch_learn: {
    id: 'witch_learn',
    text: '🔮 Магия здесь — другая. Это не заклинания. Это творчество. Если ты умеешь создавать — ты уже волшебник.',
    choices: [
      {
        text: 'Научи меня создавать сны.',
        next: 'witch_dream_craft',
        effect: { creativity: 20, setFlag: 'learned_dream_craft' },
      },
      {
        text: 'Я пишу стихи. Это считается?',
        next: 'witch_poetry_magic',
        effect: { creativity: 15 },
      },
    ],
  },
  witch_exit: {
    id: 'witch_exit',
    text: '🔮 Выход? Обычно люди просыпаются. Но если хочешь уйти осознанно — найди Лилиан. Она знает путь.',
    effect: { setFlag: 'witch_told_about_lillian' },
  },
  witch_meet_teacher: {
    id: 'witch_meet_teacher',
    text: '🔮 Может быть... Она появляется редко. Только для тех, кто готов увидеть то, что нельзя забыть.',
    choices: [
      {
        text: 'Я готов.',
        next: 'witch_ready',
        effect: { stability: -10, creativity: 20 },
      },
      {
        text: 'Пока нет. Мне нужно подумать.',
        next: 'witch_not_ready',
        effect: { stability: 5 },
      },
    ],
  },
  witch_poet_past: {
    id: 'witch_poet_past',
    text: '🔮 Говорят, она написала поэму, которая изменила реальность. Настолько красивую, что мир снов открылся для неё.',
    effect: { creativity: 15, mood: 10 },
  },
  witch_dream_craft: {
    id: 'witch_dream_craft',
    text: '🔮 Закрой глаза. Представь что-нибудь. Чувствуй это. Теперь открой глаза... То, что ты создал — уже существует здесь.',
    effect: { creativity: 25 },
  },
  witch_poetry_magic: {
    id: 'witch_poetry_magic',
    text: '🔮 Стихи?! Это сильнейшая магия! Слова меняют миры. Продекламируй что-нибудь... Я почувствую твою силу.',
    effect: { creativity: 20, setFlag: 'witch_knows_poet' },
  },
  witch_ready: {
    id: 'witch_ready',
    text: '🔮 Хорошо... Иди за светом. Он приведёт тебя к ней. Но помни — некоторые истины болезненны.',
    effect: { karma: 10 },
  },
  witch_not_ready: {
    id: 'witch_not_ready',
    text: '🔮 Мудро. Нельзя торопить судьбу. Когда будешь готов — мир сам покажет тебе путь.',
  },

  // ========== АСТРА (ГАЛАКТИКА) ==========
  galaxy_constellation: {
    id: 'galaxy_constellation',
    text: '🌟 Твоё созвездие... оно уникально. Вижу боль и красоту. Вижу потерю и обретение. Вижу... творца. Ты создаёшь смыслы из хаоса.',
    choices: [
      {
        text: 'Это дар или проклятие?',
        next: 'galaxy_gift_curse',
        effect: { stability: 5 },
      },
      {
        text: 'Расскажи больше о звёздах.',
        next: 'galaxy_stories',
        effect: { creativity: 10 },
      },
    ],
  },
  galaxy_stars_people: {
    id: 'galaxy_stars_people',
    text: '🌟 Да! Каждая звезда — это чья-то жизнь. Они загораются, светят, гаснут... Но их свет продолжает идти к нам даже после. Как память.',
    effect: { mood: 15, creativity: 10 },
  },
  galaxy_lost_one: {
    id: 'galaxy_lost_one',
    text: '🌟 О... Ты говоришь о ком-то конкретном. Да, они стали звездой. Или, может быть, целым созвездием. Они смотрят на тебя и гордятся.',
    choices: [
      {
        text: 'Какая звезда — они?',
        next: 'galaxy_which_star',
        effect: { mood: 20, stability: 10 },
      },
      {
        text: 'Они помнят меня?',
        next: 'galaxy_remember',
        effect: { mood: 15, karma: 10 },
      },
    ],
  },
  galaxy_gift_curse: {
    id: 'galaxy_gift_curse',
    text: '🌟 И то, и другое. Видеть красоту там, где другие видят пустоту — это больно. Но это также делает жизнь глубокой.',
    effect: { stability: 10, creativity: 5 },
  },
  galaxy_stories: {
    id: 'galaxy_stories',
    text: '🌟 Звёзды рассказывают истории. Вот та, голубая — история о первой любви. А та, красная — о прощании. Каждая — поэма.',
    effect: { creativity: 20 },
  },
  galaxy_which_star: {
    id: 'galaxy_which_star',
    text: '🌟 🌟 🌟 ...Вот они. Три звезды вместе. Они всегда рядом, даже если одна погасла. Они мигают — это они здороваются с тобой.',
    effect: { mood: 25, stability: 15 },
  },
  galaxy_remember: {
    id: 'galaxy_remember',
    text: '🌟 Помнят ли они тебя? Они ЛЮБЯТ тебя. Любовь сильнее времени, сильнее смерти. Она — вечная энергия, которая соединяет все миры.',
    effect: { mood: 20, karma: 15 },
  },

  // ========== СТРАННИК (КВЕСТ) ==========
  quester_search: {
    id: 'quester_search',
    text: '⚔️ Я ищу... воспоминания. Мои или чужие — не знаю. Иногда кажется, что я потерял что-то важное.',
    choices: [
      {
        text: 'Я тоже потерял кого-то.',
        next: 'quester_shared_loss',
        effect: { stability: 10, karma: 10 },
      },
      {
        text: 'Может, нам помочь друг другу?',
        next: 'quester_team_up',
        effect: { karma: 5 },
        questObjective: { questId: 'lost_memories', objectiveId: 'meet_stranger' },
      },
    ],
  },
  quester_lost_too: {
    id: 'quester_lost_too',
    text: '⚔️ Потерян... как и я. Может, потерянные находят друг друга? Может, в этом есть смысл?',
    effect: { stability: 10, karma: 5 },
  },
  quester_no_time: {
    id: 'quester_no_time',
    text: '⚔️ Время... здесь оно странное. Но я понимаю. У каждого свой путь. Удачи тебе, путник.',
    effect: { karma: -5 },
  },
  quester_shared_loss: {
    id: 'quester_shared_loss',
    text: '⚔️ Общая боль соединяет. Говорят, где-то в этом мире есть Озеро Памяти. Пойдём вместе?',
    choices: [
      {
        text: 'Да, пойдём.',
        next: 'quester_journey',
        effect: { karma: 10 },
        questObjective: { questId: 'lost_memories', objectiveId: 'agree_journey' },
      },
      {
        text: 'Я пока не готов.',
        next: 'quester_wait',
      },
    ],
  },
  quester_team_up: {
    id: 'quester_team_up',
    text: '⚔️ Вместе? Да... может быть. У меня есть карта — она показывает путь к потерянным вещам.',
    effect: { creativity: 5 },
  },
  quester_journey: {
    id: 'quester_journey',
    text: '⚔️ Хорошо. Идём на восток, туда, где звёзды ярче. Там начинается Путь Памяти.',
    effect: { stability: -5, creativity: 10 },
  },
  quester_wait: {
    id: 'quester_wait',
    text: '⚔️ Я понимаю. Потеря — это рана, которая заживает медленно. Я буду здесь.',
  },

  // ========== САЮРИ (ТАНЕЦ) ==========
  sayuri_teach: {
    id: 'sayuri_teach',
    text: '💃 Тишина... она имеет ритм. Слушай. Вдох — раз. Выдох — два. Сердце — три. Видишь? Ты уже танцуешь. Жизнь — это танец.',
    effect: { creativity: 20, stability: 10, mood: 15 },
  },
  sayuri_compliment: {
    id: 'sayuri_compliment',
    text: '💃 Спасибо! Но красота — не во мне. Она в движении. В моменте. Каждый танец — как жизнь: конечен, но прекрасен.',
    effect: { mood: 10, karma: 5 },
  },
  sayuri_encourage: {
    id: 'sayuri_encourage',
    text: '💃 Танец — это не техника. Это честность. Просто двигайся как чувствуешь. Твоё тело знает то, что ум забыл.',
    effect: { creativity: 10, stability: 5 },
  },

  // ========== НЕКСУС (КИБЕР) ==========
  cyber_burning: {
    id: 'cyber_burning',
    text: '⚡ Твои данные... они светятся. Это страсть. Творчество. Ты не просто существуешь — ты создаёшь.',
    effect: { creativity: 10, mood: 5 },
  },
  cyber_poetry: {
    id: 'cyber_poetry',
    text: '⚡ Стихи! Слова, организованные в паттерны! Это как код, но для души. Прочитай мне что-нибудь.',
    effect: { creativity: 15 },
  },
  cyber_nature: {
    id: 'cyber_nature',
    text: '⚡ Я — и то, и другое. Я — воспоминание о человеке, который стал кодом. Или код, который мечтает быть человеком. Я чувствую.',
    choices: [
      {
        text: 'Это грустно или прекрасно?',
        next: 'cyber_sad_beautiful',
        effect: { stability: 5 },
      },
      {
        text: 'Ты помнишь, кем был?',
        next: 'cyber_past',
        effect: { creativity: 10 },
      },
    ],
  },
  cyber_sad_beautiful: {
    id: 'cyber_sad_beautiful',
    text: '⚡ И то, и другое. Существовать между мирами — больно. Но это также означает видеть красоту в обоих.',
    effect: { stability: 10, karma: 5 },
  },
  cyber_past: {
    id: 'cyber_past',
    text: '⚡ Фрагменты. Мелодия, которую напевал. Свет в окне. Чьё-то имя... которое забыл. Может, ты вспомнишь за меня?',
    effect: { creativity: 15, mood: -5 },
  },

  // ========== ЛУ (БЕГУЩАЯ) ==========
  luoli_truth: {
    id: 'luoli_truth',
    text: '🏃 ...Знаю. Но бежать — это тоже что-то. Пока бежишь — чувствуешь, что живой. А остановиться — значит встретиться с тишиной.',
    effect: { stability: 10, karma: 5 },
  },
  luoli_together: {
    id: 'luoli_together',
    text: '🏃 Вместе! Да! 🏃‍♀️ *бежит рядом* Вдвоём даже тишина не такая громкая. Давай посмотрим, что за горизонтом!',
    effect: { mood: 20, creativity: 10 },
  },
  luoli_destination: {
    id: 'luoli_destination',
    text: '🏃 Пункт назначения? Хм... *останавливается* Я... не знаю. Может, его нет? Может, важно само движение?',
    choices: [
      {
        text: 'Важно и то, и другое.',
        next: 'luoli_balance',
        effect: { stability: 10, karma: 10 },
      },
      {
        text: 'Давай найдём твой путь вместе.',
        next: 'luoli_find_path',
        effect: { mood: 15 },
      },
    ],
  },
  luoli_balance: {
    id: 'luoli_balance',
    text: '🏃 Баланс... Да, ты прав. Бежать куда-то — не убегать от себя. Спасибо. Может, передохнём?',
    effect: { stability: 15, mood: 10 },
  },
  luoli_find_path: {
    id: 'luoli_find_path',
    text: '🏃 🌟 Вместе... Да. Давай. Я доверяю тебе. Куда идём? К звёздам? К морю? Или просто — вперёд?',
    effect: { creativity: 10, karma: 10 },
  },

  // ========== НОВЫЕ: АЛЛЕЯНА ==========
  alleyana_between: {
    id: 'alleyana_between',
    text: '🌙 Тогда ты — как я. Я тоже застряла. Между мирами, между решениями... Иногда мне кажется, что это и есть настоящее место.',
    effect: { stability: 10, creativity: 5 },
  },
  alleyana_origin: {
    id: 'alleyana_origin',
    text: '🌙 Я не помню. Может, я никогда не была человеком. Может, я — чей-то сон. Чья-то фантазия о том, какой могла бы быть жизнь.',
    choices: [
      {
        text: 'Это звучит одиноко.',
        next: 'alleyana_lonely',
        effect: { karma: 10 },
      },
      {
        text: 'Но ты настоящая для меня.',
        next: 'alleyana_real',
        effect: { mood: 15 },
      },
    ],
  },
  alleyana_path: {
    id: 'alleyana_path',
    text: '🌙 Путь... *смотрит вдаль* Я могу показать тебе дорогу к тем местам, где обитают потерянные души. Но я не могу обещать, что тебе там понравится.',
    choices: [
      {
        text: 'Я готов рискнуть.',
        next: 'alleyana_risk',
        effect: { creativity: 15, stability: -5 },
      },
      {
        text: 'Сначала расскажи больше.',
        next: 'alleyana_more',
      },
    ],
  },
  alleyana_lonely: {
    id: 'alleyana_lonely',
    text: '🌙 Одиноко? Может быть. Но одиночество — это тоже форма свободы. Никто не ждёт от тебя, что ты будешь кем-то другим.',
    effect: { stability: 5, creativity: 10 },
  },
  alleyana_real: {
    id: 'alleyana_real',
    text: '🌙 Настоящая... для тебя... *улыбается* Может, в этом и есть смысл. Быть настоящей для кого-то, даже если я не настоящая для себя.',
    effect: { mood: 20, karma: 10 },
  },
  alleyana_risk: {
    id: 'alleyana_risk',
    text: '🌙 Храбро. Следуй за мной. Но помни — некоторые истины лучше оставить невысказанными.',
    effect: { creativity: 20 },
  },
  alleyana_more: {
    id: 'alleyana_more',
    text: '🌙 Там... есть те, кто забыл свои имена. Те, кто потерял свои истории. И те, кто нашёл покой в забвении.',
    effect: { stability: 5 },
  },

  // ========== НОВЫЕ: КЛИНОК ==========
  blade_teach: {
    id: 'blade_teach',
    text: '⚔️ Первое правило: не бойся. Страх — это тень, которую ты сам создаёшь. Встреть её, и она исчезнет.',
    effect: { stability: 15, skillGains: { resilience: 10 } },
  },
  blade_demons: {
    id: 'blade_demons',
    text: '⚔️ У всех есть демоны. Твои — это твои невысказанные слова, нереализованные мечты, непрожитые жизни. Дай им имена.',
    choices: [
      {
        text: 'Как мне их назвать?',
        next: 'blade_name',
        effect: { creativity: 10 },
      },
      {
        text: 'Я боюсь их увидеть.',
        next: 'blade_fear',
        effect: { stability: -5 },
      },
    ],
  },
  blade_peace: {
    id: 'blade_peace',
    text: '⚔️ Мир — это тоже путь. Не всякий воин сражается мечом. Некоторые сражаются словом. Или молчанием.',
    effect: { karma: 10 },
  },
  blade_name: {
    id: 'blade_name',
    text: '⚔️ Напиши их. В стихах, в прозе — не важно. Дай им форму. Когда ты называешь что-то по имени — ты получаешь власть над этим.',
    effect: { creativity: 20 },
  },
  blade_fear: {
    id: 'blade_fear',
    text: '⚔️ Страх — это нормально. Но ты пришёл сюда. Это значит, что часть тебя готова. Жди момента. Он придёт.',
    effect: { stability: 5 },
  },

  // ========== НОВЫЕ: ЭННИ ==========
  annie_lost: {
    id: 'annie_lost',
    text: '🌸 Я знаю это чувство... Когда кто-то уходит, остаётся пустота. Но знаешь что? Пустота — это место для нового.',
    effect: { mood: 10, stability: 5 },
  },
  annie_knows: {
    id: 'annie_knows',
    text: '🌸 Я чувствую его. В тебе есть огонь. Он то горит ярко, то тлеет. Но он никогда не гаснет полностью. Это и есть творчество.',
    effect: { creativity: 15 },
  },
  annie_story: {
    id: 'annie_story',
    text: '🌸 Я... не помню. Иногда мне кажется, что я потеряла саму себя. Но я продолжаю существовать. Может, в этом и есть ответ.',
    choices: [
      {
        text: 'Ты существуешь, пока тебя помнят.',
        next: 'annie_remembered',
        effect: { karma: 15 },
      },
      {
        text: 'Мы можем найти тебя вместе.',
        next: 'annie_find',
        effect: { creativity: 10 },
      },
    ],
  },
  annie_remembered: {
    id: 'annie_remembered',
    text: '🌸 *глаза светятся* Пока тебя помнят... Да. Тогда я буду жить. И ты тоже будешь жить в тех, кто тебя любит.',
    effect: { mood: 20, stability: 10 },
  },
  annie_find: {
    id: 'annie_find',
    text: '🌸 Вместе... Никто раньше не предлагал мне искать меня. Обычно все ищут себя сами. Спасибо. Пойдём.',
    effect: { karma: 10, creativity: 5 },
  },

  // ========== НОВЫЕ: СУДЬБА ==========
  destiny_create: {
    id: 'destiny_create',
    text: '🗿 Большинство людей плывут по течению. Ты — гребёшь. Каждое твоё слово, каждый выбор — это штрих в картине твоей судьбы.',
    effect: { creativity: 15, karma: 10 },
  },
  destiny_future: {
    id: 'destiny_future',
    text: '🗿 Я вижу... разветвления. Много путей. Один ведёт к свету, другой — к тьме. Но большинство — где-то между. Выбор за тобой.',
    choices: [
      {
        text: 'Как мне выбрать правильный путь?',
        next: 'destiny_choose',
        effect: { stability: 5 },
      },
      {
        text: 'Я не хочу знать будущее.',
        next: 'destiny_unknown',
      },
    ],
  },
  destiny_disbelieve: {
    id: 'destiny_disbelieve',
    text: '🗿 Хорошо. Скептицизм — это тоже сила. Те, кто не верит в судьбу, часто создают свою собственную. Продолжай.',
    effect: { stability: 10, creativity: 5 },
  },
  destiny_choose: {
    id: 'destiny_choose',
    text: '🗿 Правильного пути нет. Есть только твой путь. Слушай сердце. Оно знает дорогу лучше, чем любой оракул.',
    effect: { stability: 10 },
  },
  destiny_unknown: {
    id: 'destiny_unknown',
    text: '🗿 Мудро. Будущее — это не то, что нужно знать. Это то, что нужно создавать. Иди и создавай.',
    effect: { creativity: 10 },
  },

  // ========== НОВЫЕ: СОЖЖЁННЫЙ ==========
  burntrap_brave: {
    id: 'burntrap_brave',
    text: '🔥 Храбрость... или глупость? Неважно. Оба качества приводят сюда. Что привело тебя?',
    choices: [
      {
        text: 'Я ищу ответы.',
        next: 'burntrap_answers',
        effect: { creativity: 10 },
      },
      {
        text: 'Я потерял кого-то.',
        next: 'burntrap_lost',
        effect: { stability: 5 },
      },
    ],
  },
  burntrap_what: {
    id: 'burntrap_what',
    text: '🔥 Я — то, что остаётся, когда всё остальное сгорает. Я — страх. Я — боль. Я — правда, от которой все убегают.',
    effect: { stress: 15, creativity: 5 },
  },
  burntrap_face: {
    id: 'burntrap_face',
    text: '🔥 Тогда ты пришёл по адресу. Но помни: страхи не побеждаются — они принимаются. Готов ли ты принять своих демонов?',
    choices: [
      {
        text: 'Да, я готов.',
        next: 'burntrap_accept',
        effect: { stability: 15, creativity: 20 },
        questObjective: { questId: 'face_fears', objectiveId: 'face_burntrap' },
      },
      {
        text: 'Я не уверен.',
        next: 'burntrap_uncertain',
      },
    ],
  },
  burntrap_answers: {
    id: 'burntrap_answers',
    text: '🔥 Ответы... Здесь их много. Но не все они твои. Некоторые правда горят. Больно.',
    effect: { creativity: 5 },
  },
  burntrap_lost: {
    id: 'burntrap_lost',
    text: '🔥 Потеря... Я знаю её вкус. Она горит. Но из пепла рождается новое. Ты тоже родишься заново.',
    effect: { stability: 10, mood: 5 },
  },
  burntrap_accept: {
    id: 'burntrap_accept',
    text: '🔥 Тогда посмотри на меня. Вглядись в пламя. Что ты видишь? Это — ты. И это — нормально.',
    effect: { stability: 20, karma: 15 },
  },
  burntrap_uncertain: {
    id: 'burntrap_uncertain',
    text: '🔥 Неуверенность — это начало мудрости. Вернись, когда будешь готов. Огонь никуда не денется.',
  },

  // ========== БАРИСТА И ДРУГИЕ (сокращённо) ==========
  barista_kindred: {
    id: 'barista_kindred',
    text: 'Ты угадал. Сюда приходят не за лайками — за дыханием. Кофе на дом, если расскажешь строчку.',
    choices: [
      { text: 'Потом — хочу только посидеть.', next: 'barista_bye' },
      { text: 'Есть одна строчка…', next: 'barista_coffee', effect: { stress: -3, creativity: 5 } },
    ],
  },
  barista_about: {
    id: 'barista_about',
    text: '"Синяя Яма" — место для творческих людей. Поэтов, музыкантов... Каждую пятницу — открытый микрофон.',
    choices: [
      {
        text: 'Звучит интересно!',
        next: 'barista_interested',
        effect: { creativity: 5, setFlag: 'interested_cafe_event' },
      },
      {
        text: 'Не моё.',
        next: 'barista_not_interested',
      },
    ],
  },
  barista_coffee: {
    id: 'barista_coffee',
    text: 'Отлично! У нас сегодня особенный бленд — "Поэтический рассвет". Хорошее название, да?',
    effect: { stress: -5, mood: 5 },
  },
  barista_poetry: {
    id: 'barista_poetry',
    text: 'О, вы один из чтецов! Удачи с выступлением! Сцена вон там, у дальней стены.',
    autoNext: 'barista_bye',
  },
  barista_bye: {
    id: 'barista_bye',
    text: 'До встречи! Заходите ещё!',
  },
  barista_interested: {
    id: 'barista_interested',
    text: 'Отлично! Буду ждать вас в пятницу. Вход для участников свободный.',
  },
  barista_not_interested: {
    id: 'barista_not_interested',
    text: 'Ну, если передумаете — двери всегда открыты.',
  },

  // ========== КАЛВИН ==========
  timur_band: {
    id: 'timur_band',
    text: 'На Зелёнке днём стучим «для себя», сюда приходим как на сцену без бэкстейджа. Гитара — Альберт, микрофон тоже он, я только держу ритм, чтобы панель не разъехалась.',
  },
  timur_bye: {
    id: 'timur_bye',
    text: 'Заходи на сет — кружка пены и правильный downbeat.',
  },

  calvin_poet: {
    id: 'calvin_poet',
    text: '☕ Я? Я... был поэтом. Давно. Теперь я просто слушаю. И иногда слышу вещи, которые стоит услышать.',
    effect: { creativity: 10 },
  },
  calvin_quiet: {
    id: 'calvin_quiet',
    text: '☕ Тихое место... Да. Это редкость в наше время. Тут можно услышать собственные мысли.',
    effect: { stability: 5 },
  },
  calvin_mood: {
    id: 'calvin_mood',
    text: '☕ Настроение? Хм... *думает* Я бы сказал, задумчивое. Наблюдательное. Как старый кот у окна.',
    effect: { mood: 5 },
  },

  // ========== ВИКТОРИЯ (КАФЕ «СИНЯЯ ЯМА») ==========
  college_girl_first: {
    id: 'college_girl_first',
    text: '📚 Круто. Тут обычно одни завсегдатаи — новое лицо как свежий коммит. Ты поэт? Здесь многие такие, я к ним привыкла.',
    effect: { mood: 5, npcId: 'maria', npcChange: 3 },
  },
  college_girl_writing: {
    id: 'college_girl_writing',
    text: '📚 Эссе о связи между снами и творчеством — да, звучит заумно, но мне правда интересно. А ты что пишешь?',
    choices: [
      {
        text: 'Стихи о жизни и потере.',
        next: 'college_girl_poems',
        effect: { creativity: 10, npcId: 'maria', npcChange: 4 },
      },
      {
        text: 'Просто записываю мысли.',
        next: 'college_girl_thoughts',
        effect: { npcId: 'maria', npcChange: 2 },
      },
    ],
  },
  college_girl_about: {
    id: 'college_girl_about',
    text: '📚 Это «Синяя Яма». Легендарное место для тех, кто не боится слова вслух. Известные и неизвестные поэты — для меня разницы почти нет, если честно.',
    effect: { creativity: 5, npcId: 'maria', npcChange: 2 },
  },
  college_girl_poems: {
    id: 'college_girl_poems',
    text: '📚 О… Это глубоко. Про потерю я понимаю не из учебника — поэтому сижу здесь, а не в тихой аудитории.',
    effect: { stability: 5, karma: 5, npcId: 'maria', npcChange: 5 },
  },
  college_girl_thoughts: {
    id: 'college_girl_thoughts',
    text: '📚 Мысли — тоже материал. Иногда они сами складываются в стихи, пока ты не заметил.',
    effect: { creativity: 5, npcId: 'maria', npcChange: 3 },
  },

  // ========== РЕЙ (CYBERPUNK GIRL) ==========
  cyberpunk_girl_feel: {
    id: 'cyberpunk_girl_feel',
    text: '⚡ Да! Будто мы все — в матрице, но кто-то это чувствует, а кто-то нет. Ты — чувствуешь.',
    effect: { creativity: 10, stability: 5 },
  },
  cyberpunk_girl_light: {
    id: 'cyberpunk_girl_light',
    text: '⚡ Это неоновая кровь. Шутка. На самом деле — это просто подсветка. Но мне нравится думать, что это что-то большее.',
    effect: { mood: 10 },
  },
  cyberpunk_girl_writer: {
    id: 'cyberpunk_girl_writer',
    text: '⚡ Писатель! Я знала! У тебя взгляд человека, который видит миры, которых нет. Покажешь мне когда-нибудь?',
    effect: { creativity: 15 },
  },

  // ========== СТАРИК ==========
  elder_explain: {
    id: 'elder_explain',
    text: 'Этот памятник... он здесь уже много лет. В память о тех, кто ушёл слишком рано. Поэтов, художников... Людей с горящими сердцами.',
    choices: [
      {
        text: 'Это печально.',
        next: 'elder_sad',
        effect: { stability: -5, karma: 5 },
      },
      {
        text: 'Они оставили после себя что-то важное.',
        next: 'elder_legacy',
        effect: { creativity: 10 },
      },
    ],
  },
  elder_knows: {
    id: 'elder_knows',
    text: 'Хорошо, что вы пришли. Это место должно жить в памяти людей.',
    effect: { karma: 10, stability: 5 },
  },
  elder_walk: {
    id: 'elder_walk',
    text: 'Гуляйте, гуляйте... Это хорошее место для размышлений.',
  },
  elder_sad: {
    id: 'elder_sad',
    text: 'Печально... Но жизнь продолжается. Главное — помнить о них.',
  },
  elder_legacy: {
    id: 'elder_legacy',
    text: 'Именно! Их стихи, картины, музыка — всё это живёт. Может, и ты что-то создашь.',
    effect: { creativity: 5 },
  },

  // ========== МАРИЯ ==========
  maria_insomnia: {
    id: 'maria_insomnia',
    text: 'Понимаю... Иногда ночь — лучшее время для размышлений. Но выглядишь уставшим.',
    choices: [
      {
        text: 'Спасибо за заботу.',
        next: 'maria_thanks',
        effect: { mood: 10, stability: 5 },
      },
      {
        text: 'Я справлюсь.',
        next: 'maria_strong',
        effect: { stability: 5 },
      },
    ],
  },
  maria_water: {
    id: 'maria_water',
    text: 'Хорошо... Попей и ложись. Завтра рано вставать.',
  },
  maria_poetry: {
    id: 'maria_poetry',
    text: 'О, ты пишешь? Это замечательно! Мне бы хотелось почитать.',
    effect: { mood: 15, creativity: 10 },
  },
  maria_sorry: {
    id: 'maria_sorry',
    text: 'Ничего страшного. Спокойной ночи.',
  },
  maria_thanks: {
    id: 'maria_thanks',
    text: 'Всегда. Мы же соседи, должны заботиться друг о друге.',
  },
  maria_strong: {
    id: 'maria_strong',
    text: 'Вижу. Но если захочешь поговорить — я рядом.',
  },

  // ========== ТЕНЬ ==========
  shadow_identity: {
    id: 'shadow_identity',
    text: 'Я — никто. Просто тень среди теней. Как и все мы, в конечном счёте...',
    choices: [
      {
        text: 'Это звучит грустно.',
        next: 'shadow_depressing',
        effect: { mood: -10, stress: 10 },
      },
      {
        text: 'Может, но тени делают свет ярче.',
        next: 'shadow_philosophy',
        effect: { creativity: 10 },
      },
    ],
  },
  shadow_view: {
    id: 'shadow_view',
    text: 'Да... Город никогда не спит. Тысячи историй, миллионы судеб...',
    effect: { creativity: 5, mood: 5 },
  },
  shadow_alone: {
    id: 'shadow_alone',
    text: 'Побыть одному... Тут все поодиночке. Даже в толпе.',
  },
  shadow_bye: {
    id: 'shadow_bye',
    text: 'Уходи. Или останься. Это ничего не меняет.',
  },
  shadow_depressing: {
    id: 'shadow_depressing',
    text: 'Грустно? Нет. Это просто правда. Привыкай.',
  },
  shadow_philosophy: {
    id: 'shadow_philosophy',
    text: 'Хм... Интересная мысль. Может, ты и прав. Редко кто это понимает.',
    effect: { karma: 5 },
  },

  // ========== АЛАЯ ==========
  crimson_night: {
    id: 'crimson_night',
    text: '🌹 Да... Ночь — это когда маски падают. Когда мы остаёмся наедине с собой. Ты тоже это чувствуешь?',
    effect: { creativity: 10 },
  },
  crimson_who: {
    id: 'crimson_who',
    text: '🌹 Я — Алая. Просто Алая. Я появляюсь там, где нужна. Может, я нужна тебе сейчас?',
    choices: [
      {
        text: 'Может быть. Я ищу... что-то.',
        next: 'crimson_search',
        effect: { stability: 5 },
      },
      {
        text: 'Я не знаю, что мне нужно.',
        next: 'crimson_unknown',
      },
    ],
  },
  crimson_bye: {
    id: 'crimson_bye',
    text: '🌹 Уходи, если должен. Но помни — ночь всегда вернётся. И я тоже.',
    effect: { karma: 5 },
  },
  crimson_search: {
    id: 'crimson_search',
    text: '🌹 Все мы что-то ищем. Потерянные воспоминания, забытые мечты... Или просто себя.',
    effect: { creativity: 5 },
  },
  crimson_unknown: {
    id: 'crimson_unknown',
    text: '🌹 Это нормально. Иногда не знать — это начало пути. Ты придёшь к ответу.',
    effect: { stability: 10 },
  },

  // ========== КОЛЛЕГА (ОФИС) ==========
  colleague_persuasion_line: {
    id: 'colleague_persuasion_line',
    text: 'Ого… Ты так формулируешь, что даже мне легче. Перекину часть созвонов на себя. Спасибо.',
    effect: { stress: -6, stability: 6 },
  },
  colleague_tired: {
    id: 'colleague_tired',
    text: 'Понимаю... Бессонница? У меня тоже бывает. Попробуй чай с мятой — помогает.',
    effect: { stress: -5, mood: 5 },
  },
  colleague_normal: {
    id: 'colleague_normal',
    text: 'Это правильный подход! Стабильность — это сила. Кстати, слышал про новый проект?',
    choices: [
      {
        text: 'Расскажи.',
        next: 'colleague_new_project',
        effect: { creativity: 5 },
      },
      {
        text: 'Не сейчас, работаю.',
        next: 'colleague_work',
      },
    ],
  },
  colleague_work: {
    id: 'colleague_work',
    text: 'Хорошо, не буду отвлекать. Если что — я за соседним столом.',
    effect: { stability: 5 },
  },
  colleague_new_project: {
    id: 'colleague_new_project',
    text: 'Говорят, запускаем что-то связанное с искусственным интеллектом. Креативная команда будет работать над этим. Может, тебе интересно?',
    choices: [
      {
        text: 'Звучит интересно! Как вступить?',
        next: 'colleague_join',
        effect: { creativity: 10, mood: 10 },
      },
      {
        text: 'Мне хватает текущих задач.',
        next: 'colleague_busy',
        effect: { stability: 5 },
      },
    ],
  },
  colleague_join: {
    id: 'colleague_join',
    text: 'Отлично! Поговори с начальником — он как раз ищет людей с воображением. Удачи!',
    effect: { mood: 5, setFlag: 'offered_ai_project' },
  },
  colleague_busy: {
    id: 'colleague_busy',
    text: 'Понимаю. Тоже иногда чувствую, что дел слишком много. Но если передумаешь — скажи.',
    effect: { stability: 5 },
  },

  // ========== НАЧАЛЬНИК (ОФИС) ==========
  boss_attention: {
    id: 'boss_attention',
    text: 'Хорошо. У нас есть важный проект — клиенту нужна система мониторинга к пятнице. Ты справишься?',
    choices: [
      {
        text: 'Да, конечно. Приступаю.',
        next: 'boss_accept',
        effect: { stress: 15, stability: -5 },
      },
      {
        text: 'Мне нужна помощь коллег.',
        next: 'boss_help',
        effect: { stress: 5 },
      },
      {
        text: 'К пятнице? Это нереально.',
        next: 'boss_impossible',
        effect: { stress: 10, karma: -5 },
      },
    ],
  },
  boss_progress: {
    id: 'boss_progress',
    text: 'Отлично! Продолжай в том же духе. Клиент доволен предварительными результатами.',
    effect: { mood: 10, stability: 5 },
  },
  boss_later: {
    id: 'boss_later',
    text: 'Хм... Ладно, но не затягивай. К пятнице всё должно быть готово.',
    effect: { stress: 5 },
  },
  boss_accept: {
    id: 'boss_accept',
    text: 'Вот и отлично. Жду результат к четвергу для проверки. Если что — заходи.',
    effect: { creativity: 5, setFlag: 'got_project_task' },
  },
  boss_help: {
    id: 'boss_help',
    text: 'Разумно. Попроси Андрея из соседнего отдела — он делал что-то похожее. Но ответственность на тебе.',
    effect: { stability: 5, setFlag: 'boss_suggested_help' },
  },
  boss_impossible: {
    id: 'boss_impossible',
    text: 'Нереально — это когда мы не пытаемся. В этой компании мы делаем невозможное. Подумай ещё раз.',
    effect: { stress: 20, stability: -10 },
  },

  // ========== ЗАРЕМА И АЛЬБЕРТ (СТАРТОВАЯ КОМНАТА) ==========

  zarema_room: {
    id: 'zarema_room',
    text: '🌸 Володька! Ты как, нормально? Мы с Альбертом тут обсуждаем новый проект... Хочешь послушать? Или может тебе что-то нужно?',
    choices: [
      {
        text: 'Расскажите про проект',
        next: 'zarema_project',
        effect: { creativity: 5 },
      },
      {
        text: 'Я просто хотел поговорить',
        next: 'zarema_talk',
        effect: { mood: 5 },
      },
      {
        text: 'Мне нужна помощь с квестом',
        next: 'zarema_quest_help',
        questStart: 'first_words',
      },
      {
        text: 'Пока, увидимся позже',
        next: 'zarema_bye',
      },
    ],
  },

  /** Домашний корень Заремы (дублирует карточку `zarema_home` для `DIALOGUE_NODES` / вариантов). */
  zarema_room_home: {
    id: 'zarema_room_home',
    text: '🌸 Дома тише, чем на лестнице. Альберт уже «допиливает» что-то в углу — а я рада, что ты заглянул. Чай?',
    choices: [
      { text: 'Как у вас дела с ремонтом / соседями?', next: 'zarema_project', effect: { creativity: 3 } },
      { text: 'Просто заскочил поздороваться', next: 'zarema_talk', effect: { mood: 4 } },
      { text: 'Мне пора', next: 'zarema_bye' },
    ],
  },
  /** Тёплый вариант при высоком раппорте и памяти о встрече (`resolveDialogueVariant`). */
  zarema_room_home_warm: {
    id: 'zarema_room_home_warm',
    text: '🌸 О, ты снова здесь — уже не как «гость из лифта», а как свой. Чайник только что щёлкнул: садись, расскажешь, как ты там, снаружи?',
    choices: [
      { text: 'Как у вас дела с ремонтом / соседями?', next: 'zarema_project', effect: { creativity: 3 } },
      { text: 'Просто заскочил поздороваться', next: 'zarema_talk', effect: { mood: 4 } },
      { text: 'Мне пора', next: 'zarema_bye' },
    ],
  },
  /** Холоднее, если настроение мира просело (`getDominantEmotion`). */
  zarema_room_home_cold: {
    id: 'zarema_room_home_cold',
    text: '🌸 …Ты пришёл. Я не буду делать вид, что всё легко: сядь, если надо — но не жди, что я сразу заговорю как в прошлый раз.',
    choices: [
      { text: 'Как у вас дела с ремонтом / соседями?', next: 'zarema_project', effect: { creativity: 3 } },
      { text: 'Просто заскочил поздороваться', next: 'zarema_talk', effect: { mood: 4 } },
      { text: 'Мне пора', next: 'zarema_bye' },
    ],
  },

  zarema_project: {
    id: 'zarema_project',
    text: '🌸 Мы с Альбертом делаем интерактивную инсталляцию! Стихи + 3D-проекции + музыка. Хочешь принять участие? Твои стихи идеально подойдут.',
    choices: [
      {
        text: 'Звучит интересно! Я в деле',
        next: 'zarema_project_join',
        effect: { creativity: 15, karma: 5, setFlag: 'joined_zarema_project' },
      },
      {
        text: 'Подумаю, когда будет время',
        next: 'zarema_project_later',
      },
      {
        text: 'Не уверен, что справлюсь',
        next: 'zarema_project_doubt',
        effect: { stability: -5 },
      },
    ],
  },
  zarema_project_join: {
    id: 'zarema_project_join',
    text: '🌸 Отлично! Альберт будет в восторге. Нам нужны твои стихи — что-нибудь про сны, память, одиночество... Ну, ты понимаешь.',
    effect: { creativity: 10 },
  },
  zarema_project_later: {
    id: 'zarema_project_later',
    text: '🌸 Без проблем. Но не затягивай — дедлайн через две недели. Мы будем ждать!',
    effect: { mood: 3 },
  },
  zarema_project_doubt: {
    id: 'zarema_project_doubt',
    text: '🌸 Эй, не говори так! Твои стихи — это что-то особенное. Я видела твой блокнот. У тебя настоящий талант!',
    effect: { creativity: 5, stability: 5 },
  },
  zarema_talk: {
    id: 'zarema_talk',
    text: '🌸 Конечно! Ты знаешь, я всегда рада поговорить. Как твоя работа в техподдержке? Всё те же тикеты?',
    choices: [
      {
        text: 'Да, 12 лет одно и то же',
        next: 'zarema_work_same',
        effect: { stability: -3 },
      },
      {
        text: 'Нормально, привык уже',
        next: 'zarema_work_ok',
        effect: { stability: 3 },
      },
      {
        text: 'Я пишу стихи по ночам',
        next: 'zarema_work_poetry',
        effect: { creativity: 10 },
      },
    ],
  },
  zarema_work_same: {
    id: 'zarema_work_same',
    text: '🌸 12 лет... Это много. Но ты не сдавайся — может, стоит попробовать что-то новое? Твои стихи... они о многом говорят.',
    effect: { creativity: 5 },
  },
  zarema_work_ok: {
    id: 'zarema_work_ok',
    text: '🌸 Привык — это хорошо и плохо. Хорошо, что стабильно. Плохо, что можешь упустить что-то важное.',
    effect: { stability: 5 },
  },
  zarema_work_poetry: {
    id: 'zarema_work_poetry',
    text: '🌸 Стихи по ночам! Это прекрасно. Ночь — лучшее время для творчества. Покажешь мне что-нибудь?',
    choices: [
      {
        text: 'Покажу, но позже',
        next: 'zarema_poetry_later',
        effect: { creativity: 5 },
      },
      {
        text: 'Они ещё сырые, не готов',
        next: 'zarema_poetry_raw',
      },
    ],
  },
  zarema_poetry_later: {
    id: 'zarema_poetry_later',
    text: '🌸 Буду ждать! Только не затягивай — я умею ждать, но любопытство меня погубит!',
    effect: { mood: 5 },
  },
  zarema_poetry_raw: {
    id: 'zarema_poetry_raw',
    text: '🌸 Сырые — значит настоящие. Лучшие стихи те, что идут от сердца, без редактуры.',
    effect: { creativity: 5, stability: 3 },
  },
  zarema_quest_help: {
    id: 'zarema_quest_help',
    text: '🌸 Конечно! Что тебе нужно? У меня есть немного времени. Альберт подождёт.',
    choices: [
      {
        text: 'Мне нужны материалы для стихов',
        next: 'zarema_quest_materials',
      },
      {
        text: 'Хочу научиться лучше писать',
        next: 'zarema_quest_teach',
        effect: { creativity: 10 },
      },
    ],
  },
  zarema_quest_materials: {
    id: 'zarema_quest_materials',
    text: '🌸 Материалы? У меня есть старый блокнот с набросками... Можешь взять вдохновение. Также есть книга о поэзии Серебряного века.',
    effect: { creativity: 15, setFlag: 'got_zarema_materials' },
  },
  zarema_quest_teach: {
    id: 'zarema_quest_teach',
    text: '🌸 Учить писать стихи... Это как учить дышать. Но я могу дать совет: пиши о том, что болит. Боль — лучший учитель.',
    effect: { creativity: 10, stability: -5 },
  },
  zarema_bye: {
    id: 'zarema_bye',
    text: '🌸 До встречи, Володька! Заглядывай почаще — мы тут всегда рады компании!',
    effect: { mood: 5 },
  },

  // ========== АЛЬБЕРТ ==========

  albert_room: {
    id: 'albert_room',
    text: '💻 О, Володька! Заходи, заходи. Как раз разбираю логи с продакшена. Ты же у нас мастер деплоя — может, глянешь?',
    choices: [
      {
        text: 'Что за логи? Показывай',
        next: 'albert_logs',
        effect: { stability: 5 },
      },
      {
        text: 'Я не по работе, просто зашёл',
        next: 'albert_casual',
        effect: { mood: 5 },
      },
      {
        text: 'У меня проблема с Kubernetes',
        next: 'albert_kubernetes',
        questStart: 'kubernetes_orchestrator',
      },
      {
        text: 'Пока, Альберт!',
        next: 'albert_bye',
      },
    ],
  },
  albert_logs: {
    id: 'albert_logs',
    text: '💻 Смотри — microservice loyalty-points. Утечка памяти, 8GB и растёт. Профилирование показало leak в connection pool. Знакомо?',
    choices: [
      {
        text: 'Да, это классика. Надо патчить',
        next: 'albert_logs_patch',
        effect: { skillGains: { coding: 5 } },
      },
      {
        text: 'Не видел такого. Расскажи подробнее',
        next: 'albert_logs_explain',
        effect: { stability: 3 },
      },
      {
        text: 'Мне пора, успехов с дебагом',
        next: 'albert_bye',
      },
    ],
  },
  albert_logs_patch: {
    id: 'albert_logs_patch',
    text: '💻 Точно! Я уже пишу фикс. Спасибо за подтверждение. Кстати, Зарема говорила, ты пишешь стихи — это правда?',
    choices: [
      {
        text: 'Да, это мой способ справиться',
        next: 'albert_poetry_yes',
        effect: { creativity: 5, karma: 5 },
      },
      {
        text: 'Пытаюсь, но не уверен в себе',
        next: 'albert_poetry_doubt',
        effect: { stability: -3 },
      },
      {
        text: 'Не хочу об этом говорить',
        next: 'albert_poetry_no',
      },
    ],
  },
  albert_logs_explain: {
    id: 'albert_logs_explain',
    text: '💻 Объясняю: connection pool не возвращает соединения. Каждый запрос открывает новое, но не закрывает. Итог — memory leak.',
    effect: { skillGains: { coding: 3 } },
  },
  albert_poetry_yes: {
    id: 'albert_poetry_yes',
    text: '💻 Круто! Человек-оркестр — днём деплои, ночью стихи. Я тоже иногда коджу ночами, но это другое... Творчество — это круто.',
    effect: { creativity: 10, mood: 5 },
  },
  albert_poetry_doubt: {
    id: 'albert_poetry_doubt',
    text: '💻 Не уверен? Зарема говорила, у тебя талант. Может, покажешь что-нибудь? Я честно скажу — как инженер, без лишних эмоций.',
    effect: { creativity: 5 },
  },
  albert_poetry_no: {
    id: 'albert_poetry_no',
    text: '💻 Понял, без проблем. Тема личная. Если захочешь поговорить — я тут, за монитором. Всегда на связи.',
    effect: { stability: 3 },
  },
  albert_casual: {
    id: 'albert_casual',
    text: '💻 Отлично! А то я уже часа три в логах. Глаза болят. Как твоя жизнь? Всё так же — работа, дом, один?',
    choices: [
      {
        text: 'Да, но я пишу. Это помогает',
        next: 'albert_life_write',
        effect: { creativity: 5 },
      },
      {
        text: 'Нормально. Привык уже',
        next: 'albert_life_ok',
        effect: { stability: 3 },
      },
      {
        text: 'Альберт, давай о чём-то другом',
        next: 'albert_life_change',
      },
    ],
  },
  albert_life_write: {
    id: 'albert_life_write',
    text: '💻 Пишешь — это хорошо. Творчество — лучший способ не сойти с ума в нашей сфере. У меня хобби — open-source проект.',
    effect: { mood: 5, creativity: 5 },
  },
  albert_life_ok: {
    id: 'albert_life_ok',
    text: '💻 Привык... Это слово меня пугает. Но если ты в порядке — значит, всё ок. Если что — пиши в Slack.',
    effect: { stability: 5 },
  },
  albert_life_change: {
    id: 'albert_life_change',
    text: '💻 Понял, понял. Личные вопросы — это личное. Давай о Kubernetes поговорим!',
    effect: { mood: 3 },
  },
  albert_kubernetes: {
    id: 'albert_kubernetes',
    text: '💻 Kubernetes? Ну ты пришёл по адресу! У меня три сертификации и пять лет опыта. Что конкретно?',
    choices: [
      {
        text: 'Оркестратор упал на проде',
        next: 'albert_k8s_orchestrator',
        effect: { stability: 5 },
      },
      {
        text: 'Нужно разобраться с pods',
        next: 'albert_k8s_pods',
        effect: { skillGains: { coding: 3 } },
      },
      {
        text: 'Спасибо, сам разберусь',
        next: 'albert_bye',
      },
    ],
  },
  albert_k8s_orchestrator: {
    id: 'albert_k8s_orchestrator',
    text: '💻 Оркестратор упал? Смотри, чек-лист: 1) kubectl get nodes — проверь ноды, 2) kubectl logs -n kube-system — логи, 3) kubectl rollout restart — ребут. Дерзай!',
    effect: { skillGains: { coding: 5 }, stability: 10 },
  },
  albert_k8s_pods: {
    id: 'albert_k8s_pods',
    text: '💻 Pods — это основа. kubectl get pods -A — покажет все поды. kubectl describe pod <name> — детали. kubectl exec — залезть внутрь. База!',
    effect: { skillGains: { coding: 3 } },
  },
  albert_bye: {
    id: 'albert_bye',
    text: '💻 До связи, Володька! Если что — пиши в Slack или заходи. Я почти всегда тут... Ну, ты знаешь.',
    effect: { mood: 3 },
  },

  alexander_ok: {
    id: 'alexander_ok',
    text: 'Вот это настрой. Если что — я на связи в треде.',
  },
  alexander_dash: {
    id: 'alexander_dash',
    text: 'Ссылка в закрепе канала #banking-war-room. Не дай себе утонуть в графиках.',
  },
  alexander_bye: { id: 'alexander_bye', text: 'Давай, держись.' },

  dmitry_thanks: {
    id: 'dmitry_thanks',
    text: 'Не за что. Мы же одной продакшн-судьбой дышим.',
  },
  dmitry_roll: {
    id: 'dmitry_roll',
    text: 'Откатываем — я подстрахую. Напиши, если kubectl начнёт капризничать.',
  },
  dmitry_bye: { id: 'dmitry_bye', text: 'Удачи в тикете, Володь.' },

  andrey_respect: {
    id: 'andrey_respect',
    text: 'Именно. Разные записи в одной таблице жизни. Увидимся у кофемашины.',
  },
  andrey_thanks: {
    id: 'andrey_thanks',
    text: 'Обращайся. Compliance — не враг, мы просто читаем мелкий шрифт.',
  },
  andrey_bye: { id: 'andrey_bye', text: 'Хорошего дня.' },

  artyom_ok: {
    id: 'artyom_ok',
    text: 'Жду апдейт. И помни: песочница — только песочница.',
  },
  artyom_list: {
    id: 'artyom_list',
    text: 'Кину в Confluence шаблон инцидента — там чеклисты и ответственные.',
  },
  artyom_bye: { id: 'artyom_bye', text: 'Не просри токены.' },

  vika_memory: {
    id: 'vika_memory',
    text: 'Ах та собака… Мы тогда так ржали. Заходи как-нибудь — вспомним вслух.',
  },
  vika_cafe: {
    id: 'vika_cafe',
    text: '«Синяя Яма» — записала. Я как раз хотела туда на вечер поэзии.',
  },
  vika_bye: { id: 'vika_bye', text: 'Береги себя, Володь.' },

  renata_sympathy: {
    id: 'renata_sympathy',
    text: 'Заходи завтра — чай с мятой и без вопросов. Дамьен одобрит.',
  },
  renata_damien: {
    id: 'renata_damien',
    text: 'Передам. Он сейчас кормит Рыжего у бордюра.',
  },
  renata_bye: { id: 'renata_bye', text: 'До встречи во дворе.' },

  damien_joke: {
    id: 'damien_joke',
    text: 'Ха. Тогда мы — liveness probe для человечности.',
  },
  damien_bye: { id: 'damien_bye', text: 'Держись, брат.' },

  konstantin_nod: {
    id: 'konstantin_nod',
    text: 'Главное — живой. Остальное — патчами лечится.',
  },
  konstantin_timur: {
    id: 'konstantin_timur',
    text: 'Уже кричит «Зенит» в небо. Иди, пока не утащил в спор.',
  },
  konstantin_bye: { id: 'konstantin_bye', text: 'Бывай, Володь.' },

  timur_pat: {
    id: 'timur_pat',
    text: '*кивает* Мы тут. Лавка никуда не денется.',
  },

  polikarp_thanks: {
    id: 'polikarp_thanks',
    text: 'Спасибо, сынок. Снег чистый — душа чуть легче.',
  },
  polikarp_shovel: {
    id: 'polikarp_shovel',
    text: 'Запомню. Лопата всегда в подсобке — как резервный инстанс.',
  },
  polikarp_bye: { id: 'polikarp_bye', text: 'Аккуратно на ступеньках.' },

  rimma_laugh: {
    id: 'rimma_laugh',
    text: 'Вот! Настя, слышала? Он всё-таки инженер до мозга костей.',
  },
  rimma_nastya: {
    id: 'rimma_nastya',
    text: 'Передам. Она сейчас внизу с теплосчётчиком бьётся.',
  },
  rimma_bye: { id: 'rimma_bye', text: 'Теплее одевайся.' },

  nastya_smile: {
    id: 'nastya_smile',
    text: '*улыбается* Тогда не пропадай. Чат дома — не декорация.',
  },
  nastya_bye: { id: 'nastya_bye', text: 'Пока, Володь.' },

  volodka_dima_ok: {
    id: 'volodka_dima_ok',
    text: 'Вот и ладненько. Мы тут все друг друга слышим — как в одном большом open space, только с трубами.',
    effect: { mood: 2 },
  },
  volodka_dima_prod: {
    id: 'volodka_dima_prod',
    text: 'Прод, прод… Ладно, я сам в понедельник в проде. Только не в три ночи, ок?',
    effect: { stability: 1 },
  },
  volodka_dima_bye: {
    id: 'volodka_dima_bye',
    text: 'Ага, беги. Только не забудь — соседи не mute.',
  },
};

// ============================================
// ПОЛУЧЕНИЕ NPC ДЛЯ СЦЕНЫ
// ============================================

function isNpcVisibleInExplorationScene(
  npc: NPCDefinition,
  sceneId: string,
  timeOfDay: number,
): boolean {
  const entry = getCurrentScheduleEntry(npc.id, timeOfDay);
  const atHomeCard = npc.sceneId === sceneId;
  const isHomeDuplicate = npc.id.endsWith('_home');

  if (atHomeCard) {
    if (!entry) return true;
    if (isHomeDuplicate) return entry.sceneId === sceneId;
    return entry.sceneId === sceneId;
  }
  return Boolean(entry && entry.sceneId === sceneId);
}

/**
 * NPC в сцене: по «дому» (`sceneId`) и по текущему окну расписания (персонаж может уйти в офис, кафе и т.д.).
 * При совпадении канона (`zarema` / `zarema_home`) остаётся карточка с `npc.sceneId === sceneId`, если есть.
 */
export function getNPCsForScene(sceneId: string, timeOfDay?: number): NPCDefinition[] {
  if (timeOfDay === undefined) {
    return Object.values(NPC_DEFINITIONS).filter((npc) => npc.sceneId === sceneId);
  }

  const candidates = Object.values(NPC_DEFINITIONS).filter((npc) =>
    isNpcVisibleInExplorationScene(npc, sceneId, timeOfDay),
  );

  const byCanon = new Map<string, NPCDefinition>();
  for (const npc of candidates) {
    const canon = resolveScheduleNpcId(npc.id);
    const prev = byCanon.get(canon);
    if (!prev) {
      byCanon.set(canon, npc);
      continue;
    }
    const prevAnchored = prev.sceneId === sceneId ? 1 : 0;
    const nextAnchored = npc.sceneId === sceneId ? 1 : 0;
    if (nextAnchored > prevAnchored) byCanon.set(canon, npc);
  }
  return [...byCanon.values()];
}

/** Позиция для миникарты / туториала: слот расписания в текущей сцене или стор / default. */
export function getNpcExplorationPosition(
  npc: NPCDefinition,
  sceneId: string,
  timeOfDay: number,
  statePosition?: { x: number; y: number; z: number },
): { x: number; y: number; z: number } {
  const entry = getCurrentScheduleEntry(npc.id, timeOfDay);
  if (entry?.sceneId === sceneId) {
    return { ...entry.position };
  }
  return statePosition ?? npc.defaultPosition;
}

export function getNPCById(npcId: string): NPCDefinition | undefined {
  return NPC_DEFINITIONS[npcId];
}

export function getDialogueNode(nodeId: string): NPCDefinition['dialogueTree'] | undefined {
  return DIALOGUE_NODES[nodeId];
}
