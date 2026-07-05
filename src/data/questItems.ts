/* ─── Volodka RPG – Quest Items Data ───
 * Items that are automatically added to inventory when accepting
 * certain quests and are consumed/required when completing them.
 */

import type { InventoryItem } from '@/shared/types/game'

/* ─── Start Items ───
 * Items given to the player when they accept a quest.
 * These use a simplified format: just id and quantity.
 * The actual InventoryItem is created via createInventoryItem() from items.ts.
 */

interface QuestItemRef {
  id: string
  quantity: number
}

export const QUEST_START_ITEMS: Record<string, QuestItemRef[]> = {
  'incident_scroll_4729': [{ id: 'guild_access_badge', quantity: 1 }],
  'vault_backup_trial': [{ id: 'vault_key_fragment', quantity: 1 }],
  'network_initiation': [{ id: 'network_comm_key', quantity: 1 }],
  'poetry_smuggling': [{ id: 'encrypted_scroll', quantity: 1 }],
  'guild_infiltration': [{ id: 'shadow_cloak', quantity: 1 }],
}

/* ─── Required Items ───
 * Item IDs that must be present in the player's inventory
 * to complete a quest. Checked when completing quest objectives.
 */

export const QUEST_REQUIRED_ITEMS: Record<string, string[]> = {
  'incident_scroll_4729': ['guild_access_badge'],
  'vault_backup_trial': ['vault_key_fragment'],
  'poetry_smuggling': ['encrypted_scroll'],
  'guild_infiltration': ['shadow_cloak'],
}

/* ─── Completion Items ───
 * Items that are consumed (removed from inventory) when the quest
 * is completed. Typically quest-specific items that have served
 * their narrative purpose.
 */

export const QUEST_COMPLETION_CONSUME_ITEMS: Record<string, string[]> = {
  'incident_scroll_4729': ['guild_access_badge'],
  'vault_backup_trial': ['vault_key_fragment'],
  'poetry_smuggling': ['encrypted_scroll'],
  'network_initiation': ['network_comm_key'],
}

/* ─── Quest Item Definitions ───
 * Additional quest-specific items that may not exist in the main
 * items.ts catalog. These are used as fallback definitions.
 */

export const QUEST_ITEM_DEFINITIONS: Record<string, {
  id: string
  name: string
  description: string
  category: InventoryItem['category']
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}> = {
  guild_access_badge: {
    id: 'guild_access_badge',
    name: 'Пропуск гильдии',
    description: 'Удостоверение старшего члена IT-гильдии. Открывает доступ к закрытым зонам.',
    category: 'quest',
    rarity: 'rare',
  },
  vault_key_fragment: {
    id: 'vault_key_fragment',
    name: 'Фрагмент ключа Хранилища',
    description: 'Часть цифрового ключа, открывающего Хранилище стёртых архивов.',
    category: 'quest',
    rarity: 'rare',
  },
  network_comm_key: {
    id: 'network_comm_key',
    name: 'Ключ Сети',
    description: 'Зашифрованный канал связи Сопротивления. Активируется стихотворением-паролем.',
    category: 'quest',
    rarity: 'rare',
  },
  encrypted_scroll: {
    id: 'encrypted_scroll',
    name: 'Зашифрованный свиток',
    description: 'Свиток кода, содержащий скрытые стихи. Требует расшифровки.',
    category: 'quest',
    rarity: 'uncommon',
  },
  shadow_cloak: {
    id: 'shadow_cloak',
    name: 'Теневой Плащ',
    description: 'Лёгкий плащ из умной ткани. Маскирует от камер и датчиков.',
    category: 'equipment',
    rarity: 'rare',
  },
}

/* ─── Helpers ─── */

/** Check if a quest has start items that should be given */
export function questHasStartItems(questId: string): boolean {
  return questId in QUEST_START_ITEMS && QUEST_START_ITEMS[questId].length > 0
}

/** Check if a quest requires specific items to complete */
export function questHasRequiredItems(questId: string): boolean {
  return questId in QUEST_REQUIRED_ITEMS && QUEST_REQUIRED_ITEMS[questId].length > 0
}

/** Check if the player has all required items for a quest */
export function playerHasRequiredItems(questId: string, inventory: InventoryItem[]): boolean {
  const required = QUEST_REQUIRED_ITEMS[questId]
  if (!required || required.length === 0) return true

  return required.every((itemId) => {
    const invItem = inventory.find((i) => i.id === itemId)
    return invItem && invItem.quantity > 0
  })
}

/** Get items that should be consumed when a quest is completed */
export function getQuestCompletionConsumeItems(questId: string): string[] {
  return QUEST_COMPLETION_CONSUME_ITEMS[questId] ?? []
}
