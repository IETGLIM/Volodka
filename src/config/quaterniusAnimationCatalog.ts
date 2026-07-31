/**
 * Quaternius Ultimate Modular Men/Women — embedded GLB clip aliases.
 * Each rig ships ~24 clips (Idle, Walk, Run, Wave, Interact, …).
 * Mixamo retarget: same humanoid bone naming — see assets-source/mixamo/README.md.
 */

import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

/** Preferred Quaternius clip names per NPC animation state (PascalCase in GLB). */
export const QUATERNIUS_CLIP_ALIASES: Record<NPCAnimationState, readonly string[]> = {
  idle: ['Idle', 'Idle_Neutral', 'Death', 'Idle_Sword', 'Idle_Gun'],
  walk: ['Walk', 'Run', 'Run_Forward'],
  talk: [
    // Prefer Interact / idle over Wave — Wave is a greeting flip that reads as
    // foot-slide / arm-flail when Mixamo `talking` has not bound yet.
    'Interact', 'Idle_Neutral', 'Wave', 'Idle_Gun_Pointing',
  ],
  sit: [
    'Sitting_Idle_Loop', 'sitting', 'Sitting', 'Fixing_Kneeling', 'working', 'Working',
    'Interact', 'Idle_Neutral',
  ],
  listen: ['Idle_Neutral', 'Idle'],
  gesture: ['Wave', 'Interact', 'Kick_Left', 'Kick_Right'],
  work: ['Working', 'working', 'Fixing_Kneeling', 'Interact', 'Idle_Neutral'],
  sleep: ['Sitting_Idle_Loop', 'Sitting', 'Idle_Neutral'],
  combat: ['Idle_Sword', 'Idle_Gun', 'Kick_Left', 'Kick_Right', 'Run_Forward', 'Death'],
};

export function getQuaterniusClipAliasesByNpcState(): Record<NPCAnimationState, string[]> {
  return {
    idle: [...QUATERNIUS_CLIP_ALIASES.idle],
    walk: [...QUATERNIUS_CLIP_ALIASES.walk],
    talk: [...QUATERNIUS_CLIP_ALIASES.talk],
    sit: [...QUATERNIUS_CLIP_ALIASES.sit],
    listen: [...QUATERNIUS_CLIP_ALIASES.listen],
    gesture: [...QUATERNIUS_CLIP_ALIASES.gesture],
    work: [...QUATERNIUS_CLIP_ALIASES.work],
    sleep: [...QUATERNIUS_CLIP_ALIASES.sleep],
    combat: [...QUATERNIUS_CLIP_ALIASES.combat],
  };
}
