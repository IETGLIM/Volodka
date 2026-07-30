/* ─── Guild Mainframe: server rack vault under the IT guild ───
 * Dedicated cyber aesthetic — pulsing teal racks, cable trays, and a central
 * core column. Office GLB shell + prop dressing replace procedural rack clutter.
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
import { getIndustrialDampFloorSettings } from '@/engine/graphics/wetStreetScenes';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { INTERIOR_SHELL_MODELS } from '@/config/interiorShellModels';
import { getInteriorShellScale } from '@/config/interiorShellScale';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';

interface GuildMainframeVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

const W = 16;
const D = 14;
const H = 3.4;

const matCeil = getSharedStandardMaterial({ color: '#0e1418', roughness: 0.9 });
const matWall = getSharedStandardMaterial({ color: '#141a20', roughness: 0.85 });
const matRack = getSharedStandardMaterial({ color: '#1c242c', metalness: 0.55, roughness: 0.35 });
const matPanel = getSharedStandardMaterial({
  color: '#001a18',
  emissive: '#00ffaa',
  emissiveIntensity: 0.55,
});
const matCable = getSharedStandardMaterial({ color: '#2a3040', metalness: 0.4, roughness: 0.5 });
const matCore = getSharedStandardMaterial({
  color: '#002218',
  emissive: '#00ff88',
  emissiveIntensity: 1.4,
});
const matAccent = getSharedStandardMaterial({
  color: '#001133',
  emissive: '#4488ff',
  emissiveIntensity: 0.9,
});
const matTile = getSharedStandardMaterial({
  color: '#222a32',
  metalness: 0.5,
  roughness: 0.4,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});
const matConsole = getSharedStandardMaterial({ color: '#1a2228', metalness: 0.45, roughness: 0.4 });
const matVent = getSharedStandardMaterial({ color: '#2a3038', metalness: 0.6, roughness: 0.35 });

export function GuildMainframeVisual(_props: GuildMainframeVisualProps) {
  const { preset } = useGraphicsQuality();
  const useAuthoredShell = !preset.visualLite;
  const useGltfDressing = allowsGlbAssetRendering(preset.environmentRenderMode);
  const hideProceduralClutter = useAuthoredShell && useGltfDressing;
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);
  const damp = useMemo(() => getIndustrialDampFloorSettings('guild_mainframe'), []);
  const floorRoughness = damp?.roughness ?? 0.55;
  const floorMetalness = damp?.metalness ?? 0.35;
  const shellScale = useMemo(
    () => getInteriorShellScale('office', [W, H, D]),
    [],
  );

  const racks = useMemo(() => {
    const rows: { x: number; z: number }[] = [];
    for (const x of [-5.2, -2.6, 2.6, 5.2]) {
      for (const z of [-4, -1.2, 1.6]) rows.push({ x, z });
    }
    return rows;
  }, []);

  useFrameTick(
    'misc',
    ({ delta }) => {
      tRef.current += delta;
      const pulse = 0.85 + Math.sin(tRef.current * 2.1) * 0.35;
      if (coreRef.current) {
        (coreRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 * pulse;
      }
    },
    { visibilityRef: rootRef },
  );

  return (
    <group ref={rootRef}>
      {useAuthoredShell ? (
        <AuthoredInteriorShell
          sceneId="guild_mainframe"
          url={INTERIOR_SHELL_MODELS.office}
          scale={shellScale}
          castShadow={preset.shadows}
        />
      ) : (
        <>
          <mesh position={[0, H, 0]} rotation-x={Math.PI / 2} geometry={getSharedPlaneGeometry(W, D)} material={matCeil} />
          {[
            { pos: [0, H / 2, -D / 2] as [number, number, number], size: [W, H, 0.18] as [number, number, number] },
            { pos: [0, H / 2, D / 2] as [number, number, number], size: [W, H, 0.18] as [number, number, number] },
            { pos: [-W / 2, H / 2, 0] as [number, number, number], size: [0.18, H, D] as [number, number, number] },
            { pos: [W / 2, H / 2, 0] as [number, number, number], size: [0.18, H, D] as [number, number, number] },
          ].map((w, i) => (
            <mesh key={i} position={w.pos} geometry={getSharedBoxGeometry(w.size[0], w.size[1], w.size[2])} material={matWall} castShadow receiveShadow />
          ))}
        </>
      )}

      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001} geometry={getSharedPlaneGeometry(W, D)}>
        <meshStandardMaterial
          color="#1a2228"
          roughness={floorRoughness}
          metalness={floorMetalness}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {damp && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, -4.2]} geometry={getSharedCircleGeometry(1.6, 20)}>
          <meshStandardMaterial
            color="#0a1814"
            metalness={damp.oilMetalness}
            roughness={damp.oilRoughness}
            transparent
            opacity={0.42}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}

      {!hideProceduralClutter ? (
        <>
          {[-4, -1.5, 1.5, 4].flatMap((x) =>
            [-3, 0, 3].map((z) => (
              <mesh
                key={`tile-${x}-${z}`}
                position={[x, 0.02, z]}
                rotation-x={-Math.PI / 2}
                geometry={getSharedPlaneGeometry(1.8, 1.8)}
                material={matTile}
              />
            )),
          )}

          {racks.map((r, i) => (
            <group key={i} position={[r.x, 0, r.z]}>
              <mesh position={[0, 1.15, 0]} castShadow geometry={getSharedBoxGeometry(0.9, 2.3, 0.55)} material={matRack} />
              {[0.45, 0.85, 1.25, 1.65].map((y) => (
                <mesh
                  key={y}
                  position={[0.42, y, 0]}
                  geometry={getSharedBoxGeometry(0.04, 0.18, 0.42)}
                  material={i % 2 === 0 ? matPanel : matAccent}
                />
              ))}
              <mesh position={[0, 2.35, 0]} geometry={getSharedBoxGeometry(0.85, 0.06, 0.5)} material={matVent} />
            </group>
          ))}

          <mesh position={[0, 2.85, 0]} geometry={getSharedBoxGeometry(12, 0.08, 0.35)} material={matCable} />
          <mesh position={[0, 2.85, -2.5]} geometry={getSharedBoxGeometry(10, 0.08, 0.28)} material={matCable} />
          <mesh position={[-5.2, 2.85, 0]} geometry={getSharedBoxGeometry(0.2, 0.08, 8)} material={matCable} />
          <mesh position={[5.2, 2.85, 0]} geometry={getSharedBoxGeometry(0.2, 0.08, 8)} material={matCable} />

          <mesh position={[-1.4, 0.55, 3.2]} castShadow geometry={getSharedBoxGeometry(1.6, 1.1, 0.7)} material={matConsole} />
          <mesh position={[-1.4, 1.2, 3.45]} geometry={getSharedBoxGeometry(1.1, 0.45, 0.05)} material={matAccent} />
          <mesh position={[1.6, 0.45, 3.0]} castShadow geometry={getSharedBoxGeometry(0.9, 0.9, 0.6)} material={matRack} />
        </>
      ) : null}

      <mesh ref={coreRef} position={[0, 1.4, -5.2]} castShadow geometry={getSharedCylinderGeometry(0.55, 0.55, 2.6, 16)} material={matCore} />
      <mesh position={[0, 2.85, -5.2]} geometry={getSharedCylinderGeometry(0.75, 0.75, 0.12, 16)} material={matAccent} />
      <mesh position={[0, 0.08, -5.2]} geometry={getSharedCylinderGeometry(1.1, 1.1, 0.1, 16)} material={matVent} />

      <pointLight position={[0, 2.4, -5]} intensity={1.8} color="#00ffaa" distance={14} />
      <pointLight position={[-4, 2.2, 1]} intensity={0.7} color="#4488ff" distance={10} />
      <pointLight position={[4, 2.2, 1]} intensity={0.7} color="#4488ff" distance={10} />
      <pointLight position={[-1.4, 1.5, 3.2]} intensity={0.55} color="#66aaff" distance={6} />
    </group>
  );
}
