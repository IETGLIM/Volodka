/* ─── NPC definitions ─── */

import type { NPCBarkTexts, NPCAmbientBarks } from '@/shared/npcBark';
/* NpcIdleVariant removed — type now lives in this file (see below). */

export type { NPCBarkBand, NPCBarkTexts, NPCAmbientBarks } from '@/shared/npcBark';

/** NPC emotional states driven by game context and events. */
export type NpcEmotion =
  | 'neutral'
  | 'curious'
  | 'alarmed'
  | 'contemplative'
  | 'annoyed'
  | 'respectful'
  | 'fearful';

export type NPCHeadAccessory = 'none' | 'glasses' | 'hat' | 'scarf' | 'earring';
export type NPCSilhouette = 'slim' | 'average' | 'heavy';

/** Visual/update fidelity — background skips head tracking and heavy per-frame work. */
export type NpcRenderTier = 'hero' | 'interactive' | 'background';

/** Preferred idle animation variant based on personality/role. */
export type NpcIdleVariant = 'idle_relaxed' | 'idle_alert' | 'idle_bored' | 'idle_working' | 'idle_social';

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
  /**
   * Ambient mutterings NPCs produce when the player is within 4 m but NOT
   * interacting. Different from `barkTexts` (which fire on approach) — these
   * are overheard idle/working/pensive lines that make a scene feel inhabited.
   * Driven by `npcAmbientBarkSystem.ts`.
   */
  readonly ambientBarks?: NPCAmbientBarks;
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
  /** Preferred idle animation variant based on personality/role.
   *  Determines which idle pose the NPC uses when not in an active activity.
   *  When an emotion overrides the idle, the emotion's variant takes priority.
   */
  readonly idleVariant?: NpcIdleVariant;
  /**
   * Relation thresholds that trigger a one-shot milestone dialogue when
   * crossed. `checkRelationMilestones(npcId, oldRelation, newRelation)`
   * walks this list whenever the relation value changes and emits
   * `npc:relation_milestone` for any threshold that was crossed in either
   * direction (rising: oldRelation < value <= newRelation;
   * falling: oldRelation > value >= newRelation).
   *
   * Each entry links a relation `value` to a `dialogueNodeId` registered in
   * the dialogue registry (typically authored in `milestoneDialogues.ts`).
   */
  readonly relationMilestones?: readonly RelationMilestone[];
}

/** A relation threshold that unlocks a milestone dialogue when crossed. */
export interface RelationMilestone {
  /** Relation value (0–100) at which the milestone fires. */
  readonly value: number;
  /** Dialogue node id to open when the milestone is crossed. */
  readonly dialogueNodeId: string;
}
