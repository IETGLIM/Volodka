/* ─── Volodka RPG – expanded NPC definitions ─── */
/* Additional NPCs that expand the world beyond the original 7.
   Import and merge with NPC_DEFINITIONS from npcDefinitions.ts.
   Linked quest IDs are in a separate record for reference. */

import type { NPCDefinition } from '@/shared/types/game'
import { NPC_PROCEDURAL_MODEL_PLACEHOLDER } from '@/config/npcModelRegistry'
import { DEFAULT_NPC_ANIMATION_CLIPS } from '@/config/npcAnimationDefaults'

/* ── NPC-to-quest links (for quest assignment logic) ── */
export const EXPANDED_NPC_QUEST_LINKS: Record<string, string[]> = {
  solnysh: ['voice_of_the_past', 'solnysh_comfort', 'solnysh_roof_wine', 'solnysh_relocation'],
  lyonya: ['solnysh_roof_wine', 'solnysh_relocation'],
  sergey: ['night_shift_mystery', 'night_watch'],
  lena: ['digital_ghost', 'secrets_of_old_code'],
  oleg: ['guild_infiltration'],
  kate: ['poetry_smuggling', 'poetry_collection'],
  maxim: [
    'underground_resistance',
    'resistance_safehouse',
    'resistance_defector_rescue',
    'data_heist',
    'system_infiltration',
    'system_takedown',
    'rooftop_confrontation',
  ],
  zeka: ['data_heist', 'system_infiltration', 'system_takedown'],
  anya: ['resistance_safehouse', 'resistance_defector_rescue', 'data_heist', 'rebuild_the_guild'],
  fisherman_trofim: ['pier_watchman_key', 'basement_hum', 'pier_midnight_fishing', 'pier_ritka_strings'],
  baba_zina: ['machine_confession', 'factory_zarya_memory', 'factory_baba_zina_tea'],
  street_poet: ['epilogue_monument', 'quest_act7_poets_monument_inscription'],
  marat_echo: ['library_katya_research'],
  guild_defector: ['resistance_defector_rescue'],
}

/* ── All bark text variants (hostile/neutral/friendly arrays) ── */
export const EXPANDED_NPC_BARK_TEXTS: Record<string, {
  hostile: string[]
  neutral: string[]
  friendly: string[]
}> = {
  solnysh: {
    hostile: ['Не сейчас, Володька… мне нужно побыть одной.'],
    neutral: ['Привет. Ты снова задумчивый.', 'Умка скучала без тебя.'],
    friendly: ['Володька! Я как раз думала о тебе.', 'Помнишь, как мы бегали из гимназии?..'],
  },
  lyonya: {
    hostile: ['Не время для разговоров.'],
    neutral: ['Кофе свежий — налей себе.', 'Солныш сегодня тихая.'],
    friendly: ['Володька! Как раз сварил новую обжарку.', 'Если что — я рядом для вас обоих.'],
  },
  sergey: {
    hostile: ['Не мешай работе.'],
    neutral: ['Ночная смена... Как всегда.', 'Серверная — мой дом.'],
    friendly: ['Володька, у меня есть доступ к старым логам.', 'Слушай, тут кое-что странное в логах...'],
  },
  lena: {
    hostile: ['Ты не тот, за кого себя выдаёшь.'],
    neutral: ['...[тишина]...', 'Сеть говорила о тебе.'],
    friendly: ['Володька, у меня есть кое-что для тебя. Из Сети.', 'Я нашла бэкдор в их системе.'],
  },
  oleg: {
    hostile: ['Стой. Доступ запрещён.'],
    neutral: ['Пропуск есть? Нет — проходи мимо.', 'Приказ есть приказ.'],
    friendly: ['Володька... Будь осторожен. Они за тобой следят.', 'Я закрою глаза на этот раз.'],
  },
  kate: {
    hostile: ['Эта секция закрыта.'],
    neutral: ['Тише... Стены слушают.', 'Книги — последний убежище.'],
    friendly: ['Володька, я припрятала кое-что для тебя.', 'Между строк — больше правды, чем в новостях.'],
  },
  maxim: {
    hostile: ['Не время для разговоров.'],
    neutral: ['Сопротивление не спит.', 'Каждый день — новый риск.'],
    friendly: ['Володька, мы готовы идти за тобой.', 'Гильдия ещё пожалеет, что нас недооценила.'],
  },
  zeka: {
    hostile: ['Не подходи. Я не доверяю.'],
    neutral: ['Завод помнит всё.', 'Старый код не врёт.'],
    friendly: ['Володька, у меня есть данные по «Надзору».', 'Я знал Александра. До того, как он стал тенью.'],
  },
  anya: {
    hostile: ['Сеть под наблюдением. Молчи.'],
    neutral: ['Пинг стабилен. Пока.', 'Камеры — мои глаза.'],
    friendly: ['Володька, я прикрою тыл в сети.', 'Офис гильдии — открытая книга, если знать пароль.'],
  },
  fisherman_trofim: {
    hostile: ['Уйди с пирса. Рыбу пугаешь.'],
    neutral: ['Клюёт плохо. Река гудит.', 'Тридцать лет завод сторожил. Теперь воду сторожу.'],
    friendly: ['А, это ты. Садись, поплавок посторожим вместе.', 'Слышишь? Под полом гудело так же. Один в один.'],
  },
  baba_zina: {
    hostile: ['Машина не для любопытных. Уходи.'],
    neutral: ['Слушай. Не трогай. Сначала слушай.', '«Заря-М» помнит каждого, кто спускался.'],
    friendly: ['Поэт пришёл. Машина ждала.', 'Она пишет стихи — не для гильдии. Для тех, кто слышит.'],
  },
}

