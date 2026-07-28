import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getIncidentScrollHint,
  getMariaConnectionHint,
  getPoetryCollectionHint,
} from './act1QuestHints';

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

vi.mock('@/data/quests', () => ({
  QUEST_DEFINITIONS: [
    {
      id: 'poetry_collection',
      objectives: [
        { id: 'collect_poem_1', description: 'Стихотворение I — Рабочий стол' },
        { id: 'collect_poem_2', description: 'Стихотворение II — Книжная полка' },
      ],
    },
  ],
}));

describe('act1QuestHints', () => {
  beforeEach(() => {
    snap.quests = [];
  });

  it('maria_connection guides street meet first', () => {
    snap.quests = [
      {
        questId: 'maria_connection',
        status: 'active',
        objectives: {
          meet_maria: false,
          accept_chip: false,
          read_maria_poem: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getMariaConnectionHint()).toContain('улицу');
  });

  it('incident_scroll adapts to office presence', () => {
    snap.quests = [
      {
        questId: 'incident_scroll_4729',
        status: 'active',
        objectives: {
          visit_office: false,
          talk_alexander: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getIncidentScrollHint('street_night')).toContain('офис');
    expect(getIncidentScrollHint('office_day')).toContain('Александра');
  });

  it('poetry_collection surfaces next poem location', () => {
    snap.quests = [
      {
        questId: 'poetry_collection',
        status: 'active',
        objectives: {
          collect_poem_1: true,
          collect_poem_2: false,
        },
        startedAtTime: 0,
      },
    ];
    expect(getPoetryCollectionHint()).toBe('Следующий стих: Книжная полка');
  });
});
