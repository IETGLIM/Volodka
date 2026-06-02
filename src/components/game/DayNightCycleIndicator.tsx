
/* ─── Volodka RPG – Day/Night Cycle Indicator (HUD Widget) ─── */
/* Arc-shaped visual indicator showing current position in the
 * day/night cycle with animated transitions, sun/moon movement,
 * star particles, and atmospheric color changes. Cyberpunk aesthetic. */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Stars,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ── Time phases ── */
type TimePhase = 'morning' | 'day' | 'evening' | 'night';

interface PhaseConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /* Arc gradient colors (start → end) */
  gradientStart: string;
  gradientEnd: string;
  /* Border / glow accent */
  border: string;
  glow: string;
  iconColor: string;
  /* Celestial body color */
  celestialFill: string;
  celestialGlow: string;
}

const PHASE_CONFIG: Record<TimePhase, PhaseConfig> = {
  morning: {
    label: 'Утро',
    icon: Sunrise,
    gradientStart: '#f59e0b', // amber-500
    gradientEnd: '#fbbf24',   // amber-400
    border: 'rgba(245,158,11,0.35)',
    glow: 'rgba(245,158,11,0.12)',
    iconColor: 'text-amber-400',
    celestialFill: '#fbbf24',
    celestialGlow: 'rgba(251,191,36,0.5)',
  },
  day: {
    label: 'День',
    icon: Sun,
    gradientStart: '#06b6d4', // cyan-500
    gradientEnd: '#22d3ee',   // cyan-400
    border: 'rgba(6,182,212,0.35)',
    glow: 'rgba(6,182,212,0.12)',
    iconColor: 'text-cyan-400',
    celestialFill: '#22d3ee',
    celestialGlow: 'rgba(34,211,238,0.5)',
  },
  evening: {
    label: 'Вечер',
    icon: Sunset,
    gradientStart: '#ea580c', // orange-600
    gradientEnd: '#a855f7',   // purple-500
    border: 'rgba(234,88,12,0.35)',
    glow: 'rgba(234,88,12,0.12)',
    iconColor: 'text-orange-400',
    celestialFill: '#f97316',
    celestialGlow: 'rgba(249,115,22,0.5)',
  },
  night: {
    label: 'Ночь',
    icon: Moon,
    gradientStart: '#6d28d9', // violet-700
    gradientEnd: '#312e81',   // indigo-900
    border: 'rgba(139,92,246,0.35)',
    glow: 'rgba(139,92,246,0.12)',
    iconColor: 'text-violet-400',
    celestialFill: '#c4b5fd',
    celestialGlow: 'rgba(196,181,253,0.4)',
  },
};

/* ── Phase boundaries (hours) ── */
const PHASE_RANGES: { phase: TimePhase; start: number; end: number }[] = [
  { phase: 'morning', start: 6, end: 10 },
  { phase: 'day', start: 10, end: 18 },
  { phase: 'evening', start: 18, end: 21 },
  { phase: 'night', start: 21, end: 30 }, // 30 = 6 next day
];

/* ── Derive current phase from timeOfDay ── */
function getPhase(timeOfDay: number): TimePhase {
  if (timeOfDay >= 6 && timeOfDay < 10) return 'morning';
  if (timeOfDay >= 10 && timeOfDay < 18) return 'day';
  if (timeOfDay >= 18 && timeOfDay < 21) return 'evening';
  return 'night';
}

/* ── Calculate progress within current phase (0-1) ── */
function getPhaseProgress(timeOfDay: number, phase: TimePhase): number {
  const range = PHASE_RANGES.find((r) => r.phase === phase)!;
  const adjustedEnd = range.end > 24 ? range.end - 24 : range.end;
  const adjustedStart = range.start;

  let duration: number;
  let elapsed: number;

  if (adjustedEnd < adjustedStart) {
    // Crosses midnight (night: 21→6)
    duration = (24 - adjustedStart) + adjustedEnd;
    elapsed = timeOfDay >= adjustedStart
      ? timeOfDay - adjustedStart
      : (24 - adjustedStart) + timeOfDay;
  } else {
    duration = adjustedEnd - adjustedStart;
    elapsed = timeOfDay - adjustedStart;
  }

  return Math.max(0, Math.min(1, elapsed / duration));
}

