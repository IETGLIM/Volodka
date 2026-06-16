import { describe, expect, it } from 'vitest';
import type { StoryEffect } from '@/shared/types/game';
import { STORY_NODES } from '@/data/storyNodes';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { STORY_NODE_TO_NPC_ID, NPC_ID_ALIASES } from '@/data/goldenPath';
import {
  ALL_NPC_DEFINITIONS,
  ALL_NPC_IDS,
  NPC_BY_ID,
  NPC_BY_DIALOGUE_NODE,
  NPCS_BY_FACTION,
  detectNpcDuplicateIds,
  findNpcById,
  findNpcByQuestId,
  resolveNpcIdFromSpeaker,
} from '@/data/allNpcDefinitions';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';

function isRegisteredNpcId(id: string): boolean {
  const canonical = resolveCanonicalNpcId(id);
  return NPC_BY_ID.has(canonical) || canonical in NPC_ID_ALIASES;
}

function collectNpcIdsFromEffects(effects: StoryEffect[] | undefined, out: Set<string>): void {
  if (!effects) return;
  for (const effect of effects) {
    if (effect.type === 'npcChange' && effect.npcId) {
      out.add(effect.npcId);
    }
  }
}

describe('ALL_NPC_DEFINITIONS registry', () => {
  it('has no duplicate ids across source arrays', () => {
    expect(detectNpcDuplicateIds()).toEqual([]);
  });

  it('exports ALL_NPC_IDS matching NPC_BY_ID keys', () => {
    expect(new Set(ALL_NPC_IDS).size).toBe(ALL_NPC_IDS.length);
    expect(ALL_NPC_IDS.length).toBe(NPC_BY_ID.size);
    for (const id of ALL_NPC_IDS) {
      expect(NPC_BY_ID.has(id)).toBe(true);
    }
  });

  it('findNpcById uses O(1) map lookup', () => {
    for (const npc of ALL_NPC_DEFINITIONS) {
      expect(findNpcById(npc.id)?.id).toBe(npc.id);
    }
  });

  it('indexes NPC_BY_DIALOGUE_NODE for every npc with dialogueNodeId', () => {
    for (const npc of ALL_NPC_DEFINITIONS) {
      if (!npc.dialogueNodeId) continue;
      expect(NPC_BY_DIALOGUE_NODE.get(npc.dialogueNodeId)?.id).toBe(npc.id);
    }
  });

  it('includes key story NPCs by id', () => {
    const keyIds = ['kate', 'maxim', 'anya', 'zeka', 'baba_zina', 'fisherman_trofim'] as const;
    for (const id of keyIds) {
      expect(findNpcById(id), id).toBeDefined();
    }
    expect(findNpcById('kate')?.name).toBe('Катя');
    expect(findNpcById('maxim')?.name).toBe('Максим');
    expect(findNpcById('anya')?.name).toBe('Аня');
    expect(findNpcById('zeka')?.name).toBe('Жека');
    expect(findNpcById('baba_zina')?.name).toBe('Баба Зина');
    expect(findNpcById('fisherman_trofim')?.name).toBe('Трофим');
  });

  it('findNpcByQuestId resolves expanded quest links', () => {
    expect(findNpcByQuestId('poetry_collection')?.id).toBe('kate');
    expect(findNpcByQuestId('tolpa_whisper')?.id).toBe('chk_ru');
  });

  it('groups NPCS_BY_FACTION only for NPCs with faction set', () => {
    for (const [faction, npcs] of Object.entries(NPCS_BY_FACTION)) {
      expect(faction).toBeTruthy();
      for (const npc of npcs) {
        expect(npc.faction).toBe(faction);
      }
    }
  });
});

describe('story and dialogue NPC cross-references', () => {
  it('resolves every STORY_NODE_TO_NPC_ID entry in the registry', () => {
    for (const [nodeId, npcId] of Object.entries(STORY_NODE_TO_NPC_ID)) {
      expect(isRegisteredNpcId(npcId), `story node ${nodeId} → ${npcId}`).toBe(true);
    }
  });

  it('resolves guidanceNpcId on story nodes', () => {
    for (const [nodeId, node] of Object.entries(STORY_NODES)) {
      if (!node.guidanceNpcId) continue;
      expect(isRegisteredNpcId(node.guidanceNpcId), `guidanceNpcId on ${nodeId}`).toBe(true);
    }
  });

  it('resolves npcChange effect targets in story nodes', () => {
    const npcIds = new Set<string>();
    for (const node of Object.values(STORY_NODES)) {
      collectNpcIdsFromEffects(node.effects, npcIds);
      for (const choice of node.choices) {
        collectNpcIdsFromEffects(choice.effects, npcIds);
      }
    }
    for (const npcId of npcIds) {
      expect(isRegisteredNpcId(npcId), `story npcChange → ${npcId}`).toBe(true);
    }
  });

  it('resolves dialogue speakers and speakerId when present', () => {
    for (const [nodeId, node] of Object.entries(DIALOGUE_NODES)) {
      if (node.speakerId) {
        expect(isRegisteredNpcId(node.speakerId), `speakerId on ${nodeId}`).toBe(true);
        continue;
      }
      if (!node.speaker || node.speaker === 'narrator') continue;
      const resolved = resolveNpcIdFromSpeaker(node.speaker, node.speakerId);
      if (resolved) {
        expect(isRegisteredNpcId(resolved), `speaker "${node.speaker}" on ${nodeId}`).toBe(true);
      }
    }
  });
});

describe('resolveNpcIdFromSpeaker', () => {
  it('prefers speakerId over display speaker and aliases', () => {
    expect(resolveNpcIdFromSpeaker('Wrong Name', 'kate')).toBe('kate');
    expect(resolveNpcIdFromSpeaker('Солныш', 'lyonya')).toBe('lyonya');
  });

  it('falls back to Russian speaker aliases for legacy nodes', () => {
    expect(resolveNpcIdFromSpeaker('Солныш')).toBe('solnysh');
    expect(resolveNpcIdFromSpeaker('Лёня')).toBe('lyonya');
    expect(resolveCanonicalNpcId('dmitry')).toBe('office_dmitry');
  });
});
