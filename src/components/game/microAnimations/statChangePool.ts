import {
  STAT_CHANGE_CLEANUP_INTERVAL_MS,
  STAT_CHANGE_MAX,
  STAT_CHANGE_TTL_MS,
} from '@/engine/microAnimations/microAnimationsConstants';
import { computeStatChangePosition } from '@/engine/microAnimations/microAnimationsPresentation';
import { createNotificationPoolStore } from '@/hooks/useNotificationPool';

export type StatChangeEntry = {
  id: number;
  statName: string;
  value: number;
  color?: string;
  x: number;
  y: number;
  createdAt: number;
};

export type StatChangeAnchor = {
  x: number;
  y: number;
};

const POOL_OPTIONS = {
  ttlMs: STAT_CHANGE_TTL_MS,
  maxSize: STAT_CHANGE_MAX,
  cleanupIntervalMs: STAT_CHANGE_CLEANUP_INTERVAL_MS,
} as const;

export const statChangePool = createNotificationPoolStore<StatChangeEntry>();

export function showStatChange(
  statName: string,
  value: number,
  color?: string,
  anchor?: StatChangeAnchor,
): void {
  const stackIndex = statChangePool.getSnapshot().length;
  const position = anchor ?? computeStatChangePosition(stackIndex);
  statChangePool.push(
    { statName, value, color, x: position.x, y: position.y },
    POOL_OPTIONS,
  );
}
