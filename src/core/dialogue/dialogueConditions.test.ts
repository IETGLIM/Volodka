import { beforeEach, describe, expect, it } from 'vitest';

import { useMemoryStore } from '@/core/memory/memoryStore';

import { checkDialogueCondition } from './dialogueConditions';

describe('checkDialogueCondition', () => {
  beforeEach(() => {
    useMemoryStore.setState({ memories: [], relationships: {} });
  });

  it('evaluates hasMemory and relationship', () => {
    useMemoryStore.getState().addMemory({
      id: 'm1',
      type: 'event',
      timestamp: Date.now(),
      title: 't',
      description: 'd',
      tags: ['met_npc'],
      relatedEntityId: 'zarema_home',
      emotion: 'happy',
      intensity: 1,
    });
    expect(
      checkDialogueCondition('hasMemory("met_npc") && relationship(zarema_home) > 42'),
    ).toBe(true);
  });

  it('evaluates dominantEmotion', () => {
    useMemoryStore.getState().addMemory({
      id: 'e1',
      type: 'emotion',
      timestamp: Date.now(),
      title: 't',
      description: 'd',
      emotion: 'sad',
      intensity: 1,
    });
    expect(checkDialogueCondition('dominantEmotion === "sad"')).toBe(true);
  });
});
