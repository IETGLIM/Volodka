/**
 * SDF world React component — generates mesh, applies AAA surface shader + dynamic textures.
 * High/Ultra: asphalt ground bias via triplanar-style UV + brick/concrete maps blended by normal.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { buildSdfWorldLod } from './ProceduralSdfWorld';
import { generateDynamicTexturesSync } from './DynamicTextureGenerator';
import {
  createAaaSurfaceMaterial,
  ensureTangents,
  updateAaaSurfaceFromParams,
} from './AaaSurfaceShader';
import {
  getProceduralAaaParams,
  onProceduralAaaParamsChange,
  resolveParallaxLayersForQuality,
  resolveSdfResolutionForQuality,
  resolveSoftWorkForQuality,
  resolveTextureSizeForQuality,
  type ProceduralAaaParams,
} from './params';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

export interface ProceduralSdfWorldMeshProps {
  spectrumRef?: React.MutableRefObject<number>;
  onMeshReady?: (mesh: THREE.Mesh) => void;
  generationKey?: number;
}

export function ProceduralSdfWorldMesh({
  spectrumRef,
  onMeshReady,
  generationKey = 0,
}: ProceduralSdfWorldMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const { preset } = useGraphicsQuality();
  const [params, setParams] = useState<ProceduralAaaParams>(getProceduralAaaParams);

  useEffect(() => onProceduralAaaParamsChange(setParams), []);

  const { geometry, material } = useMemo(() => {
    const texSize = resolveTextureSizeForQuality(preset.id, params.textureSize);
    const sdfRes = resolveSdfResolutionForQuality(preset.id, params.sdfResolution);
    const parallaxLayers = resolveParallaxLayersForQuality(preset.id, params.parallaxLayers);
    const soft = resolveSoftWorkForQuality(preset.id, params);
    const effective = {
      ...params,
      sdfResolution: sdfRes,
      parallaxLayers,
      textureSize: texSize,
      dirtAmount: soft.dirtAmount,
      rainWash: soft.rainWash,
      volumetricRays: soft.volumetricRays,
    };

    // Ground + facade maps — asphalt primary, brick secondary for walls (shader blend)
    const asphalt = generateDynamicTexturesSync('asphalt', texSize, params.seed);
    const brick = generateDynamicTexturesSync('brick', texSize, params.seed + 3);
    const concrete = generateDynamicTexturesSync('concrete', texSize, params.seed + 1);

    const geo = buildSdfWorldLod(effective, 0);
    if (!geo.getAttribute('uv')) {
      const pos = geo.attributes.position!;
      const nrm = geo.attributes.normal;
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ny = nrm ? Math.abs(nrm.getY(i)) : 0.5;
        // Triplanar-ish: ground uses XZ; walls use XY/ZY
        if (ny > 0.55) {
          uvs[i * 2] = (x + 14) / 28;
          uvs[i * 2 + 1] = (z + 14) / 28;
        } else {
          uvs[i * 2] = (x + z + 14) / 28;
          uvs[i * 2 + 1] = (y + 1.5) / 14;
        }
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }
    ensureTangents(geo);

    // Prefer brick albedo on High/Ultra for facade read; asphalt height for parallax ground feel
    const useBrickHero = preset.id === 'ultra' || preset.id === 'high';
    const mat = createAaaSurfaceMaterial(
      {
        albedo: useBrickHero ? brick.albedo : asphalt.albedo,
        normal: useBrickHero ? brick.normal : asphalt.normal,
        roughness: useBrickHero ? concrete.roughness : asphalt.roughness,
        metalness: asphalt.metalness,
        height: asphalt.height,
      },
      effective,
    );
    // Stash secondary maps for runtime wall/ground blend
    mat.uniforms.uAlbedoB = { value: asphalt.albedo };
    mat.uniforms.uNormalB = { value: asphalt.normal };
    return { geometry: geo, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate on key/seed/res/quality
  }, [generationKey, params.seed, params.sdfResolution, params.textureSize, preset.id]);

  useEffect(() => {
    matRef.current = material;
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useEffect(() => {
    if (meshRef.current) onMeshReady?.(meshRef.current);
  }, [geometry, onMeshReady]);

  useEffect(() => {
    if (matRef.current) {
      const parallaxLayers = resolveParallaxLayersForQuality(preset.id, params.parallaxLayers);
      const soft = resolveSoftWorkForQuality(preset.id, params);
      updateAaaSurfaceFromParams(matRef.current, {
        ...params,
        parallaxLayers,
        dirtAmount: soft.dirtAmount,
        rainWash: soft.rainWash,
      });
    }
  }, [params, preset.id]);

  useFrameTick('misc', () => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime!.value = performance.now() * 0.001;
    mat.uniforms.uSpectrum!.value = spectrumRef?.current ?? 0;
  }, { priority: 20, label: 'proceduralAaa/sdfWorld' });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      name="ProceduralSdfWorld"
    />
  );
}
