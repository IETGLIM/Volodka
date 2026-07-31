import { toastManager } from '@/engine/ToastManager';
import {
  buildEnergyToastMessage,
  buildKarmaToastMessage,
  buildSkillToastMessage,
  buildStressToastMessage,
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

// showPoemToast / showQuestToast deleted — poem discovery owns PoemRevealHost;
// quest copy owns QuestNotificationSystem. Do not reintroduce mirror APIs.
