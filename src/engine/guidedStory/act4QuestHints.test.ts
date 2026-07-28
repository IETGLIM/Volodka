import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getArchiveOfForgottenHint,
  getBlindSpotHint,
  getGuildInfiltrationHint,
  getLastPoemHint,
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

  it('last_poem guides quiet rooftop write', () => {
    snap.quests = [{
      questId: 'last_poem',
      status: 'active',
      objectives: { collect_all_phrases: true },
      startedAtTime: 0,
    }];
    expect(getLastPoemHint('street_night')).toMatch(/крыш/i);
    expect(getLastPoemHint('rooftop_edge')).toMatch(/писать|Тихое/i);
  });

  it('blind_spot guides logs then cafe', () => {
    snap.quests = [{
      questId: 'blind_spot',
      status: 'active',
      objectives: {},
      startedAtTime: 0,
    }];
    expect(getBlindSpotHint('street_night')).toMatch(/лог|офис/i);
    snap.quests[0].objectives = { check_office_logs: true };
    expect(getBlindSpotHint('cafe_evening')).toMatch(/Допрос|кафе/i);
  });

  it('archive_of_forgotten guides library then basement', () => {
    snap.quests = [{
      questId: 'archive_of_forgotten',
      status: 'active',
      objectives: {},
      startedAtTime: 0,
    }];
    expect(getArchiveOfForgottenHint('street_night')).toMatch(/библиотек|Алина/i);
    snap.quests[0].objectives = { meet_vera_library: true };
    expect(getArchiveOfForgottenHint('library_day')).toMatch(/подвал|архив/i);
  });

  it('returns null when quest inactive', () => {
    expect(getGuildInfiltrationHint('office_day')).toBeNull();
  });
});