/* ── Calculate overall cycle position (0-1 for the full 24h arc) ── */
function getCyclePosition(timeOfDay: number): number {
  // Map 0-24 to 0-1, where 0 = midnight, 0.25 = 6am, etc.
  return timeOfDay / 24;
}

/* ── Calculate arc angle from cycle position ── */
/* Arc goes from 210° (bottom-left) to 330° (bottom-right) = 240° sweep
 * Position 0 = 6:00 (morning start) at the leftmost point
 * This creates a "horizon arc" effect */
function positionToAngle(position: number): number {
  // Map position 0-1 to arc from 210° (7 o'clock) counterclockwise to 330° (5 o'clock)
  // We go from left (morning) over top (day) to right (evening/night)
  const startAngle = 210; // bottom-left in SVG coordinates
  const endAngle = -30;   // bottom-right (330° = -30°)
  // Total sweep = 240°
  return startAngle + position * (endAngle - startAngle);
}

/* ── Next phase info ── */
function getNextPhaseInfo(currentPhase: TimePhase, timeOfDay: number): { phase: TimePhase; hoursUntil: number } {
  const phaseOrder: TimePhase[] = ['morning', 'day', 'evening', 'night'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  const nextPhase = phaseOrder[(currentIndex + 1) % 4];

  const currentRange = PHASE_RANGES.find((r) => r.phase === currentPhase)!;
  const currentEnd = currentRange.end > 24 ? currentRange.end - 24 : currentRange.end;

  let hoursUntil: number;
  if (currentEnd < currentRange.start) {
    // Crosses midnight
    hoursUntil = timeOfDay >= currentRange.start
      ? (24 - timeOfDay) + currentEnd
      : currentEnd - timeOfDay;
  } else {
    hoursUntil = currentEnd - timeOfDay;
  }

  if (hoursUntil <= 0) hoursUntil += 24;

  return { phase: nextPhase, hoursUntil };
}

/* ── Format time as HH:MM ── */
function formatTime(timeOfDay: number): string {
  const hours = Math.floor(timeOfDay) % 24;
  const minutes = Math.floor((timeOfDay % 1) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/* ── Star particle component ── */
function StarParticle({ x, y, delay, size }: { x: number; y: number; delay: number; size: number }) {
  // Guard against undefined values with defaults
  const safeX = x ?? 0;
  const safeY = y ?? 0;
  const safeSize = size ?? 0.5;

  return (
    <motion.circle
      cx={safeX}
      cy={safeY}
      r={safeSize}
      fill="white"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.8, 0.2, 0.7, 0],
        scale: [0.5, 1, 0.8, 1.1, 0.5],
      }}
      transition={{
        duration: 2 + delay * 0.5,
        delay: delay * 0.3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/* ── Main Component ── */
export function DayNightCycleIndicator() {
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);

  const phase = useMemo(() => getPhase(timeOfDay), [timeOfDay]);
  const config = PHASE_CONFIG[phase];
  const cyclePos = useMemo(() => getCyclePosition(timeOfDay), [timeOfDay]);
  const angle = useMemo(() => positionToAngle(cyclePos), [cyclePos]);
  const nextPhase = useMemo(() => getNextPhaseInfo(phase, timeOfDay), [phase, timeOfDay]);
  const nextConfig = PHASE_CONFIG[nextPhase.phase];

  /* Arc parameters */
  const cx = 62;
  const cy = 54;
  const arcRadius = 36;

  /* Celestial body position on the arc */
  const rad = (angle * Math.PI) / 180;
  const bodyX = cx + arcRadius * Math.cos(rad);
  const bodyY = cy + arcRadius * Math.sin(rad);

  /* Arc path: draw a 240° arc from 210° to -30° (330°) */
  const arcStartAngle = 210;
  const arcEndAngle = -30;
  const arcStartRad = (arcStartAngle * Math.PI) / 180;
  const arcEndRad = (arcEndAngle * Math.PI) / 180;
  const arcX1 = cx + arcRadius * Math.cos(arcStartRad);
  const arcY1 = cy + arcRadius * Math.sin(arcStartRad);
  const arcX2 = cx + arcRadius * Math.cos(arcEndRad);
  const arcY2 = cy + arcRadius * Math.sin(arcEndRad);

  /* Stars for night phase */
  const stars = useMemo(() => {
    if (phase !== 'night') return [];
    const result: { x: number; y: number; delay: number; size: number }[] = [];
    // Seed random positions inside the arc area
    const seed = [0.12, 0.34, 0.56, 0.78, 0.23, 0.67, 0.89, 0.45, 0.91, 0.15, 0.72, 0.38];
    for (let i = 0; i < 12; i++) {
      const sx = 20 + seed[i] * 100;
      const sy = 10 + seed[(i + 3) % seed.length] * 50;
      result.push({ x: sx, y: sy, delay: i * 0.4, size: 0.5 + seed[(i + 5) % seed.length] * 1 });
    }
    return result;
  }, [phase]);

  const PhaseIcon = config.icon;

  return (
    <div
      className="fixed pointer-events-none hidden lg:block"
      style={{ top: 80, right: 12, zIndex: UI_LAYERS.HUD + 1 }}
    >
      <motion.div
        className="pointer-events-auto rounded-lg border backdrop-blur-md overflow-hidden"
        style={{
          width: 160,
          background: 'linear-gradient(145deg, rgba(0,0,0,0.78) 0%, rgba(15,23,42,0.65) 50%, rgba(0,0,0,0.55) 100%)',
          borderColor: config.border,
          boxShadow: `0 0 14px ${config.glow}, 0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)`,
        }}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-2.5 pt-2 pb-1.5"
          style={{ borderBottom: '1px solid', borderBottomColor: config.border }}
        >
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`phase-icon-${phase}`}
                initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
                transition={{ duration: 0.35 }}
              >
                <PhaseIcon className={`size-3.5 ${config.iconColor}`} />
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`phase-label-${phase}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] font-serif text-slate-200 italic"
              >
                {config.label}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`time-${formatTime(timeOfDay)}`}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-mono text-slate-300 tabular-nums"
              style={{ textShadow: `0 0 6px ${config.celestialGlow}` }}
            >
              {formatTime(timeOfDay)}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* ── Arc visual ── */}
        <div className="px-2.5 py-1.5">
          <svg
            width="136"
            height="62"
            viewBox="0 0 136 62"
            className="w-full"
            style={{ overflow: 'visible' }}
          >
            <defs>
              {/* Phase gradient for arc */}
              <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={config.gradientStart} stopOpacity={0.8} />
                <stop offset="50%" stopColor={config.gradientEnd} stopOpacity={0.9} />
                <stop offset="100%" stopColor={config.gradientStart} stopOpacity={0.8} />
              </linearGradient>

              {/* Glow filter for celestial body */}
              <filter id="celestialGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Subtle glow for arc */}
              <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Night star particles */}
            {phase === 'night' && stars.map((star, i) => (
              <StarParticle key={i} x={star.x} y={star.y} delay={star.delay} size={star.size} />
            ))}

            {/* Background arc track */}
            <path
              d={`M ${arcX1} ${arcY1} A ${arcRadius} ${arcRadius} 0 1 0 ${arcX2} ${arcY2}`}
              fill="none"
              stroke="rgba(30,30,50,0.6)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Phase-colored arc */}
            <motion.path
              d={`M ${arcX1} ${arcY1} A ${arcRadius} ${arcRadius} 0 1 0 ${arcX2} ${arcY2}`}
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              filter="url(#arcGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.7 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Phase tick marks on the arc */}
            {/* Morning start (6:00) — left */}
            <circle cx={arcX1} cy={arcY1} r="1.5" fill={PHASE_CONFIG.morning.gradientStart} opacity={0.5} />
            {/* Day start (10:00) — roughly 10/24 around */}
            {(() => {
              const dayAngle = positionToAngle(10 / 24);
              const dayRad = (dayAngle * Math.PI) / 180;
              return (
                <circle
                  cx={cx + arcRadius * Math.cos(dayRad)}
                  cy={cy + arcRadius * Math.sin(dayRad)}
                  r="1.5"
                  fill={PHASE_CONFIG.day.gradientStart}
                  opacity={0.5}
                />
              );
            })()}
            {/* Evening start (18:00) */}
            {(() => {
              const eveAngle = positionToAngle(18 / 24);
              const eveRad = (eveAngle * Math.PI) / 180;
              return (
                <circle
                  cx={cx + arcRadius * Math.cos(eveRad)}
                  cy={cy + arcRadius * Math.sin(eveRad)}
                  r="1.5"
                  fill={PHASE_CONFIG.evening.gradientStart}
                  opacity={0.5}
                />
              );
            })()}
            {/* Night start (21:00) — right */}
            <circle cx={arcX2} cy={arcY2} r="1.5" fill={PHASE_CONFIG.night.gradientStart} opacity={0.5} />

            {/* ── Celestial body (sun or moon) ── */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.g
                key={`celestial-${phase}`}
                filter="url(#celestialGlow)"
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.circle
                  cx={bodyX}
                  cy={bodyY}
                  r={phase === 'night' ? 4 : 5}
                  fill={config.celestialFill}
                  animate={{
                    cx: bodyX,
                    cy: bodyY,
                  }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                />
                {/* Crescent effect for night moon */}
                {phase === 'night' && (
                  <motion.circle
                    cx={bodyX + 2}
                    cy={bodyY - 1}
                    r={3.2}
                    fill="rgba(0,0,0,0.7)"
                    animate={{
                      cx: bodyX + 2,
                      cy: bodyY - 1,
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                )}
                {/* Sun rays for day/morning */}
                {(phase === 'day' || phase === 'morning') && (
                  <motion.circle
                    cx={bodyX}
                    cy={bodyY}
                    r={8}
                    fill="none"
                    stroke={config.celestialFill}
                    strokeWidth={0.5}
                    opacity={0.3}
                    animate={{
                      cx: bodyX,
                      cy: bodyY,
                      r: [8, 10, 8],
                      opacity: [0.3, 0.15, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.g>
            </AnimatePresence>

            {/* Horizon line */}
            <line
              x1={arcX1 - 5}
              y1={cy + arcRadius * Math.sin(arcStartRad) + 4}
              x2={arcX2 + 5}
              y2={cy + arcRadius * Math.sin(arcEndRad) + 4}
              stroke="rgba(100,100,120,0.2)"
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
          </svg>
        </div>

        {/* ── Divider ── */}
        <div
          className="h-px mx-3"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.border}, transparent)`,
          }}
        />

        {/* ── Next phase indicator ── */}
        <div className="px-2.5 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`next-icon-${nextPhase.phase}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.25 }}
              >
                {(() => {
                  const NextIcon = nextConfig.icon;
                  return <NextIcon className="size-2.5 text-slate-500" />;
                })()}
              </motion.div>
            </AnimatePresence>
            <span className="text-[9px] font-mono text-slate-500">
              Следующий:
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`next-label-${nextPhase.phase}`}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.2 }}
                className="text-[9px] font-serif text-slate-400 italic"
              >
                {nextConfig.label}
              </motion.span>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`next-hours-${Math.floor(nextPhase.hoursUntil)}`}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[9px] font-mono text-slate-500"
            >
              через {Math.floor(nextPhase.hoursUntil)}ч
            </motion.span>
          </AnimatePresence>
        </div>

        {/* ── Bottom accent line ── */}
        <div
          className="h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.border}, transparent)`,
          }}
        />

        {/* ── Footer ── */}
        <div className="flex items-center justify-center px-2.5 py-1">
          <span className="text-[8px] text-slate-600 font-mono">volodka://cycle</span>
        </div>
      </motion.div>
    </div>
  );
}
