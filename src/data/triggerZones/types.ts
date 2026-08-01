/* ─── Volodka RPG – trigger zone types ─── */

import type { SceneId, StoryEffect, InteractionType, ExamineData, TrainablePlayerSkill } from '@/shared/types/game';

export interface TriggerZone {
  id: string;
  sceneId: SceneId;
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  enterToast?: string;
  linkedStoryNodeId?: string;
  linkedDialogueNodeId?: string;
  linkedQuestId?: string;
  effects?: StoryEffect[];
  /** Flag that must be set for this trigger zone to be active */
  requiredFlag?: string;
  /** Hide this zone once the flag is set (e.g. casual NPC talk → story beat). */
  hiddenWhenFlag?: string;
  /** Context-sensitive interaction label (replaces generic [E]) */
  interactionLabel?: string;
  /** Context-sensitive interaction type — determines the [E] prompt verb */
  interactionType?: InteractionType;
  /** Data for the examination panel (shown when interactionType is 'examine') */
  examineData?: ExamineData;
  /** Linked mini-game type (replaces hardcoded ID checks in useInteractionOrchestrator) */
  linkedMinigame?: 'codebreaker' | 'openstack_terminal' | 'bash_terminal' | 'poetry';
  /** Optional GLB prop id from propModelRegistry — rendered at zone position */
  propModelId?: string;
  /** Per-zone prop placement: offset from zone position (metres) */
  propOffset?: [number, number, number];
  /** Per-zone prop Y rotation (radians) — e.g. doors standing in X-walls */
  propRotationY?: number;
  /** Whether this trigger can only be used once per playthrough */
  isOneTime?: boolean;
  /** NPC explicitly linked to this zone (staged talk routing — no substring heuristics). */
  linkedNpcId?: string;
  /** Minimum act required for this trigger zone to be active (1 or 2) */
  requiredAct?: number;
  /** Hide until this poem-power TTL flag is live (e.g. child_gaze_active). */
  hiddenUntilPoemFlag?: string;
  /** Automatically trigger effects on zone enter (for combat encounters, traps, etc.) */
  autoTrigger?: boolean;
  /** Interaction splash preset id from interactionSplashes.ts — overrides type defaults */
  splashProfile?: string;
  /** Player flag that skips splash on repeat (defaults to first interacted_* / examined_* effect) */
  splashRepeatSkipFlag?: string;
  /** Container loot contents — when set, 'open' interaction shows a loot panel
   *  instead of firing effects. Each entry is an item + quantity the player
   *  can take individually or all at once (Gothic-style ransack). */
  containerContents?: Array<{ itemId: string; quantity: number }>;
  /** Item ID required to unlock this container. If set and player doesn't have
   *  the key, the container shows a "locked" message instead of loot. */
  lockedKeyId?: string;
  /** Flag set when the container has been fully looted (all contents taken).
   *  Used to track empty containers across save/load. */
  lootedFlag?: string;
  /** Skill required to interact with this zone. Emits skill:check event. */
  requiredSkill?: TrainablePlayerSkill;
  /** Minimum skill level needed to pass the check (default 3). */
  skillThreshold?: number;
}
