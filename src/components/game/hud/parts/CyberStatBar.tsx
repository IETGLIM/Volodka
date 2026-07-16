import { motion } from 'framer-motion';

interface CyberStatBarProps {
  value: number;
  max?: number;
  color: string;
  /** Optional explicit gradient string. If provided, overrides the auto-generated gradient from `color`. */
  gradient?: string;
  glowColor: string;
  showSegments?: boolean;
  shimmer?: boolean;
}

export function CyberStatBar({
  value,
  max = 100,
  color,
  gradient: explicitGradient,
  glowColor,
  showSegments = true,
  shimmer = false,
}: CyberStatBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isLow = value / max < 0.3;
  const isCritical = value / max < 0.15;

  /* Detect if `color` is already a gradient (starts with 'linear' or 'radial') */
  const isGradientColor = /^linear|^radial|^conic/.test(color.trim());

  const lowClass = isLow
    ? color.includes('#ef4444') || color.includes('red') || color.includes('#f87171')
      ? 'low-bar-pulse'
      : 'low-bar-pulse-amber'
    : '';

  /* Use explicit gradient if provided, or auto-generate from hex color */
  const gradientFill = explicitGradient
    ? explicitGradient
    : isGradientColor
      ? color
      : `linear-gradient(90deg, ${color}cc 0%, ${color} 40%, ${color}ee 100%)`;

  return (
    <div
      className={`relative h-2.5 bg-slate-800/80 rounded-full overflow-hidden ${lowClass} ${shimmer ? 'stat-shimmer' : ''} stat-bar-shimmer-effect`}
      style={{ 
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), 0 0 8px rgba(0,0,0,0.3), 0 0 16px ' + glowColor + (isCritical ? '' : '15'),
      }}
    >
      {showSegments && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[25, 50, 75].map((mark) => (
            <div
              key={mark}
              className="absolute top-0 bottom-0 w-px bg-slate-700/50 stat-bar-segment-glow"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      )}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: gradientFill,
          boxShadow: `0 0 12px ${glowColor}, 0 0 4px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)`,
        }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2.5, ease: 'linear' }}
        />
      </motion.div>
      {/* Critical state: red edge glow */}
      {isCritical && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 6px rgba(255,50,50,0.3), 0 0 8px rgba(255,50,50,0.15)',
          }}
        />
      )}
      {/* Top highlight line with enhanced glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px rounded-t-full pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${glowColor}40 30%, rgba(255,255,255,0.15) 50%, ${glowColor}40 70%, transparent 100%)`,
        }}
      />
    </div>
  );
}
