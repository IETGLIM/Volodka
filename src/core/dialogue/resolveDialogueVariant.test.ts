import { beforeEach, describe, expect, it } from 'vitest';

import { useMemoryStore } from '@/core/memory/memoryStore';
import type { DialogueNode } from '@/data/rpgTypes';

import { resolveDialogueVariant } from './resolveDialogueVariant';

describe('resolveDialogueVariant', () => {
  const base: DialogueNode = {
    id: 'zarema_room_home',
    text: 'base',
    choices: [],
  };

  beforeEach(() => {
    useMemoryStore.setState({ memories: [], relationships: {} });
  });

  it('returns warm root when rapport and met_npc memory', () => {
    useMemoryStore.getState().addMemory({
      id: 'i1',
      type: 'event',
      timestamp: Date.now(),
      title: 't',
      description: 'd',
      tags: ['met_npc'],
      relatedEntityId: 'zarema_home',
      emotion: 'happy',
      intensity: 1,
    });
    const node = resolveDialogueVariant('zarema_home', base);
    expect(node.id).toBe('zarema_room_home_warm');
  });

  it('returns base for other npc', () => {
    const node = resolveDialogueVariant('albert', base);
    expect(node.id).toBe('zarema_room_home');
  });
});
