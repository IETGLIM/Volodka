/* ─── Volodka RPG – floating text visual tokens ─── */

import type { FloatingTextType } from './floatingTextTypes';

export const TYPE_COLORS: Record<FloatingTextType, string> = {
  xp: '#fbbf24',
  karma: 'var(--cyber-cyan)',
  skill: '#a78bfa',
  damage: '#f43f5e',
  heal: '#34d399',
  item: '#f59e0b',
  stress: '#fb923c',
  energy: '#4ade80',
  levelup: '#fbbf24',
  credits: '#fcd34d',
  custom: '#94a3b8',
};

export const TYPE_GLOW: Record<FloatingTextType, string> = {
  xp: '0 0 12px rgba(251,191,36,0.6)',
  karma: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.6)',
  skill: '0 0 12px rgba(167,139,250,0.6)',
  damage: '0 0 12px rgba(244,63,94,0.6)',
  heal: '0 0 12px rgba(52,211,153,0.6)',
  item: '0 0 12px rgba(245,158,11,0.6)',
  stress: '0 0 12px rgba(251,146,60,0.6)',
  energy: '0 0 12px rgba(74,222,128,0.6)',
  levelup: '0 0 20px rgba(251,191,36,0.8), 0 0 40px rgba(251,191,36,0.4)',
  credits: '0 0 12px rgba(252,211,77,0.6)',
  custom: '0 0 8px rgba(148,163,184,0.4)',
};

export const TYPE_PREFIX: Record<FloatingTextType, string> = {
  xp: '+',
  karma: '+',
  skill: '+',
  damage: '-',
  heal: '+',
  item: '📦 ',
  stress: '+',
  energy: '+',
  levelup: '⬆ ',
  credits: '+',
  custom: '',
};
