'use client';

/**
 * Единый пайплайн визуального uniform для GLB игрока и NPC в обходе.
 * Все clamp'ы и множители сходятся здесь; вызывающий код только применяет `finalUniform` к группе.
 */

import * as THREE from 'three';
import type { SceneId } from '@/data/types';
import { getExplorationHumanoidGlbScaleTuning } from '@/config/scenes';
import {
  applyExplorationPlayerGlobalVisualScale,
  applyExplorationPlayerGlbVisualUniformMultiplier,
  clampExplorationHumanoidGlbUniformForScene,
  computeExplorationPlayerGlbUniformFromBBox,
} from '@/lib/playerScaleConstants';
import {
  getGltfSkinnedVisualHeightMeters,
  GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M,
} from '@/lib/gltfSkinnedBoundingHeight';

/** Согласовано с `gltfSkinnedBoundingHeight` — подставляется при невалидной высоте bbox. */
export const PLAYER_VISUAL_HEIGHT_FALLBACK_M = GLTF_SKINNED_VISUAL_HEIGHT_FALLBACK_M;

const BBOX_HEIGHT_MIN_VALID = 0.55;
const BBOX_HEIGHT_MAX_VALID = 22;

export type FinalVisualUniformStages = {
  rawMeasuredHeight: number;
  bboxHeightUsed: number;
  rootHadNonUnitScale: boolean;
  usedBboxFallback: boolean;
  targetMeters: number;
  glbVisualUniformMultiplier: number;
  roomModelScale: number;
  definitionModelScale: number;
  uniformFromBbox: number;
  afterVisualMultiplier: number;
  preGlobalProduct: number;
  afterGlobalVisualScale: number;
  afterSceneClamp: number;
  introUniformHardCap?: number;
  finalUniform: number;
};

function clampRoomModelScale(rs: number): number {
  return Number.isFinite(rs) ? Math.max(0.28, Math.min(1.25, rs)) : 1;
}

function warnDevUniformOutOfRange(uniform: number) {
  if (process.env.NODE_ENV !== 'development') return;
  if (!Number.isFinite(uniform) || uniform > 0.5 || uniform < 0.001) {
    console.warn('[explorationScalePipeline] Unusual final uniform — check bbox and SCENE_CONFIG', {
      uniform,
    });
  }
}

/**
 * Измерение высоты с учётом неединичного `scale` корня: при необходимости — `clone(true)` и scale (1,1,1),
 * чтобы bbox не умножался на экспортный корень.
 */
export function measureSkinnedHeightForScalePipeline(
  root: THREE.Object3D,
  scratch: THREE.Vector3,
): { rawMeasuredHeight: number; rootHadNonUnitScale: boolean } {
  const rootHadNonUnitScale =
    root.scale.x !== 1 || root.scale.y !== 1 || root.scale.z !== 1;
  let measureTarget: THREE.Object3D = root;
  if (rootHadNonUnitScale) {
    measureTarget = root.clone(true);
    measureTarget.scale.set(1, 1, 1);
    measureTarget.updateMatrixWorld(true);
  } else {
    root.updateMatrixWorld(true);
  }
  const rawMeasuredHeight = getGltfSkinnedVisualHeightMeters(measureTarget, scratch);
  return { rawMeasuredHeight, rootHadNonUnitScale };
}

function normalizeBboxHeight(rawMeasuredHeight: number): { bboxHeightUsed: number; usedBboxFallback: boolean } {
  if (
    !Number.isFinite(rawMeasuredHeight) ||
    rawMeasuredHeight < BBOX_HEIGHT_MIN_VALID ||
    rawMeasuredHeight > BBOX_HEIGHT_MAX_VALID
  ) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[explorationScalePipeline] Bbox height out of range; using fallback', {
        rawMeasuredHeight,
        fallbackM: PLAYER_VISUAL_HEIGHT_FALLBACK_M,
      });
    }
    return { bboxHeightUsed: PLAYER_VISUAL_HEIGHT_FALLBACK_M, usedBboxFallback: true };
  }
  return { bboxHeightUsed: rawMeasuredHeight, usedBboxFallback: false };
}

