/* ─── NPC definitions ─── */

import type { NPCBarkTexts } from '@/shared/npcBark';

export type { NPCBarkBand, NPCBarkTexts } from '@/shared/npcBark';

export type NPCHeadAccessory = 'none' | 'glasses' | 'hat' | 'scarf' | 'earring';
export type NPCSilhouette = 'slim' | 'average' | 'heavy';

/** Visual/update fidelity — background skips head tracking and heavy per-frame work. */
export type NpcRenderTier = 'hero' | 'interactive' | 'background';

export interface NPCAppearance {
  readonly bodyColor: string;
  readonly accentColor: string;
  readonly headAccessory: NPCHeadAccessory;
  readonly height: number;
  readonly glowColor: string;
  readonly silhouette: NPCSilhouette;
}

export interface NPCAnimationClips {
  readonly idle?: string;
  readonly walk?: string;
  readonly talk?: string;
  readonly sit?: string;
  readonly play_guitar?: string;
  readonly pour_drink?: string;
}

export interface NPCAccessibility {
  /** Short description for screen readers when the NPC is nearby or in focus */
  readonly visualDescription: string;
  /** Optional idle / approach SFX path (resolved by soundProfile when wired) */
  readonly audioCue?: string;
}

export interface NPCDefinition {
  readonly id: string;
  readonly name: string;
  /** i18n lookup key — searched before `name` in findNpcByName. */
  readonly nameKey?: string;
  /** Faction tag for grouping (e.g. network, tolpa). */
  readonly faction?: string;
  /** Quest ids this NPC can give or anchor. */
  readonly questsGiven?: readonly string[];
  /** Omit or use `procedural` — renderer builds silhouette from appearance */
  readonly modelPath?: string;
  readonly scale?: number;
  readonly animations?: NPCAnimationClips;
  readonly defaultPosition: [number, number, number];
  readonly defaultRotation?: number;
  readonly patrolRadius?: number;
  readonly patrolWaypoints?: [number, number, number][];
  readonly dialogueNodeId?: string;
  /** Dialogue node to redirect to after the first visit (return / repeat dialogue). */
  readonly returnDialogueNodeId?: string;
  /** Links to NPCSchedule.id — movement keyed by npcId in ScheduleEngine */
  readonly scheduleId?: string;
  readonly description?: string;
  readonly barkTexts?: NPCBarkTexts;
  readonly accessibility?: NPCAccessibility;
  /** Scene POI ids for contextual hints (campfire, props, etc.) */
  readonly linkedPOIs?: readonly string[];
  /** SfxEngine profile id — `sounds/npc/{soundProfile}_*.ogg` */
  readonly soundProfile?: string;
  /** Interaction splash preset id from interactionSplashes.ts */
  readonly npcSplashProfile?: string;
  readonly appearance?: NPCAppearance;
  /** Override render fidelity; scene defaults apply when omitted. */
  readonly renderTier?: NpcRenderTier;
}
