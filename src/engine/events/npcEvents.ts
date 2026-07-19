/** NPC dialogue, animation, gifts — DialogueRenderer, useNPCAnimation. */
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
    band: 'idle' | 'working' | 'pensive';
  };
}
