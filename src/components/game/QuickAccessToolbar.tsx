
/* ─── Volodka RPG – Quick Access Toolbar ─── */
/* Compact bottom-center toolbar showing key player stats at a glance.
 * Visible only during exploration mode. */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Volume2, VolumeX, MapPin } from 'lucide-react';
import { useGamePhase, useQuickAccessToolbarState, useDiscoveredScenes } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomToolbarPx } from '@/shared/constants/hudLayout';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useExplorationBottomHudVisible } from '@/hooks/useExplorationBottomHud';
import { CORE_SCENE_IDS } from '@/config/sceneIds';

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
      <div className="relative w-16 h-1.5 overflow-hidden"
        style={{
          background: 'rgba(214, 211, 209, 0.1)',
          boxShadow: warningPulse ? `0 0 6px ${glowColor}50` : undefined,
        }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{
            background: `linear-gradient(90deg, transparent, ${color})`,
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
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

/** Karma ring — filmic stone accent, no neon breathe soup */
function KarmaRing({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  const karmaColor =
    value >= 70 ? 'rgba(196,181,160,0.9)' : value >= 40 ? 'rgba(252,211,165,0.85)' : 'rgba(252,165,165,0.85)';

  return (
    <div className="relative flex items-center justify-center" title={`Карма: ${value}`}>
      <svg width={30} height={30} viewBox="0 0 30 30" className="rotate-[-90deg]">
        <circle
          cx="15"
          cy="15"
          r={radius}
          fill="none"
          stroke="rgba(168, 162, 158, 0.18)"
          strokeWidth={2.5}
        />
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
        />
      </svg>
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
        className="flex items-center justify-center w-6 h-6 rounded-sm border text-[9px] font-mono font-bold"
        style={{
          borderColor: 'var(--hud-filmic-border)',
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--hud-filmic-accent)',
        }}
      >
        {level}
      </div>
      <div
        className="w-10 h-1 overflow-hidden"
        style={{
          background: 'rgba(214, 211, 209, 0.1)',
        }}
      >
        <motion.div
          className="h-full"
          style={{
            background: 'linear-gradient(90deg, transparent, var(--hud-filmic-accent))',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
    </div>
  );
}

/** Compact exploration progress indicator for the bottom toolbar */
function ExplorationCompact() {
  const discoveredScenes = useDiscoveredScenes();
  const discoveredCount = discoveredScenes
    ? discoveredScenes.filter((id: string) => (CORE_SCENE_IDS as unknown as readonly string[]).includes(id)).length
    : 0;
  const totalScenes = CORE_SCENE_IDS.length;
  const pct = totalScenes > 0 ? Math.round((discoveredCount / totalScenes) * 100) : 0;

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-0.5 cursor-default"
      title={`Исследовано: ${discoveredCount}/${totalScenes} локаций (${pct}%)`}
    >
      <MapPin
        className="size-3"
        style={{ color: 'var(--hud-filmic-ink-muted)' }}
      />
      <span
        className="hud-filmic-kicker tabular-nums"
        style={{ letterSpacing: '0.08em', fontSize: 9 }}
      >
        {discoveredCount}/{totalScenes}
      </span>
    </div>
  );
}

/* ─── Main Component ─── */

export function QuickAccessToolbar() {
  const mode = useGamePhase();
  const quietStyle = useHudQuietStyle();
  const bottomHudVisible = useExplorationBottomHudVisible();
  const {
    energy,
    stress,
    karma,
    level,
    xp,
    xpToNextLevel,
    musicEnabled,
    toggleMusic,
  } = useQuickAccessToolbarState();
  const isStressHigh = stress >= 70;
  const isEnergyLow = energy <= 20;

  return (
    <AnimatePresence>
      {mode === 'exploration' && bottomHudVisible && (
        <motion.div
          key="quick-access-toolbar"
          data-exploration-ui
          className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
          style={{ zIndex: UI_LAYERS.HUD, bottom: bottomToolbarPx(), ...quietStyle }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className={`relative hud-filmic-toolbar ${isStressHigh ? 'hud-filmic-toolbar--warn' : ''}`}
          >
            {/* Content row */}
            <div className="relative z-20 flex items-center gap-3 px-4 py-2">
              {/* Energy bar */}
              <StatBar
                value={energy}
                max={100}
                color={isEnergyLow ? '#fb7185' : 'rgba(196,181,160,0.85)'}
                glowColor={isEnergyLow ? '#fb7185' : 'rgba(196,181,160,0.4)'}
                icon={Zap}
                label="Энергия"
                warningPulse={isEnergyLow}
              />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'var(--hud-filmic-border)' }}
              />

              {/* Stress bar */}
              <StatBar
                value={stress}
                max={100}
                color={isStressHigh ? '#fb7185' : 'rgba(252,211,165,0.75)'}
                glowColor={isStressHigh ? '#fb7185' : 'rgba(252,211,165,0.35)'}
                icon={Activity}
                label="Стресс"
                warningPulse={isStressHigh}
              />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'var(--hud-filmic-border)' }}
              />

              {/* Karma ring */}
              <KarmaRing value={karma} max={100} />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'var(--hud-filmic-border)' }}
              />

              {/* Level + XP */}
              <LevelBadge level={level} xp={xp} xpToNext={xpToNextLevel} />

              {/* Divider */}
              <div
                className="w-px h-5"
                style={{ background: 'var(--hud-filmic-border)' }}
              />

              {/* Exploration progress (compact) */}
              <ExplorationCompact />

              {/* Music toggle */}
              <button
                onClick={toggleMusic}
                className="flex items-center justify-center w-7 h-7 rounded-sm transition-colors duration-200"
                style={{
                  background: musicEnabled
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(252,165,165,0.06)',
                  border: `1px solid ${musicEnabled ? 'var(--hud-filmic-border)' : 'rgba(252,165,165,0.25)'}`,
                  color: musicEnabled ? 'var(--hud-filmic-ink-muted)' : 'var(--hud-filmic-danger)',
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
