import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  HEART_BOND_MIN_RELATION_VALUE,
  isHeartBondEligible,
  selectHeartBondTarget,
} from '@/engine/npcRelationship/selectHeartBondTarget';

const dispatchGameAction = vi.fn();

vi.mock('@/engine/GameActionDispatcher', () => ({
  dispatchGameAction: (...args: unknown[]) => dispatchGameAction(...args),
  getGameSnapshot: () => mockSnapshot,
}));

let mockSnapshot: {
  npcRelations: Array<{ npcId: string; value: number }>;
  playerState: { flags: Record<string, boolean>; progression: { unlockedSkills: string[] }; skills: { coding: number } };
  lastUsedPoemId: string | null;
  lastUsedPoemTimestamp: number | null;
};

describe('selectHeartBondTarget', () => {
  it('returns null when all NPCs are unmet with relation 0', () => {
    const target = selectHeartBondTarget(
      [
        { npcId: 'zarema', value: 0 },
        { npcId: 'maria', value: 0 },
      ],
      {},
    );
    expect(target).toBeNull();
  });

  it('picks met NPC at 15 over unmet NPC at 0', () => {
    const target = selectHeartBondTarget(
      [
        { npcId: 'maria', value: 0 },
        { npcId: 'zarema', value: 15 },
      ],
      { met_zarema: true },
    );
    expect(target).toEqual({ npcId: 'zarema', value: 15 });
  });

  it('prefers highest eligible relation among met NPCs', () => {
    const target = selectHeartBondTarget(
      [
        { npcId: 'zarema', value: 15 },
        { npcId: 'maria', value: 40 },
      ],
      { met_zarema: true, met_maria: true },
    );
    expect(target).toEqual({ npcId: 'maria', value: 40 });
  });

  it('treats positive relation rows as met when no explicit met flag exists', () => {
    expect(
      isHeartBondEligible({ npcId: 'albert', value: 15 }, {}),
    ).toBe(true);
  });

  it('rejects unknown NPC ids', () => {
    expect(
      isHeartBondEligible({ npcId: 'nonexistent_npc', value: 50 }, { met_nonexistent_npc: true }),
    ).toBe(false);
  });

  it('uses minimum relation threshold constant', () => {
    expect(HEART_BOND_MIN_RELATION_VALUE).toBe(1);
    expect(
      isHeartBondEligible({ npcId: 'albert', value: 0 }, { met_albert: true }),
    ).toBe(false);
  });
});

describe('applyHeartBondBonus', () => {
  beforeEach(() => {
    dispatchGameAction.mockReset();
    mockSnapshot = {
      npcRelations: [],
      playerState: {
        flags: {},
        progression: { unlockedSkills: [] },
        skills: { coding: 0 },
      },
      lastUsedPoemId: null,
      lastUsedPoemTimestamp: null,
    };
  });

  it('applies +20 only to the eligible winner', async () => {
    const { tryApplyPoemSynergy } = await import('@/engine/poemPower/applyPoemSynergy');
    mockSnapshot.npcRelations = [
      { npcId: 'maria', value: 0 },
      { npcId: 'zarema', value: 35 },
    ];
    mockSnapshot.playerState.flags = { met_zarema: true };
    mockSnapshot.lastUsedPoemId = 'poem_4';
    mockSnapshot.lastUsedPoemTimestamp = Date.now() - 1000;

    tryApplyPoemSynergy('poem_17');

    expect(dispatchGameAction).toHaveBeenCalledWith({
      type: 'player/setNpcRelation',
      npcId: 'zarema',
      delta: 20,
    });
    expect(dispatchGameAction).not.toHaveBeenCalledWith({
      type: 'player/setNpcRelation',
      npcId: 'maria',
      delta: 20,
    });
  });

  it('does not apply bonus when best relation is below threshold', async () => {
    const { tryApplyPoemSynergy } = await import('@/engine/poemPower/applyPoemSynergy');
    mockSnapshot.npcRelations = [{ npcId: 'zarema', value: 15 }];
    mockSnapshot.playerState.flags = { met_zarema: true };
    mockSnapshot.lastUsedPoemId = 'poem_4';
    mockSnapshot.lastUsedPoemTimestamp = Date.now() - 1000;

    tryApplyPoemSynergy('poem_17');

    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'player/setNpcRelation' }),
    );
  });

  it('does not apply bonus when no NPC is eligible', async () => {
    const { tryApplyPoemSynergy } = await import('@/engine/poemPower/applyPoemSynergy');
    mockSnapshot.npcRelations = [
      { npcId: 'zarema', value: 0 },
      { npcId: 'maria', value: 0 },
    ];
    mockSnapshot.lastUsedPoemId = 'poem_4';
    mockSnapshot.lastUsedPoemTimestamp = Date.now() - 1000;

    tryApplyPoemSynergy('poem_17');

    expect(dispatchGameAction).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'player/setNpcRelation' }),
    );
  });
});
