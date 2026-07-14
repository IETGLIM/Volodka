import { getItemDefinition, type ItemDefinition, type ItemRarity } from '@/data/items';
import type { InventoryItem } from '@/shared/types/game';
import {
  INVENTORY_CATEGORY_ICONS,
  INVENTORY_RARITY_WEIGHT,
  type InventorySortOption,
} from '@/components/game/inventory/inventoryConstants';

export type InventoryFilterCategory =
  | 'all'
  | 'equipment'
  | 'consumable'
  | 'misc'
  | 'book'
  | 'key'
  | 'quest';

export type InventoryItemView = {
  item: InventoryItem;
  def: ItemDefinition | null;
  isUnknown: boolean;
  rarity: ItemRarity;
  filterCategory: Exclude<InventoryFilterCategory, 'all'>;
  displayName: string;
  displayDescription: string;
  categoryIcon: string;
};

const UNKNOWN_ITEM_LABEL = 'Неизвестный предмет';

export function mapDefinitionToFilterCategory(
  def: ItemDefinition | undefined,
): Exclude<InventoryFilterCategory, 'all'> {
  if (!def) return 'misc';
  switch (def.category) {
    case 'equipment':
      return 'equipment';
    case 'consumable':
      return 'consumable';
    case 'book':
    case 'poem_fragment':
      return 'book';
    case 'quest_item':
      return 'quest';
    case 'key_item':
      return 'key';
    default:
      return 'misc';
  }
}

export function matchesFilterCategory(
  filterCategory: Exclude<InventoryFilterCategory, 'all'>,
  selected: InventoryFilterCategory,
): boolean {
  if (selected === 'all') return true;
  return filterCategory === selected;
}

export function resolveInventoryItemView(item: InventoryItem): InventoryItemView {
  const def = getItemDefinition(item.id) ?? null;
  if (!def) {
    return {
      item,
      def: null,
      isUnknown: true,
      rarity: 'common',
      filterCategory: 'misc',
      displayName: item.name || UNKNOWN_ITEM_LABEL,
      displayDescription: item.description || 'Описание недоступно.',
      categoryIcon: INVENTORY_CATEGORY_ICONS.misc,
    };
  }

  const filterCategory = mapDefinitionToFilterCategory(def);
  return {
    item,
    def,
    isUnknown: false,
    rarity: def.rarity,
    filterCategory,
    displayName: item.name,
    displayDescription: item.description || def.description,
    categoryIcon: INVENTORY_CATEGORY_ICONS[def.category] ?? INVENTORY_CATEGORY_ICONS.misc,
  };
}

export function buildCategoryCounts(views: InventoryItemView[]): Record<string, number> {
  return views.reduce<Record<string, number>>((acc, view) => {
    acc[view.filterCategory] = (acc[view.filterCategory] ?? 0) + 1;
    return acc;
  }, {});
}

export function filterAndSortInventoryViews(
  views: InventoryItemView[],
  categoryFilter: InventoryFilterCategory,
  searchQuery: string,
  sortOption: InventorySortOption,
): InventoryItemView[] {
  let items = categoryFilter === 'all'
    ? [...views]
    : views.filter((view) => matchesFilterCategory(view.filterCategory, categoryFilter));

  const query = searchQuery.trim().toLowerCase();
  if (query) {
    items = items.filter(
      (view) =>
        view.displayName.toLowerCase().includes(query)
        || view.displayDescription.toLowerCase().includes(query),
    );
  }

  items.sort((a, b) => {
    switch (sortOption) {
      case 'name':
        return a.displayName.localeCompare(b.displayName, 'ru');
      case 'rarity':
        return INVENTORY_RARITY_WEIGHT[a.rarity] - INVENTORY_RARITY_WEIGHT[b.rarity];
      case 'type':
        return a.filterCategory.localeCompare(b.filterCategory);
      case 'quantity':
        return b.item.quantity - a.item.quantity;
      default: {
        const _exhaustive: never = sortOption;
        return _exhaustive;
      }
    }
  });

  return items;
}

export function canUseInventoryItem(view: InventoryItemView): boolean {
  if (!view.def) return false;
  if (view.def.useMessage) return true;
  return (
    (view.def.category === 'consumable'
      || view.def.category === 'book'
      || view.def.category === 'poem_fragment')
    && view.def.effects.length > 0
  );
}

export function canEquipInventoryItem(view: InventoryItemView): boolean {
  return view.def?.category === 'equipment';
}

export function canDropInventoryItem(view: InventoryItemView, isEquipped: boolean): boolean {
  if (isEquipped) return false;
  if (!view.def) return true;
  return !view.def.questRelated;
}
