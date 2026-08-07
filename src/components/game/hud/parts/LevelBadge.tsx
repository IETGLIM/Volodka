import { motion, AnimatePresence } from 'framer-motion';

interface LevelBadgeProps {
  level: number;
  perkCount?: number;
  xp?: number;
  xpToNext?: number;
  justLeveled?: boolean;
}

export function LevelBadge({
  level,
  perkCount = 0,
  xp = 0,
  xpToNext = 100,
  justLeveled = false,
}: LevelBadgeProps) {
  const xpPct = Math.min(100, Math.max(0, (xp / xpToNext) * 100));

  return (
    <div className="flex flex-col gap-0.5 relative">
      <div className="flex items-center gap-1.5">
        <motion.div
          className={`flex items-center justify-center w-7 h-7 rounded border text-[11px] font-bold font-mono hud-filmic-badge-shimmer ${justLeveled ? 'level-pulse-anim' : ''}`}
          animate={justLeveled ? { scale: [1, 1.3, 1], borderColor: ['rgba(251,191,36,0.6)', 'rgba(251,191,36,0.8)', 'rgb(var(--cyber-cyan-rgb) / 0.3)'] } : {}}
          transition={{ duration: 0.6 }}
          style={{
            borderColor: justLeveled ? 'rgba(251,191,36,0.6)' : 'rgb(var(--cyber-cyan-rgb) / 0.35)',
            background: justLeveled ? 'rgba(251,191,36,0.15)' : 'rgb(var(--cyber-cyan-rgb) / 0.1)',
            color: justLeveled ? '#fbbf24' : 'var(--cyber-cyan)',
            textShadow: justLeveled ? '0 0 8px rgba(251,191,36,0.6)' : '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)',
            boxShadow: justLeveled ? '0 0 12px rgba(251,191,36,0.3)' : '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.15)',
          }}
          aria-label={`Уровень ${level}`}
        >
          {level}
        </motion.div>
        <span className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider font-semibold">УР</span>
        {perkCount > 0 && (
          <span
            className="text-[9px] font-mono font-bold text-amber-400/80"
            style={{ textShadow: '0 0 6px rgba(251,191,36,0.3)' }}
            aria-label={`${perkCount} черт`}
          >
            ★{perkCount}
          </span>
        )}
        <AnimatePresence>
          {justLeveled && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute -inset-2 rounded-full bg-amber-400/20 pointer-events-none"
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
      </div>
      <div className="h-[2px] w-full rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.6)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: justLeveled
              ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(90deg, #0891b2, var(--cyber-cyan))',
            boxShadow: justLeveled
              ? '0 0 4px rgba(251,191,36,0.4)'
              : '0 0 3px rgb(var(--cyber-cyan-rgb) / 0.2)',
          }}
          initial={false}
          animate={{ width: `${xpPct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}
