/**
 * Poem-effect stress scaling — shared layer.
 *
 * This used to live in @/engine/poemEffects/poemTTLRuntime.ts, but the store
 * layer (applyGameAction.ts) needs to call it when applying stress effects.
 * Importing engine from store violates the layering contract
 * ("Store must not import Engine. Use storeEffects, storeEngineHost, or
 * @/shared/gameBridge"). The function itself only depends on config
 * (poemEffectRegistry) and shared (activeTTLFlags), so it belongs here.
 *
 * The engine re-exports it from poemTTLRuntime.ts for backwards compatibility
 * with existing engine consumers.
 */

import { getPoemTTLConsumer } from '@/config/poemEffectRegistry';
import {
  type ActiveTTLFlagMap,
  isActiveTTLFlagLive,
} from '@/shared/activeTTLFlags';

/** Scale positive stress gains when defensive poem TTL flags are live. */
export function scaleStressWithPoemEffects(
  amount: number,
  activeTTLFlags: ActiveTTLFlagMap | undefined | null,
): number {
  if (amount <= 0) return amount;

  let scaled = amount;
  for (const flag of Object.values(activeTTLFlags ?? {})) {
    const consumer = getPoemTTLConsumer(flag.key);
    const multiplier = consumer?.stressIncomingMultiplier;
    if (multiplier === undefined) continue;
    if (!isActiveTTLFlagLive(activeTTLFlags, flag.key)) continue;
    scaled *= multiplier;
  }

  return Math.max(0, Math.round(scaled));
}
