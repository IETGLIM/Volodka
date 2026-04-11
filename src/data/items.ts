import type { Item, ItemRarity, ItemType, PlayerSkills } from './types';

// ============================================
// ПРЕДМЕТЫ ИГРЫ
// ============================================

export const items: Record<string, Item> = {
  // ========== РАСХОДИМЫЕ ==========
  
  coffee: {
    id: 'coffee',
    name: 'Кофе',
    description: 'Горячий напиток для бодрости. Восстанавливает энергию.',
    type: 'consumable',
    rarity: 'common',
    icon: '☕',
    useEffect: {
      energy: 2,
      mood: 1,
    },
    droppable: true,
    stackable: true,
    maxStack: 10,
    value: 3,
  },
  
  energy_drink: {
    id: 'energy_drink',
    name: 'Энергетик',
    description: 'Синтетический прилив сил. Больше энергии, но снижает стабильность.',
    type: 'consumable',
    rarity: 'common',
    icon: '🥤',
    useEffect: {
      energy: 4,
      stability: -3,
    },
    droppable: true,
    stackable: true,
    maxStack: 5,
    value: 5,
  },
  
  tea: {
    id: 'tea',
    name: 'Травяной чай',
    description: 'Успокаивающий напиток. Улучшает стабильность.',
    type: 'consumable',
    rarity: 'common',
    icon: '🍵',
    useEffect: {
      stability: 3,
      mood: 2,
    },
    droppable: true,
    stackable: true,
    maxStack: 10,
    value: 4,
  },
  
  notebook: {
    id: 'notebook',
    name: 'Записная книжка',
    description: 'Место для мыслей и стихов.',
    type: 'consumable',
    rarity: 'common',
    icon: '📓',
    useEffect: {
      creativity: 2,
    },
    droppable: true,
    stackable: false,
    maxStack: 1,
    value: 10,
    lore: 'Твоя верная спутница в ночных размышлениях.',
  },
  
  pen: {
    id: 'pen',
    name: 'Ручка',
    description: 'Инструмент для записи мыслей.',
    type: 'consumable',
    rarity: 'common',
    icon: '🖊️',
    useEffect: {
      creativity: 1,
    },
    droppable: true,
    stackable: true,
    maxStack: 3,
    value: 2,
  },
  
  chocolate: {
    id: 'chocolate',
    name: 'Шоколад',
    description: 'Сладкое утешение. Поднимает настроение.',
    type: 'consumable',
    rarity: 'common',
    icon: '🍫',
    useEffect: {
      mood: 3,
      energy: 1,
    },
    droppable: true,
    stackable: true,
    maxStack: 5,
    value: 3,
  },
  
  wine: {
    id: 'wine',
    name: 'Бокал вина',
    description: 'Расслабление для вечера. Поднимает настроение, снижает стабильность.',
    type: 'consumable',
    rarity: 'uncommon',
    icon: '🍷',
    useEffect: {
      mood: 5,
      stability: -2,
      creativity: 2,
    },
    droppable: true,
    stackable: false,
    maxStack: 1,
    value: 15,
  },
  
  // ========== КЛЮЧЕВЫЕ ПРЕДМЕТЫ ==========
  
  old_photograph: {
    id: 'old_photograph',
    name: 'Старая фотография',
    description: 'Фотография из прошлого. Кого-то, кто был важен.',
    type: 'key',
    rarity: 'rare',
    icon: '🖼️',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Лица на фотографии почти стёрлись временем. Но одно ты помнишь ясно — улыбку.',
  },
  
  cafe_invite: {
    id: 'cafe_invite',
    name: 'Приглашение в "Синий кот"',
    description: 'Афиша литературного вечера.',
    type: 'key',
    rarity: 'common',
    icon: '📜',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Литературный вечер каждую пятницу. Новые голоса, новые истории.',
  },
  
  maria_poem: {
    id: 'maria_poem',
    name: 'Стихотворение Марии',
    description: 'Распечатанное стихотворение, которое Мария подарила тебе.',
    type: 'key',
    rarity: 'rare',
    icon: '📝',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: '"Те, кто ищут — найдут. Те, кто стучат — откроют. Но иногда нужно просто прислушаться."',
  },
  
  contest_letter: {
    id: 'contest_letter',
    name: 'Письмо от жюри конкурса',
    description: 'Официальное письмо с результатами литературного конкурса.',
    type: 'key',
    rarity: 'uncommon',
    icon: '✉️',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Третье место. Не победа, но признание.',
  },
  
  // ========== АРТЕФАКТЫ ==========
  
  muse_feather: {
    id: 'muse_feather',
    name: 'Перо музы',
    description: 'Сказывают, что это перо из крыла музы. Увеличивает вдохновение.',
    type: 'artifact',
    rarity: 'legendary',
    icon: '🪶',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Когда держишь его в руках, слова приходят легче. Или это просто самовнушение?',
    useEffect: {
      creativity: 10,
    },
  },
  
  midnight_ink: {
    id: 'midnight_ink',
    name: 'Полуночные чернила',
    description: 'Особые чернила для особых мыслей.',
    type: 'artifact',
    rarity: 'epic',
    icon: '🖋️',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Говорят, что написанное этими чернилами становится частью тебя навсегда.',
  },
  
  dream_catcher: {
    id: 'dream_catcher',
    name: 'Ловец снов',
    description: 'Помогает запоминать и понимать сны.',
    type: 'artifact',
    rarity: 'rare',
    icon: '🕸️',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Сны — это письма от подсознания. Ловец снов помогает их читать.',
  },
  
  // ========== ВОСПОМИНАНИЯ ==========
  
  memory_first_night: {
    id: 'memory_first_night',
    name: 'Воспоминание: Первая ночь',
    description: 'Та ночь, когда ты впервые за долгое время взял ручку.',
    type: 'memory',
    rarity: 'uncommon',
    icon: '💭',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Бессонница подарила тебе подарок — возвращение к письму.',
  },
  
  memory_first_reading: {
    id: 'memory_first_reading',
    name: 'Воспоминание: Первое чтение',
    description: 'Твой голос дрожал, но слова звучали чисто.',
    type: 'memory',
    rarity: 'rare',
    icon: '🎤',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Микрофон, свет софитов, аплодисменты. Ты сделал это.',
  },
  
  memory_maria_smile: {
    id: 'memory_maria_smile',
    name: 'Воспоминание: Улыбка Марии',
    description: 'Момент, когда Мария впервые по-настоящему улыбнулась тебе.',
    type: 'memory',
    rarity: 'rare',
    icon: '😊',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'В её улыбке — понимание. И что-то ещё, что ты не можешь назвать.',
  },
  
  memory_night_walk: {
    id: 'memory_night_walk',
    name: 'Воспоминание: Ночная прогулка',
    description: 'Город ночью — декорации к твоей пьесе.',
    type: 'memory',
    rarity: 'common',
    icon: '🌃',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Огни города и тишина — идеальное сочетание для размышлений.',
  },
  
  // ========== ДОКУМЕНТЫ ==========
  
  published_poem: {
    id: 'published_poem',
    name: 'Опубликованное стихотворение',
    description: 'Распечатка журнала с твоим стихотворением.',
    type: 'document',
    rarity: 'epic',
    icon: '📰',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Твои слова — теперь часть мира. Кто-то читает их прямо сейчас.',
  },
  
  rejection_letter: {
    id: 'rejection_letter',
    name: 'Письмо с отказом',
    description: 'Не все двери открываются с первого раза.',
    type: 'document',
    rarity: 'common',
    icon: '📄',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Отказ — не конец. Это часть пути. Так говорили все великие.',
  },
  
  therapist_note: {
    id: 'therapist_note',
    name: 'Записка психолога',
    description: 'Контакт и пара слов ободрения.',
    type: 'document',
    rarity: 'uncommon',
    icon: '📋',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: '"Писать о боли — это тоже способ её исцелить."',
  },
  
  // ========== ПОДАРКИ ==========
  
  gift_book: {
    id: 'gift_book',
    name: 'Книга в подарок',
    description: 'Антология современной поэзии от Дениса.',
    type: 'gift',
    rarity: 'uncommon',
    icon: '📕',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: '"Думал, тебе понравится. Там есть авторы, похожие на тебя по духу."',
  },
  
  gift_pen: {
    id: 'gift_pen',
    name: 'Ручка в подарок',
    description: 'Качественная ручка от Марии.',
    type: 'gift',
    rarity: 'rare',
    icon: '🖊️',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: '"У каждого писателя должна быть хорошая ручка. Для особых слов."',
    useEffect: {
      creativity: 3,
    },
  },
  
  gift_flower: {
    id: 'gift_flower',
    name: 'Цветок',
    description: 'Засушенный цветок из букета Веры.',
    type: 'gift',
    rarity: 'common',
    icon: '🌸',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Напоминание о том, что красота существует даже в простых вещах.',
  },
  
  // ========== ПРЕДМЕТЫ ИЗ ЭПИЗОДА "ВРЕМЯ В ПАРКЕ" ==========
  
  theater_ticket: {
    id: 'theater_ticket',
    name: 'Старый билет в театр',
    description: 'Билет в театр драмы. "Ожидание". 1974.',
    type: 'document',
    rarity: 'uncommon',
    icon: '🎫',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Пьеса об ожидании. О том, что приходит — и не приходит. О том, что мы ждём всю жизнь.',
  },
  
  old_pen: {
    id: 'old_pen',
    name: 'Старая ручка философа',
    description: 'Тяжёлая ручка с гравировкой "Escreve o que sentes".',
    type: 'artifact',
    rarity: 'epic',
    icon: '🖊️',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: '"Пиши то, что чувствуешь." Простой совет, но сколько людей следуют ему?',
    useEffect: {
      creativity: 3,
    },
  },
  
  lucky_coin: {
    id: 'lucky_coin',
    name: 'Счастливая монета',
    description: 'Старая, стёртая монета от философа.',
    type: 'artifact',
    rarity: 'rare',
    icon: '🪙',
    droppable: false,
    stackable: false,
    maxStack: 1,
    lore: 'Не все монеты приносят удачу. Но эта — напоминание о том, что надежда важнее результата.',
    useEffect: {
      karma: 5,
    },
  },
  
  old_key: {
    id: 'old_key',
    name: 'Старый ключ',
    description: 'Ржавый ключ от чего-то забытого.',
    type: 'key',
    rarity: 'uncommon',
    icon: '🔑',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Каждый ключ открывает что-то. Вопрос в том, что именно — и хочешь ли ты это найти.',
  },
  
  // ========== ПРЕДМЕТЫ В МИРЕ (из triggerZones.ts) ==========
  
  note_draft: {
    id: 'note_draft',
    name: 'Черновик заметки',
    description: 'Листок с неровным почерком. Кто-то торопился записать мысль.',
    type: 'document',
    rarity: 'common',
    icon: '📝',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: '"Найти себя — не значит найти ответы. Это значит научиться любить вопросы."',
  },
  
  poem_fragment_1: {
    id: 'poem_fragment_1',
    name: 'Фрагмент стихотворения',
    description: 'Обрывок бумаги со стихами. Чьи-то слова, забытые на столике.',
    type: 'document',
    rarity: 'uncommon',
    icon: '📜',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: '"...и в тишине между словами / живёт то, что нельзя сказать..."',
  },
  
  old_letter: {
    id: 'old_letter',
    name: 'Старое письмо',
    description: 'Конверт с выцветшими чернилами. Пролежал здесь долго.',
    type: 'document',
    rarity: 'rare',
    icon: '✉️',
    droppable: true,
    stackable: false,
    maxStack: 1,
    lore: 'Письмо от кого-то, кто ждал ответа, который так и не пришёл.',
  },
};

