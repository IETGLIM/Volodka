import { useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScheduleTimelineGap } from '@/components/game/npcScheduleTimeline/ScheduleTimelineSegment';
import { ScheduleTimelineMarker } from '@/components/game/npcScheduleTimeline/ScheduleTimelineMarker';
import { ScheduleTimelineSegment } from '@/components/game/npcScheduleTimeline/ScheduleTimelineSegment';
import { ScheduleTimelineTooltip } from '@/components/game/npcScheduleTimeline/ScheduleTimelineTooltip';
import { useNpcScheduleTimelineData } from '@/components/game/npcScheduleTimeline/useNpcScheduleTimelineData';
import { SCHEDULE_ACTIVITY_LABELS, TIMELINE_HOUR_MARKS } from '@/engine/npcSchedule/npcScheduleConstants';
import { getSegmentCenterPercent } from '@/engine/npcSchedule/npcSchedulePresentation';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';

export type NPCScheduleTimelineProps = {
  npcId: string;
  currentHour: number;
};

function NPCScheduleTimelineInner({ npcId, currentHour }: NPCScheduleTimelineProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const { phase: transitionPhase } = useTransitionDirector();
  const isTransitioning = transitionPhase === 'loading';
  const { segments, gaps, currentLocation, ariaLabel, hasSchedule } = useNpcScheduleTimelineData(
    npcId,
    currentHour,
  );
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);

  const handleSegmentHover = useCallback((index: number) => {
    setHoveredSegment(index);
  }, []);

  const handleSegmentLeave = useCallback(() => {
    setHoveredSegment(null);
  }, []);

  if (!hasSchedule) return null;

  const activeSegment = hoveredSegment !== null ? segments[hoveredSegment] : null;

  return (
    <div
      className={`mt-2 ${isTransitioning ? 'opacity-60 pointer-events-none' : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      <div className="flex justify-between mb-0.5 px-px" aria-hidden="true">
        {TIMELINE_HOUR_MARKS.map((hour) => (
          <span
            key={hour}
            className="text-[7px] font-mono text-slate-600"
            style={{
              width: '14px',
              textAlign: hour === 0 ? 'left' : hour === 24 ? 'right' : 'center',
            }}
          >
            {hour}
          </span>
        ))}
      </div>

      <div className="relative h-4 rounded-sm overflow-visible bg-slate-900/60 border border-slate-700/30">
        <div className="absolute inset-0 rounded-sm overflow-hidden">
          {gaps.map((gap) => (
            <ScheduleTimelineGap key={`gap-${gap.startHour}-${gap.endHour}`} gap={gap} />
          ))}

          {segments.map((segment, index) => (
            <ScheduleTimelineSegment
              key={`${segment.startHour}-${segment.sceneId}`}
              segment={segment}
              index={index}
              totalSegments={segments.length}
              isHovered={hoveredSegment === index}
              onHover={handleSegmentHover}
              onLeave={handleSegmentLeave}
            />
          ))}

          <ScheduleTimelineMarker
            currentHour={currentHour}
            reducedMotion={reducedMotion}
            isTransitioning={isTransitioning}
          />
        </div>

        <AnimatePresence>
          {activeSegment && (
            <ScheduleTimelineTooltip
              segment={activeSegment}
              centerPercent={getSegmentCenterPercent(activeSegment)}
              reducedMotion={reducedMotion}
            />
          )}
        </AnimatePresence>
      </div>

      {currentLocation && (
        <div className="flex items-center gap-1.5 mt-1">
          <Clock className="size-2.5" style={{ color: currentLocation.color.text }} aria-hidden="true" />
          <span className="text-[9px] font-medium" style={{ color: currentLocation.color.text }}>
            {currentLocation.sceneName}
          </span>
          <span className="text-[8px] text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="text-[8px] text-slate-500">
            {SCHEDULE_ACTIVITY_LABELS[currentLocation.activity]}
          </span>
        </div>
      )}
    </div>
  );
}

export function NPCScheduleTimeline(props: NPCScheduleTimelineProps) {
  return (
    <ErrorBoundary name="NPCScheduleTimeline" fallback={null}>
      <NPCScheduleTimelineInner {...props} />
    </ErrorBoundary>
  );
}
