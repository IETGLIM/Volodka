import { describe, expect, it } from 'vitest';
import {
  computeObjectiveProgressPercent,
  formatQuestObjectiveProgress,
  getQuestTypeStripLabel,
  getQuestUrgencyColor,
  resolveHudQuestBadgeCount,
  resolveQuestUrgency,
  shouldPulseQuestBadge,
} from '@/hooks/questHudPresentation';

describe('questHudPresentation', () => {
  it('formats objective progress', () => {
    expect(formatQuestObjectiveProgress(2, 5)).toBe('2/5 целей');
    expect(computeObjectiveProgressPercent(2, 5)).toBe(40);
    expect(formatQuestObjectiveProgress(0, 0)).toBe('');
  });

  it('maps urgency to filmic colors', () => {
    expect(getQuestUrgencyColor('required')).toBe('#c4b5a0');
    expect(getQuestUrgencyColor('recommended')).toBe('#a8b4bc');
    expect(getQuestUrgencyColor('optional')).toBe('#78716c');
  });

  it('labels quest strip by type and availability', () => {
    expect(getQuestTypeStripLabel('main', 'active_quest')).toBe('ОСНОВНОЕ');
    expect(getQuestTypeStripLabel('side', 'available_quest')).toBe('ДОСТУПНО');
  });

  it('resolveQuestUrgency prioritizes main active quests', () => {
    expect(resolveQuestUrgency('main', 'active_quest')).toBe('required');
    expect(resolveQuestUrgency('side', 'active_quest')).toBe('recommended');
    expect(resolveQuestUrgency('main', 'story_guidance', 'optional')).toBe('optional');
  });

  it('resolveHudQuestBadgeCount prefers recent events', () => {
    expect(resolveHudQuestBadgeCount(2, 5)).toBe(2);
    expect(resolveHudQuestBadgeCount(0, 3)).toBe(3);
    expect(resolveHudQuestBadgeCount(0, 0)).toBe(0);
    expect(shouldPulseQuestBadge(1)).toBe(true);
    expect(shouldPulseQuestBadge(0)).toBe(false);
  });
});
