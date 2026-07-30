/* Shared Poly Haven PBR material for planar surfaces (street/room). */

import { usePolyHavenPbr } from '@/hooks/usePolyHavenPbr';
import type { PolyHavenMaterialId } from '@/config/polyhavenAssets';
import { useMemo } from 'react';
import * as THREE from 'three';

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
}: PolyHavenStandardMaterialProps) {
  const maps = usePolyHavenPbr(materialId, repeatScale);
  const normalScale = useMemo(() => new THREE.Vector2(0.62, 0.62), []);

  return (
    <meshStandardMaterial
      color={color}
      map={maps.map}
      normalMap={maps.normalMap}
      normalScale={normalScale}
      roughnessMap={maps.roughnessMap}
      aoMap={maps.aoMap}
      aoMapIntensity={0.95}
      envMapIntensity={0.72}
      metalness={metalness}
      roughness={roughness}
      polygonOffset={polygonOffset}
      polygonOffsetFactor={polygonOffset ? 1 : 0}
      polygonOffsetUnits={polygonOffset ? 1 : 0}
      transparent={transparent}
      opacity={opacity}
      depthWrite={depthWrite}
    />
  );
}
