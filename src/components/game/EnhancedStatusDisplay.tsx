/* ─── Volodka RPG – Enhanced Status Display v2.0 ───
   Улучшенная панель статуса с:
   – Анимированными progress bars с glow trail
   – Neon-подсветкой критических значений
   – Holographic card эффектами
   – Плавными анимациями изменений
   – Responsive design
   
   Использует props для гибкости интеграции.
*/

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Zap,
  Brain,
  Shield,
  Flame,
  TrendingUp,
  AlertTriangle,
  Activity,
  Sparkles,
} from 'lucide-react';
import { AnimatedCounter } from './hud/parts/AnimatedCounter';

/* ─── Types ─── */
interface StatBarProps {
  value: number;
  max: number;
  icon: React.ReactNode;
  label: string;
  color: 'cyan' | 'amber' | 'matrix' | 'rose' | 'violet';
  showValue?: boolean;
  warningThreshold?: number; // percentage below which warning shows (default 25)
  criticalThreshold?: number; // percentage below which critical shows (default 10)
  size?: 'sm' | 'md' | 'lg';
}

export interface PlayerStatusData {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  stress: number;
  maxStress: number;
  karma: number;
  level: number;
  xp: number;
  xpToNext: number;
}

/* ─── Color Configs ─── */
const colorConfig = {
  cyan: {
    main: 'var(--cyber-cyan)',
    rgb: 'var(--cyber-cyan-rgb)',
    bgClass: 'progress-bar-glow',
    textClass: 'text-neon-cyan',
    glowColor: '#00e5ff',
  },
  amber: {
    main: 'var(--cyber-amber)',
    rgb: 'var(--cyber-amber-rgb)',
    bgClass: 'progress-bar-glow amber',
    textClass: 'text-neon-amber',
    glowColor: '#ffab00',
  },
  matrix: {
    main: 'var(--cyber-matrix)',
    rgb: 'var(--cyber-matrix-rgb)',
    bgClass: 'progress-bar-glow matrix',
    textClass: 'text-neon-matrix',
    glowColor: '#39ff14',
  },
  rose: {
    main: 'var(--cyber-rose)',
    rgb: '255, 23, 68',
    bgClass: 'progress-bar-glow danger',
    textClass: 'text-red-400',
    glowColor: '#ff1744',
  },
  violet: {
    main: 'var(--cyber-violet)',
    rgb: '213, 0, 249',
    bgClass: 'progress-bar-glow',
    textClass: 'text-purple-400',
    glowColor: '#d500f9',
  },
};

const sizeConfig = {
  sm: { height: 'h-1.5', iconSize: 'size-3', text: 'text-[10px]' },
  md: { height: 'h-2.5', iconSize: 'size-4', text: 'text-xs' },
  lg: { height: 'h-3.5', iconSize: 'size-5', text: 'text-sm' },
};

/* ─── Default values for demo/development ─── */
const defaultPlayerData: PlayerStatusData = {
  hp: 85,
  maxHp: 100,
  energy: 65,
  maxEnergy: 80,
  stress: 30,
  maxStress: 100,
  karma: 50,
  level: 5,
  xp: 1250,
  xpToNext: 2000,
};

