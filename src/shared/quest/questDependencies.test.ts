import { describe, it, expect } from 'vitest';
import { areQuestDependenciesMet } from './questDependencies';
import type { QuestState } from '@/shared/types/game';

describe('areQuestDependenciesMet', () => {
  const quests: QuestState[] = [
    { questId: 'q_a', status: 'completed', objectives: {}, startedAtTime: 0 },
    { questId: 'q_b', status: 'active', objectives: {}, startedAtTime: 0 },
  ];

  it('returns met when no prerequisites', () => {
    expect(
      areQuestDependenciesMet('solo', quests, () => ({ id: 'solo', title: 'Solo' } as never)),
    ).toEqual({ met: true, missing: [] });
  });

  it('returns missing when prerequisite not completed', () => {
    const result = areQuestDependenciesMet('q_c', quests, (id) => {
      if (id === 'q_c') {
        return { id: 'q_c', title: 'Quest C', requiresQuests: ['q_b'] } as never;
      }
      if (id === 'q_b') return { id: 'q_b', title: 'Quest B' } as never;
      return undefined;
    });
    expect(result.met).toBe(false);
    expect(result.missing).toContain('Quest B');
  });
});
