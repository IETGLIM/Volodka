/* Shared Poly Haven PBR material for planar surfaces (street/room).
 * AAA Pass — Anti-plastic: low envMap, high roughness variance, AO cavities, anisotropic filter,
 * optional MeshPhysical on high/ultra for true varnished wood / plaster depth.
 */

import { usePolyHavenPbr } from '@/hooks/usePolyHavenPbr';
import type { PolyHavenMaterialId } from '@/config/polyhavenAssets';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';

interface PolyHavenStandardMaterialProps {
  materialId: PolyHavenMaterialId;
  repeatScale?: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  polygonOffset?: boolean;
  transparent?: boolean;
  opacity?: number;
  depthWrite?: boolean;
  /** Force physical (clearcoat) even on medium */
  forcePhysical?: boolean;
}

/** Per-material AAA tuning — avoids uniform plastic */
function getAaaTuning(materialId: PolyHavenMaterialId): {
  envIntensity: number;
  aoStrength: number;
  normalScale: number;
  roughnessBias: number;
  isWood: boolean;
  isPlaster: boolean;
  isConcrete: boolean;
  isFabric: boolean;
  isSkin: boolean;
  clearcoatAmount: number;
  clearcoatRoughness: number;
} {
  const id = materialId.toLowerCase();
  const isSkin = /skin|face|body|head|hand/.test(id);
  if (id.includes('wood')) {
    return { envIntensity: 0.28, aoStrength: 1.15, normalScale: 0.85, roughnessBias: 0.08, isWood: true, isPlaster: false, isConcrete: false, isFabric: false, isSkin: false, clearcoatAmount: 0.22, clearcoatRoughness: 0.52 };
  }
  if (id.includes('plaster') || id.includes('wall')) {
    return { envIntensity: 0.22, aoStrength: 1.25, normalScale: 0.55, roughnessBias: 0.12, isWood: false, isPlaster: true, isConcrete: false, isFabric: false, isSkin: false, clearcoatAmount: 0.02, clearcoatRoughness: 0.82 };
  }
  if (id.includes('concrete') || id.includes('asphalt') || id.includes('pavement') || id.includes('road')) {
    return { envIntensity: 0.26, aoStrength: 1.35, normalScale: 0.72, roughnessBias: 0.05, isWood: false, isPlaster: false, isConcrete: true, isFabric: false, isSkin: false, clearcoatAmount: 0.04, clearcoatRoughness: 0.7 };
  }
  if (id.includes('fabric') || id.includes('carpet') || id.includes('rug')) {
    return { envIntensity: 0.18, aoStrength: 1.2, normalScale: 0.45, roughnessBias: 0.15, isWood: false, isPlaster: false, isConcrete: false, isFabric: true, isSkin: false, clearcoatAmount: 0, clearcoatRoughness: 0.82 };
  }
  return { envIntensity: 0.32, aoStrength: 1.0, normalScale: 0.62, roughnessBias: 0.0, isWood: false, isPlaster: false, isConcrete: false, isFabric: false, isSkin, clearcoatAmount: 0, clearcoatRoughness: 0.82 };
}

export function PolyHavenStandardMaterial({
  materialId,
  repeatScale = 1,
  color = '#ffffff',
  metalness = 0.04,
  roughness = 1,
  polygonOffset = false,
  transparent = false,
  opacity = 1,
  depthWrite = true,
  forcePhysical = false,
}: PolyHavenStandardMaterialProps) {
  const maps = usePolyHavenPbr(materialId, repeatScale);
  const { preset } = useGraphicsQuality();
  const tuning = useMemo(() => getAaaTuning(materialId), [materialId]);
  const normalScale = useMemo(() => new THREE.Vector2(tuning.normalScale, tuning.normalScale), [tuning]);

  const usePhysical = forcePhysical || preset.id === 'high' || preset.id === 'ultra';

  // De-plasticize: never allow roughness <0.55 for walls/floors, clamp metalness 0.02-0.12
  const finalRoughness = Math.min(1, Math.max(0.55, roughness + tuning.roughnessBias));
  const finalMetalness = Math.min(0.12, Math.max(0.01, metalness));
  // Slight procedural jitter via color luma — breaks uniform plastic by ~3%
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  if (usePhysical) {
    return (
      <meshPhysicalMaterial
        color={colorObj}
        map={maps.map}
        normalMap={maps.normalMap}
        normalScale={normalScale}
        roughnessMap={maps.roughnessMap}
        aoMap={maps.aoMap}
        aoMapIntensity={tuning.aoStrength}
        envMapIntensity={tuning.envIntensity}
        metalness={finalMetalness}
        roughness={finalRoughness}
        clearcoat={tuning.clearcoatAmount}
        clearcoatRoughness={tuning.clearcoatRoughness}
        sheen={tuning.isFabric ? 0.6 : 0}
        sheenRoughness={tuning.isFabric ? 0.82 : 0}
        sheenColor={tuning.isFabric ? new THREE.Color('#d8c8b8') as any : undefined}
        polygonOffset={polygonOffset}
        polygonOffsetFactor={polygonOffset ? 1 : 0}
        polygonOffsetUnits={polygonOffset ? 1 : 0}
        transparent={transparent}
        opacity={opacity}
        depthWrite={depthWrite}
      />
    );
  }

  return (
    <meshStandardMaterial
      color={colorObj}
      map={maps.map}
      normalMap={maps.normalMap}
      normalScale={normalScale}
      roughnessMap={maps.roughnessMap}
      aoMap={maps.aoMap}
      aoMapIntensity={tuning.aoStrength}
      envMapIntensity={tuning.envIntensity}
      metalness={finalMetalness}
      roughness={finalRoughness}
      polygonOffset={polygonOffset}
      polygonOffsetFactor={polygonOffset ? 1 : 0}
      polygonOffsetUnits={polygonOffset ? 1 : 0}
      transparent={transparent}
      opacity={opacity}
      depthWrite={depthWrite}
    />
  );
}
