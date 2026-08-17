import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGameSnapshotMock = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => getGameSnapshotMock(),
}));

import { getFirstReadingHint } from './firstReadingHint';

function snap(partial: Record<string, unknown>) {
  return {
    playerState: {
      progression: { currentAct: 1 },
      flags: {},
      ...(partial.playerState as object | undefined),
    },
    quests: [{ questId: 'first_reading', status: 'active' }],
    collectedPoems: [],
    ...partial,
  };
}

describe('getFirstReadingHint', () => {
  beforeEach(() => {
    getGameSnapshotMock.mockReset();
  });

  it('returns desk cue before desk interaction', () => {
    getGameSnapshotMock.mockReturnValue(snap({}));
    expect(getFirstReadingHint()).toContain('Рабочий стол');
  });

  it('returns monitor cue after desk, before poem', () => {
    getGameSnapshotMock.mockReturnValue(
      snap({
        playerState: {
          progression: { currentAct: 1 },
          flags: { interacted_desk: true },
        },
      }),
    );
    expect(getFirstReadingHint()).toContain('Монитор');
  });

  it('returns null when poem_2 is collected', () => {
    getGameSnapshotMock.mockReturnValue(
      snap({
        playerState: {
          progression: { currentAct: 1 },
          flags: { interacted_desk: true, terminal_poem_read: true },
        },
        collectedPoems: ['poem_2'],
      }),
    );
    expect(getFirstReadingHint()).toBeNull();
  });
});
