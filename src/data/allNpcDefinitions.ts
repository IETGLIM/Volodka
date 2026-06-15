/* ─── Volodka RPG – merged NPC registry ─── */

import type { NPCDefinition } from '@/shared/types/game';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import { NPC_DEFINITIONS } from './npcDefinitions';
import { EXPANDED_NPCS, EXPANDED_NPC_QUEST_LINKS } from './expandedNPCs';
import { CHK_NPCS, CHK_NPC_QUEST_LINKS } from './chkTolpa/npcs';

type NpcSourceLabel = 'NPC_DEFINITIONS' | 'EXPANDED_NPCS' | 'CHK_NPCS';

const NPC_SOURCES: ReadonlyArray<{ label: NpcSourceLabel; npcs: readonly NPCDefinition[] }> = [
  { label: 'NPC_DEFINITIONS', npcs: NPC_DEFINITIONS },
  { label: 'EXPANDED_NPCS', npcs: EXPANDED_NPCS },
  { label: 'CHK_NPCS', npcs: CHK_NPCS },
];

function mergeQuestLinks(npc: NPCDefinition): NPCDefinition {
  const fromExpanded = EXPANDED_NPC_QUEST_LINKS[npc.id];
  const fromChk = CHK_NPC_QUEST_LINKS[npc.id];
  const merged = [...(npc.questsGiven ?? []), ...(fromExpanded ?? []), ...(fromChk ?? [])];
  if (merged.length === 0) return npc;
  return { ...npc, questsGiven: [...new Set(merged)] };
}

export interface NpcDuplicateIdReport {
  readonly id: string;
  readonly firstSource: NpcSourceLabel;
  readonly duplicateSource: NpcSourceLabel;
}

/** Detect duplicate ids across NPC_DEFINITIONS, EXPANDED_NPCS, and CHK_NPCS. */
export function detectNpcDuplicateIds(): NpcDuplicateIdReport[] {
  const seen = new Map<string, NpcSourceLabel>();
  const dupes: NpcDuplicateIdReport[] = [];

  for (const { label, npcs } of NPC_SOURCES) {
    for (const npc of npcs) {
      const prev = seen.get(npc.id);
      if (prev) {
        dupes.push({ id: npc.id, firstSource: prev, duplicateSource: label });
      } else {
        seen.set(npc.id, label);
      }
    }
  }

  return dupes;
}

function buildAllNpcDefinitions(): NPCDefinition[] {
  return NPC_SOURCES.flatMap(({ npcs }) => npcs).map(mergeQuestLinks);
}

/** Core + expanded + CHK NPCs in one lookup table. */
export const ALL_NPC_DEFINITIONS: NPCDefinition[] = buildAllNpcDefinitions();

/** All canonical NPC ids in the merged registry. */
export const ALL_NPC_IDS: readonly string[] = ALL_NPC_DEFINITIONS.map((n) => n.id);

/** O(1) lookup by canonical NPC id. */
export const NPC_BY_ID: ReadonlyMap<string, NPCDefinition> = new Map(
  ALL_NPC_DEFINITIONS.map((n) => [n.id, n]),
);

/** dialogueNodeId → NPCDefinition (last wins on collision). */
export const NPC_BY_DIALOGUE_NODE: ReadonlyMap<string, NPCDefinition> = (() => {
  const map = new Map<string, NPCDefinition>();
  for (const npc of ALL_NPC_DEFINITIONS) {
    if (npc.dialogueNodeId) {
      map.set(npc.dialogueNodeId, npc);
    }
  }
  return map;
})();

/** NPCs grouped by `faction` field (NPCs without faction are omitted). */
export const NPCS_BY_FACTION: Readonly<Record<string, readonly NPCDefinition[]>> = (() => {
  const groups = new Map<string, NPCDefinition[]>();
  for (const npc of ALL_NPC_DEFINITIONS) {
    if (!npc.faction) continue;
    const list = groups.get(npc.faction) ?? [];
    list.push(npc);
    groups.set(npc.faction, list);
  }
  return Object.fromEntries(groups);
})();

if (import.meta.env?.DEV) {
  for (const dupe of detectNpcDuplicateIds()) {
    console.error(
      `[NPC Registry] duplicate id "${dupe.id}" in ${dupe.firstSource} and ${dupe.duplicateSource}`,
    );
  }
}

export function findNpcById(id: string): NPCDefinition | undefined {
  const canonical = resolveCanonicalNpcId(id);
  return NPC_BY_ID.get(canonical);
}

/**
 * Dialogue/story speaker display labels → canonical NPC ids.
 * Russian-only fallback for legacy nodes without `speakerId` (i18n limitation).
 */
export const NPC_SPEAKER_ALIASES: Readonly<Record<string, string>> = {
  Солныш: 'solnysh',
  Алина: 'solnysh',
  Лёня: 'lyonya',
  Леонид: 'lyonya',
};

export function resolveNpcIdFromSpeaker(
  speaker: string,
  speakerId?: string,
): string | undefined {
  if (speakerId) {
    const canonical = resolveCanonicalNpcId(speakerId);
    if (NPC_BY_ID.has(canonical)) return canonical;
  }

  const alias = NPC_SPEAKER_ALIASES[speaker];
  if (alias) return alias;

  const byNameKey = ALL_NPC_DEFINITIONS.find((n) => n.nameKey === speaker);
  if (byNameKey) return byNameKey.id;

  return ALL_NPC_DEFINITIONS.find((n) => n.name === speaker)?.id;
}

/** Resolve by `nameKey` first, then display `name`, then speaker aliases. */
export function findNpcByName(name: string): NPCDefinition | undefined {
  const aliasId = NPC_SPEAKER_ALIASES[name];
  if (aliasId) return NPC_BY_ID.get(aliasId);

  const byNameKey = ALL_NPC_DEFINITIONS.find((n) => n.nameKey === name);
  if (byNameKey) return byNameKey;

  return ALL_NPC_DEFINITIONS.find((n) => n.name === name);
}

export function findNpcByDialogueNodeId(nodeId: string): NPCDefinition | undefined {
  return NPC_BY_DIALOGUE_NODE.get(nodeId);
}

export function findNpcByQuestId(questId: string): NPCDefinition | undefined {
  return ALL_NPC_DEFINITIONS.find((n) => n.questsGiven?.includes(questId));
}
