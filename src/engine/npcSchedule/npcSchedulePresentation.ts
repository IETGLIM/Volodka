import { SCENE_CONFIG } from '@/config/scenes';
import {
  GAP_SEGMENT_STYLE,
  HOURS_PER_DAY,
  LOCATION_COLOR_STYLES,
  MARKER_PULSE_SHADOW,
  NPC_SCHEDULE_LABELS,
  SCHEDULE_ACTIVITY_LABELS,
  type LocationColorStyle,
} from '@/engine/npcSchedule/npcScheduleConstants';
import { getNPCLocationForTime } from '@/engine/ScheduleEngine';
import type { ScheduleContext } from '@/shared/scheduleContext';
import type { ScheduleEntry, SceneId } from '@/shared/types/game';
import type { LocationCategory } from '@/shared/types/locationCategory';

export type TimelineSegment = {
  startHour: number;
  endHour: number;
  sceneId: SceneId;
  category: LocationCategory;
  sceneName: string;
  activity: ScheduleEntry['activity'];
  color: LocationColorStyle;
};

export type GapSegment = {
  startHour: number;
  endHour: number;
};

export type CurrentLocationInfo = {
  sceneName: string;
  activity: ScheduleEntry['activity'];
  category: LocationCategory;
  color: LocationColorStyle;
};

export type SceneScheduleLookup = {
  getSceneName: (sceneId: SceneId) => string;
  getLocationCategory: (sceneId: SceneId) => LocationCategory;
};

export const defaultSceneScheduleLookup: SceneScheduleLookup = {
  getSceneName: (sceneId) => SCENE_CONFIG[sceneId]?.name ?? sceneId,
  getLocationCategory: (sceneId) => SCENE_CONFIG[sceneId]?.locationCategory ?? 'unknown',
};

export function hourToPercent(hour: number, totalHours = HOURS_PER_DAY): number {
  return ((hour % totalHours) / totalHours) * 100;
}

export function getSegmentLayout(
  startHour: number,
  endHour: number,
  totalHours = HOURS_PER_DAY,
): { leftPercent: number; widthPercent: number } {
  return {
    leftPercent: (startHour / totalHours) * 100,
    widthPercent: ((endHour - startHour) / totalHours) * 100,
  };
}

export function getSegmentBorderRadius(
  index: number,
  totalSegments: number,
): string {
  if (index === 0) return '2px 0 0 2px';
  if (index === totalSegments - 1) return '0 2px 2px 0';
  return '0';
}

export function buildTimelineSegments(
  entries: readonly ScheduleEntry[],
  lookup: SceneScheduleLookup = defaultSceneScheduleLookup,
): TimelineSegment[] {
  return entries.map((entry) => {
    const category = lookup.getLocationCategory(entry.sceneId);
    return {
      startHour: entry.startHour,
      endHour: entry.endHour,
      sceneId: entry.sceneId,
      category,
      sceneName: lookup.getSceneName(entry.sceneId),
      activity: entry.activity,
      color: LOCATION_COLOR_STYLES[category],
    };
  });
}

/** Uncovered hours in a 24h day — rendered as neutral gap segments. */
export function buildScheduleGaps(
  entries: readonly ScheduleEntry[],
  totalHours = HOURS_PER_DAY,
): GapSegment[] {
  if (entries.length === 0) {
    return [{ startHour: 0, endHour: totalHours }];
  }

  const sorted = [...entries].sort((a, b) => a.startHour - b.startHour);
  const gaps: GapSegment[] = [];
  let cursor = 0;

  for (const entry of sorted) {
    if (entry.startHour > cursor) {
      gaps.push({ startHour: cursor, endHour: entry.startHour });
    }
    cursor = Math.max(cursor, entry.endHour);
  }

  if (cursor < totalHours) {
    gaps.push({ startHour: cursor, endHour: totalHours });
  }

  return gaps;
}

export function buildCurrentLocationInfo(
  npcId: string,
  currentHour: number,
  ctx: ScheduleContext,
  lookup: SceneScheduleLookup = defaultSceneScheduleLookup,
): CurrentLocationInfo | null {
  const entry = getNPCLocationForTime(npcId, currentHour, ctx);
  if (!entry) return null;

  const category = lookup.getLocationCategory(entry.sceneId);
  return {
    sceneName: lookup.getSceneName(entry.sceneId),
    activity: entry.activity,
    category,
    color: LOCATION_COLOR_STYLES[category],
  };
}

export function formatSegmentSummary(segment: TimelineSegment): string {
  const activity = SCHEDULE_ACTIVITY_LABELS[segment.activity];
  return NPC_SCHEDULE_LABELS.segmentAria(
    segment.sceneName,
    segment.startHour,
    segment.endHour,
    activity,
  );
}

export function buildTimelineAriaLabel(
  npcId: string,
  segments: readonly TimelineSegment[],
  gaps: readonly GapSegment[],
): string {
  const parts: string[] = [];

  for (const segment of segments) {
    parts.push(formatSegmentSummary(segment));
  }

  for (const gap of gaps) {
    parts.push(NPC_SCHEDULE_LABELS.gapAria(gap.startHour, gap.endHour));
  }

  return NPC_SCHEDULE_LABELS.timelineAria(npcId, parts.join('; '));
}

export function getMarkerMotionProps(reducedMotion: boolean, isTransitioning: boolean): {
  animate: { opacity: number[]; boxShadow: string[] } | undefined;
  transition: { duration: number; repeat?: number; ease?: 'easeInOut' };
} {
  if (reducedMotion || isTransitioning) {
    return {
      animate: undefined,
      transition: { duration: 0 },
    };
  }

  return {
    animate: {
      opacity: [1, 0.5, 1],
      boxShadow: MARKER_PULSE_SHADOW,
    },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  };
}

export function getGapSegmentStyle() {
  return GAP_SEGMENT_STYLE;
}

export function getTooltipTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.12 };
}

export function getSegmentCenterPercent(segment: TimelineSegment): number {
  const midHour = (segment.startHour + segment.endHour) / 2;
  return hourToPercent(midHour);
}
