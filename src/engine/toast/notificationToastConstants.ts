import type { ToastType } from '@/engine/ToastManager';
import type { TrainablePlayerSkill } from '@/shared/types/game';
import { t } from '@/i18n';

export const NOTIFICATION_TOAST_MAX_VISIBLE = 5;
export const NOTIFICATION_TOAST_AUTO_DISMISS_MS = 4000;
export const NOTIFICATION_TOAST_SHOWN_ID_CAP = 40;
export const NOTIFICATION_TOAST_PREV_STORE_ID_CAP = 20;

export const SKILL_DISPLAY_NAMES: Record<TrainablePlayerSkill, string> = {
  logic: t('hud.skill.name.logic', 'Логика'),
  coding: t('hud.skill.name.coding', 'Программирование'),
  empathy: t('hud.skill.name.empathy', 'Эмпатия'),
  persuasion: t('hud.skill.name.persuasion', 'Убеждение'),
  intuition: t('hud.skill.name.intuition', 'Интуиция'),
  writing: t('hud.skill.name.writing', 'Письмо'),
  rhythm: t('hud.skill.name.rhythm', 'Ритм'),
};

export const TOAST_TYPE_LABELS: Record<ToastType, string> = {
  karma: t('hud.toast.type.karma', 'Карма'),
  energy: t('hud.toast.type.energy', 'Энергия'),
  stress: t('hud.toast.type.stress', 'Стресс'),
  skill: t('hud.toast.type.skill', 'Навык'),
  poem: t('hud.toast.type.poem', 'Стих'),
  quest: t('hud.toast.type.quest', 'Квест'),
  crafting: t('hud.toast.type.crafting', 'Крафт'),
  item: t('hud.toast.type.item', 'Предмет'),
  achievement: t('hud.toast.type.achievement', 'Достижение'),
};

export type NotificationToastStyleConfig = {
  icon: string;
  /** Screen-reader label for decorative icon */
  iconLabel: string;
  /** Special CSS class for golden achievement styling */
  variant?: 'default' | 'golden';
};

export const NOTIFICATION_TOAST_ICONS: Record<ToastType, NotificationToastStyleConfig> = {
  karma: { icon: '☯', iconLabel: t('hud.toast.icon.karma', 'Карма') },
  energy: { icon: '⚡', iconLabel: t('hud.toast.icon.energy', 'Энергия') },
  stress: { icon: '⚠', iconLabel: t('hud.toast.icon.stress', 'Стресс') },
  skill: { icon: '✦', iconLabel: t('hud.toast.icon.skill', 'Навык') },
  poem: { icon: '✒', iconLabel: t('hud.toast.icon.poem', 'Стих') },
  quest: { icon: '⚑', iconLabel: t('hud.toast.icon.quest', 'Квест') },
  crafting: { icon: '⚒', iconLabel: t('hud.toast.icon.crafting', 'Крафт') },
  item: { icon: '◆', iconLabel: t('hud.toast.icon.item', 'Предмет') },
  achievement: { icon: '★', iconLabel: t('hud.toast.icon.achievement', 'Достижение'), variant: 'golden' },
};
