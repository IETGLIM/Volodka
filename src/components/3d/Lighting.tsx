'use client';

/**
 * Шаг 6 (анти-мерцание): освещение и тени обхода вынесены в **`ExplorationLighting`**.
 *
 * - Размер карты теней: **`getExplorationDirectionalShadowMapSize`** (`lib/explorationShadowConstants.ts`) —
 *   шаг Г: десктоп **2048**, mobile/lite **1024**.
 * - **Bias** / **normalBias** — **`explorationShadowConstants`** (шаг Г: **−0.0005** / **0.02**).
 * - Дополнительные **pointLight** при `simplifyLights` отключаются стабильно по профилю, без покадрового
 *   мигания (не дублируйте второй **directionalLight** с `castShadow` — два каскада дают артефакты).
 *
 * Динамические огни на игроке (karma) — **`PhysicsPlayer`**: переключение зон осознанное, не каждый кадр
 * от расстояния.
 */

import { memo } from 'react';
import {
  EXPLORATION_DIRECTIONAL_SHADOW_BIAS,
  EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS,
} from '@/lib/explorationShadowConstants';

export {
  EXPLORATION_SHADOW_MAP_DESKTOP,
  EXPLORATION_SHADOW_MAP_MOBILE_LITE,
  EXPLORATION_DIRECTIONAL_SHADOW_BIAS,
  EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS,
  getExplorationDirectionalShadowMapSize,
  SCENE_ENVIRONMENT_SHADOW_MAP_SIZE,
} from '@/lib/explorationShadowConstants';

export type ExplorationLightingProps = {
  /** Уже с учётом смещения сцены (как раньше `sceneConfig.ambient + 0.3`). */
  ambientIntensity: number;
  hemisphereSky: string;
  hemisphereGround?: string;
  hemisphereIntensity?: number;
  directionalIntensity?: number;
  directionalPosition?: [number, number, number];
  directionalColor: string;
  pointColor: string;
  simplifyLights: boolean;
  shadowMapSize: number;
};

export const ExplorationLighting = memo(function ExplorationLighting({
  ambientIntensity,
  hemisphereSky,
  hemisphereGround = '#1a1a1a',
  hemisphereIntensity = 0.8,
  directionalIntensity = 0.6,
  directionalPosition = [5, 10, 5],
  directionalColor,
  pointColor,
  simplifyLights,
  shadowMapSize,
}: ExplorationLightingProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight
        color={hemisphereSky}
        groundColor={hemisphereGround}
        intensity={hemisphereIntensity}
      />
      <directionalLight
        position={directionalPosition}
        intensity={directionalIntensity}
        color={directionalColor}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={EXPLORATION_DIRECTIONAL_SHADOW_BIAS}
        shadow-normalBias={EXPLORATION_DIRECTIONAL_SHADOW_NORMAL_BIAS}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight position={[0, 4, 3]} intensity={simplifyLights ? 1.05 : 1.2} color={pointColor} distance={20} />
      {!simplifyLights && (
        <>
          <pointLight position={[-3, 2, 0]} intensity={0.6} color={pointColor} distance={15} />
          <pointLight position={[3, 2, 0]} intensity={0.6} color={pointColor} distance={15} />
        </>
      )}
    </>
  );
});
