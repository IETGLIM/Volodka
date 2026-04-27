import { describe, expect, it } from 'vitest';
import type { StoryNode } from '@/data/types';
import { STORY_NODES } from '@/data/storyNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import {
  GOLDEN_PATH_BRANCH_HINTS,
  GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS,
  GOLDEN_PATH_QUEST_SPINE,
  GOLDEN_PATH_STORY_SPINE,
  GOLDEN_PATH_TARGET_ENDING_NODE_ID,
} from '@/data/goldenPath';

/** Все явные переходы из узла (как при обходе выбора / автопрогона в рантайме). */
function collectOutgoingStoryTargetIds(node: StoryNode): string[] {
  const out: string[] = [];
  if (node.autoNext) out.push(node.autoNext);
  for (const ch of node.choices ?? []) {
    out.push(ch.next);
    if (ch.skillCheck?.successNext) out.push(ch.skillCheck.successNext);
    if (ch.skillCheck?.failNext) out.push(ch.skillCheck.failNext);
  }
  const mg = node.minigame;
  if (mg) {
    out.push(mg.successNext, mg.failNext);
  }
  for (const r of node.randomEvents ?? []) {
    if (r.nextNode) out.push(r.nextNode);
  }
  return out;
}

describe('goldenPath data', () => {
  it('spine nodes exist in STORY_NODES', () => {
    for (const { nodeId } of GOLDEN_PATH_STORY_SPINE) {
      expect(STORY_NODES[nodeId], `missing story node: ${nodeId}`).toBeDefined();
    }
  });

  it('quest spine ids exist in QUEST_DEFINITIONS', () => {
    for (const id of GOLDEN_PATH_QUEST_SPINE) {
      expect(QUEST_DEFINITIONS[id], `missing quest: ${id}`).toBeDefined();
    }
    for (const id of GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS) {
      expect(QUEST_DEFINITIONS[id], `missing optional quest: ${id}`).toBeDefined();
    }
  });

  it('branch hints point to existing next nodes and choices match story data', () => {
    for (const { atNodeId, choose, nextNodeId } of GOLDEN_PATH_BRANCH_HINTS) {
      expect(STORY_NODES[nextNodeId]).toBeDefined();
      const node = STORY_NODES[atNodeId];
      expect(node?.choices?.some((c) => c.text === choose && c.next === nextNodeId) || node?.autoNext === nextNodeId).toBe(true);
    }
  });

  it('target ending node is an ending type', () => {
    const end = STORY_NODES[GOLDEN_PATH_TARGET_ENDING_NODE_ID];
    expect(end?.type).toBe('ending');
  });

  it('no immediate self-loop: story node never points to itself via next/autoNext/skill/minigame/randomEvent', () => {
    for (const [id, node] of Object.entries(STORY_NODES)) {
      for (const target of collectOutgoingStoryTargetIds(node)) {
        expect(target, `STORY_NODES[${id}] references itself as next target`).not.toBe(id);
      }
    }
  });

  /**
   * Циклы `choice.next` ↔ (напр. перечитать стих) допустимы; автопрогон по одному только `autoNext`
   * не должен зациклиться — иначе рантайм может крутиться без выбора игрока.
   */
  it('no autoNext-only directed cycles in STORY_NODES', () => {
    for (const startId of Object.keys(STORY_NODES)) {
      const seen = new Set<string>();
      let cur: string | undefined = startId;
      while (cur) {
        expect(seen.has(cur), `autoNext-only cycle touches "${cur}" (walk started at "${startId}")`).toBe(false);
        seen.add(cur);
        cur = STORY_NODES[cur]?.autoNext;
      }
    }
  });
});
