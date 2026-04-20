import { describe, expect, it } from 'vitest';
import {
  compactExplorationForSave,
  compactQuestProgressForSave,
  estimateJsonUtf8Bytes,
} from './persistedGameSnapshot';
import type { ExplorationState, NPCState } from '@/data/rpgTypes';

describe('persistedGameSnapshot', () => {
  it('compactExplorationForSave drops npcStates and keeps only triggered triggers', () => {
    const stubNpc: NPCState = {
      id: 'a',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      currentWaypoint: 0,
      isInteracting: false,
      dialogueHistory: [],
      lastInteractionTime: 0,
    };
    const ex: ExplorationState = {
      playerPosition: { x: 1, y: 0, z: 2, rotation: 0 },
      currentSceneId: 'volodka_room',
      timeOfDay: 10,
      npcStates: { a: stubNpc },
      triggerStates: {
        t1: { id: 't1', triggered: false },
        t2: { id: 't2', triggered: true, triggeredAt: 123 },
      },
      worldItems: [],
      exploredAreas: [],
      lastSceneTransition: 0,
    };
    const c = compactExplorationForSave(ex);
    expect('npcStates' in c).toBe(false);
    expect(c.triggerStates.t2.triggered).toBe(true);
    expect('t1' in c.triggerStates).toBe(false);
  });

  it('compactQuestProgressForSave drops zero values', () => {
    expect(
      compactQuestProgressForSave({
        q1: { a: 0, b: 2 },
        q2: { x: 0 },
      }),
    ).toEqual({ q1: { b: 2 } });
  });

  it('estimateJsonUtf8Bytes', () => {
    expect(estimateJsonUtf8Bytes({ a: 'я' })).toBeGreaterThan(3);
  });
});