/**
 * Полная цепочка от **уже измеренной** высоты bbox (м). Для тестов и моков без THREE.
 */
export function computeFinalVisualUniformFromBboxHeight(params: {
  bboxHeightMeters: number;
  tuningSceneId: SceneId;
  clampSceneId?: SceneId;
  roomModelScale: number;
  definitionModelScale?: number;
  introCutsceneActive?: boolean;
  isPlayer: boolean;
}): FinalVisualUniformStages {
  const roomModelScale = clampRoomModelScale(params.roomModelScale);
  const definitionModelScale =
    params.definitionModelScale != null &&
    Number.isFinite(params.definitionModelScale) &&
    params.definitionModelScale > 0
      ? params.definitionModelScale
      : 1;

  const tuning = getExplorationHumanoidGlbScaleTuning(
    params.tuningSceneId,
    !!params.introCutsceneActive && params.isPlayer,
  );

  const rawMeasuredHeight = params.bboxHeightMeters;
  const { bboxHeightUsed, usedBboxFallback } = normalizeBboxHeight(rawMeasuredHeight);

  const uniformFromBbox =
    !Number.isFinite(bboxHeightUsed) || bboxHeightUsed < 1e-4
      ? 0.12 * roomModelScale
      : computeExplorationPlayerGlbUniformFromBBox(bboxHeightUsed, tuning.targetMeters, roomModelScale);

  const afterVisualMultiplier = applyExplorationPlayerGlbVisualUniformMultiplier(
    uniformFromBbox,
    tuning.glbVisualUniformMultiplier,
  );
  const preGlobalProduct = afterVisualMultiplier * definitionModelScale;
  const afterGlobalVisualScale = applyExplorationPlayerGlobalVisualScale(preGlobalProduct);
  const clampSceneId = params.clampSceneId ?? params.tuningSceneId;
  const afterSceneClamp = clampExplorationHumanoidGlbUniformForScene(clampSceneId, afterGlobalVisualScale);
  const cap = tuning.introUniformHardCap;
  const finalUniform =
    cap != null && Number.isFinite(cap) && cap > 0 ? Math.min(afterSceneClamp, cap) : afterSceneClamp;

  warnDevUniformOutOfRange(finalUniform);

  return {
    rawMeasuredHeight,
    bboxHeightUsed,
    rootHadNonUnitScale: false,
    usedBboxFallback,
    targetMeters: tuning.targetMeters,
    glbVisualUniformMultiplier: tuning.glbVisualUniformMultiplier,
    roomModelScale,
    definitionModelScale,
    uniformFromBbox,
    afterVisualMultiplier,
    preGlobalProduct,
    afterGlobalVisualScale,
    afterSceneClamp,
    introUniformHardCap: cap ?? undefined,
    finalUniform,
  };
}

/**
 * Полный расчёт: измерение bbox на `gltfRoot` + единая цепочка множителей и clamp'ов.
 */
export function computeFinalVisualUniform(params: {
  gltfRoot: THREE.Object3D;
  tuningSceneId: SceneId;
  clampSceneId?: SceneId;
  roomModelScale: number;
  definitionModelScale?: number;
  introCutsceneActive?: boolean;
  isPlayer: boolean;
}): FinalVisualUniformStages {
  const scratch = new THREE.Vector3();
  const { rawMeasuredHeight, rootHadNonUnitScale } = measureSkinnedHeightForScalePipeline(
    params.gltfRoot,
    scratch,
  );
  const inner = computeFinalVisualUniformFromBboxHeight({
    bboxHeightMeters: rawMeasuredHeight,
    tuningSceneId: params.tuningSceneId,
    clampSceneId: params.clampSceneId,
    roomModelScale: params.roomModelScale,
    definitionModelScale: params.definitionModelScale,
    introCutsceneActive: params.introCutsceneActive,
    isPlayer: params.isPlayer,
  });
  return {
    ...inner,
    rootHadNonUnitScale,
    /** Если корень был не (1,1,1), `getGltfSkinnedVisualHeightMeters` мог вернуть fallback — fallback уже в inner.usedBboxFallback */
    usedBboxFallback: inner.usedBboxFallback,
  };
}
