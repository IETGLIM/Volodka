/* ─── Volodka RPG – Crafting Recipes ─── */

import type { TrainablePlayerSkill } from '@/shared/types/game';
import type { ItemRarity } from '@/data/items';

/* ─── Types ─── */

export type CraftingCategory = 'equipment' | 'consumable' | 'quest';

export interface RecipeInput {
  itemId: string;
  quantity: number;
}

export interface RecipeOutput {
  itemId: string;
  quantity: number;
}

export interface SkillRequirement {
  skill: TrainablePlayerSkill;
  level: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  category: CraftingCategory;
  inputs: RecipeInput[];
  output: RecipeOutput;
  skillRequirements: SkillRequirement[];
  /** Crafting time in milliseconds (visual delay only) */
  craftingTime: number;
  /** Rarity of the output item */
  outputRarity: ItemRarity;
}

/* ─── Recipes ─── */

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    id: 'recipe_digital_amulet',
    name: 'Цифровой Амулет',
    description: 'Защитный амулет из зашифрованных строк и кремния. Отражает цифровые атаки.',
    category: 'equipment',
    inputs: [
      { itemId: 'encrypted_scroll', quantity: 1 },
      { itemId: 'circuit_board', quantity: 1 },
    ],
    output: { itemId: 'digital_amulet', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 5 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_poetic_compiler',
    name: 'Поэтический Компилятор',
    description: 'Устройство, превращающее стихи в исполняемый код. Искусство становится силой.',
    category: 'equipment',
    inputs: [
      { itemId: 'old_poetry_book', quantity: 1 },
      { itemId: 'server_fragment', quantity: 1 },
    ],
    output: { itemId: 'poetic_compiler', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 5 },
      { skill: 'coding', level: 3 },
    ],
    craftingTime: 2000,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_neural_filter',
    name: 'Нейросетевой Фильтр',
    description: 'Имплант, фильтрующий информационный шум. Ясность мысли — ясность кода.',
    category: 'equipment',
    inputs: [
      { itemId: 'data_chip', quantity: 1 },
      { itemId: 'coffee_extract', quantity: 2 },
    ],
    output: { itemId: 'neural_filter', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 4 },
    ],
    craftingTime: 1200,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_turing_stethoscope',
    name: 'Стетоскоп Тьюринга',
    description: 'Акустический анализатор кода. Слышит пульс программ на расстоянии.',
    category: 'equipment',
    inputs: [
      { itemId: 'broken_headphones', quantity: 1 },
      { itemId: 'copper_wire', quantity: 2 },
    ],
    output: { itemId: 'turing_stethoscope', quantity: 1 },
    skillRequirements: [
      { skill: 'intuition', level: 3 },
    ],
    craftingTime: 1000,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_ghost_key',
    name: 'Призрачный Ключ',
    description: 'Полупрозрачный ключ, открывающий замки, которых не существует.',
    category: 'quest',
    inputs: [
      { itemId: 'vault_key_fragment', quantity: 1 },
      { itemId: 'digital_ghost_trace', quantity: 1 },
    ],
    output: { itemId: 'ghost_key', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 8 },
      { skill: 'intuition', level: 6 },
    ],
    craftingTime: 3000,
    outputRarity: 'legendary',
  },
  {
    id: 'recipe_cyber_balm',
    name: 'Кибер-Бальзам',
    description: 'Целебный гель с наночастицами. Восстанавливает тело и разум.',
    category: 'consumable',
    inputs: [
      { itemId: 'herbal_tea', quantity: 1 },
      { itemId: 'nano_patch', quantity: 1 },
    ],
    output: { itemId: 'cyber_balm', quantity: 1 },
    skillRequirements: [],
    craftingTime: 800,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_existential_shield',
    name: 'Экзистенциальный Щит',
    description: 'Барьер из чистой поэзии, защищающий от экзистенциального ужаса.',
    category: 'equipment',
    inputs: [
      { itemId: 'poem_fragment', quantity: 2 },
      { itemId: 'firewall_code', quantity: 1 },
    ],
    output: { itemId: 'existential_shield', quantity: 1 },
    skillRequirements: [
      { skill: 'empathy', level: 5 },
      { skill: 'writing', level: 4 },
    ],
    craftingTime: 2000,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_philosopher_stone',
    name: 'Философский Камень',
    description: 'Легендарный артефакт, превращающий данные в мудрость. Алхимия цифровой эры.',
    category: 'equipment',
    inputs: [
      { itemId: 'rare_alloy', quantity: 3 },
      { itemId: 'daemon_core', quantity: 1 },
    ],
    output: { itemId: 'philosopher_stone', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 10 },
      { skill: 'coding', level: 10 },
    ],
    craftingTime: 4000,
    outputRarity: 'legendary',
  },
  {
    id: 'recipe_cipher_of_freedom',
    name: 'Шифр Свободы',
    description: 'Ключ абсолютной расшифровки. Открывает любые закрытые каналы связи.',
    category: 'quest',
    inputs: [
      { itemId: 'network_comm_key', quantity: 1 },
      { itemId: 'encrypted_scroll', quantity: 1 },
    ],
    output: { itemId: 'cipher_of_freedom', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 7 },
      { skill: 'persuasion', level: 5 },
    ],
    craftingTime: 2500,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_poetry_virus',
    name: 'Стихотворный Вирус',
    description: 'Самораспространяющийся код, несущий стихи. Меняет реальность словами.',
    category: 'equipment',
    inputs: [
      { itemId: 'living_code_fragment', quantity: 1 },
      { itemId: 'usb_drive', quantity: 1 },
    ],
    output: { itemId: 'poetry_virus', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 8 },
      { skill: 'coding', level: 6 },
    ],
    craftingTime: 3000,
    outputRarity: 'legendary',
  },
  /* ════════════ NEW RECIPES ════════════ */
  {
    id: 'stress_converter',
    name: 'Конвертер Стресса',
    description: 'Устройство, превращающее накопленный стресс в чистую энергию. Рискованно, но эффективно.',
    category: 'consumable',
    inputs: [
      { itemId: 'circuit_board', quantity: 2 },
      { itemId: 'nano_patch', quantity: 1 },
      { itemId: 'energy_drink', quantity: 1 },
    ],
    output: { itemId: 'stress_converter', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 6 },
      { skill: 'coding', level: 4 },
    ],
    craftingTime: 2000,
    outputRarity: 'rare',
  },
  {
    id: 'neural_amplifier',
    name: 'Нейро-Усилитель',
    description: 'Имплант, временно усиливающий все навыки. Побочные эффекты включают... поэтическое вдохновение.',
    category: 'equipment',
    inputs: [
      { itemId: 'daemon_core', quantity: 1 },
      { itemId: 'code_fragment', quantity: 3 },
      { itemId: 'digital_ghost_trace', quantity: 1 },
    ],
    output: { itemId: 'neural_amplifier', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 8 },
      { skill: 'intuition', level: 6 },
      { skill: 'empathy', level: 4 },
    ],
    craftingTime: 4000,
    outputRarity: 'legendary',
  },
  {
    id: 'shadow_cloak_mod',
    name: 'Теневой Плащ (Мод)',
    description: 'Модифицированный теневой плащ с улучшенной невидимостью. Позволяет проходить мимо врагов незамеченным.',
    category: 'equipment',
    inputs: [
      { itemId: 'shadow_cloak', quantity: 1 },
      { itemId: 'digital_ghost_trace', quantity: 2 },
      { itemId: 'nano_patch', quantity: 1 },
    ],
    output: { itemId: 'shadow_cloak_mod', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 7 },
      { skill: 'intuition', level: 5 },
    ],
    craftingTime: 3000,
    outputRarity: 'legendary',
  },
  {
    id: 'memory_crystal',
    name: 'Кристалл Памяти',
    description: 'Кристалл, хранящий фрагмент стихотворения в чистом виде. Открывает доступ к скрытым строкам мира.',
    category: 'quest',
    inputs: [
      { itemId: 'poem_fragment', quantity: 3 },
      { itemId: 'old_poetry_book', quantity: 1 },
      { itemId: 'living_code_fragment', quantity: 1 },
    ],
    output: { itemId: 'memory_crystal', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 10 },
      { skill: 'intuition', level: 8 },
    ],
    craftingTime: 5000,
    outputRarity: 'legendary',
  },
  {
    id: 'combat_stim_plus',
    name: 'Боевой Стим+',
    description: 'Улучшенная версия боевого стимулятора. Временно повышает все боевые характеристики, но увеличивает стресс.',
    category: 'consumable',
    inputs: [
      { itemId: 'combat_stim', quantity: 1 },
      { itemId: 'energy_drink', quantity: 2 },
      { itemId: 'painkiller', quantity: 1 },
    ],
    output: { itemId: 'combat_stim_plus', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 5 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },
  /* ════════════ CRAFTING EXPANSION (Task 7d) ════════════ */
  {
    id: 'recipe_coffee_energy',
    name: 'Кофе с энергетиком',
    description: 'Смертельная смесь чёрного кофе и энергетика «Код». Восстановление энергии +20.',
    category: 'consumable',
    inputs: [
      { itemId: 'coffee', quantity: 1 },
      { itemId: 'energy_drink', quantity: 1 },
    ],
    output: { itemId: 'restored_energy_boost', quantity: 1 },
    skillRequirements: [],
    craftingTime: 400,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_signal_booster',
    name: 'Самодельная антенна',
    description: 'Антенна из металлолома и перепрошитого USB-накопителя. Усиливает сигнал в мёртвых зонах.',
    category: 'quest',
    inputs: [
      { itemId: 'scraps', quantity: 3 },
      { itemId: 'usb_drive', quantity: 1 },
    ],
    output: { itemId: 'signal_booster', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 3 },
    ],
    craftingTime: 1200,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_cipher_notes',
    name: 'Шифровальный блокнот',
    description: 'Блокнот, исписанный шифрами и алгоритмами. +5 к coding при экипировке.',
    category: 'equipment',
    inputs: [
      { itemId: 'paper', quantity: 1 },
      { itemId: 'pen', quantity: 1 },
    ],
    output: { itemId: 'cipher_notes', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 2 },
      { skill: 'logic', level: 2 },
    ],
    craftingTime: 800,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_tech_amulet',
    name: 'Цифровой талисман',
    description: 'Слияние древнего амулета и микросхемы. +10 к intuition при экипировке.',
    category: 'equipment',
    inputs: [
      { itemId: 'circuit_board', quantity: 1 },
      { itemId: 'amulet', quantity: 1 },
    ],
    output: { itemId: 'tech_amulet', quantity: 1 },
    skillRequirements: [
      { skill: 'intuition', level: 4 },
      { skill: 'coding', level: 2 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_repair_kit',
    name: 'Ремонтный набор',
    description: 'Набор из обрезков металла и синей изоленты. Восстанавливает 15 HP в бою.',
    category: 'consumable',
    inputs: [
      { itemId: 'scraps', quantity: 5 },
      { itemId: 'tape', quantity: 1 },
    ],
    output: { itemId: 'repair_kit', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 2 },
    ],
    craftingTime: 1000,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_solnysh_record',
    name: 'Записи Солнышка',
    description: 'Расшифровка аудиокассеты с записями Солнышка. Тексты песен и загадочные координаты.',
    category: 'quest',
    inputs: [
      { itemId: 'cassette', quantity: 1 },
      { itemId: 'paper', quantity: 1 },
    ],
    output: { itemId: 'solnysh_record', quantity: 1 },
    skillRequirements: [
      { skill: 'intuition', level: 3 },
    ],
    craftingTime: 900,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_fake_id_chip',
    name: 'Псевдонимный чип',
    description: 'Поддельный идентификационный чип. Требуется для проникновения в закрытые зоны (акт 2+).',
    category: 'quest',
    inputs: [
      { itemId: 'usb_drive', quantity: 2 },
      { itemId: 'circuit_board', quantity: 1 },
    ],
    output: { itemId: 'fake_id_chip', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 6 },
      { skill: 'logic', level: 4 },
    ],
    craftingTime: 2000,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_poetry_collection',
    name: 'Поэтический сборник',
    description: 'Самодельный сборник стихов, аккуратно переписанных от руки. Содержит неизвестные произведения.',
    category: 'quest',
    inputs: [
      { itemId: 'paper', quantity: 3 },
      { itemId: 'pen', quantity: 1 },
    ],
    output: { itemId: 'poetry_collection', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 4 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },
];

/* ─── Lookup helpers ─── */

const RECIPE_MAP = new Map<string, CraftingRecipe>(CRAFTING_RECIPES.map((r) => [r.id, r]));

/** Get a recipe by its ID */
export function getRecipeById(recipeId: string): CraftingRecipe | undefined {
  return RECIPE_MAP.get(recipeId);
}