/* ─── Individual Stat Bar Component ─── */
function StatBar({
  value,
  max,
  icon,
  label,
  color = 'cyan',
  showValue = true,
  warningThreshold = 25,
  criticalThreshold = 10,
  size = 'sm',
}: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const config = colorConfig[color];
  const sizeConf = sizeConfig[size];
  
  const isWarning = percentage < warningThreshold && percentage >= criticalThreshold;
  const isCritical = percentage < criticalThreshold;
  const statusClass = isCritical ? 'danger' : isWarning ? 'amber' : '';

  return (
    <div className="flex items-center gap-2 group">
      {/* Icon with conditional glow */}
      <div
        className={`${sizeConf.iconSize} flex-shrink-0 ${
          isCritical ? 'animate-pulse' : ''
        }`}
        style={{
          color: isCritical ? config.glowColor : undefined,
          filter: isCritical ? `drop-shadow(0 0 6px ${config.glowColor})` : undefined,
        }}
      >
        {icon}
      </div>

      {/* Label */}
      <span className={`hidden sm:inline font-mono ${sizeConf.text} text-slate-400 w-16 shrink-0`}>
        {label}
      </span>

      {/* Progress bar container */}
      <div
        className={`relative flex-1 ${sizeConf.height} rounded-full overflow-hidden bg-slate-800/60 border border-slate-700/30`}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 4px,
              rgba(${config.rgb}, 0.15) 4px,
              rgba(${config.rgb}, 0.15) 8px
            )`,
          }}
        />

        {/* Fill bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${config.bgClass} ${statusClass}`}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>

      {/* Value display */}
      {showValue && (
        <span
          className={`font-mono tabular-nums min-w-[48px] text-right ${sizeConf.text} transition-colors duration-300`}
          style={{
            color: isCritical ? config.glowColor : isWarning ? 'var(--cyber-amber)' : 'inherit',
            textShadow: isCritical || isWarning
              ? `0 0 8px ${isCritical ? config.glowColor : 'var(--cyber-amber)'}40`
              : undefined,
          }}
        >
          <AnimatedCounter value={Math.round(value)} />/
          <AnimatedCounter value={Math.round(max)} />
        </span>
      )}

      {/* Critical indicator */}
      <AnimatePresence>
        {isCritical && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <AlertTriangle className={`${sizeConf.iconSize}`} style={{ color: config.glowColor }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Status Effect Indicator ─── */
interface StatusEffect {
  id: string;
  name: string;
  icon?: React.ReactNode;
  remaining?: number;
}

function StatusEffectIndicator({ effects }: { effects: StatusEffect[] }) {
  if (effects.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/40 border border-slate-700/20">
      <Activity className="size-3 text-cyan-400" />
      <div className="flex gap-0.5">
        {effects.slice(0, 4).map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.2 }}
            className="w-5 h-5 rounded flex items-center justify-center bg-slate-700/50 border border-cyan-500/20"
            title={effect.name}
          >
            {effect.icon || <Sparkles className="size-2.5 text-cyan-300" />}
          </motion.div>
        ))}
        {effects.length > 4 && (
          <span className="text-[9px] text-slate-400 font-mono">+{effects.length - 4}</span>
        )}
      </div>
    </div>
  );
}

/* ─── Main Enhanced Status Display ─── */
interface EnhancedStatusDisplayProps {
  /** Player data - if not provided, uses defaults for development */
  playerData?: Partial<PlayerStatusData>;
  compact?: boolean;
  showEffects?: boolean;
  position?: 'floating' | 'inline';
  /** Active status effects to display */
  activeEffects?: StatusEffect[];
}

