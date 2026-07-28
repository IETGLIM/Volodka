import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getGuildInfiltrationHint,
  getPoetryBroadcastHint,
  getRoofOfTheWorldHint,
} from './act4QuestHints';

const snap = {
  quests: [] as Array<{
    questId: string;
    status: string;
    objectives: Record<string, boolean>;
    startedAtTime: number;
  }>,
};

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => snap,
}));

describe('act4QuestHints', () => {
  beforeEach(() => {
    snap.quests = [];
  });

  it('guild_infiltration adapts to office vs elsewhere', () => {
    snap.quests = [{
      questId: 'guild_infiltration',
      status: 'active',
      objectives: {},
      startedAtTime: 0,
    }];
    expect(getGuildInfiltrationHint('office_day')).toContain('пропуск');
    expect(getGuildInfiltrationHint('street_night')).toContain('офисе');
  });

  it('poetry_broadcast points to rooftop tower', () => {
    snap.quests = [{
      questId: 'poetry_broadcast',
      status: 'active',
      objectives: { gather_all_poems: true },
      startedAtTime: 0,
    }];
    expect(getPoetryBroadcastHint('street_night')).toMatch(/крыш/i);
    expect(getPoetryBroadcastHint('rooftop_edge')).toMatch(/башн/i);
  });

  it('roof_of_the_world guides confrontation on rooftop', () => {
    snap.quests = [{
      questId: 'roof_of_the_world',
      status: 'active',
      objectives: { reach_rooftop: true },
      startedAtTime: 0,
    }];
    expect(getRoofOfTheWorldHint('rooftop_edge')).toContain('Александру');
    expect(getRoofOfTheWorldHint('cafe_evening')).toContain('крыши');
  });

  it('returns null when quest inactive', () => {
    expect(getGuildInfiltrationHint('office_day')).toBeNull();
  });
});
