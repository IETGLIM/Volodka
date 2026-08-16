/** NPC dialogue, animation, gifts — DialogueRenderer, useNPCAnimation. */
import type { NpcEmotion } from '@/engine/npc/npcEmotionTypes';

export interface NpcEvents {
  'npc:talked': { npcId: string; dialogueNodeId?: string };
  'npc:animation': { npcId: string; state: 'idle' | 'walk' | 'talk' | 'sit' | 'listen' | 'gesture' };
  'npc:interact_staged': { npcId: string };
  'npc:gift': { npcId: string; itemId: string; preference: string; affinityChange: number };
  /** Emitted when an NPC has no narrative content to show — UI should display a fallback bark. */
  'npc:no_dialogue': { npcId: string; barkText: string };
  /**
   * Emitted by `npcAmbientBarkSystem` when an NPC mutters an overheard
   * ambient line (player within 4 m, not in dialogue, ≥ 25 s since this
   * NPC's last ambient bark). The targeted NPC component listens and
   * surfaces the text via its existing speech-bubble machinery.
   */
  'npc:ambient_bark': {
    npcId: string;
    text: string;
    band: 'idle' | 'working' | 'pensive' | 'curious' | 'alarmed' | 'contemplative' | 'annoyed' | 'respectful' | 'fearful' | 'weather';
  };
  /**
   * Emitted when an NPC's emotional state changes (triggered by game events
   * like weather, combat nearby, poem reading, outfit perception, proximity).
   * The NPC component listens and adjusts animation, head tracking, and bark
   * behavior accordingly.
   */
  'npc:emotion_triggered': { npcId: string; emotion: NpcEmotion; source: string; duration: number };
  /**
   * Emitted when an NPC's emotion decays back to neutral (after the duration
   * expires). The NPC component restores default animation and behavior.
   */
  'npc:emotion_decayed': { npcId: string; previousEmotion: NpcEmotion };
  /**
   * Emitted when an NPC transitions to a new emotion (replaces the previous
   * one). Used by the world-space NpcEmotionIndicator to show a brief
   * floating label above the NPC's head. Unlike `npc:emotion_triggered`,
   * this event fires on any transition — including decay → neutral.
   */
  'npc:emotion_change': { npcId: string; emotion: NpcEmotion; previousEmotion: NpcEmotion };
  /**
   * Emitted by `checkRelationMilestones` when an NPC's relation value
   * crosses a `relationMilestones` threshold defined on its NPCDefinition.
   * The DialogueRenderer listens and auto-opens `dialogueNodeId` so the
   * player sees the milestone conversation without manually re-talking to
   * the NPC. `direction` indicates whether the crossing was rising
   * (relation gained) or falling (relation lost).
   */
  'npc:relation_milestone': {
    npcId: string;
    milestoneValue: number;
    dialogueNodeId: string;
    direction: 'rising' | 'falling';
  };
}