// ============================================
// КОНСТАНТЫ ПРЕДМЕТОВ
// ============================================

export const itemCategories: Record<ItemType, string> = {
  consumable: 'Расходники',
  key: 'Ключевые',
  artifact: 'Артефакты',
  memory: 'Воспоминания',
  document: 'Документы',
  gift: 'Подарки',
};

export const itemCategoryIcons: Record<ItemType, string> = {
  consumable: '🧪',
  key: '🔑',
  artifact: '✨',
  memory: '💭',
  document: '📄',
  gift: '🎁',
};

export const rarityColors: Record<ItemRarity, string> = {
  common: '#9CA3AF',      // серый
  uncommon: '#10B981',    // зелёный
  rare: '#3B82F6',        // синий
  epic: '#A855F7',        // фиолетовый
  legendary: '#F59E0B',   // золотой
};

export const rarityNames: Record<ItemRarity, string> = {
  common: 'Обычный',
  uncommon: 'Необычный',
  rare: 'Редкий',
  epic: 'Эпический',
  legendary: 'Легендарный',
};

export const rarityGlow: Record<ItemRarity, string> = {
  common: 'none',
  uncommon: '0 0 10px rgba(16, 185, 129, 0.5)',
  rare: '0 0 15px rgba(59, 130, 246, 0.5)',
  epic: '0 0 20px rgba(168, 85, 247, 0.6)',
  legendary: '0 0 25px rgba(245, 158, 11, 0.7)',
};

