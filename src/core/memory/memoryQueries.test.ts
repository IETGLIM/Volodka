import { beforeEach, describe, expect, it } from 'vitest';

import { useMemoryStore } from './memoryStore';
import { getDominantEmotion, getRelationship, hasMemory } from './memoryQueries';

describe('memoryQueries', () => {
  beforeEach(() => {
    useMemoryStore.setState({ memories: [], relationships: {} });
  });

  it('hasMemory reflects tags', () => {
    expect(hasMemory('met_npc')).toBe(false);
    useMemoryStore.getState().addMemory({
      id: 'x',
      type: 'event',
      timestamp: Date.now(),
      title: 't',
      description: 'd',
      tags: ['met_npc'],
    });
    expect(hasMemory('met_npc')).toBe(true);
  });

  it('getDominantEmotion picks weighted emotion', () => {
    useMemoryStore.getState().addMemory({
      id: 'a',
      type: 'emotion',
      timestamp: Date.now(),
      title: 't',
      description: 'd',
      emotion: 'happy',
      intensity: 1,
    });
    useMemoryStore.getState().addMemory({
      id: 'b',
      type: 'emotion',
      timestamp: Date.now(),
      title: 't2',
      description: 'd2',
      emotion: 'sad',
      intensity: 0.2,
    });
    expect(getDominantEmotion()).toBe('happy');
  });

  it('getRelationship returns 0..100', () => {
    expect(getRelationship('zarema_home')).toBe(50);
    useMemoryStore.getState().addMemory({
      id: 'r1',
      type: 'relationship',
      timestamp: Date.now(),
      title: 'rel',
      description: 'd',
      relatedEntityId: 'zarema_home',
      intensity: 0.8,
    });
    const v = getRelationship('zarema_home');
    expect(v).toBeGreaterThanOrEqual(50);
    expect(v).toBeLessThanOrEqual(100);
    expect(useMemoryStore.getState().relationships.zarema_home).toBe(v);
  });
});
