import { describe, expect, it } from 'vitest';
import {
  buildStoryNodes,
  buildStoryRegistryFrom,
  STORY_NODE_SOURCES,
} from '@/data/story/buildStoryNodes';
import { STORY_NODES, validateStoryNodes } from '@/data/story';
import { STORY_NODES_ACT1_OFFICE_AFTERMATH } from '@/data/story/act1ExtendedOfficeAftermath';
import { STORY_NODES_PHASE5_QUESTS } from '@/data/story/phase5QuestStory';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { resolveCanonicalNpcId } from '@/shared/npcIdAliases';
import type { StoryEffect } from '@/shared/types/game';

/**
 * P2 contract suite (v4.48.13): story-node pack merging is order-invariant,
 * every redefinition is declared explicitly, and the merged registry stays
 * referentially sound (transitions, quest links, NPC ids).
 */

/** Deterministic permutations of the canonical source order. */
function shuffledOrders(): string[][] {
  const base = STORY_NODE_SOURCES.map((s) => s.name);
  const orders: string[][] = [[...base].reverse(), [...base.slice(7), ...base.slice(0, 7)]];
  // Fixed-seed LCG shuffle for reproducibility.
  let seed = 20260101;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const shuffled = [...base];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  orders.push(shuffled);
  return orders;
}

describe('story registry — explicit override contract', () => {
  it('confines redefinitions to the five declared overrides', () => {
    const { conflicts, undeclaredConflicts, staleOverrides } = buildStoryRegistryFrom(STORY_NODE_SOURCES);
    expect(conflicts.map((c) => c.id).sort()).toEqual([
      'balcony_thought',
      'fix_success',
      'friday_arrives',
      'office_colleague',
      'vladimir_secret_room',
    ]);
    expect(undeclaredConflicts).toEqual([]);
    expect(staleOverrides).toEqual([]);
    for (const conflict of conflicts) {
      expect(conflict.definitionsDiffer, conflict.id).toBe(true);
      expect(conflict.declaredOverrideSource, conflict.id).toBe(conflict.winnerSource);
    }
  });

  it('resolves the canonical winner from the override pack, not merge order', () => {
    const { registry } = buildStoryRegistryFrom(STORY_NODE_SOURCES);
    for (const id of ['fix_success', 'office_colleague', 'balcony_thought', 'friday_arrives']) {
      expect(registry[id]).toBe(STORY_NODES_ACT1_OFFICE_AFTERMATH[id]);
    }
    expect(registry['vladimir_secret_room']).toBe(STORY_NODES_PHASE5_QUESTS['vladimir_secret_room']);
  });

  it.each(shuffledOrders().map((order, i) => [i, order] as const))(
    'order permutation #%i produces the identical registry',
    (_i, order) => {
      const canonical = buildStoryRegistryFrom(STORY_NODE_SOURCES);
      const sources = order.map((name) => STORY_NODE_SOURCES.find((s) => s.name === name)!);
      expect(sources).toHaveLength(STORY_NODE_SOURCES.length);
      const permuted = buildStoryRegistryFrom(sources);
      expect(permuted.registry).toEqual(canonical.registry);
      expect(permuted.undeclaredConflicts).toEqual([]);
      // The declared winners do not move when packs arrive in any order.
      expect(JSON.stringify(permuted.conflicts.map((c) => [c.id, c.winnerSource]))).toBe(
        JSON.stringify(canonical.conflicts.map((c) => [c.id, c.winnerSource])),
      );
    },
  );

  it('throws on an undeclared conflict instead of silently overwriting', () => {
    const packA = {
      name: 'testPackA',
      nodes: {
        ghost_node: {
          ...STORY_NODES_ACT1_OFFICE_AFTERMATH.fix_success,
          id: 'ghost_node',
          text: 'variant A',
        },
      },
    };
    const packB = {
      name: 'testPackB',
      nodes: {
        ghost_node: {
          ...STORY_NODES_ACT1_OFFICE_AFTERMATH.fix_success,
          id: 'ghost_node',
          text: 'variant B',
        },
      },
    };
    expect(() =>
      buildStoryRegistryFrom([...STORY_NODE_SOURCES, packA, packB], { strict: true }),
    ).toThrow(/ghost_node.*without a declared override/s);
    // Declared overrides stay legal: re-adding a copy of an override id is fine.
    const intruder = {
      name: 'intruder',
      nodes: { fix_success: { ...STORY_NODES_ACT1_OFFICE_AFTERMATH.fix_success, text: 'rewritten' } },
    };
    expect(() => buildStoryRegistryFrom([...STORY_NODE_SOURCES, intruder], { strict: true })).not.toThrow();
  });

  it('buildStoryNodes() matches the pure builder output', () => {
    expect(buildStoryNodes()).toEqual(buildStoryRegistryFrom(STORY_NODE_SOURCES).registry);
  });
});

describe('story registry — referential soundness', () => {
  it('keeps every choice transition inside the merged registry', () => {
    expect(validateStoryNodes(STORY_NODES)).toEqual([]);
  });

  it('links every quest to existing story nodes and vice versa', () => {
    const questIds = new Set(QUEST_DEFINITIONS.map((q) => q.id));
    for (const quest of QUEST_DEFINITIONS) {
      if (quest.linkedStoryNodeId) {
        expect(STORY_NODES[quest.linkedStoryNodeId], `quest ${quest.id} → node`).toBeDefined();
      }
      for (const nodeId of quest.linkedStoryNodeIds ?? []) {
        expect(STORY_NODES[nodeId], `quest ${quest.id} → node ${nodeId}`).toBeDefined();
      }
    }
    let triggerRefs = 0;
    const walkEffects = (nodeId: string, effects: readonly StoryEffect[] | undefined) => {
      for (const effect of effects ?? []) {
        if (effect.type === 'triggerQuest' && effect.questId) {
          triggerRefs++;
          expect(questIds.has(effect.questId), `node ${nodeId} → quest ${effect.questId}`).toBe(true);
        }
      }
    };
    for (const [nodeId, node] of Object.entries(STORY_NODES)) {
      walkEffects(nodeId, node.effects);
      for (const choice of node.choices) walkEffects(nodeId, choice.effects);
    }
    expect(triggerRefs).toBeGreaterThan(200);
  });

  it('resolves every NPC reference in story nodes through the canonical registry', () => {
    const npcIds = new Set(ALL_NPC_DEFINITIONS.map((npc) => npc.id));
    expect(npcIds.size).toBeGreaterThan(40);
    const check = (nodeId: string, ref: string) => {
      const canonical = resolveCanonicalNpcId(ref);
      expect(npcIds.has(canonical), `node ${nodeId} → NPC "${ref}" (${canonical})`).toBe(true);
    };
    for (const [nodeId, node] of Object.entries(STORY_NODES)) {
      if (node.guidanceNpcId) check(nodeId, node.guidanceNpcId);
      for (const effect of node.effects ?? []) {
        if (effect.type === 'npcChange' && effect.npcId) check(nodeId, effect.npcId);
      }
      for (const choice of node.choices) {
        for (const effect of choice.effects ?? []) {
          if (effect.type === 'npcChange' && effect.npcId) check(nodeId, effect.npcId);
        }
      }
    }
  });
});
