import type { PlayerSkills } from '@/data/types';

const SKILL_NAMES_RU: Partial<Record<keyof PlayerSkills, string>> = {
  writing: 'Письмо',
  perception: 'Восприятие',
  empathy: 'Эмпатия',
  imagination: 'Воображение',
  logic: 'Логика',
  coding: 'Код',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  resilience: 'Стойкость',
  introspection: 'Самоанализ',
  skillPoints: 'Очки навыков',
};

/** Грубая оценка без точных процентов: бросок skill ±10 против порога */
export function getSkillCheckTier(skillValue: number, difficulty: number): 'very_low' | 'low' | 'mid' | 'high' {
  const margin = skillValue - difficulty;
  if (margin <= -8) return 'very_low';
  if (margin <= -3) return 'low';
  if (margin <= 4) return 'mid';
  return 'high';
}

const TIER_LABEL: Record<ReturnType<typeof getSkillCheckTier>, string> = {
  very_low: 'шансы очень низкие',
  low: 'шансы низкие',
  mid: 'шансы средние',
  high: 'шансы высокие',
};

export function formatSkillCheckHint(skill: keyof PlayerSkills, difficulty: number, skills: PlayerSkills): string {
  const value = (skills[skill] as number) ?? 0;
  const name = SKILL_NAMES_RU[skill] ?? String(skill);
  const tier = TIER_LABEL[getSkillCheckTier(value, difficulty)];
  return `${name} · порог ${difficulty} · ${tier}`;
}
