import { useMemo } from 'react';
import { resolveEffectiveSchedule } from '@/engine/ScheduleEngine';
import {
  buildCurrentLocationInfo,
  buildScheduleGaps,
  buildTimelineAriaLabel,
  buildTimelineSegments,
} from '@/engine/npcSchedule/npcSchedulePresentation';
import { useScheduleContext } from '@/store/selectors';

export function useNpcScheduleTimelineData(npcId: string, currentHour: number) {
  const scheduleCtx = useScheduleContext();

  return useMemo(() => {
    const entries = resolveEffectiveSchedule(npcId, scheduleCtx);
    const segments = buildTimelineSegments(entries);
    const gaps = buildScheduleGaps(entries);
    const currentLocation = buildCurrentLocationInfo(npcId, currentHour, scheduleCtx);
    const ariaLabel = buildTimelineAriaLabel(npcId, segments, gaps);

    return {
      segments,
      gaps,
      currentLocation,
      ariaLabel,
      hasSchedule: segments.length > 0,
    };
  }, [npcId, currentHour, scheduleCtx]);
}
