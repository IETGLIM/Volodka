/* Shared rain-wet planar reflector ground — Poly Haven asphalt/concrete PBR. */

import { Suspense, useRef, useLayoutEffect, type ComponentRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useWetSurfaceMaterial } from '@/hooks/useWetSurfaceMaterial';
import { registerFrameTick, unregisterFrameTick } from '@/engine/frame/FrameBudgetRegistry';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import {
  getReflectorMaterialSettings,
  getWinterIceSheenSettings,
  isWetStreetScene,
  scaleReflectorMixStrength,
} from '@/engine/graphics/wetStreetScenes';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { applyWetness } from '@/engine/graphics/materials/pbrPresets';
import { applySurfaceDetailMaps } from '@/engine/graphics/proceduralSurfaceTextures';
import { getSharedPlaneGeometry } from '@/engine/three/moduleGeometryRegistry';
import { usePolyHavenPbr } from '@/hooks/usePolyHavenPbr';
import type { SceneId } from '@/shared/types/game';
import * as THREE from 'three';

export type WetStreetGroundProps = {
  sceneId: SceneId;
  isWinter?: boolean;
  rainIntensity: number;
  size?: number;
  groundColor?: string;
};

function WetStreetGroundPbr({
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
  const winterSheen = isWinter ? getWinterIceSheenSettings() : null;
  const usePlanarReflector =
    isWetStreetScene(sceneId)
    && !isWinter
    && !reducedMotion
    && allowsHeavyGfxFeature(selectedPreset, 'reflector', { coarsePointer });
  const groundColor = groundColorOverride ?? (winterSheen?.groundColor ?? '#ffffff');
  const dryRoughness = winterSheen?.dryRoughness ?? 0.85;
  const dryMetalness = winterSheen?.dryMetalness ?? 0.05;
  const effectiveRain = isWinter ? 0 : rainIntensity;
  const mixStrength = scaleReflectorMixStrength(reflectorSettings.mixStrength, effectiveRain);
  const maps = usePolyHavenPbr(isWinter ? 'concrete_floor_painted' : 'asphalt_02', size / 60);

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
          map={maps.map}
          normalMap={maps.normalMap}
          normalScale={new THREE.Vector2(0.75, 0.75)}
          roughnessMap={maps.roughnessMap}
          aoMap={maps.aoMap}
          roughness={dryRoughness}
          metalness={dryMetalness}
          blur={reflectorSettings.blur}
          resolution={reflectorSettings.resolution}
          mixBlur={0.85}
          mixStrength={mixStrength}
          mirror={0.5 * Math.min(1, 0.4 + effectiveRain * 0.6)}
          depthScale={1.15}
          minDepthThreshold={0.45}
          maxDepthThreshold={1.5}
        />
      ) : (
        <meshStandardMaterial
          color={groundColor}
          map={maps.map}
          normalMap={maps.normalMap}
          normalScale={new THREE.Vector2(0.75, 0.75)}
          roughnessMap={maps.roughnessMap}
          aoMap={maps.aoMap}
          roughness={dryRoughness}
          metalness={dryMetalness}
        />
      )}
    </mesh>
  );
}

/** Procedural fallback while PBR maps load / on failure. */
function WetStreetGroundProceduralFallback({
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
  const winterSheen = isWinter ? getWinterIceSheenSettings() : null;
  const usePlanarReflector =
    isWetStreetScene(sceneId)
    && !isWinter
    && !reducedMotion
    && allowsHeavyGfxFeature(selectedPreset, 'reflector', { coarsePointer });
  const groundColor = groundColorOverride ?? (winterSheen?.groundColor ?? '#3a3a52');
  const dryRoughness = winterSheen?.dryRoughness ?? 0.85;
  const dryMetalness = winterSheen?.dryMetalness ?? 0.05;
  const effectiveRain = isWinter ? 0 : rainIntensity;
  const mixStrength = scaleReflectorMixStrength(reflectorSettings.mixStrength, effectiveRain);
  const wetMat = useWetSurfaceMaterial(groundColor, {
    dryRoughness,
    dryMetalness,
    rainIntensity: effectiveRain,
  });

  useLayoutEffect(() => {
    if (usePlanarReflector) return;
    applySurfaceDetailMaps(wetMat, isWinter ? 'concrete' : 'asphalt', preset.textureScale, size / 60);
  }, [wetMat, usePlanarReflector, isWinter, preset.textureScale, size]);

  const reflectorMatRef = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);
  const wetActive = effectiveRain > 0;

  useLayoutEffect(() => {
    if (!usePlanarReflector) return;
    const mat = reflectorMatRef.current;
    if (!mat) return;
    applySurfaceDetailMaps(mat, 'asphalt', preset.textureScale, size / 60);
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
  }, [usePlanarReflector, wetActive, dryRoughness, dryMetalness, effectiveRain, preset.textureScale, size]);

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
          mirror={0.5 * Math.min(1, 0.4 + effectiveRain * 0.6)}
          depthScale={1.15}
          minDepthThreshold={0.45}
          maxDepthThreshold={1.5}
        />
      ) : (
        <primitive object={wetMat} attach="material" />
      )}
    </mesh>
  );
}

/** Rain-wet ground plane with Poly Haven asphalt (Suspense → procedural fallback). */
export function WetStreetGround(props: WetStreetGroundProps) {
  return (
    <Suspense fallback={<WetStreetGroundProceduralFallback {...props} />}>
      <WetStreetGroundPbr {...props} />
    </Suspense>
  );
}
