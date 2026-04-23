import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  computeFinalVisualUniform,
  computeFinalVisualUniformFromBboxHeight,
  measureSkinnedHeightForScalePipeline,
} from '@/lib/explorationScalePipeline';
import { getExplorationHumanoidGlbScaleTuning } from '@/config/scenes';
import type { SceneId } from '@/data/types';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';

const NARROW_SCENES: SceneId[] = [
  'volodka_room',
  'zarema_albert_room',
  'volodka_corridor',
  'home_evening',
];

describe('computeFinalVisualUniformFromBboxHeight', () => {
  it('volodka_room + typical humanoid bbox yields uniform below interior ceiling', () => {
    const s = computeFinalVisualUniformFromBboxHeight({
      bboxHeightMeters: 1.72,
      tuningSceneId: 'volodka_room',
      roomModelScale: 0.48,
      isPlayer: true,
      introCutsceneActive: false,
    });
    expect(s.finalUniform).toBeGreaterThan(0.01);
    expect(s.finalUniform).toBeLessThanOrEqual(0.14);
  });

  it('intro_cutscene tuning on volodka_room is stricter than gameplay', () => {
    const game = computeFinalVisualUniformFromBboxHeight({
      bboxHeightMeters: 1.72,
      tuningSceneId: 'volodka_room',
      roomModelScale: 0.48,
      isPlayer: true,
      introCutsceneActive: false,
    });
    const intro = computeFinalVisualUniformFromBboxHeight({
      bboxHeightMeters: 1.72,
      tuningSceneId: 'volodka_room',
      roomModelScale: 0.48,
      isPlayer: true,
      introCutsceneActive: true,
    });
    expect(intro.targetMeters).toBeLessThanOrEqual(game.targetMeters);
    expect(intro.finalUniform).toBeLessThanOrEqual(game.finalUniform);
    expect(intro.introUniformHardCap).toBeDefined();
  });

  it('NPC path (definition.scale) matches pre-global product * definition', () => {
    const base = computeFinalVisualUniformFromBboxHeight({
      bboxHeightMeters: 1.72,
      tuningSceneId: 'zarema_albert_room',
      roomModelScale: 0.36,
      definitionModelScale: 1,
      isPlayer: false,
    });
    const scaled = computeFinalVisualUniformFromBboxHeight({
      bboxHeightMeters: 1.72,
      tuningSceneId: 'zarema_albert_room',
      roomModelScale: 0.36,
      definitionModelScale: 0.58,
      isPlayer: false,
    });
    expect(scaled.preGlobalProduct).toBeCloseTo(base.afterVisualMultiplier * 0.58, 5);
  });

  it('invalid bbox height uses fallback without throwing', () => {
    const s = computeFinalVisualUniformFromBboxHeight({
      bboxHeightMeters: 0.01,
      tuningSceneId: 'volodka_room',
      roomModelScale: 0.48,
      isPlayer: true,
    });
    expect(s.usedBboxFallback).toBe(true);
    expect(Number.isFinite(s.finalUniform)).toBe(true);
  });
});

describe('computeFinalVisualUniform (THREE root)', () => {
  it('non-unit root scale does not inflate measured height vs identity root', () => {
    const geom = new THREE.BoxGeometry(0.4, 1.8, 0.35);
    const mat = new THREE.MeshStandardMaterial();
    const mesh = new THREE.SkinnedMesh(geom, mat);
    mesh.geometry.computeBoundingBox();

    const g1 = new THREE.Group();
    g1.add(mesh);
    g1.scale.set(1, 1, 1);
    g1.updateMatrixWorld(true);

    const g2 = new THREE.Group();
    const mesh2 = new THREE.SkinnedMesh(geom.clone(), mat);
    mesh2.geometry.computeBoundingBox();
    g2.add(mesh2);
    g2.scale.set(2, 2, 2);
    g2.updateMatrixWorld(true);

    const scratch = new THREE.Vector3();
    const a = computeFinalVisualUniform({
      gltfRoot: g1,
      tuningSceneId: 'volodka_room',
      roomModelScale: 0.48,
      isPlayer: true,
    });
    const b = computeFinalVisualUniform({
      gltfRoot: g2,
      tuningSceneId: 'volodka_room',
      roomModelScale: 0.48,
      isPlayer: true,
    });
    expect(b.rootHadNonUnitScale).toBe(true);
    expect(Math.abs(a.finalUniform - b.finalUniform)).toBeLessThan(0.02);
  });
});

describe('measureSkinnedHeightForScalePipeline', () => {
  it('reports non-unit root', () => {
    const g = new THREE.Group();
    g.scale.set(3, 3, 3);
    const scratch = new THREE.Vector3();
    const { rootHadNonUnitScale } = measureSkinnedHeightForScalePipeline(g, scratch);
    expect(rootHadNonUnitScale).toBe(true);
  });
});

describe('getExplorationHumanoidGlbScaleTuning + NPC definitions', () => {
  it('every NPC with modelPath resolves tuning for its scene without throw', () => {
    for (const def of Object.values(NPC_DEFINITIONS)) {
      if (!def.modelPath?.trim()) continue;
      const sceneId = def.sceneId as SceneId;
      expect(() =>
        getExplorationHumanoidGlbScaleTuning(sceneId, false),
      ).not.toThrow();
      const t = getExplorationHumanoidGlbScaleTuning(sceneId, false);
      expect(t.targetMeters).toBeGreaterThan(0);
      expect(t.glbVisualUniformMultiplier).toBeGreaterThan(0);
    }
  });

  it('narrow exploration scenes keep final uniform in a sane band for mock humanoid height', () => {
    for (const sceneId of NARROW_SCENES) {
      const s = computeFinalVisualUniformFromBboxHeight({
        bboxHeightMeters: 1.72,
        tuningSceneId: sceneId,
        roomModelScale: 0.5,
        isPlayer: true,
      });
      expect(s.finalUniform).toBeGreaterThanOrEqual(0.04);
      expect(s.finalUniform).toBeLessThanOrEqual(0.35);
    }
  });
});
