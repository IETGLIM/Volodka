/* ─── Volodka RPG – Perk / Trait Definitions ───
 * Perks are special abilities/traits the player can choose when leveling up
 * (separate from skill points). They provide unique gameplay modifiers.
 * Perk points are gained every 3 levels (level 3, 6, 9, etc.)
 */

/* ─── Types ─── */

export type PerkCategory = 'survival' | 'social' | 'combat' | 'poetic' | 'technical';

export interface PerkEffect {
  type: 'skill_bonus' | 'energy_max' | 'stress_resist' | 'karma_gain' | 'combat_bonus' | 'poem_power' | 'movement' | 'credits_mult';
  value: number;
  skill?: string;
  description: string;
}

export interface PerkDefinition {
  id: string;
  name: string;
  description: string;
  category: PerkCategory;
  icon: string; // lucide icon name
  // Requirements
  minLevel: number;
  requiredPerks: string[]; // prerequisite perk IDs
  // Effects
  effects: PerkEffect[];
  // Is this a unique perk (can only pick one from a group)?
  mutuallyExclusiveWith?: string[];
  // Flavor text
  flavorText: string;
}

/* ─── Category metadata ─── */

export interface PerkCategoryMeta {
  id: PerkCategory;
  name: string;
  icon: string;
  color: string;
}

export const PERK_CATEGORY_META: Record<PerkCategory, PerkCategoryMeta> = {
  survival: {
    id: 'survival',
    name: 'Выживание',
    icon: 'Shield',
    color: '#34d399', // emerald
  },
  social: {
    id: 'social',
    name: 'Социальные',
    icon: 'Users',
    color: '#a78bfa', // violet
  },
  combat: {
    id: 'combat',
    name: 'Боевые',
    icon: 'Sword',
    color: '#f87171', // red
  },
  poetic: {
    id: 'poetic',
    name: 'Поэтические',
    icon: 'Feather',
    color: '#fbbf24', // amber
  },
  technical: {
    id: 'technical',
    name: 'Технические',
    icon: 'Cpu',
    color: '#22d3ee', // cyan
  },
};

/* ─── Perk Definitions ─── */

