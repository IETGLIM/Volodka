import { describe, expect, it } from 'vitest';
import { STORY_NODE_TO_NPC_ID } from '@/data/goldenPath';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { EXPANDED_NPCS } from '@/data/expandedNPCs';
import { CHK_NPCS } from '@/data/chkTolpa/npcs';
import { resolveCanonicalNpcId } from '@/data/goldenPath';

const npcIds = new Set([
  ...NPC_DEFINITIONS,
  ...EXPANDED_NPCS,
  ...CHK_NPCS,
].map((n) => n.id));

describe('STORY_NODE_TO_NPC_ID consistency', () => {
  it('maps every entry to a known NPC registry id', () => {
    const missing: string[] = [];
    for (const [nodeId, npcId] of Object.entries(STORY_NODE_TO_NPC_ID)) {
      const canonical = resolveCanonicalNpcId(npcId);
      if (!npcIds.has(canonical)) {
        missing.push(`${nodeId} → ${npcId} (canonical ${canonical})`);
      }
    }
    expect(missing, missing.join('\n')).toEqual([]);
  });

  it('includes Act VII ending NPC anchors', () => {
    expect(STORY_NODE_TO_NPC_ID.act7_final_walk).toBe('maria');
    expect(STORY_NODE_TO_NPC_ID.act7_goodbye_zarema).toBe('zarema');
    expect(STORY_NODE_TO_NPC_ID.act7_system_shutdown).toBe('zeka');
  });
});
