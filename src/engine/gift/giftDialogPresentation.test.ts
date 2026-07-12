import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@/shared/types/game';
import {
  buildGiftableItems,
  countGiftableItems,
  isGiftableInventoryItem,
} from '@/engine/gift/giftDialogPresentation';

describe('giftDialogPresentation', () => {
  it('treats missing item definitions as giftable', () => {
    expect(isGiftableInventoryItem('unknown-item')).toBe(true);
  });

  it('excludes quest-related items', () => {
    expect(isGiftableInventoryItem('maria_data_chip')).toBe(false);
  });

  it('counts and sorts giftable inventory items', () => {
    const inventory = [
      { id: 'maria_data_chip', name: 'Quest', quantity: 1 },
      { id: 'coffee', name: 'Кофе', quantity: 2 },
      { id: 'unknown-item', name: 'Без определения', quantity: 1 },
    ] as InventoryItem[];

    expect(countGiftableItems(inventory)).toBe(2);

    const giftable = buildGiftableItems(inventory, 'zarema');
    expect(giftable.map((item) => item.id)).toEqual(['coffee', 'unknown-item']);
    expect(giftable.every((item) => 'preference' in item && 'affinityChange' in item)).toBe(true);
  });
});
