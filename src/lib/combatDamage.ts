import type { PlayerSkills } from '@/data/types';

/** Прототип боя: урон от логики, кода и интуиции (анимации не требуются). */
export function rollStrikeDamage(skills: PlayerSkills): number {
  const base = 5 + skills.logic * 0.12 + skills.coding * 0.1 + skills.intuition * 0.08;
  const spread = 1 + Math.random() * 4;
  return Math.max(1, Math.round(base + spread));
}
