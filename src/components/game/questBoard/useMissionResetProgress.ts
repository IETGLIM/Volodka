import { useEffect, useState } from 'react';
import type { DailyMissionResetSchedule } from '@/data/dailyMissions';
import { getResetProgressFraction } from '@/engine/questBoard/questBoardPresentation';

const INTERVAL_MS = 60_000;

export function useMissionResetProgress(resetSchedule: DailyMissionResetSchedule): number {
  const [fraction, setFraction] = useState(() => getResetProgressFraction(resetSchedule));

  useEffect(() => {
    const tick = () => setFraction(getResetProgressFraction(resetSchedule));
    tick();
    const id = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(id);
  }, [resetSchedule]);

  return fraction;
}