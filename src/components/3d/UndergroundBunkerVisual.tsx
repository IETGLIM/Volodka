/* ─── Underground Bunker: resistance hideout ───
 * Green terminal glow, sandbags, radio desk — not factory basement.
 * Basement GLB is backdrop_dressing only; procedural envelope owns walkable space.
 */

import { useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import {
  getSharedBoxGeometry,
  getSharedCircleGeometry,
  getSharedCylinderGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { getSharedStandardMaterial } from '@/engine/three/moduleMaterialRegistry';
import {
  allowsSelectiveMeshPhysicalWet,
  getIndustrialDampFloorSettings,
  getWetGlassPhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { SceneBackdropShell } from './SceneBackdropShell';

interface UndergroundBunkerVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 18;
const D = 16;
const H = 3.6;

const matWall = getSharedStandardMaterial({ color: '#1a221c', roughness: 0.9 });
const matCeil = getSharedStandardMaterial({ color: '#121816', roughness: 0.95 });
const matSandbag = getSharedStandardMaterial({ color: '#5a6a48', roughness: 0.95 });
const matMetal = getSharedStandardMaterial({ color: '#2a3230', metalness: 0.55, roughness: 0.4 });
const matTerminal = getSharedStandardMaterial({
  color: '#001a10',
  emissive: '#44ff88',
  emissiveIntensity: 1.5,
});
const matWarn = getSharedStandardMaterial({
  color: '#220800',
  emissive: '#ff5544',
  emissiveIntensity: 1.1,
});
const matCrate = getSharedStandardMaterial({ color: '#3a3428', roughness: 0.85 });
const matPipe = getSharedStandardMaterial({ color: '#2a3834', metalness: 0.5, roughness: 0.42 });
const matRadio = getSharedStandardMaterial({
  color: '#1a2018',
  emissive: '#88ffaa',
  emissiveIntensity: 0.7,
});

export function UndergroundBunkerVisual(_props: UndergroundBunkerVisualProps) {
  // Keep sandbags/crates always — prop dressing is sparse overlay, not a replacement.
  const { selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const usePhysicalCrt = allowsSelectiveMeshPhysicalWet('underground_bunker', selectedPreset, {
    coarsePointer,
  });
  const crtGlass = useMemo(() => getWetGlassPhysicalParams('crtTerminalGlass'), []);
  const rootRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Mesh>(null);
  const radioRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const damp = useMemo(() => getIndustrialDampFloorSettings('underground_bunker'), []);
  const floorRoughness = damp?.roughness ?? 0.88;
  const floorMetalness = damp?.metalness ?? 0.08;

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const flicker = 1.2 + Math.sin(tRef.current * 7.5) * 0.15 + Math.sin(tRef.current * 19) * 0.08;
      if (screenRef.current) {
        (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flicker;
      }
      if (radioRef.current) {
        (radioRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.55 + Math.sin(tRef.current * 3.4) * 0.25;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      <SceneBackdropShell sceneId="underground_bunker" />

      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        {/* WS22-C: PBR upgrade — clearcoat 0.45→0.2, roughness 0.4→0.6 for damp concrete */}
        <meshPhysicalMaterial
          color="#1c2220"
          roughness={floorRoughness}
          metalness={floorMetalness}
          clearcoat={0.2}
          clearcoatRoughness={0.6}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />
      {[
        { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.2] as [number, number, number] },
        { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.2] as [number, number, number] },
        { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.2, H, D] as [number, number, number] },
        { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.2, H, D] as [number, number, number] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
      ))}

      {damp && (
        <mesh rotation-x={-Math.PI / 2} position={[2.5, 0.008, 1]} geometry={getSharedCircleGeometry(1.8, 18)}>
          <meshStandardMaterial
            color="#1a2820"
            metalness={damp.oilMetalness}
            roughness={damp.oilRoughness}
            transparent
            opacity={0.38}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}

      {[
        [-4, -3],
        [-2.5, -3.4],
        [3.5, -2.8],
        [5, -3.2],
        [-5.2, -1.2],
        [4.8, 0.5],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} castShadow geometry={getSharedBoxGeometry(1.4, 0.7, 0.55)} material={matSandbag} />
      ))}

      <mesh position={[-5.5, 0.45, 2]} castShadow geometry={getSharedBoxGeometry(1.3, 0.9, 0.9)} material={matMetal} />
      <mesh position={[5.2, 0.45, 1.5]} castShadow geometry={getSharedBoxGeometry(1.1, 0.9, 1.0)} material={matMetal} />
      <mesh position={[-3.2, 0.4, 3.5]} castShadow geometry={getSharedBoxGeometry(0.8, 0.8, 0.7)} material={matCrate} />
      <mesh position={[-2.3, 0.35, 3.7]} castShadow geometry={getSharedBoxGeometry(0.65, 0.7, 0.55)} material={matCrate} />
      <mesh position={[3.0, 0.35, 4.0]} castShadow geometry={getSharedBoxGeometry(1.0, 0.7, 0.5)} material={matCrate} />

      <mesh position={[-2, 3.1, 0]} geometry={getSharedBoxGeometry(6, 0.08, 0.1)} material={matPipe} />
      <mesh position={[3, 3.1, -2]} geometry={getSharedBoxGeometry(0.1, 0.08, 5)} material={matPipe} />
      <mesh position={[0, 2.9, 4]} geometry={getSharedCylinderGeometry(0.15, 0.15, 0.4, 8)} material={matPipe} />

      <mesh position={[0, 0.55, -4.5]} castShadow geometry={getSharedBoxGeometry(2.4, 0.12, 1.0)} material={matMetal} />
      <mesh position={[-0.7, 0.28, -4.5]} geometry={getSharedBoxGeometry(0.12, 0.55, 0.9)} material={matMetal} />
      <mesh position={[0.7, 0.28, -4.5]} geometry={getSharedBoxGeometry(0.12, 0.55, 0.9)} material={matMetal} />
      {usePhysicalCrt ? (
        <mesh ref={screenRef} position={[0, 1.15, -4.85]} geometry={getSharedBoxGeometry(1.1, 0.7, 0.06)}>
          <meshPhysicalMaterial
            color="#001a10"
            emissive="#44ff88"
            emissiveIntensity={1.5}
            roughness={crtGlass.roughness}
            metalness={crtGlass.metalness}
            transmission={crtGlass.transmission}
            thickness={crtGlass.thickness}
            clearcoat={crtGlass.clearcoat}
            clearcoatRoughness={crtGlass.clearcoatRoughness}
            transparent
            opacity={crtGlass.opacity}
          />
        </mesh>
      ) : (
        <mesh ref={screenRef} position={[0, 1.15, -4.85]} geometry={getSharedBoxGeometry(1.1, 0.7, 0.06)} material={matTerminal} />
      )}
      <mesh position={[1.0, 0.85, -4.5]} geometry={getSharedCylinderGeometry(0.12, 0.12, 0.35, 10)} material={matWarn} />
      <mesh
        ref={radioRef}
        position={[-0.85, 0.85, -4.35]}
        geometry={getSharedBoxGeometry(0.45, 0.28, 0.22)}
        material={matRadio}
      />

      <mesh position={[-6.5, 1.8, -2]} geometry={getSharedBoxGeometry(0.08, 1.2, 0.08)} material={matWarn} />
      <mesh position={[6.5, 1.8, 2]} geometry={getSharedBoxGeometry(0.08, 1.2, 0.08)} material={matWarn} />

      <pointLight position={[0, 2.4, -4]} intensity={1.7} color="#44ff88" distance={12} />
      <pointLight position={[-4, 2.2, 2]} intensity={0.75} color="#ff5544" distance={9} />
      <pointLight position={[3.5, 2.0, 3]} intensity={0.5} color="#6688aa" distance={8} />
      <pointLight position={[-3, 1.8, 3.5]} intensity={0.4} color="#88aa77" distance={7} />
    </group>
  );
}
