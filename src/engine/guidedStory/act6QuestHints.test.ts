import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getAct6SecretArchiveHint,
  getDataHeistHint,
  getRooftopConfrontationHint,
  getSystemInfiltrationHint,
  getTraitorInTheGuildHint,
  getUndergroundResistanceHint,
} from './act6QuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('act6QuestHints', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('traitor_in_the_guild — factory logs first', () => {
    quests.push({
      questId: 'traitor_in_the_guild',
      status: 'active',
      objectives: {},
    });
    expect(getTraitorInTheGuildHint('street_night')).toContain('фабрик');
    expect(getTraitorInTheGuildHint('abandoned_factory')).toContain('Логи');
  });

  it('underground_resistance — street contacts', () => {
    quests.push({
      questId: 'underground_resistance',
      status: 'active',
      objectives: {},
    });
    expect(getUndergroundResistanceHint('volodka_room')).toContain('улиц');
  });

  it('data_heist — plan then office', () => {
    quests.push({
      questId: 'data_heist',
      status: 'active',
      objectives: { plan_infiltration: true },
    });
    expect(getDataHeistHint('street_night')).toMatch(/офис/i);
  });

  it('act6_secret_archive — factory hatch first', () => {
    quests.push({
      questId: 'act6_secret_archive',
      status: 'active',
      objectives: {},
    });
    expect(getAct6SecretArchiveHint('street_night')).toContain('фабрик');
    expect(getAct6SecretArchiveHint('abandoned_factory')).toMatch(/люк|Голос/i);
  });

  it('act6_secret_archive — decode after door', () => {
    quests.push({
      questId: 'act6_secret_archive',
      status: 'active',
      objectives: { find_hidden_hatch: true, open_archive_door: true },
    });
    expect(getAct6SecretArchiveHint('abandoned_factory')).toMatch(/Расшифр/i);
  });

  it('rooftop_confrontation — go to roof', () => {
    quests.push({
      questId: 'rooftop_confrontation',
      status: 'active',
      objectives: {},
    });
    expect(getRooftopConfrontationHint('street_night')).toContain('крыш');
  });

  it('system_infiltration — factory core', () => {
    quests.push({
      questId: 'system_infiltration',
      status: 'active',
      objectives: { analyze_blackmail_data: true },
    });
    expect(getSystemInfiltrationHint('street_night')).toContain('фабрик');
    expect(getSystemInfiltrationHint('abandoned_factory')).toContain('Ядро');
  });

  it('returns null when quest inactive', () => {
    expect(getTraitorInTheGuildHint('street_night')).toBeNull();
  });
});
