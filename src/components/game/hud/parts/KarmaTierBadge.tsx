/* ─── Volodka RPG – Karma Tier Badge ───
   Small animated badge showing the current karma tier label
   in the top bar. Uses getKarmaTierLabel and color-codes
   based on karma value. Breathing glow animation.
*/

import { motion } from 'framer-motion';
import { getKarmaTierLabel, getKarmaTier, type KarmaTier } from '@/shared/utils/karmaTier';
import { uiTextScaledPx } from '@/engine/accessibility/uiTextScaleCss';

const TIER_STYLES: Record<KarmaTier, {
  color: string;
  brightColor: string;
  alpha: string;
  alphaDim: string;
  icon: string;
}> = {
  positive: {
    color: 'var(--cyber-cyan)',
    brightColor: '#9db3c8',
    alpha: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
    alphaDim: 'rgb(var(--cyber-cyan-rgb) / 0.1)',
    icon: '✦',
  },
  neutral: {
    color: '#e2a84b',
    brightColor: '#e2a84b',
    alpha: 'rgba(226, 168, 75, 0.25)',
    alphaDim: 'rgba(226, 168, 75, 0.1)',
    icon: '◆',
  },
  negative: {
    color: '#c65548',
    brightColor: '#dd9088',
    alpha: 'rgba(198, 85, 72, 0.25)',
    alphaDim: 'rgba(198, 85, 72, 0.1)',
    icon: '✧',
  },
};

export function KarmaTierBadge({ karma }: { karma: number }) {
  const tier = getKarmaTier(karma);
  const label = getKarmaTierLabel(karma);
  const style = TIER_STYLES[tier];

  return (
    <motion.div
      className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-mono font-medium tracking-wider uppercase karma-tier-badge-glow hud-filmic-badge-tier-settle select-none"
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
      <span aria-hidden="true" style={{ fontSize: uiTextScaledPx(8) }}>{style.icon}</span>
      <span>{label}</span>
    </motion.div>
  );
}