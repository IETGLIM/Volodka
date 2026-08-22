/* ─── Volodka RPG – Expansion NPC stubs ───
 * Minimal but lore-consistent NPC definitions referenced from side quests
 * and milestone dialogues but missing from the core registry.
 *
 * Each stub is a complete NPCDefinition with enough fields to satisfy
 * the QuestTracker / contentPipelineValidator: id, name, faction,
 * modelPath (procedural placeholder), animations, defaultPosition,
 * patrolRadius, dialogueNodeId, barkTexts, description, appearance.
 *
 * Tone: post-Soviet cyberpunk. Melancholic but hopeful.
 */

import type { NPCDefinition } from '@/shared/types/game';
import { NPC_PROCEDURAL_MODEL_PLACEHOLDER } from '@/config/npcModelRegistry';
import { DEFAULT_NPC_ANIMATION_CLIPS } from '@/config/npcAnimationDefaults';

const BASE_ANIM = DEFAULT_NPC_ANIMATION_CLIPS;

export const EXPANSION_NPC_STUBS: NPCDefinition[] = [
  /* ─────────────── VICTORIA — vault-keeper specialist ─────────────── */
  {
    id: 'victoria',
    faction: 'network',
    name: 'Виктория',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.98,
    animations: BASE_ANIM,
    idleVariant: 'idle_relaxed',
    defaultPosition: [-1.5, 0, -2.0],
    defaultRotation: Math.PI * 0.25,
    patrolRadius: 1.0,
    npcSplashProfile: 'npc_victoria',
    description:
      'Хранительница одноразовых ключей к Хранилищу гильдии. Знает, что между мёртвым и стёртым — пропасть. Молчит, пока не убедится, что ты не повторишь её ошибку.',
    barkTexts: {
      hostile: [
        'Я не повторяю ключи. Уходи.',
        'Гильдия учит тебя слушать. Я учу — молчать.',
      ],
      neutral: [
        'Ключ одноразовый. Подумай, прежде чем тратить.',
        'Стёртые — не мёртвые. Помни разницу.',
      ],
      friendly: [
        'Володька. Я ждала кого-то вроде тебя. Из null — в exist.',
        'Бери. Но запомни имя того, кого вернёшь.',
      ],
    },
    ambientBarks: {
      idle: [
        '*перебирает ключ-карты* Каждый — судьба. Каждый — одноразовый.',
        '*себе под нос* Стерлинги — не персоналии. Записи. Только — записи.',
      ],
      pensive: [
        '*тихо* Я раздам все ключи — и останусь ни с чем. Может, это и есть — цель.',
      ],
    },
    appearance: {
      bodyColor: '#2b1f2e',
      accentColor: '#a060c0',
      headAccessory: 'glasses',
      height: 0.98,
      glowColor: '#8848a8',
      silhouette: 'slim',
    },
  },

  /* ─────────────── INFORMANT SERYOZHA — underground informant ─────────────── */
  {
    id: 'informant_seryozha',
    faction: 'underground',
    name: 'Информант Серёжа',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: BASE_ANIM,
    defaultPosition: [1.0, 0, -1.5],
    defaultRotation: -Math.PI / 4,
    patrolRadius: 0.6,
    npcSplashProfile: 'npc_informant_seryozha',
    description:
      'Бывший архивист гильдии, теперь — осведомитель Сети. Знает, где лежат документы, которые никто не должен найти. Торгует тайнами осторожно: каждое слово — риск.',
    barkTexts: {
      hostile: ['Не знаю тебя. И ты меня — не знаешь.'],
      neutral: ['Говори тише. Стены — не стены.'],
      friendly: ['У меня есть кое-что про капитана. Но — осторожно.'],
    },
    ambientBarks: {
      idle: [
        '*поправляет воротник* Каждый документ — чужая судьба. Записал.',
        '*себе под нос* Если меня найдут — это не находка. Это — конец.',
      ],
      pensive: ['*тихо* Я продаю тайны, чтобы купить тишину. Ирония.'],
    },
    appearance: {
      bodyColor: '#33231a',
      accentColor: '#8a6a3a',
      headAccessory: 'scarf',
      height: 1.0,
      glowColor: '#6a5a3a',
      silhouette: 'average',
    },
  },

  /* ─────────────── MERCHANT BORIS — travelling trader ─────────────── */
  {
    id: 'merchant_boris',
    faction: 'merchant_guild',
    name: 'Торговец Борис',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.05,
    animations: BASE_ANIM,
    defaultPosition: [2.0, 0, 1.5],
    defaultRotation: -Math.PI / 3,
    patrolRadius: 1.0,
    npcSplashProfile: 'npc_merchant_boris',
    description:
      'Бродячий торговец с печатью гильдии купцов. Возит товар между городами по лесным дорогам. Теряет груз чаще, чем хотелось бы — но платит щедро за возврат.',
    barkTexts: {
      hostile: ['Не_trade_с_незнакомцами. Уходи.'],
      neutral: ['Опять потерял. Лес — жадный. Лес — берёт своё.'],
      friendly: ['Володька! Найдёшь мой ящик — не обижу. Слово купца.'],
    },
    ambientBarks: {
      idle: [
        '*перебирает монеты* Товар — это доверие. Доверие — это товар.',
        '*смотрит на дорогу* Лесная тропа. Опять — обманет. Опять — проведёт.',
      ],
      pensive: ['*тихо* Каждый рейс — последний. Каждый — не последний. Так и — живём.'],
    },
    appearance: {
      bodyColor: '#4a3a2a',
      accentColor: '#aa8855',
      headAccessory: 'hat',
      height: 1.05,
      glowColor: '#aa7a44',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── CAPTAIN GAROLD — corrupt guard captain ─────────────── */
  {
    id: 'captain_garold',
    faction: 'streltsy',
    name: 'Капитан Гарольд',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.1,
    animations: BASE_ANIM,
    defaultPosition: [0, 0, 2.0],
    defaultRotation: Math.PI,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_captain_garold',
    description:
      'Капитан городской стражы. Берёт мзду с торговцев и закрывает глаза на контрабанду. Внешне — каменная стена; внутри — бухгалтерия компромата.',
    barkTexts: {
      hostile: ['Не твоё дело, поэт. Иди — пиши.'],
      neutral: ['Капитан не разговаривает с каждым. Уходи.'],
      friendly: ['Хочешь поговорить? Говори — но тихо. И — взвешенно.'],
    },
    ambientBarks: {
      idle: [
        '*поправляет нашивки* Честь — дорогая штука. Дешевле — молчание.',
        '*себе под нос* Реестр — чист. Записей — нет. Так — и — надо.',
      ],
      pensive: ['*тихо* Каждому — своё. Мне — тишина. Тебе — уход.'],
    },
    appearance: {
      bodyColor: '#2a2a3a',
      accentColor: '#666688',
      headAccessory: 'hat',
      height: 1.1,
      glowColor: '#5566aa',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── BLACKSMITH IGNAT — old smith, dreamer of blades ─────────────── */
  {
    id: 'blacksmith_ignat',
    faction: 'merchant_guild',
    name: 'Кузнец Игнат',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.15,
    animations: BASE_ANIM,
    defaultPosition: [-1.0, 0, 1.0],
    defaultRotation: Math.PI / 2,
    patrolRadius: 0.4,
    npcSplashProfile: 'npc_blacksmith_ignat',
    description:
      'Старый кузнец с мечтой выковать клинок, о котором будут слагать легенды. Руду, кристалл и чешую ищет по всему свету — но кует не мечи, а судьбы.',
    barkTexts: {
      hostile: ['Не лезь в горн. Обожжёшься — не виноват.'],
      neutral: ['Мечтаю о клинке. Каждый день. Сорок лет.'],
      friendly: ['Володька! Найдёшь материалы — выкую тебе нечто. Слово кузнеца.'],
    },
    ambientBarks: {
      idle: [
        '*стучит молотом* Удар — в такт. В такт — с сердцем. Так — и — держится.',
        '*смотрит на угли* Уголь — углерод, который сдался. Я — не — сдался. Пока.',
      ],
      pensive: ['*тихо* Легенда — это усталость, выкованная в форме.'],
    },
    appearance: {
      bodyColor: '#3a2a1a',
      accentColor: '#aa6a3a',
      headAccessory: 'hat',
      height: 1.15,
      glowColor: '#cc6633',
      silhouette: 'heavy',
    },
  },

  /* ─────────────── DYING OLD MAN — last wish bearer ─────────────── */
  {
    id: 'dying_old_man',
    faction: 'neutral',
    name: 'Умирающий старик',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.9,
    animations: BASE_ANIM,
    idleVariant: 'idle_relaxed',
    defaultPosition: [-2.0, 0, -3.0],
    defaultRotation: 0,
    patrolRadius: 0,
    npcSplashProfile: 'npc_dying_old_man',
    description:
      'Старик на окраине города. Дышит на исходе. В руке — запечатанное письмо для дочери, которую не видел десять лет. Просит об одном: доставить нетронутым.',
    barkTexts: {
      hostile: ['Не трогай письмо. Это — не твоё.'],
      neutral: ['Подойди ближе. Не слышу. Голос — тонет.'],
      friendly: ['Володька… отнеси Марине. Она — у реки. Не читай. Прошу.'],
    },
    ambientBarks: {
      idle: [
        '*кашляет* Десять лет — это много. И мало. Одновременно.',
        '*смотрит на конверт* Сургуч — цел. Я — нет. Так — и — должно — быть.',
      ],
      pensive: ['*почти шёпотом* Не читай. Если прочитаешь — не доставишь.'],
    },
    appearance: {
      bodyColor: '#3a3a4a',
      accentColor: '#8888aa',
      headAccessory: 'scarf',
      height: 0.9,
      glowColor: '#7799bb',
      silhouette: 'slim',
    },
  },

  /* ─────────────── MARINA — daughter by the river ─────────────── */
  {
    id: 'marina',
    faction: 'neutral',
    name: 'Марина',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.95,
    animations: BASE_ANIM,
    defaultPosition: [0, 0, 1.0],
    defaultRotation: -Math.PI / 6,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_marina',
    description:
      'Женщина тридцати лет, живёт в доме у реки, за мостом. Дочь, которой отец не показывался десять лет. Хранит окна открытыми — на случай, если он всё же вернётся.',
    barkTexts: {
      hostile: ['Я никого не жду. Уже — нет.'],
      neutral: ['У реки тихо. Иногда — слишком.'],
      friendly: ['Володька?.. Если ты от него — я слушаю. Сядь. Долго — не стой.'],
    },
    ambientBarks: {
      idle: [
        '*смотрит на реку* Вода помнит больше, чем я. Хоть — у неё — нет — памяти.',
        '*поправляет платок* Десять лет — окно открыто. Привычка. Или — вера.',
      ],
      pensive: ['*тихо* Если он прислал письмо — значит, не успел сам. Значит — поздно.'],
    },
    appearance: {
      bodyColor: '#4a3a4a',
      accentColor: '#aa88aa',
      headAccessory: 'scarf',
      height: 0.95,
      glowColor: '#aa77aa',
      silhouette: 'slim',
    },
  },

  /* ─────────────── SURVEILLANCE CONTACT — Network's eyes ─────────────── */
  {
    id: 'surveillance_contact',
    faction: 'network',
    name: 'Контакт из Сети',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: BASE_ANIM,
    defaultPosition: [1.5, 0, -2.5],
    defaultRotation: Math.PI * 0.6,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_surveillance_contact',
    description:
      'Безымянный голос из Сети. Координирует съём данных с узлов гильдейской слежки. Никогда не показывает лица — только капюшон и шёпот в коммуникаторе.',
    barkTexts: {
      hostile: ['Не называй меня. Никогда.'],
      neutral: ['Узел на третьем уровне промзоны. Шкаф за решёткой.'],
      friendly: ['Володька. Сеть смотрит за Смотрящим. Ирония — но — работает.'],
    },
    ambientBarks: {
      idle: [
        '*поправляет капюшон* Я — не имя. Я — функция. У функции — нет — сердца.',
        '*себе под нос* Узел молчит — значит, нас не слышат. Хорошо. Пока — хорошо.',
      ],
      pensive: ['*тихо* Если я появлюсь в реестре — я исчезну. Так — у — нас — принято.'],
    },
    appearance: {
      bodyColor: '#1f2a26',
      accentColor: '#4a8870',
      headAccessory: 'scarf',
      height: 1.0,
      glowColor: '#3aa075',
      silhouette: 'slim',
    },
  },

  /* ─────────────── PARK OLD MAN — keeper of rusty keys ─────────────── */
  {
    id: 'park_old_man',
    faction: 'neutral',
    name: 'Старик на скамье',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.95,
    animations: BASE_ANIM,
    idleVariant: 'idle_relaxed',
    defaultPosition: [0, 0, 0],
    defaultRotation: 0,
    patrolRadius: 0,
    npcSplashProfile: 'npc_park_old_man',
    description:
      'Каждый день — одна скамья в парке. Не бродяга: в его глазах ещё живёт что-то древнее этой промзоны. Хранит ключи от подземного убежища, куда уходили его предки. Ключ расколот на три.',
    barkTexts: {
      hostile: ['Эта скамья — моя. Иди — мимо.'],
      neutral: ['Сядь. Подыши. Город — тоже — дышит. Иногда — слышно.'],
      friendly: ['Володька. Найдёшь три фрагмента ключа — открою тебе дверь. Туда — до Катастрофы.'],
    },
    ambientBarks: {
      idle: [
        '*кормит голубей* Они — помнят. Голуби — помнят. Город — нет.',
        '*себе под нос* Ключ расколот. Как — память. Как — время. На — три.',
      ],
      pensive: ['*тихо* За той дверью — мир, которого не было. Мир — до.'],
    },
    appearance: {
      bodyColor: '#4a4035',
      accentColor: '#aa9a6a',
      headAccessory: 'hat',
      height: 0.95,
      glowColor: '#aa9050',
      silhouette: 'average',
    },
  },

  /* ─────────────── DYING POET — last poem, last breath ─────────────── */
  {
    id: 'dying_poet',
    faction: 'network',
    name: 'Умирающий поэт',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.9,
    animations: BASE_ANIM,
    idleVariant: 'idle_relaxed',
    defaultPosition: [-1.0, 0, -2.5],
    defaultRotation: Math.PI / 2,
    patrolRadius: 0,
    npcSplashProfile: 'npc_dying_poet',
    description:
      'В читальном зале библиотеки, за последним стеллажом. Последний из тех, кто помнит, как стихи были оружием. Написал последнее произведение не для Сети — для одного человека. Преданного им тридцать лет назад.',
    barkTexts: {
      hostile: ['Я никого не жду. Уже — нет.'],
      neutral: ['Сядь. Не рядом. Не так близко. Я — слышу — плохо.'],
      friendly: ['Володька… Возьми письмо. Отнеси Елене. Не читай. Прошу — не читай.'],
    },
    ambientBarks: {
      idle: [
        '*кашляет* Стих — это не оружие. Стих — это — рука — на — плече. После.',
        '*смотрит на лист* Листок — желтее, чем — я. Скоро — сравняемся.',
      ],
      pensive: ['*почти шёпотом* Тридцать лет — это много. Но — мало — чтобы — простить.'],
    },
    appearance: {
      bodyColor: '#3a3530',
      accentColor: '#8a7a5a',
      headAccessory: 'glasses',
      height: 0.9,
      glowColor: '#aa9050',
      silhouette: 'slim',
    },
  },

  /* ─────────────── POEM RECIPIENT ELENA — the betrayed one ─────────────── */
  {
    id: 'poem_recipient_elena',
    faction: 'neutral',
    name: 'Елена',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.95,
    animations: BASE_ANIM,
    defaultPosition: [2.5, 0, 0],
    defaultRotation: -Math.PI / 3,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_poem_recipient_elena',
    description:
      'Женщина, которую предал тридцать лет назад умирающий поэт. Не простила. Не забыла. Но — пишет ему каждый год в день его рождения, и письма не отправляет.',
    barkTexts: {
      hostile: ['Я не знаю тебя. И не хочу знать.'],
      neutral: ['Если ты от него — я слушаю. Но — коротко. Я — устала.'],
      friendly: ['Володька… стих? От него? Подай. Дай — прочту. Молча.'],
    },
    ambientBarks: {
      idle: [
        '*складывает письма* Тридцать писем. Ни одного — отправлено. Все — ему.',
        '*смотрит в окно* Тридцать лет — это не срок. Это — половина — жизни.',
      ],
      pensive: ['*тихо* Если он прислал стих — значит, понял. Опоздал. Но — понял.'],
    },
    appearance: {
      bodyColor: '#3a3045',
      accentColor: '#8870a0',
      headAccessory: 'scarf',
      height: 0.95,
      glowColor: '#8866aa',
      silhouette: 'slim',
    },
  },

  /* ─────────────── FACTORY FOREMAN — night shift caller ─────────────── */
  {
    id: 'factory_foreman',
    faction: 'guild',
    name: 'Мастер завода',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.05,
    animations: BASE_ANIM,
    defaultPosition: [-1.5, 0, -1.0],
    defaultRotation: Math.PI / 4,
    patrolRadius: 0.8,
    npcSplashProfile: 'npc_factory_foreman',
    description:
      'Мастер завода «Прогресс-7». Видит, как ночами подвал оживает фантомами corrupted-данных. Не верит в мистику — но платит зачистить подвал. Хоть кто-то должен.',
    barkTexts: {
      hostile: ['Не стой. Бери перчатки. Иди — в подвал.'],
      neutral: ['Ночью — завод — чужой. Днём — тоже. Но днём — тише.'],
      friendly: ['Володька. Зачистишь источник — заплачу вдвое. И — кофе. Свежий.'],
    },
    ambientBarks: {
      idle: [
        '*проверяет наряды* Смена — длинная. Подвал — мокрый. Всё — как — всегда.',
        '*себе под нос* Фантомы — не призраки. Это — плохой код. Это — хуже.',
      ],
      pensive: ['*тихо* Каждый раз — думаю: может, не лезть. Каждый раз — лезу. Привычка.'],
    },
    appearance: {
      bodyColor: '#3a3a30',
      accentColor: '#8a8a3a',
      headAccessory: 'hat',
      height: 1.05,
      glowColor: '#aa9a3a',
      silhouette: 'average',
    },
  },

  /* ─────────────── RIVAL POET MAX — duelist on the square ─────────────── */
  {
    id: 'rival_poet_max',
    faction: 'neutral',
    name: 'Поэт Макс',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: BASE_ANIM,
    defaultPosition: [0, 0, -2.0],
    defaultRotation: Math.PI,
    patrolRadius: 1.5,
    npcSplashProfile: 'npc_rival_poet_max',
    description:
      'Ривальный поэт на городской площади. Бросает вызов прохожим: три раунда, три стиха. Любит резкие метафоры и социальную сатиру. Проигрывает — смеётся. Выигрывает — насмехается. Главное — не победа, а слова между строк.',
    barkTexts: {
      hostile: ['Ты — не поэт. Ты — бухгалтер рифмы.'],
      neutral: ['Три раунда. Три стиха. Толпа — судья. Готов?'],
      friendly: ['Володька. Ты — интересный. Не каждый день — такое. Садись.'],
    },
    ambientBarks: {
      idle: [
        '*перебирает листки* Каждая строчка — заточка. Не — к — крови. К — правде.',
        '*себе под нос* Я выигрываю — и проигрываю одновременно. Так — у — поэтов.',
      ],
      pensive: ['*тихо* Победа — это усталость в форме трофея.'],
    },
    appearance: {
      bodyColor: '#3a2a3a',
      accentColor: '#aa6aaa',
      headAccessory: 'scarf',
      height: 1.0,
      glowColor: '#aa5aaa',
      silhouette: 'slim',
    },
  },

  /* ─────────────── OLD LIBRARIAN FYODOR — keeper of forbidden archive ─────────────── */
  {
    id: 'old_librarian_fyodor',
    faction: 'network',
    name: 'Библиотекарь Фёдор',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.95,
    animations: BASE_ANIM,
    defaultPosition: [1.5, 0, 1.0],
    defaultRotation: -Math.PI / 4,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_old_librarian_fyodor',
    description:
      'Старый библиотекарь Фёдор. Хранит тайну: в подвалах библиотеки спрятан архив доцензурной литературы — книги, которые гильдия пыталась уничтожить десятилетия назад. Дверь откроет только тому, кто заслужил доверие. Три запрещённых книги ждут своего часа.',
    barkTexts: {
      hostile: ['Библиотека — не рынок. Тише. И — уходи.'],
      neutral: ['Помоги с каталогом. Тогда — поговорим. Может быть.'],
      friendly: ['Володька. Ты — заслужил. Дверь — за третьим стеллажом. Три книги. Неси — бережно.'],
    },
    ambientBarks: {
      idle: [
        '*перебирает карточки* Каждая — судьба автора. Каждая — нет — в реестре гильдии.',
        '*себе под нос* Загадка архива — в первых буквах имён. Я — помню. Я — всегда — помню.',
      ],
      pensive: ['*тихо* Если меня найдут — книги сгорят. Я — нет. Книги — да. Так — не — должно.'],
    },
    appearance: {
      bodyColor: '#3a3a3a',
      accentColor: '#8a8a8a',
      headAccessory: 'glasses',
      height: 0.95,
      glowColor: '#aaaaaa',
      silhouette: 'slim',
    },
  },

  /* ─────────────── RADIO OPERATOR KATYA — signal hunter ─────────────── */
  {
    id: 'radio_operator_katya',
    faction: 'network',
    name: 'Радист Катя',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 0.95,
    animations: BASE_ANIM,
    defaultPosition: [-1.0, 0, 1.5],
    defaultRotation: Math.PI / 4,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_radio_operator_katya',
    description:
      'Радист Сети. Перехватила циклический радиосигнал на военной частоте — довоенный шифр, передающийся из-за городской черты годы спустя после Катастрофы. Даёт декодер тому, кто готов идти на восток, к старым бункерам.',
    barkTexts: {
      hostile: ['Частота закрыта. Не лезь.'],
      neutral: ['Сигнал повторяется. Каждые сорок минут. Кто-то — или что-то — там ещё.'],
      friendly: ['Володька. Возьми декодер. Иди на восток. Бункер — довоенный. Старый. Молчаливый.'],
    },
    ambientBarks: {
      idle: [
        '*настраивает приёмник* Шум — это тоже сигнал. Только — чужой. Только — усталый.',
        '*себе под нос* Сорок минут — цикл. Сорок минут — терпение. У — кого — столько?',
      ],
      pensive: ['*тихо* Если сигнал оборвётся — кто-то перестал передавать. Это — хуже, чем — тишина.'],
    },
    appearance: {
      bodyColor: '#2a3a3a',
      accentColor: '#5a9a9a',
      headAccessory: 'glasses',
      height: 0.95,
      glowColor: '#5aaaaa',
      silhouette: 'slim',
    },
  },

  /* ─────────────── SMUGGLER GRISHA — underground courier ─────────────── */
  {
    id: 'smuggler_grisha',
    faction: 'underground',
    name: 'Контрабандист Гриша',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: BASE_ANIM,
    defaultPosition: [2.0, 0, -1.0],
    defaultRotation: -Math.PI / 4,
    patrolRadius: 1.0,
    npcSplashProfile: 'npc_smuggler_grisha',
    description:
      'Контрабандист, знающий безопасные тропы между Общиной и Торговым Союзом. Тропы меняются каждый день. Больше всего на свете не любит патрули — и проигранные ставки.',
    barkTexts: {
      hostile: ['Не знаю тебя. И троп — не знаю. Уходи.'],
      neutral: ['Две стороны. Один груз. Я — посередине. Опасное — место.'],
      friendly: ['Володька. Договорись с обеими сторонами. Я — проведу. В полночь — патруль уходит.'],
    },
    ambientBarks: {
      idle: [
        '*поправляет ремень* Каждый день — новая тропа. Каждый день — новая — цена.',
        '*себе под нос* Патруль уходит в полночь. Я — ухожу в полночь — и — пять. Запас.',
      ],
      pensive: ['*тихо* Когда-нибудь я остановлюсь. Не сегодня. Сегодня — тропы.'],
    },
    appearance: {
      bodyColor: '#3a3a2a',
      accentColor: '#8a8a4a',
      headAccessory: 'hat',
      height: 1.0,
      glowColor: '#aa9a3a',
      silhouette: 'average',
    },
  },

  /* ─────────────── COMMUNITY BUYER —buyer for the Община ─────────────── */
  {
    id: 'community_buyer',
    faction: 'network',
    name: 'Снабженец Общины',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: BASE_ANIM,
    defaultPosition: [-2.0, 0, 1.0],
    defaultRotation: Math.PI / 4,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_community_buyer',
    description:
      'Снабженец Общины — неформального объединения жителей окраин. Принимает медикаменты в обмен на запчасти. Не доверяет гильдии. Не доверяет почти никому. Но — нужна помощь.',
    barkTexts: {
      hostile: ['Община — не торгует с каждым. Уходи.'],
      neutral: ['Если Гриша прислал — слушаю. Если нет — уходи.'],
      friendly: ['Володька. Медикаменты — приму. Запчасти — дам. Но — быстро. Патруль.'],
    },
    ambientBarks: {
      idle: [
        '*перебирает пузырьки* Каждый — для кого-то. Каждый — чья-то — отсрочка.',
        '*себе под нос* Община держится, пока держится доставка. Доставка — держится — на — честности.',
      ],
      pensive: ['*тихо* Когда-нибудь — у нас будет своя аптека. Пока — только — обмен.'],
    },
    appearance: {
      bodyColor: '#2a3a2a',
      accentColor: '#5a8a5a',
      headAccessory: 'scarf',
      height: 1.0,
      glowColor: '#5aaa5a',
      silhouette: 'average',
    },
  },

  /* ─────────────── UNION SUPPLIER — supplier for the Trade Union ─────────────── */
  {
    id: 'union_supplier',
    faction: 'merchant_guild',
    name: 'Поставщик Союза',
    modelPath: NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    scale: 1.0,
    animations: BASE_ANIM,
    defaultPosition: [2.5, 0, 1.5],
    defaultRotation: -Math.PI / 4,
    patrolRadius: 0.5,
    npcSplashProfile: 'npc_union_supplier',
    description:
      'Поставщик Торгового Союза. Запчасти на медикаменты — его специализация. Гордый, не любит Общину, но торговля — превыше всего. Платит щедро, если груз доходит.',
    barkTexts: {
      hostile: ['Союз не разговаривает с каждым. Ищи своего.'],
      neutral: ['Запчасти — есть. Медикаменты — нужны. Обмен — возможен.'],
      friendly: ['Володька. Груз дойдёт — заплачу вдвое. Союз — держит — слово.'],
    },
    ambientBarks: {
      idle: [
        '*протирает деталь* Каждая — чья-то починка. Каждая — чья-то — отсрочка.',
        '*себе под нос* Община — попрошайки. Но — обмен. Обмен — выше — гордости.'],
      pensive: ['*тихо* Когда-нибудь Союз прогнёт Общину. Не сегодня. Сегодня — обмен.'],
    },
    appearance: {
      bodyColor: '#3a2a2a',
      accentColor: '#aa7a5a',
      headAccessory: 'hat',
      height: 1.0,
      glowColor: '#aa6a4a',
      silhouette: 'average',
    },
  },
];
