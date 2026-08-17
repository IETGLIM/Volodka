import { describe, expect, it } from 'vitest';
import { SCENE_IDS } from '@/config/sceneIds';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { resolveDerivedSceneId } from '@/config/sceneInheritance';
import {
  VISUAL_COMPONENT_TO_SCENE_ROOT,
  VISUAL_SCENE_ROOTS,
  validateAllSceneIdInvariants,
  validateAssetOwnershipDeployUrls,
  validateSceneAssetOwnershipCoverage,
  validateSceneColliderCoverage,
  validateSceneIdRegistryAlignment,
  validateSceneScheduleParents,
  validateSceneVisualCoverage,
  validateSceneWorldRegistryCoverage,
} from '@/config/sceneIdInvariants';
import { getSceneSlotOwnership } from '@/config/assetOwnership';
import { getSceneInteriorAssets } from '@/config/sceneInteriorAssets';

describe('sceneId invariants', () => {
  it('keeps SCENE_IDS and SCENE_DEFINITIONS in sync', () => {
    expect(validateSceneIdRegistryAlignment()).toEqual([]);
    expect(Object.keys(SCENE_DEFINITIONS).sort()).toEqual([...SCENE_IDS].sort());
  });

  it('gives every scene a visual root via inheritance or dedicated case', () => {
    expect(validateSceneVisualCoverage()).toEqual([]);
    for (const sceneId of SCENE_IDS) {
      expect(VISUAL_SCENE_ROOTS.has(resolveDerivedSceneId(sceneId))).toBe(true);
    }
  });

  it('maps every visualComponent to the derived visual root', () => {
    for (const sceneId of SCENE_IDS) {
      const def = SCENE_DEFINITIONS[sceneId];
      const expectedRoot = resolveDerivedSceneId(sceneId);
      expect(VISUAL_COMPONENT_TO_SCENE_ROOT[def.visualComponent]).toBe(expectedRoot);
    }
  });

  it('requires floor colliders and valid exit targets for every scene', () => {
    expect(validateSceneColliderCoverage()).toEqual([]);
  });

  it('registers every scene in world locations, chunks, and district cells', () => {
    expect(validateSceneWorldRegistryCoverage()).toEqual([]);
  });

  it('keeps schedule parents and schedule scene references valid', () => {
    expect(validateSceneScheduleParents()).toEqual([]);
  });

  it('requires interior_shell ownership when generic interior assets are declared', () => {
    expect(validateSceneAssetOwnershipCoverage()).toEqual([]);
    expect(getSceneInteriorAssets('volodka_room')).toEqual([]);
    expect(getSceneSlotOwnership('volodka_corridor', 'interior_shell')).toHaveLength(1);
  });

  it('keeps authored shell deploy keep-list URLs on disk', () => {
    expect(validateAssetOwnershipDeployUrls()).toEqual([]);
  });

  it('passes the combined invariant gate with no drift', () => {
    expect(validateAllSceneIdInvariants()).toEqual([]);
  });
});
