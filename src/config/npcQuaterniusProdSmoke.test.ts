import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import {
  resolveNpcModelUrl,
  shouldRenderGltfNpc,
} from '@/config/npcModelRegistry';
import {
  QUATERNIUS_STORY_NPC_SLOT_IDS,
} from '@/config/quaterniusNpcSlots';
import { getScheduleBackedNpcIdsForScene } from '@/engine/scene/sceneGpuLifecycle';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';

describe('Quaternius NPC prod smoke', () => {
  it('keeps Quaternius rig GLBs on disk for pipeline / retargeting', () => {
    for (const npcId of QUATERNIUS_STORY_NPC_SLOT_IDS) {
      const url = resolveNpcModelUrl(npcId);
      expect(url, npcId).toBeTruthy();
      expect(url, npcId).toMatch(/\.glb$/);
    }
  });

  it('all Quaternius story NPCs now render with shipped GLBs', () => {
    // Every Quaternius story NPC slot should now have a real GLB model.
    for (const npcId of QUATERNIUS_STORY_NPC_SLOT_IDS) {
      expect(shouldRenderGltfNpc(npcId, 'ultra'), npcId).toBe(true);
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

  it('keeps medium+ presets GLB-capable for unique avatars when they land', () => {
    expect(QUALITY_PRESETS.medium.npcRenderMode).not.toBe('procedural');
    expect(QUALITY_PRESETS.high.npcRenderMode).not.toBe('procedural');
    expect(QUALITY_PRESETS.ultra.npcRenderMode).toBe('glb');
  });
});
