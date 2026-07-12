import { memo, useCallback } from 'react';
import {
  getGapSegmentStyle,
  getSegmentBorderRadius,
  getSegmentLayout,
  type GapSegment,
  type TimelineSegment,
} from '@/engine/npcSchedule/npcSchedulePresentation';
import { NPC_SCHEDULE_LABELS, SCHEDULE_ACTIVITY_LABELS } from '@/engine/npcSchedule/npcScheduleConstants';

type ScheduleTimelineGapProps = {
  gap: GapSegment;
};

export const ScheduleTimelineGap = memo(function ScheduleTimelineGap({ gap }: ScheduleTimelineGapProps) {
  const layout = getSegmentLayout(gap.startHour, gap.endHour);
  const style = getGapSegmentStyle();

  return (
    <div
      className="absolute top-0 bottom-0"
      style={{
        left: `${layout.leftPercent}%`,
        width: `${layout.widthPercent}%`,
        background: style.bg,
        borderRight: `1px solid ${style.border}`,
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
});

type ScheduleTimelineSegmentProps = {
  segment: TimelineSegment;
  index: number;
  totalSegments: number;
  isHovered: boolean;
  onHover: (index: number) => void;
  onLeave: () => void;
};

export const ScheduleTimelineSegment = memo(function ScheduleTimelineSegment({
  segment,
  index,
  totalSegments,
  isHovered,
  onHover,
  onLeave,
}: ScheduleTimelineSegmentProps) {
  const layout = getSegmentLayout(segment.startHour, segment.endHour);
  const activityLabel = SCHEDULE_ACTIVITY_LABELS[segment.activity];
  const segmentLabel = NPC_SCHEDULE_LABELS.segmentAria(
    segment.sceneName,
    segment.startHour,
    segment.endHour,
    activityLabel,
  );

  const handleFocus = useCallback(() => {
    onHover(index);
  }, [index, onHover]);

  const handleMouseEnter = useCallback(() => {
    onHover(index);
  }, [index, onHover]);

  return (
    <div
      className="absolute top-0 bottom-0 cursor-pointer transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cyan-400/70"
      style={{
        left: `${layout.leftPercent}%`,
        width: `${layout.widthPercent}%`,
        background: isHovered ? segment.color.border : segment.color.bg,
        boxShadow: isHovered ? `0 0 8px ${segment.color.glow}, inset 0 0 4px ${segment.color.glow}` : 'none',
        borderRight: '1px solid rgba(0,0,0,0.3)',
        borderRadius: getSegmentBorderRadius(index, totalSegments),
        zIndex: isHovered ? 10 : 1,
      }}
      tabIndex={0}
      role="button"
      aria-label={segmentLabel}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onBlur={onLeave}
      onMouseLeave={onLeave}
    />
  );
});
