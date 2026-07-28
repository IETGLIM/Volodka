/* ─── Notification toast convenience helpers ─── */

import { toastManager } from '@/engine/ToastManager';
import type { TrainablePlayerSkill } from '@/shared/types/game';

const SKILL_NAMES: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Программирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

export function showKarmaToast(delta: number) {
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('karma', `Карма ${sign}${delta}`, delta);
}

export function showEnergyToast(delta: number) {
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('energy', `Энергия ${sign}${delta}`, delta);
}

export function showStressToast(delta: number) {
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('stress', `Стресс ${sign}${delta}`, delta);
}

export function showSkillToast(skill: TrainablePlayerSkill, delta: number) {
  const name = SKILL_NAMES[skill] ?? skill;
  const sign = delta > 0 ? '+' : '';
  toastManager.addToast('skill', `Навык: ${name} ${sign}${delta}`, delta);
}

export function showPoemToast(title: string) {
  toastManager.addToast('poem', `Стих собран: ${title}`);
}

export function showQuestToast(text: string) {
  toastManager.addToast('quest', text);
}
