import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getEchoOfVladimirHint,
  getFinalCodeHint,
  getMachineConfessionHint,
  getNightBeforeDawnHint,
} from './act5QuestHints';

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

describe('act5QuestHints', () => {
  beforeEach(() => {
    snap.quests = [];
  });

  it('final_code guides rally then core', () => {
    snap.quests = [{
      questId: 'final_code',
      status: 'active',
      objectives: {},
      startedAtTime: 0,
    }];
    expect(getFinalCodeHint('street_night')).toMatch(/союзник/i);

    snap.quests[0].objectives = {
      rally_allies: true,
      write_freedom_virus: true,
    };
    expect(getFinalCodeHint('street_night')).toMatch(/ядро|офис/i);
    expect(getFinalCodeHint('office_day')).toMatch(/сервер|ядру/i);
  });

  it('machine_confession points to factory', () => {
    snap.quests = [{
      questId: 'machine_confession',
      status: 'active',
      objectives: {},
      startedAtTime: 0,
    }];
    expect(getMachineConfessionHint('street_night')).toMatch(/завод/i);
    expect(getMachineConfessionHint('abandoned_factory')).toMatch(/Зарю/i);
  });

  it('echo_of_vladimir guides kate / library', () => {
    snap.quests = [{
      questId: 'echo_of_vladimir',
      status: 'active',
      objectives: {},
      startedAtTime: 0,
    }];
    expect(getEchoOfVladimirHint('street_night')).toMatch(/Катя|библиотек/i);
  });

  it('night_before_dawn walks ally confirmations', () => {
    snap.quests = [{
      questId: 'night_before_dawn',
      status: 'active',
      objectives: { talk_albert_final: true },
      startedAtTime: 0,
    }];
    expect(getNightBeforeDawnHint('street_night')).toMatch(/Зарем/i);
  });

  it('returns null when quest inactive', () => {
    expect(getFinalCodeHint('office_day')).toBeNull();
  });
});
