/* ─── Volodka RPG – merged NPC registry ─── */

import type { NPCDefinition } from '@/shared/types/game';
import { NPC_DEFINITIONS } from './npcDefinitions';
import { EXPANDED_NPCS } from './expandedNPCs';
import { CHK_NPCS } from './chkTolpa/npcs';

/** Core + expanded + CHK NPCs in one lookup table. */
export const ALL_NPC_DEFINITIONS: NPCDefinition[] = [
  ...NPC_DEFINITIONS,
  ...EXPANDED_NPCS,
  ...CHK_NPCS,
];

export function findNpcById(id: string): NPCDefinition | undefined {
  return ALL_NPC_DEFINITIONS.find((n) => n.id === id);
}

export function findNpcByName(name: string): NPCDefinition | undefined {
  return ALL_NPC_DEFINITIONS.find((n) => n.name === name);
}

export function findNpcByDialogueNodeId(nodeId: string): NPCDefinition | undefined {
  return ALL_NPC_DEFINITIONS.find((n) => n.dialogueNodeId === nodeId);
}
