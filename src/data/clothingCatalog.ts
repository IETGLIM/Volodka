/* ─── Volodka RPG – Clothing/Appearance Catalog ───
 * Disco Elysium-style outfit system: clothing affects stats,
 * NPC reactions, and dialogue skill checks.
 * Post-Soviet cyberpunk aesthetic — all names/descriptions in Russian.
 */

import type { EquipmentSlot, DialogueModifier } from '@/shared/types/definitions/items';
import type { ItemRarity, ItemEffect } from '@/data/items';

/* ─── Social perception tags ─── */
export type SocialPerceptionTag =
  | 'official'
  | 'shabby'
  | 'cyberpunk_chic'
  | 'casual'
  | 'worker'
  | 'suspicious';

/* ─── Clothing item definition ─── */
export interface ClothingDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly slot: EquipmentSlot;
  readonly rarity: ItemRarity;
  readonly effects: ItemEffect[];
  /** Social perception tags that affect NPC reactions and dialogue gating. */
  readonly socialPerception: SocialPerceptionTag[];
  /** Dialogue modifiers (DC adjustment, skill bonuses, tag gating). */
  readonly dialogueModifier?: DialogueModifier;
  /** Visual tag for future 3D model/texture swapping. */
  readonly visualTag: string;
  /** Icon name (lucide) for inventory display. */
  readonly icon: string;
}

/* ══════════════════════════════════════════════════════════════
   Clothing Catalog — 20 items across 6 slots
   ══════════════════════════════════════════════════════════════ */

