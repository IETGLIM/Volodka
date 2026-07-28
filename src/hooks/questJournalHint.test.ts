import { describe, expect, it, vi } from 'vitest';
import { buildQuestJournalContextualHint } from '@/hooks/questJournalHint';

vi.mock('@/engine/guidedStory/firstReadingHint', () => ({
  getFirstReadingHint: () => 'Подойди к рабочему столу и нажми [E]',
}));

vi.mock('@/store/questStore', () => ({
  getNextTrackedObjective: (questId: string) =>
    questId === 'side_demo'
      ? { objectiveId: 'o1', description: 'Поговори с Катей' }
      : null,
  getQuestMarker: (questId: string) =>
    questId === 'side_demo'
      ? { sceneId: 'library_day' as const, position: [0, 0, 0] as [number, number, number] }
      : null,
}));

vi.mock('@/config/scenes', () => ({
  getSceneConfig: (id: string) => ({ id, name: id === 'library_day' ? 'Библиотека' : id }),
}));

describe('buildQuestJournalContextualHint', () => {
  it('prefers first_reading live cue', () => {
    expect(buildQuestJournalContextualHint('first_reading', 'volodka_room')).toBe(
      'Подойди к рабочему столу и нажми [E]',
    );
  });

  it('combines next objective with travel direction', () => {
    const hint = buildQuestJournalContextualHint('side_demo', 'volodka_room');
    expect(hint).toContain('Поговори с Катей');
    expect(hint).toMatch(/Перейдите:/);
  });
});
