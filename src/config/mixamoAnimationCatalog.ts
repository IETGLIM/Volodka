/**
 * Mixamo animation clips for humanoid NPCs and hero (Volodka).
 * Download: https://www.mixamo.com (free Adobe account; commercial use allowed).
 *
 * After download:
 *   npm run assets:mixamo-import -- --list
 *   npm run assets:mixamo-import -- --clip idle --file path/to/idle.glb
 *
 * See assets-source/mixamo/README.md for export settings.
 */

import type { NPCAnimationState } from '@/engine/interaction/interactionMachine';

export type MixamoClipId =
  | 'idle'
  | 'walking'
  | 'talking'
  | 'sitting'
  | 'sleeping'
  | 'working';

export interface MixamoAnimationSpec {
  id: MixamoClipId;
  title: string;
  /** Suggested search on mixamo.com */
  mixamoSearchHint: string;
  /** Drop raw download here before import (relative to repo root). */
  sourceRelativePath: string;
  /** Runtime path under public/models/animations/ */
  publicUrl: string;
  /** Preferred clip name after import (rename in Blender if Mixamo uses a hash). */
  canonicalClipName: string;
  /** NPC animation state this clip drives. */
  npcState: NPCAnimationState;
  /** Extra clip name aliases for ANIM_MAP matching. */
  clipAliases: readonly string[];
}

const MIXAMO_SOURCE = 'assets-source/mixamo';
const ANIMATIONS = '/models/animations';

export const MIXAMO_ANIMATION_CATALOG: readonly MixamoAnimationSpec[] = [
  {
    id: 'idle',
    title: 'Idle (standing)',
    mixamoSearchHint: 'Idle — e.g. "Idle" or "Breathing Idle"',
    sourceRelativePath: `${MIXAMO_SOURCE}/idle.glb`,
    publicUrl: `${ANIMATIONS}/idle.glb`,
    canonicalClipName: 'idle',
    npcState: 'idle',
    clipAliases: ['Idle', 'Breathing Idle', 'Standing Idle', 'mixamo.com'],
  },
  {
    id: 'walking',
    title: 'Walking',
    mixamoSearchHint: 'Walking — e.g. "Walking" or "Casual Walk"',
    sourceRelativePath: `${MIXAMO_SOURCE}/walking.glb`,
    publicUrl: `${ANIMATIONS}/walking.glb`,
    canonicalClipName: 'walking',
    npcState: 'walk',
    clipAliases: ['Walking', 'Walk', 'Casual Walk', 'Standard Walk'],
  },
  {
    id: 'talking',
    title: 'Talking (gesturing)',
    mixamoSearchHint: 'Talking — e.g. "Talking" or "Standing Arguing"',
    sourceRelativePath: `${MIXAMO_SOURCE}/talking.glb`,
    publicUrl: `${ANIMATIONS}/talking.glb`,
    canonicalClipName: 'talking',
    npcState: 'talk',
    clipAliases: ['Talking', 'Talk', 'Standing Arguing', 'Gesture'],
  },
  {
    id: 'sitting',
    title: 'Sitting / resting',
    mixamoSearchHint: 'Sitting — e.g. "Sitting" or "Sitting Talking"',
    sourceRelativePath: `${MIXAMO_SOURCE}/sitting.glb`,
    publicUrl: `${ANIMATIONS}/sitting.glb`,
    canonicalClipName: 'sitting',
    npcState: 'sit',
    clipAliases: [
      'Sitting', 'Sit', 'Sitting Idle', 'Sitting Talking', 'Interact',
      'Sitting_Idle_Loop', 'Sitting_Talking_Loop',
    ],
  },
  {
    id: 'sleeping',
    title: 'Sleeping / drowsy idle',
    mixamoSearchHint: 'Sleeping — KayKit Lie_Idle (imported via assets:kaykit-sleep-import)',
    sourceRelativePath: `${MIXAMO_SOURCE}/sleeping.glb`,
    publicUrl: `${ANIMATIONS}/sleeping.glb`,
    canonicalClipName: 'sleeping',
    npcState: 'idle',
    clipAliases: ['Sleeping', 'Sleep', 'Laying', 'Laying Idle', 'sleep', 'Lie_Idle', 'Laying Down Idle', 'Rig_Medium|Lie_Idle'],
  },
  {
    id: 'working',
    title: 'Working / interacting',
    mixamoSearchHint: 'Working — e.g. "Typing" or "Standing Thumbs Up"',
    sourceRelativePath: `${MIXAMO_SOURCE}/working.glb`,
    publicUrl: `${ANIMATIONS}/working.glb`,
    canonicalClipName: 'working',
    npcState: 'sit',
    clipAliases: ['Working', 'Work', 'Typing', 'Interact', 'work', 'Fixing_Kneeling', 'PickUp_Table'],
  },
] as const;

export function getMixamoAnimationSpec(clipId: string): MixamoAnimationSpec | undefined {
  return MIXAMO_ANIMATION_CATALOG.find((entry) => entry.id === clipId);
}

export function listMixamoClipIds(): MixamoClipId[] {
  return MIXAMO_ANIMATION_CATALOG.map((entry) => entry.id);
}

/** URLs for validate-gltf-assets once clips are imported and shipped. */
export function getMixamoPublicUrls(): string[] {
  return MIXAMO_ANIMATION_CATALOG.map((entry) => entry.publicUrl);
}

/** All clip name aliases grouped by NPC animation state (embedded + Mixamo). */
export function getMixamoClipAliasesByNpcState(): Record<NPCAnimationState, string[]> {
  const map: Record<NPCAnimationState, string[]> = {
    idle: [],
    walk: [],
    talk: [],
    sit: [],
    listen: [],
    gesture: [],
  };
  for (const spec of MIXAMO_ANIMATION_CATALOG) {
    map[spec.npcState].push(spec.canonicalClipName, ...spec.clipAliases);
  }
  return map;
}
