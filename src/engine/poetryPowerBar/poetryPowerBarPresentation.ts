import type { Transition } from 'framer-motion';
import type { PoemPower } from '@/engine/PoemPowerSystem';
import {
  canUsePower,
  getPoemPower,
} from '@/engine/PoemPowerSystem';
import {
  requestPoemPowerActivation,
  type PoemPowerActivationResult,
} from '@/engine/poemReading/poemReadingOrchestrator';
import {
  POETRY_POWER_BAR_LABELS,
  POETRY_POWER_BAR_MAX_SLOTS,
} from '@/engine/poetryPowerBar/poetryPowerBarConstants';

export type CollectedPowerEntry = {
  poemId: string;
  power: PoemPower;
};

export type AttemptPoemPowerActivationResult =
  | { ok: true; power: PoemPower; pendingCutscene?: boolean }
  | { ok: false; reason: 'unavailable' | 'unknown' | 'cutscene_busy' };

export function buildCollectedWithPowers(collectedPoems: readonly string[]): CollectedPowerEntry[] {
  return collectedPoems
    .map((poemId) => {
      const power = getPoemPower(poemId);
      return power ? { poemId, power } : null;
    })
    .filter((entry): entry is CollectedPowerEntry => entry !== null);
}

export function getDisplayPowers(entries: CollectedPowerEntry[]): CollectedPowerEntry[] {
  return entries;
}

export function getEmptySlotCount(displayCount: number): number {
  return Math.max(0, POETRY_POWER_BAR_MAX_SLOTS - displayCount);
}

export function getShortcutKey(slotIndex: number): string | null {
  if (slotIndex < 0 || slotIndex >= POETRY_POWER_BAR_MAX_SLOTS) return null;
  return String(slotIndex + 1);
}

export function isPoemPowerAvailable(poemId: string): boolean {
  return canUsePower(poemId);
}

export function attemptPoemPowerActivation(poemId: string): AttemptPoemPowerActivationResult {
  const power = getPoemPower(poemId);
  if (!power) {
    return { ok: false, reason: 'unknown' };
  }
  if (!canUsePower(poemId)) {
    return { ok: false, reason: 'unavailable' };
  }
  const result: PoemPowerActivationResult = requestPoemPowerActivation(poemId);
  if (result.status === 'failed') {
    if (result.reason === 'cutscene_busy') {
      return { ok: false, reason: 'cutscene_busy' };
    }
    return { ok: false, reason: result.reason === 'unknown' ? 'unknown' : 'unavailable' };
  }
  if (result.status === 'cutscene_pending') {
    return { ok: true, power, pendingCutscene: true };
  }
  return { ok: true, power };
}

export function buildSlotTooltipReadyLine(shortcutKey: string | null): string {
  return shortcutKey
    ? POETRY_POWER_BAR_LABELS.readyWithShortcut(shortcutKey)
    : POETRY_POWER_BAR_LABELS.ready;
}

export function buildSlotTooltipCooldownLine(seconds: number): string {
  return POETRY_POWER_BAR_LABELS.cooldown(seconds);
}

export function buildActivatedAnnouncement(powerName: string): string {
  return POETRY_POWER_BAR_LABELS.activatedAnnouncement(powerName);
}

export function getBarEnterMotion(reducedMotion: boolean): {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y: number };
  exit: { opacity: number; y: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 0 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  };
}

export function getJustUsedPulseMotion(reducedMotion: boolean): {
  initial: false | { opacity: number; scale: number };
  animate: { opacity: number; scale: number };
  transition: Transition;
} {
  if (reducedMotion) {
    return {
      initial: false,
      animate: { opacity: 0, scale: 1 },
      transition: { duration: 0 },
    };
  }
  return {
    initial: { opacity: 0.8, scale: 1 },
    animate: { opacity: 0, scale: 1.3 },
    transition: { duration: 1.2, ease: 'easeOut' },
  };
}

export function truncatePowerDisplayName(name: string): string {
  return name.split(' ')[0] ?? name;
}
