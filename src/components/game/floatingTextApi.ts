/* ─── Floating text imperative API (pool + helpers) ─── */

export type FloatingTextType =
  | 'xp'
  | 'karma'
  | 'skill'
  | 'damage'
  | 'heal'
  | 'item'
  | 'stress'
  | 'energy'
  | 'levelup'
  | 'credits'
  | 'custom';

export interface FloatingTextEntry {
  id: number;
  text: string;
  type: FloatingTextType;
  x: number;
  y: number;
  createdAt: number;
  /** Pre-computed random X offset to avoid Math.random() in render (hydration) */
  animateOffsetX: number;
}

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

export const MAX_POOL_SIZE = 15;
export const TEXT_LIFETIME = 1800;

let nextId = 0;
export const floatingTextPool: FloatingTextEntry[] = [];
export const floatingTextListeners = new Set<() => void>();

function notifyListeners() {
  for (const fn of floatingTextListeners) fn();
}

export function spawnFloatingText(
  text: string,
  type: FloatingTextType = 'custom',
  x?: number,
  y?: number,
) {
  const entry: FloatingTextEntry = {
    id: nextId++,
    text,
    type,
    x: x ?? (window.innerWidth / 2 + (Math.random() - 0.5) * 120),
    y: y ?? (window.innerHeight * 0.35 + (Math.random() - 0.5) * 60),
    createdAt: Date.now(),
    animateOffsetX: (Math.random() - 0.5) * 20,
  };

  floatingTextPool.push(entry);

  while (floatingTextPool.length > MAX_POOL_SIZE) {
    floatingTextPool.shift();
  }

  notifyListeners();
}

export const floatXP = (amount: number) => spawnFloatingText(`${amount} XP`, 'xp');
export const floatKarma = (amount: number) =>
  spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Карма`, 'karma');
export const floatSkill = (skill: string, amount: number) =>
  spawnFloatingText(`${skill} +${amount}`, 'skill');
export const floatDamage = (amount: number) => spawnFloatingText(`${amount}`, 'damage');
export const floatHeal = (amount: number) => spawnFloatingText(`+${amount}`, 'heal');
export const floatItem = (name: string) => spawnFloatingText(name, 'item');
export const floatStress = (amount: number) =>
  spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Стресс`, 'stress');
export const floatEnergy = (amount: number) =>
  spawnFloatingText(`${amount > 0 ? '+' : ''}${amount} Энергия`, 'energy');
export const floatLevelUp = (level: number) =>
  spawnFloatingText(`Уровень ${level}!`, 'levelup');
export const floatCredits = (amount: number) =>
  spawnFloatingText(`${amount} кредитов`, 'credits');

export function notifyFloatingTextListeners() {
  notifyListeners();
}
