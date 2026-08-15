/* Aviator sunglasses for Volodka — gradient dark lenses. */

import { useMemo } from 'react';
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace } from 'three';
import {
  getSharedBoxGeometry,
  getSharedCylinderGeometry,
  getSharedTorusGeometry,
} from '@/engine/three/moduleGeometryRegistry';

function createGradientLensTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, '#1a1018');
  grad.addColorStop(0.45, '#2a1828');
  grad.addColorStop(1, '#0a0610');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // Soft specular streak
  const shine = ctx.createLinearGradient(0, 8, size, size - 8);
  shine.addColorStop(0, 'rgba(80,60,90,0)');
  shine.addColorStop(0.4, 'rgba(120,90,140,0.35)');
  shine.addColorStop(1, 'rgba(40,30,50,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Small aviator frames for procedural head (local face space). */
export function ProceduralAviatorGlasses() {
  const lensMap = useMemo(() => createGradientLensTexture(), []);
  const lensMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: lensMap,
        color: '#ffffff',
        emissiveMap: lensMap,
        emissive: '#221018',
        emissiveIntensity: 0.18,
        roughness: 0.22,
        metalness: 0.4,
        transparent: true,
        opacity: 0.88,
      }),
    [lensMap],
  );
  const frameMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#c0a060',
        roughness: 0.35,
        metalness: 0.85,
      }),
    [],
  );

  return (
    <group position={[0, 0.02, 0.1]} name="aviator_glasses">
      <mesh
        position={[-0.038, 0, 0.01]}
        scale={[1.15, 0.85, 1]}
        geometry={getSharedTorusGeometry(0.022, 0.0025, 6, 14)}
        material={frameMat}
      />
      <mesh
        position={[-0.038, 0, 0.01]}
        scale={[1.05, 0.75, 0.4]}
        geometry={getSharedCylinderGeometry(0.02, 0.02, 0.004, 12)}
        material={lensMat}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        position={[0.038, 0, 0.01]}
        scale={[1.15, 0.85, 1]}
        geometry={getSharedTorusGeometry(0.022, 0.0025, 6, 14)}
        material={frameMat}
      />
      <mesh
        position={[0.038, 0, 0.01]}
        scale={[1.05, 0.75, 0.4]}
        geometry={getSharedCylinderGeometry(0.02, 0.02, 0.004, 12)}
        material={lensMat}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh position={[0, 0.005, 0.012]} geometry={getSharedBoxGeometry(0.024, 0.004, 0.006)} material={frameMat} />
      <mesh
        position={[-0.06, 0.002, -0.03]}
        rotation={[0, 0.35, 0]}
        geometry={getSharedBoxGeometry(0.055, 0.003, 0.004)}
        material={frameMat}
      />
      <mesh
        position={[0.06, 0.002, -0.03]}
        rotation={[0, -0.35, 0]}
        geometry={getSharedBoxGeometry(0.055, 0.003, 0.004)}
        material={frameMat}
      />
    </group>
  );
}
