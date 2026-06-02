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
];

/* ─── Lookup helpers ─── */

const RECIPE_MAP = new Map<string, CraftingRecipe>(CRAFTING_RECIPES.map((r) => [r.id, r]));

/** Get a recipe by its ID */
export function getRecipeById(recipeId: string): CraftingRecipe | undefined {
  return RECIPE_MAP.get(recipeId);
}

/** Get all recipes */
export function getAllRecipes(): CraftingRecipe[] {
  return [...CRAFTING_RECIPES];
}

/** Get recipes by category */
export function getRecipesByCategory(category: CraftingCategory): CraftingRecipe[] {
  return CRAFTING_RECIPES.filter((r) => r.category === category);
}
