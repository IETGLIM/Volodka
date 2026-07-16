import type { ToastType } from '@/engine/ToastManager';
import type { TrainablePlayerSkill } from '@/shared/types/game';

export const NOTIFICATION_TOAST_MAX_VISIBLE = 5;
export const NOTIFICATION_TOAST_AUTO_DISMISS_MS = 4000;
export const NOTIFICATION_TOAST_SHOWN_ID_CAP = 40;
export const NOTIFICATION_TOAST_PREV_STORE_ID_CAP = 20;

export const SKILL_DISPLAY_NAMES: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Программирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

export const TOAST_TYPE_LABELS: Record<ToastType, string> = {
  karma: 'Карма',
  energy: 'Энергия',
  stress: 'Стресс',
  skill: 'Навык',
  poem: 'Стих',
  quest: 'Квест',
  crafting: 'Крафт',
};

export type NotificationToastStyleConfig = {
  icon: string;
  /** Screen-reader label for decorative icon */
  iconLabel: string;
};

export const NOTIFICATION_TOAST_ICONS: Record<ToastType, NotificationToastStyleConfig> = {
  karma: { icon: '☯', iconLabel: 'Карма' },
  energy: { icon: '⚡', iconLabel: 'Энергия' },
  stress: { icon: '⚠', iconLabel: 'Стресс' },
  skill: { icon: '✦', iconLabel: 'Навык' },
  poem: { icon: '✒', iconLabel: 'Стих' },
  quest: { icon: '⚑', iconLabel: 'Квест' },
  crafting: { icon: '⚒', iconLabel: 'Крафт' },
};
