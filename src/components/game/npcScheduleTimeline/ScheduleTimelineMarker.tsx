import { memo } from 'react';
import { motion } from 'framer-motion';
import { MARKER_STATIC_SHADOW } from '@/engine/npcSchedule/npcScheduleConstants';
import {
  getMarkerMotionProps,
  hourToPercent,
} from '@/engine/npcSchedule/npcSchedulePresentation';

type ScheduleTimelineMarkerProps = {
  currentHour: number;
  reducedMotion: boolean;
  isTransitioning: boolean;
};

export const ScheduleTimelineMarker = memo(function ScheduleTimelineMarker({
  currentHour,
  reducedMotion,
  isTransitioning,
}: ScheduleTimelineMarkerProps) {
  const motionProps = getMarkerMotionProps(reducedMotion, isTransitioning);

  return (
    <motion.div
      className="absolute top-0 bottom-0 w-[2px] z-20"
      style={{
        left: `${hourToPercent(currentHour)}%`,
        background: 'white',
        boxShadow: MARKER_STATIC_SHADOW,
      }}
      aria-hidden="true"
      animate={motionProps.animate}
      transition={motionProps.transition}
    />
  );
});
