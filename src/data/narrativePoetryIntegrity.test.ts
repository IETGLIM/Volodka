import { describe, expect, it } from 'vitest';
import { STORY_NODES } from '@/data/storyNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { POEMS } from '@/data/poems';
import {
  GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS,
  GOLDEN_PATH_QUEST_SPINE,
} from '@/data/goldenPath';
import type { StoryChoice, StoryEffect, StoryNode } from '@/data/types';

const POEM_IDS = new Set(POEMS.map((p) => p.id));

function collectPoemIdsFromEffect(effect: StoryEffect | undefined, sink: Set<string>): void {
  if (!effect?.poemId) return;
  sink.add(effect.poemId);
}

function visitStoryNode(node: StoryNode, sink: Set<string>): void {
  collectPoemIdsFromEffect(node.onEnter, sink);
  collectPoemIdsFromEffect(node.effect, sink);

  for (const choice of node.choices ?? []) {
    const c = choice as StoryChoice;
    collectPoemIdsFromEffect(c.effect, sink);
    if (c.skillCheck?.successEffect) collectPoemIdsFromEffect(c.skillCheck.successEffect, sink);
    if (c.skillCheck?.failEffect) collectPoemIdsFromEffect(c.skillCheck.failEffect, sink);
  }

  for (const i of node.interpretations ?? []) {
    collectPoemIdsFromEffect(i.effect, sink);
  }

  const mg = node.minigame;
  if (mg) {
    collectPoemIdsFromEffect(mg.successEffect, sink);
    collectPoemIdsFromEffect(mg.failEffect, sink);
  }

  for (const r of node.randomEvents ?? []) {
    collectPoemIdsFromEffect(r.effect, sink);
  }
}

describe('narrative / poetry integrity', () => {
  it('every poemId in STORY_NODES effects exists in POEMS', () => {
    const found = new Set<string>();
    for (const node of Object.values(STORY_NODES)) {
      visitStoryNode(node, found);
    }
    for (const id of found) {
      expect(POEM_IDS.has(id), `unknown poemId in story graph: ${id}`).toBe(true);
    }
  });

  it('every non-empty POEMS[].unlocksAt references an existing story node', () => {
    for (const poem of POEMS) {
      if (!poem.unlocksAt?.trim()) continue; // напр. интро без узла выдачи
      expect(
        STORY_NODES[poem.unlocksAt],
        `POEMS[${poem.id}].unlocksAt → missing node: ${poem.unlocksAt}`,
      ).toBeDefined();
    }
  });

  it('golden-path and legacy-poetry quests: linkedStoryNodeId points at STORY_NODES', () => {
    const questIds = [...GOLDEN_PATH_QUEST_SPINE, ...GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS];
    for (const questId of questIds) {
      const quest = QUEST_DEFINITIONS[questId];
      expect(quest, `missing quest ${questId}`).toBeDefined();
      for (const obj of quest!.objectives) {
        if (!obj.linkedStoryNodeId) continue;
        expect(
          STORY_NODES[obj.linkedStoryNodeId],
          `quest ${questId} objective ${obj.id}: unknown linkedStoryNodeId ${obj.linkedStoryNodeId}`,
        ).toBeDefined();
      }
    }
  });
});
