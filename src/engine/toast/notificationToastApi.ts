import { toastManager } from '@/engine/ToastManager';
import {
  buildAchievementToastMessage,
  buildEnergyToastMessage,
  buildKarmaToastMessage,
  buildLoreToastMessage,
  buildSkillToastMessage,
  buildStressToastMessage,
  buildSystemToastMessage,
  buildWarningToastMessage,
} from '@/engine/toast/notificationToastPresentation';
import type { TrainablePlayerSkill } from '@/shared/types/game';

export function showKarmaToast(delta: number): void {
  toastManager.addToast('karma', buildKarmaToastMessage(delta), delta);
}

export function showEnergyToast(delta: number): void {
  toastManager.addToast('energy', buildEnergyToastMessage(delta), delta);
}

export function showStressToast(delta: number): void {
  toastManager.addToast('stress', buildStressToastMessage(delta), delta);
}

export function showSkillToast(skill: TrainablePlayerSkill, delta: number): void {
  toastManager.addToast('skill', buildSkillToastMessage(skill, delta), delta);
}

export function showAchievementToast(title: string, message?: string): void {
  toastManager.addToast('achievement', buildAchievementToastMessage(title, message));
}

export function showLoreToast(loreTitle: string): void {
  toastManager.addToast('lore', buildLoreToastMessage(loreTitle));
}

export function showSystemToast(message: string): void {
  toastManager.addToast('system', buildSystemToastMessage(message));
}

export function showWarningToast(message: string): void {
  toastManager.addToast('warning', buildWarningToastMessage(message));
}

// showPoemToast / showQuestToast deleted — poem discovery owns PoemRevealHost;
// quest copy owns QuestNotificationSystem. Do not reintroduce mirror APIs.
