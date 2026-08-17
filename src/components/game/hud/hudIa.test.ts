import { describe, expect, it } from 'vitest';
import {
  HUD_OVERFLOW_FROM_TOPBAR,
  HUD_OVERFLOW_SECTION_TITLES,
  HUD_PRIMARY_ACTIONS,
} from './hudIa';

describe('HUD IA (Sprint 0)', () => {
  it('keeps only quests + inventory as primary top-bar actions', () => {
    expect([...HUD_PRIMARY_ACTIONS]).toEqual(['quests', 'inventory']);
  });

  it('moves low-frequency top-bar actions into overflow (no Save duplicate)', () => {
    expect([...HUD_OVERFLOW_FROM_TOPBAR]).toEqual([
      'journal',
      'crafting',
      'trading',
      'photo',
      'stats',
    ]);
    expect(HUD_OVERFLOW_FROM_TOPBAR).not.toContain('save');
  });

  it('defines Russian overflow section titles', () => {
    expect(HUD_OVERFLOW_SECTION_TITLES.play).toBe('Игра');
    expect(HUD_OVERFLOW_SECTION_TITLES.system).toBe('Система');
  });
});
