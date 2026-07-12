import { motion, AnimatePresence } from 'framer-motion';

interface StatPulseProps {
  active: boolean;
  color?: 'cyan' | 'emerald' | 'rose' | 'amber';
}

const COLOR_MAP = {
  cyan: 'bg-cyan-400/30',
  emerald: 'bg-emerald-400/30',
  rose: 'bg-rose-400/30',
  amber: 'bg-amber-400/30',
} as const;

const GLOW_MAP = {
  cyan: 'shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.5)]',
  emerald: 'shadow-[0_0_8px_rgba(52,211,153,0.5)]',
  rose: 'shadow-[0_0_8px_rgba(251,113,133,0.5)]',
  amber: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]',
} as const;

export function StatPulse({ active, color = 'cyan' }: StatPulseProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 rounded-full ${COLOR_MAP[color]} ${GLOW_MAP[color]} pointer-events-none`}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
