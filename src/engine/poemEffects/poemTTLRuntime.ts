import { getPoemTTLConsumer } from '@/config/poemEffectRegistry';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { createBuff, addBuff } from '@/engine/combat/buffSystem';
import type { CombatState } from '@/engine/combat/types';
import {
  type ActiveTTLFlag,
  type ActiveTTLFlagMap,
  isActiveTTLFlagLive,
} from '@/shared/activeTTLFlags';
import { ttlNow } from '@/shared/ttlClock';

// Re-exported for backwards compatibility with engine consumers.
// The canonical home is @/shared/poemEffects/poemStressScaling.ts so the
// store layer can import it without pulling in engine code.
export { scaleStressWithPoemEffects } from '@/shared/poemEffects/poemStressScaling';

export interface LivePoemTTLDisplayEntry {
  flagKey: string;
  poemId: string;
  name: string;
  icon: string;
  color: string;
  effectSummary: string;
  remainingMs: number;
  remainingRatio: number;
}

function resolveDisplayName(flag: ActiveTTLFlag): string {
  const power = getPoemPower(flag.poemId);
  if (power?.name) return power.name;
  const consumer = getPoemTTLConsumer(flag.key);
  return consumer?.fallbackLabel ?? flag.key;
}

function resolveDisplayMeta(flag: ActiveTTLFlag): {
  icon: string;
  color: string;
  effectSummary: string;
} {
  const consumer = getPoemTTLConsumer(flag.key);
  return {
    icon: consumer?.icon ?? '✦',
    color: consumer?.color ?? '#fbbf24',
    effectSummary: consumer?.effectSummary ?? 'Активная сила стиха.',
  };
}

/** Internal world-hint TTL flags — short VFX only, not player-facing poem powers. */
export function isPoemTTLHudVisible(flagKey: string): boolean {
  if (flagKey.startsWith('poem_hint_')) return false;
  return Boolean(getPoemTTLConsumer(flagKey));
}

/** Live poem TTL rows for HUD — sorted by soonest expiry. */
export function listLivePoemTTLDisplayEntries(
  activeTTLFlags: ActiveTTLFlagMap | undefined | null,
  now: number = ttlNow(),
): LivePoemTTLDisplayEntry[] {
  const map = activeTTLFlags ?? {};
  const entries: LivePoemTTLDisplayEntry[] = [];

  for (const flag of Object.values(map)) {
    if (!isPoemTTLHudVisible(flag.key)) continue;
    if (now >= flag.expiryTimestamp) continue;
    const remainingMs = flag.expiryTimestamp - now;
    const power = getPoemPower(flag.poemId);
    const durationMs = power?.flagsToSet?.find((f) => f.key === flag.key)?.durationMs ?? remainingMs;
    const meta = resolveDisplayMeta(flag);

    entries.push({
      flagKey: flag.key,
      poemId: flag.poemId,
      name: resolveDisplayName(flag),
      icon: meta.icon,
      color: meta.color,
      effectSummary: meta.effectSummary,
      remainingMs,
      remainingRatio: durationMs > 0 ? remainingMs / durationMs : 1,
    });
  }

  return entries.sort((a, b) => a.remainingMs - b.remainingMs);
}

/** Carry exploration poem TTL into the opening combat turn as buffs/debuffs. */
export function applyExplorationPoemCombatBridge(
  state: CombatState,
  activeTTLFlags: ActiveTTLFlagMap | undefined | null,
): CombatState {
  let next = state;
  const bridgeLogs: CombatState['log'] = [];

  for (const flag of Object.values(activeTTLFlags ?? {})) {
    if (!isActiveTTLFlagLive(activeTTLFlags, flag.key)) continue;
    const bridge = getPoemTTLConsumer(flag.key)?.combatBridge;
    if (!bridge) continue;

    const buff = createBuff(
      next,
      bridge.name,
      bridge.source,
      bridge.kind,
      bridge.target,
      bridge.duration,
      bridge.effect,
    );
    next = addBuff(next, buff);
    bridgeLogs.push({
      turn: next.turn,
      text: bridge.logText,
      type: 'player_power',
    });
  }

  if (bridgeLogs.length === 0) return next;

  const log =
    bridgeLogs.length === 1
      ? bridgeLogs
      : [
          {
            turn: next.turn,
            text: `✦ Эхо ${bridgeLogs.length} сил стихов переносится в бой…`,
            type: 'player_power' as const,
          },
        ];

  return { ...next, log: [...next.log, ...log] };
}
