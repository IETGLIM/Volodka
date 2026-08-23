import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@/shared/types/game';
import { addInventoryItem } from './inventoryHelpers';

function stackable(id: string, quantity: number, name = id): InventoryItem {
  return {
    id,
    name,
    description: '',
    category: 'consumable',
    stackable: true,
    quantity,
  } as InventoryItem;
}

describe('addInventoryItem — maxStack (v4.7.2)', () => {
  it('без опций maxStack поведение прежнее (бесконечный стак)', () => {
    const inv = [stackable('coffee', 8)];
    const res = addInventoryItem(inv, stackable('coffee', 5));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inventory[0]!.stackable && res.inventory[0].quantity).toBe(13);
    }
  });

  it('стак доливается до maxStack, остаток — в новый стак', () => {
    const inv = [stackable('coffee', 8)];
    const res = addInventoryItem(inv, stackable('coffee', 5), { maxStack: 10 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inventory).toHaveLength(2);
      expect(res.inventory[0]!.quantity).toBe(10);
      expect(res.inventory[1]!.quantity).toBe(3);
    }
  });

  it('стак на пределе — весь добавляемый объём уходит в новый стак', () => {
    const inv = [stackable('coffee', 10)];
    const res = addInventoryItem(inv, stackable('coffee', 4), { maxStack: 10 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inventory).toHaveLength(2);
      expect(res.inventory[0]!.quantity).toBe(10);
      expect(res.inventory[1]!.quantity).toBe(4);
    }
  });

  it('сверхкрупная порция разбивается на несколько стаков', () => {
    const res = addInventoryItem([], stackable('coffee', 25), { maxStack: 10 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inventory).toHaveLength(3);
      expect(res.inventory.map((i) => i.quantity)).toEqual([10, 10, 5]);
    }
  });

  it('точное попадание в лимит не создаёт пустых стаков', () => {
    const inv = [stackable('coffee', 7)];
    const res = addInventoryItem(inv, stackable('coffee', 3), { maxStack: 10 });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.inventory).toHaveLength(1);
      expect(res.inventory[0]!.quantity).toBe(10);
    }
  });

  it('оригинальный инвентарь не мутируется', () => {
    const inv = [stackable('coffee', 8)];
    addInventoryItem(inv, stackable('coffee', 5), { maxStack: 10 });
    expect(inv[0]!.quantity).toBe(8);
    expect(inv).toHaveLength(1);
  });
});
