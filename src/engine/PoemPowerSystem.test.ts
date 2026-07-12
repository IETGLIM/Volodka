import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ttlNow } from '@/shared/ttlClock';
import {
  activatePoemPowerById,
  clearAllPowerTimers,
  getPoemPower,
  processExpiredTTLFlags,
  resetAllPoemEffects,
} from '@/engine/PoemPowerSystem';
import { useGameStore } from '@/store/gameStore';
import { createDefaultPersistedState } from '@/store/persistedState';

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
}));

const BASE_SKILLS = createDefaultPersistedState().playerState.skills;
const BASE_KARMA = createDefaultPersistedState().playerState.karma;

describe('PoemPowerSystem TTL flags', () => {
  beforeEach(() => {
    clearAllPowerTimers();
    resetAllPoemEffects();
    useGameStore.setState({
      collectedPoems: ['poem_6', 'poem_9'],
      playerState: {
        ...useGameStore.getState().playerState,
        skills: { ...BASE_SKILLS },
        karma: BASE_KARMA,
        flags: {},
      },
      activeTTLFlags: {},
      poemPowers: {},
    });
  });

  it('defines flagsToSet for poem_6 and poem_9 reverseOnExpiry powers', () => {
    expect(getPoemPower('poem_6')?.flagsToSet).toEqual([
      { key: 'word_power_active', durationMs: 30000 },
    ]);
    expect(getPoemPower('poem_9')?.flagsToSet).toEqual([
      { key: 'jester_word_active', durationMs: 30000 },
    ]);
  });

  it('reverts poem_6 skill boosts when word_power_active TTL expires', () => {
    expect(activatePoemPowerById('poem_6')).toBe(true);

    const afterActivate = useGameStore.getState().playerState.skills;
    expect(afterActivate.writing).toBe(BASE_SKILLS.writing + 4);
    expect(afterActivate.persuasion).toBe(BASE_SKILLS.persuasion + 4);
    expect(useGameStore.getState().activeTTLFlags.word_power_active).toMatchObject({
      key: 'word_power_active',
      poemId: 'poem_6',
    });

    useGameStore.setState({
      activeTTLFlags: {
        word_power_active: {
          key: 'word_power_active',
          poemId: 'poem_6',
          expiryTimestamp: ttlNow() - 1,
        },
      },
    });

    processExpiredTTLFlags();

    const afterExpiry = useGameStore.getState().playerState.skills;
    expect(afterExpiry.writing).toBe(BASE_SKILLS.writing);
    expect(afterExpiry.persuasion).toBe(BASE_SKILLS.persuasion);
    expect(useGameStore.getState().activeTTLFlags.word_power_active).toBeUndefined();
    expect(useGameStore.getState().playerState.flags.word_power_active).toBe(false);
  });

  it('reverts poem_9 karma and persuasion when jester_word_active TTL expires', () => {
    expect(activatePoemPowerById('poem_9')).toBe(true);

    const afterActivate = useGameStore.getState().playerState;
    expect(afterActivate.karma).toBe(BASE_KARMA + 3);
    expect(afterActivate.skills.persuasion).toBe(BASE_SKILLS.persuasion + 2);
    expect(useGameStore.getState().activeTTLFlags.jester_word_active).toMatchObject({
      key: 'jester_word_active',
      poemId: 'poem_9',
    });

    useGameStore.setState({
      activeTTLFlags: {
        jester_word_active: {
          key: 'jester_word_active',
          poemId: 'poem_9',
          expiryTimestamp: ttlNow() - 1,
        },
      },
    });

    processExpiredTTLFlags();

    const afterExpiry = useGameStore.getState().playerState;
    expect(afterExpiry.karma).toBe(BASE_KARMA);
    expect(afterExpiry.skills.persuasion).toBe(BASE_SKILLS.persuasion);
    expect(useGameStore.getState().activeTTLFlags.jester_word_active).toBeUndefined();
    expect(useGameStore.getState().playerState.flags.jester_word_active).toBe(false);
  });

  it('does not drive skills below zero when reverse exceeds current value', () => {
    useGameStore.setState({
      collectedPoems: ['poem_6'],
      playerState: {
        ...useGameStore.getState().playerState,
        skills: { ...BASE_SKILLS, writing: 1, persuasion: 0 },
        flags: { word_power_active: true },
      },
      activeTTLFlags: {
        word_power_active: {
          key: 'word_power_active',
          poemId: 'poem_6',
          expiryTimestamp: ttlNow() - 1,
        },
      },
    });

    processExpiredTTLFlags();

    const skills = useGameStore.getState().playerState.skills;
    expect(skills.writing).toBe(0);
    expect(skills.persuasion).toBe(0);
  });
});
