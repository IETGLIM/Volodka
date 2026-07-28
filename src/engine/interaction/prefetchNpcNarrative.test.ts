import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  prefetchNpcNarrativeOnApproach,
  resetNpcNarrativePrefetchForTests,
} from './prefetchNpcNarrative';

vi.mock('@/data/gameDataLoader', () => ({
  findNpcById: (id: string) =>
    id === 'maria' ? { id: 'maria', dialogueNodeId: 'maria_greeting' } : undefined,
  prefetchDialogueNodes: vi.fn(),
  prefetchStoryNodes: vi.fn(),
}));

vi.mock('@/engine/scene/sceneGpuLifecycle', () => ({
  preloadNpcModel: vi.fn(),
}));

vi.mock('@/engine/interaction/npcNarrativeRouting', () => ({
  resolveNpcNarrativeTarget: (npcId: string) =>
    npcId === 'maria'
      ? { kind: 'dialogue' as const, nodeId: 'maria_greeting' }
      : npcId === 'solnysh'
        ? { kind: 'story' as const, nodeId: 'solnysh_room_talk' }
        : null,
}));

describe('prefetchNpcNarrativeOnApproach', () => {
  beforeEach(() => {
    resetNpcNarrativePrefetchForTests();
    vi.clearAllMocks();
  });

  it('prefetches dialogue + GLB once per NPC', async () => {
    const { prefetchDialogueNodes } = await import('@/data/gameDataLoader');
    const { preloadNpcModel } = await import('@/engine/scene/sceneGpuLifecycle');

    prefetchNpcNarrativeOnApproach('maria', 'street_night');
    prefetchNpcNarrativeOnApproach('maria', 'street_night');

    expect(preloadNpcModel).toHaveBeenCalledTimes(1);
    expect(prefetchDialogueNodes).toHaveBeenCalledWith(['maria_greeting']);
  });

  it('prefetches story nodes when target is story', async () => {
    const { prefetchStoryNodes } = await import('@/data/gameDataLoader');

    prefetchNpcNarrativeOnApproach('solnysh', 'solnysh_room');

    expect(prefetchStoryNodes).toHaveBeenCalledWith(['solnysh_room_talk']);
  });
});
