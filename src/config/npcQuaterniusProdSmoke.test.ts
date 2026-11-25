import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '@/config/sceneDefinitions';
import {
  resolveNpcModelUrl,
  resolveNpcVisualModelUrl,
  shouldRenderGltfNpc,
} from '@/config/npcModelRegistry';
import {
  QUATERNIUS_STORY_NPC_SLOT_IDS,
} from '@/config/quaterniusNpcSlots';
import { getScheduleBackedNpcIdsForScene } from '@/engine/scene/sceneGpuLifecycle';
import { QUALITY_PRESETS, allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';

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
      expect(shouldRenderGltfNpc(npcId, 'glb'), npcId).toBe(true);
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

  it('keeps shipped story-NPC GLBs available on every quality preset', () => {
    for (const preset of Object.values(QUALITY_PRESETS)) {
      expect(preset.npcRenderMode, `${preset.id} NPC mode`).not.toBe('procedural');
      for (const npcId of QUATERNIUS_STORY_NPC_SLOT_IDS) {
        expect(shouldRenderGltfNpc(npcId, preset.npcRenderMode), `${preset.id}: ${npcId}`).toBe(true);
      }
    }
  });

  it('resolves each shipped story NPC to the same GLB URL on every preset', () => {
    for (const npcId of QUATERNIUS_STORY_NPC_SLOT_IDS) {
      const modelPath = resolveNpcModelUrl(npcId);
      const expectedUrl = resolveNpcVisualModelUrl(npcId, modelPath, QUALITY_PRESETS.low.npcRenderMode);
      expect(expectedUrl, npcId).toBeTruthy();
      for (const preset of Object.values(QUALITY_PRESETS)) {
        expect(
          resolveNpcVisualModelUrl(npcId, modelPath, preset.npcRenderMode),
          `${preset.id}: ${npcId}`,
        ).toBe(expectedUrl);
      }
    }
  });

  it('keeps authored environment assets available on every quality preset', () => {
    for (const preset of Object.values(QUALITY_PRESETS)) {
      expect(
        allowsGlbAssetRendering(preset.environmentRenderMode),
        `${preset.id} environment mode`,
      ).toBe(true);
    }
  });
});
