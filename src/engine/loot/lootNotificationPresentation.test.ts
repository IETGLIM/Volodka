import { describe, expect, it } from 'vitest';
import {
  buildCombatLootPayload,
  buildKarmaChangePayload,
  buildXpGainedPayload,
  getRarityBadgeLabel,
  getLootNotificationSfx,
  trimLootNotifications,
} from '@/engine/loot/lootNotificationPresentation';

describe('lootNotificationPresentation', () => {
  it('formats rarity badge labels', () => {
    expect(getRarityBadgeLabel('legendary')).toBe('★ ЛЕГЕНДАРНЫЙ');
    expect(getRarityBadgeLabel('common')).toBeNull();
  });

  it('trims notifications to max visible count', () => {
    const items = Array.from({ length: 7 }, (_, index) => ({
      id: String(index),
      type: 'item' as const,
      label: `Item ${index}`,
    }));
    expect(trimLootNotifications(items, 5)).toHaveLength(5);
    expect(trimLootNotifications(items, 5)[0]?.id).toBe('2');
  });

  it('maps notification types to sfx keys', () => {
    expect(getLootNotificationSfx('skill')).toBe('quest_complete');
    expect(getLootNotificationSfx('item')).toBe('notify');
  });

  it('builds xp payload', () => {
    expect(buildXpGainedPayload(50).label).toBe('+50 опыта');
  });

  it('builds combat loot payload with trophy detail', () => {
    const payload = buildCombatLootPayload('Меч', 'rare');
    expect(payload.detail).toBe('Трофей');
    expect(payload.rarity).toBe('rare');
  });

  it('builds karma payload for negative values', () => {
    expect(buildKarmaChangePayload(-3).label).toBe('Карма -3');
  });
});