// ============================================
// ФУНКЦИИ РАБОТЫ С ПРЕДМЕТАМИ
// ============================================

export function getItemById(id: string): Item | undefined {
  return items[id];
}

export function getItemsByType(type: ItemType): Item[] {
  return Object.values(items).filter(item => item.type === type);
}

export function getItemsByRarity(rarity: ItemRarity): Item[] {
  return Object.values(items).filter(item => item.rarity === rarity);
}

export function getItemsWithValue(minValue: number): Item[] {
  return Object.values(items).filter(item => (item.value ?? 0) >= minValue);
}

export function getUsableItems(): Item[] {
  return Object.values(items).filter(item => item.useEffect !== undefined);
}

export function getDroppableItems(): Item[] {
  return Object.values(items).filter(item => item.droppable);
}

export function getItemsWithLore(): Item[] {
  return Object.values(items).filter(item => item.lore !== undefined);
}

// ============================================
// ФУНКЦИИ ПРОВЕРКИ И ИСПОЛЬЗОВАНИЯ
// ============================================

export function canUseItem(item: Item): boolean {
  return item.type === 'consumable' && item.useEffect !== undefined;
}

export function useItem(item: Item): Item['useEffect'] {
  if (!canUseItem(item)) {
    return undefined;
  }
  return item.useEffect;
}

