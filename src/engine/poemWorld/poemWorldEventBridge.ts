import { eventBus } from '@/engine/EventBus';
import { dispatchGameAction } from '@/engine/GameActionDispatcher';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import { executePoemWorldVisuals } from '@/engine/poemWorld/executePoemWorldVisuals';
import {
  resolvePoemWorldEffect,
  resolvePoemWorldHintFlagKey,
  resolvePoemSynergyWorldEffect,
} from '@/engine/poemWorld/poemWorldEffectResolver';
import { ttlExpiryFromDurationMs } from '@/shared/ttlClock';
import { registerHmrDispose } from '@/shared/dev/hmrDispose';

let unsubWorldBridge: (() => void) | null = null;
let unsubSynergyBridge: (() => void) | null = null;

function upsertWorldHintFlag(poemId: string, hintKey: string, durationMs: number): void {
  dispatchGameAction({
    type: 'world/upsertHintFlag',
    flag: {
      key: hintKey,
      poemId,
      expiryTimestamp: ttlExpiryFromDurationMs(durationMs),
    },
  });
}

/** Bridge poem:power_used → poem:world_event (+ screen FX + narrative hint flags). */
export function emitPoemWorldEvent(poemId: string, powerName: string): void {
  const profile = resolvePoemWorldEffect(poemId);
  const reducedMotion = isEffectiveReducedMotion();

  executePoemWorldVisuals(profile, { reducedMotion });

  const hintKey = resolvePoemWorldHintFlagKey(profile.worldHint);
  if (hintKey) {
    upsertWorldHintFlag(poemId, hintKey, profile.durationMs);
  }

  eventBus.emit('poem:world_event', {
    poemId,
    powerName,
    profile,
    reducedMotion,
  });
}

export function emitPoemSynergyWorldEvent(
  synergyId: string,
  synergyName: string,
  triggeredByPoemId: string,
): void {
  const profile = resolvePoemSynergyWorldEffect(synergyId);
  const reducedMotion = isEffectiveReducedMotion();

  executePoemWorldVisuals(profile, { reducedMotion });

  const hintKey = resolvePoemWorldHintFlagKey(profile.worldHint);
  if (hintKey) {
    upsertWorldHintFlag(triggeredByPoemId, hintKey, profile.durationMs);
  }

  eventBus.emit('poem:world_event', {
    poemId: triggeredByPoemId,
    powerName: synergyName,
    profile,
    reducedMotion,
  });
}

export function bindPoemWorldEventBridge(): void {
  unsubWorldBridge?.();
  unsubSynergyBridge?.();
  unsubWorldBridge = eventBus.on('poem:power_used', (payload) => {
    emitPoemWorldEvent(payload.poemId, payload.powerName);
  });
  unsubSynergyBridge = eventBus.on('poem:synergy_triggered', (payload) => {
    emitPoemSynergyWorldEvent(payload.synergyId, payload.synergyName, payload.triggeredByPoemId);
  });
}

export function unbindPoemWorldEventBridge(): void {
  unsubWorldBridge?.();
  unsubWorldBridge = null;
  unsubSynergyBridge?.();
  unsubSynergyBridge = null;
}

registerHmrDispose(unbindPoemWorldEventBridge);
