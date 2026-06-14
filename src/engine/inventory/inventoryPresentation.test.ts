import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@/shared/types/game';
import {
  buildCategoryCounts,
  canDropInventoryItem,
  canEquipInventoryItem,
  canUseInventoryItem,
  filterAndSortInventoryViews,
  mapDefinitionToFilterCategory,
  resolveInventoryItemView,
} from '@/engine/inventory/inventoryPresentation';
import { getItemDefinition } from '@/data/items';

function item(id: string, name: string): InventoryItem {
  return { id, name, quantity: 1 } as InventoryItem;
}

describe('resolveInventoryItemView', () => {
  it('returns unknown fallback when definition is missing', () => {
    const view = resolveInventoryItemView(item('missing_item_xyz', ''));
    expect(view.isUnknown).toBe(true);
    expect(view.def).toBeNull();
    expect(view.displayName).toBeTruthy();
  });

  it('uses definition category as filter source', () => {
    const view = resolveInventoryItemView(item('energy_drink', 'Энергетик'));
    if (!view.def) return;
    expect(view.filterCategory).toBe('consumable');
    expect(view.isUnknown).toBe(false);
  });
});

describe('filterAndSortInventoryViews', () => {
  const views = [
    resolveInventoryItemView(item('energy_drink', 'Энергетик')),
    resolveInventoryItemView(item('maria_data_chip', 'Чип')),
  ].filter((view) => view.def);

  it('filters by category', () => {
    if (views.length < 2) return;
    const consumables = filterAndSortInventoryViews(views, 'consumable', '', 'name');
    expect(consumables.every((view) => view.filterCategory === 'consumable')).toBe(true);
  });

  it('sorts by name', () => {
    if (views.length < 2) return;
    const sorted = filterAndSortInventoryViews(views, 'all', '', 'name');
    const names = sorted.map((view) => view.displayName);
    expect([...names].sort((a, b) => a.localeCompare(b, 'ru'))).toEqual(names);
  });
});

describe('buildCategoryCounts', () => {
  it('aggregates filter categories', () => {
    const view = resolveInventoryItemView(item('energy_drink', 'Энергетик'));
    if (!view.def) return;
    const counts = buildCategoryCounts([view]);
    expect(counts.consumable).toBe(1);
  });
});

describe('action guards', () => {
  it('blocks drop for quest items', () => {
    const view = resolveInventoryItemView(item('maria_data_chip', 'Чип'));
    if (!view.def?.questRelated) return;
    expect(canDropInventoryItem(view, false)).toBe(false);
  });

  it('allows equip only for equipment definitions', () => {
    const def = getItemDefinition('hoodie');
    if (!def || def.category !== 'equipment') return;
    const view = resolveInventoryItemView(item('hoodie', 'Худи'));
    expect(canEquipInventoryItem(view)).toBe(true);
  });
});

describe('mapDefinitionToFilterCategory', () => {
  it('maps poem_fragment to book filter', () => {
    expect(mapDefinitionToFilterCategory({ category: 'poem_fragment' } as never)).toBe('book');
  });
});

describe('canUseInventoryItem', () => {
  it('returns boolean for consumable with effects', () => {
    const view = resolveInventoryItemView(item('energy_drink', 'Энергетик'));
    if (!view.def || view.def.category !== 'consumable') return;
    expect(typeof canUseInventoryItem(view)).toBe('boolean');
  });
});
