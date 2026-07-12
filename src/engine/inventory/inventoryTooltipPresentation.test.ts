import { describe, expect, it, vi } from 'vitest';
import { resolveInventoryItemView } from '@/engine/inventory/inventoryPresentation';
import {
  buildInventoryTooltipContent,
  computeTooltipCoords,
} from '@/engine/inventory/inventoryTooltipPresentation';
import type { InventoryItem } from '@/shared/types/game';

function item(id: string, name: string): InventoryItem {
  return { id, name, quantity: 1 } as InventoryItem;
}

describe('buildInventoryTooltipContent', () => {
  it('uses definition category as source of truth', () => {
    const view = resolveInventoryItemView(item('energy_drink', 'Энергетик'));
    if (!view.def) return;
    const content = buildInventoryTooltipContent(view);
    expect(content.categoryLabel).toBe('Расходуемый');
    expect(content.isUnknown).toBe(false);
  });

  it('returns unknown fallback content and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = resolveInventoryItemView(item('missing_tooltip_item', ''));
    const content = buildInventoryTooltipContent(view);
    expect(content.isUnknown).toBe(true);
    expect(content.displayName).toBeTruthy();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

function rect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

const TEST_VIEWPORT = { width: 800, height: 600 };

describe('computeTooltipCoords', () => {
  it('clamps horizontal position inside viewport', () => {
    const coords = computeTooltipCoords(rect(760, 100, 40, 40), 256, 160, 'above', TEST_VIEWPORT);
    expect(coords.left).toBeLessThanOrEqual(800 - 256 - 8);
    expect(coords.left).toBeGreaterThanOrEqual(8);
  });

  it('flips to below when above does not fit', () => {
    const coords = computeTooltipCoords(rect(100, 10, 40, 40), 256, 200, 'above', TEST_VIEWPORT);
    expect(coords.placement).toBe('below');
  });
});