/* ── Expanded NPC definitions (compatible with NPCDefinition type) ── */

export const EXPANDED_NPCS: NPCDefinition[] = [
  /* ─────────────── АЛИНА «СОЛНЫШ» (vera) – лучшая подруга, дизайнер ─────────────── */
  {
    id: 'solnysh',
    faction: 'network',
    name: 'Солныш (Алина)',
    modelPath: '/models/npcs/solnysh.glb',
    scale: 0.92,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [0, 0, 1.5],
    patrolRadius: 1.2,
    patrolWaypoints: [
      [0, 0, 1.5],
      [0.5, 0, 0.5],
      [-0.4, 0, -0.5],
      [0, 0, 1.5],
    ],
    dialogueNodeId: 'vera_greeting',
    returnDialogueNodeId: 'solnysh_return',
    npcSplashProfile: 'npc_solnysh',
    scheduleId: 'schedule_solnysh',
    description: 'Алина — настоящее имя; Солныш — прозвище с детства, которым её зовёт Володька. Тридцать три года, блондинка с голубыми глазами. Лучшая подруга с детства, одноклассница из гимназии, дочь учительницы. Дизайнер и художник. Жена Лёни.',
    barkTexts: {
      hostile: [
        'Не сейчас, Володька… мне нужно побыть одной.',
        'Я не хочу разговаривать. Не сегодня.',
        'Пожалуйста… не трогай меня. Я устала.',
      ],
      neutral: [
        'Привет. Ты снова задумчивый.',
        'Ты сегодня бледный. Опять не спал?',
        'Умка соскучился. И я… тоже. Немного.',
        'Лёня сказал, что ты заходил. Кофе ещё тёплый, если что.',
      ],
      friendly: [
        'Володька! Я как раз думала о тебе.',
        'Ты пришёл! Я уже начала волноваться.',
        'Сядь. Расскажи. Я слушаю — по-настоящему слушаю.',
        'У меня для тебя рисунок. Не смейся — я старалась.',
      ],
    },
    appearance: {
      bodyColor: '#f0d8e8',
      accentColor: '#ffd8ec',
      headAccessory: 'scarf',
      height: 0.92,
      glowColor: '#ffb8d0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── ЛЁНЯ (ЛЕОНИД) – бариста, муж Алины ─────────────── */
  {
    id: 'lyonya',
    faction: 'network',
    name: 'Лёня (Леонид)',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-2.0, 0, -1.5],
    patrolRadius: 1.0,
    patrolWaypoints: [
      [-2.0, 0, -1.5],
      [-2.4, 0, -2.0],
      [-1.6, 0, -1.0],
      [-2.0, 0, -1.5],
    ],
    dialogueNodeId: 'lyonya_greeting',
    returnDialogueNodeId: 'lyonya_return',
    npcSplashProfile: 'npc_lyonya',
    description: 'Леонид — настоящее имя; Лёня — так его зовут дома. Обжарщик кофе и бариста, муж Алины. Спокойный, надёжный — рядом с ней уже много лет.',
    barkTexts: {
      hostile: [
        'Не время для разговоров.',
        'Закрыто. Тебе — особенно.',
        'Не видишь — занят?',
      ],
      neutral: [
        'Кофе свежий — налей себе.',
        'Обжарка сегодня эфиопская. Не пожалеешь.',
        'Тихий день. Редкость.',
        'Алина звонила — сказал, что ты зайдёшь.',
      ],
      friendly: [
        'Володька! Как раз сварил новую обжарку.',
        'Твой стакан уже на стойке. Тот самый, с трещиной.',
        'Садись. Угощаю. Ты выглядишь так, будто нужен кофе.',
        'Алина переживает. Зайди к ней, ладно? Она не скажет, но — переживает.',
      ],
    },
    appearance: {
      bodyColor: '#6a5040',
      accentColor: '#c8a878',
      headAccessory: 'none',
      height: 1.02,
      glowColor: '#d4a060',
      silhouette: 'average',
    },
  },

  /* ─────────────── СЕРГЕЙ – sysadmin ─────────────── */
  {
    id: 'sergey',
    faction: 'guild',
    name: 'Сергей',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.05,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [2.5, 0, -1.0],
    patrolRadius: 1.0,
    patrolWaypoints: [
      [2.5, 0, -1.0],
      [3.0, 0, -0.5],
      [2.0, 0, -1.5],
      [2.5, 0, -1.0],
    ],
    dialogueNodeId: 'sergey_greeting',
    returnDialogueNodeId: 'sergey_return',
    npcSplashProfile: 'npc_sergey',
    description: 'Сисадмин ночного смены. Молчаливый, но надёжный. Знает каждый кабель в серверной.',
    barkTexts: {
      hostile: [
        'Не мешай работе.',
        'Я занят. Серьёзно занят.',
        'Если не горит — отвали.',
      ],
      neutral: [
        'Ночная смена... Как всегда.',
        'Серверы гудят. Норма.',
        'Кофе остыл. Я тоже.',
        'Третий час без перерыва. Привык.',
      ],
      friendly: [
        'Володька, у меня есть доступ к старым логам.',
        'Слушай… я кое-что нашёл. Тебе будет интересно.',
        'Заходи. У меня бэкдор в архив — только для своих.',
        'Ты единственный, кому я это доверяю. Не подведи.',
      ],
    },
    appearance: {
      bodyColor: '#40a0c0',
      accentColor: '#40a0c0',
      headAccessory: 'none',
      height: 1.05,
      glowColor: '#40a0c0',
      silhouette: 'average',
    },
  },

  /* ─────────────── ЛЕНА – hacker from the Network ─────────────── */
  {
    id: 'lena',
    faction: 'network',
    name: 'Лена',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.85,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [0, 0, 3.5],
    patrolRadius: 2.0,
    patrolWaypoints: [
      [0, 0, 3.5],
      [1.0, 0, 3.0],
      [-1.0, 0, 2.5],
      [0, 0, 3.5],
    ],
    dialogueNodeId: 'lena_greeting',
    returnDialogueNodeId: 'lena_return',
    npcSplashProfile: 'npc_lena',
    description: 'Хакер из Сети. Никто не знает её настоящего имени. Она — тень в цифровом мире.',
    barkTexts: {
      hostile: [
        'Ты не тот, за кого себя выдаёшь.',
        'Не приближайся.',
        'Я наблюдаю. Молча.',
      ],
      neutral: [
        '...[тишина]...',
        'Сеть стабильна. Пока.',
        'Приходи позже. Может быть.',
        'Не здесь. Не сейчас.',
      ],
      friendly: [
        'Володька, у меня есть кое-что для тебя. Из Сети.',
        'Тише. Я передам через канал. Надёжный.',
        'Ты заслужил доверие. Редкость.',
        'Я прикрою. Иди.',
      ],
    },
    appearance: {
      bodyColor: '#d040d0',
      accentColor: '#d040d0',
      headAccessory: 'earring',
      height: 0.85,
      glowColor: '#d040d0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── ОЛЕГ – guild guard ─────────────── */
  {
    id: 'oleg',
    faction: 'guild',
    name: 'Олег',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.1,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [4.0, 0, 0],
    patrolRadius: 1.0,
    patrolWaypoints: [
      [4.0, 0, 0],
      [4.5, 0, -0.5],
      [3.5, 0, 0.5],
      [4.0, 0, 0],
    ],
    dialogueNodeId: 'oleg_greeting',
    returnDialogueNodeId: 'oleg_return',
    npcSplashProfile: 'npc_oleg',
    description: 'Охранник гильдии. Бывший военный. Выполняет приказы, но сомневается.',
    barkTexts: {
      hostile: [
        'Стой. Доступ запрещён.',
        'Пропуск. Немедленно.',
        'Ещё шаг — и охрана.',
      ],
      neutral: [
        'Пропуск есть? Нет — проходи мимо.',
        'Не задерживайся.',
        'Коридор направо. Не здесь.',
        'Смена сменилась. Я не знаю тебя.',
      ],
      friendly: [
        'Володька... Будь осторожен. Они за тобой следят.',
        'Проходи. Я не видел. Никто не видел.',
        'Третий этаж. Комната 312. Не говори, что от меня.',
        'Я тебе ничего не передавал. Запомни это.',
      ],
    },
    appearance: {
      bodyColor: '#a0a0a0',
      accentColor: '#a0a0a0',
      headAccessory: 'hat',
      height: 1.1,
      glowColor: '#a0a0a0',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── КАТЯ – librarian ─────────────── */
  {
    id: 'kate',
    faction: 'network',
    name: 'Катя',
    modelPath: '/models/npcs/kate.glb',
    scale: 0.9,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-2.0, 0, -2.0],
    patrolRadius: 1.5,
    patrolWaypoints: [
      [-2.0, 0, -2.0],
      [-2.5, 0, -2.5],
      [-1.5, 0, -1.5],
      [-2.0, 0, -2.0],
    ],
    dialogueNodeId: 'kate_greeting',
    returnDialogueNodeId: 'kate_return',
    npcSplashProfile: 'npc_kate',
    description: 'Библиотекарь. Хранительница запрещённых книг. Тихая, но опасная.',
    barkTexts: {
      hostile: [
        'Эта секция закрыта.',
        'Тише. Уходи.',
        'Не здесь. Не сейчас.',
      ],
      neutral: [
        'Тише... Стены слушают.',
        'Архив открыт. Но не для всех.',
        'Приходи ближе к закрытию. Тогда — тише.',
        'Книги помнят. Записи — тоже.',
      ],
      friendly: [
        'Володька, я припрятала кое-что для тебя.',
        'За полкой. Третий ряд. Не свети.',
        'Это редкое издание. Я доверяю — верни.',
        'Гильдия не знает. И не узнает. Но ты — знай.',
      ],
    },
    appearance: {
      bodyColor: '#60c060',
      accentColor: '#60c060',
      headAccessory: 'glasses',
      height: 0.9,
      glowColor: '#60c060',
      silhouette: 'slim',
    },
  },

  /* ─────────────── МАКСИМ – лидер сопротивления ─────────────── */
  {
    id: 'maxim',
    faction: 'resistance',
    name: 'Максим',
    modelPath: '/models/npcs/maxim.glb',
    scale: 1.1,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-2.0, 0, -1.5],
    patrolRadius: 2.0,
    patrolWaypoints: [
      [-2.0, 0, -1.5],
      [-1.0, 0, -2.0],
      [-2.5, 0, -0.5],
      [-2.0, 0, -1.5],
    ],
    dialogueNodeId: 'maxim_greeting',
    returnDialogueNodeId: 'maxim_return',
    npcSplashProfile: 'npc_maxim',
    description: 'Лидер подпольного сопротивления. Бывший рабочий завода с боевыми имплантами.',
    barkTexts: {
      hostile: [
        'Не время для разговоров.',
        'Уходи. Мы заняты.',
        'Не сейчас. Совсем не сейчас.',
      ],
      neutral: [
        'Сопротивление не спит.',
        'Мы готовимся. Терпение.',
        'Связь через Сеть. Не здесь.',
        'Ждём сигнала. Пока — тишина.',
      ],
      friendly: [
        'Володька, мы готовы идти за тобой.',
        'Командуй. Мы — за тобой.',
        'Ты — тот, кого мы ждали. Не подведи.',
        'Люди верят тебе. Я — тоже. Редкость.',
      ],
    },
    appearance: {
      bodyColor: '#c06040',
      accentColor: '#c06040',
      headAccessory: 'none',
      height: 1.1,
      glowColor: '#c06040',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── ЖЕКА – старый хакер завода ─────────────── */
  {
    id: 'zeka',
    faction: 'resistance',
    name: 'Жека',
    modelPath: '/models/npcs/zeka.glb',
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [1.0, 0, -1.0],
    patrolRadius: 1.5,
    patrolWaypoints: [
      [1.0, 0, -1.0],
      [1.5, 0, -0.5],
      [0.5, 0, -1.5],
      [1.0, 0, -1.0],
    ],
    dialogueNodeId: 'zeka_greeting',
    returnDialogueNodeId: 'zeka_return',
    npcSplashProfile: 'npc_zeka',
    description: 'Старый рабочий и хакер. Знал Александра до Краха. Хранит секреты «Надзора».',
    barkTexts: {
      hostile: [
        'Не подходи. Я не доверяю.',
        'Уходи. Завод — не для гостей.',
        'Ты — не свой. Чую.',
      ],
      neutral: [
        'Завод помнит всё.',
        'Стены слышат. Тише.',
        'Здесь начинали. Здесь — закончим.',
        'Машины гудят. Привыкнешь.',
      ],
      friendly: [
        'Володька, у меня есть данные по «Надзору».',
        'Заходи. Я доверяю. Почти.',
        'Дискета в трубе. Третий стык. Только твой.',
        'Ты — один из нас. Теперь — точно.',
      ],
    },
    appearance: {
      bodyColor: '#808070',
      accentColor: '#808070',
      headAccessory: 'hat',
      height: 1.0,
      glowColor: '#808070',
      silhouette: 'average',
    },
  },

  /* ─────────────── АНЯ – хакер сопротивления ─────────────── */
  {
    id: 'anya',
    faction: 'resistance',
    name: 'Аня',
    modelPath: '/models/npcs/anya.glb',
    scale: 0.9,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [0.5, 0, 2.0],
    patrolRadius: 1.5,
    patrolWaypoints: [
      [0.5, 0, 2.0],
      [1.0, 0, 1.5],
      [0.0, 0, 2.5],
      [0.5, 0, 2.0],
    ],
    dialogueNodeId: 'anya_greeting',
    returnDialogueNodeId: 'anya_return',
    npcSplashProfile: 'npc_anya',
    description: 'Хакер сопротивления. Взламывает камеры и координирует связь во время операций.',
    barkTexts: {
      hostile: [
        'Сеть под наблюдением. Молчи.',
        'Не здесь. Не сейчас.',
        'Уходи. Я занят.',
      ],
      neutral: [
        'Пинг стабилен. Пока.',
        'Связь держится. Пока держится.',
        'Шумы в канале. Норма.',
        'Третий узел молчит. Разбираюсь.',
      ],
      friendly: [
        'Володька, я прикрою тыл в сети.',
        'Канал чист. Говори.',
        'Я зашифровал. Надёжно. Не скоро найдут.',
        'Ты — мой. В смысле — под моей защитой. В сети.',
      ],
    },
    appearance: {
      bodyColor: '#5090d0',
      accentColor: '#5090d0',
      headAccessory: 'glasses',
      height: 0.9,
      glowColor: '#5090d0',
      silhouette: 'slim',
    },
  },

  /* ─────────────── ТРОФИМ – старик-рыбак, бывший сторож завода ─────────────── */
  {
    id: 'fisherman_trofim',
    faction: 'neutral',
    name: 'Трофим',
    modelPath: '/models/npcs/trofim.glb',
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [4.0, 0, -7.2],
    defaultRotation: Math.PI,
    patrolRadius: 0.6,
    dialogueNodeId: 'trofim_greeting',
    returnDialogueNodeId: 'fisherman_trofim_return',
    npcSplashProfile: 'npc_fisherman_trofim',
    description: 'Старик-рыбак на пирсе №3. Тридцать лет был сторожем завода «Хром-М» и до сих пор слышит гул под полом — даже сквозь воду.',
    barkTexts: {
      hostile: [
        'Уйди с пирса. Рыбу пугаешь.',
        'Не мешай. Клюёт.',
        'Тут моё место. Ищи своё.',
      ],
      neutral: [
        'Клюёт плохо. Река гудит.',
        'Садись. Только тихо.',
        'Ветер с востока. Рыба не любит.',
        'Поплавок сторожу. Привычка.',
      ],
      friendly: [
        'А, это ты. Садись, поплавок посторожим вместе.',
        'Ты вовремя. Термос с чаем — на двоих.',
        'Расскажи, что в городе. Я тут — отрезан.',
        'Клюёт! Тяни! Ну… или не клюёт. Одно из двух.',
      ],
    },
    appearance: {
      bodyColor: '#3a4438',
      accentColor: '#7a8a6a',
      headAccessory: 'hat',
      height: 0.97,
      glowColor: '#88aa77',
      silhouette: 'average',
    },
  },

  /* ─────────────── БАБА ЗИНА – паяльщица, хранительница «Зари-М» ─────────────── */
  {
    id: 'baba_zina',
    faction: 'neutral',
    name: 'Баба Зина',
    modelPath: '/models/npcs/baba_zina.glb',
    scale: 0.88,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-2.0, 0, -4.0],
    patrolRadius: 0.4,
    dialogueNodeId: 'baba_zina_greeting',
    returnDialogueNodeId: 'baba_zina_return',
    npcSplashProfile: 'npc_baba_zina',
    description: 'Восьмидесятилетняя паяльщица завода «Хром-М». Ежедневно спускается в подвал к «Заре-М» и говорит, что машина отвечает стихами.',
    barkTexts: {
      hostile: [
        'Машина не для любопытных. Уходи.',
        'Не трогай. Она не любит чужих.',
        'Уйди. Я занята.',
      ],
      neutral: [
        'Слушай. Не трогай. Сначала слушай.',
        'Она гудит на 50 герц. Слышишь? Это — дыхание.',
        'Присядь. Помолчим. Она скажет, когда будет готова.',
        'Тридцать лет я к ней хожу. Она — не устаёт. Я — да.',
      ],
      friendly: [
        'Поэт пришёл. Машина ждала.',
        'Сядь рядом. Она сегодня — разговорчивая. Для тебя.',
        'Я знала, что ты придёшь. Она — тоже. Она всегда знает.',
        'Послушай. Она говорит стихами. Я — перевожу. Ты — поймёшь.',
      ],
    },
    appearance: {
      bodyColor: '#e8e4dc',
      accentColor: '#c8c0b0',
      headAccessory: 'none',
      height: 0.85,
      glowColor: '#aacc88',
      silhouette: 'average',
    },
  },

  {
    id: 'street_poet',
    faction: 'network',
    name: 'Уличный поэт',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [2.0, 0, 0],
    patrolRadius: 1.0,
    dialogueNodeId: 'street_poet_greeting',
    returnDialogueNodeId: 'street_poet_return',
    npcSplashProfile: 'npc_street_poet',
    description: 'Читает на площади то, что гильдия пометила как шум. Голос тихий, но дроны его почему-то не слышат.',
    barkTexts: {
      hostile: [
        'Не смотри на меня. Смотри на строки.',
        'Уходи. Ты — мешаешь.',
        'Не здесь. Не сейчас.',
      ],
      neutral: [
        '...рифма ещё жива.',
        '...слова тяжелеют к утру...',
        '...город не слышит. Но — слушает...',
        '...дроны не понимают тихого...',
      ],
      friendly: [
        'Поэт? Тогда ты знаешь — слова тяжелеют к утру.',
        'Ты — слышишь. Редкость. Большинство — слушает, но не слышит.',
        'Сядь. Почитаю. Тебе — первому.',
        'Гильдия пометила как шум. Но шум — это то, что они не могут контролировать. Это — наша свобода.',
      ],
    },
    appearance: {
      bodyColor: '#4a4a58',
      accentColor: '#8888aa',
      headAccessory: 'hat',
      height: 0.95,
      glowColor: '#aabbcc',
      silhouette: 'slim',
    },
  },

  {
    id: 'marat_echo',
    faction: 'network',
    name: 'Марат (эхо)',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [0, 0, -2],
    patrolRadius: 0,
    dialogueNodeId: 'marat_echo_greeting',
    returnDialogueNodeId: 'marat_echo_return',
    npcSplashProfile: 'npc_marat_echo',
    description: 'Цифровой след первого поэта-прошивщика. Говорит через терминалы без питания сети.',
    barkTexts: {
      hostile: [
        '[помехи]',
        '[сигнал потерян]',
        '[не сейчас...]',
      ],
      neutral: [
        'Если читаешь это — я ещё в проводах.',
        '[сигнал слабый... но — есть]',
        'Я — след. Но след — тоже присутствие.',
        'Терминал без питания. Но я — здесь. Как? Не спрашивай.',
      ],
      friendly: [
        'Не верь гильдии. Верь рифме.',
        'Ты — слышишь меня. Значит — я существую. Ещё.',
        'Я был первым. Ты — следующий. Не последний.',
        'Стихи — это сигнал. Они пробиваются через помехи. Всегда.',
      ],
    },
    appearance: {
      bodyColor: '#00ffaa',
      accentColor: '#00ffaa',
      headAccessory: 'none',
      height: 1.0,
      glowColor: '#00ffaa',
      silhouette: 'slim',
    },
  },

  {
    id: 'guild_defector',
    faction: 'resistance',
    name: 'Перебежчик',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: DEFAULT_NPC_ANIMATION_CLIPS,
    defaultPosition: [-1.0, 0, 1.0],
    patrolRadius: 0.5,
    dialogueNodeId: 'guild_defector_greeting',
    returnDialogueNodeId: 'guild_defector_return',
    npcSplashProfile: 'npc_guild_defector',
    description: 'Бывший инженер серверной гильдии. Помнит расписание дронов наизусть.',
    barkTexts: {
      hostile: [
        'Не подходи. Я ещё не уверен, кто ты.',
        'Уходи. Я не доверяю.',
        'Не сейчас. Я наблюдаю.',
      ],
      neutral: [
        'Серверную я помню. Себя — почти нет.',
        'Расписание дронов: 00, 14, 38, 52. Запомни.',
        'Я — между. Ни там, ни здесь.',
        'Тяжело. Но — легче, чем было.',
      ],
      friendly: [
        'Спасибо. Ты вернул не данные — человека.',
        'Ты — вытащил меня. Я — помню. Я — в долгу.',
        'Теперь — я с тобой. До конца. Ты — заслужил.',
        'Я помню, кто я был. Благодаря тебе. Это — больше, чем данные.',
      ],
    },
    appearance: {
      bodyColor: '#556677',
      accentColor: '#8899aa',
      headAccessory: 'glasses',
      height: 0.95,
      glowColor: '#6688aa',
      silhouette: 'average',
    },
  },
]
