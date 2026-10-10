/* ─── Volodka RPG – floating text visual tokens ─── */

import type { FloatingTextType } from './floatingTextTypes';

export const TYPE_COLORS: Record<FloatingTextType, string> = {
  xp: '#e2a84b',
  karma: 'var(--cyber-cyan)',
  skill: '#8d7fb5',
  damage: '#c65548',
  heal: '#57a874',
  item: '#e2a84b',
  stress: '#e2a84b',
  energy: '#46b96e',
  levelup: '#e2a84b',
  credits: '#e2a84b',
  custom: '#94a3b8',
};

export const TYPE_GLOW: Record<FloatingTextType, string> = {
  xp: '0 0 12px rgba(226,168,75,0.6)',
  karma: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.6)',
  skill: '0 0 12px rgba(167,139,250,0.6)',
  damage: '0 0 12px rgba(198,85,72,0.6)',
  heal: '0 0 12px rgba(70,185,110,0.6)',
  item: '0 0 12px rgba(226,168,75,0.6)',
  stress: '0 0 12px rgba(226,168,75,0.6)',
  energy: '0 0 12px rgba(70,185,110,0.6)',
  levelup: '0 0 20px rgba(226,168,75,0.8), 0 0 40px rgba(226,168,75,0.4)',
  credits: '0 0 12px rgba(226,168,75,0.6)',
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
