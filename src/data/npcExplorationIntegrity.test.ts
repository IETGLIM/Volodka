import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ANIME_CUTSCENES } from '@/data/animeCutscenes';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { STORY_NODES } from '@/data/storyNodes';
import { STORY_TRIGGERS } from '@/data/triggerZones';
import { rewriteLegacyModelPath } from '@/config/modelUrls';

describe('3D / exploration data integrity', () => {
  it('defines explore_mode story node aligned with default 3D start (Volodka room)', () => {
    const node = STORY_NODES.explore_mode;
    expect(node).toBeDefined();
    expect(node?.id).toBe('explore_mode');
    expect(node?.scene).toBe('volodka_room');
  });

  it('maps every NPC legacy modelPath to an existing file under public/models-external', () => {
    const publicModels = join(process.cwd(), 'public', 'models-external');
    const basenames = new Set<string>();

    for (const npc of Object.values(NPC_DEFINITIONS)) {
      if (!npc.modelPath) continue;
      const resolved = rewriteLegacyModelPath(npc.modelPath);
      if (/^https?:\/\//i.test(resolved)) {
        throw new Error(`NPC ${npc.id}: remote modelPath not checked in this test: ${resolved}`);
      }
      const file = resolved.split('/').pop();
      expect(file, `NPC ${npc.id}: empty filename`).toBeTruthy();
      basenames.add(file!);
    }

    for (const name of basenames) {
      const full = join(publicModels, name);
      expect(existsSync(full), `Missing GLB for NPC models: ${name}`).toBe(true);
    }
  });

  it('resolves every trigger storyNodeId to STORY_NODES', () => {
    for (const t of STORY_TRIGGERS) {
      if (!t.storyNodeId) continue;
      expect(STORY_NODES[t.storyNodeId], `Unknown storyNodeId on trigger ${t.id}: ${t.storyNodeId}`).toBeDefined();
    }
  });

  it('resolves every trigger cutsceneId to ANIME_CUTSCENES', () => {
    for (const t of STORY_TRIGGERS) {
      if (!t.cutsceneId) continue;
      expect(
        ANIME_CUTSCENES[t.cutsceneId],
        `Unknown cutsceneId on trigger ${t.id}: ${t.cutsceneId}`,
      ).toBeDefined();
    }
  });
});