export function canStackItems(item: Item): boolean {
  return item.stackable && item.maxStack > 1;
}

export function canDropItem(item: Item): boolean {
  return item.droppable;
}

// ============================================
// ФУНКЦИИ ИНВЕНТАРЯ
// ============================================

export interface InventorySlot {
  itemId: string;
  quantity: number;
  obtainedAt: number;
  source?: string;
}

export function createInventorySlot(itemId: string, quantity: number = 1, source?: string): InventorySlot | null {
  const item = items[itemId];
  if (!item) return null;
  
  const actualQuantity = item.stackable ? Math.min(quantity, item.maxStack) : 1;
  
  return {
    itemId,
    quantity: actualQuantity,
    obtainedAt: Date.now(),
    source,
  };
}

export function addToInventory(
  inventory: InventorySlot[],
  itemId: string,
  quantity: number = 1,
  source?: string
): InventorySlot[] {
  const item = items[itemId];
  if (!item) return inventory;
  
  const existingIndex = inventory.findIndex(slot => slot.itemId === itemId);
  
  if (existingIndex >= 0 && item.stackable) {
    const existingSlot = inventory[existingIndex];
    const newQuantity = Math.min(existingSlot.quantity + quantity, item.maxStack);
    
    const newInventory = [...inventory];
    newInventory[existingIndex] = {
      ...existingSlot,
      quantity: newQuantity,
    };
    
    return newInventory;
  }
  
  // Новый слот
  const newSlot = createInventorySlot(itemId, quantity, source);
  if (!newSlot) return inventory;
  
  return [...inventory, newSlot];
}

export function removeFromInventory(
  inventory: InventorySlot[],
  itemId: string,
  quantity: number = 1
): InventorySlot[] {
  const existingIndex = inventory.findIndex(slot => slot.itemId === itemId);
  if (existingIndex < 0) return inventory;
  
  const existingSlot = inventory[existingIndex];
  const newQuantity = existingSlot.quantity - quantity;
  
  if (newQuantity <= 0) {
    return inventory.filter((_, index) => index !== existingIndex);
  }
  
  const newInventory = [...inventory];
  newInventory[existingIndex] = {
    ...existingSlot,
    quantity: newQuantity,
  };
  
  return newInventory;
}

