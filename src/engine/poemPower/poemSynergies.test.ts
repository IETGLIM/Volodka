import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  POEM_SYNERGY_WINDOW_MS,
  findPoemSynergy,
} from '@/config/poemSynergies';
import {
  activatePoemPowerById,
  clearAllPowerTimers,
  processExpiredTTLFlags,
  resetAllPoemEffects,
} from '@/engine/PoemPowerSystem';
import { applyPoemSkillCheckModifiers } from '@/engine/poemPower/poemSkillCheckModifiers';
import { checkStoryCondition } from '@/shared/storyConditions';
import { useGameStore } from '@/store/gameStore';
import { createDefaultPersistedState } from '@/store/persistedState';

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
}));

const BASE_SKILLS = createDefaultPersistedState().playerState.skills;

function setupPoems(poemIds: string[]) {
  clearAllPowerTimers();
  resetAllPoemEffects();
  useGameStore.setState({
    collectedPoems: poemIds,
    playerState: {
      ...useGameStore.getState().playerState,
      skills: { ...BASE_SKILLS },
      flags: {},
    },
    activeTTLFlags: {},
    poemPowers: {},
    lastUsedPoemId: null,
    lastUsedPoemTimestamp: null,
    notifications: [],
  });
}

describe('poem synergies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('findPoemSynergy resolves bidirectional pairs within the rhythm window', () => {
    const now = Date.now();
    expect(findPoemSynergy('poem_8', 'poem_5', now - 2000, now)?.synergyId).toBe('storm_breakthrough');
    expect(findPoemSynergy('poem_5', 'poem_8', now - 2000, now)?.synergyId).toBe('storm_breakthrough');
    expect(findPoemSynergy('poem_1', 'poem_6', now - 1000, now)?.synergyId).toBe('voice_word');
    expect(findPoemSynergy('poem_6', 'poem_1', now - 1000, now)?.synergyId).toBe('voice_word');
  });

  it('findPoemSynergy returns null when the rhythm window expired', () => {
    const now = Date.now();
    expect(
      findPoemSynergy('poem_8', 'poem_5', now - POEM_SYNERGY_WINDOW_MS - 1, now),
    ).toBeNull();
  });

  it('findPoemSynergy returns null for the same poem twice', () => {
    const now = Date.now();
    expect(findPoemSynergy('poem_5', 'poem_5', now - 1000, now)).toBeNull();
  });

  it('activating poem_5 then poem_8 within 5s applies storm breakthrough synergy flags', () => {
    setupPoems(['poem_5', 'poem_8']);

    expect(activatePoemPowerById('poem_5')).toBe(true);
    useGameStore.setState({ lastUsedPoemTimestamp: Date.now() - 2000 });

    expect(activatePoemPowerById('poem_8')).toBe(true);

    const state = useGameStore.getState();
    expect(state.playerState.flags.synergy_storm_breakthrough_skip).toBe(true);
    expect(state.playerState.flags.synergy_storm_breakthrough_intuition).toBe(true);
    expect(state.playerState.skills.intuition).toBe(BASE_SKILLS.intuition + 5 + 10);
    expect(state.notifications.some((n) => n.text === 'Синергия: Штормовой Прорыв')).toBe(true);
  });

  it('activating poem_8 then poem_5 within 5s also triggers storm breakthrough', () => {
    setupPoems(['poem_5', 'poem_8']);

    expect(activatePoemPowerById('poem_8')).toBe(true);
    useGameStore.setState({ lastUsedPoemTimestamp: Date.now() - 1500 });

    expect(activatePoemPowerById('poem_5')).toBe(true);

    expect(useGameStore.getState().playerState.flags.synergy_storm_breakthrough_skip).toBe(true);
    expect(useGameStore.getState().notifications.some((n) => n.text.includes('Штормовой Прорыв'))).toBe(true);
  });

  it('does not trigger synergy when the rhythm window expired', () => {
    setupPoems(['poem_5', 'poem_8']);
    const baseNow = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now');

    nowSpy.mockReturnValue(baseNow);
    expect(activatePoemPowerById('poem_5')).toBe(true);

    nowSpy.mockReturnValue(baseNow + POEM_SYNERGY_WINDOW_MS + 100);
    expect(activatePoemPowerById('poem_8')).toBe(true);

    expect(useGameStore.getState().playerState.flags.synergy_storm_breakthrough_skip).toBeUndefined();
    expect(useGameStore.getState().notifications.some((n) => n.text.startsWith('Синергия:'))).toBe(false);

    nowSpy.mockRestore();
  });

  it('poem_1 + poem_6 synergy grants critical persuasion flag', () => {
    setupPoems(['poem_1', 'poem_6']);

    expect(activatePoemPowerById('poem_1')).toBe(true);
    useGameStore.setState({ lastUsedPoemTimestamp: Date.now() - 1000 });
    expect(activatePoemPowerById('poem_6')).toBe(true);

    expect(useGameStore.getState().playerState.flags.synergy_voice_word_crit).toBe(true);
  });

  it('synergy storm breakthrough skip auto-passes the next coding check', () => {
    setupPoems(['poem_5', 'poem_8']);
    expect(activatePoemPowerById('poem_5')).toBe(true);
    useGameStore.setState({ lastUsedPoemTimestamp: Date.now() - 500 });
    expect(activatePoemPowerById('poem_8')).toBe(true);

    const flags = useGameStore.getState().playerState.flags;
    const lowSkills = { ...BASE_SKILLS, coding: 1 };
    const result = applyPoemSkillCheckModifiers('coding', 15, lowSkills, flags);
    expect(result.success).toBe(true);
    expect(useGameStore.getState().playerState.flags.synergy_storm_breakthrough_skip).toBe(false);
  });

  it('voice word synergy critical auto-passes persuasion via story condition', () => {
    setupPoems(['poem_1', 'poem_6']);
    expect(activatePoemPowerById('poem_1')).toBe(true);
    useGameStore.setState({ lastUsedPoemTimestamp: Date.now() - 800 });
    expect(activatePoemPowerById('poem_6')).toBe(true);

    const ctx = {
      karma: 50,
      skills: { ...BASE_SKILLS, persuasion: 1 },
      flags: useGameStore.getState().playerState.flags,
      collectedPoems: ['poem_1', 'poem_6'],
      currentAct: 1,
    };

    const check = checkStoryCondition(
      { minSkillCheck: { skill: 'persuasion', difficulty: 12 } },
      ctx,
    );
    expect(check.pass).toBe(true);
    expect(check.skillCheckResult?.critical).toBe(true);
    if (check.consumedFlag) {
      applyPoemSkillCheckModifiers('persuasion', 12, ctx.skills, ctx.flags);
    }
    expect(useGameStore.getState().playerState.flags.synergy_voice_word_crit).toBe(false);
  });

  it('reverts storm breakthrough intuition boost when synergy TTL expires', () => {
    setupPoems(['poem_5', 'poem_8']);
    expect(activatePoemPowerById('poem_5')).toBe(true);
    useGameStore.setState({ lastUsedPoemTimestamp: Date.now() - 500 });
    expect(activatePoemPowerById('poem_8')).toBe(true);

    const boosted = useGameStore.getState().playerState.skills.intuition;

    useGameStore.setState({
      activeTTLFlags: {
        synergy_storm_breakthrough_intuition: {
          key: 'synergy_storm_breakthrough_intuition',
          poemId: 'storm_breakthrough',
          expiryTimestamp: Date.now() - 1,
        },
      },
    });

    processExpiredTTLFlags();

    expect(useGameStore.getState().playerState.skills.intuition).toBe(boosted - 10);
  });
});
