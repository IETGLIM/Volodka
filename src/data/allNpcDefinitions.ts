/* ─── Volodka RPG – merged NPC registry ─── */

import type { NPCDefinition } from '@/shared/types/game';
import { resolveCanonicalNpcId } from './goldenPath';
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
  const canonical = resolveCanonicalNpcId(id);
  return ALL_NPC_DEFINITIONS.find((n) => n.id === canonical);
}

/** Dialogue/story speaker labels → canonical NPC ids. */
export const NPC_SPEAKER_ALIASES: Readonly<Record<string, string>> = {
  Солныш: 'vera',
  Алина: 'vera',
  Лёня: 'lyonya',
  Леонид: 'lyonya',
};

export function resolveNpcIdFromSpeaker(speaker: string): string | undefined {
  const alias = NPC_SPEAKER_ALIASES[speaker];
  if (alias) return alias;
  return ALL_NPC_DEFINITIONS.find((n) => n.name === speaker)?.id;
}

export function findNpcByName(name: string): NPCDefinition | undefined {
  const aliasId = NPC_SPEAKER_ALIASES[name];
  if (aliasId) return ALL_NPC_DEFINITIONS.find((n) => n.id === aliasId);
  return ALL_NPC_DEFINITIONS.find((n) => n.name === name);
}

export function findNpcByDialogueNodeId(nodeId: string): NPCDefinition | undefined {
  return ALL_NPC_DEFINITIONS.find((n) => n.dialogueNodeId === nodeId);
}