export function hasItem(inventory: InventorySlot[], itemId: string): boolean {
  return inventory.some(slot => slot.itemId === itemId);
}

export function getItemCount(inventory: InventorySlot[], itemId: string): number {
  const slot = inventory.find(s => s.itemId === itemId);
  return slot?.quantity ?? 0;
}

export function getInventoryValue(inventory: InventorySlot[]): number {
  return inventory.reduce((total, slot) => {
    const item = items[slot.itemId];
    return total + ((item?.value ?? 0) * slot.quantity);
  }, 0);
}

// ============================================
// ФУНКЦИИ ФИЛЬТРАЦИИ И СОРТИРОВКИ
// ============================================

export function sortInventoryByRarity(inventory: InventorySlot[]): InventorySlot[] {
  const rarityOrder: ItemRarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
  
  return [...inventory].sort((a, b) => {
    const itemA = items[a.itemId];
    const itemB = items[b.itemId];
    if (!itemA || !itemB) return 0;
    
    const rarityDiff = rarityOrder.indexOf(itemA.rarity) - rarityOrder.indexOf(itemB.rarity);
    if (rarityDiff !== 0) return rarityDiff;
    
    return itemA.name.localeCompare(itemB.name);
  });
}

export function sortInventoryByType(inventory: InventorySlot[]): InventorySlot[] {
  const typeOrder: ItemType[] = ['key', 'artifact', 'memory', 'document', 'gift', 'consumable'];
  
  return [...inventory].sort((a, b) => {
    const itemA = items[a.itemId];
    const itemB = items[b.itemId];
    if (!itemA || !itemB) return 0;
    
    const typeDiff = typeOrder.indexOf(itemA.type) - typeOrder.indexOf(itemB.type);
    if (typeDiff !== 0) return typeDiff;
    
    return itemA.name.localeCompare(itemB.name);
  });
}

export function filterInventoryByType(inventory: InventorySlot[], type: ItemType): InventorySlot[] {
  return inventory.filter(slot => {
    const item = items[slot.itemId];
    return item?.type === type;
  });
}

// ============================================
// ФУНКЦИИ ЭФФЕКТОВ
// ============================================

export function getTotalPassiveEffect(inventory: InventorySlot[]): Partial<Record<keyof PlayerSkills, number>> {
  const effects: Partial<Record<keyof PlayerSkills, number>> = {};
  
  inventory.forEach(slot => {
    const item = items[slot.itemId];
    if (item?.useEffect) {
      const effect = item.useEffect;
      
      // Суммируем эффекты навыков
      if (effect.skillGains) {
        Object.entries(effect.skillGains).forEach(([skill, value]) => {
          if (value !== undefined) {
            effects[skill as keyof PlayerSkills] = (effects[skill as keyof PlayerSkills] ?? 0) + value;
          }
        });
      }
      
      // Прямые эффекты навыков
      const skillKeys: (keyof PlayerSkills)[] = [
        'writing', 'perception', 'empathy', 'imagination',
        'logic', 'coding', 'persuasion', 'intuition',
        'resilience', 'introspection'
      ];
      
      skillKeys.forEach(key => {
        if (effect[key] !== undefined) {
          effects[key] = (effects[key] ?? 0) + (effect[key] ?? 0);
        }
      });
    }
  });
  
  return effects;
}

// ============================================
// УТИЛИТЫ
// ============================================

export function getItemDisplayName(itemId: string): string {
  return items[itemId]?.name ?? 'Неизвестный предмет';
}

export function getItemDescription(itemId: string): string {
  return items[itemId]?.description ?? '';
}

export function getItemIcon(itemId: string): string {
  return items[itemId]?.icon ?? '❓';
}

export function formatItemRarity(rarity: ItemRarity): string {
  return rarityNames[rarity];
}

export function formatItemType(type: ItemType): string {
  return itemCategories[type];
}

export function getItemRarityColor(itemId: string): string {
  const item = items[itemId];
  return item ? rarityColors[item.rarity] : rarityColors.common;
}

export function getAllItems(): Item[] {
  return Object.values(items);
}

export function getItemCount(): number {
  return Object.keys(items).length;
}