export const PERKS: PerkDefinition[] = [
  /* ═══ SURVIVAL PERKS ═══ */
  {
    id: 'night_watch',
    name: 'Ночной дозор',
    description: '+10 макс. энергии ночью. Город не спит — и ты тоже.',
    category: 'survival',
    icon: 'Eye',
    minLevel: 1,
    requiredPerks: [],
    effects: [
      { type: 'energy_max', value: 10, description: '+10 макс. энергии ночью' },
    ],
    flavorText: 'Ночь — не время для сна. Ночь — время для бдения.',
  },
  {
    id: 'stress_resistance',
    name: 'Стрессоустойчивость',
    description: '+20 порог стресса. Ничто не пробьёт твою броню.',
    category: 'survival',
    icon: 'ShieldCheck',
    minLevel: 2,
    requiredPerks: [],
    effects: [
      { type: 'stress_resist', value: 0.2, description: '+20 порог стресса' },
    ],
    flavorText: 'Давление — это привилегия. Стресс — это топливо.',
  },
  {
    id: 'iron_stomach',
    name: 'Желудок стали',
    description: '-25% стресса от сцен. Ничто больше не тревожит.',
    category: 'survival',
    icon: 'ShieldCheck',
    minLevel: 3,
    requiredPerks: [],
    effects: [
      { type: 'stress_resist', value: 0.25, description: '-25% стресса от сцен' },
    ],
    flavorText: 'После третьей чашки синтетического кофе — уже всё равно.',
  },
  {
    id: 'coffee_master',
    name: 'Кофейный Мастер',
    description: '+50% эффект кофе. Кофе — жидкий код.',
    category: 'survival',
    icon: 'Coffee',
    minLevel: 3,
    requiredPerks: ['iron_stomach'],
    effects: [
      { type: 'energy_max', value: 0.5, description: '+50% эффект кофе' },
    ],
    flavorText: 'Синтетический, настоящий — неважно. Главное — градус.',
  },
  {
    id: 'fast_metabolism',
    name: 'Быстрый метаболизм',
    description: '+50% регенерация энергии. Быстрое восстановление.',
    category: 'survival',
    icon: 'Zap',
    minLevel: 3,
    requiredPerks: ['iron_stomach'],
    effects: [
      { type: 'energy_max', value: 0.5, description: '+50% регенерация энергии' },
    ],
    flavorText: 'Твой организм — фабрика по переработке усталости.',
  },
  {
    id: 'invisible',
    name: 'Невидимка',
    description: 'Снижение обнаружения врагами. Тень среди теней.',
    category: 'survival',
    icon: 'Ghost',
    minLevel: 6,
    requiredPerks: ['night_watch'],
    effects: [
      { type: 'movement', value: 0.15, description: 'Снижение обнаружения на 15%' },
    ],
    flavorText: 'Тот, кого не замечают, переживает всех.',
  },

  /* ═══ SOCIAL PERKS ═══ */
  {
    id: 'street_charisma',
    name: 'Харизма улиц',
    description: '+2 убеждение с NPC. Твои слова находят путь.',
    category: 'social',
    icon: 'Megaphone',
    minLevel: 1,
    requiredPerks: [],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'persuasion', description: '+2 убеждение' },
    ],
    flavorText: 'Улица учит говорить так, чтобы слушали.',
  },
  {
    id: 'word_for_word',
    name: 'Слово в слово',
    description: '+2 эмпатия в диалогах. Ты слышишь больше, чем говорят.',
    category: 'social',
    icon: 'MessageCircle',
    minLevel: 3,
    requiredPerks: [],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'empathy', description: '+2 эмпатия' },
    ],
    flavorText: 'Между строк — целый мир.',
  },
  {
    id: 'digital_intuitive',
    name: 'Цифровой Интуит',
    description: '+2 интуиция. Цифры говорят тебе больше, чем людям.',
    category: 'social',
    icon: 'Sparkles',
    minLevel: 2,
    requiredPerks: [],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'intuition', description: '+2 интуиция' },
    ],
    flavorText: 'Интуиция — это просто подсознательный анализ данных.',
  },
  {
    id: 'heart_hacker',
    name: 'Хакер Сердца',
    description: '+2 эмпатия, +1 убеждение. Сердца — тоже системы.',
    category: 'social',
    icon: 'Heart',
    minLevel: 4,
    requiredPerks: ['word_for_word'],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'empathy', description: '+2 эмпатия' },
      { type: 'skill_bonus', value: 1, skill: 'persuasion', description: '+1 убеждение' },
    ],
    flavorText: 'Взломать сердце — сложнее, чем пароль. Но принцип тот же.',
  },
  {
    id: 'authority',
    name: 'Авторитет',
    description: 'Разблокируй специальные опции диалога. Твой голос — закон.',
    category: 'social',
    icon: 'Crown',
    minLevel: 6,
    requiredPerks: ['street_charisma', 'word_for_word'],
    mutuallyExclusiveWith: ['friend_of_all'],
    effects: [
      { type: 'karma_gain', value: 0.15, description: '+15% кармы от выборов' },
    ],
    flavorText: 'Власть — не в силе, а в слове, которое нельзя игнорировать.',
  },
  {
    id: 'friend_of_all',
    name: 'Друг всех',
    description: '+50% прирост отношений. Каждый — твой потенциальный союзник.',
    category: 'social',
    icon: 'HeartHandshake',
    minLevel: 6,
    requiredPerks: ['street_charisma', 'word_for_word'],
    mutuallyExclusiveWith: ['authority'],
    effects: [
      { type: 'credits_mult', value: 0.5, description: '+50% прирост отношений' },
    ],
    flavorText: 'Нет чужих — есть ещё не знакомые.',
  },

  /* ═══ COMBAT PERKS ═══ */
  {
    id: 'combat_meditation',
    name: 'Боевая медитация',
    description: '+3 защита в спокойном состоянии. Безмятежность — щит.',
    category: 'combat',
    icon: 'Brain',
    minLevel: 1,
    requiredPerks: [],
    effects: [
      { type: 'combat_bonus', value: 3, description: '+3 защита при стрессе < 30' },
    ],
    flavorText: 'Пустой разум — непробиваемая стена.',
  },
  {
    id: 'counterattack',
    name: 'Контратака',
    description: 'Шанс контрудара после защиты. Мягкое поглощает жёсткое.',
    category: 'combat',
    icon: 'Swords',
    minLevel: 3,
    requiredPerks: ['combat_meditation'],
    effects: [
      { type: 'combat_bonus', value: 0.25, description: '25% шанс контрудара при защите' },
    ],
    flavorText: 'Лучший удар — тот, который ждёт в засаде.',
  },
  {
    id: 'fortitude',
    name: 'Стойкость',
    description: '-20% получаемого урона. Ты — скала среди бури.',
    category: 'combat',
    icon: 'Shield',
    minLevel: 3,
    requiredPerks: [],
    effects: [
      { type: 'combat_bonus', value: -0.2, description: '-20% получаемого урона' },
    ],
    flavorText: 'Скала не сдаётся ветру. Она ждёт, пока он утихнет.',
  },
  {
    id: 'code_rage',
    name: 'Ярость кода',
    description: '+4 атака когда стресс > 60. Гнев — твой алгоритм.',
    category: 'combat',
    icon: 'Flame',
    minLevel: 6,
    requiredPerks: ['fortitude'],
    effects: [
      { type: 'combat_bonus', value: 4, description: '+4 атака при стрессе > 60' },
    ],
    flavorText: 'Код горит. Ошибки плавятся. Ты — компилятор разрушения.',
  },

  /* ═══ POETIC PERKS ═══ */
  {
    id: 'voice_of_elements',
    name: 'Голос стихии',
    description: 'Стихотворные силы на 50% дольше. Стих — это вечность.',
    category: 'poetic',
    icon: 'Wind',
    minLevel: 1,
    requiredPerks: [],
    effects: [
      { type: 'poem_power', value: 0.5, description: '+50% длительность стихотворных сил' },
    ],
    flavorText: 'Стих не кончается. Он лишь меняет форму.',
  },
  {
    id: 'warrior_poet',
    name: 'Поэт Воина',
    description: '+50% длительность силы стихов в бою. Стих — оружие.',
    category: 'poetic',
    icon: 'Swords',
    minLevel: 2,
    requiredPerks: ['voice_of_elements'],
    effects: [
      { type: 'poem_power', value: 0.5, description: '+50% длительность силы стихов' },
    ],
    flavorText: 'Перо острее меча. Особенно — в киберпространстве.',
  },
  {
    id: 'rhyme_mythme',
    name: 'Рифма-Мифма',
    description: '+2 писательство, открывает скрытые смыслы стихов.',
    category: 'poetic',
    icon: 'BookOpen',
    minLevel: 3,
    requiredPerks: [],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'writing', description: '+2 писательство' },
    ],
    flavorText: 'В каждой рифме — миф. В каждом мифе — рифма.',
  },
  {
    id: 'poetry_master',
    name: 'Мастер Стихов',
    description: '+2 писательство. Твои стихи меняют реальность.',
    category: 'poetic',
    icon: 'Feather',
    minLevel: 4,
    requiredPerks: ['rhyme_mythme'],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'writing', description: '+2 писательство' },
    ],
    flavorText: 'Мастер не пишет стихи — он их компилирует из воздуха.',
  },
  {
    id: 'poetic_trance',
    name: 'Поэтический транс',
    description: '+3 интуиция при использовании стихов. Глас муз.',
    category: 'poetic',
    icon: 'Sparkles',
    minLevel: 3,
    requiredPerks: ['voice_of_elements'],
    effects: [
      { type: 'skill_bonus', value: 3, skill: 'intuition', description: '+3 интуиция при стихах' },
    ],
    flavorText: 'Слова приходят не из разума — из того, что за ним.',
  },
  {
    id: 'whisper_of_muses',
    name: 'Шёпот муз',
    description: 'Пассивное снижение перезарядки стихотворных сил. Музы не молчат.',
    category: 'poetic',
    icon: 'Music',
    minLevel: 6,
    requiredPerks: ['rhyme_mythme', 'poetic_trance'],
    effects: [
      { type: 'poem_power', value: 0.25, description: '-25% перезарядка стихотворных сил' },
    ],
    flavorText: 'Музы шепчут тем, кто умеет слушать тишину.',
  },

  /* ═══ TECHNICAL PERKS ═══ */
  {
    id: 'hacker_instinct',
    name: 'Хакерский инстинкт',
    description: '+2 кодинг для мини-игр. Данные — твоя стихия.',
    category: 'technical',
    icon: 'Terminal',
    minLevel: 1,
    requiredPerks: [],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'coding', description: '+2 кодинг' },
    ],
    flavorText: 'Там, где другие видят стену, ты видишь порт.',
  },
  {
    id: 'night_coder',
    name: 'Ночной Кодер',
    description: '+1 кодинг ночью. Ночной код — самый чистый.',
    category: 'technical',
    icon: 'Moon',
    minLevel: 2,
    requiredPerks: ['hacker_instinct'],
    effects: [
      { type: 'skill_bonus', value: 1, skill: 'coding', description: '+1 кодинг ночью' },
    ],
    flavorText: 'Компилятор не спит. И ты тоже.',
  },
  {
    id: 'data_analysis',
    name: 'Анализ данных',
    description: '+2 логика для решения головоломок. Паттерны повсюду.',
    category: 'technical',
    icon: 'BarChart3',
    minLevel: 3,
    requiredPerks: [],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'logic', description: '+2 логика' },
    ],
    flavorText: 'В хаосе данных — порядок. В порядке — истина.',
  },
  {
    id: 'neurohacker',
    name: 'Нейрохакер',
    description: '+2 логика, +1 кодинг. Твой разум — машина.',
    category: 'technical',
    icon: 'BrainCircuit',
    minLevel: 6,
    requiredPerks: ['hacker_instinct', 'data_analysis'],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'logic', description: '+2 логика' },
      { type: 'skill_bonus', value: 1, skill: 'coding', description: '+1 кодинг' },
    ],
    flavorText: 'Нейроны перепрошиты. Синапсы оптимизированы. Ты — следующая итерация.',
  },
  {
    id: 'system_view',
    name: 'Системный взгляд',
    description: 'Раскрывает скрытые взаимодействия. Ты видишь систему.',
    category: 'technical',
    icon: 'Scan',
    minLevel: 3,
    requiredPerks: ['hacker_instinct'],
    effects: [
      { type: 'skill_bonus', value: 1, skill: 'logic', description: '+1 логика' },
      { type: 'skill_bonus', value: 1, skill: 'intuition', description: '+1 интуиция' },
    ],
    flavorText: 'Система — не клетка. Система — карта.',
  },
  {
    id: 'cyber_reflexes',
    name: 'Кибер-рефлексы',
    description: '+20% скорость перемещения. Ускорение — твоя природа.',
    category: 'technical',
    icon: 'Activity',
    minLevel: 6,
    requiredPerks: ['hacker_instinct', 'data_analysis'],
    effects: [
      { type: 'movement', value: 0.2, description: '+20% скорость перемещения' },
    ],
    flavorText: 'Нейроны — медленные. Кибернетика — мгновенная.',
  },
  /* ════════════ NEW PERKS for Extended Gameplay ════════════ */
  {
    id: 'stress_mastery',
    name: 'Мастер Стресса',
    description: 'Стресс больше не враг — он становится топливом. При высоком стрессе ваши способности усиливаются.',
    category: 'survival',
    icon: 'Flame',
    minLevel: 15,
    requiredPerks: ['iron_will'],
    effects: [
      { type: 'stress_resist', value: 0.3, description: '+30% сопротивление стрессу' },
      { type: 'combat_bonus', value: 0.15, description: '+15% урона при стрессе > 50' },
    ],
    flavorText: 'Давление создаёт алмазы. Или ломает. Выбор за тобой.',
  },
  {
    id: 'poem_mastery',
    name: 'Мастер Стиха',
    description: 'Глубокое понимание поэзии открывает новые грани силы. Каждое собранное стихотворение усиливает все способности.',
    category: 'poetic',
    icon: 'BookOpen',
    minLevel: 12,
    requiredPerks: ['poetic_soul'],
    effects: [
      { type: 'poem_power', value: 0.25, description: '+25% к силе стихов' },
      { type: 'karma_gain', value: 0.2, description: '+20% к получаемой карме' },
    ],
    flavorText: 'Каждая строка — ключ. Каждый стих — дверь.',
  },
  {
    id: 'shadow_walker',
    name: 'Теневой Странник',
    description: 'Ты научился двигаться в тенях Сети незамеченным. Шанс избежать случайного боя увеличен.',
    category: 'technical',
    icon: 'EyeOff',
    minLevel: 10,
    requiredPerks: ['hacker_instinct'],
    effects: [
      { type: 'movement', value: 0.15, description: '+15% скорость в ночное время' },
      { type: 'combat_bonus', value: 0.1, description: '+10% шанс избежать боя' },
    ],
    flavorText: 'Лучший бой — тот, которого не было.',
  },
  {
    id: 'guild_diplomat',
    name: 'Дипломат Гильдии',
    description: 'Твоё слово имеет вес в гильдии. Лучшие цены у торговцев, больше уважения от NPC.',
    category: 'social',
    icon: 'Handshake',
    minLevel: 8,
    requiredPerks: [],
    effects: [
      { type: 'credits_mult', value: 0.3, description: '+30% кредитов от продаж' },
      { type: 'karma_gain', value: 0.15, description: '+15% к отношениям с NPC' },
    ],
    flavorText: 'В мире, где правят алгоритмы, личные связи — единственная валюта.',
  },
  {
    id: 'lore_keeper',
    name: 'Хранитель Знаний',
    description: 'Каждая раскрытая тайна мира приносит опыт. Знание — сила в самом буквальном смысле.',
    category: 'poetic',
    icon: 'ScrollText',
    minLevel: 14,
    requiredPerks: ['poem_mastery'],
    effects: [
      { type: 'skill_bonus', value: 3, skill: 'intuition', description: '+3 к интуиции за каждые 5 записей лора' },
    ],
    flavorText: 'История пишется теми, кто её помнит.',
  },
  {
    id: 'factory_rat',
    name: 'Заводская Крыса',
    description: 'Ты знаешь каждый угол заброшенного завода. Там, где другие видят опасность, ты видишь ресурсы.',
    category: 'survival',
    icon: 'Wrench',
    minLevel: 12,
    requiredPerks: ['scavenger'],
    effects: [
      { type: 'skill_bonus', value: 2, skill: 'logic', description: '+2 к логике на заводе' },
      { type: 'energy_max', value: 15, description: '+15 к максимальной энергии' },
    ],
    flavorText: 'Заброшенное — не значит бесполезное.',
  },
  {
    id: 'night_owl',
    name: 'Ночная Сова',
    description: 'Ночь — твоё время. В темноте ты быстрее, сильнее и внимательнее.',
    category: 'survival',
    icon: 'Moon',
    minLevel: 9,
    requiredPerks: [],
    effects: [
      { type: 'movement', value: 0.25, description: '+25% скорость ночью' },
      { type: 'combat_bonus', value: 0.12, description: '+12% урона ночью' },
    ],
    flavorText: 'Пока город спит, его настоящие хозяева выходят на охоту.',
    mutuallyExclusiveWith: ['shadow_walker'],
  },
  {
    id: 'code_poet',
    name: 'Код-Поэт',
    description: 'Ты достиг гармонии между кодом и стихом. Комбо-атаки в бою наносят значительно больше урона.',
    category: 'combat',
    icon: 'Zap',
    minLevel: 18,
    requiredPerks: ['combat_veteran', 'poem_mastery'],
    effects: [
      { type: 'combat_bonus', value: 0.4, description: '+40% урона при комбо x3 и выше' },
    ],
    flavorText: 'Когда код рифмуется, реальность подчиняется.',
  },
];

/* ─── Lookup map ─── */

export const PERKS_MAP: Record<string, PerkDefinition> = {};
for (const perk of PERKS) {
  PERKS_MAP[perk.id] = perk;
}

/* ─── Perks by category ─── */

export const PERKS_BY_CATEGORY: Record<PerkCategory, PerkDefinition[]> = {
  survival: PERKS.filter((p) => p.category === 'survival'),
  social: PERKS.filter((p) => p.category === 'social'),
  combat: PERKS.filter((p) => p.category === 'combat'),
  poetic: PERKS.filter((p) => p.category === 'poetic'),
  technical: PERKS.filter((p) => p.category === 'technical'),
};
