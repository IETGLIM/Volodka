import { eventBus } from '@/engine/EventBus';
import { getAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
import { isMainPoemId } from '@/data/poemCollectionMeta';
import {
  activatePoemPowerById,
  canUsePower,
  getPoemPower,
} from '@/engine/PoemPowerSystem';

export type PoemPowerActivationContext = 'exploration' | 'combat';

export type PoemPowerActivationResult =
  | { status: 'activated' }
  | { status: 'cutscene_pending' }
  | { status: 'failed'; reason: 'unavailable' | 'unknown' | 'cutscene_busy' };

const sessionReadPoems = new Set<string>();
let pendingPoemId: string | null = null;

export function resetPoemReadingSession(): void {
  sessionReadPoems.clear();
  pendingPoemId = null;
}

export function getPendingPoemReadingId(): string | null {
  return pendingPoemId;
}

export function hasReadPoemThisSession(poemId: string): boolean {
  return sessionReadPoems.has(poemId);
}

/** Whether the full reading ritual should be skipped for this poem. */
export function shouldSkipPoemReadingCutscene(poemId: string): boolean {
  if (getAccessibilitySettings().skipPoemCutscenes) return true;
  if (sessionReadPoems.has(poemId)) return true;
  if (!isMainPoemId(poemId)) return true;
  return false;
}

function activateDirect(poemId: string): PoemPowerActivationResult {
  const ok = activatePoemPowerById(poemId);
  if (!ok) {
    return { status: 'failed', reason: 'unavailable' };
  }
  sessionReadPoems.add(poemId);
  return { status: 'activated' };
}

/**
 * Request poem power activation — main story poems play PoemReadingCutscene first.
 * Combat and skip conditions apply the power immediately.
 */
export function requestPoemPowerActivation(
  poemId: string,
  context: PoemPowerActivationContext = 'exploration',
): PoemPowerActivationResult {
  const power = getPoemPower(poemId);
  if (!power) {
    return { status: 'failed', reason: 'unknown' };
  }
  if (!canUsePower(poemId)) {
    return { status: 'failed', reason: 'unavailable' };
  }

  if (context === 'combat' || shouldSkipPoemReadingCutscene(poemId)) {
    return activateDirect(poemId);
  }

  if (pendingPoemId) {
    return { status: 'failed', reason: 'cutscene_busy' };
  }

  pendingPoemId = poemId;
  eventBus.emit('poem:show_cutscene', { poemId });
  return { status: 'cutscene_pending' };
}

/** Called when PoemReadingCutscene finishes — applies power, synergy, and world event. */
export function completePoemReadingCutscene(poemId: string): boolean {
  pendingPoemId = null;
  sessionReadPoems.add(poemId);
  eventBus.emit('poem:cutscene_end', {});
  eventBus.emit('camera:poem_reading_end', {});
  return activatePoemPowerById(poemId);
}

/** Abort an in-flight reading ritual without activating the power. */
export function cancelPoemReadingCutscene(): void {
  pendingPoemId = null;
  eventBus.emit('poem:cutscene_end', {});
  eventBus.emit('camera:poem_reading_end', {});
}
