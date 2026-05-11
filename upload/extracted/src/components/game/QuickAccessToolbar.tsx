'use client';

/* ─── Volodka RPG – Quick Access Toolbar ─── */
/* Compact bottom-center toolbar showing key player stats at a glance.
 * Visible only during exploration mode. */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Sub-components ─── */

/** Animated stat bar (energy / stress) */
function StatBar({
  value,
  max,
  color,
  glowColor,
  icon: Icon,
  label,
  warningPulse,
}: {
  value: number;
  max: number;
  color: string;
  glowColor: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  warningPulse?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="flex items-center gap-1.5">
      <Icon
        className="size-3.5 shrink-0"
        style={{ color }}
      />
      <div className="relative w-16 h-2.5 rounded-full overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: `1px solid ${color}33`,
          boxShadow: warningPulse ? undefined : `0 0 4px ${glowColor}40`,
        }}
      >
        {/* Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `0 0 6px ${glowColor}60, inset 0 0 2px ${glowColor}30`,
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {/* Shimmer sweep */}
        <div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${color}25 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>
      <span
        className="text-[10px] font-mono w-6 text-right tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
      <span className="sr-only">{label}: {value}/{max}</span>
    </div>
  );
}

/** Karma ring indicator with breathing glow */
function KarmaRing({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  // Karma color: red (low) → amber (mid) → cyan (high)
  const karmaColor =
    value >= 70 ? '#22d3ee' : value >= 40 ? '#fbbf24' : '#fb7185';
  const karmaGlow =
    value >= 70
      ? 'rgba(34, 211, 238, 0.3)'
      : value >= 40
        ? 'rgba(251, 191, 36, 0.3)'
        : 'rgba(251, 113, 133, 0.3)';

  return (
    <div className="relative flex items-center justify-center" title={`Карма: ${value}`}>
      <svg width={30} height={30} viewBox="0 0 30 30" className="rotate-[-90deg]">
        {/* Background ring */}
        <circle
          cx="15"
          cy="15"
          r={radius}
          fill="none"
          stroke="rgba(100, 116, 139, 0.15)"
          strokeWidth={2.5}
        />
        {/* Progress ring */}
        <motion.circle
          cx="15"
          cy="15"
          r={radius}
          fill="none"
          stroke={karmaColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            filter: `drop-shadow(0 0 3px ${karmaGlow})`,
          }}
        />
      </svg>
      {/* Breathing glow overlay */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${karmaGlow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span
        className="absolute text-[8px] font-mono font-bold"
        style={{ color: karmaColor }}
      >
        {value}
      </span>
    </div>
  );
}

/** Level + mini XP bar */
function LevelBadge({ level, xp, xpToNext }: { level: number; xp: number; xpToNext: number }) {
  const pct = xpToNext > 0 ? Math.max(0, Math.min(100, (xp / xpToNext) * 100)) : 0;

  return (
    <div className="flex items-center gap-1.5" title={`Уровень ${level} | XP: ${xp}/${xpToNext}`}>
      <div
        className="flex items-center justify-center w-6 h-6 rounded border text-[9px] font-mono font-bold"
        style={{
          borderColor: 'rgba(251, 191, 36, 0.3)',
          background: 'rgba(251, 191, 36, 0.08)',
          color: '#fbbf24',
          boxShadow: '0 0 6px rgba(251, 191, 36, 0.15)',
        }}
      >
        {level}
      </div>
      <div
        className="w-10 h-1.5 rounded-full overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(251, 191, 36, 0.15)',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #fbbf24cc, #fbbf24)',
            boxShadow: '0 0 4px rgba(251, 191, 36, 0.3)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function QuickAccessToolbar() {
  const mode = useGameStore((s) => s.mode);
  const playerState = useGameStore((s) => s.playerState);
  const musicEnabled = useGameStore((s) => s.musicEnabled);
  const toggleMusic = useGameStore((s) => s.toggleMusic);

  const { energy, stress, karma } = playerState;
  const { level, xp, xpToNextLevel } = playerState.progression;
  const isStressHigh = stress >= 70;
  const isEnergyLow = energy <= 20;

  return (
    <AnimatePresence>
      {mode === 'exploration' && (
        <motion.div
          key="quick-access-toolbar"
          className="fixed bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto"
          style={{ zIndex: UI_LAYERS.HUD }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className={`relative hex-grid-bg ${isStressHigh ? 'warning-pulse' : ''}`}
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              background:
                'linear-gradient(180deg, rgba(8, 12, 18, 0.85) 0%, rgba(5, 8, 14, 0.9) 100%)',
              border: `1px solid ${isStressHigh ? 'rgba(251, 113, 133, 0.35)' : 'rgba(34, 211, 238, 0.2)'}`,
              borderRadius: '8px',
              boxShadow: isStressHigh
                ? '0 0 16px rgba(251, 113, 133, 0.15), 0 4px 16px rgba(0, 0, 0, 0.5)'
                : '0 0 16px rgba(0, 229, 255, 0.08), 0 4px 16px rgba(0, 0, 0, 0.5)',
              maxHeight: '48px',
              overflow: 'hidden',
            }}
          >
            {/* Corner bracket decorations */}
            <div className="corner-bracket corner-bracket-tl" />
            <div className="corner-bracket corner-bracket-tr" />
            <div className="corner-bracket corner-bracket-bl" />
            <div className="corner-bracket corner-bracket-br" />

            {/* Scan-line sweep on hover */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 group">
              <div
                className="absolute inset-x-0 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    'linear-gradient(180deg, transparent 0%, rgba(0, 229, 255, 0.06) 40%, rgba(0, 229, 255, 0.1) 50%, rgba(0, 229, 255, 0.06) 60%, transparent 100%)',
                  animation: 'scanline-overlay 2s linear infinite',
                }}
              />
            </div>

            {/* Neon border glow animation */}
            <motion.div
              className="absolute inset-0 rounded-[8px] pointer-events-none"
              animate={{
                boxShadow: isStressHigh
                  ? [
                      '0 0 8px rgba(251, 113, 133, 0.1), inset 0 0 4px rgba(251, 113, 133, 0.03)',
                      '0 0 16px rgba(251, 113, 133, 0.2), inset 0 0 8px rgba(251, 113, 133, 0.06)',
                      '0 0 8px rgba(251, 113, 133, 0.1), inset 0 0 4px rgba(251, 113, 133, 0.03)',
                    ]
                  : [
                      '0 0 8px rgba(0, 229, 255, 0.08), inset 0 0 4px rgba(0, 229, 255, 0.02)',
                      '0 0 16px rgba(0, 229, 255, 0.15), inset 0 0 8px rgba(0, 229, 255, 0.04)',
                      '0 0 8px rgba(0, 229, 255, 0.08), inset 0 0 4px rgba(0, 229, 255, 0.02)',
                    ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Content row */}
            <div className="relative z-20 flex items-center gap-3 px-4 py-2">
              {/* Energy bar */}
              <StatBar
                value={energy}
                max={100}
                color={isEnergyLow ? '#fb7185' : '#22d3ee'}
                glowColor={isEnergyLow ? '#fb7185' : '#22d3ee'}
                icon={Zap}
                label="Энергия"
                warningPulse={isEnergyLow}
              />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'rgba(100, 116, 139, 0.2)' }}
              />

              {/* Stress bar */}
              <StatBar
                value={stress}
                max={100}
                color={isStressHigh ? '#fb7185' : '#fbbf24'}
                glowColor={isStressHigh ? '#fb7185' : '#fbbf24'}
                icon={Activity}
                label="Стресс"
                warningPulse={isStressHigh}
              />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'rgba(100, 116, 139, 0.2)' }}
              />

              {/* Karma ring */}
              <KarmaRing value={karma} max={100} />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'rgba(100, 116, 139, 0.2)' }}
              />

              {/* Level + XP */}
              <LevelBadge level={level} xp={xp} xpToNext={xpToNextLevel} />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'rgba(100, 116, 139, 0.2)' }}
              />

              {/* Music toggle */}
              <button
                onClick={toggleMusic}
                className="flex items-center justify-center w-7 h-7 rounded transition-colors duration-200 focus-cyber"
                style={{
                  background: musicEnabled
                    ? 'rgba(0, 229, 255, 0.08)'
                    : 'rgba(251, 113, 133, 0.08)',
                  border: `1px solid ${musicEnabled ? 'rgba(0, 229, 255, 0.2)' : 'rgba(251, 113, 133, 0.2)'}`,
                  color: musicEnabled ? '#22d3ee' : '#fb7185',
                }}
                title={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
                aria-label={musicEnabled ? 'Выключить музыку' : 'Включить музыку'}
              >
                {musicEnabled ? (
                  <Volume2 className="size-3.5" />
                ) : (
                  <VolumeX className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
