import type { ToastMessage, ToastType } from '@/engine/ToastManager';
import {
  NOTIFICATION_TOAST_MAX_VISIBLE,
  NOTIFICATION_TOAST_PREV_STORE_ID_CAP,
  NOTIFICATION_TOAST_SHOWN_ID_CAP,
  SKILL_DISPLAY_NAMES,
  TOAST_TYPE_LABELS,
} from '@/engine/toast/notificationToastConstants';
import type { GamePhase } from '@/shared/gamePhase';
import type { TransitionDirectorPhase } from '@/engine/scene/TransitionDirector';
import type { GameNotification, NotificationType } from '@/shared/types/notifications';
import type { TrainablePlayerSkill } from '@/shared/types/game';

export type VisibleNotificationToast = {
  id: string;
  type: ToastType;
  message: string;
  delta?: number;
  timestamp: number;
};

const NOTIFICATION_TYPE_TO_TOAST = {
  karma: 'karma',
  energy: 'energy',
  stress: 'stress',
  skill: 'skill',
  poem: 'poem',
  quest: 'quest',
  crafting: 'crafting',
  achievement: 'achievement',
  lore: 'lore',
  system: 'system',
  warning: 'warning',
} as const satisfies Record<NotificationType, ToastType>;

export function mapNotificationTypeToToast(type: NotificationType): ToastType {
  return NOTIFICATION_TYPE_TO_TOAST[type];
}

export function trimIdSet(ids: Set<string>, cap: number): void {
  if (ids.size <= cap) return;
  const keep = Array.from(ids).slice(-cap);
  ids.clear();
  for (const id of keep) ids.add(id);
}

export function canAcceptNotificationToasts(
  mode: GamePhase,
  transitionPhase: TransitionDirectorPhase,
  options?: { exclusiveInterstitialActive?: boolean },
): boolean {
  if (mode === 'menu' || mode === 'intro') return false;
  if (transitionPhase === 'loading') return false;
  if (options?.exclusiveInterstitialActive) return false;
  return true;
}

/**
 * Store notification types that own a richer exclusive UI / dedicated channel.
 * NotificationToasts must not mirror them (same anti-pattern as quest cards).
 */
export function shouldSuppressStoreNotificationToast(type: NotificationType): boolean {
  return type === 'quest' || type === 'poem';
}

export function shouldHideNotificationToastContainer(
  mode: GamePhase,
  transitionPhase: TransitionDirectorPhase,
  slotGranted: boolean,
  options?: { exclusiveInterstitialActive?: boolean },
): boolean {
  if (mode === 'menu' || mode === 'intro') return true;
  if (transitionPhase === 'loading') return true;
  if (options?.exclusiveInterstitialActive) return true;
  return !slotGranted;
}

export function appendToastIfNew(
  prev: VisibleNotificationToast[],
  toast: VisibleNotificationToast,
  shownIds: Set<string>,
  acceptNew: boolean,
): VisibleNotificationToast[] {
  if (!acceptNew) return prev;
  if (shownIds.has(toast.id)) return prev;
  shownIds.add(toast.id);
  trimIdSet(shownIds, NOTIFICATION_TOAST_SHOWN_ID_CAP);
  return [...prev, toast].slice(-NOTIFICATION_TOAST_MAX_VISIBLE);
}

export function toastMessageToVisible(msg: ToastMessage): VisibleNotificationToast {
  return {
    id: msg.id,
    type: msg.type,
    message: msg.message,
    delta: msg.delta,
    timestamp: msg.timestamp,
  };
}

export function storeNotificationToVisible(n: GameNotification): VisibleNotificationToast {
  return {
    id: `store-${n.id}`,
    type: mapNotificationTypeToToast(n.type),
    message: n.text,
    timestamp: n.timestamp,
  };
}

export function trimPrevStoreNotificationIds(ids: Set<string>): void {
  trimIdSet(ids, NOTIFICATION_TOAST_PREV_STORE_ID_CAP);
}

export function formatToastDelta(delta: number | undefined): string | null {
  if (delta === undefined) return null;
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function buildToastAccessibleLabel(type: ToastType, message: string): string {
  const typeLabel = TOAST_TYPE_LABELS[type];
  return `${typeLabel}: ${message}`;
}

export function buildPoemPowerToastMessage(powerName: string): string {
  return `Способность: ${powerName}`;
}

export function buildCombatDefeatToastMessage(energyLost: number): string {
  return `Поражение: -${energyLost} энергии`;
}

export function buildQuestRewardToastMessage(questTitle: string, rewards: string[]): string {
  const rewardText = rewards.length > 0 ? rewards.join(', ') : 'нет';
  return `Награда за «${questTitle}»: ${rewardText}`;
}

export function buildKarmaToastMessage(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `Карма ${sign}${delta}`;
}

export function buildEnergyToastMessage(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `Энергия ${sign}${delta}`;
}

export function buildStressToastMessage(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `Стресс ${sign}${delta}`;
}

export function buildSkillToastMessage(skill: TrainablePlayerSkill, delta: number): string {
  const name = SKILL_DISPLAY_NAMES[skill] ?? skill;
  const sign = delta > 0 ? '+' : '';
  return `Навык: ${name} ${sign}${delta}`;
}

export function buildAchievementToastMessage(title: string, message?: string): string {
  return message ? `★ ${title}: ${message}` : `★ ${title}`;
}

export function buildLoreToastMessage(loreTitle: string): string {
  return `◆ Лор: ${loreTitle}`;
}

export function buildSystemToastMessage(message: string): string {
  return message;
}

export function buildWarningToastMessage(message: string): string {
  return `▲ ${message}`;
}

export function buildQuestUpdateToastMessage(title: string, message: string): string {
  return `${title}: ${message}`;
}

export function buildPoemDiscoveredToastMessage(poemTitle: string): string {
  return `✒ Стих найден: ${poemTitle}`;
}

export function buildKarmaChangeToastMessage(direction: 'up' | 'down', amount: number): string {
  const sign = direction === 'up' ? '+' : '';
  return `Карма ${sign}${direction === 'up' ? amount : -amount}`;
}

export { buildPoemCollectedToastMessage } from '@/shared/notifications/poemCollectedMessage';

export function getToastItemMotion(reducedMotion: boolean): {
  initial: false | { x: number; opacity: number; scale: number };
  animate: { x?: number; opacity: number; scale?: number };
  exit: { x?: number; opacity: number; scale?: number; transition?: { duration: number } };
  transition: { duration: number } | { type: 'spring'; damping: number; stiffness: number };
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1 },
      exit: { opacity: 0, transition: { duration: 0 } },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { x: 120, opacity: 0, scale: 0.9 },
    animate: { x: 0, opacity: 1, scale: 1 },
    exit: { x: 80, opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
    transition: { type: 'spring', damping: 24, stiffness: 300 },
  };
}
