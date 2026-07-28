/* ─── Expansion quest / exploration item stubs (QUEST_ITEM_DEFINITIONS) ─── */

import type { InventoryItem } from '@/shared/types/game';

type QuestItemDef = {
  id: string;
  name: string;
  description: string;
  category: InventoryItem['category'];
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
};

export const EXPANSION_ITEM_STUBS: Record<string, QuestItemDef> = {
  father_photo: {
    id: 'father_photo',
    name: 'Фотография отца',
    description: 'Пожелтевший снимок. На обороте — дата и адрес, которого больше нет на карте.',
    category: 'quest',
    rarity: 'rare',
  },
  soviet_poster: {
    id: 'soviet_poster',
    name: 'Советский плакат',
    description: 'Под плакатом — слой старой краски и чужой почерк.',
    category: 'quest',
    rarity: 'uncommon',
  },
  mystery_flash_drive: {
    id: 'mystery_flash_drive',
    name: 'Загадочная флешка',
    description: 'Без маркировки. Внутри — один зашифрованный файл.',
    category: 'quest',
    rarity: 'uncommon',
  },
  banned_corrected_book: {
    id: 'banned_corrected_book',
    name: 'Исправленная книга',
    description: 'Текст перечёркнут гильдейской правкой; между строк — оригинал.',
    category: 'quest',
    rarity: 'rare',
  },
  encrypted_zarema_archive: {
    id: 'encrypted_zarema_archive',
    name: 'Архив Заремы',
    description: 'Зашифрованный пакет свидетельств. Ключ — в доверии.',
    category: 'quest',
    rarity: 'rare',
  },
  vault_keycard_poetic: {
    id: 'vault_keycard_poetic',
    name: 'Поэтический ключ-карта',
    description: 'Пропуск в хранилище. Строка на магнитной полосе читается как рифма.',
    category: 'quest',
    rarity: 'rare',
  },
  manifest_draft_copy: {
    id: 'manifest_draft_copy',
    name: 'Черновик манифеста',
    description: 'Набросок Альберта. Каждая правка — спор с системой.',
    category: 'quest',
    rarity: 'uncommon',
  },
  node_coords_paper: {
    id: 'node_coords_paper',
    name: 'Координаты узла',
    description: 'Записка с координатами скрытого серверного узла.',
    category: 'quest',
    rarity: 'uncommon',
  },
  monument_names_list: {
    id: 'monument_names_list',
    name: 'Список имён',
    description: 'Имена тех, кого стёрли из реестра, но не из памяти.',
    category: 'quest',
    rarity: 'rare',
  },
  guild_infiltration_journal: {
    id: 'guild_infiltration_journal',
    name: 'Журнал проникновения',
    description: 'Записи о маршрутах внутри гильдии. Почерк дрожит.',
    category: 'quest',
    rarity: 'rare',
  },
  archive7_chip: {
    id: 'archive7_chip',
    name: 'Чип Архива-7',
    description: 'Микросхема с фрагментом запретного архива.',
    category: 'quest',
    rarity: 'legendary',
  },
};
