import { motion } from 'framer-motion';

interface CyberStatBarProps {
  value: number;
  max?: number;
  color: string;
  glowColor: string;
  showSegments?: boolean;
  shimmer?: boolean;
}

export function CyberStatBar({
  value,
  max = 100,
  color,
  glowColor,
  showSegments = true,
  shimmer = false,
}: CyberStatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isLow = value / max < 0.3;
  const lowClass = isLow
    ? color.includes('#ef4444') || color.includes('red')
      ? 'low-bar-pulse'
      : 'low-bar-pulse-amber'
    : '';

  return (
    <div
      className={`relative h-2.5 bg-slate-800/80 rounded-full overflow-hidden ${lowClass} ${shimmer ? 'stat-shimmer' : ''}`}
      style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {showSegments && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[25, 50, 75].map((mark) => (
            <div key={mark} className="absolute top-0 bottom-0 w-px bg-slate-700/40" style={{ left: `${mark}%` }} />
          ))}
        </div>
      )}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: color,
          boxShadow: `0 0 10px ${glowColor}, 0 0 3px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)`,
        }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}
