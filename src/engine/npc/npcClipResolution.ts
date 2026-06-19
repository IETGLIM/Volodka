/* ─── Volodka RPG – resolve GLB clip actions for NPC animation states ─── */

import type * as THREE from 'three';
import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';
import { getMixamoClipAliasesByNpcState } from '@/config/mixamoAnimationCatalog';
import { getQuaterniusClipAliasesByNpcState } from '@/config/quaterniusAnimationCatalog';
import { pickSafeIdleClipAction } from '@/engine/player/playerClipResolution';

export interface NpcAnimationClipOverrides {
  idle?: string;
  walk?: string;
  talk?: string;
  sit?: string;
}

const GENERIC_ALIASES: Record<NPCAnimationState, readonly string[]> = {
  idle: [
    'Idle_Neutral', 'idle', 'Idle', 'IDLE', '0', 'animation_0',
    'Armature|idle', 'Cesium_Man_idles', 'idle_01', 'sleeping', 'Sleeping',
    'Lie_Idle', 'Laying Down Idle', 'Rig_Medium|Lie_Idle',
  ],
  walk: [
    'walk', 'Walk', 'WALK', 'walking', 'Walking',
    'Armature|walk', 'Cesium_Man_walk', 'walk_01',
  ],
  talk: [
    'talk', 'Talk', 'TALK', 'talking', 'Talking',
    'Armature|talk', 'Cesium_Man_talk', 'talk_01',
  ],
  sit: [
    'sit', 'Sit', 'SIT', 'sitting', 'Sitting', 'Sitting_Idle_Loop',
    'Armature|sit', 'sit_01', 'working', 'Working', 'Fixing_Kneeling',
  ],
  listen: [
    'listen', 'Listen', 'idle', 'Idle', 'IDLE',
    'Armature|listen', 'Cesium_Man_idles', 'listen_01',
  ],
  gesture: [
    'gesture', 'Gesture', 'wave', 'Wave',
    'Armature|gesture', 'Cesium_Man_gesture', 'gesture_01',
  ],
};

const MIXAMO_ALIASES = getMixamoClipAliasesByNpcState();
const QUATERNIUS_ALIASES = getQuaterniusClipAliasesByNpcState();

function getAliasesForState(state: NPCAnimationState): readonly string[] {
  return [
    ...GENERIC_ALIASES[state],
    ...MIXAMO_ALIASES[state],
    ...QUATERNIUS_ALIASES[state],
  ];
}

function overrideNameForState(
  state: NPCAnimationState,
  overrides?: NpcAnimationClipOverrides,
): string | undefined {
  switch (state) {
    case 'idle':
      return overrides?.idle;
    case 'walk':
      return overrides?.walk;
    case 'talk':
      return overrides?.talk;
    case 'sit':
      return overrides?.sit;
    case 'listen':
      return overrides?.idle;
    case 'gesture':
      return overrides?.talk;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

/** Case-insensitive clip lookup — Quaternius uses PascalCase, definitions use lowercase. */
export function findNpcClipActionByName(
  actions: Record<string, THREE.AnimationAction>,
  name: string,
): THREE.AnimationAction | null {
  const direct = actions[name];
  if (direct) return direct;

  const lower = name.toLowerCase();
  for (const [key, action] of Object.entries(actions)) {
    if (key.toLowerCase() === lower) return action ?? null;
  }
  return null;
}

/**
 * Pick the best mixer action for an NPC animation state.
 * Tries per-NPC overrides, then Mixamo/Quaternius/generic aliases (case-insensitive).
 */
export function resolveNpcClipAction(
  state: NPCAnimationState,
  actions: Record<string, THREE.AnimationAction> | null | undefined,
  overrides?: NpcAnimationClipOverrides,
): THREE.AnimationAction | null {
  if (!actions) return null;

  const overrideName = overrideNameForState(state, overrides);
  if (overrideName) {
    const overrideHit = findNpcClipActionByName(actions, overrideName);
    if (overrideHit) return overrideHit;
  }

  for (const name of getAliasesForState(state)) {
    const hit = findNpcClipActionByName(actions, name);
    if (hit) return hit;
  }

  if (state !== 'idle') {
    return resolveNpcClipAction('idle', actions, overrides);
  }

  return pickSafeIdleClipAction(actions);
}
