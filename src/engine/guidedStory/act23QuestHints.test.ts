import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getBasementHumHint,
  getCafeSafehouseHint,
  getDmitryDefectionHint,
  getMariaTruthHint,
  getZaremaRescueHint,
} from './act23QuestHints';

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

describe('act23QuestHints', () => {
  beforeEach(() => {
    snap.quests = [];
  });

  it('cafe_safehouse adapts to cafe presence', () => {
    snap.quests = [
      {
        questId: 'cafe_safehouse',
        status: 'active',
        objectives: {
          convince_barista: false,
          ask_albert_secrecy: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getCafeSafehouseHint('street_night')).toContain('кафе');
    expect(getCafeSafehouseHint('cafe_evening')).toContain('баристу');
  });

  it('dmitry_defection guides office meet first', () => {
    snap.quests = [
      {
        questId: 'dmitry_defection',
        status: 'active',
        objectives: {
          hear_dmitry_story: false,
          plan_escape: false,
          escort_dmitry: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getDmitryDefectionHint('volodka_room')).toContain('офис');
    expect(getDmitryDefectionHint('office_day')).toContain('Дмитрия');
  });

  it('basement_hum guides factory descent', () => {
    snap.quests = [
      {
        questId: 'basement_hum',
        status: 'active',
        objectives: {
          descend_basement: false,
          examine_zarya: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getBasementHumHint('street_night')).toContain('завод');
    expect(getBasementHumHint('abandoned_factory')).toContain('подвал');
  });

  it('zarema_rescue surfaces poem bypass cue', () => {
    snap.quests = [
      {
        questId: 'zarema_rescue',
        status: 'active',
        objectives: {
          learn_zarema_arrested: true,
          infiltrate_detention: false,
          free_zarema: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getZaremaRescueHint('street_night')).toContain('Прорыв');
  });

  it('maria_truth guides barista then confront', () => {
    snap.quests = [
      {
        questId: 'maria_truth',
        status: 'active',
        objectives: {
          find_maria_records: true,
          ask_barista_about_maria: false,
          confront_maria: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getMariaTruthHint('volodka_room')).toContain('яме');
    expect(getMariaTruthHint('cafe_evening')).toContain('баристу');
  });
});
