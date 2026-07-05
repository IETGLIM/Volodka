import { describe, expect, it } from 'vitest';
import {
  buildCurrentLocationInfo,
  buildScheduleGaps,
  buildTimelineAriaLabel,
  buildTimelineSegments,
  getSegmentLayout,
  hourToPercent,
} from '@/engine/npcSchedule/npcSchedulePresentation';
import type { ScheduleEntry } from '@/shared/types/game';
import type { LocationCategory } from '@/shared/types/locationCategory';

const lookup = {
  getSceneName: (id: string) => `Scene:${id}`,
  getLocationCategory: (id: string): LocationCategory => {
    if (id === 'cafe_evening') return 'cafe';
    if (id === 'office_day') return 'office';
    return 'unknown';
  },
};

const sampleEntries: ScheduleEntry[] = [
  { startHour: 0, endHour: 8, sceneId: 'office_day', position: [0, 0, 0], activity: 'work' },
  { startHour: 9, endHour: 12, sceneId: 'cafe_evening', position: [0, 0, 0], activity: 'rest' },
];

describe('npcSchedulePresentation', () => {
  it('buildTimelineSegments uses explicit location categories from lookup', () => {
    const segments = buildTimelineSegments(sampleEntries, lookup);
    expect(segments).toHaveLength(2);
    expect(segments[0]?.category).toBe('office');
    expect(segments[1]?.category).toBe('cafe');
    expect(segments[0]?.sceneName).toBe('Scene:office_day');
  });

  it('buildScheduleGaps finds uncovered hours', () => {
    const gaps = buildScheduleGaps(sampleEntries);
    expect(gaps).toEqual([
      { startHour: 8, endHour: 9 },
      { startHour: 12, endHour: 24 },
    ]);
  });

  it('buildScheduleGaps covers full day when schedule is empty', () => {
    expect(buildScheduleGaps([])).toEqual([{ startHour: 0, endHour: 24 }]);
  });

  it('hourToPercent and getSegmentLayout map hours to bar geometry', () => {
    expect(hourToPercent(12)).toBe(50);
    expect(getSegmentLayout(6, 12)).toEqual({ leftPercent: 25, widthPercent: 25 });
  });

  it('buildTimelineAriaLabel includes segment and gap summaries', () => {
    const segments = buildTimelineSegments(sampleEntries, lookup);
    const gaps = buildScheduleGaps(sampleEntries);
    const label = buildTimelineAriaLabel('albert', segments, gaps);
    expect(label).toContain('albert');
    expect(label).toContain('Scene:office_day');
    expect(label).toContain('08:00–09:00');
  });

  it('buildCurrentLocationInfo resolves active entry', () => {
    const ctx = {
      currentAct: 1,
      completedQuestIds: new Set<string>(),
      activeFlagKeys: new Set<string>(),
      playerFlags: {},
    };

    const info = buildCurrentLocationInfo('albert', 10, ctx);
    expect(info?.sceneName).toBeTruthy();
    expect(info?.activity).toBeTruthy();
  });
});
