import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { processExpiredTTLFlags } from '@/engine/PoemPowerSystem';
import { useGameStore } from './gameStore';
import { getPlayerStoreState } from './stores/playerStore';
import { createDefaultPersistedState } from './persistedState';

vi.mock('@/engine/EventBus', () => ({
  eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
}));

describe('world/upsertHintFlag', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useGameStore.setState({
      playerState: {
        ...createDefaultPersistedState().playerState,
        flags: {},
      },
      activeTTLFlags: {},
    });
  });

  it('sets player flag and TTL entry together', () => {
    const expiryTimestamp = Date.now() + 30_000;

    dispatchGameAction({
      type: 'world/upsertHintFlag',
      flag: {
        key: 'poem_hint_exit_glow_active',
        poemId: 'poem_3',
        expiryTimestamp,
      },
    });

    expect(useGameStore.getState().playerState.flags.poem_hint_exit_glow_active).toBe(true);
    expect(useGameStore.getState().activeTTLFlags.poem_hint_exit_glow_active).toEqual({
      key: 'poem_hint_exit_glow_active',
      poemId: 'poem_3',
      expiryTimestamp,
    });
  });

  it('does not leave an orphaned flag when upsert throws', () => {
    vi.spyOn(getPlayerStoreState(), 'upsertHintFlagWithTTL').mockImplementation(() => {
      throw new Error('upsert failed');
    });

    expect(() =>
      dispatchGameAction({
        type: 'world/upsertHintFlag',
        flag: {
          key: 'poem_hint_exit_glow_active',
          poemId: 'poem_3',
          expiryTimestamp: Date.now() + 30_000,
        },
      }),
    ).toThrow('upsert failed');

    expect(useGameStore.getState().playerState.flags.poem_hint_exit_glow_active).toBeUndefined();
    expect(useGameStore.getState().activeTTLFlags.poem_hint_exit_glow_active).toBeUndefined();
  });

  it('clears hint flag when TTL expires', () => {
    dispatchGameAction({
      type: 'world/upsertHintFlag',
      flag: {
        key: 'poem_hint_exit_glow_active',
        poemId: 'poem_3',
        expiryTimestamp: Date.now() + 30_000,
      },
    });

    useGameStore.setState({
      activeTTLFlags: {
        poem_hint_exit_glow_active: {
          key: 'poem_hint_exit_glow_active',
          poemId: 'poem_3',
          expiryTimestamp: Date.now() - 1,
        },
      },
    });

    processExpiredTTLFlags();

    expect(useGameStore.getState().playerState.flags.poem_hint_exit_glow_active).toBe(false);
    expect(useGameStore.getState().activeTTLFlags.poem_hint_exit_glow_active).toBeUndefined();
  });
});
