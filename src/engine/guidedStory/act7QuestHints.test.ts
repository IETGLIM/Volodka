import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getEpilogueLettersHint,
  getEpilogueMonumentHint,
  getFinalPoemHint,
  getRebuildTheGuildHint,
  getSystemTakedownHint,
  getVolodkaLegacyHint,
} from './act7QuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('act7QuestHints', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('rebuild_the_guild — cafe first', () => {
    quests.push({ questId: 'rebuild_the_guild', status: 'active', objectives: {} });
    expect(getRebuildTheGuildHint('street_night')).toContain('Кафе');
    expect(getRebuildTheGuildHint('cafe_evening')).toContain('Уцелевшие');
  });

  it('system_takedown — assemble team', () => {
    quests.push({ questId: 'system_takedown', status: 'active', objectives: {} });
    expect(getSystemTakedownHint('volodka_room')).toContain('Максим');
  });

  it('final_poem — park inspiration', () => {
    quests.push({ questId: 'final_poem', status: 'active', objectives: {} });
    expect(getFinalPoemHint('street_night')).toContain('Парк');
  });

  it('volodka_legacy — return to room', () => {
    quests.push({ questId: 'volodka_legacy', status: 'active', objectives: {} });
    expect(getVolodkaLegacyHint('street_night')).toContain('комнат');
  });

  it('epilogue_letters — room', () => {
    quests.push({ questId: 'epilogue_letters', status: 'active', objectives: {} });
    expect(getEpilogueLettersHint('park_day')).toContain('комнат');
  });

  it('epilogue_monument — park', () => {
    quests.push({ questId: 'epilogue_monument', status: 'active', objectives: {} });
    expect(getEpilogueMonumentHint('volodka_room')).toContain('Парк');
  });

  it('returns null when quest inactive', () => {
    expect(getRebuildTheGuildHint('cafe_evening')).toBeNull();
  });
});