export const EnhancedStatusDisplay = memo(function EnhancedStatusDisplay({
  playerData: playerDataProp,
  compact = false,
  showEffects = true,
  position = 'inline',
  activeEffects: activeEffectsProp,
}: EnhancedStatusDisplayProps) {
  // Merge with defaults
  const playerState: PlayerStatusData = useMemo(() => ({
    ...defaultPlayerData,
    ...playerDataProp,
  }), [playerDataProp]);

  // Internal state for effects (can be controlled or internal)
  const [internalEffects] = useState<StatusEffect[]>([
    { id: 'focused', name: 'Сосредоточенность', remaining: 45 },
  ]);
  const activeEffects = activeEffectsProp ?? internalEffects;

  /* Computed stats array */
  const stats = useMemo(
    () => [
      {
        id: 'hp',
        value: playerState.hp,
        max: playerState.maxHp,
        icon: <Heart className="size-full" />,
        label: 'HP',
        color: 'rose' as const,
        warningThreshold: 25,
        criticalThreshold: 10,
      },
      {
        id: 'energy',
        value: playerState.energy,
        max: playerState.maxEnergy,
        icon: <Zap className="size-full" />,
        label: 'Энергия',
        color: 'cyan' as const,
        warningThreshold: 20,
        criticalThreshold: 10,
      },
      {
        id: 'stress',
        value: playerState.stress,
        max: playerState.maxStress,
        icon: <Brain className="size-full" />,
        label: 'Стресс',
        color: 'amber' as const,
        warningThreshold: 75,
        criticalThreshold: 90,
      },
    ],
    [playerState]
  );

  const containerStyles = position === 'floating'
    ? 'fixed top-20 right-4 z-[--z-hud] p-3 holo-panel rounded-xl backdrop-blur-xl min-w-[280px]'
    : 'p-3 rounded-lg bg-slate-900/40 border border-slate-700/20 relative';

  return (
    <motion.div
      className={containerStyles}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/30">
        <div className="flex items-center gap-2">
          <Shield 
            className="size-4 text-cyan-400" 
            style={{ filter: 'drop-shadow(0 0 4px var(--cyber-cyan))' }} 
          />
          <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider">
            Статус
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-amber-400 font-mono">Ур. {playerState.level}</span>
          <div className="w-12 h-1 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
              animate={{ width: `${(playerState.xp / playerState.xpToNext) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {stats.map((stat) => (
          <StatBar
            key={stat.id}
            {...stat}
            size={compact ? 'sm' : 'md'}
            showValue={!compact}
          />
        ))}
      </div>

      {/* Karma indicator */}
      <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp
            className="size-3"
            style={{
              color: playerState.karma > 70 ? 'var(--cyber-matrix)' : playerState.karma < 30 ? 'var(--cyber-rose)' : 'var(--cyber-amber)',
            }}
          />
          <span className="text-[10px] text-slate-400 font-mono">Карма</span>
        </div>
        <motion.span
          key={playerState.karma}
          initial={{ opacity: 0.5, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono font-bold"
          style={{
            color:
              playerState.karma > 70
                ? 'var(--cyber-matrix)'
                : playerState.karma < 30
                  ? 'var(--cyber-rose)'
                  : 'var(--cyber-amber)',
            textShadow: `0 0 8px ${
              playerState.karma > 70
                ? 'rgba(var(--cyber-matrix-rgb), 0.4)'
                : playerState.karma < 30
                  ? 'rgba(255, 23, 68, 0.4)'
                  : 'rgba(var(--cyber-amber-rgb), 0.4)'
            }`,
          }}
        >
          {playerState.karma > 0 ? '+' : ''}{playerState.karma}
        </motion.span>
      </div>

      {/* Status effects */}
      {showEffects && activeEffects.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-700/30">
          <StatusEffectIndicator effects={activeEffects} />
        </div>
      )}

      {/* Decorative corner accents */}
      <div
        className="absolute top-0 right-0 w-4 h-4 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, transparent 50%, rgba(var(--cyber-cyan-rgb), 0.15) 50%)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 pointer-events-none"
        style={{
          background: `linear-gradient(-45deg, transparent 50%, rgba(var(--cyber-cyan-rgb), 0.1) 50%)`,
        }}
      />
    </motion.div>
  );
});

/* ─── Mini Status Bar (for HUD integration) ─── */
export function MiniStatusBar({ data }: { data?: Partial<PlayerStatusData> }) {
  const playerState: PlayerStatusData = useMemo(() => ({
    ...defaultPlayerData,
    ...data,
  }), [data]);

  return (
    <div className="flex items-center gap-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-slate-700/20">
      {/* HP */}
      <div className="flex items-center gap-1 w-20">
        <Heart className="size-3 text-red-400" />
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full bg-red-500 rounded-full"
            animate={{ width: `${(playerState.hp / playerState.maxHp) * 100}%` }}
            style={
              playerState.hp / playerState.maxHp < 0.25
                ? { boxShadow: '0 0 8px #ff1744' }
                : undefined
            }
          />
        </div>
        <span className="text-[10px] font-mono text-red-300 w-7 text-right">{playerState.hp}</span>
      </div>

      {/* Energy */}
      <div className="flex items-center gap-1 w-24">
        <Zap className="size-3 text-cyan-400" />
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full progress-bar-glow rounded-full"
            animate={{ width: `${(playerState.energy / playerState.maxEnergy) * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-cyan-300 w-7 text-right">{playerState.energy}</span>
      </div>

      {/* Stress */}
      <div className="flex items-center gap-1 w-20">
        <Flame className="size-3 text-amber-400" />
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full bg-amber-500 rounded-full"
            animate={{ width: `${(playerState.stress / playerState.maxStress) * 100}%` }}
            style={
              playerState.stress / playerState.maxStress > 0.75
                ? { boxShadow: '0 0 8px #ffab00' }
                : undefined
            }
          />
        </div>
        <span className="text-[10px] font-mono text-amber-300 w-7 text-right">{playerState.stress}%</span>
      </div>
    </div>
  );
}

/* ─── Export utilities ─── */
export type { StatBarProps, StatusEffect };
export default EnhancedStatusDisplay;
