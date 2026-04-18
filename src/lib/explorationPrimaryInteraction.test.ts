import { describe, it, expect } from 'vitest';
import type { InteractiveObjectConfig } from '@/config/scenes';
import type { NPCDefinition, NPCState, TriggerState, TriggerZone } from '@/data/rpgTypes';
import { resolveExplorationPrimaryInteraction } from './explorationPrimaryInteraction';

const sceneId = 'home_evening' as const;

function trig(
  id: string,
  pos: { x: number; y: number; z: number },
  size: { x: number; y: number; z: number },
  opts?: Partial<TriggerZone>,
): TriggerZone {
  return {
    id,
    position: pos,
    size,
    sceneId,
    type: 'story',
    requiresInteraction: true,
    ...opts,
  };
}

function obj(id: string, xz: [number, number]): InteractiveObjectConfig {
  return { id, type: 'generic', position: [xz[0], 0, xz[1]] };
}

function npc(id: string, xz: { x: number; z: number }): NPCDefinition {
  return {
    id,
    name: id,
    model: 'generic',
    defaultPosition: { x: xz.x, y: 0, z: xz.z },
    sceneId,
  };
}

describe('resolveExplorationPrimaryInteraction', () => {
  it('prefers requiresInteraction trigger when player is inside AABB', () => {
    const playerPosition = { x: 0, y: 0, z: 0 };
    const triggers = [trig('door', { x: 0, y: 0, z: 0 }, { x: 4, y: 4, z: 4 })];
    const triggerStates: Record<string, TriggerState> = {};
    const objects = [obj('crate', [0.5, 0])];
    const npcs = [npc('alice', { x: 0.2, z: 0.2 })];
    const npcStates: Record<string, NPCState> = {
      alice: {
        id: 'alice',
        position: { x: 0.2, y: 0, z: 0.2 },
        rotation: 0,
        currentWaypoint: 0,
        isInteracting: false,
        dialogueHistory: [],
        lastInteractionTime: 0,
      },
    };

    const r = resolveExplorationPrimaryInteraction({
      playerPosition,
      sceneTriggers: triggers,
      triggerStates,
      sceneInteractiveObjects: objects,
      sceneNPCs: npcs,
      npcStates,
    });
    expect(r).toEqual({ kind: 'trigger', triggerId: 'door' });
  });

  it('chooses NPC when clearly closer than interactive object', () => {
    const playerPosition = { x: 0, y: 0, z: 0 };
    const objects = [obj('far', [2.4, 0])];
    const npcs = [npc('bob', { x: 0.5, z: 0 })];
    const npcStates: Record<string, NPCState> = {
      bob: {
        id: 'bob',
        position: { x: 0.5, y: 0, z: 0 },
        rotation: 0,
        currentWaypoint: 0,
        isInteracting: false,
        dialogueHistory: [],
        lastInteractionTime: 0,
      },
    };

    const r = resolveExplorationPrimaryInteraction({
      playerPosition,
      sceneTriggers: [],
      triggerStates: {},
      sceneInteractiveObjects: objects,
      sceneNPCs: npcs,
      npcStates,
    });
    expect(r.kind).toBe('npc');
    if (r.kind === 'npc') expect(r.npcId).toBe('bob');
  });

  it('chooses world object when clearly closer than NPC', () => {
    const playerPosition = { x: 0, y: 0, z: 0 };
    const objects = [obj('near', [0.4, 0])];
    const npcs = [npc('carol', { x: 2.5, z: 0 })];
    const npcStates: Record<string, NPCState> = {
      carol: {
        id: 'carol',
        position: { x: 2.5, y: 0, z: 0 },
        rotation: 0,
        currentWaypoint: 0,
        isInteracting: false,
        dialogueHistory: [],
        lastInteractionTime: 0,
      },
    };

    const r = resolveExplorationPrimaryInteraction({
      playerPosition,
      sceneTriggers: [],
      triggerStates: {},
      sceneInteractiveObjects: objects,
      sceneNPCs: npcs,
      npcStates,
    });
    expect(r.kind).toBe('world_object');
    if (r.kind === 'world_object') expect(r.object.id).toBe('near');
  });

  it('returns none when nothing in range', () => {
    const r = resolveExplorationPrimaryInteraction({
      playerPosition: { x: 0, y: 0, z: 0 },
      sceneTriggers: [],
      triggerStates: {},
      sceneInteractiveObjects: [obj('far', [10, 10])],
      sceneNPCs: [npc('dave', { x: 20, z: 20 })],
      npcStates: {
        dave: {
          id: 'dave',
          position: { x: 20, y: 0, z: 20 },
          rotation: 0,
          currentWaypoint: 0,
          isInteracting: false,
          dialogueHistory: [],
          lastInteractionTime: 0,
        },
      },
    });
    expect(r).toEqual({ kind: 'none' });
  });

  it('skips trigger that is already triggered', () => {
    const triggers = [trig('once', { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 2 })];
    const triggerStates: Record<string, TriggerState> = {
      once: { id: 'once', triggered: true, triggeredAt: 1 },
    };
    const r = resolveExplorationPrimaryInteraction({
      playerPosition: { x: 0, y: 0, z: 0 },
      sceneTriggers: triggers,
      triggerStates,
      sceneInteractiveObjects: [],
      sceneNPCs: [],
      npcStates: {},
    });
    expect(r.kind).toBe('none');
  });
});
