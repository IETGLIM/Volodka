import { useEffect, useState } from 'react';
import type { DailyMissionResetSchedule } from '@/data/dailyMissions';
import {
  formatResetTimeLeft,
  getResetTargetDate,
} from '@/engine/questBoard/questBoardPresentation';

const RESET_TIMER_SLOW_MS = 60_000;
const RESET_TIMER_FAST_MS = 1_000;
const RESET_TIMER_FAST_THRESHOLD_MS = 5 * 60_000;

function getResetTimerIntervalMs(resetSchedule: DailyMissionResetSchedule, now = new Date()): number {
  const diff = getResetTargetDate(resetSchedule, now).getTime() - now.getTime();
  if (diff > 0 && diff <= RESET_TIMER_FAST_THRESHOLD_MS) {
    return RESET_TIMER_FAST_MS;
  }
  return RESET_TIMER_SLOW_MS;
}

export function useMissionResetTimer(resetSchedule: DailyMissionResetSchedule): string {
  const [timeLeft, setTimeLeft] = useState(() => formatResetTimeLeft(resetSchedule));

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setTimeLeft(formatResetTimeLeft(resetSchedule));
      const nextInterval = getResetTimerIntervalMs(resetSchedule);
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(tick, nextInterval);
    };

    tick();
    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [resetSchedule]);

  return timeLeft;
}
