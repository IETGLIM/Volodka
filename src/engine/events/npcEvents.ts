/** NPC dialogue, animation, gifts — DialogueRenderer, useNPCAnimation. */
export interface NpcEvents {
  'npc:talked': { npcId: string; dialogueNodeId?: string };
  'npc:animation': { npcId: string; state: 'idle' | 'walk' | 'talk' | 'sit' | 'listen' | 'gesture' };
  'npc:interact_staged': { npcId: string };
  'npc:gift': { npcId: string; itemId: string; preference: string; affinityChange: number };
  /** Emitted when an NPC has no narrative content to show — UI should display a fallback bark. */
  'npc:no_dialogue': { npcId: string; barkText: string };
}
