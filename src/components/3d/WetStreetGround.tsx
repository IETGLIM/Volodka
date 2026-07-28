/* Shared rain-wet planar reflector ground for night street scenes. */

import { useRef, useLayoutEffect, type ComponentRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useWetSurfaceMaterial } from '@/hooks/useWetSurfaceMaterial';
import { registerFrameTick, unregisterFrameTick } from '@/engine/frame/FrameBudgetRegistry';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import {
  getReflectorMaterialSettings,
  isWetStreetScene,
  scaleReflectorMixStrength,
} from '@/engine/graphics/wetStreetScenes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { applyWetness } from '@/engine/graphics/materials/pbrPresets';
import { getSharedPlaneGeometry } from '@/engine/three/moduleGeometryRegistry';
import type { SceneId } from '@/shared/types/game';

export type WetStreetGroundProps = {
  sceneId: SceneId;
  isWinter?: boolean;
  rainIntensity: number;
  /** World-space ground plane size (default 60 matches street alley). */
  size?: number;
  groundColor?: string;
};

/** Rain-wet ground plane. Medium+ uses planar reflections on wet street scenes. */
export function WetStreetGround({
  sceneId,
  isWinter = false,
  rainIntensity,
  size = 60,
  groundColor: groundColorOverride,
}: WetStreetGroundProps) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const reducedMotion = useEffectiveReducedMotion();
  const reflectorSettings = getReflectorMaterialSettings(preset.id);
  const usePlanarReflector =
    isWetStreetScene(sceneId)
    && !isWinter
    && !reducedMotion
    && allowsHeavyGfxFeature(selectedPreset, 'reflector', { coarsePointer });
  const groundColor = groundColorOverride ?? (isWinter ? '#a0a8b8' : '#3a3a52');
  const dryRoughness = isWinter ? 0.7 : 0.85;
  const dryMetalness = 0.05;
  const effectiveRain = isWinter ? 0 : rainIntensity;
  const mixStrength = scaleReflectorMixStrength(reflectorSettings.mixStrength, effectiveRain);

  const wetMat = useWetSurfaceMaterial(groundColor, {
    dryRoughness,
    dryMetalness,
    rainIntensity: effectiveRain,
  });

  const reflectorMatRef = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);
  const wetActive = effectiveRain > 0;

  useLayoutEffect(() => {
    if (!usePlanarReflector) return;

    const mat = reflectorMatRef.current;
    if (!mat) return;

    if (!wetActive) {
      applyWetness(mat, dryRoughness, dryMetalness, 0);
      return;
    }

    const tickId = registerFrameTick('weather', () => {
      const current = reflectorMatRef.current;
      if (!current) return;
      applyWetness(current, dryRoughness, dryMetalness, effectiveRain);
    });

    return () => unregisterFrameTick(tickId);
  }, [usePlanarReflector, wetActive, dryRoughness, dryMetalness, effectiveRain]);

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      receiveShadow
      position-y={0.001}
      geometry={getSharedPlaneGeometry(size, size)}
    >
      {usePlanarReflector ? (
        <MeshReflectorMaterial
          ref={reflectorMatRef}
          color={groundColor}
          roughness={dryRoughness}
          metalness={dryMetalness}
          blur={reflectorSettings.blur}
          resolution={reflectorSettings.resolution}
          mixBlur={0.85}
          mixStrength={mixStrength}
          mirror={0.45 * Math.min(1, 0.35 + effectiveRain * 0.65)}
          depthScale={1}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.4}
        />
      ) : (
        <primitive object={wetMat} attach="material" />
      )}
    </mesh>
  );
}
