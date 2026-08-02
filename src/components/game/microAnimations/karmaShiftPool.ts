/* ─── Volodka RPG – Karma Shift Pool ───
 * Notification pool for karma-shift popups. Each entry represents a discrete
 * karma delta that should be announced via the KarmaShiftIndicator.
 *
 * Pattern mirrors statChangePool / itemGainedPool: stable snapshot via
 * useSyncExternalStore, TTL-bounded, max-size capped, auto-cleanup interval.
 */

import {
  KARMA_SHIFT_CLEANUP_INTERVAL_MS,
  KARMA_SHIFT_MAX,
  KARMA_SHIFT_TTL_MS,
} from '@/engine/microAnimations/microAnimationsConstants';
import { createNotificationPoolStore } from '@/hooks/useNotificationPool';

export type KarmaShiftEntry = {
  id: number;
  createdAt: number;
  delta: number;
  currentKarma: number;
};

const POOL_OPTIONS = {
  ttlMs: KARMA_SHIFT_TTL_MS,
  maxSize: KARMA_SHIFT_MAX,
  cleanupIntervalMs: KARMA_SHIFT_CLEANUP_INTERVAL_MS,
} as const;

export const karmaShiftPool = createNotificationPoolStore<KarmaShiftEntry>();

/**
 * Push a karma-shift entry to the pool. The KarmaShiftLayer renders each entry
 * as a KarmaShiftIndicator that auto-dismisses after KARMA_SHIFT_TTL_MS.
 */
export function showKarmaShift(delta: number, currentKarma: number): void {
  if (delta === 0) return;
  karmaShiftPool.push({ delta, currentKarma }, POOL_OPTIONS);
}
