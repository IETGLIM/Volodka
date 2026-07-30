import { describe, expect, it } from 'vitest';
import {
  PHYSICS_SCENE_MOUNT_INVARIANTS,
  PHYSICS_SCENE_MOUNT_SECTIONS,
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
});
