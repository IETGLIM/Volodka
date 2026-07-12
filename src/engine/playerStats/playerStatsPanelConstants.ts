import type { TrainablePlayerSkill } from '@/shared/types/game';

export const PLAYER_STATS_PANEL_LABELS = {
  title: 'Статистика',
  closeAria: 'Закрыть панель статистики',
  openedAnnouncement: 'Панель статистики открыта',
  sectionAttributes: 'Атрибуты',
  sectionSkills: 'Навыки',
  sectionEffects: 'Эффекты',
  energy: 'Энергия',
  stress: 'Стресс',
  karma: 'Карма',
  level: 'УРОВЕНЬ',
  xpProgress: (xp: number, xpToNext: number) => `${xp}/${xpToNext} XP`,
  skillPoints: (points: number) => `+${points} очк.`,
  perkPoints: (points: number) => `+${points} черт.`,
  noEffects: 'Нет активных эффектов',
  hoursRemaining: (hours: number) => `${hours.toFixed(1)}ч`,
} as const;

export const PLAYER_STATS_SKILL_LABELS: Record<
  Exclude<TrainablePlayerSkill, 'rhythm'>,
  string
> = {
  logic: 'Логика',
  coding: 'Код',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
};

export const PLAYER_STATS_DISPLAY_SKILLS = [
  'logic',
  'coding',
  'empathy',
  'persuasion',
  'intuition',
  'writing',
] as const satisfies readonly Exclude<TrainablePlayerSkill, 'rhythm'>[];

/** Skill bar fill uses this as 100% reference in the stats panel grid. */
export const PLAYER_STATS_SKILL_BAR_MAX = 50;

export const PLAYER_STATS_VITALS_MAX = 100;
