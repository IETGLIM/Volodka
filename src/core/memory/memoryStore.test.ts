import { beforeEach, describe, expect, it } from 'vitest';

import { useMemoryStore } from './memoryStore';

describe('memoryStore', () => {
  beforeEach(() => {
    useMemoryStore.setState({ memories: [], relationships: {} });
  });

  it('prepends newest and dedupes by id', () => {
    useMemoryStore.getState().addMemory({
      id: 'a',
      type: 'event',
      timestamp: 100,
      title: 'First',
      description: 'd1',
    });
    useMemoryStore.getState().addMemory({
      id: 'b',
      type: 'event',
      timestamp: 200,
      title: 'Second',
      description: 'd2',
    });
    expect(useMemoryStore.getState().memories.map((m) => m.id)).toEqual(['b', 'a']);

    useMemoryStore.getState().addMemory({
      id: 'a',
      type: 'event',
      timestamp: 300,
      title: 'First updated',
      description: 'd1u',
    });
    const ids = useMemoryStore.getState().memories.map((m) => m.id);
    expect(ids).toEqual(['a', 'b']);
    expect(useMemoryStore.getState().memories[0]?.title).toBe('First updated');
  });

  it('updates relationships when memory has relatedEntityId', () => {
    useMemoryStore.getState().addMemory({
      id: 'r',
      type: 'event',
      timestamp: 1,
      title: 't',
      description: 'd',
      relatedEntityId: 'npc_a',
      emotion: 'happy',
      intensity: 0.5,
    });
    expect(useMemoryStore.getState().relationships.npc_a).toBeDefined();
  });

  it('filters by tag and entity', () => {
    useMemoryStore.getState().addMemory({
      id: 'm1',
      type: 'dialogue',
      timestamp: 1,
      title: 't',
      description: 'd',
      tags: ['met_npc', 'x'],
      relatedEntityId: 'npc_z',
    });
    useMemoryStore.getState().addMemory({
      id: 'm2',
      type: 'event',
      timestamp: 2,
      title: 't2',
      description: 'd2',
      tags: ['other'],
    });
    expect(useMemoryStore.getState().getMemoriesByTag('met_npc').map((m) => m.id)).toEqual(['m1']);
    expect(useMemoryStore.getState().getMemoriesByEntity('npc_z').map((m) => m.id)).toEqual(['m1']);
  });
});