export const CLOTHING_CATALOG: readonly ClothingDefinition[] = [
  /* ── Head (4) ── */

  {
    id: 'ushanka_worn',
    name: 'Старая ушанка',
    description: 'Потёртая ушанка из советских времён. Мех выцвел, но всё ещё греет. Пахнет мазутом и nostalgia.',
    slot: 'head',
    rarity: 'common',
    effects: [{ stat: 'energy', value: 2 }],
    socialPerception: ['shabby'],
    dialogueModifier: { dcAdjustment: 1, lockTag: 'formal_only' },
    visualTag: 'head_ushanka_worn',
    icon: 'HardHat',
  },
  {
    id: 'cyber_visor',
    name: 'Кибер-визор',
    description: 'Полупрозрачный визор с HUD-проекцией. Видишь код в воздухе, другие видят — угрозу.',
    slot: 'head',
    rarity: 'rare',
    effects: [{ skill: 'coding', value: 2 }],
    socialPerception: ['cyberpunk_chic'],
    dialogueModifier: { skillBonus: { coding: 1 }, unlockTag: 'cyber_access' },
    visualTag: 'head_cyber_visor',
    icon: 'Eye',
  },
  {
    id: 'hard_hat',
    name: 'Каска инженера',
    description: 'Жёлтая каска с логотипом «Хрома-М». Символ порядка и технорегламента.',
    slot: 'head',
    rarity: 'common',
    effects: [{ stat: 'energy', value: 3 }],
    socialPerception: ['worker', 'official'],
    dialogueModifier: { unlockTag: 'worker_dialogue', lockTag: 'rebel_only' },
    visualTag: 'head_hard_hat',
    icon: 'Construction',
  },
  {
    id: 'bandana_neon',
    name: 'Неоновая бандана',
    description: 'Ткань с пульсирующим неоновым узором. Выделяет в толпе — не всегда к месту.',
    slot: 'head',
    rarity: 'uncommon',
    effects: [{ skill: 'intuition', value: 1 }],
    socialPerception: ['cyberpunk_chic', 'suspicious'],
    dialogueModifier: { dcAdjustment: -1, unlockTag: 'underground_access' },
    visualTag: 'head_bandana_neon',
    icon: 'Bandana',
  },

  /* ── Body (5) ── */

  {
    id: 'worn_jacket',
    name: 'Потёртая куртка',
    description: 'Куртка с заплатками на локтях. Застёжки сломаны, но привычка сильнее холода.',
    slot: 'body',
    rarity: 'common',
    effects: [{ stat: 'stress', value: -1 }],
    socialPerception: ['shabby', 'casual'],
    dialogueModifier: { lockTag: 'formal_only' },
    visualTag: 'body_worn_jacket',
    icon: 'Shirt',
  },
  {
    id: 'it_uniform',
    name: 'Униформа IT-отдела',
    description: 'Строгая серая униформа с гильдейским значком на груди. Порядок, регламент, дедлайн.',
    slot: 'body',
    rarity: 'uncommon',
    effects: [{ skill: 'logic', value: 2 }],
    socialPerception: ['official'],
    dialogueModifier: { skillBonus: { logic: 1 }, unlockTag: 'guild_access', lockTag: 'rebel_only' },
    visualTag: 'body_it_uniform',
    icon: 'Briefcase',
  },
  {
    id: 'cyber_coat',
    name: 'Кибер-плащ',
    description: 'Плащ из умной ткани: адаптирует цвет к окружению, поднимает подозрения к потолку.',
    slot: 'body',
    rarity: 'rare',
    effects: [{ skill: 'coding', value: 2 }, { stat: 'energy', value: 3 }],
    socialPerception: ['cyberpunk_chic', 'suspicious'],
    dialogueModifier: { dcAdjustment: -1, skillBonus: { coding: 1 }, unlockTag: 'cyber_access' },
    visualTag: 'body_cyber_coat',
    icon: 'Cloud',
  },
  {
    id: 'leather_jacket',
    name: 'Кожанка',
    description: 'Тяжёлая кожаная куртка. Щиты от ветра, от пули — нет. Но выглядит убедительно.',
    slot: 'body',
    rarity: 'uncommon',
    effects: [{ skill: 'persuasion', value: 1 }, { stat: 'energy', value: 2 }],
    socialPerception: ['casual'],
    dialogueModifier: { skillBonus: { persuasion: 1 } },
    visualTag: 'body_leather_jacket',
    icon: 'Shield',
  },
  {
    id: 'worker_overalls',
    name: 'Рабочий халат',
    description: 'Маслянистый халат с пятнами от машинного масла. Труд как идентичность, грязь как честь.',
    slot: 'body',
    rarity: 'common',
    effects: [{ stat: 'energy', value: 1 }],
    socialPerception: ['worker', 'shabby'],
    dialogueModifier: { unlockTag: 'worker_dialogue', lockTag: 'formal_only' },
    visualTag: 'body_worker_overalls',
    icon: 'Wrench',
  },

  /* ── Legs (4) ── */

  {
    id: 'worn_jeans',
    name: 'Потёртые джинсы',
    description: 'Джинсы, пережившие три зимы и один крах системы. Мягкие как советская память.',
    slot: 'legs',
    rarity: 'common',
    effects: [],
    socialPerception: ['shabby', 'casual'],
    visualTag: 'legs_worn_jeans',
    icon: 'User',
  },
  {
    id: 'cyber_pants',
    name: 'Кибер-брюки',
    description: 'Брюки с встроенными кабельными каналами. Электричество бежит по ткани быстрее, чем по нервам.',
    slot: 'legs',
    rarity: 'uncommon',
    effects: [{ skill: 'coding', value: 1 }],
    socialPerception: ['cyberpunk_chic'],
    dialogueModifier: { unlockTag: 'cyber_access' },
    visualTag: 'legs_cyber_pants',
    icon: 'Cable',
  },
  {
    id: 'uniform_pants',
    name: 'Форменные брюки',
    description: 'Строго выутюженные брюки с гильдейской нашивкой. Шаг чёткий, взгляд прямой, совесть — спорная.',
    slot: 'legs',
    rarity: 'common',
    effects: [],
    socialPerception: ['official'],
    dialogueModifier: { unlockTag: 'guild_access' },
    visualTag: 'legs_uniform_pants',
    icon: 'Scale',
  },
  {
    id: 'track_pants',
    name: 'Треники',
    description: 'Спортивные штаны из советского трикотажа. Удобно, но уважение — сомнительное.',
    slot: 'legs',
    rarity: 'common',
    effects: [{ stat: 'energy', value: 1 }],
    socialPerception: ['casual', 'worker'],
    visualTag: 'legs_track_pants',
    icon: 'Activity',
  },

  /* ── Feet (3) ── */

  {
    id: 'worn_boots',
    name: 'Стоптанные ботинки',
    description: 'Ботинки с дырками на подошвах. Дождь приходит внутрь раньше, чем в квартиру.',
    slot: 'feet',
    rarity: 'common',
    effects: [],
    socialPerception: ['shabby'],
    dialogueModifier: { lockTag: 'formal_only' },
    visualTag: 'feet_worn_boots',
    icon: 'Footprints',
  },
  {
    id: 'cyber_sneakers',
    name: 'Кибер-кроссовки',
    description: 'Кроссовки с пружинными подошвами и LED-подсветкой. Каждый шаг — микро-вычисление.',
    slot: 'feet',
    rarity: 'uncommon',
    effects: [{ skill: 'rhythm', value: 1 }],
    socialPerception: ['cyberpunk_chic'],
    dialogueModifier: { skillBonus: { rhythm: 1 } },
    visualTag: 'feet_cyber_sneakers',
    icon: 'Zap',
  },
  {
    id: 'formal_shoes',
    name: 'Официальные туфли',
    description: 'Чёрные туфли с безупречным блеском. Отражают свет, не отражают правду.',
    slot: 'feet',
    rarity: 'common',
    effects: [],
    socialPerception: ['official'],
    dialogueModifier: { unlockTag: 'guild_access', lockTag: 'underground_access' },
    visualTag: 'feet_formal_shoes',
    icon: 'Diamond',
  },

  /* ── Hands (2) ── */

  {
    id: 'work_gloves',
    name: 'Рабочие перчатки',
    description: 'Перчатки с прорезиненными накладками. Не для нежных рук — для тех, кто держит кран.',
    slot: 'hands',
    rarity: 'common',
    effects: [{ stat: 'energy', value: 1 }],
    socialPerception: ['worker'],
    dialogueModifier: { unlockTag: 'worker_dialogue' },
    visualTag: 'hands_work_gloves',
    icon: 'Hand',
  },
  {
    id: 'cyber_gloves',
    name: 'Кибер-перчатки',
    description: 'Перчатки с сенсорными панелями на пальцах. Код пишешь в воздухе, как стих — в голове.',
    slot: 'hands',
    rarity: 'rare',
    effects: [{ skill: 'coding', value: 2 }],
    socialPerception: ['cyberpunk_chic'],
    dialogueModifier: { skillBonus: { coding: 1 }, unlockTag: 'cyber_access' },
    visualTag: 'hands_cyber_gloves',
    icon: 'GripVertical',
  },

  /* ── Accessory (2) ── */

  {
    id: 'server_tag',
    name: 'Бейдж серверщика',
    description: 'Пластиковый бейдж с надписью «СЕРВЕРЩИК-III». Скучный, но открывает двери.',
    slot: 'accessory',
    rarity: 'common',
    effects: [{ skill: 'logic', value: 1 }],
    socialPerception: ['official'],
    dialogueModifier: { skillBonus: { logic: 1 }, unlockTag: 'guild_access' },
    visualTag: 'accessory_server_tag',
    icon: 'Badge',
  },
  {
    id: 'poetry_amulet',
    name: 'Поэтический амулет',
    description: 'Амулет из переплетённых строк и фольги. Строки защищают лучше, чем железо.',
    slot: 'accessory',
    rarity: 'uncommon',
    effects: [{ skill: 'empathy', value: 2 }, { skill: 'writing', value: 1 }],
    socialPerception: ['suspicious'],
    dialogueModifier: { skillBonus: { empathy: 1, writing: 1 }, unlockTag: 'poet_access', lockTag: 'formal_only' },
    visualTag: 'accessory_poetry_amulet',
    icon: 'Sparkles',
  },
] as const;

/* ─── Lookup helpers ─── */

const CLOTHING_MAP = new Map<string, ClothingDefinition>(
  CLOTHING_CATALOG.map((c) => [c.id, c]),
);

/** Get a clothing definition by ID. */
export function getClothingById(id: string): ClothingDefinition | undefined {
  return CLOTHING_MAP.get(id);
}

/** Get all clothing items for a specific equipment slot. */
export function getClothingBySlot(slot: EquipmentSlot): ClothingDefinition[] {
  return CLOTHING_CATALOG.filter((c) => c.slot === slot);
}

/** All social perception tags used across the catalog. */
export const ALL_SOCIAL_PERCEPTION_TAGS: readonly SocialPerceptionTag[] = [
  'official',
  'shabby',
  'cyberpunk_chic',
  'casual',
  'worker',
  'suspicious',
];
