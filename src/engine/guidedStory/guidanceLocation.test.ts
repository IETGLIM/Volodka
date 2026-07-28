import { describe, expect, it, vi } from 'vitest';
import {
  buildGuidanceDirectionHint,
  enrichGuidanceWithLocation,
  resolveGuidanceTargetScene,
} from '@/engine/guidedStory/guidanceLocation';
import type { GuidanceInfo } from '@/engine/guidedStory/guidedStoryTypes';

vi.mock('@/engine/guidedStory/createGuidedStoryDeps', () => ({
  getStoryNodeSceneId: (nodeId: string) => {
    const map: Record<string, string> = {
      maria_curious: 'street_night',
      go_to_cafe: 'street_night',
      kitchen_table: 'home_evening',
    };
    return map[nodeId];
  },
}));

describe('guidanceLocation', () => {
  const getNpc = (nodeId: string) => (nodeId === 'maria_curious' ? 'maria' : undefined);

  it('resolves scene from story node id', () => {
    expect(
      resolveGuidanceTargetScene(
        { targetId: 'maria_curious', objectiveType: 'talk_to_npc' },
        getNpc,
      ),
    ).toBe('street_night');
  });

  it('resolves scene for NPC via story node mapping', () => {
    expect(
      resolveGuidanceTargetScene(
        { targetId: 'unknown_node', objectiveType: 'talk_to_npc' },
        () => 'maria',
      ),
    ).toBe('street_night');
  });

  it('builds in-scene direction hint', () => {
    expect(buildGuidanceDirectionHint('street_night', 'street_night')).toMatch(/этой локации/);
  });

  it('builds travel direction hint for other scenes', () => {
    const hint = buildGuidanceDirectionHint('cafe_evening', 'volodka_room');
    expect(hint).toMatch(/Перейдите:/);
  });

  it('resolves available quest giver scene from schedule', async () => {
    const { resolveAvailableQuestTargetScene } = await import('@/engine/guidedStory/guidanceLocation');
    const { resetScheduleEngineCache } = await import('@/shared/schedule/ScheduleEngine');
    resetScheduleEngineCache();
    const scene = resolveAvailableQuestTargetScene('kate', 10, {
      currentAct: 1,
      completedQuestIds: new Set(),
      activeFlagKeys: new Set(),
      playerFlags: {},
    });
    expect(scene).toBe('library_day');
  });

  it('enriches guidance with targetSceneId', () => {
    const base: GuidanceInfo = {
      objectiveText: 'Подойди к незнакомке',
      objectiveType: 'talk_to_npc',
      targetId: 'maria_curious',
      urgency: 'required',
      actNumber: 1,
      chapterTitle: 'Пробуждение',
    };
    const enriched = enrichGuidanceWithLocation(base, getNpc);
    expect(enriched.targetSceneId).toBe('street_night');
  });
});
