import { describe, expect, it } from 'vitest';
import {
  PHYSICS_SCENE_MOUNT_INVARIANTS,
  PHYSICS_SCENE_MOUNT_SECTIONS,
  PHYSICS_SCENE_MOUNT_WRAPPERS,
  PHYSICS_SCENE_SECTION_MOUNTS,
} from './physicsSceneMountOrder';

describe('physicsSceneMountOrder', () => {
  it('declares a complete ordered section list', () => {
    expect(PHYSICS_SCENE_MOUNT_SECTIONS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(PHYSICS_SCENE_MOUNT_SECTIONS).size).toBe(PHYSICS_SCENE_MOUNT_SECTIONS.length);
  });

  it('keeps lifecycle bridges before interaction system', () => {
    const lifecycleIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('lifecycle_bridges');
    const interactionIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('interaction_system');
    expect(lifecycleIdx).toBeGreaterThanOrEqual(0);
    expect(interactionIdx).toBeGreaterThan(lifecycleIdx);
  });

  it('keeps lighting_and_environment as the final section', () => {
    expect(PHYSICS_SCENE_MOUNT_SECTIONS.at(-1)).toBe('lighting_and_environment');
  });

  it('documents invariants with before/after sections in valid order', () => {
    for (const { before, after, reason } of PHYSICS_SCENE_MOUNT_INVARIANTS) {
      const beforeIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf(before);
      const afterIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf(after);
      expect(beforeIdx, `${before} → ${after}: ${reason}`).toBeGreaterThanOrEqual(0);
      expect(afterIdx, `${before} → ${after}: ${reason}`).toBeGreaterThan(beforeIdx);
    }
  });

  it('maps every section to at least one mount id', () => {
    for (const section of PHYSICS_SCENE_MOUNT_SECTIONS) {
      expect(PHYSICS_SCENE_SECTION_MOUNTS[section].length, section).toBeGreaterThan(0);
    }
  });

  it('keeps npc mounts before cinematic triggers before interaction bridges', () => {
    const npcIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('npc_and_ambient');
    const cinematicIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('cinematic_and_triggers');
    const bridgesIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('interaction_bridges');
    expect(npcIdx).toBeLessThan(cinematicIdx);
    expect(cinematicIdx).toBeLessThan(bridgesIdx);
  });

  it('documents extracted mount wrappers for Stage 11+ decomposition', () => {
    expect(PHYSICS_SCENE_MOUNT_WRAPPERS.PhysicsSceneWorldDressingMounts).toBe('world_dressing');
    expect(PHYSICS_SCENE_MOUNT_WRAPPERS.PhysicsSceneNpcMounts).toBe('npc_and_ambient');
    expect(PHYSICS_SCENE_MOUNT_WRAPPERS.PhysicsSceneCinematicMounts).toBe('cinematic_and_triggers');
    expect(PHYSICS_SCENE_MOUNT_WRAPPERS.PhysicsSceneProximityQuestMounts).toBe('proximity_and_quests');
    expect(PHYSICS_SCENE_SECTION_MOUNTS.world_dressing[0]).toBe('PhysicsSceneWorldDressingMounts');
    expect(PHYSICS_SCENE_SECTION_MOUNTS.npc_and_ambient[0]).toBe('PhysicsSceneNpcMounts');
    expect(PHYSICS_SCENE_SECTION_MOUNTS.cinematic_and_triggers[0]).toBe('PhysicsSceneCinematicMounts');
    expect(PHYSICS_SCENE_SECTION_MOUNTS.proximity_and_quests[0]).toBe('PhysicsSceneProximityQuestMounts');
  });

  it('keeps world dressing before npc mounts and proximity after interaction bridges', () => {
    const dressingIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('world_dressing');
    const npcIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('npc_and_ambient');
    const bridgesIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('interaction_bridges');
    const proximityIdx = PHYSICS_SCENE_MOUNT_SECTIONS.indexOf('proximity_and_quests');
    expect(dressingIdx).toBeLessThan(npcIdx);
    expect(bridgesIdx).toBeLessThan(proximityIdx);
  });
});
