import type { ActiveTTLFlagMap } from '@/shared/activeTTLFlags';
import type { PoemWorldHint } from '@/config/poemWorldEffects';
import { resolvePoemWorldHintFlagKey } from '@/engine/poemWorld/poemWorldEffectResolver';

export type PoemHighlightMode = 'none' | 'exploration' | 'dialogue' | 'interaction';

export interface PoemHighlightState {
  mode: PoemHighlightMode;
  /** When false, god rays stay at steady intensity (reduced motion). */
  pulse: boolean;
  color: string;
}

const GUIDING_STAR_FLAG = 'guiding_star_active';

const HIGHLIGHT_BY_HINT: Record<
  Exclude<PoemWorldHint, 'none'>,
  { mode: PoemHighlightMode; color: string }
> = {
  exit_glow: { mode: 'exploration', color: '#ffd866' },
  npc_shimmer: { mode: 'dialogue', color: '#a8e6ff' },
  interaction_pulse: { mode: 'interaction', color: '#66ffcc' },
};

function isTTLFlagLive(
  flags: ActiveTTLFlagMap | undefined,
  key: string,
  now: number,
): boolean {
  const entry = flags?.[key];
  if (!entry) return false;
  return entry.expiryTimestamp > now;
}

function isPlayerFlagLive(
  playerFlags: Record<string, boolean> | undefined,
  key: string,
  flags: ActiveTTLFlagMap | undefined,
  now: number,
): boolean {
  if (isTTLFlagLive(flags, key, now)) return true;
  return playerFlags?.[key] === true;
}

function resolveHintHighlight(
  hint: Exclude<PoemWorldHint, 'none'>,
  playerFlags: Record<string, boolean>,
  activeTTLFlags: ActiveTTLFlagMap,
  now: number,
): PoemHighlightState | null {
  const hintKey = resolvePoemWorldHintFlagKey(hint);
  if (!hintKey) return null;
  if (!isPlayerFlagLive(playerFlags, hintKey, activeTTLFlags, now)) return null;
  const preset = HIGHLIGHT_BY_HINT[hint];
  return { mode: preset.mode, pulse: true, color: preset.color };
}

/** Resolve active poem-driven exploration highlight from TTL flags and world-hint flags. */
export function resolvePoemExplorationHighlight(
  activeTTLFlags: ActiveTTLFlagMap,
  playerFlags: Record<string, boolean> = {},
  options: { reducedMotion?: boolean; now?: number } = {},
): PoemHighlightState {
  const now = options.now ?? Date.now();
  const reducedMotion = options.reducedMotion ?? false;

  if (isTTLFlagLive(activeTTLFlags, GUIDING_STAR_FLAG, now)) {
    return {
      mode: 'exploration',
      pulse: !reducedMotion,
      color: '#ffd866',
    };
  }

  const hintOrder: Exclude<PoemWorldHint, 'none'>[] = [
    'exit_glow',
    'npc_shimmer',
    'interaction_pulse',
  ];

  for (const hint of hintOrder) {
    const resolved = resolveHintHighlight(hint, playerFlags, activeTTLFlags, now);
    if (resolved) {
      return { ...resolved, pulse: !reducedMotion && resolved.pulse };
    }
  }

  return { mode: 'none', pulse: false, color: '#88eeff' };
}

export interface PoemHighlightZoneShape {
  linkedNpcId?: string;
  linkedDialogueNodeId?: string;
}

/** Whether a trigger zone should glow under the current poem highlight mode. */
export function shouldHighlightZoneForPoemMode(
  zone: PoemHighlightZoneShape,
  mode: PoemHighlightMode,
): boolean {
  switch (mode) {
    case 'none':
      return false;
    case 'exploration':
    case 'interaction':
      return true;
    case 'dialogue':
      return Boolean(zone.linkedNpcId || zone.linkedDialogueNodeId);
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}
