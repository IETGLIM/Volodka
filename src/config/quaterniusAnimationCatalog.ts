/**
 * Quaternius Ultimate Modular Men/Women — embedded GLB clip aliases.
 * Each rig ships ~24 clips (Idle, Walk, Run, Wave, Interact, …).
 * Mixamo retarget: same humanoid bone naming — see humanoidRetargetProfile.ts.
 */

import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

/** Preferred Quaternius clip names per NPC animation state (PascalCase in GLB). */
export const QUATERNIUS_CLIP_ALIASES: Record<NPCAnimationState, readonly string[]> = {
  idle: ['Idle', 'Idle_Neutral', 'Idle_Sword', 'Idle_Gun'],
  walk: ['Walk', 'Run', 'Run_Forward'],
  talk: ['Wave', 'Interact', 'Idle_Gun_Pointing'],
  sit: ['Idle_Neutral', 'Interact'],
  listen: ['Idle_Neutral', 'Idle'],
  gesture: ['Wave', 'Interact', 'Kick_Left', 'Kick_Right'],
};

export function getQuaterniusClipAliasesByNpcState(): Record<NPCAnimationState, string[]> {
  return {
    idle: [...QUATERNIUS_CLIP_ALIASES.idle],
    walk: [...QUATERNIUS_CLIP_ALIASES.walk],
    talk: [...QUATERNIUS_CLIP_ALIASES.talk],
    sit: [...QUATERNIUS_CLIP_ALIASES.sit],
    listen: [...QUATERNIUS_CLIP_ALIASES.listen],
    gesture: [...QUATERNIUS_CLIP_ALIASES.gesture],
  };
}
