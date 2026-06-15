import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { STORY_NODES } from '@/data/story';
import {
  GOLDEN_PATH_STORY_SPINE,
  GOLDEN_PATH_QUEST_SPINE,
  STORY_FLAG_TO_NODE_ID,
  ACT_TRANSITIONS,
} from '@/data/goldenPath';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { deriveStorySpine } from '@/engine/story/deriveGoldenPath';
import { STORY_NODES_ACT7 } from '@/data/story/act7';

const DATA_ROOT = join(process.cwd(), 'src/data');

/** Collect every flag set via setFlag across story, quests, CHK, exploration. */
function collectSetFlags(): Set<string> {
  const flags = new Set<string>();
  const flagRe = /setFlag['"]\s*,\s*flag:\s*['"]([^'"]+)['"]/g;

  function scanDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(full);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(entry.name)) continue;
      const text = readFileSync(full, 'utf8');
      let m: RegExpExecArray | null;
      while ((m = flagRe.exec(text)) !== null) {
        flags.add(m[1]);
      }
    }
  }

  scanDir(DATA_ROOT);
  return flags;
}

function mirrorFlagsFromAct7(): string[] {
  const flags = new Set<string>();
  for (const node of Object.values(STORY_NODES_ACT7)) {
    if (!node.id.includes('legacy_mirror')) continue;
    for (const choice of node.choices ?? []) {
      if (choice.condition?.flag) flags.add(choice.condition.flag);
    }
  }
  return [...flags].sort();
}

describe('Story connectivity (Acts 1–7)', () => {
  it('golden path spine nodes all exist in STORY_NODES', () => {
    for (const id of GOLDEN_PATH_STORY_SPINE) {
      expect(STORY_NODES[id], `missing spine node ${id}`).toBeTruthy();
    }
  });

  it('derived spine matches manual GOLDEN_PATH_STORY_SPINE', () => {
    const derived = deriveStorySpine(STORY_NODES, {
      fallbackStorySpine: GOLDEN_PATH_STORY_SPINE,
    });
    expect(derived.spine).toEqual(GOLDEN_PATH_STORY_SPINE);
    expect(derived.fallbackSteps).toEqual([]);
  });

  it('act 5→6 and 6→7 bridges are wired in story graph', () => {
    const bridges = [
      { from: 'act5_ending_epilogue', to: 'act6_bridge' },
      { from: 'act6_final_confrontation', to: 'act7_bridge' },
    ] as const;
    for (const { from, to } of bridges) {
      const node = STORY_NODES[from];
      expect(node, from).toBeTruthy();
      const reaches = node.choices?.some((c) => c.next === to);
      expect(reaches, `${from} → ${to}`).toBe(true);
    }
    expect(ACT_TRANSITIONS.find((t) => t.act === 5)?.nextActEntryNodeId).toBe('act6_bridge');
    expect(ACT_TRANSITIONS.find((t) => t.act === 6)?.nextActEntryNodeId).toBe('act7_bridge');
  });

  it('golden path quest spine references valid quests', () => {
    const questIds = new Set(QUEST_DEFINITIONS.map((q) => q.id));
    for (const id of GOLDEN_PATH_QUEST_SPINE) {
      expect(questIds.has(id), id).toBe(true);
    }
  });

  it('STORY_FLAG_TO_NODE_ID targets exist on spine or in graph', () => {
    for (const [flag, nodeId] of Object.entries(STORY_FLAG_TO_NODE_ID)) {
      expect(STORY_NODES[nodeId], `flag ${flag} → ${nodeId}`).toBeTruthy();
    }
  });

  it('act7 mirror condition flags are set somewhere in data pipeline', () => {
    const setFlags = collectSetFlags();
    const unset: string[] = [];
    for (const flag of mirrorFlagsFromAct7()) {
      if (!setFlags.has(flag)) unset.push(flag);
    }
    expect(unset, `mirror flags never set: ${unset.join(', ')}`).toEqual([]);
  });

  it('acts 4–7 main nodes have contextNote (AAA a11y baseline)', () => {
    const prefixes = ['act4_', 'act5_', 'act6_', 'act7_'];
    const missing: string[] = [];
    for (const [id, node] of Object.entries(STORY_NODES)) {
      if (!prefixes.some((p) => id.startsWith(p))) continue;
      if (id.includes('explore_mode')) continue;
      if (!node.contextNote) missing.push(id);
    }
    expect(missing, missing.slice(0, 10).join(', ')).toEqual([]);
  });

  it('acts 6–7 critical choice nodes autosave', () => {
    const critical = [
      'act6_dmitry_confession',
      'act6_final_confrontation',
      'act7_maria_future',
      'act7_true_end',
    ];
    for (const id of critical) {
      expect(STORY_NODES[id]?.autoSave, id).toBe(true);
    }
  });
});
