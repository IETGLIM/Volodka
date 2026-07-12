import { memo } from 'react';
import { motion } from 'framer-motion';
import { formatHourRange, SCHEDULE_ACTIVITY_LABELS } from '@/engine/npcSchedule/npcScheduleConstants';
import {
  getTooltipTransition,
  type TimelineSegment,
} from '@/engine/npcSchedule/npcSchedulePresentation';

type ScheduleTimelineTooltipProps = {
  segment: TimelineSegment;
  centerPercent: number;
  reducedMotion: boolean;
};

export const ScheduleTimelineTooltip = memo(function ScheduleTimelineTooltip({
  segment,
  centerPercent,
  reducedMotion,
}: ScheduleTimelineTooltipProps) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 4, scale: 0.95 }}
      transition={getTooltipTransition(reducedMotion)}
      className="absolute bottom-full mb-1 z-30 pointer-events-none -translate-x-1/2"
      style={{ left: `${centerPercent}%` }}
      role="tooltip"
    >
      <div
        className="px-2.5 py-1.5 rounded-md text-[10px] whitespace-nowrap"
        style={{
          background: 'rgba(10,14,30,0.95)',
          border: `1px solid ${segment.color.border}`,
          boxShadow: `0 0 12px ${segment.color.glow}, 0 4px 12px rgba(0,0,0,0.5)`,
        }}
      >
        <div className="font-medium" style={{ color: segment.color.text }}>
          {segment.sceneName}
        </div>
        <div className="text-slate-400 mt-0.5">
          {formatHourRange(segment.startHour, segment.endHour)} ·{' '}
          {SCHEDULE_ACTIVITY_LABELS[segment.activity]}
        </div>
      </div>
    </motion.div>
  );
});
