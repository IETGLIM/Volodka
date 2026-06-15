import { describe, expect, it, vi } from 'vitest';
import {
  canAcceptMoreMissions,
  computeObjectiveProgressPercent,
  countActiveMissions,
  formatResetTimeLeft,
  getMissionCardVisualState,
  getResetTargetDate,
  partitionMissions,
  safeMissionAction,
  tryAbandonDailyMission,
  tryAcceptDailyMission,
  tryClaimDailyMission,
  wasMissionAccepted,
  wasMissionClaimed,
} from '@/engine/questBoard/questBoardPresentation';
import { QUEST_BOARD_LABELS } from '@/engine/questBoard/questBoardConstants';
import type { DailyMission } from '@/data/dailyMissions';

const sampleMission: DailyMission = {
  id: 'm1',
  title: 'Test',
  description: 'Desc',
  category: 'combat',
  difficulty: 'easy',
  objectives: [{ id: 'o1', description: 'Do thing', target: 3 }],
  rewards: { xp: 10, credits: 5 },
  resetSchedule: 'daily',
  minLevel: 1,
  icon: 'Shield',
};

describe('questBoardPresentation', () => {
  it('partitions active and available missions', () => {
    const result = partitionMissions(
      [sampleMission, { ...sampleMission, id: 'm2', title: 'Two' }],
      [{ missionId: 'm1', acceptedAt: 0, progress: {}, completed: false, claimed: false }],
    );
    expect(result.activeMissions).toHaveLength(1);
    expect(result.availableMissions).toHaveLength(1);
  });

  it('counts active missions', () => {
    expect(
      countActiveMissions([
        { missionId: 'a', acceptedAt: 0, progress: {}, completed: false, claimed: false },
        { missionId: 'b', acceptedAt: 0, progress: {}, completed: true, claimed: false },
      ]),
    ).toBe(1);
  });

  it('formats reset timer and progress', () => {
    expect(formatResetTimeLeft('daily')).toMatch(/ч|Скоро/);
    expect(computeObjectiveProgressPercent(1, 2)).toBe(50);
    expect(QUEST_BOARD_LABELS.headerActiveBadge(2)).toBe('2 активных');
    expect(QUEST_BOARD_LABELS.resetTimer('5ч 10м')).toContain('5ч');
  });

  it('maps mission card visual states', () => {
    expect(getMissionCardVisualState(false, false, false, '#fff').opacity).toBe(1);
    expect(getMissionCardVisualState(true, true, false, '#fff').borderColor).toContain('185,129');
    expect(getMissionCardVisualState(true, true, true, '#fff').opacity).toBe(0.5);
  });

  it('computes reset target midnight', () => {
    const now = new Date('2026-06-15T12:00:00');
    const target = getResetTargetDate('daily', now);
    expect(target.getHours()).toBe(0);
    expect(target.getDate()).toBe(16);
  });

  it('detects accepted and claimed missions', () => {
    const entries = [
      { missionId: 'a', acceptedAt: 0, progress: {}, completed: true, claimed: true },
    ];
    expect(wasMissionAccepted('a', entries)).toBe(true);
    expect(wasMissionClaimed('a', entries)).toBe(true);
    expect(wasMissionAccepted('b', entries)).toBe(false);
  });

  it('wraps mission actions safely', () => {
    expect(safeMissionAction(() => undefined)).toBe(true);
    expect(
      safeMissionAction(() => {
        throw new Error('fail');
      }),
    ).toBe(false);
  });

  it('checks accept slot availability', () => {
    expect(canAcceptMoreMissions(0, 3)).toBe(true);
    expect(canAcceptMoreMissions(2, 3)).toBe(true);
    expect(canAcceptMoreMissions(3, 3)).toBe(false);
  });

  it('tryAcceptDailyMission reads fresh store state', () => {
    const accept = vi.fn();
    const getAccepted = vi
      .fn()
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        { missionId: 'm1', acceptedAt: 0, progress: {}, completed: false, claimed: false },
      ]);

    expect(tryAcceptDailyMission(accept, 'm1', getAccepted)).toBe(true);
    expect(accept).toHaveBeenCalledOnce();
  });

  it('tryClaimDailyMission reads fresh store state', () => {
    const claim = vi.fn();
    const getAccepted = vi
      .fn()
      .mockReturnValueOnce([
        { missionId: 'm1', acceptedAt: 0, progress: {}, completed: true, claimed: false },
      ])
      .mockReturnValueOnce([
        { missionId: 'm1', acceptedAt: 0, progress: {}, completed: true, claimed: true },
      ]);

    expect(tryClaimDailyMission(claim, 'm1', getAccepted)).toBe(true);
    expect(claim).toHaveBeenCalledOnce();
  });

  it('tryAbandonDailyMission reads fresh store state', () => {
    const abandon = vi.fn();
    const getAccepted = vi
      .fn()
      .mockReturnValueOnce([
        { missionId: 'm1', acceptedAt: 0, progress: {}, completed: false, claimed: false },
      ])
      .mockReturnValueOnce([]);

    expect(tryAbandonDailyMission(abandon, 'm1', getAccepted)).toBe(true);
    expect(abandon).toHaveBeenCalledOnce();
  });
});
