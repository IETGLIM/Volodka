/* ─── Volodka RPG – Karma Tier Badge ───
   Small animated badge showing the current karma tier label
   in the top bar. Uses getKarmaTierLabel and color-codes
   based on karma value. Breathing glow animation.
*/

import { motion } from 'framer-motion';
import { getKarmaTierLabel, getKarmaTier, type KarmaTier } from '@/shared/utils/karmaTier';

const TIER_STYLES: Record<KarmaTier, {
  color: string;
  brightColor: string;
  alpha: string;
  alphaDim: string;
  icon: string;
}> = {
  positive: {
    color: 'var(--cyber-cyan)',
    brightColor: '#67e8f9',
    alpha: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
    alphaDim: 'rgb(var(--cyber-cyan-rgb) / 0.1)',
    icon: '✦',
  },
  neutral: {
    color: '#fbbf24',
    brightColor: '#fcd34d',
    alpha: 'rgba(251, 191, 36, 0.25)',
    alphaDim: 'rgba(251, 191, 36, 0.1)',
    icon: '◆',
  },
  negative: {
    color: '#fb7185',
    brightColor: '#fda4af',
    alpha: 'rgba(251, 113, 133, 0.25)',
    alphaDim: 'rgba(251, 113, 133, 0.1)',
    icon: '✧',
  },
};

export function KarmaTierBadge({ karma }: { karma: number }) {
  const tier = getKarmaTier(karma);
  const label = getKarmaTierLabel(karma);
  const style = TIER_STYLES[tier];

  return (
    <motion.div
      className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-mono font-medium tracking-wider uppercase karma-tier-badge-glow select-none"
      style={{
        '--karma-tier-color': style.color,
        '--karma-tier-color-bright': style.brightColor,
        '--karma-tier-color-alpha': style.alpha,
        '--karma-tier-color-alpha-dim': style.alphaDim,
        color: style.color,
        background: `${style.alphaDim}`,
        textShadow: `0 0 6px ${style.alpha}`,
      } as React.CSSProperties}
      title={`Карма: ${karma} — ${label}`}
      aria-label={`Карма: ${label}`}
      initial={false}
      animate={{
        borderColor: [`${style.alpha}40`, `${style.alpha}`, `${style.alpha}40`],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <span aria-hidden="true" style={{ fontSize: '8px' }}>{style.icon}</span>
      <span>{label}</span>
    </motion.div>
  );
}