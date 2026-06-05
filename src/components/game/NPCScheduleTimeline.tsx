
/* ─── Volodka RPG – NPC Schedule Timeline Visual ───
   Compact 24-hour timeline bar showing where each NPC is throughout the day.
   Color-coded by location type, with current-time indicator and hover tooltips.
   Cyberpunk aesthetic matching the rest of the game UI.
*/

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { NPC_SCHEDULES_MAP } from '@/data/npcSchedules';
import { getNPCLocationForTime } from '@/engine/ScheduleEngine';
import { useGameStore } from '@/store/gameStore';
import { selectScheduleContext } from '@/shared/scheduleContext';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId, ScheduleEntry } from '@/shared/types/game';

/* ─── Location type classification based on sceneId patterns ─── */

type LocationCategory = 'home' | 'cafe' | 'office' | 'park' | 'library' | 'street' | 'factory' | 'rooftop' | 'corridor' | 'unknown';

function classifyScene(sceneId: SceneId): LocationCategory {
  if (sceneId.includes('room') || sceneId.includes('home')) return 'home';
  if (sceneId.includes('cafe')) return 'cafe';
  if (sceneId.includes('office')) return 'office';
  if (sceneId.includes('park')) return 'park';
  if (sceneId.includes('library')) return 'library';
  if (sceneId.includes('street')) return 'street';
  if (sceneId.includes('factory')) return 'factory';
  if (sceneId.includes('rooftop')) return 'rooftop';
  if (sceneId.includes('corridor')) return 'corridor';
  return 'unknown';
}

/* ─── Color map for location categories ─── */

const LOCATION_COLORS: Record<LocationCategory, { bg: string; border: string; text: string; glow: string }> = {
  home: {
    bg: 'rgba(100,116,139,0.65)',
    border: 'rgba(100,116,139,0.8)',
    text: '#94a3b8',
    glow: 'rgba(100,116,139,0.3)',
  },
  cafe: {
    bg: 'rgba(245,158,11,0.55)',
    border: 'rgba(245,158,11,0.7)',
    text: '#fbbf24',
    glow: 'rgba(245,158,11,0.25)',
  },
  office: {
    bg: 'rgba(16,185,129,0.55)',
    border: 'rgba(16,185,129,0.7)',
    text: '#34d399',
    glow: 'rgba(16,185,129,0.25)',
  },
  park: {
    bg: 'rgba(132,204,22,0.55)',
    border: 'rgba(132,204,22,0.7)',
    text: '#a3e635',
    glow: 'rgba(132,204,22,0.25)',
  },
  library: {
    bg: 'rgba(139,92,246,0.55)',
    border: 'rgba(139,92,246,0.7)',
    text: '#a78bfa',
    glow: 'rgba(139,92,246,0.25)',
  },
  street: {
    bg: 'rgba(34,211,238,0.45)',
    border: 'rgba(34,211,238,0.65)',
    text: '#22d3ee',
    glow: 'rgba(34,211,238,0.25)',
  },
  factory: {
    bg: 'rgba(244,63,94,0.55)',
    border: 'rgba(244,63,94,0.7)',
    text: '#fb7185',
    glow: 'rgba(244,63,94,0.25)',
  },
  rooftop: {
    bg: 'rgba(56,189,248,0.55)',
    border: 'rgba(56,189,248,0.7)',
    text: '#38bdf8',
    glow: 'rgba(56,189,248,0.25)',
  },
  corridor: {
    bg: 'rgba(100,116,139,0.5)',
    border: 'rgba(100,116,139,0.65)',
    text: '#94a3b8',
    glow: 'rgba(100,116,139,0.2)',
  },
  unknown: {
    bg: 'rgba(71,85,105,0.5)',
    border: 'rgba(71,85,105,0.65)',
    text: '#94a3b8',
    glow: 'rgba(71,85,105,0.2)',
  },
};

/* ─── Activity labels in Russian ─── */

const ACTIVITY_LABELS: Record<ScheduleEntry['activity'], string> = {
  sleep: 'Спит',
  work: 'Работает',
  read: 'Читает',
  rest: 'Отдыхает',
  walk: 'Гуляет',
  talk: 'Общается',
};

/* ─── Timeline segment type ─── */

interface TimelineSegment {
  startHour: number;
  endHour: number;
  sceneId: SceneId;
  category: LocationCategory;
  sceneName: string;
  activity: ScheduleEntry['activity'];
  color: typeof LOCATION_COLORS[LocationCategory];
}

/* ─── Tooltip component ─── */

