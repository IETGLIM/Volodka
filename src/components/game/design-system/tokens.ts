/** Shared visual tokens — re-export cyber palette; use CSS vars for alpha in styles. */
import { CYBERPUNK_COLORS, CYBER_CYAN, CYBER_MATRIX } from '@/shared/constants/cyberPalette';

export const GAME_COLORS = {
  matrixGreen: CYBER_MATRIX,
  neonCyan: CYBER_CYAN,
  amberGold: CYBERPUNK_COLORS.amberGold,
  deepCrimson: CYBERPUNK_COLORS.deepCrimson,
  mutedOlive: CYBERPUNK_COLORS.mutedOlive,
  slateMuted: 'rgba(148, 163, 184, 0.65)',
} as const;

export type GameAccent = 'cyan' | 'emerald' | 'amber' | 'fuchsia';

export const ACCENT_STYLES: Record<
  GameAccent,
  { border: string; glow: string; headerBg: string; dotColor: string; textGlow: string }
> = {
  cyan: {
    border: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
    glow: 'rgb(var(--cyber-cyan-rgb) / 0.06)',
    headerBg: 'rgb(var(--cyber-cyan-rgb) / 0.04)',
    dotColor: 'rgb(var(--cyber-cyan-rgb) / 0.30)',
    textGlow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
  },
  emerald: {
    border: 'rgba(52,211,153,0.25)',
    glow: 'rgba(52,211,153,0.06)',
    headerBg: 'rgba(52,211,153,0.04)',
    dotColor: 'rgba(52,211,153,0.30)',
    textGlow: '0 0 8px rgba(52,211,153,0.3)',
  },
  amber: {
    border: 'rgba(251,191,36,0.25)',
    glow: 'rgba(251,191,36,0.06)',
    headerBg: 'rgba(251,191,36,0.04)',
    dotColor: 'rgba(251,191,36,0.30)',
    textGlow: '0 0 8px rgba(251,191,36,0.3)',
  },
  fuchsia: {
    border: 'rgba(217,70,239,0.25)',
    glow: 'rgba(217,70,239,0.06)',
    headerBg: 'rgba(217,70,239,0.04)',
    dotColor: 'rgba(217,70,239,0.30)',
    textGlow: '0 0 8px rgba(217,70,239,0.3)',
  },
};

export const GAME_TYPOGRAPHY = {
  mono: 'ui-monospace, "JetBrains Mono", "Geist Mono", monospace',
  label: 'text-xs tracking-wide font-mono uppercase',
  terminalPath: 'text-[9px] uppercase tracking-[0.2em] font-mono',
} as const;
