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
  {
    id: 'recipe_anesthetic',
    name: 'Анестетик',
    description: 'Мощное обезболивающее из антисептика и нитей. Восстанавливает 30 единиц энергии.',
    category: 'consumable',
    inputs: [
      { itemId: 'tape', quantity: 1 },
      { itemId: 'herbal_tea', quantity: 1 },
    ],
    output: { itemId: 'anesthetic', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 2 },
    ],
    craftingTime: 600,
    outputRarity: 'common',
  },
  {
    id: 'recipe_stimulant',
    name: 'Стимулятор',
    description: 'Кофейный экстракт, усиленный энергетической ячейкой. Временный прилив сил.',
    category: 'consumable',
    inputs: [
      { itemId: 'coffee_extract', quantity: 1 },
      { itemId: 'energy_drink', quantity: 1 },
    ],
    output: { itemId: 'stimulant', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 3 },
    ],
    craftingTime: 800,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_herbal_bandages',
    name: 'Бинты с травами',
    description: 'Нано-пластырь, пропитанный травяным отваром. Восстанавливает 20 единиц энергии.',
    category: 'consumable',
    inputs: [
      { itemId: 'nano_patch', quantity: 1 },
      { itemId: 'herbal_tea', quantity: 1 },
    ],
    output: { itemId: 'herbal_bandages', quantity: 2 },
    skillRequirements: [],
    craftingTime: 500,
    outputRarity: 'common',
  },
  {
    id: 'recipe_antidote',
    name: 'Противоядие',
    description: 'Химический раствор, нейтрализующий токсины. Снимает отравление.',
    category: 'consumable',
    inputs: [
      { itemId: 'coffee_extract', quantity: 1 },
      { itemId: 'tea', quantity: 1 },
    ],
    output: { itemId: 'antidote', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 3 },
    ],
    craftingTime: 700,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_regen_cocktail',
    name: 'Регенерационный коктейль',
    description: 'Мощная смесь из редких компонентов. Восстанавливает 50 единиц энергии.',
    category: 'consumable',
    inputs: [
      { itemId: 'nano_patch', quantity: 2 },
      { itemId: 'cyber_balm', quantity: 1 },
      { itemId: 'herbal_tea', quantity: 1 },
    ],
    output: { itemId: 'regen_cocktail', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 5 },
      { skill: 'empathy', level: 3 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },

  /* ════════════ TECH / HACKING ════════════ */
  {
    id: 'recipe_enhanced_cable',
    name: 'Улучшенный кабель',
    description: 'Уплотнённый медный кабель с микросхемной обмоткой. Открывает запертые двери.',
    category: 'equipment',
    inputs: [
      { itemId: 'copper_wire', quantity: 2 },
      { itemId: 'circuit_board', quantity: 1 },
    ],
    output: { itemId: 'enhanced_cable', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 3 },
    ],
    craftingTime: 1000,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_chip_lockpick',
    name: 'Микрочип-отмычка',
    description: 'Микросхема, перепрограммированная для взлома замков. Тихий инструмент хакера.',
    category: 'equipment',
    inputs: [
      { itemId: 'circuit_board', quantity: 1 },
      { itemId: 'copper_wire', quantity: 1 },
    ],
    output: { itemId: 'chip_lockpick', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 4 },
      { skill: 'intuition', level: 2 },
    ],
    craftingTime: 1200,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_signal_generator',
    name: 'Сигнальный генератор',
    description: 'Устройство, создающее ложный сигнал. Отвлекает врагов на расстоянии.',
    category: 'equipment',
    inputs: [
      { itemId: 'circuit_board', quantity: 1 },
      { itemId: 'signal_booster', quantity: 1 },
    ],
    output: { itemId: 'signal_generator', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 5 },
      { skill: 'logic', level: 3 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_portable_scanner',
    name: 'Портативный сканер',
    description: 'Компактное сканирующее устройство. Раскрывает скрытые предметы и секреты.',
    category: 'equipment',
    inputs: [
      { itemId: 'neural_visor', quantity: 1 },
      { itemId: 'circuit_board', quantity: 1 },
    ],
    output: { itemId: 'portable_scanner', quantity: 1 },
    skillRequirements: [
      { skill: 'intuition', level: 4 },
      { skill: 'coding', level: 3 },
    ],
    craftingTime: 1800,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_emp_device',
    name: 'Электромагнитный импульс',
    description: 'Мощный ЭМИ-генератор. Оглушает роботов и отключает электронику.',
    category: 'equipment',
    inputs: [
      { itemId: 'circuit_board', quantity: 3 },
      { itemId: 'energy_drink', quantity: 1 },
    ],
    output: { itemId: 'emp_device', quantity: 1 },
    skillRequirements: [
      { skill: 'coding', level: 7 },
      { skill: 'logic', level: 6 },
    ],
    craftingTime: 3000,
    outputRarity: 'legendary',
  },

  /* ════════════ POETRY / WRITING ════════════ */
  {
    id: 'recipe_ink_tablet',
    name: 'Чернильная таблетка',
    description: 'Химическая таблетка, растворяющаяся в воде и превращающаяся в чёрные чернила.',
    category: 'consumable',
    inputs: [
      { itemId: 'coffee_extract', quantity: 1 },
      { itemId: 'tea', quantity: 1 },
    ],
    output: { itemId: 'ink_tablet', quantity: 2 },
    skillRequirements: [],
    craftingTime: 400,
    outputRarity: 'common',
  },
  {
    id: 'recipe_diy_notebook',
    name: 'Самодельный блокнот',
    description: 'Блокнот из подручных материалов. Идеален для записи стихов и заметок.',
    category: 'quest',
    inputs: [
      { itemId: 'paper', quantity: 2 },
      { itemId: 'tape', quantity: 1 },
    ],
    output: { itemId: 'diy_notebook', quantity: 1 },
    skillRequirements: [],
    craftingTime: 500,
    outputRarity: 'common',
  },
  {
    id: 'recipe_sealed_envelope',
    name: 'Запечатанный конверт',
    description: 'Конверт, запечатанный сургучом. Подходящий для тайных посланий.',
    category: 'quest',
    inputs: [
      { itemId: 'paper', quantity: 1 },
      { itemId: 'scraps', quantity: 1 },
    ],
    output: { itemId: 'sealed_envelope', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 1 },
    ],
    craftingTime: 300,
    outputRarity: 'common',
  },
  {
    id: 'recipe_spell_scroll',
    name: 'Свиток с заклинанием',
    description: 'Бумага, пропитанная кристаллической энергией. Дает бонус в бою.',
    category: 'equipment',
    inputs: [
      { itemId: 'paper', quantity: 1 },
      { itemId: 'crystal_shard', quantity: 1 },
    ],
    output: { itemId: 'spell_scroll', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 5 },
      { skill: 'intuition', level: 3 },
    ],
    craftingTime: 2000,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_shadow_book',
    name: 'Книга теней',
    description: 'Том, собранный из листов бумаги и тёмного плаща. Хранит забытые знания.',
    category: 'quest',
    inputs: [
      { itemId: 'paper', quantity: 3 },
      { itemId: 'shadow_cloak', quantity: 1 },
    ],
    output: { itemId: 'shadow_book', quantity: 1 },
    skillRequirements: [
      { skill: 'writing', level: 7 },
      { skill: 'intuition', level: 6 },
    ],
    craftingTime: 3500,
    outputRarity: 'legendary',
  },

  /* ════════════ SURVIVAL ════════════ */
  {
    id: 'recipe_torch',
    name: 'Факел',
    description: 'Импровизированный факел из обломков и горючих материалов. Освещает путь во тьме.',
    category: 'equipment',
    inputs: [
      { itemId: 'scraps', quantity: 2 },
      { itemId: 'lighter', quantity: 1 },
    ],
    output: { itemId: 'torch', quantity: 1 },
    skillRequirements: [],
    craftingTime: 300,
    outputRarity: 'common',
  },
  {
    id: 'recipe_upgraded_armor',
    name: 'Улучшенная броня',
    description: 'Каска сопротивления, усиленная редким сплавом. Значительно повышает защиту.',
    category: 'equipment',
    inputs: [
      { itemId: 'resistance_helmet', quantity: 1 },
      { itemId: 'rare_alloy', quantity: 2 },
    ],
    output: { itemId: 'upgraded_armor', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 5 },
    ],
    craftingTime: 2500,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_sharp_blade',
    name: 'Острый клинок',
    description: 'Кристаллический клинок, заточенный ремонтным набором. Смертельное оружие.',
    category: 'equipment',
    inputs: [
      { itemId: 'crystal_blade', quantity: 1 },
      { itemId: 'repair_kit', quantity: 1 },
    ],
    output: { itemId: 'sharp_blade', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 4 },
      { skill: 'intuition', level: 2 },
    ],
    craftingTime: 2000,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_compass',
    name: 'Компас',
    description: 'Самодельный компас из технических компонентов и металла. Помогает ориентироваться.',
    category: 'equipment',
    inputs: [
      { itemId: 'tech_component', quantity: 1 },
      { itemId: 'rare_alloy', quantity: 1 },
    ],
    output: { itemId: 'compass', quantity: 1 },
    skillRequirements: [
      { skill: 'intuition', level: 3 },
    ],
    craftingTime: 1000,
    outputRarity: 'uncommon',
  },
  {
    id: 'recipe_gas_mask',
    name: 'Противогаз',
    description: 'Защитная маска из нано-пластиря и технических деталей. Даёт иммунитет к ядам.',
    category: 'equipment',
    inputs: [
      { itemId: 'nano_patch', quantity: 2 },
      { itemId: 'tech_component', quantity: 1 },
    ],
    output: { itemId: 'gas_mask', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 4 },
      { skill: 'coding', level: 2 },
    ],
    craftingTime: 1500,
    outputRarity: 'rare',
  },
  {
    id: 'recipe_spare_filter',
    name: 'Запасной фильтр',
    description: 'Заменяемый фильтр для противогаза. Продлевает защиту в токсичных зонах.',
    category: 'consumable',
    inputs: [
      { itemId: 'scraps', quantity: 2 },
      { itemId: 'coffee_extract', quantity: 1 },
    ],
    output: { itemId: 'spare_filter', quantity: 1 },
    skillRequirements: [
      { skill: 'logic', level: 2 },
    ],
    craftingTime: 600,
    outputRarity: 'common',
  },
];

/* ─── Lookup helpers ─── */

const RECIPE_MAP = new Map<string, CraftingRecipe>(CRAFTING_RECIPES.map((r) => [r.id, r]));

/** Get a recipe by its ID */
export function getRecipeById(recipeId: string): CraftingRecipe | undefined {
  return RECIPE_MAP.get(recipeId);
}