function ScheduleTooltip({
  segment,
  position,
}: {
  segment: TimelineSegment;
  position: { left: number; top: number };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[100] pointer-events-none"
      style={{
        left: position.left,
        top: position.top,
        transform: 'translate(-50%, -100%)',
      }}
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
          {String(segment.startHour).padStart(2, '0')}:00–{String(segment.endHour).padStart(2, '0')}:00 · {ACTIVITY_LABELS[segment.activity]}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NPCScheduleTimeline — the main timeline visual component
   ══════════════════════════════════════════════════════════════ */

export function NPCScheduleTimeline({
  npcId,
  currentHour,
}: {
  npcId: string;
  currentHour: number;
}) {
  const scheduleCtx = useGameStore(selectScheduleContext);
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // Build timeline segments from the NPC's schedule
  const segments = useMemo(() => {
    const schedule = NPC_SCHEDULES_MAP[npcId];
    if (!schedule) return [];

    return schedule.entries.map((entry): TimelineSegment => {
      const category = classifyScene(entry.sceneId);
      const sceneName = SCENE_CONFIG[entry.sceneId]?.name ?? entry.sceneId;
      return {
        startHour: entry.startHour,
        endHour: entry.endHour,
        sceneId: entry.sceneId,
        category,
        sceneName,
        activity: entry.activity,
        color: LOCATION_COLORS[category],
      };
    });
  }, [npcId]);

  // Current NPC location info
  const currentLocation = useMemo(() => {
    const entry = getNPCLocationForTime(npcId, currentHour, scheduleCtx);
    if (!entry) return null;
    const category = classifyScene(entry.sceneId);
    const sceneName = SCENE_CONFIG[entry.sceneId]?.name ?? entry.sceneId;
    return {
      sceneName,
      activity: entry.activity,
      category,
      color: LOCATION_COLORS[category],
    };
  }, [npcId, currentHour, scheduleCtx]);

  // Handle segment hover for tooltip
  const handleSegmentHover = useCallback(
    (idx: number, e: React.MouseEvent) => {
      setHoveredSegment(idx);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltipPos({
        left: rect.left + rect.width / 2,
        top: rect.top - 4,
      });
    },
    [],
  );

  const handleSegmentLeave = useCallback(() => {
    setHoveredSegment(null);
  }, []);

  if (segments.length === 0) return null;

  const HOURS_TOTAL = 24;
  const hourPercent = (h: number) => `${(h / HOURS_TOTAL) * 100}%`;
  const currentHourPercent = ((currentHour % 24) / HOURS_TOTAL) * 100;

  return (
    <div className="mt-2">
      {/* Hour labels row */}
      <div className="flex justify-between mb-0.5 px-px">
        {([0, 6, 12, 18, 24] as const).map((h) => (
          <span
            key={h}
            className="text-[7px] font-mono text-slate-600"
            style={{ width: '14px', textAlign: h === 0 ? 'left' : h === 24 ? 'right' : 'center' }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative h-4 rounded-sm overflow-hidden bg-slate-900/60 border border-slate-700/30">
        {/* Segments */}
        {segments.map((seg, idx) => {
          const left = (seg.startHour / HOURS_TOTAL) * 100;
          const width = ((seg.endHour - seg.startHour) / HOURS_TOTAL) * 100;
          const isHovered = hoveredSegment === idx;

          return (
            <div
              key={`${seg.startHour}-${seg.sceneId}`}
              className="absolute top-0 bottom-0 cursor-pointer transition-all duration-150"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: isHovered ? seg.color.border : seg.color.bg,
                boxShadow: isHovered ? `0 0 8px ${seg.color.glow}, inset 0 0 4px ${seg.color.glow}` : 'none',
                borderRight: `1px solid rgba(0,0,0,0.3)`,
                borderRadius: idx === 0 ? '2px 0 0 2px' : idx === segments.length - 1 ? '0 2px 2px 0' : '0',
                zIndex: isHovered ? 10 : 1,
              }}
              onMouseEnter={(e) => handleSegmentHover(idx, e)}
              onMouseMove={(e) => handleSegmentHover(idx, e)}
              onMouseLeave={handleSegmentLeave}
            />
          );
        })}

        {/* Current hour marker */}
        <motion.div
          className="absolute top-0 bottom-0 w-[2px] z-20"
          style={{
            left: `${currentHourPercent}%`,
            background: 'white',
            boxShadow: '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)',
          }}
          animate={{
            opacity: [1, 0.5, 1],
            boxShadow: [
              '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)',
              '0 0 10px rgba(255,255,255,1), 0 0 20px rgba(255,255,255,0.6)',
              '0 0 6px rgba(255,255,255,0.8), 0 0 12px rgba(255,255,255,0.4)',
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Current location text */}
      {currentLocation && (
        <div className="flex items-center gap-1.5 mt-1">
          <Clock className="size-2.5" style={{ color: currentLocation.color.text }} />
          <span className="text-[9px] font-medium" style={{ color: currentLocation.color.text }}>
            {currentLocation.sceneName}
          </span>
          <span className="text-[8px] text-slate-600">·</span>
          <span className="text-[8px] text-slate-500">
            {ACTIVITY_LABELS[currentLocation.activity]}
          </span>
        </div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredSegment !== null && segments[hoveredSegment] && (
          <ScheduleTooltip
            segment={segments[hoveredSegment]}
            position={tooltipPos}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
