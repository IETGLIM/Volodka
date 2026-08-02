/* Shared rain-wet planar reflector ground — Poly Haven asphalt/concrete PBR. */

import { Suspense, useRef, useLayoutEffect, type ComponentRef } from 'react';
import { MeshReflectorMaterial } from '@react-three/drei';
import { useWetSurfaceMaterial } from '@/hooks/useWetSurfaceMaterial';
import { registerFrameTick, unregisterFrameTick } from '@/engine/frame/FrameBudgetRegistry';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { allowsHeavyGfxFeature } from '@/engine/graphics/qualityFeatureGates';
import {
  allowsUltraSsrWetStreet,
  getReflectorMaterialSettings,
  getUltraSsrWetStreetMirrorAmount,
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
  // Three-state wet-street gate:
  //  (1) Ultra SSR tier — 1024-res planar reflector + anisotropic streak blur
  //      + rain-gated strong mirror (only on ultra + non-winter + non-coarse
  //      + non-reduced-motion + wet-street scene). The user explicitly asked
  //      for ultra-only SSR wet streets — medium/high keep the basic reflector.
  //  (2) Basic reflector tier — legacy 256/384-res path (medium/high).
  //  (3) Plain wet MeshStandard — low/auto/winter/coarse/reduced-motion.
  const useUltraSsr =
    !isWinter
    && !reducedMotion
    && allowsUltraSsrWetStreet(sceneId, selectedPreset, { coarsePointer });
  const useBasicReflector =
    !useUltraSsr
    && !isWinter
    && !reducedMotion
    && isWetStreetScene(sceneId)
    && allowsHeavyGfxFeature(selectedPreset, 'reflector', { coarsePointer });
  const usePlanarReflector = useUltraSsr || useBasicReflector;
  const groundColor = groundColorOverride ?? (winterSheen?.groundColor ?? '#ffffff');
  const dryRoughness = winterSheen
    ? Math.max(0.12, winterSheen.dryRoughness - winterSheen.sheenBoost * 0.5)
    : 0.85;
  const dryMetalness = winterSheen
    ? Math.min(0.7, winterSheen.dryMetalness + winterSheen.sheenBoost * 0.5)
    : 0.05;
  const effectiveRain = isWinter ? 0 : rainIntensity;
  const mixStrength = scaleReflectorMixStrength(reflectorSettings.mixStrength, effectiveRain);
  const maps = usePolyHavenPbr(isWinter ? 'concrete_floor_painted' : 'asphalt_02', size / 60);
  // Ultra SSR tier uses the rain-gated strong mirror formula; basic reflector
  // keeps the legacy 0.5 + 0.1 ultra mirror boost (ultra never reaches the
  // basic path now — useUltraSsr takes precedence when allowed).
  const basicMirrorBoost = useBasicReflector && preset.id === 'ultra' ? 0.1 : 0;
  const mirrorAmount = useUltraSsr
    ? effectiveRain >= (reflectorSettings.mixShowThreshold ?? 0)
      ? getUltraSsrWetStreetMirrorAmount(effectiveRain)
      : 0
    : (0.5 + basicMirrorBoost) * Math.min(1, 0.4 + effectiveRain * 0.6);
  // Ultra SSR tier swaps the uniform blur for an anisotropic streak tuple
  // (heavy horizontal, light vertical) — mimics screen-space SSR streak blur.
  const reflectorBlur: [number, number] = useUltraSsr
    ? (reflectorSettings.streakBlur ?? reflectorSettings.blur)
    : reflectorSettings.blur;

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

  // FIX S12-A7: MeshReflectorMaterial (drei) creates 2 WebGLRenderTargets
  // (fbo1 + fbo2) + a BlurPass in React.useMemo with NO cleanup useEffect.
  // On scene exit, ~16MB GPU memory leaks on ultra. Best-effort disposal on
  // unmount: try drei's internal fbo1/fbo2/blurpass fields (not in the public
  // type — wrapped in try/catch), AND dispose the material's texture uniforms
  // (tDiffuse=fbo1.texture, tDiffuseBlur=fbo2.texture, tDepth=fbo1.depthTexture)
  // which ARE accessible via the material's getters — this releases the GPU
  // textures even though the render-target framebuffers themselves are local
  // to drei's component and not directly reachable. Texture disposal is the
  // primary cleanup path; fbo1/fbo2/blurpass disposal is a defensive no-op
  // that becomes effective if drei ever exposes those fields.
  useLayoutEffect(() => {
    const mat = reflectorMatRef.current;
    if (!mat) return;
    return () => {
      try {
        const anyMat = mat as unknown as {
          fbo1?: { dispose?: () => void };
          fbo2?: { dispose?: () => void };
          blurpass?: { dispose?: () => void };
          reflectionHash?: unknown;
          tDiffuse?: { dispose?: () => void };
          tDiffuseBlur?: { dispose?: () => void };
          tDepth?: { dispose?: () => void };
        };
        anyMat.fbo1?.dispose?.();
        anyMat.fbo2?.dispose?.();
        anyMat.blurpass?.dispose?.();
        anyMat.tDiffuse?.dispose?.();
        anyMat.tDiffuseBlur?.dispose?.();
        anyMat.tDepth?.dispose?.();
      } catch {
        // best-effort — ignore disposal errors
      }
    };
  }, []);

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      receiveShadow
      position-y={0.0025}
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
          blur={reflectorBlur}
          resolution={reflectorSettings.resolution}
          mixBlur={0.85}
          mixStrength={mixStrength}
          mirror={mirrorAmount}
          depthScale={1.15}
          minDepthThreshold={0.45}
          maxDepthThreshold={1.5}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
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
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
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
  // Parity with the PBR variant: three-state wet-street gate so the
  // procedural fallback (loaded while PBR maps stream in) matches the PBR
  // component's ultra SSR / basic reflector / MeshStandard split.
  const useUltraSsr =
    !isWinter
    && !reducedMotion
    && allowsUltraSsrWetStreet(sceneId, selectedPreset, { coarsePointer });
  const useBasicReflector =
    !useUltraSsr
    && !isWinter
    && !reducedMotion
    && isWetStreetScene(sceneId)
    && allowsHeavyGfxFeature(selectedPreset, 'reflector', { coarsePointer });
  const usePlanarReflector = useUltraSsr || useBasicReflector;
  const groundColor = groundColorOverride ?? (winterSheen?.groundColor ?? '#3a3a52');
  const dryRoughness = winterSheen
    ? Math.max(0.12, winterSheen.dryRoughness - winterSheen.sheenBoost * 0.5)
    : 0.85;
  const dryMetalness = winterSheen
    ? Math.min(0.7, winterSheen.dryMetalness + winterSheen.sheenBoost * 0.5)
    : 0.05;
  const effectiveRain = isWinter ? 0 : rainIntensity;
  const mixStrength = scaleReflectorMixStrength(reflectorSettings.mixStrength, effectiveRain);
  const wetMat = useWetSurfaceMaterial(groundColor, {
    dryRoughness,
    dryMetalness,
    rainIntensity: effectiveRain,
  });
  // Parity with the PBR variant: Ultra SSR mirror formula + anisotropic streak blur.
  const basicMirrorBoost = useBasicReflector && preset.id === 'ultra' ? 0.1 : 0;
  const mirrorAmount = useUltraSsr
    ? effectiveRain >= (reflectorSettings.mixShowThreshold ?? 0)
      ? getUltraSsrWetStreetMirrorAmount(effectiveRain)
      : 0
    : (0.5 + basicMirrorBoost) * Math.min(1, 0.4 + effectiveRain * 0.6);
  const reflectorBlur: [number, number] = useUltraSsr
    ? (reflectorSettings.streakBlur ?? reflectorSettings.blur)
    : reflectorSettings.blur;

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

  // FIX S12-A7: see WetStreetGroundPbr for the full rationale. Same best-effort
  // FBO + texture disposal on unmount — duplicated here because this fallback
  // mounts its own MeshReflectorMaterial instance while PBR maps stream in.
  useLayoutEffect(() => {
    const mat = reflectorMatRef.current;
    if (!mat) return;
    return () => {
      try {
        const anyMat = mat as unknown as {
          fbo1?: { dispose?: () => void };
          fbo2?: { dispose?: () => void };
          blurpass?: { dispose?: () => void };
          reflectionHash?: unknown;
          tDiffuse?: { dispose?: () => void };
          tDiffuseBlur?: { dispose?: () => void };
          tDepth?: { dispose?: () => void };
        };
        anyMat.fbo1?.dispose?.();
        anyMat.fbo2?.dispose?.();
        anyMat.blurpass?.dispose?.();
        anyMat.tDiffuse?.dispose?.();
        anyMat.tDiffuseBlur?.dispose?.();
        anyMat.tDepth?.dispose?.();
      } catch {
        // best-effort — ignore disposal errors
      }
    };
  }, []);

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      receiveShadow
      position-y={0.0025}
      geometry={getSharedPlaneGeometry(size, size)}
    >
      {usePlanarReflector ? (
        <MeshReflectorMaterial
          ref={reflectorMatRef}
          color={groundColor}
          roughness={dryRoughness}
          metalness={dryMetalness}
          blur={reflectorBlur}
          resolution={reflectorSettings.resolution}
          mixBlur={0.85}
          mixStrength={mixStrength}
          mirror={mirrorAmount}
          depthScale={1.15}
          minDepthThreshold={0.45}
          maxDepthThreshold={1.5}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
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
