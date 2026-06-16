import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import { resolveNpcModelUrl } from '@/config/npcModelRegistry';
import {
  QUATERNIUS_STORY_NPC_SLOT_IDS,
} from '@/config/quaterniusNpcSlots';
import { getScheduleBackedNpcIdsForScene } from '@/engine/scene/sceneGpuLifecycle';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';

describe('Quaternius NPC prod smoke (medium+ GLB path)', () => {
  it('ships all 19 story Quaternius slot GLBs on disk', () => {
    for (const npcId of QUATERNIUS_STORY_NPC_SLOT_IDS) {
      const url = resolveNpcModelUrl(npcId);
      expect(url, npcId).toBeTruthy();
      expect(url, npcId).toMatch(/\.glb$/);
    }
  });

  it('schedules every story NPC slot in at least one hero scene', () => {
    const scheduled = new Set<string>();
    for (const sceneId of SCENE_IDS) {
      for (const npcId of getScheduleBackedNpcIdsForScene(sceneId)) {
        scheduled.add(npcId);
      }
    }

    const missing = QUATERNIUS_STORY_NPC_SLOT_IDS.filter((id) => !scheduled.has(id));
    expect(missing, `Add schedule entries for: ${missing.join(', ')}`).toEqual([]);
  });

  it('enables GLB NPC rendering from medium preset upward', () => {
    expect(QUALITY_PRESETS.medium.npcRenderMode).not.toBe('procedural');
    expect(QUALITY_PRESETS.high.npcRenderMode).not.toBe('procedural');
    expect(QUALITY_PRESETS.ultra.npcRenderMode).toBe('glb');
  });
});
