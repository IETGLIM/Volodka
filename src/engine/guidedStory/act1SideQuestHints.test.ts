import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getAlbertsLessonHint,
  getCafeBackroomEchoHint,
  getCorridorLetterHint,
  getMorningRitualHint,
  getMorningSyncHint,
  getNightShiftMysteryHint,
  getZaremaRadioHint,
} from './act1SideQuestHints';

const quests: { questId: string; status: string; objectives: Record<string, boolean> }[] = [];

vi.mock('@/engine/GameActionDispatcher', () => ({
  getGameSnapshot: () => ({ quests }),
}));

describe('act1SideQuestHints', () => {
  beforeEach(() => {
    quests.length = 0;
  });

  it('night_shift_mystery — office first', () => {
    quests.push({ questId: 'night_shift_mystery', status: 'active', objectives: {} });
    expect(getNightShiftMysteryHint('volodka_room')).toContain('офис');
  });

  it('alberts_lesson — cafe', () => {
    quests.push({ questId: 'alberts_lesson', status: 'active', objectives: {} });
    expect(getAlbertsLessonHint('street_night')).toContain('яме');
  });

  it('corridor_letter — corridor mailboxes', () => {
    quests.push({ questId: 'corridor_letter', status: 'active', objectives: {} });
    expect(getCorridorLetterHint('volodka_room')).toContain('коридор');
  });

  it('zarema_radio — home', () => {
    quests.push({ questId: 'zarema_radio', status: 'active', objectives: {} });
    expect(getZaremaRadioHint('street_night')).toContain('Зарема');
  });

  it('morning_ritual — room terminal', () => {
    quests.push({ questId: 'morning_ritual', status: 'active', objectives: {} });
    expect(getMorningRitualHint('street_night')).toContain('комнат');
  });

  it('cafe_backroom_echo — cafe', () => {
    quests.push({ questId: 'cafe_backroom_echo', status: 'active', objectives: {} });
    expect(getCafeBackroomEchoHint('street_night')).toContain('кафе');
  });

  it('morning_sync — terminal', () => {
    quests.push({ questId: 'morning_sync', status: 'active', objectives: {} });
    expect(getMorningSyncHint('street_night')).toContain('терминал');
  });

  it('returns null when quest inactive', () => {
    expect(getNightShiftMysteryHint('office_day')).toBeNull();
  });
});
