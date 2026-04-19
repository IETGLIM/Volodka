import { describe, expect, it } from 'vitest';

import type { Memory } from './types';
import { recalculateRelationship } from './RelationshipEngine';

describe('recalculateRelationship', () => {
  it('clamps 0..100 with baseline and engagement', () => {
    const memories: Memory[] = [
      {
        id: '1',
        type: 'emotion',
        timestamp: 1,
        title: 't',
        description: 'd',
        relatedEntityId: 'npc_x',
        emotion: 'love',
        intensity: 1,
      },
    ];
    const v = recalculateRelationship('npc_x', memories);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(100);
  });
});
