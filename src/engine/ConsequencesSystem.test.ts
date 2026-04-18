import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PlayerState } from '@/data/types';
import { initConsequencesSystem, resetConsequences } from './ConsequencesSystem';

const minimalPlayer = { flags: {} } as unknown as PlayerState;

function minimalContext() {
  return {
    playerState: minimalPlayer,
    npcRelations: [],
    flags: {},
    activeQuestIds: [],
    completedQuestIds: [],
    inventory: [],
    visitedNodes: [],
  };
}

const noopActions = {
  addStat: vi.fn(),
  addStress: vi.fn(),
  reduceStress: vi.fn(),
  setFlag: vi.fn(),
  unsetFlag: vi.fn(),
  updateNPCRelation: vi.fn(),
  addSkill: vi.fn(),
  activateQuest: vi.fn(),
};

describe('ConsequencesSystem', () => {
  beforeEach(() => {
    resetConsequences();
  });

  it('resetConsequences allows clean re-init without throwing', () => {
    initConsequencesSystem(minimalContext, noopActions);
    resetConsequences();
    expect(() => initConsequencesSystem(minimalContext, noopActions)).not.toThrow();
  });
});
