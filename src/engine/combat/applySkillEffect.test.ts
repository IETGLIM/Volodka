import { describe, expect, it, vi } from 'vitest';
import { applySkillEffect } from '@/engine/combat/actions';

const dispatchMock = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({
    playerState: {
      skills: { coding: 1, logic: 1, empathy: 1, persuasion: 1, intuition: 1, writing: 1, rhythm: 0 },
      flags: {},
      progression: { unlockedSkills: [] },
    },
  }),
  dispatchGameAction: (...args: unknown[]) => dispatchMock(...args),
  tryActivatePoemPower: vi.fn(),
}));

describe('applySkillEffect', () => {
  it('applies stat and passive flag for tier-5 via skill id', () => {
    dispatchMock.mockClear();
    applySkillEffect('Ультимативный: стихи в коде имеют двойной эффект', 'tech_t5_ultimate');

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'player/setFlag',
      key: 'passive_poem_in_code_double',
      value: true,
    });
    expect(
      dispatchMock.mock.calls.some(
        (call) => call[0]?.type === 'player/addSkill',
      ),
    ).toBe(false);
  });

  it('applies percent legacy flags instead of silently dropping them', () => {
    dispatchMock.mockClear();
    applySkillEffect('writing +4, stress -20%', 'spiritual_3b');

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'player/addSkill',
      skill: 'writing',
      amount: 4,
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'player/setFlag',
      key: 'legacy_skill_percent_stress',
      value: true,
    });
  });
});
