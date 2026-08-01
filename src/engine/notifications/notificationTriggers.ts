/* ─── Volodka RPG – Gameplay Notification Triggers ───
   High-level helper functions for game systems to fire toast
   notifications without reaching into toastManager directly.

   These wrap the low-level show*Toast() APIs from notificationToastApi
   with game-contextual message builders. */

import { toastManager } from '@/engine/ToastManager';
import {
  buildAchievementToastMessage,
  buildKarmaChangeToastMessage,
  buildLoreToastMessage,
  buildPoemDiscoveredToastMessage,
  buildQuestUpdateToastMessage,
  buildWarningToastMessage,
} from '@/engine/toast/notificationToastPresentation';

/** Fire a quest update toast (e.g. new objective, stage advanced). */
export function notifyQuestUpdate(title: string, message: string): void {
  toastManager.addToast('quest', buildQuestUpdateToastMessage(title, message));
}

/** Fire an achievement unlocked toast. */
export function notifyAchievement(title: string, message?: string): void {
  toastManager.addToast('achievement', buildAchievementToastMessage(title, message));
}

/** Fire a poem discovered toast. */
export function notifyPoemDiscovered(poemTitle: string): void {
  toastManager.addToast('poem', buildPoemDiscoveredToastMessage(poemTitle));
}

/** Fire a lore entry discovered toast. */
export function notifyLoreDiscovered(loreTitle: string): void {
  toastManager.addToast('lore', buildLoreToastMessage(loreTitle));
}

/** Fire a karma change toast with directional sign. */
export function notifyKarmaChange(direction: 'up' | 'down', amount: number): void {
  const delta = direction === 'up' ? amount : -amount;
  toastManager.addToast('karma', buildKarmaChangeToastMessage(direction, amount), delta);
}

/** Fire a generic system info toast. */
export function notifySystem(message: string): void {
  toastManager.addToast('system', message);
}

/** Fire a warning toast (e.g. low energy, danger zone). */
export function notifyWarning(message: string): void {
  toastManager.addToast('warning', buildWarningToastMessage(message));
}
